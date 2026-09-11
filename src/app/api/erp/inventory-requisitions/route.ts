import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/inventory-requisitions
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
          warehouse: { select: { id: true, nameAr: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.delivery.count({ where }),
    ])

    const mapped = data.map((reqItem: any) => ({
      id: reqItem.id,
      code: reqItem.code,
      storehouseId: reqItem.warehouseId,
      status: reqItem.status,
      note: reqItem.notes,
      createdAt: reqItem.createdAt.toISOString(),
      updatedAt: reqItem.updatedAt.toISOString(),
      storehouse: reqItem.warehouse ? { id: reqItem.warehouse.id, name: reqItem.warehouse.nameAr, code: reqItem.warehouse.code } : { id: '', name: 'غير محدد', code: '' },
      itemsJson: JSON.stringify(reqItem.lines.map((l: any) => ({
        productId: l.productId,
        quantity: l.orderedQty || l.deliveredQty,
        note: l.product?.nameAr,
      }))),
    }))

    return list(mapped, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/inventory-requisitions
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const warehouseId = body.storehouseId || body.warehouseId
    if (!warehouseId) return badRequest('المستودع مطلوب')
    if (!body.items || body.items.length === 0) return badRequest('المنتجات مطلوبة')

    const productIds = body.items.map((it: any) => it.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      warehouseId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const wh = await db.warehouse.findFirst({
      where: { id: warehouseId, branch: { companyId: auth.companyId } },
      select: { branchId: true },
    })

    const code = await nextNumber('delivery', auth.companyId, wh?.branchId)

    const reqItem = await db.delivery.create({
      data: {
        companyId: auth.companyId,
        branchId: wh?.branchId,
        code,
        warehouseId,
        status: 'draft',
        notes: body.note || body.notes || null,
        createdBy: auth.userId,
        lines: {
          create: body.items.map((it: any) => ({
            productId: it.productId,
            orderedQty: Number(it.quantity || 1),
            deliveredQty: Number(it.quantity || 1),
          })),
        },
      },
      include: { warehouse: true, lines: { include: { product: true } } },
    })

    return created({
      id: reqItem.id,
      code: reqItem.code,
      storehouseId: reqItem.warehouseId,
      status: reqItem.status,
      note: reqItem.notes,
      createdAt: reqItem.createdAt.toISOString(),
      updatedAt: reqItem.updatedAt.toISOString(),
      storehouse: { id: reqItem.warehouse.id, name: reqItem.warehouse.nameAr, code: reqItem.warehouse.code },
      itemsJson: JSON.stringify(reqItem.lines.map((l: any) => ({
        productId: l.productId,
        quantity: l.orderedQty,
        note: l.product?.nameAr,
      }))),
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}
