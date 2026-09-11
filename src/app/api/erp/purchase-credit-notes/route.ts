import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const status = new URL(req.url).searchParams.get('status')
    const partnerId = new URL(req.url).searchParams.get('partnerId')

    const baseWhere: any = {}
    if (status) baseWhere.status = status
    if (partnerId) baseWhere.partnerId = partnerId
    if (q) {
      baseWhere.OR = [
        { code: { contains: q } },
        { reason: { contains: q } },
        { notes: { contains: q } },
      ]
    }

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.purchaseCreditNote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          partner: { select: { id: true, nameAr: true, nameEn: true, code: true, phone: true } },
        },
      }),
      db.purchaseCreditNote.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.partnerId) return badRequest('المورد مطلوب')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const fkCheck = await verifyTenantForeignKeys(auth, {
      partnerId: body.partnerId,
      branchId: requestedBranch,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const subtotal = Number(body.subtotal) || 0
    const taxTotal = Number(body.taxTotal) || 0
    const total = subtotal + taxTotal

    const code = await nextNumber('purchase_credit_note', auth.companyId, requestedBranch)

    const createdRecord = await db.purchaseCreditNote.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        partnerId: body.partnerId,
        invoiceId: body.invoiceId || null,
        date: body.date ? new Date(body.date) : new Date(),
        reason: body.reason,
        status: body.status ?? 'draft',
        subtotal,
        taxTotal,
        total,
        notes: body.notes,
      },
      include: { partner: true },
    })

    return created(createdRecord)
  } catch (e: any) {
    return serverError(e.message)
  }
}
