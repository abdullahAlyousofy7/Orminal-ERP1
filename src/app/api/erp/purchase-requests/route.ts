import { db } from '@/lib/db'
import { ok, created, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { nextNumber } from '@/lib/erp/number-sequence'
import {
  requireAuthContext,
  scopedWhere,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

// GET /api/erp/purchase-requests
export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')

    const baseWhere: any = {}
    if (q) baseWhere.code = { contains: q }
    if (status) baseWhere.status = status

    const where = scopedWhere(auth, baseWhere, { branchScoped: true })

    const [data, total] = await Promise.all([
      db.purchaseRequest.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          lines: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.purchaseRequest.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// POST — create (no posting)
export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'PUR', capability: 'canCreate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    if (!body.lines || body.lines.length === 0) return badRequest('lines are required')

    const requestedBranch = body.branchId || auth.branchId
    if (requestedBranch && !auth.authorizedBranchIds.includes(requestedBranch)) {
      return badRequest('الفرع المحدد غير مصرح به للمستخدم / Branch not authorized')
    }

    const productIds = body.lines.map((l: any) => l.productId).filter(Boolean)
    const fkCheck = await verifyTenantForeignKeys(auth, {
      branchId: requestedBranch,
      productIds,
    })
    if (!fkCheck.valid && fkCheck.error) return fkCheck.error

    const code = await nextNumber('purchase_request', auth.companyId, requestedBranch)

    const pr = await db.purchaseRequest.create({
      data: {
        companyId: auth.companyId,
        branchId: requestedBranch,
        code,
        requesterId: body.requesterId,
        department: body.department,
        requiredDate: body.requiredDate ? new Date(body.requiredDate) : undefined,
        status: body.status ?? 'draft',
        notes: body.notes,
        lines: {
          create: body.lines.map((l: any) => ({
            productId: l.productId,
            quantity: l.quantity,
            uomId: l.uomId,
            estimatedCost: l.estimatedCost,
            costCenterId: l.costCenterId,
            notes: l.notes,
          })),
        },
      },
      include: { lines: true },
    })
    return created(pr)
  } catch (e: any) {
    return serverError(e.message)
  }
}
