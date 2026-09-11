import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure, verifyTenantForeignKeys } from '@/lib/erp/rbac'

// GET /api/erp/products/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthContext(_req, { module: 'INV', action: 'PRODUCTS', capability: 'canRead' })
  if (isAuthFailure(auth)) return auth

  try {
    const { id } = await params
    const item = await db.product.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        category: true,
        uom: true,
        taxCode: true,
        valuationAccount: true,
        cogsAccount: true,
        revenueAccount: true,
        stockQuants: { include: { warehouse: { select: { id: true, nameAr: true, code: true } } } },
      },
    })
    if (!item) return notFound('Product not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// PUT /api/erp/products/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthContext(req, { module: 'INV', action: 'PRODUCTS', capability: 'canUpdate' })
  if (isAuthFailure(auth)) return auth

  try {
    const { id } = await params
    const body = await req.json()
    const exists = await db.product.findFirst({ where: { id, companyId: auth.companyId } })
    if (!exists) return notFound('Product not found')

    if (body.categoryId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { categoryId: body.categoryId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const { id: _id, companyId: _c, createdAt: _ca, updatedAt: _ua, ...rest } = body
    const updated = await db.product.update({ where: { id }, data: rest })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// DELETE /api/erp/products/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuthContext(_req, { module: 'INV', action: 'PRODUCTS', capability: 'canDelete' })
  if (isAuthFailure(auth)) return auth

  try {
    const { id } = await params
    const exists = await db.product.findFirst({ where: { id, companyId: auth.companyId } })
    if (!exists) return notFound('Product not found')

    const txCount = await db.salesOrderLine.count({ where: { productId: id } })
    if (txCount > 0) {
      const updated = await db.product.update({ where: { id }, data: { active: false } })
      return ok({ success: true, softDeleted: true, product: updated })
    }
    await db.product.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}

