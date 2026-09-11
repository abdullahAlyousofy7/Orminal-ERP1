import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/stock-takes
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const baseWhere: any = {}
    if (q) {
      baseWhere.OR = [
        { code: { contains: q } },
        { reason: { contains: q } },
        { warehouse: { nameAr: { contains: q } } },
        { warehouse: { nameEn: { contains: q } } },
      ]
    }
    if (status && status !== 'all') {
      baseWhere.status = status
    }

    const where = scopedWhere(auth, baseWhere)

    const [data, total] = await Promise.all([
      db.inventoryAdjustment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          warehouse: { select: { id: true, nameAr: true, nameEn: true, code: true } },
          lines: {
            include: {
              product: { select: { id: true, sku: true, nameAr: true, nameEn: true, barcode: true, costPrice: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.inventoryAdjustment.count({ where }),
    ])

    const mapped = data.map((st: any) => {
      const items = (st.lines || []).map((l: any) => ({
        productId: l.productId,
        productName: l.product?.nameAr,
        productNameEn: l.product?.nameEn,
        sku: l.product?.sku,
        barcode: l.product?.barcode,
        systemQty: l.systemQty,
        countedQty: l.countedQty,
        diff: l.variance,
        unitCost: l.unitCost,
        varianceValue: l.variance * l.unitCost,
      }))
      return {
        ...st,
        storehouseId: st.warehouseId,
        storehouse: st.warehouse ? { id: st.warehouse.id, name: st.warehouse.nameAr, nameAr: st.warehouse.nameAr, nameEn: st.warehouse.nameEn, code: st.warehouse.code } : null,
        itemsJson: JSON.stringify(items),
        items,
      }
    })

    return list(mapped, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/stock-takes
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const warehouseId = body.warehouseId || body.storehouseId
    if (!warehouseId) return badRequest('المستودع مطلوب')

    const fkCheck = await verifyTenantForeignKeys(auth, { warehouseId })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('inventory_adjustment', auth.companyId)

    let linesData: Array<{ productId: string; systemQty: number; countedQty: number; variance: number; unitCost: number }> = []

    if (body.items && Array.isArray(body.items) && body.items.length > 0) {
      const itemProductIds = body.items.map((it: any) => it.productId).filter(Boolean)
      const pCheck = await verifyTenantForeignKeys(auth, { productIds: itemProductIds })
      if (!pCheck.valid && pCheck.error) return pCheck.error

      linesData = body.items.map((it: any) => {
        const sysQty = Number(it.systemQty ?? 0)
        const countQty = Number(it.countedQty ?? sysQty)
        const varQty = countQty - sysQty
        const cost = Number(it.unitCost ?? 0)
        return {
          productId: it.productId,
          systemQty: sysQty,
          countedQty: countQty,
          variance: varQty,
          unitCost: cost,
        }
      })
    } else {
      // Build snapshot strictly from current company's products
      const productWhere: any = { companyId: auth.companyId, active: true }
      if (body.countType === 'category' && body.categoryId) {
        productWhere.categoryId = body.categoryId
      }

      const products = await db.product.findMany({
        where: productWhere,
        include: {
          stockQuants: { where: { warehouseId } },
        },
      })

      linesData = products.map((p) => {
        const quant = p.stockQuants[0]
        const sysQty = quant ? quant.quantity : 0
        return {
          productId: p.id,
          systemQty: sysQty,
          countedQty: sysQty,
          variance: 0,
          unitCost: p.costPrice || 0,
        }
      })
    }

    const initialStatus = body.status ?? 'draft'

    const adj = await db.inventoryAdjustment.create({
      data: {
        companyId: auth.companyId,
        code,
        warehouseId,
        adjustmentDate: body.countAsOf ? new Date(body.countAsOf) : new Date(),
        reason: body.notes || body.reason || (body.countType === 'category' ? 'جرد مخزني حسب الفئة' : 'جرد مخزني شامل'),
        status: initialStatus,
        lines: {
          create: linesData,
        },
      },
      include: {
        warehouse: true,
        lines: { include: { product: true } },
      },
    })

    return created(adj)
  } catch (e: any) {
    return serverError(e.message)
  }
}
