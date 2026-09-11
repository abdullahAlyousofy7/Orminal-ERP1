import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { postJournalEntry, goodsReceiptPosting } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.goodsReceipt.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        partner: true,
        warehouse: true,
        purchaseOrder: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Goods receipt not found')
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
    const exists = await db.goodsReceipt.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: true },
    })
    if (!exists) return notFound('Goods receipt not found')

    const { id: _id, companyId: _c, createdBy: _u, lines, createdAt: _ca, updatedAt: _ua, ...rest } = body

    if (rest.receiptDate) {
      rest.receiptDate = new Date(rest.receiptDate)
    }

    // If cancelling a receipt
    if (rest.status === 'cancelled') {
      const updated = await db.goodsReceipt.update({
        where: { id: exists.id },
        data: { status: 'cancelled' },
        include: { lines: { include: { product: true } } },
      })
      return ok(updated)
    }

    if (exists.status === 'validated' || exists.status === 'posted' || exists.status === 'cancelled') {
      return badRequest('Cannot edit validated or cancelled goods receipt')
    }

    // Update lines if provided (for draft)
    if (lines && Array.isArray(lines)) {
      await db.goodsReceiptLine.deleteMany({ where: { receiptId: exists.id } })
      if (lines.length > 0) {
        await db.goodsReceiptLine.createMany({
          data: lines.map((l: any) => ({
            receiptId: exists.id,
            productId: l.productId,
            orderedQty: Number(l.orderedQty) || 0,
            receivedQty: Number(l.receivedQty) || 0,
            rejectedQty: Number(l.rejectedQty) || 0,
            unitCost: Number(l.unitCost) || 0,
            total: (Number(l.receivedQty) || 0) * (Number(l.unitCost) || 0),
            notes: l.notes,
          })),
        })
      }
    }

    // If transitioning to validated/posted: process inventory moves
    if (rest.status === 'validated' || rest.status === 'posted') {
      const freshLines = await db.goodsReceiptLine.findMany({ where: { receiptId: exists.id } })
      const totalAmount = freshLines.reduce((s, l) => s + (l.total || 0), 0)

      await db.$transaction(async (tx) => {
        for (const l of freshLines) {
          if (l.receivedQty <= 0) continue

          await tx.stockMove.create({
            data: {
              companyId: auth.companyId,
              documentType: 'goods_receipt',
              documentId: exists.id,
              productId: l.productId,
              destWarehouseId: exists.warehouseId,
              quantity: l.receivedQty,
              costPrice: l.unitCost,
              state: 'done',
              postingDate: new Date(),
            },
          })

          const quant = await tx.stockQuant.findFirst({
            where: { productId: l.productId, warehouseId: exists.warehouseId, locationId: null, lotId: null },
          })
          if (quant) {
            await tx.stockQuant.update({
              where: { id: quant.id },
              data: { quantity: { increment: l.receivedQty } },
            })
          } else {
            await tx.stockQuant.create({
              data: {
                productId: l.productId,
                warehouseId: exists.warehouseId,
                quantity: l.receivedQty,
              },
            })
          }
        }

        await tx.goodsReceipt.update({
          where: { id: exists.id },
          data: { ...rest, status: 'validated' },
        })
      })

      // Accounting posting
      if (totalAmount > 0) {
        try {
          const postingLines = goodsReceiptPosting({ amount: totalAmount })
          const je = await postJournalEntry({
            companyId: auth.companyId,
            branchId: exists.branchId ?? undefined,
            journalType: 'purchase',
            postingDate: exists.receiptDate,
            description: `إذن استلام بضاعة ${exists.code}`,
            refType: 'goods_receipt',
            refId: exists.id,
            lines: postingLines,
            userId: auth.userId,
          })
          await db.goodsReceipt.update({
            where: { id: exists.id },
            data: { journalEntryId: je.id },
          })
        } catch (err: any) {
          console.error('Accounting posting failed for goods receipt:', err.message)
        }
      }
    } else {
      await db.goodsReceipt.update({
        where: { id: exists.id },
        data: rest,
      })
    }

    const updated = await db.goodsReceipt.findFirst({
      where: { id: exists.id, companyId: auth.companyId },
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
    const exists = await db.goodsReceipt.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Goods receipt not found')

    if (exists.status !== 'draft' && exists.status !== 'cancelled') {
      return badRequest('Cannot delete validated goods receipt')
    }

    await db.$transaction(async (tx) => {
      await tx.goodsReceiptLine.deleteMany({ where: { receiptId: exists.id } })
      await tx.goodsReceipt.delete({ where: { id: exists.id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
