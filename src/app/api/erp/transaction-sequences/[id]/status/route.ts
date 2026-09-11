// =============================================================================
// API: /api/erp/transaction-sequences/[id]/status
// Method: PATCH (Toggle active status)
// =============================================================================

import { ok, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { toggleTransactionSequenceStatus } from '@/lib/erp/transaction-sequence-service'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => null)

    if (!body || typeof body.active !== 'boolean') {
      return badRequest('حقل الحالة الفعالة (active) مطلوب كقيمة منطقية (boolean)')
    }

    const updated = await toggleTransactionSequenceStatus(id, auth.companyId, body.active, auth.userId)
    return ok(updated)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences/[id]/status PATCH]', error)
    return badRequest(error.message || 'فشل تعديل حالة تسلسل العمليات')
  }
}

