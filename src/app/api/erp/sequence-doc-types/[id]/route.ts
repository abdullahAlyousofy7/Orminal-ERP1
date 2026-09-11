// Enterprise ERP — Sequence Document Type [id] API (GET / PUT / DELETE)
// Master Data Registry with Safe Deletion & Immutability Governance
// Source: ADR-009, ADR-014, ADR-016

import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getSequenceDocTypeById,
  updateSequenceDocType,
  deleteSequenceDocType,
} from '@/lib/erp/sequence-doc-service'

// GET /api/erp/sequence-doc-types/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await getSequenceDocTypeById(id, auth.companyId)

    if (!item) {
      return notFound('نوع وثيقة التسلسل غير موجود')
    }

    return ok(item)
  } catch (err: any) {
    console.error('[sequence-doc-types/[id] GET] Error:', err)
    return serverError(err.message || 'فشل في جلب تفاصيل نوع وثيقة التسلسل')
  }
}

// PUT /api/erp/sequence-doc-types/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('بيانات الطلب غير صالحة')
    }

    const payload = sanitizeTenantPayload(body, auth)

    const updated = await updateSequenceDocType(
      id,
      auth.companyId,
      {
        ...(payload.code !== undefined && { code: String(payload.code).trim() }),
        ...(payload.docTypeKey !== undefined && { docTypeKey: String(payload.docTypeKey).trim() }),
        ...(payload.nameAr !== undefined && { nameAr: String(payload.nameAr).trim() }),
        ...(payload.nameEn !== undefined && { nameEn: payload.nameEn ? String(payload.nameEn).trim() : null }),
        ...(payload.moduleCode !== undefined && { moduleCode: String(payload.moduleCode).trim() }),
        ...(payload.mainDocType !== undefined && { mainDocType: String(payload.mainDocType).trim() }),
        ...(payload.affectsFinancial !== undefined && { affectsFinancial: Boolean(payload.affectsFinancial) }),
        ...(payload.affectsInventory !== undefined && { affectsInventory: Boolean(payload.affectsInventory) }),
        ...(payload.postingProfileCode !== undefined && {
          postingProfileCode: payload.postingProfileCode ? String(payload.postingProfileCode).trim() : null,
        }),
        ...(payload.requiresApproval !== undefined && { requiresApproval: Boolean(payload.requiresApproval) }),
        ...(payload.active !== undefined && { active: Boolean(payload.active) }),
        ...(payload.sortOrder !== undefined && { sortOrder: Number(payload.sortOrder) }),
        ...(payload.notes !== undefined && { notes: payload.notes ? String(payload.notes).trim() : null }),
      },
      auth.userId
    )

    return ok(updated)
  } catch (err: any) {
    console.error('[sequence-doc-types/[id] PUT] Error:', err)
    return badRequest(err.message || 'فشل في تحديث نوع وثيقة التسلسل')
  }
}

// DELETE /api/erp/sequence-doc-types/[id]
// Safe deletion: rejects if any transactions or counter sequences exist
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params

    await deleteSequenceDocType(id, auth.companyId, auth.userId)

    return ok({ success: true, message: 'تم حذف نوع وثيقة التسلسل بنجاح' })
  } catch (err: any) {
    console.error('[sequence-doc-types/[id] DELETE] Error:', err)
    return badRequest(err.message || 'فشل في حذف نوع وثيقة التسلسل')
  }
}
