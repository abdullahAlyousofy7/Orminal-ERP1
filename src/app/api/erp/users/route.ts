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
        { username: { contains: q } },
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
        { email: { contains: q } },
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          username: true,
          email: true,
          nameAr: true,
          nameEn: true,
          phone: true,
          avatar: true,
          active: true,
          mfaEnabled: true,
          defaultCompanyId: true,
          defaultBranchId: true,
          locale: true,
          timezone: true,
          lastLoginAt: true,
          createdAt: true,
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
      where: { OR: [{ username: body.username }, { email: body.email }] },
    })
    if (dup) {
      if (dup.username === body.username) {
        return badRequest('اسم المستخدم مستخدم بالفعل', 'DUPLICATE_USERNAME')
      }
      return badRequest('البريد الإلكتروني مستخدم بالفعل', 'DUPLICATE_EMAIL')
    }

    if (body.defaultBranchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.defaultBranchId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const passwordHash = await hashPassword(body.password)

    const created_ = await db.user.create({
      data: {
        username: body.username,
        email: body.email,
        nameAr: body.nameAr,
        nameEn: body.nameEn || null,
        phone: body.phone || null,
        avatar: body.avatar || null,
        passwordHash,
        defaultCompanyId: auth.companyId,
        defaultBranchId: body.defaultBranchId || null,
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
        id: true, username: true, email: true, nameAr: true, nameEn: true,
        active: true, mfaEnabled: true, createdAt: true,
      },
    })
    return created(created_)
  } catch (e: any) {
    return serverError(e.message)
  }
}
