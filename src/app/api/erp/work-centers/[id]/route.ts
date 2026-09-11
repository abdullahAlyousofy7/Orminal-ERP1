import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.workCenter.findUnique({ where: { id } })
    if (!item) return notFound('Work center not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.workCenter.findUnique({ where: { id } })
    if (!exists) return notFound('Work center not found')

    const { id: _id, ...rest } = body
    if (rest.capacityPerHour !== undefined) rest.capacityPerHour = Number(rest.capacityPerHour) || 0
    if (rest.costPerHour !== undefined) rest.costPerHour = Number(rest.costPerHour) || 0
    const updated = await db.workCenter.update({ where: { id }, data: rest })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.workCenter.findUnique({ where: { id } })
    if (!exists) return notFound('Work center not found')
    await db.workCenter.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
