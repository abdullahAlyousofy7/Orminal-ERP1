import { db } from '@/lib/db'
import { list, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)

    const where: any = { active: true }
    if (q) where.OR = [{ code: { contains: q } }, { nameAr: { contains: q } }, { nameEn: { contains: q } }]

    const [data, total] = await Promise.all([
      db.jobPosition.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { nameAr: 'asc' },
      }),
      db.jobPosition.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}
