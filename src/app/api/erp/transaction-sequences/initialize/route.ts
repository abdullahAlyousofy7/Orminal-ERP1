// =============================================================================
// API: /api/erp/transaction-sequences/initialize
// Method: POST
// Idempotent initialization of standard transaction sequences for company
// =============================================================================

import { ok, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { initializeStandardSequences } from '@/lib/erp/transaction-sequence-service'

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const result = await initializeStandardSequences(auth.companyId, auth.userId)
    return ok(result)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences/initialize POST]', error)
    return serverError(error.message || 'فشلت تهيئة تسلسلات العمليات القياسية')
  }
}

