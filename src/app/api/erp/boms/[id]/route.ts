import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  verifyTenantForeignKeys,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.bom.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        product: { select: { id: true, sku: true, nameAr: true, nameEn: true } },
        components: { include: { product: { select: { id: true, sku: true, nameAr: true } } } },
      },
    })
    if (!item) return notFound('BOM not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.bom.findFirst({ where: { id, companyId: auth.companyId } })
    if (!exists) return notFound('BOM not found')

    const { id: _id, companyId: _c, components, createdAt: _c2, updatedAt: _u, ...rest } = body
    if (rest.quantity !== undefined) rest.quantity = Number(rest.quantity) || 1
    if (rest.version !== undefined) rest.version = Number(rest.version) || 1

    if (rest.productId && rest.productId !== exists.productId) {
      const fkCheck = await verifyTenantForeignKeys(auth, { productId: rest.productId })
      if (!fkCheck.valid) return fkCheck.error!
    }

    // Replace components if provided
    if (Array.isArray(components)) {
      if (components.length > 0) {
        const compProductIds = components.map((c: any) => c.productId).filter(Boolean)
        const compFkCheck = await verifyTenantForeignKeys(auth, { productIds: compProductIds })
        if (!compFkCheck.valid) return compFkCheck.error!
      }

      await db.bomComponent.deleteMany({ where: { bomId: id } })
      if (components.length > 0) {
        await db.bomComponent.createMany({
          data: components.map((c: any) => ({
            bomId: id,
            productId: c.productId,
            quantity: Number(c.quantity) || 0,
            scrapPercent: Number(c.scrapPercent) || 0,
          })),
        })
      }
    }

    const updated = await db.bom.update({
      where: { id },
      data: rest,
      include: { components: { include: { product: { select: { id: true, sku: true, nameAr: true } } } } },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'MFG', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.bom.findFirst({ where: { id, companyId: auth.companyId } })
    if (!exists) return notFound('BOM not found')

    const prodCount = await db.productionOrder.count({ where: { bomId: id } })
    if (prodCount > 0) {
      // Soft archive
      const updated = await db.bom.update({ where: { id }, data: { active: false, status: 'archived' } })
      return ok({ success: true, softArchived: true, bom: updated })
    }
    await db.bomComponent.deleteMany({ where: { bomId: id } })
    await db.bom.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
