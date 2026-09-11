import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/inventory-transfers
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

    const where = scopedWhere(auth, baseWhere)

    const [data, total] = await Promise.all([
      db.stockTransfer.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          fromWarehouse: { select: { id: true, nameAr: true, code: true } },
          toWarehouse: { select: { id: true, nameAr: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.stockTransfer.count({ where }),
    ])

    const mapped = data.map((st: any) => ({
      ...st,
      fromStorehouse: st.fromWarehouse ? { id: st.fromWarehouse.id, name: st.fromWarehouse.nameAr, code: st.fromWarehouse.code } : null,
      toStorehouse: st.toWarehouse ? { id: st.toWarehouse.id, name: st.toWarehouse.nameAr, code: st.toWarehouse.code } : null,
      itemsJson: JSON.stringify(st.lines.map((l: any) => ({
        productId: l.productId,
        quantity: l.quantity,
        doneQty: l.doneQty,
        productName: l.product?.nameAr,
      }))),
    }))

    return list(mapped, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/inventory-transfers
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const fromWarehouseId = body.fromWarehouseId || body.fromStorehouseId
    const toWarehouseId = body.toWarehouseId || body.toStorehouseId

    if (!fromWarehouseId) return badRequest('المستودع المصدر مطلوب')
    if (!toWarehouseId) return badRequest('المستودع الوجهة مطلوب')
    if (fromWarehouseId === toWarehouseId) return badRequest('لا يمكن التحويل لنفس المستودع')
    if (!body.items || body.items.length === 0) return badRequest('المنتجات مطلوبة')

    const productIds = body.items.map((it: any) => it.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      sourceWarehouseId: fromWarehouseId,
      destWarehouseId: toWarehouseId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('stock_transfer', auth.companyId)

    const linesData = body.items.map((it: any) => ({
      productId: it.productId,
      quantity: Number(it.quantity || 0),
      doneQty: Number(it.quantity || 0),
    }))

    // Validate available stock at source warehouse
    for (const it of linesData) {
      const quant = await db.stockQuant.findFirst({
        where: { productId: it.productId, warehouseId: fromWarehouseId, locationId: null, lotId: null },
      })
      const currentQty = quant?.quantity ?? 0
      if (currentQty < it.quantity) {
        const product = await db.product.findFirst({
          where: { id: it.productId, companyId: auth.companyId },
        })
        return badRequest(`الرصيد المتاح غير كافٍ للصنف ${product?.nameAr || it.productId} (المتاح: ${currentQty})`)
      }
    }

    const transfer = await db.stockTransfer.create({
      data: {
        companyId: auth.companyId,
        code,
        fromWarehouseId,
        toWarehouseId,
        transferDate: body.transferDate ? new Date(body.transferDate) : new Date(),
        status: 'done',
        notes: body.notes || body.reason || null,
        createdBy: auth.userId,
        lines: {
          create: linesData,
        },
      },
      include: {
        lines: { include: { product: true } },
        fromWarehouse: true,
        toWarehouse: true,
      },
    })

    // Create 2 StockMoves and update StockQuants
    await db.$transaction(async (tx) => {
      for (const it of linesData) {
        await tx.stockMove.create({
          data: {
            companyId: auth.companyId,
            documentType: 'transfer',
            documentId: transfer.id,
            productId: it.productId,
            sourceWarehouseId: fromWarehouseId,
            quantity: it.quantity,
            state: 'done',
            postingDate: new Date(),
          },
        })

        await tx.stockMove.create({
          data: {
            companyId: auth.companyId,
            documentType: 'transfer',
            documentId: transfer.id,
            productId: it.productId,
            destWarehouseId: toWarehouseId,
            quantity: it.quantity,
            state: 'done',
            postingDate: new Date(),
          },
        })

        const srcQuant = await tx.stockQuant.findFirst({
          where: { productId: it.productId, warehouseId: fromWarehouseId, locationId: null, lotId: null },
        })
        if (srcQuant) {
          await tx.stockQuant.update({
            where: { id: srcQuant.id },
            data: { quantity: { decrement: it.quantity } },
          })
        }

        const destQuant = await tx.stockQuant.findFirst({
          where: { productId: it.productId, warehouseId: toWarehouseId, locationId: null, lotId: null },
        })
        if (destQuant) {
          await tx.stockQuant.update({
            where: { id: destQuant.id },
            data: { quantity: { increment: it.quantity } },
          })
        } else {
          await tx.stockQuant.create({
            data: {
              productId: it.productId,
              warehouseId: toWarehouseId,
              quantity: it.quantity,
            },
          })
        }
      }
    })

    return created(transfer)
  } catch (e: any) {
    return serverError(e.message)
  }
}
