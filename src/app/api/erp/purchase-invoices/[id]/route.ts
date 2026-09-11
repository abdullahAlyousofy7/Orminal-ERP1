import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { reverseJournalEntry } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.purchaseInvoice.findFirst({
      where: { id, companyId: auth.companyId },
      include: { partner: true, lines: { include: { product: true } } },
    })
    if (!item) return notFound('Purchase invoice not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.purchaseInvoice.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Purchase invoice not found')
    if (exists.status !== 'draft') return badRequest('Only draft invoices can be edited')

    if (body.partnerId || body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        partnerId: body.partnerId,
        branchId: body.branchId,
      })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body
    const updated = await db.purchaseInvoice.update({
      where: { id: exists.id },
      data: rest,
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.purchaseInvoice.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Purchase invoice not found')
    if (exists.status !== 'draft') return badRequest('Only draft invoices can be deleted')

    await db.purchaseInvoice.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canReverse' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const action = body.action
    if (action !== 'reverse') return badRequest('Use action=reverse')

    const invoice = await db.purchaseInvoice.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!invoice) return notFound('Purchase invoice not found')
    if (invoice.status !== 'posted') return badRequest('Only posted invoices can be reversed')
    if (!invoice.journalEntryId) return badRequest('No journal entry to reverse')

    const reversal = await reverseJournalEntry(
      invoice.journalEntryId,
      auth.userId,
      `عكس فاتورة مشتريات ${invoice.code}`
    )

    await db.purchaseInvoice.update({
      where: { id: invoice.id },
      data: { status: 'reversed' },
    })
    await db.partner.update({
      where: { id: invoice.partnerId },
      data: { currentBalance: { decrement: invoice.total } },
    })

    return ok({ success: true, reversalEntryId: reversal.id, reversalCode: reversal.code })
  } catch (e: any) {
    return serverError(e.message)
  }
}
