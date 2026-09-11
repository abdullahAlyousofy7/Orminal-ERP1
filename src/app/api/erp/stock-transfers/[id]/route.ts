import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.stockTransfer.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Stock transfer not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// PUT — update; allows status transition to 'done'
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.stockTransfer.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('Stock transfer not found')
    if (exists.status === 'done' || exists.status === 'cancelled')
      return badRequest('Cannot edit done or cancelled transfer')

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body

    // If transitioning to done or received: process stock moves
    if ((rest.status === 'done' || rest.status === 'received') &&
        exists.status !== 'done' && exists.status !== 'received') {
      await db.$transaction(async (tx) => {
        for (const l of exists.lines) {
          // Out of source
          await tx.stockMove.create({
            data: {
              companyId: auth.companyId,
              documentType: 'transfer',
              documentId: exists.id,
              productId: l.productId,
              sourceWarehouseId: exists.fromWarehouseId,
              quantity: l.quantity,
              uomId: l.uomId,
              state: 'done',
              postingDate: new Date(),
            },
          })
          // Into dest
          await tx.stockMove.create({
            data: {
              companyId: auth.companyId,
              documentType: 'transfer',
              documentId: exists.id,
              productId: l.productId,
              destWarehouseId: exists.toWarehouseId,
              quantity: l.quantity,
              uomId: l.uomId,
              state: 'done',
              postingDate: new Date(),
            },
          })

          // Decrement source
          const srcQuant = await tx.stockQuant.findFirst({
            where: { productId: l.productId, warehouseId: exists.fromWarehouseId, locationId: null, lotId: null },
          })
          if (srcQuant) {
            await tx.stockQuant.update({
              where: { id: srcQuant.id },
              data: { quantity: { decrement: l.quantity } },
            })
          }

          // Increment dest
          const destQuant = await tx.stockQuant.findFirst({
            where: { productId: l.productId, warehouseId: exists.toWarehouseId, locationId: null, lotId: null },
          })
          if (destQuant) {
            await tx.stockQuant.update({
              where: { id: destQuant.id },
              data: { quantity: { increment: l.quantity } },
            })
          } else {
            await tx.stockQuant.create({
              data: {
                productId: l.productId,
                warehouseId: exists.toWarehouseId,
                quantity: l.quantity,
              },
            })
          }
        }
        await tx.stockTransfer.update({ where: { id: exists.id }, data: { status: 'done' } })
      })
    } else {
      await db.stockTransfer.update({ where: { id: exists.id }, data: rest })
    }

    const updated = await db.stockTransfer.findFirst({
      where: { id: exists.id, companyId: auth.companyId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        lines: { include: { product: true } },
      },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canDelete' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const exists = await db.stockTransfer.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Stock transfer not found')
    if (exists.status === 'done') return badRequest('Cannot delete completed transfer')

    await db.$transaction(async (tx) => {
      await tx.stockTransferLine.deleteMany({ where: { transferId: exists.id } })
      await tx.stockTransfer.delete({ where: { id: exists.id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
