import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.salesInvoice.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        partner: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Sales invoice not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()

    // Find scoped to current tenant — anti-enumeration 404
    const exists = await db.salesInvoice.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Sales invoice not found')

    // ADR-018: Immutable posted documents — edits only permitted on draft
    if (exists.status !== 'draft') {
      return badRequest('فقط فواتير المسودة يمكن تعديلها / Only draft sales invoices can be edited')
    }

    // Constraint 4: Verify FKs if partnerId or branchId updated
    if (body.partnerId || body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        partnerId: body.partnerId,
        branchId: body.branchId,
      })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body

    const updated = await db.salesInvoice.update({
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
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.salesInvoice.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Sales invoice not found')

    if (exists.status !== 'draft') {
      return badRequest('فقط فواتير المسودة يمكن حذفها / Only draft sales invoices can be deleted')
    }

    await db.salesInvoice.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
