import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'settings', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const requestedBranch = url.searchParams.get('branchId')

    const branchFilter: any = { companyId: auth.companyId }
    if (requestedBranch) {
      if (!auth.authorizedBranchIds.includes(requestedBranch)) {
        return list([], 0, page, pageSize)
      }
      branchFilter.id = requestedBranch
    } else if (auth.authorizedBranchIds.length > 0) {
      branchFilter.id = { in: auth.authorizedBranchIds }
    }

    const where: any = {
      branch: branchFilter,
    }
    if (q) {
      where.OR = [
        { code: { contains: q } },
        { name: { contains: q } },
      ]
    }

    const [data, total] = await Promise.all([
      db.activity.findMany({
        where,
        skip,
        take: pageSize,
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.activity.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'settings', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.name) return badRequest('name is required')
    if (!body.branchId) return badRequest('branchId is required')

    if (!auth.authorizedBranchIds.includes(body.branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    let code = body.code
    if (!code) {
      const count = await db.activity.count({
        where: { branch: { companyId: auth.companyId } },
      })
      code = `ACT-${String(count + 1).padStart(3, '0')}`
    }

    const activity = await db.activity.create({
      data: {
        code,
        name: body.name,
        branchId: body.branchId,
      },
      include: { branch: true },
    })
    return created(activity)
  } catch (e: any) {
    return serverError(e.message)
  }
}
