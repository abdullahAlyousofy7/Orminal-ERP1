import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/partners/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'partners', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.partner.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        country: true,
        paymentTerm: true,
        receivableAccount: true,
        payableAccount: true,
        contacts: true,
        addresses: true,
        bankAccounts: true,
      },
    })
    if (!item) return notFound('Partner not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// PUT /api/erp/partners/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'partners', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.partner.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Partner not found')

    const body = await req.json()
    const { id: _id, companyId: _cId, createdAt: _c, updatedAt: _u, ...rest } = body

    if (rest.receivableAccountId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { accountId: rest.receivableAccountId })
      if (!fkCheck.valid) return fkCheck.error!
    }
    if (rest.payableAccountId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { accountId: rest.payableAccountId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const updated = await db.partner.update({
      where: { id },
      data: rest,
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// DELETE /api/erp/partners/[id] — soft delete
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'partners', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.partner.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Partner not found')

    const txCount = await db.salesOrder.count({ where: { partnerId: id, companyId: auth.companyId } })
    if (txCount > 0) {
      const updated = await db.partner.update({ where: { id }, data: { active: false } })
      return ok({ success: true, softDeleted: true, partner: updated })
    }
    await db.partner.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
