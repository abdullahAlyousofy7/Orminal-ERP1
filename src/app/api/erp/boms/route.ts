import { db } from '@/lib/db'
import { ok, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const baseWhere: any = {}
    if (q) {
      baseWhere.OR = [{ code: { contains: q } }, { nameAr: { contains: q } }, { nameEn: { contains: q } }]
    }
    const where = scopedWhere(auth, baseWhere)

    const [data, total] = await Promise.all([
      db.bom.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
          components: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
      }),
      db.bom.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.productId) return badRequest('المنتج مطلوب')

    // Verify product belongs to company
    const fkCheck = await verifyTenantForeignKeys(auth, { productId: body.productId })
    if (!fkCheck.valid) return fkCheck.error!

    // Verify component products if provided
    if (body.components && Array.isArray(body.components) && body.components.length > 0) {
      const compProductIds = body.components.map((c: any) => c.productId).filter(Boolean)
      const compFkCheck = await verifyTenantForeignKeys(auth, { productIds: compProductIds })
      if (!compFkCheck.valid) return compFkCheck.error!
    }

    const code = await nextNumber('bom', auth.companyId)
    const created = await db.bom.create({
      data: {
        companyId: auth.companyId,
        code,
        nameAr: body.nameAr || 'قائمة تركيب',
        nameEn: body.nameEn,
        productId: body.productId,
        quantity: Number(body.quantity) || 1,
        version: body.version || 1,
        status: body.status || 'draft',
        active: true,
        components: body.components
          ? {
              create: body.components.map((c: any) => ({
                productId: c.productId,
                quantity: Number(c.quantity),
                scrapPercent: Number(c.scrapPercent) || 0,
              })),
            }
          : undefined,
      },
      include: { components: true },
    })
    return ok(created)
  } catch (e: any) {
    return serverError(e.message)
  }
}
