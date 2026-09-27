import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, list, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const { page, pageSize, skip } = parsePagination(req)
    const q = parseSearch(req)
    const documentType = url.searchParams.get('documentType')
    const action = url.searchParams.get('action')
    const userId = url.searchParams.get('userId')
    const dateFrom = url.searchParams.get('dateFrom')
    const dateTo = url.searchParams.get('dateTo')

    const where: any = {
      OR: [
        { companyId: auth.companyId },
        { companyId: null },
      ],
    }

    if (documentType) {
      where.documentType = documentType
    }
    if (action) {
      where.action = action
    }
    if (userId) {
      where.userId = userId
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) where.createdAt.gte = new Date(dateFrom)
      if (dateTo) {
        const d = new Date(dateTo)
        d.setHours(23, 59, 59, 999)
        where.createdAt.lte = d
      }
    }

    if (q) {
      where.AND = [
        {
          OR: [
            { documentType: { contains: q, mode: 'insensitive' } },
            { documentId: { contains: q, mode: 'insensitive' } },
            { reason: { contains: q, mode: 'insensitive' } },
            { user: { nameAr: { contains: q, mode: 'insensitive' } } },
            { user: { username: { contains: q, mode: 'insensitive' } } },
          ],
        },
      ]
    }

    const [data, total, docTypes] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              userCode: true,
              username: true,
              nameAr: true,
            },
          },
        },
      }),
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        distinct: ['documentType'],
        select: { documentType: true },
        take: 50,
      }),
    ])

    const rows = data.map((row, idx) => ({
      index: skip + idx + 1,
      id: row.id,
      action: row.action,
      actionAr: translateAction(row.action),
      documentType: row.documentType,
      documentId: row.documentId,
      userId: row.userId,
      userName: row.user?.nameAr || row.user?.username || 'مستخدم النظام',
      userCode: row.user?.userCode || 1,
      createdAt: row.createdAt.toISOString(),
      formattedDate: formatDateTime(row.createdAt),
      reason: row.reason,
      oldValue: parseSafe(row.oldValue),
      newValue: parseSafe(row.newValue),
    }))

    return NextResponse.json({
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      availableDocTypes: docTypes.map((d) => d.documentType).filter(Boolean),
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
          hasMore: page < Math.ceil(total / pageSize),
        },
      },
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}

function translateAction(act: string): string {
  switch (act.toLowerCase()) {
    case 'create': return 'إضافة'
    case 'update': return 'تعديل'
    case 'delete': return 'حذف'
    case 'post': return 'ترحيل'
    case 'reverse': return 'عكس'
    case 'cancel': return 'إلغاء'
    case 'approve': return 'اعتماد'
    case 'print': return 'طباعة'
    case 'export': return 'تصدير'
    case 'login': return 'تسجيل دخول'
    case 'logout': return 'تسجيل خروج'
    default: return act
  }
}

function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  const seconds = pad(d.getSeconds())
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

function parseSafe(v: string | null): any {
  if (!v) return null
  try {
    return JSON.parse(v)
  } catch {
    return v
  }
}
