import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.purchaseRequest.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: { include: { product: true, costCenter: true } } },
    })
    if (!item) return notFound('Purchase request not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.purchaseRequest.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Purchase request not found')
    if (exists.status !== 'draft' && exists.status !== 'submitted')
      return badRequest('Cannot edit approved/rejected request')

    const { id: _id, companyId: _c, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body
    const updated = await db.purchaseRequest.update({
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
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.purchaseRequest.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Purchase request not found')

    const status = (exists.status || '').toLowerCase()
    if (status === 'approved' || status === 'converted') {
      return badRequest('Cannot delete approved or converted purchase requests')
    }

    await db.purchaseRequest.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
