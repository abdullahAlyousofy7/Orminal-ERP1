import { db } from '@/lib/db'
import { ok, notFound, badRequest, forbidden, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  checkCapability,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.productionOrder.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
        bom: { select: { id: true, code: true, nameAr: true } },
      },
    })
    if (!item) return notFound('Production order not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.productionOrder.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Production order not found')

    const { action } = body
    if (action) {
      // Action-based transitions: release / complete / close / cancel
      let newStatus = exists.status
      let patch: any = {}
      if (action === 'release') {
        if (!['draft', 'planned'].includes(exists.status)) {
          return badRequest(`لا يمكن تحرير أمر بحالة ${exists.status}`)
        }
        newStatus = 'released'
        patch.actualStart = new Date()
      } else if (action === 'complete') {
        if (!['released', 'in_progress'].includes(exists.status)) {
          return badRequest(`لا يمكن إكمال أمر بحالة ${exists.status}`)
        }
        newStatus = 'produced'
        patch.actualEnd = new Date()
        patch.producedQty = body.producedQty !== undefined ? Number(body.producedQty) : exists.quantity
      } else if (action === 'close') {
        if (!['produced', 'costed'].includes(exists.status)) {
          return badRequest(`لا يمكن إغلاق أمر بحالة ${exists.status}`)
        }
        newStatus = 'closed'
      } else if (action === 'cancel') {
        const canCancel = await checkCapability(auth, 'MFG', 'canCancel')
        if (!canCancel.allowed) {
          return forbidden('صلاحية الإلغاء غير متوفرة لهذا الحساب', 'INSUFFICIENT_PERMISSION')
        }
        newStatus = 'cancelled'
      } else {
        return badRequest(`إجراء غير معروف: ${action}`)
      }
      patch.status = newStatus
      const updated = await db.productionOrder.update({ where: { id }, data: patch })
      return ok(updated)
    }

    // Plain update
    const { id: _id, companyId: _c, createdAt: _c2, updatedAt: _u, ...rest } = body
    if (rest.quantity !== undefined) rest.quantity = Number(rest.quantity) || 0
    if (rest.plannedStart) rest.plannedStart = new Date(rest.plannedStart)
    if (rest.plannedEnd) rest.plannedEnd = new Date(rest.plannedEnd)
    const updated = await db.productionOrder.update({ where: { id }, data: rest })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.productionOrder.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Production order not found')
    if (['released', 'in_progress', 'produced', 'closed'].includes(exists.status)) {
      return badRequest('لا يمكن حذف أمر إنتاج تم تحريره')
    }
    await db.productionOrder.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
