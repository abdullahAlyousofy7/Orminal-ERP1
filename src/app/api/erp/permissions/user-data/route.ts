import { db } from '@/lib/db'
import { ok, list, badRequest, notFound, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import { hashPassword } from '@/lib/auth/password'
import { assertLastAdminProtection } from '@/lib/erp/effective-permissions'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const active = url.searchParams.get('active')
    const roleId = url.searchParams.get('roleId')
    const branchId = url.searchParams.get('branchId')

    const where: any = {}
    if (!auth.isSuperAdmin) {
      where.OR = [
        { defaultCompanyId: auth.companyId },
        { userRoles: { some: { companyId: auth.companyId } } },
        { branches: { some: { companyId: auth.companyId } } },
      ]
    }

    if (q) {
      const searchConditions = [
        { username: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeNumber: { contains: q, mode: 'insensitive' } },
        { nationalId: { contains: q, mode: 'insensitive' } },
      ]
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }]
        delete where.OR
      } else {
        where.OR = searchConditions
      }
    }

    if (active === 'true' || active === 'false') where.active = active === 'true'
    if (roleId) {
      where.userRoles = { some: { roleId, active: true } }
    }
    if (branchId) {
      where.OR = [
        { defaultBranchId: branchId },
        { branches: { some: { id: branchId } } },
      ]
    }

    const [data, total] = await Promise.all([
      db.user.findMany({
        where,
        orderBy: [{ userCode: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
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
          passwordChangeCount: true,
          lastPasswordChangeDate: true,
          defaultCompanyId: true,
          defaultBranchId: true,
          locale: true,
          timezone: true,
          lastLoginAt: true,
          createdAt: true,
          manager: {
            select: { id: true, userCode: true, username: true, nameAr: true },
          },
          defaultBranch: {
            select: { id: true, code: true, nameAr: true, nameEn: true },
          },
          branches: {
            select: { id: true, code: true, nameAr: true },
          },
          userRoles: {
            where: { active: true },
            include: {
              role: {
                select: { id: true, roleCode: true, code: true, nameAr: true, nameEn: true, isSystem: true, isSuspended: true },
              },
            },
          },
        },
      }),
      db.user.count({ where }),
    ])

    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.username?.trim()) return badRequest('اسم المستخدم مطلوب (رمز الدخول)')
    if (!body.nameAr?.trim()) return badRequest('اسم المستخدم بالعربية مطلوب')
    if (!body.password?.trim()) return badRequest('كلمة المرور مطلوبة')

    const cleanUsername = body.username.trim().toLowerCase()
    const existing = await db.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { email: body.email?.trim().toLowerCase() || cleanUsername },
        ],
      },
    })
    if (existing) {
      return badRequest('اسم المستخدم أو البريد الإلكتروني مسجل بالفعل')
    }

    const lastUser = await db.user.findFirst({
      orderBy: { userCode: 'desc' },
      select: { userCode: true },
    })
    const nextUserCode = (lastUser?.userCode || 0) + 1

    const passwordHash = await hashPassword(body.password.trim())
    const pinHash = body.pin ? await hashPassword(body.pin.trim()) : null

    const created = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          userCode: body.userCode || nextUserCode,
          username: cleanUsername,
          email: body.email?.trim().toLowerCase() || `${cleanUsername}@orminal.local`,
          nameAr: body.nameAr.trim(),
          nameEn: body.nameEn?.trim() || body.nameAr.trim(),
          phone: body.phone?.trim(),
          passwordHash,
          pinHash,
          employeeNumber: body.employeeNumber?.trim(),
          nationalId: body.nationalId?.trim(),
          managerId: body.managerId || null,
          defaultCompanyId: auth.companyId,
          defaultBranchId: body.defaultBranchId || auth.branchId || null,
          validFromDate: body.validFromDate ? new Date(body.validFromDate) : null,
          validToDate: body.validToDate ? new Date(body.validToDate) : null,
          validFromTime: body.validFromTime || null,
          validToTime: body.validToTime || null,
          defaultPriceLevel: body.defaultPriceLevel || null,
          minPriceLimit: body.minPriceLimit ? Number(body.minPriceLimit) : null,
          maxPriceLimit: body.maxPriceLimit ? Number(body.maxPriceLimit) : null,
          active: body.active !== false,
          passwordChangeCount: 1,
          lastPasswordChangeDate: new Date(),
        },
      })

      // Assign Roles
      if (body.roleIds && Array.isArray(body.roleIds) && body.roleIds.length > 0) {
        await tx.userRole.createMany({
          data: body.roleIds.map((rId: string) => ({
            userId: u.id,
            roleId: rId,
            companyId: auth.companyId,
            active: true,
          })),
        })
      }

      // Assign Branches
      if (body.branchIds && Array.isArray(body.branchIds) && body.branchIds.length > 0) {
        await tx.user.update({
          where: { id: u.id },
          data: {
            branches: {
              connect: body.branchIds.map((bId: string) => ({ id: bId })),
            },
          },
        })
      }

      return u
    })

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: created.id,
      action: 'create',
      newValue: {
        id: created.id,
        userCode: created.userCode,
        username: created.username,
        nameAr: created.nameAr,
        email: created.email,
      },
      reason: `Created user profile: ${created.nameAr} (${created.username})`,
    })

    return ok({ id: created.id, userCode: created.userCode, username: created.username })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.id) return badRequest('معرف المستخدم مطلوب')

    const existing = await db.user.findUnique({
      where: { id: body.id },
      include: { userRoles: true },
    })
    if (!existing) return notFound('المستخدم غير موجود')

    // Last Admin Protection Check
    if (body.active === false && existing.active === true) {
      const check = await assertLastAdminProtection(auth.companyId, body.id, 'DEACTIVATE')
      if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')
    }

    // Last Admin Protection: Check role removal
    if (body.roleIds && Array.isArray(body.roleIds)) {
      const adminRoles = await db.role.findMany({
        where: { code: { in: ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'] } },
        select: { id: true },
      })
      const adminRoleIds = adminRoles.map((r) => r.id)
      const isGrantingAdmin = body.roleIds.some((rId: string) => adminRoleIds.includes(rId))
      if (!isGrantingAdmin) {
        const check = await assertLastAdminProtection(auth.companyId, body.id, 'REMOVE_ADMIN_ROLE')
        if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')
      }
    }

    const updateData: any = {}
    if (body.nameAr !== undefined) updateData.nameAr = body.nameAr.trim()
    if (body.nameEn !== undefined) updateData.nameEn = body.nameEn?.trim()
    if (body.email !== undefined) updateData.email = body.email?.trim().toLowerCase()
    if (body.phone !== undefined) updateData.phone = body.phone?.trim()
    if (body.employeeNumber !== undefined) updateData.employeeNumber = body.employeeNumber?.trim()
    if (body.nationalId !== undefined) updateData.nationalId = body.nationalId?.trim()
    if (body.managerId !== undefined) updateData.managerId = body.managerId || null
    if (body.defaultBranchId !== undefined) updateData.defaultBranchId = body.defaultBranchId || null
    if (body.validFromDate !== undefined) updateData.validFromDate = body.validFromDate ? new Date(body.validFromDate) : null
    if (body.validToDate !== undefined) updateData.validToDate = body.validToDate ? new Date(body.validToDate) : null
    if (body.validFromTime !== undefined) updateData.validFromTime = body.validFromTime || null
    if (body.validToTime !== undefined) updateData.validToTime = body.validToTime || null
    if (body.defaultPriceLevel !== undefined) updateData.defaultPriceLevel = body.defaultPriceLevel || null
    if (body.minPriceLimit !== undefined) updateData.minPriceLimit = body.minPriceLimit !== null ? Number(body.minPriceLimit) : null
    if (body.maxPriceLimit !== undefined) updateData.maxPriceLimit = body.maxPriceLimit !== null ? Number(body.maxPriceLimit) : null
    if (body.active !== undefined) updateData.active = Boolean(body.active)

    if (body.password?.trim()) {
      updateData.passwordHash = await hashPassword(body.password.trim())
      updateData.passwordChangeCount = { increment: 1 }
      updateData.lastPasswordChangeDate = new Date()
    }
    if (body.pin !== undefined) {
      updateData.pinHash = body.pin?.trim() ? await hashPassword(body.pin.trim()) : null
    }

    const updated = await db.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: body.id },
        data: updateData,
      })

      // Update Roles
      if (body.roleIds && Array.isArray(body.roleIds)) {
        await tx.userRole.deleteMany({ where: { userId: body.id, companyId: auth.companyId } })
        if (body.roleIds.length > 0) {
          await tx.userRole.createMany({
            data: body.roleIds.map((rId: string) => ({
              userId: body.id,
              roleId: rId,
              companyId: auth.companyId,
              active: true,
            })),
          })
        }
      }

      // Update Branches
      if (body.branchIds && Array.isArray(body.branchIds)) {
        await tx.user.update({
          where: { id: body.id },
          data: {
            branches: {
              set: body.branchIds.map((bId: string) => ({ id: bId })),
            },
          },
        })
      }

      return u
    })

    const diff = diffFields(existing, updated, [
      'nameAr',
      'email',
      'phone',
      'employeeNumber',
      'nationalId',
      'active',
      'defaultBranchId',
      'validFromDate',
      'validToDate',
      'validFromTime',
      'validToTime',
      'defaultPriceLevel',
      'minPriceLimit',
      'maxPriceLimit',
    ])

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: body.id,
      action: 'update',
      oldValue: diff.old,
      newValue: diff.new,
      reason: `Updated user profile: ${updated.nameAr} (${updated.username})`,
    })

    return ok({ success: true, user: updated })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return badRequest('معرف المستخدم مطلوب')

    const existing = await db.user.findUnique({
      where: { id },
      select: { id: true, username: true, nameAr: true, active: true },
    })
    if (!existing) return notFound('المستخدم غير موجود')

    // Last Admin Protection Check
    const check = await assertLastAdminProtection(auth.companyId, id, 'DELETE')
    if (!check.safe) return badRequest(check.error!, 'LAST_ADMIN_PROTECTED')

    // Delete user cascading user roles
    await db.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } })
      await tx.user.delete({ where: { id } })
    })

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: id,
      action: 'delete',
      oldValue: existing,
      reason: `Deleted user: ${existing.nameAr} (${existing.username})`,
    })

    return ok({ success: true, message: 'تم حذف المستخدم بنجاح' })
  } catch (e: any) {
    return serverError(e.message)
  }
}
