import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure, scopedWhere, sanitizeTenantPayload, verifyTenantForeignKeys } from '@/lib/erp/rbac'

// GET /api/erp/products
export async function GET(req: Request) {
  const auth = await requireAuthContext(req, { module: 'INV', action: 'PRODUCTS', capability: 'canRead' })
  if (isAuthFailure(auth)) return auth

  try {
    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const categoryId = url.searchParams.get('categoryId')
    const type = url.searchParams.get('type')
    const active = url.searchParams.get('active')

    const where: any = scopedWhere(auth)
    if (q) {
      where.AND = [
        {
          OR: [
            { sku: { contains: q } },
            { barcode: { contains: q } },
            { nameAr: { contains: q } },
            { nameEn: { contains: q } },
          ],
        },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (type) where.type = type
    if (active === 'true') where.active = true
    if (active === 'false') where.active = false

    const warehouseId = url.searchParams.get('warehouseId') || url.searchParams.get('storehouseId')

    const [data, total] = await Promise.all([
      db.product.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          category: { select: { id: true, nameAr: true, code: true } },
          uom: { select: { id: true, nameAr: true, code: true } },
          taxCode: { select: { id: true, code: true, rate: true } },
          valuationAccount: { select: { id: true, code: true, nameAr: true } },
          cogsAccount: { select: { id: true, code: true, nameAr: true } },
          revenueAccount: { select: { id: true, code: true, nameAr: true } },
          stockQuants: { select: { warehouseId: true, quantity: true, reservedQty: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.product.count({ where }),
    ])

    const enriched = data.map((p: any) => {
      const totalStock = p.stockQuants?.reduce((sum: number, q: any) => sum + (q.quantity || 0), 0) ?? 0
      const totalReserved = p.stockQuants?.reduce((sum: number, q: any) => sum + (q.reservedQty || 0), 0) ?? 0

      const whQuants = warehouseId ? p.stockQuants?.filter((q: any) => q.warehouseId === warehouseId) : p.stockQuants
      const whStock = whQuants?.reduce((sum: number, q: any) => sum + (q.quantity || 0), 0) ?? 0
      const whReserved = whQuants?.reduce((sum: number, q: any) => sum + (q.reservedQty || 0), 0) ?? 0

      return {
        ...p,
        stock: totalStock,
        availableStock: totalStock - totalReserved,
        warehouseStock: whStock,
        warehouseAvailableStock: whStock - whReserved,
      }
    })

    return list(enriched, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/products
export async function POST(req: Request) {
  const auth = await requireAuthContext(req, { module: 'INV', action: 'PRODUCTS', capability: 'canCreate' })
  if (isAuthFailure(auth)) return auth

  try {
    const body = await req.json()
    if (!body.nameAr) return badRequest('nameAr is required')

    // Constraint 4: Verify Cross-Tenant FKs
    const fkCheck = await verifyTenantForeignKeys(auth, {
      categoryId: body.categoryId,
    })
    if (!fkCheck.valid) return fkCheck.error!

    let sku = body.sku
    if (!sku) {
      const count = await db.product.count({ where: { companyId: auth.companyId } })
      sku = `SKU-${String(count + 1).padStart(5, '0')}`
    }

    const payload = sanitizeTenantPayload(body, auth)

    const product = await db.product.create({
      data: {
        sku,
        barcode: payload.barcode,
        nameAr: payload.nameAr,
        nameEn: payload.nameEn,
        description: payload.description,
        companyId: auth.companyId,
        categoryId: payload.categoryId,
        uomId: payload.uomId,
        type: payload.type ?? 'product',
        tracking: payload.tracking ?? 'none',
        costPrice: payload.costPrice ?? 0,
        salePrice: payload.salePrice ?? 0,
        costingMethod: payload.costingMethod ?? 'fifo',
        taxCodeId: payload.taxCodeId,
        minStock: payload.minStock ?? 0,
        maxStock: payload.maxStock ?? 0,
        reorderPoint: payload.reorderPoint ?? 0,
        valuationAccountId: payload.valuationAccountId,
        cogsAccountId: payload.cogsAccountId,
        revenueAccountId: payload.revenueAccountId,
        image: payload.image,
        active: payload.active ?? true,
      },
    })
    return created(product)
  } catch (e: any) {
    return serverError(e.message)
  }
}

