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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true, username: true, email: true,
        nameAr: true, nameEn: true,
        phone: true, avatar: true,
        active: true, mfaEnabled: true,
        defaultCompanyId: true, defaultBranchId: true,
        locale: true, timezone: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        branches: { select: { id: true, companyId: true } },
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
        userRoles: true,
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

    // Duplicate email check if changing
    if (body.email && body.email !== existing.email) {
      const dup = await db.user.findFirst({ where: { email: body.email, NOT: { id } } })
      if (dup) return badRequest('البريد الإلكتروني مستخدم بالفعل', 'DUPLICATE_EMAIL')
    }

    if (body.defaultBranchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.defaultBranchId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const data: any = {}
    if (body.nameAr !== undefined) data.nameAr = body.nameAr
    if (body.nameEn !== undefined) data.nameEn = body.nameEn || null
    if (body.email !== undefined) data.email = body.email
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.avatar !== undefined) data.avatar = body.avatar || null
    if (body.defaultBranchId !== undefined) data.defaultBranchId = body.defaultBranchId || null
    if (body.active !== undefined) data.active = body.active
    if (body.mfaEnabled !== undefined) data.mfaEnabled = body.mfaEnabled
    if (body.locale !== undefined) data.locale = body.locale
    if (body.timezone !== undefined) data.timezone = body.timezone
    if (body.password) {
      data.passwordHash = await hashPassword(body.password)
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true, username: true, email: true,
        nameAr: true, nameEn: true,
        active: true, mfaEnabled: true,
        locale: true, timezone: true,
        defaultBranchId: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
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
        username: true,
        defaultCompanyId: true,
        userRoles: { select: { companyId: true } },
        branches: { select: { companyId: true } },
      },
    })
    if (!user) return notFound('المستخدم غير موجود')
    if (user.username === 'admin') {
      return forbidden('لا يمكن حذف المستخدم الإداري الافتراضي', 'SYSTEM_USER')
    }

    if (!auth.isSuperAdmin) {
      const belongsToCompany =
        user.defaultCompanyId === auth.companyId ||
        user.userRoles.some((ur) => ur.companyId === auth.companyId) ||
        user.branches.some((b) => b.companyId === auth.companyId)
      if (!belongsToCompany) {
        return notFound('المستخدم غير موجود')
      }
    }

    await db.userRole.deleteMany({ where: { userId: id } })
    await db.user.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
