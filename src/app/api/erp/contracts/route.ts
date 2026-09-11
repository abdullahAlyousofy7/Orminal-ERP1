import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'employees', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const url = new URL(req.url)
    const employeeId = url.searchParams.get('employeeId')
    const status = url.searchParams.get('status')

    const where: any = {
      employee: { companyId: auth.companyId },
    }
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const [data, total] = await Promise.all([
      db.contract.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip,
        take: pageSize,
        include: {
          employee: {
            select: {
              id: true,
              employeeNo: true,
              nameAr: true,
              nameEn: true,
              department: { select: { nameAr: true } },
            },
          },
        },
      }),
      db.contract.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'employees', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.employeeId || !body.startDate || body.baseSalary === undefined) {
      return badRequest('الموظف وتاريخ البدء والراتب الأساسي مطلوبة')
    }

    const employeeExists = await db.employee.findFirst({
      where: { id: body.employeeId, companyId: auth.companyId },
    })
    if (!employeeExists) {
      return badRequest('الموظف غير موجود في الشركة المعتمدة')
    }

    // If new contract is active, expire all older active contracts for this employee
    if (body.status === 'active') {
      await db.contract.updateMany({
        where: { employeeId: body.employeeId, status: 'active' },
        data: { status: 'expired', endDate: new Date(body.startDate) },
      })
    }

    const contract = await db.contract.create({
      data: {
        employeeId: body.employeeId,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        baseSalary: parseFloat(body.baseSalary),
        allowances: body.allowances ? parseFloat(body.allowances) : 0,
        status: body.status || 'active',
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeNo: true,
            nameAr: true,
            department: { select: { nameAr: true } },
          },
        },
      },
    })

    return created(contract)
  } catch (e: any) {
    return serverError(e.message)
  }
}
