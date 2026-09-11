import { db } from '@/lib/db'
import { created, list, badRequest, conflict, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/branches — list branches (multi-tenant scoping)
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)

    const where: any = { companyId: auth.companyId }
    if (q) {
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { nameAr: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (!auth.isSuperAdmin && auth.authorizedBranchIds.length > 0) {
      where.id = { in: auth.authorizedBranchIds }
    }

    const [data, total] = await Promise.all([
      db.branch.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          company: { select: { id: true, nameAr: true } },
          _count: { select: { users: true, warehouses: true } },
        },
        orderBy: { code: 'asc' },
      }),
      db.branch.count({ where }),
    ])

    // Map nameAr to name for backward compatibility across all frontend components
    const mappedData = data.map((b: any) => ({
      ...b,
      name: b.nameAr,
    }))

    return list(mappedData, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/branches — create a new branch
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const nameAr = (body.nameAr || body.name || '').trim()
    if (!nameAr) {
      return badRequest('اسم الفرع مطلوب')
    }

    const nameEn = (body.nameEn || nameAr).trim()
    const address = body.address || null
    const phone = body.phone || null
    const email = body.email || null
    const isMain = Boolean(body.isMain)
    const active = body.active !== undefined ? Boolean(body.active) : true

    // Generate or validate unique branch code
    let code = (body.code || '').trim()
    if (!code) {
      const count = await db.branch.count({ where: { companyId: auth.companyId } })
      code = `BR-${String(count + 1).padStart(3, '0')}`
    }

    // Check code collision
    const existingCode = await db.branch.findFirst({ where: { code } })
    if (existingCode) {
      const totalCount = await db.branch.count()
      code = `BR-${String(totalCount + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`
    }

    // If marked as main, reset other main flags under the same company
    if (isMain) {
      await db.branch.updateMany({
        where: { companyId: auth.companyId },
        data: { isMain: false },
      })
    }

    const branch = await db.branch.create({
      data: {
        code,
        nameAr,
        nameEn,
        companyId: auth.companyId,
        address,
        phone,
        email,
        isMain,
        active,
      },
      include: {
        company: { select: { id: true, nameAr: true } },
        _count: { select: { users: true, warehouses: true } },
      },
    })

    return created({
      ...branch,
      name: branch.nameAr,
    })
  } catch (e: any) {
    if (e.code === 'P2002') {
      return conflict('رمز الفرع مستخدم بالفعل، يرجى اختيار رمز آخر')
    }
    return serverError(e.message || 'حدث خطأ غير متوقع أثناء إضافة الفرع')
  }
}
