import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, created, list, badRequest, notFound, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-quotations
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
    if (q) {
      baseWhere.OR = [{ code: { contains: q } }, { notes: { contains: q } }]
    }
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })
    const companyScope = { companyId: auth.companyId }

    const [data, total, totalAll, acceptedCount, pendingCount, convertedCount] = await Promise.all([
      db.salesQuotation.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, nameEn: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true, nameEn: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.salesQuotation.count({ where }),
      db.salesQuotation.count({ where: companyScope }),
      db.salesQuotation.count({ where: { ...companyScope, OR: [{ status: 'accepted' }, { status: 'converted' }] } }),
      db.salesQuotation.count({ where: { ...companyScope, OR: [{ status: 'draft' }, { status: 'sent' }] } }),
      db.salesQuotation.count({ where: { ...companyScope, status: 'converted' } }),
    ])

    const totalPages = Math.ceil(total / pageSize) || 1
    return NextResponse.json({
      data,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: { page, pageSize, total, totalPages, hasMore: page < totalPages },
        stats: { total: totalAll, accepted: acceptedCount, pending: pendingCount, converted: convertedCount },
      },
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/sales-quotations — create (no posting, no stock)
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

    const code = await nextNumber('sales_quotation', auth.companyId, requestedBranch)

    // Compute totals from lines
    const lines = body.lines ?? []
    let subtotal = 0
    let taxTotal = 0
    const processedLines = lines.map((l: any) => {
      const lineSubtotal = (l.quantity || 0) * (l.unitPrice || 0) * (1 - (l.discountPercent || 0) / 100) - (l.discountAmount || 0)
      const lineTax = lineSubtotal * ((l.taxRate || 0) / 100)
      const total = lineSubtotal + lineTax
      subtotal += lineSubtotal
      taxTotal += lineTax
      return {
        productId: l.productId,
        description: l.description,
        quantity: l.quantity,
        uomId: l.uomId,
        unitPrice: l.unitPrice,
        discountPercent: l.discountPercent ?? 0,
        discountAmount: l.discountAmount ?? 0,
        taxCodeId: l.taxCodeId,
        taxRate: l.taxRate ?? 0,
        total,
      }
    })
    const total = subtotal + taxTotal - (body.discount ?? 0)

    const quotation = await db.salesQuotation.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        quotationDate: body.quotationDate ? new Date(body.quotationDate) : new Date(),
        validUntil: body.validUntil ? new Date(body.validUntil) : undefined,
        priceListId: body.priceListId,
        currencyId: body.currencyId,
        status: body.status ?? 'draft',
        subtotal,
        taxTotal,
        discount: body.discount ?? 0,
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
    return created(quotation)
  } catch (e: any) {
    return serverError(e.message)
  }
}
