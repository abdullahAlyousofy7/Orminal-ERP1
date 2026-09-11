import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { postJournalEntry, SYSTEM_ACCOUNTS } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canReverse' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const reason = body.reason || 'عكس سند صرف بناءً على طلب محاسبي'

    const payment = await db.purchasePayment.findFirst({
      where: { id, companyId: auth.companyId },
      include: { partner: true },
    })

    if (!payment) return notFound('Payment not found')
    if (payment.status !== 'posted') {
      return badRequest('Only posted payments can be reversed')
    }

    // Determine cash/bank account code
    let cashOrBankAccountCode: string = SYSTEM_ACCOUNTS.CASH // '1000'
    if (payment.method === 'transfer' || payment.method === 'card' || payment.bankAccountId) {
      cashOrBankAccountCode = SYSTEM_ACCOUNTS.CASH_BANK // '1020'
    } else if (payment.safeId) {
      cashOrBankAccountCode = SYSTEM_ACCOUNTS.CASH_SAFE // '1010'
    }

    // Create automated reversal journal entry
    const reversalLines = [
      {
        accountCode: cashOrBankAccountCode,
        debit: payment.amount,
        credit: 0,
        description: `عكس مدفوعات نقدية/بانكية لسند الصرف ${payment.code}`,
      },
      {
        accountCode: SYSTEM_ACCOUNTS.AP, // '2000' - Accounts Payable (Supplier)
        debit: 0,
        credit: payment.amount,
        partnerId: payment.partnerId,
        description: `عكس سداد مديونية مورد لسند الصرف ${payment.code}`,
      },
    ]

    const je = await postJournalEntry({
      companyId: auth.companyId,
      branchId: payment.branchId || undefined,
      journalType: 'cash',
      postingDate: new Date(),
      description: `قيد عكسي لسند الصرف ${payment.code} — السبب: ${reason}`,
      refType: 'purchase_payment_reversal',
      refId: payment.id,
      lines: reversalLines,
      userId: auth.userId,
    })

    // Increase supplier balance back (increment AP balance)
    await db.partner.update({
      where: { id: payment.partnerId },
      data: { currentBalance: { increment: payment.amount } },
    })

    // If payment was linked to a purchase invoice, reduce paid amount and adjust invoice status
    if (payment.invoiceId) {
      const invoice = await db.purchaseInvoice.findFirst({
        where: { id: payment.invoiceId, companyId: auth.companyId },
      })
      if (invoice) {
        const newPaid = Math.max(0, invoice.paid - payment.amount)
        let newStatus = invoice.status
        if (newPaid <= 0) {
          newStatus = 'posted'
        } else if (newPaid < invoice.total) {
          newStatus = 'partially_paid'
        }
        await db.purchaseInvoice.update({
          where: { id: payment.invoiceId },
          data: {
            paid: newPaid,
            status: newStatus,
          },
        })
      }
    }

    // Update payment status to 'reversed'
    const updatedNotes = payment.notes
      ? `${payment.notes}\n[عكس السند]: ${reason}`
      : `[عكس السند]: ${reason}`

    const updatedPayment = await db.purchasePayment.update({
      where: { id: payment.id },
      data: {
        status: 'reversed',
        notes: updatedNotes,
      },
      include: { partner: true },
    })

    return ok({
      success: true,
      payment: updatedPayment,
      reversalJournalEntryId: je.id,
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}
