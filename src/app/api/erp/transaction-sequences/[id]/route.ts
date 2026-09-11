// =============================================================================
// API: /api/erp/transaction-sequences/[id]
// Methods: GET (Details), PUT (Update), DELETE (Safe Delete)
// =============================================================================

import { ok, badRequest, notFound, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getTransactionSequenceById,
  updateTransactionSequence,
  deleteTransactionSequence,
} from '@/lib/erp/transaction-sequence-service'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await getTransactionSequenceById(id, auth.companyId)
    if (!item) {
      return notFound('تسلسل العمليات غير موجود')
    }

    return ok(item)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences/[id] GET]', error)
    return serverError(error.message)
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('بيانات الطلب غير صالحة')
    }

    const payload = sanitizeTenantPayload(body, auth)
    const updated = await updateTransactionSequence(id, auth.companyId, payload, auth.userId)
    return ok(updated)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences/[id] PUT]', error)
    return badRequest(error.message || 'فشل تحديث تسلسل العمليات')
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const result = await deleteTransactionSequence(id, auth.companyId, auth.userId)
    return ok(result)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences/[id] DELETE]', error)
    return badRequest(error.message || 'فشل حذف تسلسل العمليات')
  }
}

