import { db } from '@/lib/db'
import {
  ok, badRequest, notFound, serverError, forbidden,
} from '@/lib/erp/api-response'
import { hashPassword } from '@/lib/auth/password'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import { assertLastAdminProtection } from '@/lib/erp/effective-permissions'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        userCode: true,
        username: true,
        email: true,
        nameAr: true,
        nameEn: true,
        phone: true,
        avatar: true,
        active: true,
        mfaEnabled: true,
        employeeNumber: true,
        nationalId: true,
        managerId: true,
        validFromDate: true,
        validToDate: true,
        validFromTime: true,
        validToTime: true,
        defaultPriceLevel: true,
        minPriceLimit: true,
        maxPriceLimit: true,
        defaultCompanyId: true,
        defaultBranchId: true,
        locale: true,
        timezone: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        branches: { select: { id: true, companyId: true } },
        manager: {
          select: { id: true, userCode: true, nameAr: true, username: true },
        },
        employee: {
          select: {
            id: true,
            employeeNo: true,
            nameAr: true,
            nameEn: true,
            department: { select: { nameAr: true } },
          },
        },
        defaultBranch: {
          select: { id: true, code: true, nameAr: true, nameEn: true },
        },
        userRoles: {
          include: {
            role: {
              select: { id: true, code: true, nameAr: true, nameEn: true, isSystem: true },
            },
          },
        },
      },
    })
    if (!user) return notFound('المستخدم غير موجود')

    // Tenant check
    if (!auth.isSuperAdmin) {
      const belongsToCompany =
        user.defaultCompanyId === auth.companyId ||
        user.userRoles.some((ur) => ur.companyId === auth.companyId) ||
        user.branches.some((b) => b.companyId === auth.companyId)
      if (!belongsToCompany) {
        return notFound('المستخدم غير موجود')
      }
    }

    return ok(user)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const existing = await db.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        branches: true,
      },
    })
    if (!existing) return notFound('المستخدم غير موجود')

    if (!auth.isSuperAdmin) {
      const belongsToCompany =
        existing.defaultCompanyId === auth.companyId ||
        existing.userRoles.some((ur) => ur.companyId === auth.companyId) ||
        existing.branches.some((b) => b.companyId === auth.companyId)
      if (!belongsToCompany) {
        return notFound('المستخدم غير موجود')
      }
    }

    // Last Admin Protection Check
    if (body.active === false && existing.active === true) {
      const check = await assertLastAdminProtection(auth.companyId, id, 'DEACTIVATE')
      if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')
    }

    // Last Admin Protection: Check if changing role away from admin
    if (body.roleId) {
      const newRole = await db.role.findUnique({ where: { id: body.roleId } })
      const wasAdmin = existing.userRoles?.some((ur: any) =>
        ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(ur.role?.code?.toUpperCase())
      )
      const willBeAdmin = newRole && ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(newRole.code?.toUpperCase())
      if (wasAdmin && !willBeAdmin) {
        const check = await assertLastAdminProtection(auth.companyId, id, 'REMOVE_ADMIN_ROLE')
        if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')
      }
    }

    // Duplicate email check if changing
    if (body.email && body.email.trim().toLowerCase() !== existing.email.toLowerCase()) {
      const dup = await db.user.findFirst({
        where: { email: body.email.trim().toLowerCase(), NOT: { id } },
      })
      if (dup) return badRequest('البريد الإلكتروني مستخدم بالفعل', 'DUPLICATE_EMAIL')
    }

    if (body.defaultBranchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.defaultBranchId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const data: any = {}
    if (body.userCode !== undefined) data.userCode = Number(body.userCode)
    if (body.nameAr !== undefined) data.nameAr = body.nameAr.trim()
    if (body.nameEn !== undefined) data.nameEn = body.nameEn?.trim() || null
    if (body.email !== undefined) data.email = body.email.trim().toLowerCase()
    if (body.phone !== undefined) data.phone = body.phone?.trim() || null
    if (body.avatar !== undefined) data.avatar = body.avatar || null
    if (body.employeeNumber !== undefined) data.employeeNumber = body.employeeNumber?.trim() || null
    if (body.nationalId !== undefined) data.nationalId = body.nationalId?.trim() || null
    if (body.managerId !== undefined) data.managerId = body.managerId || null
    if (body.defaultBranchId !== undefined) data.defaultBranchId = body.defaultBranchId || null
    if (body.validFromDate !== undefined) data.validFromDate = body.validFromDate ? new Date(body.validFromDate) : null
    if (body.validToDate !== undefined) data.validToDate = body.validToDate ? new Date(body.validToDate) : null
    if (body.validFromTime !== undefined) data.validFromTime = body.validFromTime || null
    if (body.validToTime !== undefined) data.validToTime = body.validToTime || null
    if (body.defaultPriceLevel !== undefined) data.defaultPriceLevel = body.defaultPriceLevel || null
    if (body.minPriceLimit !== undefined) data.minPriceLimit = body.minPriceLimit ? Number(body.minPriceLimit) : null
    if (body.maxPriceLimit !== undefined) data.maxPriceLimit = body.maxPriceLimit ? Number(body.maxPriceLimit) : null
    if (body.active !== undefined) data.active = body.active
    if (body.mfaEnabled !== undefined) data.mfaEnabled = body.mfaEnabled
    if (body.locale !== undefined) data.locale = body.locale
    if (body.timezone !== undefined) data.timezone = body.timezone
    if (body.password) {
      data.passwordHash = await hashPassword(body.password)
    }
    if (body.pin) {
      data.pinHash = await hashPassword(body.pin.trim())
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        userCode: true,
        username: true,
        email: true,
        nameAr: true,
        nameEn: true,
        employeeNumber: true,
        active: true,
        mfaEnabled: true,
        locale: true,
        timezone: true,
        defaultBranchId: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Update role assignment (scoped to company)
    if (body.roleId !== undefined) {
      await db.userRole.deleteMany({
        where: { userId: id, ...(auth.isSuperAdmin ? {} : { companyId: auth.companyId }) },
      })
      if (body.roleId) {
        const role = await db.role.findUnique({ where: { id: body.roleId } })
        if (role) {
          await db.userRole.create({
            data: { userId: id, roleId: body.roleId, companyId: auth.companyId },
          })
        }
      }
    }

    // Link/Unlink Employee
    if (body.employeeId) {
      // First disconnect any other employee for this user
      await db.employee.updateMany({ where: { userId: id }, data: { userId: null } })
      await db.employee.update({ where: { id: body.employeeId }, data: { userId: id } }).catch(() => {})
    } else if (body.employeeNumber) {
      const emp = await db.employee.findUnique({ where: { employeeNo: body.employeeNumber.trim() } })
      if (emp) {
        await db.employee.updateMany({ where: { userId: id, id: { not: emp.id } }, data: { userId: null } })
        await db.employee.update({ where: { id: emp.id }, data: { userId: id } }).catch(() => {})
      }
    }

    // Audit Logging
    const { old: oldDiff, new: newDiff } = diffFields(existing, body, [
      'nameAr', 'nameEn', 'email', 'phone', 'active', 'mfaEnabled',
      'employeeNumber', 'nationalId', 'managerId', 'defaultBranchId',
      'validFromDate', 'validToDate', 'validFromTime', 'validToTime',
      'defaultPriceLevel', 'minPriceLimit', 'maxPriceLimit'
    ])
    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: id,
      action: 'update',
      oldValue: oldDiff,
      newValue: newDiff,
      reason: `تحديث بيانات المستخدم: ${existing.nameAr} (${existing.username})`,
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
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nameAr: true,
        defaultCompanyId: true,
        userRoles: { select: { companyId: true } },
        branches: { select: { companyId: true } },
      },
    })
    if (!user) return notFound('المستخدم غير موجود')
    if (user.username === 'admin') {
      return forbidden('لا يمكن حذف المستخدم الإداري الافتراضي', 'SYSTEM_USER')
    }

    // Last Admin Protection Check
    const check = await assertLastAdminProtection(auth.companyId, id, 'DELETE')
    if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')

    if (!auth.isSuperAdmin) {
      const belongsToCompany =
        user.defaultCompanyId === auth.companyId ||
        user.userRoles.some((ur) => ur.companyId === auth.companyId) ||
        user.branches.some((b) => b.companyId === auth.companyId)
      if (!belongsToCompany) {
        return notFound('المستخدم غير موجود')
      }
    }

    // Unlink employee
    await db.employee.updateMany({ where: { userId: id }, data: { userId: null } })
    await db.userRole.deleteMany({ where: { userId: id } })
    await db.user.delete({ where: { id } })

    // Audit Logging
    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: id,
      action: 'delete',
      oldValue: { id: user.id, username: user.username, nameAr: user.nameAr },
      reason: `حذف حساب المستخدم: ${user.nameAr} (${user.username})`,
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}

