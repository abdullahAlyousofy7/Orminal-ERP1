import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import { postJournalEntry, receiptPosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-payments
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
    if (q) baseWhere.OR = [{ code: { contains: q } }, { reference: { contains: q } }]
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.salesPayment.findMany({
        where,
        skip,
        take: pageSize,
        include: { partner: { select: { id: true, nameAr: true, nameEn: true, code: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      db.salesPayment.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/sales-payments — receipt voucher (سند قبض)
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('partnerId is required')
    if (body.amount === undefined || body.amount === null) return badRequest('amount is required')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      branchId: requestedBranch,
      bankAccountId: body.bankAccountId,
      safeId: body.safeId,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    if (body.invoiceId) {
      const invoice = await db.salesInvoice.findFirst({
        where: { id: body.invoiceId, companyId: auth.companyId },
      })
      if (!invoice) {
        return badRequest('الفاتورة المرتبطة غير موجودة أو تابعة لشركة أخرى / Linked invoice not found in tenant')
      }
    }

    const code = await nextNumber('sales_payment', auth.companyId, requestedBranch)
    const status = body.status ?? 'posted'
    const amount = Number(body.amount)

    let paymentDate = new Date()
    if (body.paymentDate) {
      const d = new Date(body.paymentDate)
      if (!isNaN(d.getTime())) {
        paymentDate = d
      }
    }

    const payment = await db.salesPayment.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        invoiceId: body.invoiceId,
        amount,
        paymentDate,
        method: body.method ?? 'cash',
        reference: body.reference,
        bankAccountId: body.bankAccountId,
        safeId: body.safeId,
        status: status === 'posted' ? 'posted' : 'draft',
        notes: body.notes,
        createdBy: auth.userId,
      },
      include: { partner: true },
    })

    // If posted: post journal entry, update partner balance, update linked invoice.paid
    if (status === 'posted') {
      const je = await postJournalEntry({
        companyId: auth.companyId,
        branchId: requestedBranch,
        journalType: 'cash',
        postingDate: paymentDate,
        description: `سند قبض ${code}`,
        refType: 'sales_payment',
        refId: payment.id,
        lines: receiptPosting({ amount, partnerId: body.partnerId }),
        userId: auth.userId,
      })

      await db.salesPayment.update({
        where: { id: payment.id },
        data: { journalEntryId: je.id, status: 'posted' },
      })

      // Update partner.currentBalance (decrease AR)
      await db.partner.update({
        where: { id: body.partnerId },
        data: { currentBalance: { decrement: amount } },
      })

      // Update linked invoice.paid
      if (body.invoiceId) {
        const invoice = await db.salesInvoice.findFirst({
          where: { id: body.invoiceId, companyId: auth.companyId },
        })
        if (invoice) {
          const newPaid = invoice.paid + amount
          await db.salesInvoice.update({
            where: { id: invoice.id },
            data: {
              paid: newPaid,
              status: newPaid >= invoice.total ? 'paid' : 'partially_paid',
            },
          })
        }
      }
    }

    const result = await db.salesPayment.findFirst({
      where: { id: payment.id, companyId: auth.companyId },
      include: { partner: true },
    })
    return created(result)
  } catch (e: any) {
    return serverError(e.message)
  }
}
