import { db } from '@/lib/db'
import { ok, list, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import { writeAudit } from '@/lib/erp/audit'
import {
  CANONICAL_SCREENS,
  SCREEN_ACTIONS,
  STANDARD_EXCEL_ASSIGNMENTS,
  type ScreenActionKey,
} from '@/lib/erp/screen-catalog'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const roleId = url.searchParams.get('roleId')
    const screenCode = url.searchParams.get('screenCode')
    const q = parseSearch(req)
    const { page, pageSize, skip } = parsePagination(req)

    // Optional Seeding trigger: if requested or table empty for standard roles
    const shouldSeed = url.searchParams.get('seed') === 'true'
    if (shouldSeed) {
      await seedStandardExcelGrants(auth.companyId)
    }

    // Filter Canonical screens
    let filteredScreens = CANONICAL_SCREENS
    if (screenCode) {
      filteredScreens = filteredScreens.filter((s) => s.code === screenCode)
    }
    if (q) {
      const qLower = q.toLowerCase()
      filteredScreens = filteredScreens.filter(
        (s) =>
          s.code.includes(q) ||
          s.nameAr.includes(q) ||
          s.fullTitle.includes(q)
      )
    }

    const total = filteredScreens.length
    const pageScreens = filteredScreens.slice(skip, skip + pageSize)

    // If roleId provided, fetch existing DB grants
    let grantsMap = new Map<string, any>()
    if (roleId) {
      const grants = await db.screenPrivilege.findMany({
        where: {
          companyId: auth.companyId,
          roleId,
          screenCode: { in: pageScreens.map((s) => s.code) },
        },
      })
      for (const g of grants) {
        grantsMap.set(g.screenCode, g)
      }
    }

    const rows = pageScreens.map((s, index) => {
      const g = grantsMap.get(s.code)
      return {
        index: skip + index + 1,
        screenCode: s.code,
        screenTitle: s.fullTitle,
        moduleCode: s.moduleCode,
        canInclude: g ? Boolean(g.canInclude) : false,
        canAdd: g ? Boolean(g.canAdd) : false,
        canEdit: g ? Boolean(g.canEdit) : false,
        canDelete: g ? Boolean(g.canDelete) : false,
        canView: g ? Boolean(g.canView) : false,
        canPrint: g ? Boolean(g.canPrint) : false,
        canCancelDoc: g ? Boolean(g.canCancelDoc) : false,
        canPost: g ? Boolean(g.canPost) : false,
        canSuspend: g ? Boolean(g.canSuspend) : false,
        canViewJournal: g ? Boolean(g.canViewJournal) : false,
        canScreenVars: g ? Boolean(g.canScreenVars) : false,
        canReview: g ? Boolean(g.canReview) : false,
        canStop: g ? Boolean(g.canStop) : false,
      }
    })

    return list(rows, total, page, pageSize)
  } catch (e: any) {
    return serverError(e.message)
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canUpdate' })
    if (isAuthFailure(auth)) return auth

    const body = await req.json()
    const { roleId, updates } = body

    if (!roleId) return badRequest('معرف مجموعة المستخدمين مطلوب')
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return badRequest('مصفوفة تحديث الصلاحيات مطلوبة')
    }

    const role = await db.role.findUnique({ where: { id: roleId } })
    if (!role) return badRequest('مجموعة المستخدمين غير موجودة')

    // Upsert each screen privilege in a single transaction
    await db.$transaction(
      updates.map((item: any) =>
        db.screenPrivilege.upsert({
          where: {
            companyId_roleId_screenCode: {
              companyId: auth.companyId,
              roleId,
              screenCode: item.screenCode,
            },
          },
          create: {
            companyId: auth.companyId,
            roleId,
            screenCode: item.screenCode,
            screenTitle: item.screenTitle,
            canInclude: item.canInclude !== undefined ? Boolean(item.canInclude) : true,
            canAdd: Boolean(item.canAdd),
            canEdit: Boolean(item.canEdit),
            canDelete: Boolean(item.canDelete),
            canView: item.canView !== undefined ? Boolean(item.canView) : true,
            canPrint: Boolean(item.canPrint),
            canCancelDoc: Boolean(item.canCancelDoc),
            canPost: Boolean(item.canPost),
            canSuspend: Boolean(item.canSuspend),
            canViewJournal: Boolean(item.canViewJournal),
            canScreenVars: Boolean(item.canScreenVars),
            canReview: Boolean(item.canReview),
            canStop: Boolean(item.canStop),
          },
          update: {
            screenTitle: item.screenTitle,
            canInclude: item.canInclude !== undefined ? Boolean(item.canInclude) : undefined,
            canAdd: item.canAdd !== undefined ? Boolean(item.canAdd) : undefined,
            canEdit: item.canEdit !== undefined ? Boolean(item.canEdit) : undefined,
            canDelete: item.canDelete !== undefined ? Boolean(item.canDelete) : undefined,
            canView: item.canView !== undefined ? Boolean(item.canView) : undefined,
            canPrint: item.canPrint !== undefined ? Boolean(item.canPrint) : undefined,
            canCancelDoc: item.canCancelDoc !== undefined ? Boolean(item.canCancelDoc) : undefined,
            canPost: item.canPost !== undefined ? Boolean(item.canPost) : undefined,
            canSuspend: item.canSuspend !== undefined ? Boolean(item.canSuspend) : undefined,
            canViewJournal: item.canViewJournal !== undefined ? Boolean(item.canViewJournal) : undefined,
            canScreenVars: item.canScreenVars !== undefined ? Boolean(item.canScreenVars) : undefined,
            canReview: item.canReview !== undefined ? Boolean(item.canReview) : undefined,
            canStop: item.canStop !== undefined ? Boolean(item.canStop) : undefined,
          },
        })
      )
    )

    await writeAudit({
      userId: auth.userId,
      companyId: auth.companyId,
      moduleCode: 'SECURITY',
      documentType: 'SCREEN_PRIVILEGES',
      documentId: roleId,
      action: 'update',
      reason: `Updated ${updates.length} screen privileges for role: ${role.nameAr}`,
    })

    return ok({ success: true, count: updates.length })
  } catch (e: any) {
    return serverError(e.message)
  }
}

async function seedStandardExcelGrants(companyId: string) {
  // Ensure the 3 standard roles from Excel exist for this company
  const rolesMeta = [
    { roleCode: 2, code: 'FIN_MGR', nameAr: 'المدير المالي', excelTitle: '2 - المدير المالي' },
    { roleCode: 3, code: 'ACCOUNTANT', nameAr: 'المحاسب', excelTitle: '3 - المحاسب' },
    { roleCode: 4, code: 'SALES_REP', nameAr: 'مبيعات', excelTitle: '4 - مبيعات' },
  ]

  for (const rm of rolesMeta) {
    let role = await db.role.findFirst({
      where: { OR: [{ code: rm.code }, { nameAr: rm.nameAr }] },
    })
    if (!role) {
      role = await db.role.create({
        data: {
          roleCode: rm.roleCode,
          code: rm.code,
          nameAr: rm.nameAr,
          nameEn: rm.code,
          active: true,
        },
      })
    }

    // Check if privileges already seeded
    const existingCount = await db.screenPrivilege.count({
      where: { companyId, roleId: role.id },
    })

    if (existingCount === 0) {
      const roleAssignments = STANDARD_EXCEL_ASSIGNMENTS.filter((a) => a.group === rm.excelTitle)
      if (roleAssignments.length > 0) {
        await db.screenPrivilege.createMany({
          data: roleAssignments.map((a) => ({
            companyId,
            roleId: role.id,
            screenCode: a.screenCode,
            screenTitle: a.screenTitle,
            canInclude: Boolean(a.grants['تضمين']),
            canAdd: Boolean(a.grants['إضافة']),
            canEdit: Boolean(a.grants['تعديل']),
            canDelete: Boolean(a.grants['حذف']),
            canView: Boolean(a.grants['عرض']),
            canPrint: Boolean(a.grants['طباعة']),
            canCancelDoc: Boolean(a.grants['إلغاء الوثيقة']),
            canPost: Boolean(a.grants['ترحيل']),
            canSuspend: Boolean(a.grants['تعليق']),
            canViewJournal: Boolean(a.grants['عرض قيد اليومية']),
            canScreenVars: Boolean(a.grants['متغيرات الشاشة']),
            canReview: Boolean(a.grants['مراجعة']),
            canStop: Boolean(a.grants['التوقيف']),
          })),
          skipDuplicates: true,
        })
      }
    }
  }
}
