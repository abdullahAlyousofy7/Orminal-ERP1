// Enterprise ERP — Sequence Document Types API (GET / POST)
// Master Data Registry defining WHAT document types can undergo document sequencing
// Source: ADR-009, ADR-014, ADR-016

import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getSequenceDocTypes,
  createSequenceDocType,
} from '@/lib/erp/sequence-doc-service'

// GET /api/erp/sequence-doc-types
// Pure, side-effect-free query (NO auto-seeding inside GET)
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const moduleCode = url.searchParams.get('moduleCode') || undefined
    const mainDocType = url.searchParams.get('mainDocType') || undefined
    const statusParam = url.searchParams.get('status')
    const active = statusParam === 'active' ? true : statusParam === 'inactive' ? false : undefined

    const { items, total } = await getSequenceDocTypes(auth.companyId, {
      search: q,
      moduleCode,
      mainDocType,
      active,
      skip,
      take: pageSize,
    })

    return list(items, total, page, pageSize)
  } catch (err: any) {
    console.error('[sequence-doc-types GET] Error:', err)
    return serverError(err.message || 'فشل في جلب أنواع وثائق التسلسل')
  }
}

// POST /api/erp/sequence-doc-types
// Create a new Sequence Document Type
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('بيانات الطلب غير صالحة')
    }

    const payload = sanitizeTenantPayload(body, auth)

    if (!payload.code || typeof payload.code !== 'string' || !payload.code.trim()) {
      return badRequest('رمز نوع الوثيقة (code) إجباري')
    }
    if (!payload.nameAr || typeof payload.nameAr !== 'string' || !payload.nameAr.trim()) {
      return badRequest('اسم نوع الوثيقة بالعربية (nameAr) إجباري')
    }
    if (!payload.docTypeKey || typeof payload.docTypeKey !== 'string' || !payload.docTypeKey.trim()) {
      return badRequest('المعرف التقني للوثيقة (docTypeKey) إجباري')
    }
    if (!payload.moduleCode || typeof payload.moduleCode !== 'string' || !payload.moduleCode.trim()) {
      return badRequest('رمز الوحدة/النظام (moduleCode) إجباري')
    }
    if (!payload.mainDocType || typeof payload.mainDocType !== 'string' || !payload.mainDocType.trim()) {
      return badRequest('التصنيف الرئيسي للوثيقة (mainDocType) إجباري')
    }

    const item = await createSequenceDocType(
      auth.companyId,
      {
        code: payload.code.trim(),
        docTypeKey: payload.docTypeKey.trim(),
        nameAr: payload.nameAr.trim(),
        nameEn: payload.nameEn ? String(payload.nameEn).trim() : null,
        moduleCode: payload.moduleCode.trim(),
        mainDocType: payload.mainDocType.trim(),
        affectsFinancial: Boolean(payload.affectsFinancial),
        affectsInventory: Boolean(payload.affectsInventory),
        postingProfileCode: payload.postingProfileCode ? String(payload.postingProfileCode).trim() : null,
        requiresApproval: Boolean(payload.requiresApproval),
        active: payload.active !== undefined ? Boolean(payload.active) : true,
        sortOrder: typeof payload.sortOrder === 'number' ? payload.sortOrder : 0,
        notes: payload.notes ? String(payload.notes).trim() : null,
      },
      auth.userId
    )

    return created(item)
  } catch (err: any) {
    console.error('[sequence-doc-types POST] Error:', err)
    return badRequest(err.message || 'فشل في إنشاء نوع وثيقة التسلسل')
  }
}
