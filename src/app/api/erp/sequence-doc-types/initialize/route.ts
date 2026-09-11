// Enterprise ERP — Standard Sequence Document Catalog Initialization API
// Explicit, Idempotent Seeding endpoint for Tenant/Company Master Data
// Source: ADR-009, ADR-014, ADR-016

import { ok, badRequest, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { initializeStandardCatalog } from '@/lib/erp/sequence-doc-service'

// POST /api/erp/sequence-doc-types/initialize
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const result = await initializeStandardCatalog(auth.companyId, auth.userId)

    return ok({
      success: true,
      message: `تمت تهيئة الكتالوج القياسي بنجاح (تم إنشاء ${result.createdCount} وثيقة جديدة، و${result.existingCount} وثيقة كانت موجودة مسبقاً)`,
      ...result,
    })
  } catch (err: any) {
    console.error('[sequence-doc-types initialize POST] Error:', err)
    return serverError(err.message || 'فشل في تهيئة الكتالوج القياسي لأنواع الوثائق')
  }
}
