import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'safes', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.safe.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        account: { select: { id: true, code: true, nameAr: true } },
      },
    })
    if (!item) return notFound('Safe not found')

    if (item.branchId && !auth.authorizedBranchIds.includes(item.branchId)) {
      return notFound('Safe not found')
    }

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
    const auth = await requireAuthContext(req, { resource: 'safes', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.safe.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Safe not found')

    if (exists.branchId && !auth.authorizedBranchIds.includes(exists.branchId)) {
      return notFound('Safe not found')
    }

    const body = await req.json()
    const { id: _id, companyId: _cId, createdAt: _c, updatedAt: _u, ...rest } = body

    if (rest.branchId && !auth.authorizedBranchIds.includes(rest.branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    if (rest.branchId || rest.accountId || rest.currencyId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        branchId: rest.branchId,
        accountId: rest.accountId,
        currencyId: rest.currencyId,
      })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const updated = await db.safe.update({
      where: { id },
      data: rest,
      include: {
        account: { select: { id: true, code: true, nameAr: true } },
      },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'safes', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.safe.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Safe not found')

    if (exists.branchId && !auth.authorizedBranchIds.includes(exists.branchId)) {
      return notFound('Safe not found')
    }

    if (Math.abs(exists.balance) > 0.001) {
      return badRequest('Cannot delete: safe has non-zero balance. Settle balance first.')
    }

    await db.safe.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
