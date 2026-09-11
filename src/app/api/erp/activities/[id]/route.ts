import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'settings', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.activity.findFirst({
      where: {
        id,
        branch: { companyId: auth.companyId, id: { in: auth.authorizedBranchIds } },
      },
      include: { branch: true },
    })
    if (!item) return notFound('Activity not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'settings', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.activity.findFirst({
      where: {
        id,
        branch: { companyId: auth.companyId, id: { in: auth.authorizedBranchIds } },
      },
    })
    if (!exists) return notFound('Activity not found')

    const body = await req.json()
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = body

    if (rest.branchId && !auth.authorizedBranchIds.includes(rest.branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    const updated = await db.activity.update({
      where: { id },
      data: rest,
      include: { branch: true },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'settings', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.activity.findFirst({
      where: {
        id,
        branch: { companyId: auth.companyId, id: { in: auth.authorizedBranchIds } },
      },
    })
    if (!exists) return notFound('Activity not found')

    await db.activity.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
