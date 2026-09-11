import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
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
    const item = await db.purchaseOrder.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        partner: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Purchase order not found')
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
    const body = await req.json().catch(() => ({}))

    const exists = await db.purchaseOrder.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('أمر الشراء غير موجود')

    // Prevent modifying orders that are already processed or finalized
    if (exists.status === 'received' || exists.status === 'paid' || exists.status === 'cancelled') {
      if (body.status && Object.keys(body).filter((k) => k !== 'status' && k !== 'action').length === 0) {
        const updatedStatus = await db.purchaseOrder.update({
          where: { id: exists.id },
          data: { status: body.status },
          include: { partner: true, lines: { include: { product: true } } },
        })
        return ok(updatedStatus)
      }
      return badRequest('لا يمكن تعديل بنود أو إجماليات أمر شراء مستلم أو مدفوع أو ملغي.')
    }

    if (body.partnerId || body.branchId || body.warehouseId) {
      const fkCheck = await verifyTenantForeignKeys(auth, {
        partnerId: body.partnerId,
        branchId: body.branchId,
        warehouseId: body.warehouseId,
      })
      if (!fkCheck.valid && fkCheck.error) return fkCheck.error
    }

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, orderDate, expectedDate, ...rest } = body

    const updateData: any = {
      ...rest,
    }

    if (orderDate) {
      updateData.orderDate = new Date(orderDate)
    }
    if (expectedDate !== undefined) {
      updateData.expectedDate = expectedDate ? new Date(expectedDate) : null
    }

    const result = await db.$transaction(async (tx) => {
      if (lines && Array.isArray(lines)) {
        const validLines = lines.filter((l: any) => l.productId && Number(l.quantity) > 0)
        const lineProductIds = validLines.map((l: any) => l.productId)
        const linesFkCheck = await verifyTenantForeignKeys(auth, { productIds: lineProductIds })
        if (!linesFkCheck.valid && linesFkCheck.error) throw new Error('TENANT_FK_VIOLATION')

        await tx.purchaseOrderLine.deleteMany({ where: { orderId: exists.id } })

        let subtotal = 0
        let taxTotal = 0
        const processedLines = validLines.map((l: any) => {
          const qty = Math.max(0, Number(l.quantity) || 0)
          const cost = Math.max(0, Number(l.unitCost) || 0)
          const discPercent = Math.max(0, Number(l.discountPercent) || 0)
          const discAmount = Math.max(0, Number(l.discountAmount) || 0)
          const taxRate = Math.max(0, Number(l.taxRate) || 0)

          const lineSubtotal = Math.max(0, qty * cost * (1 - discPercent / 100) - discAmount)
          const lineTax = lineSubtotal * (taxRate / 100)
          const lineTotal = lineSubtotal + lineTax

          subtotal += lineSubtotal
          taxTotal += lineTax

          return {
            productId: l.productId,
            description: l.description || null,
            quantity: qty,
            uomId: l.uomId || null,
            unitCost: cost,
            discountPercent: discPercent,
            discountAmount: discAmount,
            taxCodeId: l.taxCodeId || null,
            taxRate: taxRate,
            total: lineTotal,
          }
        })

        const overallDiscount = Math.max(0, Number(body.discount ?? exists.discount) || 0)
        const total = Math.max(0, subtotal + taxTotal - overallDiscount)

        updateData.subtotal = subtotal
        updateData.taxTotal = taxTotal
        updateData.discount = overallDiscount
        updateData.total = total
        updateData.lines = { create: processedLines }
      }

      return tx.purchaseOrder.update({
        where: { id: exists.id },
        data: updateData,
        include: {
          partner: true,
          lines: { include: { product: true } },
        },
      })
    })

    return ok(result)
  } catch (e: any) {
    if (e.message === 'TENANT_FK_VIOLATION') {
      return badRequest('خطأ في سلامة البيانات: أحد الأصناف ينتمي لشركة أخرى')
    }
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.purchaseOrder.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('أمر الشراء غير موجود')

    if (exists.status === 'received' || exists.status === 'paid') {
      return badRequest('لا يمكن حذف أمر شراء مستلم أو مدفوع.')
    }

    await db.$transaction(async (tx) => {
      await tx.purchaseOrderLine.deleteMany({ where: { orderId: exists.id } })
      await tx.purchaseOrder.delete({ where: { id: exists.id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
