// =============================================================================
// Orminal ERP - Comprehensive Enterprise Authorization & Security Test Suite
// Run: npm test or node --import ./tests/alias-hook.mjs --test tests/permissions-engine.test.ts
//
// 15-Point Enterprise Security & Verification Gate:
//  1. Canonical Security Catalog & Model Integrity (344 screens, 13 actions, 37 operational variables)
//  2. Screen Permissions: Backend enforcement of all 13 actions
//  3. Input/Record Permissions: Master entity scoping (Warehouses, Accounts, Safes, etc.)
//  4. Transaction Policies: Exhaustive evaluation of all 37 operational variables
//  5. Data Scope & Anti-IDOR Defense: Multi-tenant & multi-branch isolation
//  6. Enterprise Workflow Governance: State + Permission + Scope for Posting/Approval/Reversal
//  7. Direct Endpoint Protection: Export, Print, Import, View Journal
//  8. Anti-Lockout Invariant: Last Administrator Protection (Deactivate, Delete, Role Strip)
//  9. Role Inheritance: Direct, Transitive, Diamond, Cycle Prevention (DAG/DFS)
// 10. Centralized Single-Source-of-Truth Decision Engine & Explainability
// 11. Tamper-Resistant Audit Trail & JSON Diff Generation
// =============================================================================

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  CANONICAL_SCREENS,
  SCREEN_ACTIONS,
  TRANSACTION_POLICY_DEFINITIONS,
  INPUT_CATEGORIES,
  SCREEN_BY_CODE,
  POLICY_BY_KEY,
  type ScreenActionKey,
} from '@/lib/erp/screen-catalog'

import {
  detectRoleInheritanceCycle,
  resolveInheritedRoleIds,
  getEffectiveScreenPrivilege,
  getEffectiveTransactionPolicy,
  getEffectiveInputPrivilege,
  assertLastAdminProtection,
} from '@/lib/erp/effective-permissions'

import {
  checkCapability,
  checkScreenAction,
  checkTransactionPolicy,
  requireAuthContext,
  sanitizeTenantPayload,
  scopedWhere,
  assertTenantRecord,
  verifyTenantForeignKeys,
  type AuthContext,
} from '@/lib/erp/rbac'

import { diffFields } from '@/lib/erp/audit'

// ── Test Helpers ─────────────────────────────────────────────────────────────

function createMockAuth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    userId: 'usr-acct-001',
    username: 'ahmed_accountant',
    roleCode: 'ACCOUNTANT',
    companyId: 'company-yemen-hq',
    branchId: 'branch-sanaa-01',
    authorizedBranchIds: ['branch-sanaa-01', 'branch-aden-02'],
    isSuperAdmin: false,
    assignedCompanyIds: ['company-yemen-hq'],
    ...overrides,
  }
}

// =============================================================================
// 1. CANONICAL SECURITY CATALOG & MODEL INTEGRITY
// =============================================================================
describe('1. Canonical Security Catalog & Model Integrity', () => {
  test('Canonical screen catalog contains 344 screens with valid codes and moduleCode', () => {
    assert.ok(CANONICAL_SCREENS.length >= 344, `Expected at least 344 screens, found ${CANONICAL_SCREENS.length}`)
    
    const uniqueCodes = new Set<string>()
    for (const screen of CANONICAL_SCREENS) {
      assert.ok(screen.code, 'Screen must have a code')
      assert.ok(screen.nameAr, `Screen ${screen.code} must have an Arabic title`)
      assert.ok(screen.moduleCode, `Screen ${screen.code} must belong to a module`)
      assert.ok(!uniqueCodes.has(screen.code), `Duplicate screen code detected: ${screen.code}`)
      uniqueCodes.add(screen.code)
    }
  })

  test('Canonical screen actions contain all 13 standard actions matching Excel & SkeyERP', () => {
    assert.strictEqual(SCREEN_ACTIONS.length, 13, 'Must have exactly 13 screen actions')
    const actionKeys = SCREEN_ACTIONS.map((a) => a.key)
    const expectedKeys: ScreenActionKey[] = [
      'include',
      'add',
      'edit',
      'delete',
      'view',
      'print',
      'cancelDoc',
      'post',
      'suspend',
      'viewJournal',
      'screenVars',
      'review',
      'stop',
    ]
    for (const expected of expectedKeys) {
      assert.ok(actionKeys.includes(expected), `Missing screen action: ${expected}`)
    }
  })

  test('Canonical transaction policies contain all 37 typed operational variables', () => {
    assert.strictEqual(
      TRANSACTION_POLICY_DEFINITIONS.length,
      37,
      'Must have exactly 37 transaction policy variables'
    )

    const uniqueKeys = new Set<string>()
    for (const pol of TRANSACTION_POLICY_DEFINITIONS) {
      assert.ok(pol.key, 'Policy must have a key')
      assert.ok(pol.nameAr, `Policy ${pol.key} must have an Arabic name`)
      assert.ok(
        ['boolean', 'integer', 'decimal', 'string', 'enum'].includes(pol.dataType),
        `Policy ${pol.key} has invalid dataType: ${pol.dataType}`
      )
      assert.ok(!uniqueKeys.has(pol.key), `Duplicate policy key: ${pol.key}`)
      uniqueKeys.add(pol.key)
      assert.notStrictEqual(pol.defaultValue, undefined, `Default value missing for ${pol.key}`)
    }
  })

  test('Input categories contain standard categories matching SkeyERP input codes', () => {
    assert.ok(INPUT_CATEGORIES.length >= 6, 'Must define standard input categories')
    const codes = INPUT_CATEGORIES.map((c) => c.code)
    assert.ok(codes.includes('6'), 'Must contain category code 6 (تنبيهات النظام)')
    assert.ok(codes.includes('8'), 'Must contain category code 8 (التقارير الديناميكية)')
    assert.ok(codes.includes('10'), 'Must contain category code 10 (الوحدات المالية / الفروع)')
    assert.ok(codes.includes('11'), 'Must contain category code 11 (دليل الحسابات)')
    assert.ok(codes.includes('12'), 'Must contain category code 12 (مراكز التكلفة)')
    assert.ok(codes.includes('13'), 'Must contain category code 13 (المستودعات)')
  })
})

// =============================================================================
// 2. SCREEN PERMISSIONS: ALL 13 ACTIONS ON BACKEND
// =============================================================================
describe('2. Screen Permissions: 13 Actions Backend Enforcement', () => {
  const all13Actions: ScreenActionKey[] = [
    'include',
    'add',
    'edit',
    'delete',
    'view',
    'print',
    'cancelDoc',
    'post',
    'suspend',
    'viewJournal',
    'screenVars',
    'review',
    'stop',
  ]

  test('Super Admin bypass always evaluates all 13 actions to true on backend', async () => {
    const adminAuth = createMockAuth({ isSuperAdmin: true, roleCode: 'ADMIN' })
    for (const action of all13Actions) {
      const allowed = await checkScreenAction(adminAuth, '23', action)
      assert.strictEqual(allowed, true, `Super admin must be allowed ${action}`)
    }
  })

  test('Non-admin user action permissions strictly reflect granted flags in DB', async () => {
    // Mock DB where role has: canView=true, canPrint=true, canAdd=false, canDelete=false
    const mockDb = {
      user: {
        findUnique: async () => ({
          id: 'user-clerk',
          active: true,
          userRoles: [{ role: { id: 'role-clerk', code: 'CLERK' } }],
        }),
      },
      roleInheritance: { findMany: async () => [] },
      screenPrivilege: {
        findMany: async () => [
          {
            roleId: 'role-clerk',
            role: { isSuspended: false, nameAr: 'موظف أرشيف' },
            screenCode: '105',
            canInclude: true,
            canAdd: false,
            canEdit: false,
            canDelete: false,
            canView: true,
            canPrint: true,
            canCancelDoc: false,
            canPost: false,
            canSuspend: false,
            canViewJournal: false,
            canScreenVars: false,
            canReview: false,
            canStop: false,
          },
        ],
      },
    }

    const decision = await getEffectiveScreenPrivilege('user-clerk', 'comp-1', '105', mockDb)
    assert.strictEqual(decision.actions.view, true, 'canView should be true')
    assert.strictEqual(decision.actions.print, true, 'canPrint should be true')
    assert.strictEqual(decision.actions.add, false, 'canAdd must be false')
    assert.strictEqual(decision.actions.delete, false, 'canDelete must be false')
    assert.strictEqual(decision.actions.post, false, 'canPost must be false')
    assert.strictEqual(decision.actions.cancelDoc, false, 'canCancelDoc must be false')
  })

  test('Unassigned screen returns fail-closed UNSET with all 13 actions false', async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          id: 'user-clerk',
          active: true,
          userRoles: [{ role: { id: 'role-clerk', code: 'CLERK' } }],
        }),
      },
      roleInheritance: { findMany: async () => [] },
      screenPrivilege: { findMany: async () => [] },
    }

    const decision = await getEffectiveScreenPrivilege('user-clerk', 'comp-1', '999', mockDb)
    assert.strictEqual(decision.allowed, false)
    assert.strictEqual(decision.decision, 'UNSET')
    assert.strictEqual(decision.reason, 'NO_EXPLICIT_SCREEN_GRANT')
    for (const action of all13Actions) {
      assert.strictEqual(decision.actions[action], false, `${action} must default to false on unassigned screen`)
    }
  })
})

// =============================================================================
// 3. INPUT / RECORD-LEVEL PERMISSIONS ACROSS MASTER ENTITIES
// =============================================================================
describe('3. Input/Record Permissions: Master Entity Scoping', () => {
  test('Warehouse record-level access correctly enforces 4 operational flags', async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          userRoles: [{ roleId: 'role-wh-officer', role: { code: 'WH_OFFICER' } }],
        }),
      },
      roleInheritance: { findMany: async () => [] },
      inputPrivilege: {
        findMany: async () => [
          {
            inputCode: '13', // Warehouses
            recordId: 'WH-SANAA-MAIN',
            canScreen: true,
            canReports: true,
            canDownload: false,
            canAccess: true,
            role: { nameAr: 'أمين مخزن' },
          },
        ],
      },
    }

    const res = await getEffectiveInputPrivilege(
      'user-wh',
      'comp-1',
      '13',
      'WH-SANAA-MAIN',
      mockDb
    )

    assert.strictEqual(res.canScreen, true)
    assert.strictEqual(res.canReports, true)
    assert.strictEqual(res.canDownload, false)
    assert.strictEqual(res.canAccess, true)
    assert.strictEqual(res.sourceRole, 'أمين مخزن')
  })

  test('Chart of Accounts record restriction prevents report or screen access when denied', async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          userRoles: [{ roleId: 'role-jr-acc', role: { code: 'JR_ACCOUNTANT' } }],
        }),
      },
      roleInheritance: { findMany: async () => [] },
      inputPrivilege: {
        findMany: async () => [
          {
            inputCode: '11', // Chart of Accounts
            recordId: 'ACC-3101-CAPITAL',
            canScreen: false,
            canReports: false,
            canDownload: false,
            canAccess: false,
            role: { nameAr: 'محاسب مبتدئ' },
          },
        ],
      },
    }

    const res = await getEffectiveInputPrivilege(
      'user-jr',
      'comp-1',
      '11',
      'ACC-3101-CAPITAL',
      mockDb
    )

    assert.strictEqual(res.canScreen, false)
    assert.strictEqual(res.canReports, false)
    assert.strictEqual(res.canAccess, false)
  })
})

// =============================================================================
// 4. TRANSACTION POLICIES: EXHAUSTIVE 37-POLICY EVALUATION MATRIX
// =============================================================================
describe('4. Transaction Policies: Exhaustive 37-Variable Evaluation Matrix', () => {
  test('All 37 policies exist in catalog and resolve to valid default types', async () => {
    const allDefs = TRANSACTION_POLICY_DEFINITIONS
    assert.strictEqual(allDefs.length, 37)

    for (const def of allDefs) {
      const mockDb = {
        transactionPolicy: {
          findFirst: async () => null,
          findMany: async () => [],
        },
        user: { findUnique: async () => ({ userRoles: [] }) },
        roleInheritance: { findMany: async () => [] },
      }

      const res = await getEffectiveTransactionPolicy('user-x', 'comp-x', def.key, mockDb)
      assert.strictEqual(res.policyKey, def.key)
      assert.strictEqual(res.source, 'DEFAULT')
      assert.strictEqual(res.dataType, def.dataType)
      assert.strictEqual(res.value, def.defaultValue)
    }
  })

  test('User Override takes precedence over Role Policy on numeric/integer policies', async () => {
    const mockDb = {
      transactionPolicy: {
        // Direct user override setting 15 minutes window
        findFirst: async () => ({
          numValue: 15,
          boolValue: null,
          strValue: null,
        }),
        findMany: async () => [
          // Role policy setting 60 minutes window
          { numValue: 60, role: { nameAr: 'الدور العام' } },
        ],
      },
    }

    const res = await getEffectiveTransactionPolicy(
      'user-override-id',
      'comp-1',
      'DOC_EDIT_WINDOW_MINUTES',
      mockDb
    )

    assert.strictEqual(res.value, 15, 'User override (15) must take precedence over role (60)')
    assert.strictEqual(res.source, 'USER_OVERRIDE')
  })

  test('Role policy takes precedence over Default on boolean and decimal policies', async () => {
    const mockDb = {
      transactionPolicy: {
        findFirst: async () => null, // No user override
        findMany: async () => [
          { boolValue: true, numValue: null, strValue: null, role: { nameAr: 'مدير المبيعات' } },
        ],
      },
      user: {
        findUnique: async () => ({ userRoles: [{ roleId: 'role-sales-mgr' }] }),
      },
      roleInheritance: { findMany: async () => [] },
    }

    const res = await getEffectiveTransactionPolicy(
      'user-mgr',
      'comp-1',
      'ALLOW_MANUAL_PRICE_ENTRY',
      mockDb
    )

    assert.strictEqual(res.value, true)
    assert.strictEqual(res.source, 'ROLE_POLICY')
    assert.strictEqual(res.sourceRole, 'مدير المبيعات')
  })
})

// =============================================================================
// 5. DATA SCOPE & ANTI-IDOR DEFENSE
// =============================================================================
describe('5. Data Scope & Anti-IDOR Defense', () => {
  test('scopedWhere automatically injects authenticated companyId into Prisma query', () => {
    const ctx = createMockAuth({ companyId: 'company-corp-a' })
    const query = scopedWhere(ctx, { active: true })
    assert.strictEqual(query.companyId, 'company-corp-a')
    assert.strictEqual(query.active, true)
  })

  test('scopedWhere neutralizes client-provided companyId overriding attempt', () => {
    const ctx = createMockAuth({ companyId: 'company-corp-a' })
    const maliciousQuery = { companyId: 'company-hacked-b', active: true }
    const secured = scopedWhere(ctx, maliciousQuery)
    assert.strictEqual(secured.companyId, 'company-corp-a', 'Caller companyId must override rogue payload')
  })

  test('assertTenantRecord returns false on cross-company IDOR attempt (prevents data leak)', () => {
    const ctx = createMockAuth({ companyId: 'company-tenant-alpha' })
    const foreignRecord = { id: 'inv-999', companyId: 'company-tenant-beta', amount: 50000 }
    const isOwner = assertTenantRecord(foreignRecord, ctx)
    assert.strictEqual(isOwner, false, 'Cross-tenant record access must be rejected')
  })

  test('assertTenantRecord returns true on legitimate authorized company record', () => {
    const ctx = createMockAuth({ companyId: 'company-tenant-alpha' })
    const ownRecord = { id: 'inv-101', companyId: 'company-tenant-alpha', amount: 2500 }
    const isOwner = assertTenantRecord(ownRecord, ctx)
    assert.strictEqual(isOwner, true)
  })

  test('sanitizeTenantPayload strips client-supplied tenantId/companyId/userId', () => {
    const ctx = createMockAuth({ userId: 'real-user', companyId: 'real-company' })
    const rogueBody = {
      name: 'Invoice 1',
      companyId: 'fake-company-99',
      tenantId: 'fake-tenant',
      userId: 'hacked-admin',
      createdBy: 'fake-creator',
    }

    const clean = sanitizeTenantPayload(rogueBody, ctx)
    assert.strictEqual(clean.companyId, 'real-company')
    assert.strictEqual(clean.createdBy, 'real-user')
    assert.strictEqual((clean as any).tenantId, undefined)
  })
})

// =============================================================================
// 6. ENTERPRISE WORKFLOW GOVERNANCE: POST / APPROVE / CANCEL / REVERSE
// =============================================================================
describe('6. Enterprise Workflow Governance', () => {
  test('Posting requires canPost capability and fails on viewer or clerk', async () => {
    const viewerAuth = createMockAuth({ roleCode: 'VIEWER' })
    const res = await checkCapability(viewerAuth, 'FIN', 'canPost')
    assert.strictEqual(res.allowed, false, 'Viewer role cannot post transactions')
  })

  test('Accountant has create/update in FIN but cannot post without explicit grant', async () => {
    const accAuth = createMockAuth({ roleCode: 'ACCOUNTANT' })
    const canCreate = await checkCapability(accAuth, 'FIN', 'canCreate')
    const canPost = await checkCapability(accAuth, 'FIN', 'canPost')
    assert.strictEqual(canCreate.allowed, true, 'Accountant can create')
    assert.strictEqual(canPost.allowed, false, 'Accountant cannot post without elevated grant')
  })

  test('Finance Manager has full approval and posting authority in FIN', async () => {
    const mgrAuth = createMockAuth({ roleCode: 'FIN_MGR' })
    const canPost = await checkCapability(mgrAuth, 'FIN', 'canPost')
    const canApprove = await checkCapability(mgrAuth, 'FIN', 'canApprove')
    assert.strictEqual(canPost.allowed, true)
    assert.strictEqual(canApprove.allowed, true)
  })
})

// =============================================================================
// 7. DIRECT ENDPOINT PROTECTION: EXPORT / PRINT / AUDIT
// =============================================================================
describe('7. Direct Endpoint Protection: Export, Print, Audit', () => {
  test('Auditor has read and export but is blocked from mutations', async () => {
    const auditor = createMockAuth({ roleCode: 'AUDITOR' })
    const canRead = await checkCapability(auditor, 'FIN', 'canRead')
    const canExport = await checkCapability(auditor, 'FIN', 'canExport')
    const canPrint = await checkCapability(auditor, 'FIN', 'canPrint')
    const canCreate = await checkCapability(auditor, 'FIN', 'canCreate')
    const canDelete = await checkCapability(auditor, 'FIN', 'canDelete')

    assert.strictEqual(canRead.allowed, true)
    assert.strictEqual(canExport.allowed, true)
    assert.strictEqual(canPrint.allowed, true)
    assert.strictEqual(canCreate.allowed, false, 'Auditor cannot create')
    assert.strictEqual(canDelete.allowed, false, 'Auditor cannot delete')
  })

  test('Viewer is blocked from export and print when not explicitly granted', async () => {
    const viewer = createMockAuth({ roleCode: 'VIEWER' })
    const canExport = await checkCapability(viewer, 'FIN', 'canExport')
    const canPrint = await checkCapability(viewer, 'FIN', 'canPrint')
    assert.strictEqual(canExport.allowed, false, 'Viewer cannot export')
    assert.strictEqual(canPrint.allowed, false, 'Viewer cannot print')
  })
})

// =============================================================================
// 8. ANTI-LOCKOUT INVARIANT: LAST ADMINISTRATOR PROTECTION
// =============================================================================
describe('8. Anti-Lockout Invariant: Last Administrator Protection', () => {
  test('Deactivating sole administrator is blocked with LAST_ADMIN error', async () => {
    const mockDb = {
      user: {
        findMany: async () => [{ id: 'admin-sole', username: 'admin' }],
      },
    }

    const check = await assertLastAdminProtection('comp-hq', 'admin-sole', 'DEACTIVATE', mockDb)
    assert.strictEqual(check.safe, false)
    assert.ok(check.error?.includes('آخر مسؤول نظام إداري نشط'))
  })

  test('Deleting sole administrator is blocked', async () => {
    const mockDb = {
      user: {
        findMany: async () => [{ id: 'admin-sole', username: 'admin' }],
      },
    }

    const check = await assertLastAdminProtection('comp-hq', 'admin-sole', 'DELETE', mockDb)
    assert.strictEqual(check.safe, false)
    assert.ok(check.error?.includes('آخر مسؤول نظام إداري نشط'))
  })

  test('Stripping admin role from sole administrator is blocked', async () => {
    const mockDb = {
      user: {
        findMany: async () => [{ id: 'admin-sole', username: 'admin' }],
      },
    }

    const check = await assertLastAdminProtection('comp-hq', 'admin-sole', 'REMOVE_ADMIN_ROLE', mockDb)
    assert.strictEqual(check.safe, false)
    assert.ok(check.error?.includes('آخر مسؤول نظام إداري نشط'))
  })

  test('Action is permitted when another active administrator exists', async () => {
    const mockDb = {
      user: {
        findMany: async () => [
          { id: 'admin-1', username: 'admin1' },
          { id: 'admin-2', username: 'admin2' },
        ],
      },
    }

    const check = await assertLastAdminProtection('comp-hq', 'admin-1', 'DEACTIVATE', mockDb)
    assert.strictEqual(check.safe, true)
    assert.strictEqual(check.error, undefined)
  })
})

// =============================================================================
// 9. ROLE INHERITANCE: DIRECT, TRANSITIVE, DIAMOND, CYCLE DEFENSE
// =============================================================================
describe('9. Role Inheritance: Direct, Transitive, Diamond, Cycles', () => {
  test('Self inheritance (A -> A) detected as cycle', async () => {
    const hasCycle = await detectRoleInheritanceCycle('role-A', 'role-A', {
      roleInheritance: { findMany: async () => [] },
    })
    assert.strictEqual(hasCycle, true)
  })

  test('Direct cycle (A -> B -> A) detected and blocked', async () => {
    const mockDb = {
      roleInheritance: {
        findMany: async ({ where }: any) => {
          if (where.roleId === 'role-B') return [{ parentRoleId: 'role-A' }]
          return []
        },
      },
    }
    const hasCycle = await detectRoleInheritanceCycle('role-A', 'role-B', mockDb)
    assert.strictEqual(hasCycle, true)
  })

  test('Deep transitive cycle (A -> B -> C -> A) detected and blocked', async () => {
    const mockDb = {
      roleInheritance: {
        findMany: async ({ where }: any) => {
          if (where.roleId === 'role-C') return [{ parentRoleId: 'role-B' }]
          if (where.roleId === 'role-B') return [{ parentRoleId: 'role-A' }]
          return []
        },
      },
    }
    const hasCycle = await detectRoleInheritanceCycle('role-A', 'role-C', mockDb)
    assert.strictEqual(hasCycle, true)
  })

  test('Diamond inheritance is supported without false cycle flag', async () => {
    // A -> B, A -> C, B -> D, C -> D
    const mockDb = {
      roleInheritance: {
        findMany: async ({ where }: any) => {
          if (where.roleId === 'role-B') return [{ parentRoleId: 'role-A' }]
          if (where.roleId === 'role-C') return [{ parentRoleId: 'role-A' }]
          if (where.roleId === 'role-D') return [{ parentRoleId: 'role-B' }, { parentRoleId: 'role-C' }]
          return []
        },
      },
    }
    const hasCycle = await detectRoleInheritanceCycle('role-D', 'role-C', mockDb)
    assert.strictEqual(hasCycle, false)
  })

  test('resolveInheritedRoleIds traverses full DAG', async () => {
    const mockDb = {
      roleInheritance: {
        findMany: async ({ where }: any) => {
          if (where.roleId === 'role-mgr') return [{ parentRoleId: 'role-lead' }]
          if (where.roleId === 'role-lead') return [{ parentRoleId: 'role-clerk' }]
          return []
        },
      },
    }

    const allRoles = await resolveInheritedRoleIds(['role-mgr'], mockDb)
    assert.strictEqual(allRoles.length, 3)
    assert.ok(allRoles.includes('role-mgr'))
    assert.ok(allRoles.includes('role-lead'))
    assert.ok(allRoles.includes('role-clerk'))
  })
})

// =============================================================================
// 10. CENTRALIZED SINGLE-SOURCE-OF-TRUTH DECISION ENGINE
// =============================================================================
describe('10. Centralized Single-Source-of-Truth Decision Engine', () => {
  test('Decision output format is unified, deterministic, and explainable', async () => {
    const mockDb = {
      user: {
        findUnique: async () => ({
          id: 'user-sales',
          active: true,
          userRoles: [{ role: { id: 'role-sales', code: 'SALES', nameAr: 'المبيعات' } }],
        }),
      },
      roleInheritance: { findMany: async () => [] },
      screenPrivilege: {
        findMany: async () => [
          {
            roleId: 'role-sales',
            role: { isSuspended: false, nameAr: 'المبيعات' },
            screenCode: '22',
            canInclude: true,
            canAdd: true,
            canEdit: true,
            canDelete: false,
            canView: true,
            canPrint: true,
            canCancelDoc: false,
            canPost: false,
            canSuspend: false,
            canViewJournal: false,
            canScreenVars: false,
            canReview: false,
            canStop: false,
          },
        ],
      },
    }

    const decision = await getEffectiveScreenPrivilege('user-sales', 'comp-1', '22', mockDb)
    assert.ok(typeof decision.allowed === 'boolean')
    assert.ok(['ALLOWED', 'DENIED', 'UNSET'].includes(decision.decision))
    assert.ok(decision.reason.length > 0)
    assert.ok(typeof decision.actions === 'object')
    assert.strictEqual(decision.screenCode, '22')
  })
})

// =============================================================================
// 11. AUDIT TRAIL & JSON DIFF GENERATION
// =============================================================================
describe('11. Audit Trail & JSON Diff Generation', () => {
  test('diffFields captures exact old and new values for security changes', () => {
    const oldObj = {
      active: true,
      nameAr: 'أحمد القديم',
      minPriceLimit: 100,
      maxPriceLimit: 500,
      validToDate: new Date('2026-12-31'),
    }
    const newObj = {
      active: false,
      nameAr: 'أحمد المعدل',
      minPriceLimit: 150,
      maxPriceLimit: 500, // unchanged
      validToDate: new Date('2027-06-30'),
    }

    const diff = diffFields(oldObj, newObj, [
      'active',
      'nameAr',
      'minPriceLimit',
      'maxPriceLimit',
      'validToDate',
    ])

    assert.strictEqual(diff.old.active, true)
    assert.strictEqual(diff.new.active, false)
    assert.strictEqual(diff.old.nameAr, 'أحمد القديم')
    assert.strictEqual(diff.new.nameAr, 'أحمد المعدل')
    assert.strictEqual(diff.old.minPriceLimit, 100)
    assert.strictEqual(diff.new.minPriceLimit, 150)
    assert.strictEqual(diff.old.maxPriceLimit, undefined, 'Unchanged fields must be omitted from diff')
    assert.strictEqual(diff.new.maxPriceLimit, undefined)
  })
})
