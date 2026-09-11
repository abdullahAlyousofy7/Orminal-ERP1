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

// GET /api/erp/inventory-incoming
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const storehouseId = url.searchParams.get('storehouseId') || url.searchParams.get('warehouseId')

    const baseWhere: any = {}
    if (q) baseWhere.code = { contains: q }
    if (storehouseId && storehouseId !== 'all') baseWhere.warehouseId = storehouseId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.goodsReceipt.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, code: true } },
          warehouse: { select: { id: true, code: true, nameAr: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true, costPrice: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.goodsReceipt.count({ where }),
    ])

    const mapped: any[] = []
    for (const grn of data) {
      if (grn.lines && grn.lines.length > 0) {
        for (const l of grn.lines) {
          mapped.push({
            id: `${grn.id}-${l.id}`,
            productId: l.productId,
            storehouseId: grn.warehouseId,
            type: 'receipt',
            quantity: Number(l.receivedQty || l.orderedQty || 0),
            refType: grn.code,
            note: grn.notes,
            createdAt: grn.createdAt.toISOString(),
            product: {
              id: l.product?.id || l.productId || '',
              name: l.product?.nameAr || 'منتج',
              sku: l.product?.sku || 'SKU',
              costPrice: Number(l.unitCost ?? l.product?.costPrice ?? 0),
            },
            storehouse: {
              id: grn.warehouse?.id || '',
              name: grn.warehouse?.nameAr || 'غير محدد',
              code: grn.warehouse?.code || '',
            },
          })
        }
      }
    }

    return list(mapped, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/inventory-incoming
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const warehouseId = body.warehouseId || body.storehouseId
    const partnerId = body.partnerId || body.supplierId

    if (!warehouseId) return badRequest('المستودع مطلوب')
    if (!body.items || body.items.length === 0) return badRequest('المنتجات مطلوبة')

    const productIds = body.items.map((it: any) => it.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      warehouseId,
      partnerId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    // If partnerId was not provided, look for an active supplier in this company
    let resolvedPartnerId = partnerId
    if (!resolvedPartnerId) {
      const p = await db.partner.findFirst({
        where: { companyId: auth.companyId, isSupplier: true, active: true },
      })
      resolvedPartnerId = p?.id
    }
    if (!resolvedPartnerId) {
      const p = await db.partner.findFirst({
        where: { companyId: auth.companyId, active: true },
      })
      resolvedPartnerId = p?.id
    }
    if (!resolvedPartnerId) return badRequest('لا يوجد مورد أو شريك تجاري مصرح به في هذه الشركة')

    // Get warehouse branch
    const wh = await db.warehouse.findFirst({
      where: { id: warehouseId, branch: { companyId: auth.companyId } },
      select: { branchId: true },
    })

    const code = await nextNumber('goods_receipt', auth.companyId, wh?.branchId)

    const linesData = body.items.map((it: any) => {
      const qty = Number(it.quantity || it.receivedQty || 0)
      const cost = Number(it.cost || it.unitCost || it.costPrice || 0)
      return {
        productId: it.productId,
        orderedQty: qty,
        receivedQty: qty,
        unitCost: cost,
        total: qty * cost,
      }
    })

    const totalAmount = linesData.reduce((s: number, l: any) => s + l.total, 0)
    const status = 'validated'

    const grn = await db.goodsReceipt.create({
      data: {
        companyId: auth.companyId,
        branchId: wh?.branchId,
        code,
        partnerId: resolvedPartnerId,
        warehouseId,
        receiptDate: body.receiptDate ? new Date(body.receiptDate) : new Date(),
        status,
        notes: body.notes || body.note || null,
        createdBy: auth.userId,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: { include: { product: true } },
        warehouse: true,
      },
    })

    // Create StockMoves and update Quants
    await db.$transaction(async (tx) => {
      for (const it of linesData) {
        if (it.receivedQty <= 0) continue

        await tx.stockMove.create({
          data: {
            companyId: auth.companyId,
            documentType: 'goods_receipt',
            documentId: grn.id,
            productId: it.productId,
            destWarehouseId: warehouseId,
            quantity: it.receivedQty,
            costPrice: it.unitCost,
            state: 'done',
            postingDate: new Date(),
          },
        })

        const quant = await tx.stockQuant.findFirst({
          where: { productId: it.productId, warehouseId, locationId: null, lotId: null },
        })
        if (quant) {
          await tx.stockQuant.update({
            where: { id: quant.id },
            data: { quantity: { increment: it.receivedQty } },
          })
        } else {
          await tx.stockQuant.create({
            data: {
              productId: it.productId,
              warehouseId,
              quantity: it.receivedQty,
            },
          })
        }
      }
    })

    if (totalAmount > 0) {
      try {
        const postingLines = goodsReceiptPosting({ amount: totalAmount })
        const je = await postJournalEntry({
          companyId: auth.companyId,
          branchId: wh?.branchId ?? undefined,
          journalType: 'purchase',
          postingDate: grn.receiptDate,
          description: `إذن استلام بضاعة ${code}`,
          refType: 'goods_receipt',
          refId: grn.id,
          lines: postingLines,
          userId: auth.userId,
        })
        await db.goodsReceipt.update({
          where: { id: grn.id },
          data: { journalEntryId: je.id },
        })
      } catch (err: any) {
        console.error('Accounting posting failed for incoming receipt:', err.message)
      }
    }

    return created(grn)
  } catch (e: any) {
    return serverError(e.message)
  }
}
