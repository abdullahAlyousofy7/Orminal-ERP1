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

// GET /api/erp/inventory-outgoing
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
      db.delivery.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, code: true } },
          warehouse: { select: { id: true, code: true, nameAr: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true, salePrice: true, costPrice: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.delivery.count({ where }),
    ])

    const mapped: any[] = []
    for (const del of data) {
      if (del.lines && del.lines.length > 0) {
        for (const l of del.lines) {
          mapped.push({
            id: `${del.id}-${l.id}`,
            productId: l.productId,
            storehouseId: del.warehouseId,
            type: 'delivery',
            quantity: Number(l.deliveredQty || l.orderedQty || 0),
            refType: del.code,
            note: del.notes,
            createdAt: del.createdAt.toISOString(),
            product: {
              id: l.product?.id || l.productId || '',
              name: l.product?.nameAr || 'منتج',
              sku: l.product?.sku || 'SKU',
              salePrice: Number(l.product?.salePrice ?? l.product?.costPrice ?? 0),
            },
            storehouse: {
              id: del.warehouse?.id || '',
              name: del.warehouse?.nameAr || 'غير محدد',
              code: del.warehouse?.code || '',
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

// POST /api/erp/inventory-outgoing
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const warehouseId = body.warehouseId || body.storehouseId
    const partnerId = body.partnerId || body.clientId

    if (!warehouseId) return badRequest('المستودع مطلوب')
    if (!body.items || body.items.length === 0) return badRequest('المنتجات مطلوبة')

    const productIds = body.items.map((it: any) => it.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      warehouseId,
      partnerId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    let resolvedPartnerId = partnerId
    if (!resolvedPartnerId) {
      const p = await db.partner.findFirst({
        where: { companyId: auth.companyId, isCustomer: true, active: true },
      })
      resolvedPartnerId = p?.id
    }
    if (!resolvedPartnerId) {
      const p = await db.partner.findFirst({
        where: { companyId: auth.companyId, active: true },
      })
      resolvedPartnerId = p?.id
    }

    const wh = await db.warehouse.findFirst({
      where: { id: warehouseId, branch: { companyId: auth.companyId } },
      select: { branchId: true },
    })

    const code = await nextNumber('delivery', auth.companyId, wh?.branchId)

    const itemsData = body.items.map((it: any) => ({
      productId: it.productId,
      orderedQty: Number(it.quantity || it.deliveredQty || 0),
      deliveredQty: Number(it.quantity || it.deliveredQty || 0),
    }))

    const status = 'done'

    // First validate stock levels
    for (const it of itemsData) {
      const quant = await db.stockQuant.findFirst({
        where: { productId: it.productId, warehouseId, locationId: null, lotId: null },
      })
      const currentQty = quant?.quantity ?? 0
      if (currentQty < it.deliveredQty) {
        const product = await db.product.findFirst({
          where: { id: it.productId, companyId: auth.companyId },
        })
        return badRequest(`الكمية المتوفرة في المخزون غير كافية للمنتج ${product?.nameAr || it.productId} (المتاح: ${currentQty}، المطلوب: ${it.deliveredQty})`)
      }
    }

    const delivery = await db.delivery.create({
      data: {
        companyId: auth.companyId,
        branchId: wh?.branchId,
        code,
        partnerId: resolvedPartnerId,
        warehouseId,
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : new Date(),
        status,
        notes: body.notes || body.note || null,
        createdBy: auth.userId,
        lines: {
          create: itemsData,
        },
      },
      include: {
        lines: { include: { product: true } },
        warehouse: true,
      },
    })

    let cogsAmount = 0
    await db.$transaction(async (tx) => {
      for (const it of itemsData) {
        const quant = await tx.stockQuant.findFirst({
          where: { productId: it.productId, warehouseId, locationId: null, lotId: null },
        })

        const product = await tx.product.findFirst({
          where: { id: it.productId, companyId: auth.companyId },
        })
        const cost = product?.costPrice ?? 0
        const lineCost = cost * it.deliveredQty
        cogsAmount += lineCost

        await tx.stockMove.create({
          data: {
            companyId: auth.companyId,
            documentType: 'delivery',
            documentId: delivery.id,
            productId: it.productId,
            sourceWarehouseId: warehouseId,
            quantity: it.deliveredQty,
            costPrice: cost,
            state: 'done',
            postingDate: new Date(),
          },
        })

        await tx.stockQuant.update({
          where: { id: quant!.id },
          data: { quantity: { decrement: it.deliveredQty } },
        })
      }
    })

    if (cogsAmount > 0) {
      try {
        const postingLines = cogsPosting({ amount: cogsAmount })
        const je = await postJournalEntry({
          companyId: auth.companyId,
          branchId: wh?.branchId ?? undefined,
          journalType: 'general',
          postingDate: delivery.deliveryDate,
          description: `تكلفة بضاعة مباعة — سند صرف مخزني ${code}`,
          refType: 'delivery',
          refId: delivery.id,
          lines: postingLines,
          userId: auth.userId,
        })
        await db.delivery.update({
          where: { id: delivery.id },
          data: { journalEntryId: je.id },
        })
      } catch (err: any) {
        console.error('Accounting posting failed for outgoing delivery:', err.message)
      }
    }

    return created(delivery)
  } catch (e: any) {
    return serverError(e.message)
  }
}
