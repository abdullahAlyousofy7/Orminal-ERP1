import { db } from '@/lib/db'
import { ok, notFound, badRequest, serverError } from '@/lib/erp/api-response'
import { postJournalEntry } from '@/lib/erp/accounting-engine'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.inventoryAdjustment.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        warehouse: true,
        reasonCode: true,
        lines: { include: { product: true } },
      },
    })
    if (!item) return notFound('Inventory adjustment not found')
    return ok(item)
  } catch (e: any) {
    return serverError(e.message)
  }
}

// PUT — update; if transitioning to 'posted': create StockMoves, update StockQuants, post journal
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const body = await req.json()
    const exists = await db.inventoryAdjustment.findFirst({
      where: { id, companyId: auth.companyId },
      include: { lines: { include: { product: true } } },
    })
    if (!exists) return notFound('Inventory adjustment not found')
    if (exists.status === 'posted' || exists.status === 'cancelled')
      return badRequest('Cannot edit posted or cancelled adjustment')

    const { id: _id, companyId: _c, createdBy: _u, lines: _lines, createdAt: _ca, updatedAt: _ua, ...rest } = body

    // If transitioning to posted: process stock and journal
    if (rest.status === 'posted' && exists.status !== 'posted') {
      let gainAmount = 0
      let lossAmount = 0
      await db.$transaction(async (tx) => {
        for (const l of exists.lines) {
          const variance = (l.countedQty ?? 0) - (l.systemQty ?? 0)
          if (variance === 0) continue

          await tx.stockMove.create({
            data: {
              companyId: auth.companyId,
              documentType: 'adjustment',
              documentId: exists.id,
              productId: l.productId,
              sourceWarehouseId: variance < 0 ? exists.warehouseId : undefined,
              destWarehouseId: variance > 0 ? exists.warehouseId : undefined,
              quantity: Math.abs(variance),
              uomId: l.product?.uomId ?? undefined,
              state: 'done',
              valuationAmount: Math.abs(variance) * (l.unitCost || 0),
              costPrice: l.unitCost,
              postingDate: new Date(),
            },
          })

          const quant = await tx.stockQuant.findFirst({
            where: { productId: l.productId, warehouseId: exists.warehouseId, locationId: null, lotId: null },
          })
          if (quant) {
            await tx.stockQuant.update({
              where: { id: quant.id },
              data: { quantity: { increment: variance } },
            })
          } else if (variance > 0) {
            await tx.stockQuant.create({
              data: {
                productId: l.productId,
                warehouseId: exists.warehouseId,
                quantity: variance,
              },
            })
          }

          const lineValue = Math.abs(variance) * (l.unitCost || 0)
          if (variance > 0) gainAmount += lineValue
          else lossAmount += lineValue
        }
        await tx.inventoryAdjustment.update({ where: { id: exists.id }, data: { status: 'posted' } })
      })

      const journalLines: any[] = []
      if (gainAmount > 0) {
        journalLines.push({ role: 'INVENTORY', debit: gainAmount, credit: 0, description: 'زيادة مخزون' })
        journalLines.push({ role: 'INVENTORY_GAIN', debit: 0, credit: gainAmount, description: 'إيراد آخر - زيادة مخزون' })
      }
      if (lossAmount > 0) {
        journalLines.push({ role: 'INVENTORY_LOSS', debit: lossAmount, credit: 0, description: 'مصروف - نقص مخزون' })
        journalLines.push({ role: 'INVENTORY', debit: 0, credit: lossAmount, description: 'نقص مخزون' })
      }

      if (journalLines.length > 0) {
        const je = await postJournalEntry({
          companyId: auth.companyId,
          journalType: 'general',
          postingDate: new Date(),
          description: `تسوية مخزون ${exists.code}`,
          refType: 'inventory_adjustment',
          refId: exists.id,
          lines: journalLines,
          userId: auth.userId,
        })
        await db.inventoryAdjustment.update({
          where: { id: exists.id },
          data: { journalEntryId: je.id },
        })
      }
    } else {
      await db.inventoryAdjustment.update({ where: { id: exists.id }, data: rest })
    }

    const updated = await db.inventoryAdjustment.findFirst({
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
    const exists = await db.inventoryAdjustment.findFirst({
      where: { id, companyId: auth.companyId },
    })
    if (!exists) return notFound('Inventory adjustment not found')
    if (exists.status === 'posted') return badRequest('Cannot delete posted adjustment')

    await db.$transaction(async (tx) => {
      await tx.inventoryAdjustmentLine.deleteMany({ where: { adjustmentId: exists.id } })
      await tx.inventoryAdjustment.delete({ where: { id: exists.id } })
    })

    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
