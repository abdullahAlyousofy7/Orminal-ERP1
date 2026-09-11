import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'expenses', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.expense.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        bankAccount: { select: { id: true, nameAr: true, bankName: true } },
        safe: { select: { id: true, nameAr: true, code: true } },
      },
    })
    if (!item) return notFound('Expense not found')

    if (item.branchId && !auth.authorizedBranchIds.includes(item.branchId)) {
      return notFound('Expense not found')
    }

    const mapped = {
      ...item,
      bankAccount: item.bankAccount ? {
        id: item.bankAccount.id,
        name: item.bankAccount.nameAr,
        bankName: item.bankAccount.bankName,
      } : null,
      safe: item.safe ? {
        id: item.safe.id,
        name: item.safe.nameAr,
        code: item.safe.code,
      } : null,
    }

    return ok(mapped)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'expenses', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.expense.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Expense not found')

    if (exists.branchId && !auth.authorizedBranchIds.includes(exists.branchId)) {
      return notFound('Expense not found')
    }

    const body = await req.json()
    const { id: _id, companyId: _cId, createdAt: _c, updatedAt: _u, ...rest } = body

    if (rest.branchId && !auth.authorizedBranchIds.includes(rest.branchId)) {
      return badRequest('Unauthorized branch specified')
    }

    if (rest.branchId || rest.bankAccountId || rest.safeId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        branchId: rest.branchId,
        bankAccountId: rest.bankAccountId,
        safeId: rest.safeId,
      })
      if (!fkCheck.valid) return fkCheck.error!
    }

    const updated = await db.expense.update({
      where: { id },
      data: rest,
      include: {
        bankAccount: { select: { id: true, nameAr: true, bankName: true } },
        safe: { select: { id: true, nameAr: true, code: true } },
      },
    })

    const mapped = {
      ...updated,
      bankAccount: updated.bankAccount ? {
        id: updated.bankAccount.id,
        name: updated.bankAccount.nameAr,
        bankName: updated.bankAccount.bankName,
      } : null,
      safe: updated.safe ? {
        id: updated.safe.id,
        name: updated.safe.nameAr,
        code: updated.safe.code,
      } : null,
    }

    return ok(mapped)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { resource: 'expenses', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.expense.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Expense not found')

    if (exists.branchId && !auth.authorizedBranchIds.includes(exists.branchId)) {
      return notFound('Expense not found')
    }

    await db.$transaction(async (tx) => {
      // If it was posted, refund the safe/bank account balance
      if (exists.status !== 'draft') {
        if (exists.bankAccountId) {
          await tx.bankAccount.update({
            where: { id: exists.bankAccountId },
            data: { balance: { increment: exists.amount } },
          })
        } else if (exists.safeId) {
          await tx.safe.update({
            where: { id: exists.safeId },
            data: { balance: { increment: exists.amount } },
          })
        }
      }

      await tx.expense.delete({ where: { id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
