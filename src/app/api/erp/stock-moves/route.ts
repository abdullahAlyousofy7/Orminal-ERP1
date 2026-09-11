import { db } from '@/lib/db'
import { list, serverError, parsePagination } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  scopedWhere,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { page, pageSize, skip } = parsePagination(req)
    const url = new URL(req.url)
    const productId = url.searchParams.get('productId')
    const warehouseId = url.searchParams.get('warehouseId')
    const documentType = url.searchParams.get('documentType')
    const state = url.searchParams.get('state')
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')

    const baseWhere: any = {}
    if (productId) baseWhere.productId = productId
    if (documentType) baseWhere.documentType = documentType
    if (state) baseWhere.state = state
    if (warehouseId) {
      baseWhere.OR = [{ sourceWarehouseId: warehouseId }, { destWarehouseId: warehouseId }]
    }
    if (from || to) {
      baseWhere.postingDate = {}
      if (from) baseWhere.postingDate.gte = new Date(from)
      if (to) baseWhere.postingDate.lte = new Date(to)
    }

    const where = scopedWhere(auth, baseWhere)

    const [data, total] = await Promise.all([
      db.stockMove.findMany({
        where,
        orderBy: { postingDate: 'desc' },
        skip,
        take: pageSize,
        include: {
          product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
          sourceWarehouse: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          destWarehouse: { select: { id: true, code: true, nameAr: true, nameEn: true } },
          lot: { select: { id: true, lotNumber: true } },
        },
      }),
      db.stockMove.count({ where }),
    ])
    return list(data, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}
