import { db } from '@/lib/db'
import { ok, notFound, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req, { module: 'INV', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const item = await db.stockLocation.findFirst({
      where: {
        id,
        warehouse: { branch: { companyId: auth.companyId } },
      },
      include: { warehouse: true, parent: true },
    })
    if (!item) return notFound()
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
    const exists = await db.stockLocation.findFirst({
      where: {
        id,
        warehouse: { branch: { companyId: auth.companyId } },
      },
    })
    if (!exists) return notFound()

    const updated = await db.stockLocation.update({
      where: { id: exists.id },
      data: {
        code: body.code,
        nameAr: body.nameAr,
        nameEn: body.nameEn,
        type: body.type,
        parentId: body.parentId,
        active: body.active,
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
    const exists = await db.stockLocation.findFirst({
      where: {
        id,
        warehouse: { branch: { companyId: auth.companyId } },
      },
    })
    if (!exists) return notFound()

    await db.stockLocation.delete({ where: { id: exists.id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}
