import { db } from '@/lib/db'
import { ok, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import { detectRoleInheritanceCycle } from '@/lib/erp/effective-permissions'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const includeDetails = url.searchParams.get('details') === 'true'

    const where: any = {}
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ]
    }

    const [data, total] = await Promise.all([
      db.role.findMany({
        where,
        orderBy: [{ roleCode: 'asc' }, { createdAt: 'asc' }],
        skip,
        take: pageSize,
        include: {
          _count: {
            select: {
              userRoles: true,
              screenPrivileges: true,
              inputPrivileges: true,
              transactionPolicies: true,
            },
          },
          inheritedRoles: includeDetails ? { include: { parentRole: true } } : false,
          userRoles: includeDetails
            ? {
                where: { active: true },
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
              }
            : false,
        },
      }),
      db.role.count({ where }),
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
    if (!body.nameAr) return badRequest('اسم المجموعة مطلوب')

    const lastRole = await db.role.findFirst({
      orderBy: { roleCode: 'desc' },
      select: { roleCode: true },
    })
    const nextRoleCode = (lastRole?.roleCode || 0) + 1

    const code = body.code?.trim() || `ROLE_${nextRoleCode}`

    const created = await db.role.create({
      data: {
        roleCode: body.roleCode || nextRoleCode,
        code,
        nameAr: body.nameAr.trim(),
        nameEn: body.nameEn?.trim() || body.nameAr.trim(),
        description: body.description?.trim(),
        isSuspended: Boolean(body.isSuspended),
        active: body.active !== false,
      },
    })

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'USER_GROUP',
      documentId: created.id,
      action: 'create',
      newValue: created,
      reason: `Created user group: ${created.nameAr} (${created.code})`,
    })

    return ok(created)
  } catch (e: any) {
    return serverError(e.message)
  }
}
