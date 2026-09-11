import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.attendance.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
      include: { employee: { select: { id: true, employeeNo: true, nameAr: true } } },
    })
    if (!item) return notFound('Attendance record not found')
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
    const exists = await db.attendance.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Attendance record not found')

    if (body.employeeId && body.employeeId !== exists.employeeId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { employeeId: body.employeeId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const { id: _id, ...rest } = body
    if (rest.date) rest.date = new Date(rest.date)
    if (rest.checkIn) rest.checkIn = new Date(rest.checkIn)
    if (rest.checkOut) rest.checkOut = new Date(rest.checkOut)
    const updated = await db.attendance.update({ where: { id }, data: rest })
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
    const exists = await db.attendance.findFirst({
      where: { id, employee: { companyId: auth.companyId } },
    })
    if (!exists) return notFound('Attendance record not found')
    await db.attendance.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
