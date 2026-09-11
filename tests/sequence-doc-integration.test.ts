// =============================================================================
// Sequence Document Types & Sequence Engine — Integration & Regression Test Suite
// Run: node --import ./tests/alias-hook.mjs --test tests/sequence-doc-integration.test.ts
//
// Covers User Architecture Directives:
// 1. WHAT vs HOW separation: SequenceDocType (Registry) vs NumberSequence (Engine/State).
// 2. Idempotent Standard Catalog Initialization (repeated calls never duplicate).
// 3. Immutability of docTypeKey once used.
// 4. Safe Deletion: Blocked when transactions/sequences exist.
// 5. Concurrency & Non-reusable atomic number generation.
// 6. Regression tests across all ERP transaction domains (SAL, PUR, INV, FIN, HR, MFG).
// 7. Full End-to-End Cycle: DocType -> Sequence -> Transaction -> Posting -> Audit -> Ledger.
// =============================================================================

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { db } from '@/lib/db'
import {
  initializeStandardCatalog,
  getSequenceDocTypes,
  createSequenceDocType,
  updateSequenceDocType,
  toggleSequenceDocTypeStatus,
  deleteSequenceDocType,
} from '@/lib/erp/sequence-doc-service'
import { nextNumber } from '@/lib/erp/number-sequence'
import { postJournalEntry } from '@/lib/erp/accounting-engine'

describe('Sequence Document Types & Sequence Engine Architecture', () => {
  let testCompanyId: string
  let testBranchId: string
  let testUserId: string

  before(async () => {
    // Locate or create a test tenant company
    const existing = await db.company.findFirst({
      where: { code: 'TEST_SEQ_CO' },
      include: { branches: true, users: true },
    })

    const user = await db.user.findFirst()
    if (!user) throw new Error('No user found in database for testing')
    testUserId = user.id

    if (existing) {
      testCompanyId = existing.id
      if (existing.branches.length > 0) {
        testBranchId = existing.branches[0].id
      } else {
        const branch = await db.branch.create({
          data: {
            code: 'TB-MAIN',
            nameAr: 'فرع الاختبار الرئيسي',
            nameEn: 'Main Test Branch',
            companyId: existing.id,
          },
        })
        testBranchId = branch.id
      }
    } else {
      const sar = await db.currency.findFirst({ where: { code: 'SAR' } })
      const company = await db.company.create({
        data: {
          code: 'TEST_SEQ_CO',
          nameAr: 'شركة اختبار التسلسلات',
          nameEn: 'Test Sequences Co',
          currencyId: sar ? sar.id : 'sar-currency',
        },
      })
      testCompanyId = company.id

      const branch = await db.branch.create({
        data: {
          code: 'TB-MAIN',
          nameAr: 'فرع الاختبار الرئيسي',
          nameEn: 'Main Test Branch',
          companyId: company.id,
        },
      })
      testBranchId = branch.id
    }

    // Clean up any leftovers from previous test runs for test company
    await db.journalLine.deleteMany({ where: { entry: { companyId: testCompanyId } } })
    await db.journalEntry.deleteMany({ where: { companyId: testCompanyId } })
    await db.sequenceDocType.deleteMany({ where: { companyId: testCompanyId } })
    await db.numberSequence.deleteMany({ where: { companyId: testCompanyId } })
  })

  after(async () => {
    // Clean up sequence doc types, sequences, and journal entries created for TEST_SEQ_CO
    await db.journalLine.deleteMany({ where: { entry: { companyId: testCompanyId } } })
    await db.journalEntry.deleteMany({ where: { companyId: testCompanyId } })
    await db.sequenceDocType.deleteMany({ where: { companyId: testCompanyId } })
    await db.numberSequence.deleteMany({ where: { companyId: testCompanyId } })
  })

  // ── 1. Master Data Governance & Idempotency ────────────────────────────────
  describe('Master Data Governance & Idempotency', () => {
    test('Idempotent initialization: first run creates records, second run creates 0 without duplicates', async () => {
      // First run
      const run1 = await initializeStandardCatalog(testCompanyId, testUserId)
      assert.ok(run1.createdCount > 40, 'Standard catalog should provision 40+ standard doc types')

      // Verify records in DB
      const { total: totalAfterRun1 } = await getSequenceDocTypes(testCompanyId)
      assert.equal(totalAfterRun1, run1.createdCount)

      // Second run (must be 100% idempotent)
      const run2 = await initializeStandardCatalog(testCompanyId, testUserId)
      assert.equal(run2.createdCount, 0, 'Second run must not create duplicates')
      assert.equal(run2.existingCount, run1.createdCount)

      const { total: totalAfterRun2 } = await getSequenceDocTypes(testCompanyId)
      assert.equal(totalAfterRun2, totalAfterRun1, 'Total count must remain identical')
    })

    test('Uniqueness constraints: duplicate code or docTypeKey is rejected', async () => {
      // Duplicate code rejection
      await assert.rejects(
        async () => {
          await createSequenceDocType(
            testCompanyId,
            {
              code: '1', // Already exists for debit_note
              docTypeKey: 'custom_doc_test_1',
              nameAr: 'وثيقة مخصصة مكررة الكود',
              moduleCode: 'FIN',
              mainDocType: 'financial',
            },
            testUserId
          )
        },
        /مستخدم مسبقاً/
      )

      // Duplicate docTypeKey rejection
      await assert.rejects(
        async () => {
          await createSequenceDocType(
            testCompanyId,
            {
              code: '99999',
              docTypeKey: 'sales_invoice', // Already exists
              nameAr: 'فاتورة مبيعات مكررة المفتاح',
              moduleCode: 'SAL',
              mainDocType: 'sales',
            },
            testUserId
          )
        },
        /مسجل مسبقاً/
      )
    })

    test('Immutability of docTypeKey when sequence counter or transactions exist', async () => {
      // Generate a sequence for sales_invoice
      await nextNumber('sales_invoice', testCompanyId)

      const doc = await db.sequenceDocType.findFirst({
        where: { companyId: testCompanyId, docTypeKey: 'sales_invoice' },
      })
      assert.ok(doc, 'sales_invoice must exist')

      // Attempt to mutate docTypeKey after usage
      await assert.rejects(
        async () => {
          await updateSequenceDocType(
            doc!.id,
            testCompanyId,
            { docTypeKey: 'sales_invoice_mutated' },
            testUserId
          )
        },
        /لا يمكن تعديل الهوية التقنية/
      )
    })

    test('Safe deletion: cannot physically delete a document type with generated sequences', async () => {
      const doc = await db.sequenceDocType.findFirst({
        where: { companyId: testCompanyId, docTypeKey: 'sales_invoice' },
      })
      assert.ok(doc)

      await assert.rejects(
        async () => {
          await deleteSequenceDocType(doc!.id, testCompanyId, testUserId)
        },
        /لا يمكن حذف نوع الوثيقة/
      )
    })

    test('Deactivation governance: deactivated doc type blocks sequence number generation', async () => {
      // Create a test doc type
      const customDoc = await createSequenceDocType(
        testCompanyId,
        {
          code: '8888',
          docTypeKey: 'temp_deactivated_doc',
          nameAr: 'وثيقة مؤقتة للتعطيل',
          moduleCode: 'SAL',
          mainDocType: 'sales',
        },
        testUserId
      )

      // Deactivate it
      await toggleSequenceDocTypeStatus(customDoc.id, testCompanyId, false, testUserId)

      // Attempting to generate a sequence number should throw
      await assert.rejects(
        async () => {
          await nextNumber('temp_deactivated_doc', testCompanyId)
        },
        /معطل حالياً/
      )

      // Reactivate it
      await toggleSequenceDocTypeStatus(customDoc.id, testCompanyId, true, testUserId)
      const num = await nextNumber('temp_deactivated_doc', testCompanyId)
      assert.ok(num.length > 0, 'Should generate sequence after reactivation')
    })
  })

  // ── 2. Concurrency & Non-reusable Atomic Generation ────────────────────────
  describe('Concurrency & Non-reusable Atomic Generation', () => {
    test('Concurrent requests generate strictly unique numbers with zero duplicates', async () => {
      const promises = Array.from({ length: 15 }).map(() =>
        nextNumber('journal_entry', testCompanyId, undefined, 2026)
      )

      const numbers = await Promise.all(promises)
      const uniqueSet = new Set(numbers)

      assert.equal(numbers.length, 15)
      assert.equal(uniqueSet.size, 15, 'All 15 generated numbers must be strictly unique')

      // Verify monotonic ascending format: JE-2026-000001, JE-2026-000002...
      for (const num of numbers) {
        assert.match(num, /^JE-2026-\d{6}$/)
      }
    })
  })

  // ── 3. Regression Tests Across All Core ERP Modules ────────────────────────
  describe('Regression Tests: All ERP Module Document Sequences', () => {
    const coreModules = [
      { key: 'sales_quotation', prefix: 'SQ' },
      { key: 'sales_order', prefix: 'SO' },
      { key: 'sales_invoice', prefix: 'INV' },
      { key: 'sales_credit_note', prefix: 'CN' },
      { key: 'purchase_request', prefix: 'PR' },
      { key: 'purchase_order', prefix: 'PO' },
      { key: 'purchase_invoice', prefix: 'VB' },
      { key: 'goods_receipt', prefix: 'GRN' },
      { key: 'delivery', prefix: 'DN' },
      { key: 'stock_transfer', prefix: 'ST' },
      { key: 'inventory_adjustment', prefix: 'IA' },
      { key: 'journal_entry', prefix: 'JE' },
      { key: 'production_order', prefix: 'MO' },
      { key: 'payslip', prefix: 'PAY' },
    ]

    for (const mod of coreModules) {
      test(`Module Sequence Engine: ${mod.key} generates valid sequential number with prefix ${mod.prefix}`, async () => {
        const num = await nextNumber(mod.key, testCompanyId, undefined, 2026)
        assert.ok(num, `Generated number for ${mod.key} must be truthy`)
        assert.ok(
          num.startsWith(mod.prefix),
          `Expected number ${num} to start with configured prefix ${mod.prefix}`
        )
      })
    }
  })

  // ── 4. End-to-End Integration Flow ─────────────────────────────────────────
  describe('End-to-End Lifecycle: DocType -> Sequence -> Transaction -> Posting -> Audit', () => {
    test('Full lifecycle from definition to ledger posting and audit verification', async () => {
      // Step 1: Sequence Document Type verified in Master Registry
      const docType = await db.sequenceDocType.findFirst({
        where: { companyId: testCompanyId, docTypeKey: 'journal_entry' },
      })
      assert.ok(docType, 'journal_entry SequenceDocType must exist')
      assert.equal(docType!.affectsFinancial, true)

      // Step 2: Sequence Engine generates atomic transaction number
      const docNumber = await nextNumber('journal_entry', testCompanyId, undefined, 2026)
      assert.ok(docNumber.startsWith('JE-2026-'))

      // Step 3: Find active posting accounts for transaction posting
      const accounts = await db.account.findMany({ where: { isPosting: true }, take: 2 })
      const cashAcc = accounts[0]
      const capitalAcc = accounts[1]

      assert.ok(cashAcc, 'Cash posting account must exist')
      assert.ok(capitalAcc, 'Capital posting account must exist')

      // Step 4: Post journal entry using central accounting engine
      const postResult = await postJournalEntry({
        companyId: testCompanyId,
        branchId: testBranchId,
        description: `قيد تسلسلي تجريبي رقم ${docNumber}`,
        postingDate: new Date('2029-03-01'),
        userId: testUserId,
        lines: [
          { accountId: cashAcc.id, debit: 5000, credit: 0, description: 'مدين نقدية' },
          { accountId: capitalAcc.id, debit: 0, credit: 5000, description: 'دائن رأس مال' },
        ],
      })

      assert.ok(postResult.id, 'postJournalEntry must return id')
      assert.ok(postResult.code, 'postJournalEntry must return code')

      const createdEntry = await db.journalEntry.findUnique({
        where: { id: postResult.id },
      })
      assert.ok(createdEntry, 'Created journal entry must exist in DB')
      assert.equal(createdEntry.state, 'posted', 'Journal entry must be posted successfully')
      assert.equal(createdEntry.totalDebit, 5000)
      assert.equal(createdEntry.totalCredit, 5000)

      // Step 5: Verify Audit Log reflects SequenceDocType catalog initialization (Directive 11)
      const auditEntry = await db.auditLog.findFirst({
        where: {
          companyId: testCompanyId,
          documentType: 'SEQUENCE_DOC_TYPE',
          action: 'configure',
        },
      })
      assert.ok(auditEntry, 'Audit log must record SequenceDocType catalog initialization')
      assert.equal(auditEntry.moduleCode, 'SYS')

      // Step 6: Verify ledger lines were created and balanced
      const lines = await db.journalLine.findMany({
        where: { entryId: postResult.id },
      })
      assert.equal(lines.length, 2)
      assert.equal(lines[0].debit, 5000)
      assert.equal(lines[1].credit, 5000)
    })
  })
})
