// Enterprise ERP — Subledger Dynamic Label Resolution API
// High-performance cached endpoint for consumers and front-end hooks
// Architectural Source: ADR-001, ADR-009, ADR-014

import { ok, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { getSubledgerBundle } from '@/lib/erp/subledger-label-service'

// GET /api/erp/subledgers-naming/resolve
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const locale = url.searchParams.get('locale') || 'ar'

    const bundle = await getSubledgerBundle(auth.companyId, locale)
    return ok(bundle)
  } catch (err: any) {
    console.error('[subledgers-naming/resolve GET] Error:', err)
    return serverError(err.message || 'فشل في حل مسميات الأدلة الفرعية')
  }
}
