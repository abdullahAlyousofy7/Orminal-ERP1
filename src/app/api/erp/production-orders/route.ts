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
    const status = new URL(req.url).searchParams.get('status')
    const baseWhere: any = {}
    if (status) baseWhere.status = status
    if (q) baseWhere.code = { contains: q }

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.productionOrder.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
          bom: { select: { id: true, code: true, nameAr: true } },
        },
      }),
      db.productionOrder.count({ where }),
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
    if (!body.bomId || !body.productId) return badRequest('قائمة التركيب والمنتج مطلوبان')

    // Verify product belongs to company
    const prodCheck = await verifyTenantForeignKeys(auth, { productId: body.productId })
    if (!prodCheck.valid) return prodCheck.error!

    // Verify BOM belongs to company
    const bomExists = await db.bom.findFirst({
      where: { id: body.bomId, companyId: auth.companyId },
    })
    if (!bomExists) return badRequest('قائمة التركيب المحددة غير صالحة لهذه الشركة')

    // Verify branch if provided
    if (body.branchId) {
      const branchCheck = await verifyTenantForeignKeys(auth, { branchId: body.branchId })
      if (!branchCheck.valid) return branchCheck.error!
    }

    const code = await nextNumber('production_order', auth.companyId)
    const created = await db.productionOrder.create({
      data: {
        companyId: auth.companyId,
        branchId: body.branchId || auth.branchId || null,
        code,
        bomId: body.bomId,
        productId: body.productId,
        quantity: Number(body.quantity) || 1,
        plannedStart: body.plannedStart ? new Date(body.plannedStart) : null,
        plannedEnd: body.plannedEnd ? new Date(body.plannedEnd) : null,
        status: body.status || 'draft',
        notes: body.notes,
      },
    })
    return ok(created)
  } catch (e: any) {
    return serverError(e.message)
  }
}
