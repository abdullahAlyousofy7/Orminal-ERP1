// =============================================================================
// API: /api/erp/transaction-sequences
// Methods: GET (List with filters/pagination), POST (Create sequence)
// Multi-Tenant Isolation: auth.companyId strictly enforced via requireAuthContext
// =============================================================================

import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  sanitizeTenantPayload,
  isAuthFailure,
} from '@/lib/erp/rbac'
import {
  getTransactionSequences,
  createTransactionSequence,
} from '@/lib/erp/transaction-sequence-service'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const moduleCode = url.searchParams.get('moduleCode') || undefined
    const dateDisplayMode = (url.searchParams.get('dateDisplayMode') as any) || undefined
    const branchId = url.searchParams.get('branchId') || undefined
    const activeParam = url.searchParams.get('active')
    const active = activeParam !== null && activeParam !== undefined ? activeParam === 'true' : undefined

    const result = await getTransactionSequences(auth.companyId, {
      search: q,
      moduleCode,
      active,
      dateDisplayMode,
      branchId,
      page,
      pageSize,
    })

    return list(result.items, result.total, page, pageSize)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences GET]', error)
    return serverError(error.message || 'حدث خطأ أثناء جلب تسلسلات العمليات')
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return badRequest('بيانات الطلب غير صالحة')
    }

    if (!body.sequenceDocTypeId) {
      return badRequest('نوع وثيقة التسلسل إجباري')
    }

    const payload = sanitizeTenantPayload(body, auth)
    const createdSeq = await createTransactionSequence(auth.companyId, payload as any, auth.userId)
    return created(createdSeq)
  } catch (error: any) {
    console.error('[API /api/erp/transaction-sequences POST]', error)
    return badRequest(error.message || 'فشل إنشاء تسلسل العمليات')
  }
}

