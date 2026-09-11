import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/fiscal-years
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'fiscal_years', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)

    const baseWhere = scopedWhere(auth, {})
    const where: any = { ...baseWhere }
    if (q) where.name = { contains: q }

    const [data, total] = await Promise.all([
      db.fiscalYear.findMany({
        where,
        skip,
        take: pageSize,
        include: { periods: { orderBy: { startDate: 'asc' } }, company: { select: { id: true, nameAr: true } } },
        orderBy: { startDate: 'desc' },
      }),
      db.fiscalYear.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/fiscal-years — create with optional auto-periods
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'fiscal_years', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.name) return badRequest('name is required')
    if (!body.startDate) return badRequest('startDate is required')
    if (!body.endDate) return badRequest('endDate is required')

    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)

    const fy = await db.fiscalYear.create({
      data: {
        companyId: auth.companyId,
        name: body.name,
        startDate,
        endDate,
        state: body.state ?? 'open',
      },
      include: { periods: true },
    })

    // Auto-generate financial periods if requested
    if (body.autoPeriods) {
      const periodType = body.periodType || 'monthly' // monthly | quarterly | semi-annual | annual
      const periods: any[] = []
      
      const start = new Date(startDate)
      const end = new Date(endDate)
      
      if (periodType === 'monthly') {
        const periodMonthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
        const cur = new Date(start.getFullYear(), start.getMonth(), 1)
        while (cur <= end) {
          const pStart = new Date(cur)
          const pEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59)
          const q = Math.floor(cur.getMonth() / 3) + 1
          periods.push({
            fiscalYearId: fy.id,
            name: `${periodMonthsAr[cur.getMonth()]} ${cur.getFullYear()}`,
            startDate: pStart,
            endDate: pEnd,
            quarter: q,
            state: 'open',
          })
          cur.setMonth(cur.getMonth() + 1)
        }
      } else if (periodType === 'quarterly') {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1)
        let qCount = 1
        while (cur <= end) {
          const pStart = new Date(cur)
          const pEnd = new Date(cur.getFullYear(), cur.getMonth() + 3, 0, 23, 59, 59)
          periods.push({
            fiscalYearId: fy.id,
            name: `الربع ${qCount} — ${fy.name}`,
            startDate: pStart,
            endDate: pEnd > end ? end : pEnd,
            quarter: qCount,
            state: 'open',
          })
          cur.setMonth(cur.getMonth() + 3)
          qCount++
        }
      } else if (periodType === 'semi-annual') {
        const cur = new Date(start.getFullYear(), start.getMonth(), 1)
        let hCount = 1
        while (cur <= end) {
          const pStart = new Date(cur)
          const pEnd = new Date(cur.getFullYear(), cur.getMonth() + 6, 0, 23, 59, 59)
          periods.push({
            fiscalYearId: fy.id,
            name: `النصف ${hCount} — ${fy.name}`,
            startDate: pStart,
            endDate: pEnd > end ? end : pEnd,
            quarter: hCount === 1 ? 1 : 3,
            state: 'open',
          })
          cur.setMonth(cur.getMonth() + 6)
          hCount++
        }
      } else if (periodType === 'annual') {
        periods.push({
          fiscalYearId: fy.id,
          name: fy.name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          quarter: 1,
          state: 'open',
        })
      }

      if (periods.length > 0) {
        await db.fiscalPeriod.createMany({ data: periods })
      }
    }

    const result = await db.fiscalYear.findUnique({
      where: { id: fy.id },
      include: { periods: { orderBy: { startDate: 'asc' } } },
    })

    return created(result)
  } catch (e: any) {
    return serverError(e.message)
  }
}
