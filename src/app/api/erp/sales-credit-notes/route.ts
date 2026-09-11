import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import { reverseJournalEntry } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-credit-notes
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const partnerId = url.searchParams.get('partnerId')

    const baseWhere: any = {}
    if (q) baseWhere.OR = [{ code: { contains: q } }, { reason: { contains: q } }]
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.salesCreditNote.findMany({
        where,
        skip,
        take: pageSize,
        include: { partner: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.salesCreditNote.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/sales-credit-notes — create + reverse original invoice journal
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('partnerId is required')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      branchId: requestedBranch,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    if (body.invoiceId) {
      const origInvoice = await db.salesInvoice.findFirst({
        where: { id: body.invoiceId, companyId: auth.companyId },
      })
      if (!origInvoice) {
        return badRequest('الفاتورة الأصلية غير موجودة أو تابعة لشركة أخرى / Invoice not found in tenant')
      }
    }

    const code = await nextNumber('sales_credit_note', auth.companyId, requestedBranch)

    const cn = await db.salesCreditNote.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        invoiceId: body.invoiceId,
        date: body.date ? new Date(body.date) : new Date(),
        reason: body.reason,
        status: body.status ?? 'draft',
        subtotal: body.subtotal ?? 0,
        taxTotal: body.taxTotal ?? 0,
        total: body.total ?? 0,
        notes: body.notes,
      },
      include: { partner: true },
    })

    // If invoiceId provided and status posted: reverse the original invoice's journal
    if (body.invoiceId && body.status === 'posted') {
      const origInvoice = await db.salesInvoice.findFirst({
        where: { id: body.invoiceId, companyId: auth.companyId },
      })
      if (origInvoice?.journalEntryId) {
        const reversal = await reverseJournalEntry(
          origInvoice.journalEntryId,
          auth.userId,
          `إشعار دائن ${code}`
        )
        await db.salesCreditNote.update({
          where: { id: cn.id },
          data: { journalEntryId: reversal.id },
        })
        // Update partner.currentBalance (decrease AR for credit note)
        await db.partner.update({
          where: { id: body.partnerId },
          data: { currentBalance: { decrement: body.total ?? 0 } },
        })
      }
    }

    const result = await db.salesCreditNote.findFirst({
      where: { id: cn.id, companyId: auth.companyId },
      include: { partner: true },
    })
    return created(result)
  } catch (e: any) {
    return serverError(e.message)
  }
}
