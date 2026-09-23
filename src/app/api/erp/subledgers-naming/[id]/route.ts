// Enterprise ERP — Subledgers Naming Detail API (GET / PUT / DELETE)
// Architectural Source: ADR-001, ADR-009, ADR-014

import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getSubledgerDefinitionById,
  updateSubledgerDefinition,
  deleteSubledgerDefinition,
} from '@/lib/erp/subledger-naming-service'

// GET /api/erp/subledgers-naming/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await getSubledgerDefinitionById(auth.companyId, id)

    if (!item) {
      return notFound('سجل تسمية الدليل الفرعي غير موجود')
    }

    return ok(item)
  } catch (err: any) {
    console.error('[subledgers-naming/[id] GET] Error:', err)
    return serverError(err.message || 'فشل في جلب بيانات الدليل الفرعي')
  }
}

// PUT /api/erp/subledgers-naming/[id]
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

    const updated = await updateSubledgerDefinition(
      auth.companyId,
      id,
      {
        nameAr: payload.nameAr?.trim(),
        nameEn: payload.nameEn !== undefined ? (payload.nameEn?.trim() || null) : undefined,
        description: payload.description !== undefined ? (payload.description?.trim() || null) : undefined,
        active: typeof payload.active === 'boolean' ? payload.active : undefined,
        variables: payload.variables !== undefined ? payload.variables : undefined,
        fields: Array.isArray(payload.fields) ? payload.fields : undefined,
      },
      auth.userId
    )

    return ok(updated)
  } catch (err: any) {
    console.error('[subledgers-naming/[id] PUT] Error:', err)
    return badRequest(err.message || 'فشل في تحديث بيانات الدليل الفرعي')
  }
}

// DELETE /api/erp/subledgers-naming/[id]
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const result = await deleteSubledgerDefinition(auth.companyId, id, auth.userId)

    return ok(result)
  } catch (err: any) {
    console.error('[subledgers-naming/[id] DELETE] Error:', err)
    return badRequest(err.message || 'فشل في حذف الدليل الفرعي')
  }
}
