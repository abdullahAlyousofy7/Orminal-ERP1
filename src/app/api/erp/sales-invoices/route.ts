import { db } from '@/lib/db'
import { ok, created, list, badRequest, notFound, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import { postJournalEntry, salesInvoicePosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/sales-invoices
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
    if (q) baseWhere.OR = [{ code: { contains: q } }, { notes: { contains: q } }]
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.salesInvoice.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, nameEn: true, code: true } },
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.salesInvoice.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST /api/erp/sales-invoices — create + post journal entry (Dr AR / Cr Sales Revenue + Output VAT)
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SAL', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('partnerId is required')
    if (!body.lines || body.lines.length === 0) return badRequest('lines are required')

    // Determine and validate branch
    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    // Constraint 4: Cross-Tenant Foreign Key Integrity
    const productIds = body.lines.map((l: any) => l.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      branchId: requestedBranch,
      salesOrderId: body.salesOrderId,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('sales_invoice', auth.companyId, requestedBranch)

    let subtotal = 0
    let taxTotal = 0
    const processedLines = body.lines.map((l: any) => {
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

    const status = body.status ?? 'posted'

    // Create invoice (atomic)
    const invoice = await db.salesInvoice.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        salesOrderId: body.salesOrderId,
        invoiceDate: body.invoiceDate ? new Date(body.invoiceDate) : new Date(),
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        currencyId: body.currencyId,
        paymentTermId: body.paymentTermId,
        status: status === 'posted' ? 'posted' : 'draft',
        subtotal,
        taxTotal,
        discount: body.discount ?? 0,
        total,
        paid: 0,
        notes: body.notes,
        createdBy: auth.userId,
        lines: { create: processedLines },
      },
      include: { lines: true, partner: true },
    })

    // Post to general ledger if status is posted
    if (status === 'posted') {
      try {
        const postingLines = salesInvoicePosting({
          total,
          subtotal,
          taxTotal,
          partnerId: body.partnerId,
        })
        const je = await postJournalEntry({
          companyId: auth.companyId,
          branchId: requestedBranch,
          journalType: 'sale',
          postingDate: invoice.invoiceDate,
          description: `فاتورة مبيعات ${code}`,
          refType: 'sales_invoice',
          refId: invoice.id,
          lines: postingLines,
          userId: auth.userId,
        })
        await db.salesInvoice.update({
          where: { id: invoice.id },
          data: { journalEntryId: je.id },
        })

        // Update partner receivable balance
        await db.partner.update({
          where: { id: body.partnerId },
          data: { currentBalance: { increment: total } },
        })
      } catch (err: any) {
        console.error('Accounting posting failed for sales invoice:', err.message)
      }
    }

    return created(invoice)
  } catch (e: any) {
    return serverError(e.message)
  }
}
