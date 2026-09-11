import { db } from '@/lib/db'
import {
  ok,
  created,
  list,
  badRequest,
  serverError,
  parsePagination,
  parseSearch,
} from '@/lib/erp/api-response'
import {
  postJournalEntry,
  validateBalanced,
} from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/journal-entries — list with includes
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { resource: 'journal_entries', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const state = url.searchParams.get('state')
    const refType = url.searchParams.get('refType')
    const requestedBranch = url.searchParams.get('branchId')

    const baseWhere = scopedWhere(auth, { branchId: requestedBranch || undefined })
    const where: any = { ...baseWhere }

    if (q) {
      where.OR = [
        { code: { contains: q } },
        { description: { contains: q } },
        { reference: { contains: q } },
      ]
    }
    if (state) where.state = state
    if (refType) where.refType = refType

    const [data, total] = await Promise.all([
      db.journalEntry.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          journal: { select: { id: true, code: true, nameAr: true } },
          lines: {
            include: {
              account: { select: { id: true, code: true, nameAr: true, type: true } },
              partner: { select: { id: true, nameAr: true } },
              costCenter: { select: { id: true, code: true, nameAr: true } },
            },
            orderBy: { id: 'asc' },
          },
        },
        orderBy: { postingDate: 'desc' },
      }),
      db.journalEntry.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/journal-entries — create draft OR post directly
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const state = body.state ?? 'draft'
    const requiredCapability = state === 'posted' ? 'canPost' : 'canCreate'

    const auth = await requireAuthContext(req, { resource: 'journal_entries', capability: requiredCapability })
    if (isAuthFailure(auth)) return auth

    const branchId = body.branchId || (auth.authorizedBranchIds.length > 0 ? auth.authorizedBranchIds[0] : null)
    if (branchId && !auth.authorizedBranchIds.includes(branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    if (!body.lines || !Array.isArray(body.lines) || body.lines.length < 2) {
      return badRequest('At least 2 lines required')
    }

    // Verify tenant FKs for partners and currency
    const partnerIds = body.lines.map((l: any) => l.partnerId).filter(Boolean)
    for (const pId of partnerIds) {
      const fkCheck = await verifyTenantForeignKeys(auth, { partnerId: pId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    if (body.currencyId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { currencyId: body.currencyId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    // Resolve account codes → input format for posting engine
    const lines: any[] = body.lines.map((l: any) => ({
      accountCode: l.accountCode,
      accountId: l.accountId,
      debit: Number(l.debit) || 0,
      credit: Number(l.credit) || 0,
      description: l.description,
      partnerId: l.partnerId,
      costCenterId: l.costCenterId,
      analyticAccountId: l.analyticAccountId,
      taxCodeId: l.taxCodeId,
    }))

    // BR-FIN-001: balanced
    if (!validateBalanced(lines)) {
      return badRequest('UNBALANCED_JOURNAL: debit total must equal credit total', 'BR-FIN-001')
    }

    const postingDate = body.postingDate ? new Date(body.postingDate) : new Date()

    // BR-FIN-002: check period open in this company's fiscal year
    if (state === 'posted') {
      const period = await db.fiscalPeriod.findFirst({
        where: {
          fiscalYear: { companyId: auth.companyId },
          startDate: { lte: postingDate },
          endDate: { gte: postingDate },
        },
      })
      if (period && period.state === 'closed') {
        return badRequest(`PERIOD_CLOSED: period ${period.name} is closed for posting`, 'BR-FIN-002')
      }
    }

    if (state === 'posted') {
      const entry = await postJournalEntry({
        companyId: auth.companyId,
        branchId: branchId || undefined,
        journalType: body.journalType ?? 'general',
        postingDate,
        description: body.description ?? 'Manual journal entry',
        refType: body.refType ?? 'manual',
        refId: body.refId,
        currencyId: body.currencyId,
        lines,
        userId: auth.userId,
      })
      const full = await db.journalEntry.findUnique({
        where: { id: entry.id },
        include: {
          lines: { include: { account: true, partner: true } },
          journal: true,
        },
      })
      return created(full)
    }

    // Create DRAFT entry
    const count = await db.journalEntry.count({ where: { companyId: auth.companyId } })
    const code = `JE-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`

    // Resolve accounts for lines
    const lineRecords: any[] = []
    for (const l of lines) {
      let accId = l.accountId
      if (!accId && l.accountCode) {
        const acc = await db.account.findFirst({ where: { code: l.accountCode } })
        if (acc) accId = acc.id
      }
      if (!accId) return badRequest(`Account not found for line: ${l.accountCode || l.accountId}`)
      lineRecords.push({
        accountId: accId,
        debit: l.debit,
        credit: l.credit,
        description: l.description,
        partnerId: l.partnerId,
        costCenterId: l.costCenterId,
        analyticAccountId: l.analyticAccountId,
        taxCodeId: l.taxCodeId,
      })
    }

    const totalDebit = lines.reduce((s: number, l: any) => s + l.debit, 0)
    const totalCredit = lines.reduce((s: number, l: any) => s + l.credit, 0)

    const draft = await db.journalEntry.create({
      data: {
        companyId: auth.companyId,
        branchId: branchId || null,
        code,
        journalId: body.journalId,
        postingDate,
        description: body.description,
        reference: body.reference,
        refType: body.refType ?? 'manual',
        currencyId: body.currencyId,
        state: 'draft',
        totalDebit,
        totalCredit,
        createdBy: auth.userId,
        lines: { create: lineRecords },
      },
      include: {
        lines: { include: { account: true, partner: true } },
        journal: true,
      },
    })
    return created(draft)
  } catch (e: any) {
    return serverError(e.message)
  }
}
