import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-quotations/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.salesQuotation.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        partner: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Quotation not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// PUT — update quotation details, status, or lines
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()

    const exists = await db.salesQuotation.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('Quotation not found')

    // If quotation is already converted, disallow modifications unless setting same status
    if (exists.status === 'converted' && body.status && body.status !== 'converted') {
      return badRequest('لا يمكن تعديل عرض سعر تم تحويله بالكامل / Cannot modify a converted quotation')
    }

    if (body.partnerId || body.branchId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        partnerId: body.partnerId,
        branchId: body.branchId,
      })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const dataToUpdate: any = {}

    if (body.partnerId !== undefined) dataToUpdate.partnerId = body.partnerId
    if (body.status !== undefined) dataToUpdate.status = body.status
    if (body.notes !== undefined) dataToUpdate.notes = body.notes
    if (body.convertedSalesOrderId !== undefined) dataToUpdate.convertedSalesOrderId = body.convertedSalesOrderId
    if (body.quotationDate !== undefined) {
      dataToUpdate.quotationDate = body.quotationDate ? new Date(body.quotationDate) : new Date()
    }
    if (body.validUntil !== undefined) {
      dataToUpdate.validUntil = body.validUntil ? new Date(body.validUntil) : null
    }

    // If lines are provided in request body, calculate line totals and update lines atomically
    if (Array.isArray(body.lines)) {
      const lineProductIds = body.lines.map((l: any) => l.productId).filter(Boolean)
      const linesFkCheck = await verifyTenantForeignKeys(auth, { productIds: lineProductIds })
      if (!linesFkCheck.valid && linesFkCheck.error) return linesFkCheck.error

      let subtotal = 0
      let taxTotal = 0
      const processedLines = body.lines.map((l: any) => {
        const lineSubtotal = (l.quantity || 0) * (l.unitPrice || 0) * (1 - (l.discountPercent || 0) / 100) - (l.discountAmount || 0)
        const lineTax = lineSubtotal * ((l.taxRate || 0) / 100)
        const total = lineSubtotal + lineTax
        subtotal += lineSubtotal
        taxTotal += lineTax
        return {
          productId: l.productId,
          description: l.description,
          quantity: l.quantity,
          uomId: l.uomId,
          unitPrice: l.unitPrice,
          discountPercent: l.discountPercent ?? 0,
          discountAmount: l.discountAmount ?? 0,
          taxCodeId: l.taxCodeId,
          taxRate: l.taxRate ?? 0,
          total,
        }
      })
      const total = subtotal + taxTotal - (body.discount ?? exists.discount ?? 0)

      dataToUpdate.subtotal = subtotal
      dataToUpdate.taxTotal = taxTotal
      dataToUpdate.total = total
      if (body.discount !== undefined) dataToUpdate.discount = body.discount

      await db.$transaction([
        db.salesQuotationLine.deleteMany({ where: { quotationId: exists.id } }),
        db.salesQuotation.update({
          where: { id: exists.id },
          data: {
            ...dataToUpdate,
            lines: { create: processedLines },
          },
        }),
      ])
    } else {
      if (body.discount !== undefined) {
        dataToUpdate.discount = body.discount
        dataToUpdate.total = exists.subtotal + exists.taxTotal - body.discount
      }
      await db.salesQuotation.update({
        where: { id: exists.id },
        data: dataToUpdate,
      })
    }

    const updated = await db.salesQuotation.findFirst({
      where: { id: exists.id, companyId: auth.companyId },
      include: { lines: true, partner: true },
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
    const exists = await db.salesQuotation.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Quotation not found')

    if (exists.status === 'converted') {
      return badRequest('لا يمكن حذف عرض سعر تم تحويله / Cannot delete a converted quotation')
    }

    await db.salesQuotation.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
