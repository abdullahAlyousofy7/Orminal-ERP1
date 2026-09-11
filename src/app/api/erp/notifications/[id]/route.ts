import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, notFound, serverError } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req)
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const existing = await db.notification.findFirst({
      where: { id, ...(auth.isSuperAdmin ? {} : { userId: auth.userId }) },
    })
    if (!existing) return notFound('الإشعار غير موجود')

    const body = await req.json().catch(() => ({}))
    const updated = await db.notification.update({
      where: { id },
      data: { isRead: body.isRead ?? true },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuthContext(req)
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const existing = await db.notification.findFirst({
      where: { id, ...(auth.isSuperAdmin ? {} : { userId: auth.userId }) },
    })
    if (!existing) return notFound('الإشعار غير موجود')

    await db.notification.delete({ where: { id } })
    return ok({ success: true })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // mark as read
  try {
    const auth = await requireAuthContext(req)
    if (isAuthFailure(auth)) return auth

    const { id } = await params
    const existing = await db.notification.findFirst({
      where: { id, ...(auth.isSuperAdmin ? {} : { userId: auth.userId }) },
    })
    if (!existing) return notFound('الإشعار غير موجود')

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    })
    return ok(updated)
  } catch (e: any) {
    return serverError(e.message)
  }
}
