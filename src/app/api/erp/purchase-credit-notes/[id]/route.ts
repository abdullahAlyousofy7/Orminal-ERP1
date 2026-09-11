import { db } from '@/lib/db'
import { ok, notFound, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const note = await db.purchaseCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
      include: { partner: true },
    })
    if (!note) return notFound('غير موجود')
    return ok(note)
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
    const existing = await db.purchaseCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!existing) return notFound('غير موجود')

    const updated = await db.purchaseCreditNote.update({
      where: { id: existing.id },
      data: {
        status: body.status ?? existing.status,
        notes: body.notes ?? existing.notes,
        reason: body.reason ?? existing.reason,
      },
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
    const existing = await db.purchaseCreditNote.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!existing) return notFound('غير موجود')

    await db.purchaseCreditNote.delete({ where: { id: existing.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
