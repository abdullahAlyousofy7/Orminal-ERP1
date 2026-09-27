import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import { detectRoleInheritanceCycle } from '@/lib/erp/effective-permissions'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: {
        inheritedRoles: { include: { parentRole: true } },
        parentRoles: { include: { role: true } },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                userCode: true,
                username: true,
                nameAr: true,
                email: true,
                active: true,
              },
            },
          },
        },
      },
    })

    if (!role) return notFound('مجموعة المستخدمين غير موجودة')
    return ok(role)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const existing = await db.role.findUnique({ where: { id } })
    if (!existing) return notFound('مجموعة المستخدمين غير موجودة')

    const body = await req.json()

    // 1. Handle inheritance updates with cycle detection
    if (body.parentRoleIds && Array.isArray(body.parentRoleIds)) {
      for (const parentId of body.parentRoleIds) {
        const hasCycle = await detectRoleInheritanceCycle(id, parentId)
        if (hasCycle) {
          return badRequest(
            'تعذر تعيين الوراثة: تم اكتشاف حلقة تكرارية في وراثة الأدوار (Circular Inheritance)',
            'CIRCULAR_ROLE_INHERITANCE_DETECTED'
          )
        }
      }

      await db.$transaction(async (tx) => {
        await tx.roleInheritance.deleteMany({ where: { roleId: id } })
        if (body.parentRoleIds.length > 0) {
          await tx.roleInheritance.createMany({
            data: body.parentRoleIds.map((pId: string) => ({
              roleId: id,
              parentRoleId: pId,
            })),
          })
        }
      })
    }

    // 2. Handle member user assignments
    if (body.userIds && Array.isArray(body.userIds)) {
      await db.$transaction(async (tx) => {
        await tx.userRole.deleteMany({ where: { roleId: id, companyId: auth.companyId } })
        if (body.userIds.length > 0) {
          await tx.userRole.createMany({
            data: body.userIds.map((uId: string) => ({
              userId: uId,
              roleId: id,
              companyId: auth.companyId,
              active: true,
            })),
          })
        }
      })
    }

    // 3. Update main role attributes
    const updateData: any = {}
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr.trim()
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim()
    if (body.isSuspended !== undefined) {
      if (body.isSuspended && ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(existing.code.toUpperCase())) {
        return badRequest('لا يمكن تعليق مجموعة مسؤولي النظام الأساسية', 'SYSTEM_ROLE_PROTECTED')
      }
      updateData.isSuspended = Boolean(body.isSuspended)
    }
    if (body.active !== undefined) {
      if (!body.active && ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(existing.code.toUpperCase())) {
        return badRequest('لا يمكن إيقاف تفعيل مجموعة مسؤولي النظام الأساسية', 'SYSTEM_ROLE_PROTECTED')
      }
      updateData.active = Boolean(body.active)
    }

    const updated = await db.role.update({
      where: { id },
      data: updateData,
    })

    const diff = diffFields(existing, updated)
    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER_GROUP',
      documentId: id,
      action: 'update',
      oldValue: diff.old,
      newValue: diff.new,
      reason: `Updated user group: ${updated.nameAr}`,
    })

    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const role = await db.role.findUnique({
      where: { id },
      include: { _count: { select: { userRoles: true } } },
    })
    if (!role) return notFound('مجموعة المستخدمين غير موجودة')

    if (role.isSystem || ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(role.code.toUpperCase())) {
      return badRequest('لا يمكن حذف دور أو مجموعة نظامية قياسية', 'SYSTEM_ROLE_PROTECTED')
    }

    await db.role.delete({ where: { id } })

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER_GROUP',
      documentId: id,
      action: 'delete',
      oldValue: role,
      reason: `Deleted user group: ${role.nameAr} (${role.code})`,
    })

    return ok({ success: true, message: 'تم حذف مجموعة المستخدمين بنجاح' })
  } catch (e: any) {
    return serverError(e.message)
  }
}
