import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.warehouse.findFirst({
      where: {
        id,
        branch: { companyId: auth.companyId },
      },
      include: {
        branch: { include: { company: true } },
        locations: true,
        stockQuants: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
      },
    })
    if (!item) return notFound('Warehouse not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.warehouse.findFirst({
      where: { id, branch: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Warehouse not found')

    if (body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.branchId })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = body
    const updated = await db.warehouse.update({
      where: { id: exists.id },
      data: rest,
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.warehouse.findFirst({
      where: { id, branch: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Warehouse not found')

    const stockCount = await db.stockQuant.count({ where: { warehouseId: exists.id, quantity: { gt: 0 } } })
    if (stockCount > 0) return badRequest('Cannot delete: warehouse has stock')

    await db.warehouse.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
