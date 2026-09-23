// Enterprise ERP — Subledgers Naming API (GET / POST)
// Single Source of Truth for Subledger Display Labels and Configuration
// Architectural Source: ADR-001, ADR-009, ADR-014, ADR-016

import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getSubledgerDefinitions,
  createSubledgerDefinition,
} from '@/lib/erp/subledger-naming-service'

// GET /api/erp/subledgers-naming
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const subledgerType = url.searchParams.get('subledgerType') || undefined
    const statusParam = url.searchParams.get('status')
    const active = statusParam === 'active' ? true : statusParam === 'inactive' ? false : undefined

    const { total, items } = await getSubledgerDefinitions(auth.companyId, {
      search: q,
      subledgerType,
      active,
      skip,
      take: pageSize,
    })

    return list(items, total, page, pageSize)
  } catch (err: any) {
    console.error('[subledgers-naming GET] Error:', err)
    return serverError(err.message || 'فشل في استرجاع تسميات الأدلة الفرعية')
  }
}

// POST /api/erp/subledgers-naming
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('بيانات الطلب غير صالحة')
    }

    const payload = sanitizeTenantPayload(body, auth)

    if (!payload.subledgerType || typeof payload.subledgerType !== 'string') {
      return badRequest('نوع الدليل الفرعي مطلوب (subledgerType)')
    }

    if (!payload.nameAr || typeof payload.nameAr !== 'string') {
      return badRequest('الاسم باللغة العربية مطلوب (nameAr)')
    }

    const item = await createSubledgerDefinition(
      auth.companyId,
      {
        subledgerType: payload.subledgerType.trim().toUpperCase(),
        numericId: payload.numericId ? Number(payload.numericId) : undefined,
        nameAr: payload.nameAr.trim(),
        nameEn: payload.nameEn?.trim() || undefined,
        description: payload.description?.trim() || undefined,
        variables: payload.variables,
        fields: Array.isArray(payload.fields) ? payload.fields : undefined,
      },
      auth.userId
    )

    return created(item)
  } catch (err: any) {
    console.error('[subledgers-naming POST] Error:', err)
    return badRequest(err.message || 'فشل في إنشاء تسمية الدليل الفرعي')
  }
}
