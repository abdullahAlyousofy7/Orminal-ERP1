import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { postJournalEntry, cogsPosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.delivery.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        partner: true,
        warehouse: true,
        salesOrder: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Delivery not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.delivery.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('Delivery not found')
    if (exists.status === 'done' || exists.status === 'cancelled')
      return badRequest('Cannot edit done or cancelled delivery')

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body

    // If transitioning to done: process stock
    if (rest.status === 'done' && exists.status !== 'done') {
      let cogsAmount = 0
      try {
        await db.$transaction(async (tx) => {
          for (const l of exists.lines) {
            const quant = await tx.stockQuant.findFirst({
              where: { productId: l.productId, warehouseId: exists.warehouseId, locationId: null, lotId: null },
            })
            const currentQty = quant?.quantity ?? 0
            if (currentQty < l.deliveredQty) {
              const product = await tx.product.findUnique({ where: { id: l.productId } })
              throw new Error(`الكمية المتوفرة في المخزون غير كافية للمنتج ${product?.nameAr || l.productId} (المتاح: ${currentQty}، المطلوب: ${l.deliveredQty})`)
            }

            const product = await tx.product.findUnique({ where: { id: l.productId } })
            const cost = product?.costPrice ?? 0
            const lineCost = cost * l.deliveredQty
            cogsAmount += lineCost

            await tx.stockMove.create({
              data: {
                companyId: auth.companyId,
                documentType: 'delivery',
                documentId: exists.id,
                productId: l.productId,
                sourceWarehouseId: exists.warehouseId,
                quantity: l.deliveredQty,
                uomId: l.uomId,
                costPrice: cost,
                state: 'done',
                postingDate: new Date(),
              },
            })

            await tx.stockQuant.update({
              where: { id: quant!.id },
              data: { quantity: { decrement: l.deliveredQty } },
            })
          }
        })

        // Post COGS journal entry
        if (cogsAmount > 0) {
          const postingLines = cogsPosting({ amount: cogsAmount })
          const je = await postJournalEntry({
            companyId: auth.companyId,
            branchId: exists.branchId ?? undefined,
            journalType: 'general',
            postingDate: exists.deliveryDate,
            description: `تكلفة بضاعة مباعة — سند تسليم ${exists.code}`,
            refType: 'delivery',
            refId: exists.id,
            lines: postingLines,
            userId: auth.userId,
          })
          await db.delivery.update({
            where: { id: exists.id },
            data: { journalEntryId: je.id },
          })
        }
      } catch (err: any) {
        return badRequest(err.message)
      }
    }

    const updated = await db.delivery.update({
      where: { id: exists.id },
      data: rest,
      include: { lines: { include: { product: true } } },
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
    const exists = await db.delivery.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Delivery not found')
    if (exists.status === 'done') return badRequest('Cannot delete completed delivery')

    await db.$transaction(async (tx) => {
      await tx.deliveryLine.deleteMany({ where: { deliveryId: exists.id } })
      await tx.delivery.delete({ where: { id: exists.id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
