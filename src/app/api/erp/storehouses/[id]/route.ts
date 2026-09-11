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
      where: { id, branch: { companyId: auth.companyId } },
      include: { branch: true },
    })
    if (!item) return notFound('Storehouse not found')

    const mapped = {
      ...item,
      name: item.nameAr,
    }
    return ok(mapped)
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
    if (!exists) return notFound('Storehouse not found')

    if (body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.branchId })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const { id: _id, createdAt: _c, updatedAt: _u, name, nameAr, ...rest } = body
    const finalNameAr = name || nameAr || exists.nameAr

    const updated = await db.warehouse.update({
      where: { id: exists.id },
      data: {
        ...rest,
        nameAr: finalNameAr,
      },
      include: { branch: true },
    })

    const mapped = {
      ...updated,
      name: updated.nameAr,
    }
    return ok(mapped)
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
    if (!exists) return notFound('Storehouse not found')

    const stockCount = await db.stockQuant.count({ where: { warehouseId: exists.id, quantity: { gt: 0 } } })
    if (stockCount > 0) return badRequest('Cannot delete: storehouse has stock')

    await db.warehouse.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
