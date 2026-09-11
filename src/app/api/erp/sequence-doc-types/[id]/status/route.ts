// Enterprise ERP — Sequence Document Type Status Toggle API (PATCH)
// Source: ADR-009, ADR-014, ADR-016

import { ok, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import { toggleSequenceDocTypeStatus } from '@/lib/erp/sequence-doc-service'

// PATCH /api/erp/sequence-doc-types/[id]/status
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object' || body.active === undefined) {
      return badRequest('حقل الحالة (active) مطلوب')
    }

    const payload = sanitizeTenantPayload(body, auth)
    const active = Boolean(payload.active)

    const updated = await toggleSequenceDocTypeStatus(id, auth.companyId, active, auth.userId)

    return ok(updated)
  } catch (err: any) {
    console.error('[sequence-doc-types/[id]/status PATCH] Error:', err)
    return badRequest(err.message || 'فشل في تغيير حالة نوع وثيقة التسلسل')
  }
}
