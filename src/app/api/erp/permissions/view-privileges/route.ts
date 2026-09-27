import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { ok, badRequest, serverError, parsePagination, parseSearch } from '@/lib/erp/api-response'
import { requireAuthContext, isAuthFailure } from '@/lib/erp/rbac'
import {
  getEffectiveScreenPrivilege,
  getEffectiveInputPrivilege,
  getEffectiveTransactionPolicy,
} from '@/lib/erp/effective-permissions'
import { CANONICAL_SCREENS, INPUT_CATEGORIES, TRANSACTION_POLICY_DEFINITIONS } from '@/lib/erp/screen-catalog'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { module: 'SYS', capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || auth.userId
    const roleId = url.searchParams.get('roleId')
    const type = url.searchParams.get('type') || 'screens' // 'screens' | 'inputs' | 'policies'
    const inputCode = url.searchParams.get('inputCode') || '6'
    const q = parseSearch(req)
    const { page, pageSize, skip } = parsePagination(req)

    if (type === 'inputs') {
      // Inspect Input Category privileges
      const category = INPUT_CATEGORIES.find((c) => c.code === inputCode)
      let items = category ? category.standardItems : []

      if (inputCode === '10') {
        const branches = await db.branch.findMany({
          where: { companyId: auth.companyId, active: true },
          select: { id: true, nameAr: true },
        })
        items = branches.map((b) => ({ id: b.id, nameAr: b.nameAr }))
      } else if (inputCode === '11') {
        const accounts = await db.account.findMany({
          where: { active: true },
          select: { id: true, code: true, nameAr: true },
          take: 100,
        })
        items = accounts.map((a) => ({ id: a.id, nameAr: `${a.code} - ${a.nameAr}` }))
      } else if (inputCode === '13') {
        const warehouses = await db.warehouse.findMany({
          where: { branch: { companyId: auth.companyId } },
          select: { id: true, nameAr: true },
        })
        items = warehouses.map((w) => ({ id: w.id, nameAr: w.nameAr }))
      }

      if (q) {
        items = items.filter((i) => i.nameAr.includes(q))
      }

      const total = items.length
      const pageItems = items.slice(skip, skip + pageSize)

      const decisions = await Promise.all(
        pageItems.map((item) =>
          getEffectiveInputPrivilege(userId, auth.companyId, inputCode, item.id)
        )
      )

      const rows = pageItems.map((item, idx) => {
        const d = decisions[idx]
        return {
          index: skip + idx + 1,
          recordId: item.id,
          recordTitle: item.nameAr,
          inputCode,
          canScreen: d.canScreen,
          canReports: d.canReports,
          canDownload: d.canDownload,
          canAccess: d.canAccess,
          sourceRole: d.sourceRole,
        }
      })

      return NextResponse.json({
        type: 'inputs',
        inputCode,
        data: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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
    }

    if (type === 'policies') {
      // Inspect Transaction Policies
      let defs = TRANSACTION_POLICY_DEFINITIONS
      if (q) {
        defs = defs.filter((d) => d.nameAr.includes(q) || d.key.includes(q))
      }

      const decisions = await Promise.all(
        defs.map((def) => getEffectiveTransactionPolicy(userId, auth.companyId, def.key))
      )

      const rows = defs.map((def, idx) => {
        const d = decisions[idx]
        return {
          index: idx + 1,
          policyKey: def.key,
          nameAr: def.nameAr,
          dataType: def.dataType,
          module: def.module,
          value: d.value,
          source: d.source,
          sourceRole: d.sourceRole,
          description: d.description,
        }
      })

      return NextResponse.json({
        type: 'policies',
        data: rows,
        total: rows.length,
        page: 1,
        pageSize: rows.length,
        totalPages: 1,
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
    }

    // Default: Inspect Screen Privileges
    let screens = CANONICAL_SCREENS
    if (q) {
      screens = screens.filter(
        (s) => s.code.includes(q) || s.nameAr.includes(q) || s.fullTitle.includes(q)
      )
    }

    const total = screens.length
    const pageScreens = screens.slice(skip, skip + pageSize)

    const decisions = await Promise.all(
      pageScreens.map((s) => getEffectiveScreenPrivilege(userId, auth.companyId, s.code))
    )

    const rows = pageScreens.map((s, idx) => {
      const d = decisions[idx]
      return {
        index: skip + idx + 1,
        screenCode: s.code,
        screenTitle: s.fullTitle,
        moduleCode: s.moduleCode,
        allowed: d.allowed,
        decision: d.decision,
        reason: d.reason,
        sourceRole: d.sourceRole,
        inherited: d.inherited,
        actions: d.actions,
      }
    })

    return NextResponse.json({
      type: 'screens',
      data: rows,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
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
