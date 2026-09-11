import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'safes', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const requestedBranch = url.searchParams.get('branchId')

    const baseWhere = scopedWhere(auth, { branchId: requestedBranch || undefined })
    const where: any = { ...baseWhere }

    if (q) {
      where.OR = [
        { code: { contains: q } },
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
      ]
    }

    const [data, total] = await Promise.all([
      db.safe.findMany({
        where,
        skip,
        take: pageSize,
        include: { account: { select: { id: true, code: true, nameAr: true } } },
        orderBy: { code: 'asc' },
      }),
      db.safe.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'safes', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.nameAr) return badRequest('nameAr is required')

    if (body.branchId && !auth.authorizedBranchIds.includes(body.branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    const fkCheck = await verifyTenantForeignKeys(auth, {
      branchId: body.branchId,
      accountId: body.accountId,
      currencyId: body.currencyId,
    })
    if (!fkCheck.valid) return fkCheck.error!

    let code = body.code
    if (!code) {
      const count = await db.safe.count({ where: { companyId: auth.companyId } })
      code = `SAFE-${String(count + 1).padStart(3, '0')}`
    }

    const safe = await db.safe.create({
      data: {
        companyId: auth.companyId,
        branchId: body.branchId || null,
        code,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        currencyId: body.currencyId,
        accountId: body.accountId,
        balance: body.balance ?? 0,
        active: body.active ?? true,
      },
    })
    return created(safe)
  } catch (e: any) {
    return serverError(e.message)
  }
}
