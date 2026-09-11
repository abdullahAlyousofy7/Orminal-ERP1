import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.department.findUnique({
      where: { id },
      include: {
        parent: { select: { id: true, code: true, nameAr: true } },
        children: { select: { id: true, code: true, nameAr: true } },
        _count: { select: { employees: { where: { companyId: auth.companyId } } } },
      },
    })
    if (!item) return notFound('Department not found')
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
    const exists = await db.department.findUnique({ where: { id } })
    if (!exists) return notFound('Department not found')
    if (body.parentId === id) return badRequest('لا يمكن أن يكون القسم ابناً لنفسه')

    const { id: _id, ...rest } = body
    const updated = await db.department.update({ where: { id }, data: rest })
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
    const exists = await db.department.findUnique({ where: { id } })
    if (!exists) return notFound('Department not found')

    const [childCount, empCount] = await Promise.all([
      db.department.count({ where: { parentId: id } }),
      db.employee.count({ where: { departmentId: id, companyId: auth.companyId } }),
    ])
    if (childCount > 0 || empCount > 0) {
      const updated = await db.department.update({ where: { id }, data: { active: false } })
      return ok({ success: true, softDeactivated: true, department: updated })
    }
    await db.department.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
