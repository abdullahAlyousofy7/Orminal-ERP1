import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const branchId = url.searchParams.get('branchId')

    const where: any = {
      branch: { companyId: auth.companyId },
    }

    if (q) {
      where.OR = [
        { code: { contains: q } },
        { nameAr: { contains: q } },
        { nameEn: { contains: q } },
      ]
    }

    if (branchId) {
      if (!auth.authorizedBranchIds.includes(branchId)) {
        where.branchId = '__UNAUTHORIZED_BRANCH__'
      } else {
        where.branchId = branchId
      }
    } else if (!auth.isSuperAdmin && auth.authorizedBranchIds.length > 0) {
      where.branchId = { in: auth.authorizedBranchIds }
    }

    const [data, total] = await Promise.all([
      db.warehouse.findMany({
        where,
        skip,
        take: pageSize,
        include: { branch: true },
        orderBy: { code: 'asc' },
      }),
      db.warehouse.count({ where }),
    ])

    const mappedData = data.map((item: any) => ({
      ...item,
      name: item.nameAr,
    }))

    return list(mappedData, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const nameAr = body.name || body.nameAr
    if (!nameAr) return badRequest('name is required')
    if (!body.branchId) return badRequest('branchId is required')

    const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.branchId })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    let code = body.code
    if (!code) {
      const count = await db.warehouse.count({
        where: { branch: { companyId: auth.companyId } },
      })
      code = `WH-${String(count + 1).padStart(3, '0')}`
    }

    const warehouse = await db.warehouse.create({
      data: {
        code,
        nameAr,
        nameEn: body.nameEn,
        branchId: body.branchId,
        address: body.address,
        active: body.active ?? true,
      },
      include: { branch: true },
    })

    const mapped = {
      ...warehouse,
      name: warehouse.nameAr,
    }

    return created(mapped)
  } catch (e: any) {
    return serverError(e.message)
  }
}
