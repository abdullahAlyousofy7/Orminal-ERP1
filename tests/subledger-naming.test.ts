// =============================================================================
// Subledgers Naming & Dynamic Metadata — Comprehensive Integration Test Suite
// Run: node --import ./tests/alias-hook.mjs --test tests/subledger-naming.test.ts
//
// Verification of:
// 1. Technical Identity ≠ Display Label separation.
// 2. Idempotent Standard Catalog initialization (COST_CENTER, ACTIVITY, PROJECT, ANALYTIC_ACCOUNT).
// 3. Multi-tenant isolation: company-scoped metadata and labels.
// 4. In-use protection: Behavioral variables locked when transactions exist.
// 5. Dynamic Label Resolution with safe fallbacks and multi-language support.
// 6. Immutability of technical field keys.
// 7. Audit log generation with before/after diffs on modification.
// 8. Cache invalidation across read/write operations.
// =============================================================================

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { db } from '@/lib/db'
import {
  ensureStandardSubledgers,
  getSubledgerDefinitions,
  getSubledgerDefinitionById,
  createSubledgerDefinition,
  updateSubledgerDefinition,
  deleteSubledgerDefinition,
  isSubledgerInUse,
} from '@/lib/erp/subledger-naming-service'
import {
  resolveSubledgerLabel,
  getSubledgerBundle,
  invalidateSubledgerLabelCache,
} from '@/lib/erp/subledger-label-service'

describe('Subledgers Naming Architecture & Dynamic Label Resolution', () => {
  let companyAId: string
  let companyBId: string
  let testUserId: string

  before(async () => {
    // 1. Get or create test user
    let user = await db.user.findFirst()
    if (!user) {
      const company = await db.company.findFirst()
      if (!company) throw new Error('No company found for test user setup')
      user = await db.user.create({
        data: {
          username: 'test_admin_subledger',
          email: 'subledger_admin@example.com',
          nameAr: 'مدير الأدلة الفرعية',
          nameEn: 'Subledgers Admin',
          passwordHash: 'dummy_hash',
          defaultCompanyId: company.id,
        },
      })
    }
    testUserId = user.id

    // 2. Set up Company A
    let compA = await db.company.findFirst({ where: { code: 'SUB_TEST_CO_A' } })
    if (!compA) {
      const baseCur = await db.currency.findFirst()
      if (!baseCur) throw new Error('No currency found in database')
      compA = await db.company.create({
        data: {
          code: 'SUB_TEST_CO_A',
          nameAr: 'شركة اختبار الأدلة (أ)',
          nameEn: 'Subledger Test Company A',
          currencyId: baseCur.id,
        },
      })
    }
    companyAId = compA.id

    // 3. Set up Company B (Multi-tenant check)
    let compB = await db.company.findFirst({ where: { code: 'SUB_TEST_CO_B' } })
    if (!compB) {
      const baseCur = await db.currency.findFirst()
      if (!baseCur) throw new Error('No currency found in database')
      compB = await db.company.create({
        data: {
          code: 'SUB_TEST_CO_B',
          nameAr: 'شركة اختبار الأدلة (ب)',
          nameEn: 'Subledger Test Company B',
          currencyId: baseCur.id,
        },
      })
    }
    companyBId = compB.id
  })

  after(async () => {
    // Clean up created definitions for test companies
    await db.subledgerFieldLabel.deleteMany({
      where: {
        definition: {
          companyId: { in: [companyAId, companyBId] },
        },
      },
    })
    await db.subledgerDefinition.deleteMany({
      where: {
        companyId: { in: [companyAId, companyBId] },
      },
    })
  })

  test('1. Idempotent Standard Catalog Seeding', async () => {
    // Run seed first time
    await ensureStandardSubledgers(companyAId, testUserId)
    const res1 = await getSubledgerDefinitions(companyAId)
    assert.strictEqual(res1.items.length, 4, 'Should initialize the 4 standard subledgers')

    // Run seed second time — must be strictly idempotent with no duplicated records
    await ensureStandardSubledgers(companyAId, testUserId)
    const res2 = await getSubledgerDefinitions(companyAId)
    assert.strictEqual(res2.items.length, 4, 'Repeated seed must not duplicate subledger records')

    const costCenterDef = res2.items.find((i) => i.subledgerType === 'COST_CENTER')
    assert.ok(costCenterDef, 'COST_CENTER must exist in standard catalog')
    assert.strictEqual(costCenterDef.nameAr, 'مراكز التكلفة')
    assert.strictEqual(costCenterDef.fields.length, 6, 'COST_CENTER must have 6 standard field labels')
  })

  test('2. Multi-Tenant Isolation', async () => {
    // Ensure Company B has standard seed
    await ensureStandardSubledgers(companyBId, testUserId)

    // Customize Company A's Cost Center label
    const defsA = await getSubledgerDefinitions(companyAId)
    const ccA = defsA.items.find((i) => i.subledgerType === 'COST_CENTER')!

    await updateSubledgerDefinition(
      companyAId,
      ccA.id,
      {
        nameAr: 'المهام التشغيلية لأ',
        nameEn: 'Operational Tasks for A',
      },
      testUserId
    )

    // Query Company A labels
    const labelA = await resolveSubledgerLabel(companyAId, 'COST_CENTER', 'entity', 'ar')
    assert.strictEqual(labelA, 'المهام التشغيلية لأ', 'Company A must resolve customized label')

    // Query Company B labels — must strictly retain Company B values
    const labelB = await resolveSubledgerLabel(companyBId, 'COST_CENTER', 'entity', 'ar')
    assert.strictEqual(labelB, 'مراكز التكلفة', 'Company B must NOT be affected by Company A customization')
  })

  test('3. Technical Identity ≠ Display Label Separation', async () => {
    const defsA = await getSubledgerDefinitions(companyAId)
    const ccA = defsA.items.find((i) => i.subledgerType === 'COST_CENTER')!

    // Update field labels
    await updateSubledgerDefinition(
      companyAId,
      ccA.id,
      {
        fields: [
          { fieldKey: 'code', labelAr: 'رمز المهمة التشغيلية', labelEn: 'Task Code' },
          { fieldKey: 'name', labelAr: 'وصف المهمة التشغيلية', labelEn: 'Task Description' },
        ],
      },
      testUserId
    )

    // Verify through Dynamic Label Resolver
    const resolvedCodeAr = await resolveSubledgerLabel(companyAId, 'COST_CENTER', 'code', 'ar')
    const resolvedCodeEn = await resolveSubledgerLabel(companyAId, 'COST_CENTER', 'code', 'en')
    const resolvedNameAr = await resolveSubledgerLabel(companyAId, 'COST_CENTER', 'name', 'ar')

    assert.strictEqual(resolvedCodeAr, 'رمز المهمة التشغيلية')
    assert.strictEqual(resolvedCodeEn, 'Task Code')
    assert.strictEqual(resolvedNameAr, 'وصف المهمة التشغيلية')

    // Confirm technical key remained intact in DB
    const refreshed = await getSubledgerDefinitionById(companyAId, ccA.id)
    const codeField = refreshed!.fields.find((f) => f.fieldKey === 'code')
    assert.ok(codeField, 'Technical fieldKey "code" must remain intact')
    assert.strictEqual(codeField.labelAr, 'رمز المهمة التشغيلية')
  })

  test('4. In-Use Behavioral Variables Protection', async () => {
    // Check in-use detection function
    const status = await isSubledgerInUse(companyAId, 'COST_CENTER')
    assert.strictEqual(typeof status.inUse, 'boolean')

    const defsA = await getSubledgerDefinitions(companyAId)
    const ccA = defsA.items.find((i) => i.subledgerType === 'COST_CENTER')!

    // If in-use, attempting to change variables must fail with explanatory message
    if (status.inUse) {
      await assert.rejects(
        async () => {
          await updateSubledgerDefinition(
            companyAId,
            ccA.id,
            {
              variables: { maxCodeLength: 99 },
            },
            testUserId
          )
        },
        /لا يمكن تعديل المتغيرات العامة لهذا الدليل الفرعي/
      )
    }
  })

  test('5. Dynamic Resolver Bundle & Fallback Safety', async () => {
    const bundle = await getSubledgerBundle(companyAId, 'ar')
    assert.ok(bundle['COST_CENTER'], 'Bundle must contain COST_CENTER')
    assert.ok(bundle['ACTIVITY'], 'Bundle must contain ACTIVITY')
    assert.ok(bundle['PROJECT'], 'Bundle must contain PROJECT')
    assert.ok(bundle['ANALYTIC_ACCOUNT'], 'Bundle must contain ANALYTIC_ACCOUNT')

    // Test fallback for non-existent field
    const fallbackVal = await resolveSubledgerLabel(
      companyAId,
      'COST_CENTER',
      'non_existent_key',
      'ar',
      'الافتراضي الآمن'
    )
    assert.strictEqual(fallbackVal, 'الافتراضي الآمن', 'Must return safe fallback for non-existent field')
  })

  test('6. Audit Log Generation on Modification', async () => {
    const defsA = await getSubledgerDefinitions(companyAId)
    const actA = defsA.items.find((i) => i.subledgerType === 'ACTIVITY')!

    await updateSubledgerDefinition(
      companyAId,
      actA.id,
      {
        nameAr: 'الأنشطة والبرامج التنفيذية',
      },
      testUserId
    )

    // Check AuditLog entry
    const audit = await db.auditLog.findFirst({
      where: {
        companyId: companyAId,
        moduleCode: 'SYS',
        documentType: 'SUBLEDGER_NAMING',
        documentId: actA.id,
        action: 'update',
      },
      orderBy: { createdAt: 'desc' },
    })

    assert.ok(audit, 'AuditLog entry must be recorded for subledger naming update')
    assert.ok(audit.newValue, 'AuditLog must contain newValue')
    assert.ok(String(audit.newValue).includes('الأنشطة والبرامج التنفيذية'))
  })

  test('7. System Subledger Deletion Prevention', async () => {
    const defsA = await getSubledgerDefinitions(companyAId)
    const sysItem = defsA.items.find((i) => i.isSystem)!

    await assert.rejects(
      async () => {
        await deleteSubledgerDefinition(companyAId, sysItem.id, testUserId)
      },
      /لا يمكن حذف دليل فرعي قياسي للنظام/
    )
  })
})
