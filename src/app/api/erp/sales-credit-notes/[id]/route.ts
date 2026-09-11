import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.salesCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
      include: { partner: true },
    })
    if (!item) return notFound('Credit note not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.salesCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Credit note not found')
    if (exists.status !== 'draft') return badRequest('Only draft credit notes can be edited')

    const { id: _id, companyId: _c, createdAt: _ca, updatedAt: _ua, ...rest } = body
    const updated = await db.salesCreditNote.update({
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
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.salesCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Credit note not found')
    if (exists.status !== 'draft') return badRequest('Only draft credit notes can be deleted')

    await db.salesCreditNote.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
