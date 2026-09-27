import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, parsePagination } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit } from '@/lib/erp/audit'
import { INPUT_CATEGORIES } from '@/lib/erp/screen-catalog'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const roleId = url.searchParams.get('roleId')
    const inputCode = url.searchParams.get('inputCode') || '6' // Default to '6 - تنبيهات النظام'
    const q = url.searchParams.get('q')

    const category = INPUT_CATEGORIES.find((c) => c.code === inputCode)
    if (!category) {
      return badRequest('فئة المدخلات المحددة غير صحيحة')
    }

    // Resolve items for this category (either standard static or dynamic from DB)
    let items: { id: string; nameAr: string }[] = []

    if (inputCode === '10') {
      // Branches / Financial units
      const branches = await db.branch.findMany({
        where: { companyId: auth.companyId, active: true },
        select: { id: true, nameAr: true },
      })
      items = branches.map((b) => ({ id: b.id, nameAr: b.nameAr }))
    } else if (inputCode === '11') {
      // Chart of Accounts
      const accounts = await db.account.findMany({
        where: { active: true },
        select: { id: true, code: true, nameAr: true },
        take: 100,
        orderBy: { code: 'asc' },
      })
      items = accounts.map((a) => ({ id: a.id, nameAr: `${a.code} - ${a.nameAr}` }))
    } else if (inputCode === '12') {
      // Cost Centers
      const centers = await db.costCenter.findMany({
        where: { active: true },
        select: { id: true, code: true, nameAr: true },
      })
      items = centers.map((c) => ({ id: c.id, nameAr: `${c.code} - ${c.nameAr}` }))
    } else if (inputCode === '13') {
      // Warehouses
      const warehouses = await db.warehouse.findMany({
        where: { branch: { companyId: auth.companyId } },
        select: { id: true, nameAr: true },
      })
      items = warehouses.map((w) => ({ id: w.id, nameAr: w.nameAr }))
    } else {
      items = category.standardItems
    }

    if (q) {
      items = items.filter((item) => item.nameAr.includes(q))
    }

    // Fetch existing grants if roleId provided
    const grantsMap = new Map<string, any>()
    if (roleId) {
      const grants = await db.inputPrivilege.findMany({
        where: {
          companyId: auth.companyId,
          roleId,
          inputCode,
        },
      })
      for (const g of grants) {
        grantsMap.set(g.recordId, g)
      }
    }

    const rows = items.map((item, idx) => {
      const g = grantsMap.get(item.id)
      return {
        index: idx + 1,
        recordId: item.id,
        recordTitle: item.nameAr,
        inputCode,
        canScreen: g ? Boolean(g.canScreen) : true,
        canReports: g ? Boolean(g.canReports) : true,
        canDownload: g ? Boolean(g.canDownload) : false,
        canAccess: g ? Boolean(g.canAccess) : true,
      }
    })

    return NextResponse.json({
      category,
      categories: INPUT_CATEGORIES.map((c) => ({ code: c.code, nameAr: c.nameAr, nameEn: c.nameEn })),
      data: rows,
      total: rows.length,
      meta: {
        timestamp: new Date().toISOString(),
        pagination: {
          page: 1,
          pageSize: rows.length,
          total: rows.length,
          totalPages: 1,
          hasMore: false,
        },
      },
    })
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const { roleId, inputCode, updates } = body

    if (!roleId || !inputCode) return badRequest('معرف المجموعة وفئة المدخلات مطلوبان')
    if (!updates || !Array.isArray(updates)) return badRequest('مصفوفة التحديثات مطلوبة')

    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) return badRequest('مجموعة المستخدمين غير موجودة')

    await db.$transaction(
      updates.map((item: any) =>
        db.inputPrivilege.upsert({
          where: {
            companyId_roleId_inputCode_recordId: {
              companyId: auth.companyId,
              roleId,
              inputCode,
              recordId: item.recordId,
            },
          },
          create: {
            companyId: auth.companyId,
            roleId,
            inputCode,
            recordId: item.recordId,
            recordTitle: item.recordTitle,
            canScreen: item.canScreen !== undefined ? Boolean(item.canScreen) : true,
            canReports: item.canReports !== undefined ? Boolean(item.canReports) : true,
            canDownload: Boolean(item.canDownload),
            canAccess: item.canAccess !== undefined ? Boolean(item.canAccess) : true,
          },
          update: {
            recordTitle: item.recordTitle,
            canScreen: item.canScreen !== undefined ? Boolean(item.canScreen) : undefined,
            canReports: item.canReports !== undefined ? Boolean(item.canReports) : undefined,
            canDownload: item.canDownload !== undefined ? Boolean(item.canDownload) : undefined,
            canAccess: item.canAccess !== undefined ? Boolean(item.canAccess) : undefined,
          },
        })
      )
    )

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'INPUT_PRIVILEGES',
      documentId: roleId,
      action: 'update',
      reason: `Updated input privileges for category ${inputCode} on role: ${role.nameAr}`,
    })

    return ok({ success: true, count: updates.length })
  } catch (e: any) {
    return serverError(e.message)
  }
}
