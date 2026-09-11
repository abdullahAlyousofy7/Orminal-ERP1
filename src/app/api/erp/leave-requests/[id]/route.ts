import { db } from '@/lib/db'
import { ok, notFound, badRequest, forbidden, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  checkCapability,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.leaveRequest.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
      include: { employee: { select: { id: true, employeeNo: true, nameAr: true, nameEn: true, department: { select: { nameAr: true } } } } },
    })
    if (!item) return notFound('Leave request not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.leaveRequest.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Leave request not found')

    const { action } = body
    if (action) {
      if (action === 'approve') {
        const canApprove = await checkCapability(auth, 'HR', 'canApprove')
        if (!canApprove.allowed) {
          return forbidden('صلاحية الاعتماد غير متوفرة لهذا الحساب', 'INSUFFICIENT_PERMISSION')
        }
      }

      let newStatus = exists.status
      if (action === 'approve') newStatus = 'approved'
      else if (action === 'reject') newStatus = 'rejected'
      else if (action === 'submit') newStatus = 'submitted'
      else return badRequest(`إجراء غير معروف: ${action}`)

      const updated = await db.leaveRequest.update({
        where: { id },
        data: {
          status: newStatus,
          approverId: auth.userId,
          approvedAt: new Date(),
        },
      })
      return ok(updated)
    }

    if (body.employeeId && body.employeeId !== exists.employeeId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { employeeId: body.employeeId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const { id: _id, ...rest } = body
    if (rest.startDate) rest.startDate = new Date(rest.startDate)
    if (rest.endDate) rest.endDate = new Date(rest.endDate)
    if (rest.days !== undefined) rest.days = Number(rest.days)
    const updated = await db.leaveRequest.update({ where: { id }, data: rest })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.leaveRequest.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Leave request not found')
    if (exists.status === 'approved') return badRequest('لا يمكن حذف طلب إجازة معتمد')
    await db.leaveRequest.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
