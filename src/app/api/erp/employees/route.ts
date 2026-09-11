import { db } from '@/lib/db'
import { ok, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const status = new URL(req.url).searchParams.get('status')
    const baseWhere: any = {}
    if (status) baseWhere.status = status
    if (q) {
      baseWhere.OR = [{ employeeNo: { contains: q } }, { nameAr: { contains: q } }, { nameEn: { contains: q } }, { phone: { contains: q } }]
    }
    const where = scopedWhere(auth, baseWhere, { branchScoped: true })
    const [data, total] = await Promise.all([
      db.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          department: { select: { id: true, nameAr: true, nameEn: true } },
          jobPosition: { select: { id: true, code: true, nameAr: true, nameEn: true } },
        },
      }),
      db.employee.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'HR', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.nameAr) return badRequest('الاسم مطلوب')

    // Branch FK verification if provided
    if (body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { branchId: body.branchId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const count = await db.employee.count({ where: { companyId: auth.companyId } })
    const employeeNo = body.employeeNo || `EMP-${String(count + 1).padStart(4, '0')}`

    // Resolve jobPositionId (free text or CUID)
    let jobPositionId: string | null = null
    if (body.jobPositionId) {
      const inputVal = body.jobPositionId
      // 1. Check if it's already a valid JobPosition ID
      const byId = await db.jobPosition.findUnique({ where: { id: inputVal } })
      if (byId) {
        jobPositionId = byId.id
      } else {
        // 2. Check if a JobPosition with this name exists
        const byName = await db.jobPosition.findFirst({
          where: { OR: [{ nameAr: inputVal }, { nameEn: inputVal }] }
        })
        if (byName) {
          jobPositionId = byName.id
        } else {
          // 3. Create a new JobPosition
          const jobCount = await db.jobPosition.count()
          const code = `JOB-${String(jobCount + 1).padStart(4, '0')}`
          const newJob = await db.jobPosition.create({
            data: {
              code,
              nameAr: inputVal,
              nameEn: inputVal,
              active: true
            }
          })
          jobPositionId = newJob.id
        }
      }
    }

    const created = await db.employee.create({
      data: {
        employeeNo,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        companyId: auth.companyId,
        branchId: body.branchId || auth.branchId || null,
        departmentId: body.departmentId || null,
        jobPositionId,
        hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
        status: body.status || 'active',
        nationalId: body.nationalId,
        phone: body.phone,
        email: body.email,
        address: body.address,
        gender: body.gender,
        nationality: body.nationality,
      },
    })
    return ok(created)
  } catch (e: any) {
    return serverError(e.message)
  }
}
