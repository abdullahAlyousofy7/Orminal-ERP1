import { db } from '@/lib/db'
import {
  list, created, badRequest, serverError,
  parsePagination, parseSearch,
} from '@/lib/erp/api-response'
import { hashPassword } from '@/lib/auth/password'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'
import { writeAudit } from '@/lib/erp/audit'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const active = url.searchParams.get('active')
    const mfaEnabled = url.searchParams.get('mfaEnabled')

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
        { phone: { contains: q, mode: 'insensitive' } },
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
    if (mfaEnabled === 'true' || mfaEnabled === 'false') where.mfaEnabled = mfaEnabled === 'true'

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
          manager: {
            select: { id: true, userCode: true, nameAr: true, username: true },
          },
          employee: {
            select: { id: true, employeeNo: true, nameAr: true, nameEn: true },
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
          _count: { select: { auditLogs: true } },
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
    if (!body.username) return badRequest('اسم المستخدم مطلوب', 'VALIDATION_ERROR')
    if (!body.email) return badRequest('البريد الإلكتروني مطلوب', 'VALIDATION_ERROR')
    if (!body.nameAr) return badRequest('الاسم بالعربية مطلوب', 'VALIDATION_ERROR')
    if (!body.password) return badRequest('كلمة المرور مطلوبة', 'VALIDATION_ERROR')

    // Duplicate username/email checks
    const dup = await db.user.findFirst({
      where: {
        OR: [
          { username: body.username.trim() },
          { email: body.email.trim().toLowerCase() },
        ],
      },
    })
    if (dup) {
      if (dup.username === body.username.trim()) {
        return badRequest('اسم المستخدم مستخدم بالفعل', 'DUPLICATE_USERNAME')
      }
      return badRequest('البريد الإلكتروني مستخدم بالفعل', 'DUPLICATE_EMAIL')
    }

    if (body.defaultBranchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.defaultBranchId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    // Auto-calculate userCode if missing
    let userCode = body.userCode ? Number(body.userCode) : undefined
    if (!userCode) {
      const maxUserCode = await db.user.aggregate({ _max: { userCode: true } })
      userCode = (maxUserCode._max.userCode || 0) + 1
    }

    const passwordHash = await hashPassword(body.password)
    const pinHash = body.pin?.trim() ? await hashPassword(body.pin.trim()) : null

    const created_ = await db.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          userCode,
          username: body.username.trim(),
          email: body.email.trim().toLowerCase(),
          nameAr: body.nameAr.trim(),
          nameEn: body.nameEn?.trim() || null,
          phone: body.phone?.trim() || null,
          avatar: body.avatar || null,
          passwordHash,
          pinHash,
          employeeNumber: body.employeeNumber?.trim() || null,
          nationalId: body.nationalId?.trim() || null,
          managerId: body.managerId || null,
          defaultCompanyId: auth.companyId,
          defaultBranchId: body.defaultBranchId || null,
          validFromDate: body.validFromDate ? new Date(body.validFromDate) : null,
          validToDate: body.validToDate ? new Date(body.validToDate) : null,
          validFromTime: body.validFromTime || null,
          validToTime: body.validToTime || null,
          defaultPriceLevel: body.defaultPriceLevel || 'retail',
          minPriceLimit: body.minPriceLimit ? Number(body.minPriceLimit) : null,
          maxPriceLimit: body.maxPriceLimit ? Number(body.maxPriceLimit) : null,
          locale: body.locale || 'ar',
          timezone: body.timezone || 'Asia/Riyadh',
          mfaEnabled: body.mfaEnabled ?? false,
          active: body.active ?? true,
          ...(body.roleId
            ? {
                userRoles: {
                  create: [{ role: { connect: { id: body.roleId } }, companyId: auth.companyId }],
                },
              }
            : {}),
        },
        select: {
          id: true,
          userCode: true,
          username: true,
          email: true,
          nameAr: true,
          nameEn: true,
          employeeNumber: true,
          defaultBranchId: true,
          active: true,
          mfaEnabled: true,
          createdAt: true,
        },
      })

      // Link Employee record if employeeId or employeeNumber is provided
      if (body.employeeId) {
        await tx.employee.update({
          where: { id: body.employeeId },
          data: { userId: u.id },
        }).catch(() => {})
      } else if (body.employeeNumber) {
        const emp = await tx.employee.findUnique({
          where: { employeeNo: body.employeeNumber.trim() },
        })
        if (emp) {
          await tx.employee.update({
            where: { id: emp.id },
            data: { userId: u.id },
          }).catch(() => {})
        }
      }

      return u
    })

    // Audit Logging
    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER',
      documentId: created_.id,
      action: 'create',
      newValue: {
        id: created_.id,
        userCode: created_.userCode,
        username: created_.username,
        nameAr: created_.nameAr,
        email: created_.email,
        employeeNumber: created_.employeeNumber,
        defaultBranchId: created_.defaultBranchId,
        active: created_.active,
      },
      reason: `إنشاء مستخدم جديد: ${created_.nameAr} (${created_.username})`,
    })

    return created(created_)
  } catch (e: any) {
    return serverError(e.message)
  }
}

