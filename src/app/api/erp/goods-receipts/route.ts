import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import { postJournalEntry, goodsReceiptPosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/goods-receipts
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const partnerId = url.searchParams.get('partnerId')

    const baseWhere: any = {}
    if (q) baseWhere.code = { contains: q }
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.goodsReceipt.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, code: true } },
          warehouse: { select: { id: true, code: true, nameAr: true } },
          purchaseOrder: { select: { id: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.goodsReceipt.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST — create; on validate: create StockMove, upsert StockQuant, post goods receipt journal
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('partnerId is required')
    if (!body.warehouseId) return badRequest('warehouseId is required')
    if (!body.lines || body.lines.length === 0) return badRequest('lines are required')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const productIds = body.lines.map((l: any) => l.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      warehouseId: body.warehouseId,
      branchId: requestedBranch,
      purchaseOrderId: body.purchaseOrderId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('goods_receipt', auth.companyId, requestedBranch)

    // Compute total from lines
    const lines = body.lines.map((l: any) => {
      const total = (l.receivedQty || 0) * (l.unitCost || 0)
      return { ...l, total }
    })
    const amount = lines.reduce((s: number, l: any) => s + l.total, 0)
    const status = body.status ?? 'draft'

    const receipt = await db.goodsReceipt.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        purchaseOrderId: body.purchaseOrderId,
        partnerId: body.partnerId,
        warehouseId: body.warehouseId,
        receiptDate: body.receiptDate ? new Date(body.receiptDate) : new Date(),
        status,
        notes: body.notes,
        createdBy: auth.userId,
        lines: {
          create: lines.map((l: any) => ({
            productId: l.productId,
            orderedQty: l.orderedQty ?? 0,
            receivedQty: l.receivedQty,
            rejectedQty: l.rejectedQty ?? 0,
            uomId: l.uomId,
            unitCost: l.unitCost ?? 0,
            total: l.total,
            lotNumber: l.lotNumber,
            notes: l.notes,
          })),
        },
      },
      include: { lines: { include: { product: true } } },
    })

    // On validate (status=validated or status=posted): create StockMove, upsert StockQuant, post goods receipt journal
    if (status === 'validated' || status === 'posted') {
      await db.$transaction(async (tx) => {
        for (const l of lines) {
          if ((l.receivedQty || 0) <= 0) continue

          await tx.stockMove.create({
            data: {
              companyId: auth.companyId,
              documentType: 'goods_receipt',
              documentId: receipt.id,
              productId: l.productId,
              destWarehouseId: body.warehouseId,
              quantity: l.receivedQty,
              uomId: l.uomId,
              costPrice: l.unitCost ?? 0,
              state: 'done',
              postingDate: new Date(),
            },
          })

          const quant = await tx.stockQuant.findFirst({
            where: { productId: l.productId, warehouseId: body.warehouseId, locationId: null, lotId: null },
          })
          if (quant) {
            await tx.stockQuant.update({
              where: { id: quant.id },
              data: { quantity: { increment: l.receivedQty } },
            })
          } else {
            await tx.stockQuant.create({
              data: {
                productId: l.productId,
                warehouseId: body.warehouseId,
                quantity: l.receivedQty,
              },
            })
          }
        }
      })

      // Post goods receipt journal
      if (amount > 0) {
        try {
          const postingLines = goodsReceiptPosting({ amount })
          const je = await postJournalEntry({
            companyId: auth.companyId,
            branchId: requestedBranch || undefined,
            journalType: 'purchase',
            postingDate: receipt.receiptDate,
            description: `إذن استلام بضاعة ${code}`,
            refType: 'goods_receipt',
            refId: receipt.id,
            lines: postingLines,
            userId: auth.userId,
          })
          await db.goodsReceipt.update({
            where: { id: receipt.id },
            data: { journalEntryId: je.id },
          })
        } catch (err: any) {
          console.error('Accounting posting failed for goods receipt:', err.message)
        }
      }
    }

    const result = await db.goodsReceipt.findFirst({
      where: { id: receipt.id, companyId: auth.companyId },
      include: {
        partner: true,
        warehouse: true,
        lines: { include: { product: true } },
      },
    })
    return created(result)
  } catch (e: any) {
    return serverError(e.message)
  }
}
