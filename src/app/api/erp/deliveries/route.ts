import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import { postJournalEntry, cogsPosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/deliveries
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const baseWhere: any = {}
    if (q) baseWhere.code = { contains: q }
    if (status) baseWhere.status = status

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.delivery.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, code: true } },
          warehouse: { select: { id: true, code: true, nameAr: true } },
          salesOrder: { select: { id: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.delivery.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST — create. On validate (status=done): create StockMove (out), decrement StockQuant, post cogs journal
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
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
      salesOrderId: body.salesOrderId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('delivery', auth.companyId, requestedBranch)
    const status = body.status ?? 'draft'

    const delivery = await db.delivery.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        salesOrderId: body.salesOrderId,
        partnerId: body.partnerId,
        warehouseId: body.warehouseId,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
        status,
        notes: body.notes,
        createdBy: auth.userId,
        lines: {
          create: body.lines.map((l: any) => ({
            productId: l.productId,
            orderedQty: l.orderedQty ?? 0,
            deliveredQty: l.deliveredQty,
            uomId: l.uomId,
            lotId: l.lotId,
          })),
        },
      },
      include: { lines: { include: { product: true } } },
    })

    // On validate (status=done): create StockMove (out), decrement StockQuant, post cogs journal
    if (status === 'done') {
      let cogsAmount = 0
      try {
        await db.$transaction(async (tx) => {
          for (const l of body.lines) {
            const quant = await tx.stockQuant.findFirst({
              where: { productId: l.productId, warehouseId: body.warehouseId, locationId: null, lotId: null },
            })
            const currentQty = quant?.quantity ?? 0
            if (currentQty < l.deliveredQty) {
              const product = await tx.product.findUnique({ where: { id: l.productId } })
              throw new Error(`الكمية المتوفرة في المخزون غير كافية للمنتج ${product?.nameAr || l.productId} (المتاح: ${currentQty}، المطلوب: ${l.deliveredQty})`)
            }

            const product = await tx.product.findUnique({ where: { id: l.productId } })
            const cost = product?.costPrice ?? 0
            const lineCost = cost * l.deliveredQty
            cogsAmount += lineCost

            await tx.stockMove.create({
              data: {
                companyId: auth.companyId,
                documentType: 'delivery',
                documentId: delivery.id,
                productId: l.productId,
                sourceWarehouseId: body.warehouseId,
                quantity: l.deliveredQty,
                uomId: l.uomId,
                costPrice: cost,
                state: 'done',
                postingDate: new Date(),
              },
            })

            await tx.stockQuant.update({
              where: { id: quant!.id },
              data: { quantity: { decrement: l.deliveredQty } },
            })
          }
        })

        // Post COGS journal entry
        if (cogsAmount > 0) {
          const postingLines = cogsPosting({ amount: cogsAmount })
          const je = await postJournalEntry({
            companyId: auth.companyId,
            branchId: requestedBranch || undefined,
            journalType: 'general',
            postingDate: delivery.deliveryDate,
            description: `تكلفة بضاعة مباعة — سند تسليم ${code}`,
            refType: 'delivery',
            refId: delivery.id,
            lines: postingLines,
            userId: auth.userId,
          })
          await db.delivery.update({
            where: { id: delivery.id },
            data: { journalEntryId: je.id },
          })
        }
      } catch (err: any) {
        return badRequest(err.message)
      }
    }

    const result = await db.delivery.findFirst({
      where: { id: delivery.id, companyId: auth.companyId },
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
