import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-returns
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const partnerId = url.searchParams.get('partnerId')

    const baseWhere: any = {}
    if (q) baseWhere.OR = [{ code: { contains: q } }, { reason: { contains: q } }, { notes: { contains: q } }]
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.salesReturn.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, nameEn: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.salesReturn.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/sales-returns — create (draft by default; no posting yet)
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('partnerId is required')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const productIds = (body.lines ?? []).map((l: any) => l.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      branchId: requestedBranch,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    if (body.originalInvoiceId) {
      const orig = await db.salesInvoice.findFirst({
        where: { id: body.originalInvoiceId, companyId: auth.companyId },
      })
      if (!orig) return badRequest('الفاتورة الأصلية غير موجودة أو تابعة لشركة أخرى / Original invoice not found in tenant')
    }

    // Generate code SR-YYYY-NNNNN scoped to company
    const year = new Date().getFullYear()
    const count = await db.salesReturn.count({ where: { companyId: auth.companyId } })
    let seq = count + 1
    let code = `SR-${year}-${String(seq).padStart(5, '0')}`
    while (await db.salesReturn.findFirst({ where: { code, companyId: auth.companyId } })) {
      seq += 1
      code = `SR-${year}-${String(seq).padStart(5, '0')}`
    }

    // Compute totals from lines
    const lines = body.lines ?? []
    let subtotal = 0
    let taxTotal = 0
    const processedLines = lines.map((l: any) => {
      const lineSub = (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)
      const lineTax = lineSub * ((Number(l.taxRate) || 0) / 100)
      const total = lineSub + lineTax
      subtotal += lineSub
      taxTotal += lineTax
      return {
        productId: l.productId,
        description: l.description,
        quantity: Number(l.quantity) || 0,
        uomId: l.uomId,
        unitPrice: Number(l.unitPrice) || 0,
        taxRate: Number(l.taxRate) || 0,
        total,
      }
    })
    const total = subtotal + taxTotal

    const ret = await db.salesReturn.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        originalInvoiceId: body.originalInvoiceId || null,
        date: body.date ? new Date(body.date) : new Date(),
        reason: body.reason,
        status: body.status ?? 'draft',
        subtotal,
        taxTotal,
        total,
        notes: body.notes,
        createdBy: auth.userId,
        lines: { create: processedLines },
      },
      include: {
        partner: true,
        lines: { include: { product: true } },
      },
    })
    return created(ret)
  } catch (e: any) {
    return serverError(e.message)
  }
}
