import { db } from '@/lib/db'
import { ok, notFound, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()

    const exists = await db.delivery.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('الطلب غير موجود')

    const updated = await db.delivery.update({
      where: { id: exists.id },
      data: { status: body.status || 'approved' },
    })

    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}
