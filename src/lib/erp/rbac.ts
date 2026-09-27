// Enterprise ERP — Server-side RBAC & Multi-Tenant Security Guard
//
// Source of Truth & Mandatory Security Mandates:
// 1. userId & tenant scope derived strictly from verified session (never client payload).
// 2. Multi-tenant company isolation on every query/mutation (no findFirst fallbacks).
// 3. Multi-branch isolation validated against authorizedBranchIds.
// 4. Cross-tenant Foreign Key integrity validation.
// 5. IDOR defense with anti-enumeration 404 responses.
// 6. Fail-closed RBAC enforcement.

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-options'
import { db } from '@/lib/db'
import { forbidden, unauthorized, badRequest, notFound } from './api-response'
import { writeAudit } from './audit'
import type { NextResponse } from 'next/server'

export type { Capability, CoaAction } from './coa-policy'
export { COA_ACTIONS, DEFAULT_ROLE_MATRIX, FALLBACK_POLICY, matrixAllows } from './coa-policy'

import {
  COA_ACTIONS as ACTIONS,
  matrixAllows as policyAllows,
  type Capability as Cap,
  type CoaAction as Action,
} from './coa-policy'

export interface AuthContext {
  userId: string
  username: string
  roleCode: string
  companyId: string // Guaranteed non-null and valid in ERP context
  branchId: string | null // Active branch
  authorizedBranchIds: string[] // All branches user is permitted to access in this company
  isSuperAdmin: boolean
  assignedCompanyIds: string[]
}

// Module-level default capabilities for common roles (fail-closed fallback when DB permissions unpopulated)
export const MODULE_ROLE_MATRIX: Record<string, Record<string, Cap[] | '*'>> = {
  ADMIN: { FIN: '*', SAL: '*', PUR: '*', INV: '*', HR: '*', MFG: '*', SYS: '*' },
  SUPERADMIN: { FIN: '*', SAL: '*', PUR: '*', INV: '*', HR: '*', MFG: '*', SYS: '*' },
  SYSTEM: { FIN: '*', SAL: '*', PUR: '*', INV: '*', HR: '*', MFG: '*', SYS: '*' },
  OWNER: { FIN: '*', SAL: '*', PUR: '*', INV: '*', HR: '*', MFG: '*', SYS: '*' },
  CEO: {
    FIN: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    SAL: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    PUR: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    INV: ['canRead', 'canExport', 'canPrint'],
    HR: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    MFG: ['canRead', 'canExport', 'canPrint'],
    SYS: ['canRead'],
  },
  FIN_MGR: {
    FIN: '*',
    SAL: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    PUR: ['canRead', 'canExport', 'canPrint', 'canApprove'],
    INV: ['canRead', 'canExport', 'canPrint'],
    HR: ['canRead', 'canApprove'],
    SYS: ['canRead'],
  },
  CHIEF_ACC: {
    FIN: ['canRead', 'canCreate', 'canUpdate', 'canDelete', 'canPost', 'canReverse', 'canExport', 'canPrint', 'canImport'],
    SAL: ['canRead', 'canExport', 'canPrint'],
    PUR: ['canRead', 'canExport', 'canPrint'],
    INV: ['canRead'],
    SYS: ['canRead'],
  },
  ACCOUNTANT: {
    FIN: ['canRead', 'canCreate', 'canUpdate', 'canExport', 'canPrint'],
    SAL: ['canRead'],
    PUR: ['canRead'],
    INV: ['canRead'],
    SYS: ['canRead'],
  },
  SALES_MGR: {
    SAL: '*',
    INV: ['canRead', 'canExport', 'canPrint'],
    FIN: ['canRead'],
    SYS: ['canRead'],
  },
  SALES_REP: {
    SAL: ['canRead', 'canCreate', 'canUpdate', 'canPrint'],
    INV: ['canRead'],
    FIN: ['canRead'],
  },
  PURCHASE_MGR: {
    PUR: '*',
    INV: ['canRead', 'canExport', 'canPrint'],
    FIN: ['canRead'],
    SYS: ['canRead'],
  },
  PURCHASE_REP: {
    PUR: ['canRead', 'canCreate', 'canUpdate', 'canPrint'],
    INV: ['canRead'],
    FIN: ['canRead'],
  },
  INVENTORY_MGR: {
    INV: '*',
    PUR: ['canRead'],
    SAL: ['canRead'],
    SYS: ['canRead'],
  },
  WAREHOUSE_KEEPER: {
    INV: ['canRead', 'canCreate', 'canUpdate', 'canPrint'],
  },
  HR_MGR: {
    HR: '*',
    SYS: ['canRead'],
  },
  AUDITOR: {
    FIN: ['canRead', 'canExport', 'canPrint'],
    SAL: ['canRead', 'canExport', 'canPrint'],
    PUR: ['canRead', 'canExport', 'canPrint'],
    INV: ['canRead', 'canExport', 'canPrint'],
    HR: ['canRead', 'canExport', 'canPrint'],
    SYS: ['canRead', 'canExport'],
  },
  VIEWER: {
    FIN: ['canRead'],
    SAL: ['canRead'],
    PUR: ['canRead'],
    INV: ['canRead'],
    HR: ['canRead'],
    MFG: ['canRead'],
    SYS: ['canRead'],
  },
}

/**
 * Resolves trusted AuthContext from verified session and DB user record.
 * Handles company resolution, authorized branches, and strict cross-tenant guards.
 */
export async function getAuthContext(req?: Request): Promise<AuthContext | null> {
  let userId: string | undefined

  // In test environment, allow explicit test identity header if present
  if (process.env.NODE_ENV === 'test' && req) {
    const testUser = req.headers.get('x-test-user-id')
    if (testUser) userId = testUser
  }

  if (!userId) {
    try {
      const session = await getServerSession(authOptions)
      userId = session?.user?.id
    } catch {
      // Non-request context or test runner without active Next.js headers context
      userId = undefined
    }
  }

  if (!userId) return null

  // Fetch full user record from DB for live security state
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      active: true,
      defaultCompanyId: true,
      defaultBranchId: true,
      validFromDate: true,
      validToDate: true,
      validFromTime: true,
      validToTime: true,
      branches: { select: { id: true, companyId: true, active: true } },
      managedBranches: { select: { id: true, companyId: true, active: true } },
      userRoles: {
        where: { active: true },
        select: {
          companyId: true,
          branchId: true,
          role: {
            select: {
              code: true,
              isSystem: true,
              rolePermissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
    },
  })

  if (!user || !user.active) return null

  // Mandatory Security Constraint: User Access Window Enforcement
  const now = new Date()
  if (user.validFromDate && now < user.validFromDate) return null
  if (user.validToDate && now > user.validToDate) return null

  if (user.validFromTime || user.validToTime) {
    const currentHours = now.getHours().toString().padStart(2, '0')
    const currentMins = now.getMinutes().toString().padStart(2, '0')
    const currentTimeStr = `${currentHours}:${currentMins}`
    if (user.validFromTime && currentTimeStr < user.validFromTime) return null
    if (user.validToTime && currentTimeStr > user.validToTime) return null
  }

  const roleCodes = user.userRoles.map((ur) => ur.role.code.toUpperCase())
  const primaryRoleCode = roleCodes[0] || 'VIEWER'
  const isSuperAdmin = roleCodes.some((rc) => ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(rc))

  // Determine all company IDs explicitly assigned to this user
  const assignedCompanyIds = Array.from(
    new Set(
      [
        user.defaultCompanyId,
        ...user.userRoles.map((ur) => ur.companyId),
        ...user.branches.map((b) => b.companyId),
        ...user.managedBranches.map((b) => b.companyId),
      ].filter((id): id is string => Boolean(id))
    )
  )

  // Check for explicit cross-company tenant administration capability
  const hasCrossCompanyCap = user.userRoles.some((ur) =>
    ur.role.rolePermissions.some(
      (rp) => rp.permission.actionCode === 'SYS_TENANT_ADMIN' || rp.dataScope === 'all'
    )
  )

  // Mandatory Constraint 2: x-company-id may ONLY be honored for explicitly authorized users/capabilities
  let activeCompanyId: string | null = null
  const requestedCompanyId = req?.headers.get('x-company-id')

  if (requestedCompanyId) {
    const isAssigned = assignedCompanyIds.includes(requestedCompanyId)
    if (isAssigned || hasCrossCompanyCap) {
      // Verify company exists and is active
      const comp = await db.company.findUnique({
        where: { id: requestedCompanyId },
        select: { id: true, active: true },
      })
      if (comp && comp.active) {
        activeCompanyId = comp.id
      }
    }
  }

  // Fallback to user's assigned company
  if (!activeCompanyId) {
    activeCompanyId = user.defaultCompanyId || assignedCompanyIds[0] || null
  }

  // If no company assigned, user cannot operate inside ERP
  if (!activeCompanyId) return null

  // Mandatory Constraint 5: Resolve authorizedBranchIds for active company
  let authorizedBranchIds: string[] = []
  if (isSuperAdmin || ['CEO', 'FIN_MGR', 'OWNER'].includes(primaryRoleCode)) {
    // Company managers have access to all active branches of their company
    const branches = await db.branch.findMany({
      where: { companyId: activeCompanyId, active: true },
      select: { id: true },
    })
    authorizedBranchIds = branches.map((b) => b.id)
  } else {
    // Regular branch-scoped user
    const directBranchIds = [
      user.defaultBranchId,
      ...user.branches.map((b) => b.id),
      ...user.managedBranches.map((b) => b.id),
      ...user.userRoles.filter((ur) => ur.companyId === activeCompanyId).map((ur) => ur.branchId),
    ].filter((id): id is string => Boolean(id))

    const validBranches = await db.branch.findMany({
      where: { id: { in: directBranchIds }, companyId: activeCompanyId, active: true },
      select: { id: true },
    })
    authorizedBranchIds = validBranches.map((b) => b.id)
  }

  // Determine active branch
  let activeBranchId: string | null = null
  const requestedBranchId = req?.headers.get('x-branch-id')

  if (requestedBranchId) {
    if (authorizedBranchIds.includes(requestedBranchId)) {
      activeBranchId = requestedBranchId
    } else {
      // Requested branch not permitted — fail closed
      return null
    }
  } else {
    if (user.defaultBranchId && authorizedBranchIds.includes(user.defaultBranchId)) {
      activeBranchId = user.defaultBranchId
    } else {
      activeBranchId = authorizedBranchIds[0] || null
    }
  }

  return {
    userId: user.id,
    username: user.username,
    roleCode: primaryRoleCode,
    companyId: activeCompanyId,
    branchId: activeBranchId,
    authorizedBranchIds,
    isSuperAdmin,
    assignedCompanyIds,
  }
}

/** 401/403 when session is absent or unauthorized */
export async function requireAuth(req?: Request): Promise<AuthContext | NextResponse> {
  const ctx = await getAuthContext(req)
  if (!ctx) {
    return unauthorized('يجب تسجيل الدخول للوصول إلى هذه البيانات')
  }
  if (!ctx.companyId) {
    return forbidden('المستخدم غير معين لأي شركة مصرح بها', 'TENANT_NOT_ASSIGNED')
  }
  return ctx
}

export function isAuthFailure(v: AuthContext | NextResponse): v is NextResponse {
  return !(v as AuthContext).userId
}

/**
 * Checks a capability across any module or action for the current user.
 */
export async function checkCapability(
  ctx: AuthContext,
  moduleOrAction: string,
  capability: Cap
): Promise<{ allowed: boolean; source: 'db' | 'default_matrix' }> {
  const roleCodeUpper = (ctx.roleCode ?? '').toUpperCase()

  // 1. Superuser roles ALWAYS have full capability
  if (['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(roleCodeUpper)) {
    return { allowed: true, source: 'default_matrix' }
  }

  // 2. If it's a legacy CoA action, check coa-policy
  if (Object.values(ACTIONS).includes(moduleOrAction as any)) {
    if (policyAllows(roleCodeUpper, moduleOrAction as any, capability)) {
      return { allowed: true, source: 'default_matrix' }
    }
  }

  // 3. Check DB RBAC catalog
  const permissions = await db.permission.findMany({
    where: {
      OR: [
        { actionCode: moduleOrAction, active: true },
        { moduleCode: moduleOrAction, active: true },
      ],
    },
    select: { id: true },
  })

  if (permissions.length > 0) {
    const permIds = permissions.map((p) => p.id)
    const grants = await db.rolePermission.findMany({
      where: {
        permissionId: { in: permIds },
        role: { active: true, userRoles: { some: { userId: ctx.userId, active: true } } },
      },
      select: {
        canRead: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
        canPost: true,
        canCancel: true,
        canReverse: true,
        canExport: true,
        canImport: true,
        canPrint: true,
      },
    })

    if (grants.length > 0) {
      const allowed = grants.some((g) => Boolean((g as Record<string, boolean>)[capability as string]))
      if (allowed) return { allowed: true, source: 'db' }
    }
  }

  // 4. Fallback to MODULE_ROLE_MATRIX
  const rolePolicies = MODULE_ROLE_MATRIX[roleCodeUpper]
  if (rolePolicies) {
    const modGrant = rolePolicies[moduleOrAction]
    if (modGrant === '*') return { allowed: true, source: 'default_matrix' }
    if (Array.isArray(modGrant) && modGrant.includes(capability)) {
      return { allowed: true, source: 'default_matrix' }
    }
  }

  // Fail closed
  return { allowed: false, source: 'default_matrix' }
}

/** Combined auth + permission guard */
export async function requireCapability(
  action: Action | string,
  capability: Cap,
  req?: Request
): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth(req)
  if (isAuthFailure(ctx)) return ctx
  const { allowed } = await checkCapability(ctx, action, capability)
  if (!allowed) {
    writeAudit({
      userId: ctx.userId,
      companyId: ctx.companyId,
      moduleCode: 'SECURITY',
      documentType: 'AUTH_CHECK',
      action: 'cancel',
      reason: `INSUFFICIENT_PERMISSION: ${capability} on ${action}`,
    }).catch(() => { })
    return forbidden(`صلاحية غير كافية: العملية تتطلب ${capability} على ${action}`, 'INSUFFICIENT_PERMISSION')
  }
  return ctx
}

/**
 * Universal Auth + Tenant + RBAC guard for API route handlers.
 * Use at the start of any ERP API handler.
 */
export async function requireAuthContext(
  req: Request,
  options?: {
    module?: string
    action?: string
    resource?: string
    capability?: Cap
    screenCode?: string
    screenAction?: import('./screen-catalog').ScreenActionKey
  }
): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth(req)
  if (isAuthFailure(ctx)) return ctx

  if (options?.capability) {
    const target = options.action || options.resource || options.module || 'ERP'
    const { allowed } = await checkCapability(ctx, target, options.capability)
    if (!allowed) {
      writeAudit({
        userId: ctx.userId,
        companyId: ctx.companyId,
        moduleCode: 'SECURITY',
        documentType: 'API_ACCESS',
        action: 'cancel',
        reason: `FORBIDDEN_API_CALL: ${options.capability} on ${target}`,
      }).catch(() => { })
      return forbidden(`صلاحية غير كافية للوصول إلى هذه الوظيفة (${target})`, 'INSUFFICIENT_PERMISSION')
    }
  }

  if (options?.screenCode && options?.screenAction) {
    const screenAllowed = await checkScreenAction(ctx, options.screenCode, options.screenAction)
    if (!screenAllowed) {
      writeAudit({
        userId: ctx.userId,
        companyId: ctx.companyId,
        moduleCode: 'SECURITY',
        documentType: 'SCREEN_ACTION_ACCESS',
        action: 'cancel',
        reason: `FORBIDDEN_SCREEN_ACTION: ${options.screenAction} on screen ${options.screenCode}`,
      }).catch(() => { })
      return forbidden(`غير مصرح لك بتنفيذ الإجراء (${options.screenAction}) على الشاشة (${options.screenCode})`, 'INSUFFICIENT_SCREEN_ACTION')
    }
  }

  return ctx
}

/**
 * Direct Screen Action Authorization Guard:
 * Strictly enforces that the caller has explicit permission for the requested action on the screen.
 */
export async function requireScreenAction(
  req: Request,
  screenCode: string,
  action: import('./screen-catalog').ScreenActionKey
): Promise<AuthContext | NextResponse> {
  return requireAuthContext(req, { screenCode, screenAction: action })
}

export interface TenantFkRefs {
  partnerId?: string | null
  customerId?: string | null
  supplierId?: string | null
  warehouseId?: string | null
  sourceWarehouseId?: string | null
  destWarehouseId?: string | null
  productId?: string | null
  productIds?: (string | null | undefined)[]
  branchId?: string | null
  costCenterId?: string | null
  analyticAccountId?: string | null
  employeeId?: string | null
  journalId?: string | null
  salesOrderId?: string | null
  purchaseOrderId?: string | null
  invoiceId?: string | null
  categoryId?: string | null
  bankAccountId?: string | null
  safeId?: string | null
  accountId?: string | null
  currencyId?: string | null
}

/**
 * Mandatory Constraint 4: Cross-Tenant Foreign Key Integrity Enforcer.
 * Validates that all related records belong strictly to the same authorized company.
 */
export async function verifyTenantForeignKeys(
  ctx: AuthContext,
  refs: TenantFkRefs
): Promise<{ valid: boolean; error?: NextResponse }> {
  const checks: Promise<boolean>[] = []
  const checkNames: string[] = []

  // Partner / Customer / Supplier check
  const partnerId = refs.partnerId || refs.customerId || refs.supplierId
  if (partnerId) {
    checkNames.push(`Partner (${partnerId})`)
    checks.push(db.partner.findFirst({ where: { id: partnerId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Warehouse checks (Warehouse belongs to Company via Branch)
  const warehouseIds = [refs.warehouseId, refs.sourceWarehouseId, refs.destWarehouseId].filter(
    (id): id is string => Boolean(id)
  )
  for (const whId of warehouseIds) {
    checkNames.push(`Warehouse (${whId})`)
    checks.push(
      db.warehouse
        .findFirst({
          where: {
            id: whId,
            branch: { companyId: ctx.companyId },
          },
        })
        .then(Boolean)
    )
  }

  // Single Product check
  if (refs.productId) {
    checkNames.push(`Product (${refs.productId})`)
    checks.push(db.product.findFirst({ where: { id: refs.productId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Multiple Product IDs check
  if (refs.productIds && refs.productIds.length > 0) {
    const cleanProductIds = refs.productIds.filter((id): id is string => Boolean(id))
    if (cleanProductIds.length > 0) {
      checkNames.push(`Products list (${cleanProductIds.length} items)`)
      checks.push(
        db.product
          .count({
            where: { id: { in: cleanProductIds }, companyId: ctx.companyId },
          })
          .then((count) => count === cleanProductIds.length)
      )
    }
  }

  // Branch check (must belong to company and be in user's authorized branches)
  if (refs.branchId) {
    checkNames.push(`Branch (${refs.branchId})`)
    if (!ctx.authorizedBranchIds.includes(refs.branchId)) {
      return {
        valid: false,
        error: forbidden('الفرع المحدد غير مصرح به لهذا المستخدم', 'UNAUTHORIZED_BRANCH'),
      }
    }
    checks.push(db.branch.findFirst({ where: { id: refs.branchId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Employee check
  if (refs.employeeId) {
    checkNames.push(`Employee (${refs.employeeId})`)
    checks.push(db.employee.findFirst({ where: { id: refs.employeeId, companyId: ctx.companyId } }).then(Boolean))
  }

  // BankAccount check
  if (refs.bankAccountId) {
    checkNames.push(`BankAccount (${refs.bankAccountId})`)
    checks.push(db.bankAccount.findFirst({ where: { id: refs.bankAccountId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Safe check
  if (refs.safeId) {
    checkNames.push(`Safe (${refs.safeId})`)
    checks.push(db.safe.findFirst({ where: { id: refs.safeId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Account check (Global Chart of Accounts, must be active)
  if (refs.accountId) {
    checkNames.push(`Account (${refs.accountId})`)
    checks.push(db.account.findFirst({ where: { id: refs.accountId, active: true } }).then(Boolean))
  }

  // Currency check (Global catalog, must be active)
  if (refs.currencyId) {
    checkNames.push(`Currency (${refs.currencyId})`)
    checks.push(db.currency.findFirst({ where: { id: refs.currencyId, status: 'active' } }).then(Boolean))
  }

  // Cost Center check (Global catalog)
  if (refs.costCenterId) {
    checkNames.push(`CostCenter (${refs.costCenterId})`)
    checks.push(db.costCenter.findFirst({ where: { id: refs.costCenterId, active: true } }).then(Boolean))
  }

  // Category check (Global catalog)
  if (refs.categoryId) {
    checkNames.push(`Category (${refs.categoryId})`)
    checks.push(db.category.findFirst({ where: { id: refs.categoryId, active: true } }).then(Boolean))
  }

  // Sales Order check
  if (refs.salesOrderId) {
    checkNames.push(`SalesOrder (${refs.salesOrderId})`)
    checks.push(db.salesOrder.findFirst({ where: { id: refs.salesOrderId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Purchase Order check
  if (refs.purchaseOrderId) {
    checkNames.push(`PurchaseOrder (${refs.purchaseOrderId})`)
    checks.push(db.purchaseOrder.findFirst({ where: { id: refs.purchaseOrderId, companyId: ctx.companyId } }).then(Boolean))
  }

  // Execute all FK checks in parallel
  const results = await Promise.all(checks)
  for (let i = 0; i < results.length; i++) {
    if (!results[i]) {
      writeAudit({
        userId: ctx.userId,
        companyId: ctx.companyId,
        moduleCode: 'SECURITY',
        documentType: 'FK_INTEGRITY',
        action: 'cancel',
        reason: `TENANT_FK_INTEGRITY_VIOLATION: ${checkNames[i]} does not belong to authorized company ${ctx.companyId}`,
      }).catch(() => { })

      return {
        valid: false,
        error: badRequest(
          `خطأ في سلامة البيانات: السجل المرتبط (${checkNames[i]}) لا ينتمي لنفس الشركة المصرح بها`,
          'TENANT_FK_INTEGRITY_VIOLATION'
        ),
      }
    }
  }

  return { valid: true }
}

/**
 * Enforces companyId and optional branch scoping on Prisma `where` objects.
 */
export function scopedWhere<T extends Record<string, any>>(
  ctx: AuthContext,
  where?: T,
  options?: { branchScoped?: boolean }
): T & { companyId: string } {
  const result: any = { ...(where || {}) }
  result.companyId = ctx.companyId

  if (options?.branchScoped && !ctx.isSuperAdmin && ctx.authorizedBranchIds.length > 0) {
    if (result.branchId) {
      // If a specific branch is queried, ensure it is within authorized branches
      if (!ctx.authorizedBranchIds.includes(result.branchId)) {
        result.branchId = '__UNAUTHORIZED_BRANCH_BLOCK__'
      }
    } else {
      result.branchId = { in: ctx.authorizedBranchIds }
    }
  }

  return result
}

/**
 * IDOR Defense: Verifies that a fetched record belongs strictly to the user's active company.
 * If not, returns false (allowing route to return 404 anti-enumeration).
 */
export function assertTenantRecord<T extends { id?: string; companyId?: string | null }>(
  record: T | null | undefined,
  ctx: AuthContext
): record is T & { companyId: string } {
  if (!record) return false
  if (record.companyId !== ctx.companyId) {
    writeAudit({
      userId: ctx.userId,
      companyId: ctx.companyId,
      moduleCode: 'SECURITY',
      documentType: 'IDOR_ATTEMPT',
      documentId: record.id,
      action: 'cancel',
      reason: `IDOR attempt: Record companyId (${record.companyId}) != user companyId (${ctx.companyId})`,
    }).catch(() => { })
    return false
  }
  return true
}

/**
 * Mandatory Constraint 1: Strips any rogue tenantId, companyId, userId, createdBy from client body
 * and sets trusted server values.
 */
export function sanitizeTenantPayload<T extends Record<string, any>>(
  body: T,
  ctx: AuthContext,
  options?: { branchId?: string | null }
): Omit<T, 'companyId' | 'tenantId' | 'userId' | 'createdBy'> & {
  companyId: string
  createdBy: string
  branchId?: string | null
} {
  const { companyId: _c, tenantId: _t, userId: _u, createdBy: _cb, branchId: clientBranch, ...rest } = body

  const branchId = options?.branchId !== undefined
    ? options.branchId
    : (clientBranch && ctx.authorizedBranchIds.includes(clientBranch) ? clientBranch : ctx.branchId)

  return {
    ...(rest as any),
    companyId: ctx.companyId,
    createdBy: ctx.userId,
    branchId,
  }
}

/**
 * Checks if user is permitted to perform a specific screen action (13 actions).
 */
export async function checkScreenAction(
  ctx: AuthContext,
  screenCode: string,
  action: import('./screen-catalog').ScreenActionKey
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true
  const { getEffectiveScreenPrivilege } = await import('./effective-permissions')
  const decision = await getEffectiveScreenPrivilege(ctx.userId, ctx.companyId, screenCode)
  return Boolean(decision.actions[action])
}

/**
 * Checks effective transaction policy value for the current user.
 */
export async function checkTransactionPolicy<T = any>(
  ctx: AuthContext,
  policyKey: string
): Promise<T> {
  const { getEffectiveTransactionPolicy } = await import('./effective-permissions')
  const res = await getEffectiveTransactionPolicy(ctx.userId, ctx.companyId, policyKey)
  return res.value as T
}

/**
 * Checks if user is permitted to access a specific master record (record-level scoping).
 */
export async function checkInputPrivilege(
  ctx: AuthContext,
  inputCode: string,
  recordId: string,
  flag: 'canScreen' | 'canReports' | 'canDownload' | 'canAccess' = 'canAccess'
): Promise<boolean> {
  if (ctx.isSuperAdmin) return true
  const { getEffectiveInputPrivilege } = await import('./effective-permissions')
  const decision = await getEffectiveInputPrivilege(ctx.userId, ctx.companyId, inputCode, recordId)
  return Boolean(decision[flag])
}

/**
 * Enforces record-level access guard for sensitive resources.
 */
export async function requireInputPrivilege(
  req: Request,
  inputCode: string,
  recordId: string,
  flag: 'canScreen' | 'canReports' | 'canDownload' | 'canAccess' = 'canAccess'
): Promise<AuthContext | NextResponse> {
  const ctx = await requireAuth(req)
  if (isAuthFailure(ctx)) return ctx
  const allowed = await checkInputPrivilege(ctx, inputCode, recordId, flag)
  if (!allowed) {
    writeAudit({
      userId: ctx.userId,
      companyId: ctx.companyId,
      moduleCode: 'SECURITY',
      documentType: 'INPUT_RECORD_ACCESS',
      documentId: recordId,
      action: 'cancel',
      reason: `FORBIDDEN_RECORD_ACCESS: Flag ${flag} on input ${inputCode} record ${recordId}`,
    }).catch(() => { })
    return forbidden(`غير مصرح لك بالوصول إلى هذا السجل (${recordId}) في تصنيف المدخلات (${inputCode})`, 'INSUFFICIENT_RECORD_PRIVILEGE')
  }
  return ctx
}

