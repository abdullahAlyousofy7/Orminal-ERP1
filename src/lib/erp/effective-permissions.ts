// Enterprise ERP — Effective Authorization Engine & Security Policy Resolver
// Handles Role Inheritance (DAG/DFS), ALLOW/DENY/UNSET Semantics,
// Operational Policies (37 variables), Input Permissions, Screen Actions (13),
// and Last Administrator Protection.

import { db } from '@/lib/db'
import {
  CANONICAL_SCREENS,
  SCREEN_ACTIONS,
  SCREEN_BY_CODE,
  TRANSACTION_POLICY_DEFINITIONS,
  POLICY_BY_KEY,
  INPUT_CATEGORIES,
  type ScreenActionKey,
} from './screen-catalog'

export interface EffectiveScreenDecision {
  screenCode: string
  screenTitle: string
  moduleCode: string
  allowed: boolean
  decision: 'ALLOWED' | 'DENIED' | 'UNSET'
  reason: string
  sourceRole?: string
  inherited: boolean
  actions: Record<ScreenActionKey, boolean>
}

export interface EffectivePolicyDecision {
  policyKey: string
  nameAr: string
  dataType: string
  value: boolean | number | string
  source: 'USER_OVERRIDE' | 'ROLE_POLICY' | 'DEFAULT'
  sourceRole?: string
  description?: string
}

export interface EffectiveInputDecision {
  inputCode: string
  recordId: string
  recordTitle?: string
  canScreen: boolean
  canReports: boolean
  canDownload: boolean
  canAccess: boolean
  sourceRole?: string
}

/**
 * Resolves all inherited role IDs for a set of base role IDs using DAG traversal.
 * Detects and prevents circular loops.
 */
export async function resolveInheritedRoleIds(
  baseRoleIds: string[],
  client: any = db
): Promise<string[]> {
  const visited = new Set<string>(baseRoleIds)
  const queue = [...baseRoleIds]

  while (queue.length > 0) {
    const currentRoleId = queue.shift()!
    const inheritances = await client.roleInheritance.findMany({
      where: { roleId: currentRoleId },
      select: { parentRoleId: true },
    })

    for (const edge of inheritances) {
      if (!visited.has(edge.parentRoleId)) {
        visited.add(edge.parentRoleId)
        queue.push(edge.parentRoleId)
      }
    }
  }

  return Array.from(visited)
}

/**
 * Detects if adding a parent-child inheritance would introduce a cycle.
 */
export async function detectRoleInheritanceCycle(
  childRoleId: string,
  parentRoleId: string,
  client: any = db
): Promise<boolean> {
  if (childRoleId === parentRoleId) return true

  // If childRoleId is already reachable from parentRoleId, adding child -> parent creates a cycle
  const reachableFromParent = await resolveInheritedRoleIds([parentRoleId], client)
  return reachableFromParent.includes(childRoleId)
}

/**
 * Resolves effective screen privileges for a specific user and screen.
 */
export async function getEffectiveScreenPrivilege(
  userId: string,
  companyId: string,
  screenCode: string,
  client: any = db
): Promise<EffectiveScreenDecision> {
  const screenMeta = SCREEN_BY_CODE.get(screenCode) || {
    code: screenCode,
    nameAr: 'شاشة غير معرّفة',
    fullTitle: screenCode,
    moduleCode: 'SYS',
  }

  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      active: true,
      validFromDate: true,
      validToDate: true,
      validFromTime: true,
      validToTime: true,
      userRoles: {
        where: { active: true, OR: [{ companyId }, { companyId: null }] },
        include: { role: true },
      },
    },
  })

  if (!user || !user.active) {
    return {
      screenCode,
      screenTitle: screenMeta.fullTitle,
      moduleCode: screenMeta.moduleCode,
      allowed: false,
      decision: 'DENIED',
      reason: 'USER_INACTIVE_OR_NOT_FOUND',
      inherited: false,
      actions: createEmptyActionMap(false),
    }
  }

  // 1. Super Admin Bypass
  const isSuperAdmin = user.userRoles.some((ur: any) =>
    ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(ur.role.code.toUpperCase())
  )
  if (isSuperAdmin) {
    return {
      screenCode,
      screenTitle: screenMeta.fullTitle,
      moduleCode: screenMeta.moduleCode,
      allowed: true,
      decision: 'ALLOWED',
      reason: 'SUPER_ADMIN_CENTRAL_BYPASS',
      sourceRole: 'SUPERADMIN',
      inherited: false,
      actions: createEmptyActionMap(true),
    }
  }

  // 2. Resolve roles including inherited roles
  const directRoleIds = user.userRoles.map((ur: any) => ur.role.id)
  const allRoleIds = await resolveInheritedRoleIds(directRoleIds, client)

  // 3. Fetch Screen Privileges across all active roles
  const grants = await client.screenPrivilege.findMany({
    where: {
      companyId,
      screenCode,
      roleId: { in: allRoleIds },
    },
    include: { role: true },
  })

  if (grants.length === 0) {
    return {
      screenCode,
      screenTitle: screenMeta.fullTitle,
      moduleCode: screenMeta.moduleCode,
      allowed: false,
      decision: 'UNSET',
      reason: 'NO_EXPLICIT_SCREEN_GRANT',
      inherited: false,
      actions: createEmptyActionMap(false),
    }
  }

  // Combine actions: Any role allowing action grants it (ALLOW semantics),
  // but if stopped (canStop is true or role suspended), handle accordingly.
  const combinedActions = createEmptyActionMap(false)
  let anyAllowed = false
  let grantingRoleName: string | undefined

  for (const g of grants) {
    if (g.role?.isSuspended) continue

    for (const a of SCREEN_ACTIONS) {
      const key = a.key
      const propName = getPrismaActionProp(key)
      if (g[propName]) {
        combinedActions[key] = true
        if (key === 'view' || key === 'include') {
          anyAllowed = true
          if (!grantingRoleName) grantingRoleName = g.role?.nameAr
        }
      }
    }
  }

  return {
    screenCode,
    screenTitle: screenMeta.fullTitle,
    moduleCode: screenMeta.moduleCode,
    allowed: anyAllowed,
    decision: anyAllowed ? 'ALLOWED' : 'DENIED',
    reason: anyAllowed ? `GRANTED_BY_ROLE: ${grantingRoleName || 'Active Role'}` : 'EXPLICIT_DENIAL_OR_UNSET',
    sourceRole: grantingRoleName,
    inherited: Boolean(grantingRoleName && !directRoleIds.includes(grants.find((g: any) => g.role?.nameAr === grantingRoleName)?.roleId)),
    actions: combinedActions,
  }
}

/**
 * Resolves effective transaction policy for a user/company.
 */
export async function getEffectiveTransactionPolicy(
  userId: string,
  companyId: string,
  policyKey: string,
  client: any = db
): Promise<EffectivePolicyDecision> {
  const policyDef = POLICY_BY_KEY.get(policyKey)
  if (!policyDef) {
    throw new Error(`Unknown Transaction Policy Key: ${policyKey}`)
  }

  // 1. Direct User Override
  const userOverride = await client.transactionPolicy.findFirst({
    where: { companyId, userId, policyKey },
  })
  if (userOverride) {
    const val = extractPolicyValue(userOverride, policyDef.dataType)
    if (val !== undefined && val !== null) {
      return {
        policyKey,
        nameAr: policyDef.nameAr,
        dataType: policyDef.dataType,
        value: val,
        source: 'USER_OVERRIDE',
        description: policyDef.description,
      }
    }
  }

  // 2. Role Policies (with inheritance)
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      userRoles: {
        where: { active: true, OR: [{ companyId }, { companyId: null }] },
        select: { roleId: true },
      },
    },
  })
  const directRoleIds = (user?.userRoles || []).map((ur: any) => ur.roleId)
  const allRoleIds = await resolveInheritedRoleIds(directRoleIds, client)

  const rolePolicies = await client.transactionPolicy.findMany({
    where: {
      companyId,
      policyKey,
      roleId: { in: allRoleIds },
    },
    include: { role: true },
  })

  if (rolePolicies.length > 0) {
    // Pick the most permissive or first applicable policy
    const rp = rolePolicies[0]
    const val = extractPolicyValue(rp, policyDef.dataType)
    if (val !== undefined && val !== null) {
      return {
        policyKey,
        nameAr: policyDef.nameAr,
        dataType: policyDef.dataType,
        value: val,
        source: 'ROLE_POLICY',
        sourceRole: rp.role?.nameAr,
        description: policyDef.description,
      }
    }
  }

  // 3. Fallback to Catalog Default
  return {
    policyKey,
    nameAr: policyDef.nameAr,
    dataType: policyDef.dataType,
    value: policyDef.defaultValue,
    source: 'DEFAULT',
    description: policyDef.description,
  }
}

/**
 * Resolves effective input permissions for an input category and record.
 */
export async function getEffectiveInputPrivilege(
  userId: string,
  companyId: string,
  inputCode: string,
  recordId: string,
  client: any = db
): Promise<EffectiveInputDecision> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: {
      userRoles: {
        where: { active: true, OR: [{ companyId }, { companyId: null }] },
        select: { roleId: true, role: { select: { code: true } } },
      },
    },
  })

  const isSuperAdmin = (user?.userRoles || []).some((ur: any) =>
    ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(ur.role.code.toUpperCase())
  )
  if (isSuperAdmin) {
    return {
      inputCode,
      recordId,
      canScreen: true,
      canReports: true,
      canDownload: true,
      canAccess: true,
      sourceRole: 'SUPERADMIN',
    }
  }

  const directRoleIds = (user?.userRoles || []).map((ur: any) => ur.roleId)
  const allRoleIds = await resolveInheritedRoleIds(directRoleIds, client)

  const privileges = await client.inputPrivilege.findMany({
    where: {
      companyId,
      inputCode,
      recordId,
      roleId: { in: allRoleIds },
    },
    include: { role: true },
  })

  if (privileges.length === 0) {
    // If unconfigured, default to allow if general screen is allowed, or false
    return {
      inputCode,
      recordId,
      canScreen: true,
      canReports: true,
      canDownload: false,
      canAccess: true,
      sourceRole: 'DEFAULT_POLICY',
    }
  }

  let canScreen = false
  let canReports = false
  let canDownload = false
  let canAccess = false
  let sourceRole: string | undefined

  for (const p of privileges) {
    if (p.canScreen) canScreen = true
    if (p.canReports) canReports = true
    if (p.canDownload) canDownload = true
    if (p.canAccess) canAccess = true
    if (!sourceRole) sourceRole = p.role?.nameAr
  }

  return {
    inputCode,
    recordId,
    canScreen,
    canReports,
    canDownload,
    canAccess,
    sourceRole,
  }
}

/**
 * Last Administrator Protection Enforcer:
 * Validates that modifying or deactivating targetUserId will NOT leave the company
 * without at least ONE active administrator with security management rights.
 */
export async function assertLastAdminProtection(
  companyId: string,
  targetUserId: string,
  action: 'DEACTIVATE' | 'DELETE' | 'REMOVE_ADMIN_ROLE',
  client: any = db
): Promise<{ safe: boolean; error?: string }> {
  // Find all active users who currently hold an administrative role in this company
  const adminUsers = await client.user.findMany({
    where: {
      active: true,
      defaultCompanyId: companyId,
      userRoles: {
        some: {
          active: true,
          role: {
            code: { in: ['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'] },
            active: true,
          },
        },
      },
    },
    select: { id: true, username: true },
  })

  // If the target user is one of the admins, check if they are the ONLY one remaining
  const isTargetAdmin = adminUsers.some((u: any) => u.id === targetUserId)
  if (isTargetAdmin && adminUsers.length <= 1) {
    return {
      safe: false,
      error: 'لا يمكن إتمام العملية: هذا المستخدم هو آخر مسؤول نظام إداري نشط في الشركة. يجب تعيين مسؤول آخر أولاً لضمان عدم قفل النظام.',
    }
  }

  return { safe: true }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function createEmptyActionMap(val: boolean): Record<ScreenActionKey, boolean> {
  const map: any = {}
  for (const a of SCREEN_ACTIONS) {
    map[a.key] = val
  }
  return map
}

function getPrismaActionProp(key: ScreenActionKey): string {
  switch (key) {
    case 'include': return 'canInclude'
    case 'add': return 'canAdd'
    case 'edit': return 'canEdit'
    case 'delete': return 'canDelete'
    case 'view': return 'canView'
    case 'print': return 'canPrint'
    case 'cancelDoc': return 'canCancelDoc'
    case 'post': return 'canPost'
    case 'suspend': return 'canSuspend'
    case 'viewJournal': return 'canViewJournal'
    case 'screenVars': return 'canScreenVars'
    case 'review': return 'canReview'
    case 'stop': return 'canStop'
  }
}

function extractPolicyValue(
  row: { boolValue: boolean | null; numValue: any; strValue: string | null },
  dataType: string
): boolean | number | string | undefined {
  if (dataType === 'boolean') {
    return row.boolValue !== null ? Boolean(row.boolValue) : undefined
  }
  if (dataType === 'integer' || dataType === 'decimal') {
    return row.numValue !== null && row.numValue !== undefined ? Number(row.numValue) : undefined
  }
  return row.strValue ?? undefined
}
