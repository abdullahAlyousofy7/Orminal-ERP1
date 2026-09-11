import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'bank_accounts', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.bankAccount.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        account: { select: { id: true, code: true, nameAr: true } },
      },
    })
    if (!item) return notFound('Bank account not found')

    // Build a mini statement from journal lines touching the linked GL account in this tenant
    let transactions: any[] = []
    if (item.accountId) {
      const lines = await db.journalLine.findMany({
        where: {
          accountId: item.accountId,
          entry: { companyId: auth.companyId },
        },
        include: {
          entry: {
            select: {
              id: true, code: true, postingDate: true, description: true, state: true,
            },
          },
        },
        orderBy: { entry: { postingDate: 'desc' } },
        take: 50,
      })
      transactions = lines.map((l) => ({
        code: l.entry?.code,
        date: l.entry?.postingDate,
        description: l.entry?.description,
        debit: l.debit,
        credit: l.credit,
        posted: l.entry?.state === 'posted',
      }))
    }
    return ok({ ...item, transactions })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'bank_accounts', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.bankAccount.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Bank account not found')

    const body = await req.json()
    const { id: _id, companyId: _cId, createdAt: _c, updatedAt: _u, ...rest } = body

    if (rest.accountId || rest.currencyId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        accountId: rest.accountId,
        currencyId: rest.currencyId,
      })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const updated = await db.bankAccount.update({
      where: { id },
      data: rest,
      include: { account: { select: { id: true, code: true, nameAr: true } } },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'bank_accounts', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.bankAccount.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Bank account not found')

    // Block if balance non-zero
    if (Math.abs(exists.balance) > 0.001) {
      return badRequest('Cannot delete: bank account has non-zero balance. Settle balance first.')
    }

    await db.bankAccount.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
