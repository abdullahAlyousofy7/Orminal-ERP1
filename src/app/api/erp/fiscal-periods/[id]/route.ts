import { db } from '@/lib/db'
import { ok, notFound, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

// PUT /api/erp/fiscal-periods/[id] — close/lock period
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'fiscal_periods', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.fiscalPeriod.findFirst({
      where: { id, fiscalYear: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Period not found')

    const updated = await db.fiscalPeriod.update({
      where: { id },
      data: {
        name: body.name !== undefined ? body.name : exists.name,
        startDate: body.startDate !== undefined ? new Date(body.startDate) : exists.startDate,
        endDate: body.endDate !== undefined ? new Date(body.endDate) : exists.endDate,
        quarter: body.quarter !== undefined ? body.quarter : exists.quarter,
        state: body.state ?? exists.state,
        closedAt: body.state === 'closed' ? new Date() : exists.closedAt,
        closedBy: body.state === 'closed' ? auth.userId : exists.closedBy,
      },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}
