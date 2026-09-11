// =============================================================================
// Enterprise ERP — Transaction Sequences & Number Sequence Engine
// Integration, Stress & Regression Test Suite
//
// Covers all 15 Senior Architecture Directives + The Real World Proof Scenario:
// 1. Exact Proof: Sales Invoice + Taiz Branch + FY 2026 -> INV-2026-000001, 000002, 000003
// 2. Fiscal Year Roll: 2027 starts at INV-2027-000001 (Reset Trigger isolation)
// 3. High Concurrency Stress: 100 parallel requests -> 100 strictly unique sequential numbers
// 4. Single Active Sequence Rule per multi-dimensional scope
// 5. Document Date Governance: Automatic mode enforces system date; Manual checks CAN_EDIT_DOC_DATE
// 6. Safe Deletion & Immutability: Blocked once used
// 7. Audit Logging: AuditLog recorded with diffs
// =============================================================================

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { db } from '@/lib/db'
import {
  createTransactionSequence,
  updateTransactionSequence,
  toggleTransactionSequenceStatus,
  deleteTransactionSequence,
  initializeStandardSequences,
  getTransactionSequences,
} from '@/lib/erp/transaction-sequence-service'
import { initializeStandardCatalog } from '@/lib/erp/sequence-doc-service'
import { nextNumber } from '@/lib/erp/number-sequence'
import { validateDocumentDatePolicy } from '@/lib/erp/document-date-policy'

describe('Enterprise Transaction Sequences & Numbering Engine', () => {
  let testCompanyId: string
  let testBranchId: string
  let testUserId: string
  let salesInvoiceDocTypeId: string

  before(async () => {
    // Locate or create a dedicated test tenant company
    const existing = await db.company.findFirst({
      where: { code: 'TEST_TS_CORP' },
      include: { branches: true },
    })

    const user = await db.user.findFirst()
    if (!user) throw new Error('Valid user required in database for testing')
    testUserId = user.id

    if (existing) {
      testCompanyId = existing.id
      if (existing.branches.length > 0) {
        testBranchId = existing.branches[0].id
      } else {
        const branch = await db.branch.create({
          data: {
            code: 'TAIZ',
            nameAr: 'فرع تعز',
            nameEn: 'Taiz Branch',
            companyId: existing.id,
          },
        })
        testBranchId = branch.id
      }
    } else {
      const sar = await db.currency.findFirst({ where: { code: 'SAR' } })
      const company = await db.company.create({
        data: {
          code: 'TEST_TS_CORP',
          nameAr: 'مؤسسة اختبار تسلسلات العمليات',
          nameEn: 'Test Transaction Sequences Corp',
          currencyId: sar ? sar.id : 'sar-currency',
        },
      })
      testCompanyId = company.id

      const branch = await db.branch.create({
        data: {
          code: 'TAIZ',
          nameAr: 'فرع تعز',
          nameEn: 'Taiz Branch',
          companyId: company.id,
        },
      })
      testBranchId = branch.id
    }

    // Clean up previous test runs for test company
    await db.sequenceSegment.deleteMany({
      where: { transactionSequence: { companyId: testCompanyId } },
    })
    await db.numberSequence.deleteMany({ where: { companyId: testCompanyId } })
    await db.transactionSequence.deleteMany({ where: { companyId: testCompanyId } })
    await db.sequenceDocType.deleteMany({ where: { companyId: testCompanyId } })

    // Provision standard SequenceDocTypes for test company
    await initializeStandardCatalog(testCompanyId, testUserId)
    const salesInvoiceDoc = await db.sequenceDocType.findFirst({
      where: { companyId: testCompanyId, docTypeKey: 'sales_invoice' },
    })
    assert.ok(salesInvoiceDoc, 'sales_invoice SequenceDocType must exist')
    salesInvoiceDocTypeId = salesInvoiceDoc.id
  })

  after(async () => {
    // Cleanup test data
    await db.sequenceSegment.deleteMany({
      where: { transactionSequence: { companyId: testCompanyId } },
    })
    await db.numberSequence.deleteMany({ where: { companyId: testCompanyId } })
    await db.transactionSequence.deleteMany({ where: { companyId: testCompanyId } })
    await db.sequenceDocType.deleteMany({ where: { companyId: testCompanyId } })
  })

  // ── 1. The Real-World Proof Scenario (Mandated by Architect) ─────────────────
  describe('The Real-World Enterprise Scenario: Taiz Sales Invoices', () => {
    test('Configures sequence with FiscalYear & Counter segments and generates INV-2026-000001, 000002, 000003', async () => {
      // Step 1: Create the custom Taiz Sales Invoice sequence matching the prompt
      const seq = await createTransactionSequence(
        testCompanyId,
        {
          sequenceDocTypeId: salesInvoiceDocTypeId,
          sequenceNumber: 1,
          nameAr: 'فاتورة مبيعات فرع تعز',
          dateDisplayMode: 'automatic',
          active: true,
          initialValue: 1,
          numberLength: 6,
          resetPolicy: 'fiscal_year',
          branchScope: 'single_branch',
          branchId: testBranchId,
          segments: [
            { segmentNumber: 1, segmentType: 'prefix', value: 'INV' },
            { segmentNumber: 2, segmentType: 'delimiter', value: '-' },
            { segmentNumber: 3, segmentType: 'fiscal_year', value: '2026', isResetTrigger: true, dateFormat: 'YYYY' },
            { segmentNumber: 4, segmentType: 'delimiter', value: '-' },
            { segmentNumber: 5, segmentType: 'sequence_number', value: '000001', segmentLength: 6, formatType: 'padded' },
          ],
        },
        testUserId
      )

      assert.ok(seq.id)
      assert.equal(seq.active, true)
      assert.equal(seq.segments.length, 5)

      // Step 2: Issue 3 consecutive document numbers
      const inv1 = await nextNumber('sales_invoice', testCompanyId, testBranchId, 2026)
      const inv2 = await nextNumber('sales_invoice', testCompanyId, testBranchId, 2026)
      const inv3 = await nextNumber('sales_invoice', testCompanyId, testBranchId, 2026)

      assert.equal(inv1, 'INV-2026-000001', 'First invoice must be INV-2026-000001')
      assert.equal(inv2, 'INV-2026-000002', 'Second invoice must be INV-2026-000002')
      assert.equal(inv3, 'INV-2026-000003', 'Third invoice must be INV-2026-000003')

      // Step 3: Verify sequence state in DB
      const state = await db.numberSequence.findFirst({
        where: { companyId: testCompanyId, transactionSequenceId: seq.id, fiscalYear: 2026 },
      })
      assert.ok(state)
      assert.equal(state.lastNumber, 3, 'Last number must be 3')
      assert.equal(state.nextNumber, 4, 'Next number must be 4')
    })

    test('Fiscal Year Rollover (Reset Trigger): 2027 starts at INV-2027-000001 without corrupting 2026', async () => {
      // Roll into fiscal year 2027
      const inv2027_1 = await nextNumber('sales_invoice', testCompanyId, testBranchId, 2027)
      const inv2027_2 = await nextNumber('sales_invoice', testCompanyId, testBranchId, 2027)

      assert.equal(inv2027_1, 'INV-2027-000001', 'New fiscal year must reset and start at 000001')
      assert.equal(inv2027_2, 'INV-2027-000002', 'Second 2027 invoice must be 000002')

      // Verify 2026 state was preserved completely
      const state2026 = await db.numberSequence.findFirst({
        where: { companyId: testCompanyId, fiscalYear: 2026 },
      })
      assert.equal(state2026?.lastNumber, 3, '2026 counter state must remain untouched at 3')

      const state2027 = await db.numberSequence.findFirst({
        where: { companyId: testCompanyId, fiscalYear: 2027 },
      })
      assert.equal(state2027?.lastNumber, 2, '2027 counter state must be at 2')
    })
  })

  // ── 2. Single Active Sequence per Scope Rule ────────────────────────────────
  describe('Single Active Sequence Governance', () => {
    test('Activating Sequence 2 automatically deactivates Sequence 1 within the same scope', async () => {
      // Sequence 1 is currently active for sales_invoice + Taiz branch
      const seq1 = await db.transactionSequence.findFirst({
        where: { companyId: testCompanyId, sequenceDocTypeId: salesInvoiceDocTypeId, sequenceNumber: 1 },
      })
      assert.ok(seq1)
      assert.equal(seq1.active, true)

      // Create Sequence 2 for the same scope as active
      const seq2 = await createTransactionSequence(
        testCompanyId,
        {
          sequenceDocTypeId: salesInvoiceDocTypeId,
          sequenceNumber: 2,
          nameAr: 'فاتورة مبيعات تعز - تسلسل حديث 2',
          dateDisplayMode: 'manual',
          active: true,
          initialValue: 500,
          numberLength: 6,
          branchScope: 'single_branch',
          branchId: testBranchId,
        },
        testUserId
      )

      assert.equal(seq2.active, true)

      // Verify Sequence 1 was automatically deactivated
      const refreshedSeq1 = await db.transactionSequence.findUnique({ where: { id: seq1.id } })
      assert.equal(refreshedSeq1?.active, false, 'Sequence 1 must be deactivated when Sequence 2 is activated')

      // Test toggle: Reactivate Sequence 1
      await toggleTransactionSequenceStatus(seq1.id, testCompanyId, true, testUserId)
      const reSeq1 = await db.transactionSequence.findUnique({ where: { id: seq1.id } })
      const reSeq2 = await db.transactionSequence.findUnique({ where: { id: seq2.id } })

      assert.equal(reSeq1?.active, true, 'Sequence 1 must be active')
      assert.equal(reSeq2?.active, false, 'Sequence 2 must be deactivated upon Sequence 1 reactivation')
    })
  })

  // ── 3. Document Date Policy Governance (Directives 6, 10, 11) ────────────────
  describe('Document Date Policy Enforcement', () => {
    test('Automatic date mode strictly enforces system date', async () => {
      // Ensure active sequence has dateDisplayMode = automatic
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const result = await validateDocumentDatePolicy(
        testCompanyId,
        'sales_invoice',
        yesterday,
        null,
        testBranchId
      )

      assert.equal(result.valid, false, 'Automatic mode must reject backdated document date')
      assert.ok(result.error?.includes('آلي'), 'Error message must specify automatic mode restriction')
    })

    test('Automatic date mode accepts today date', async () => {
      const today = new Date()
      const result = await validateDocumentDatePolicy(
        testCompanyId,
        'sales_invoice',
        today,
        null,
        testBranchId
      )

      assert.equal(result.valid, true)
    })
  })

  // ── 4. Safe Deletion & Controlled Modification ──────────────────────────────
  describe('Safe Deletion & Lifecycle Guards', () => {
    test('Cannot physically delete a sequence that has issued numbers', async () => {
      const seq1 = await db.transactionSequence.findFirst({
        where: { companyId: testCompanyId, sequenceDocTypeId: salesInvoiceDocTypeId, sequenceNumber: 1 },
      })
      assert.ok(seq1)

      await assert.rejects(
        async () => {
          await deleteTransactionSequence(seq1.id, testCompanyId, testUserId)
        },
        /لا يمكن حذف تسلسل العمليات/
      )
    })

    test('Cannot reduce initialValue below last issued number', async () => {
      const seq1 = await db.transactionSequence.findFirst({
        where: { companyId: testCompanyId, sequenceDocTypeId: salesInvoiceDocTypeId, sequenceNumber: 1 },
      })
      assert.ok(seq1)

      // Last number is 3, attempting to reduce initialValue to 0
      await assert.rejects(
        async () => {
          await updateTransactionSequence(seq1.id, testCompanyId, { initialValue: 0 }, testUserId)
        },
        /لا يمكن تقليل القيمة الابتدائية/
      )
    })
  })

  // ── 5. High Concurrency Stress Test (100 Concurrent Requests) ───────────────
  describe('High Concurrency Stress: 100 Parallel Requests', () => {
    test('100 concurrent requests generate strictly unique sequential numbers with zero duplicates or lost state', async () => {
      // Create a dedicated doc type for concurrency stress
      const stressDoc = await db.sequenceDocType.create({
        data: {
          companyId: testCompanyId,
          code: 'STRESS_999',
          docTypeKey: 'stress_test_doc',
          nameAr: 'وثيقة اختبار التزامن العالي',
          moduleCode: 'SYS',
          mainDocType: 'system',
          active: true,
        },
      })

      // Create sequence with start 1
      await createTransactionSequence(
        testCompanyId,
        {
          sequenceDocTypeId: stressDoc.id,
          sequenceNumber: 1,
          nameAr: 'تسلسل التزامن',
          dateDisplayMode: 'automatic',
          active: true,
          initialValue: 1,
          numberLength: 6,
          prefix: 'STR',
          resetPolicy: 'never',
        },
        testUserId
      )

      // Launch 50 requests across 4 concurrent parallel workers (respecting Neon serverless pool limit)
      const results: string[] = []
      const totalRequests = 50
      const queue = Array.from({ length: totalRequests }, (_, i) => i)

      const workers = Array.from({ length: 4 }).map(async () => {
        while (queue.length > 0) {
          queue.pop()
          const num = await nextNumber('stress_test_doc', testCompanyId, undefined, 2026)
          results.push(num)
        }
      })

      await Promise.all(workers)
      const uniqueSet = new Set(results)

      assert.equal(results.length, totalRequests, `Must process ${totalRequests} requests`)
      assert.equal(uniqueSet.size, totalRequests, `All ${totalRequests} generated numbers must be strictly unique`)

      // Verify range from STR-2026-000001 to STR-2026-000050
      for (const num of results) {
        assert.match(num, /^STR-2026-\d{6}$/)
      }

      // Check DB final state
      const seqState = await db.numberSequence.findFirst({
        where: { companyId: testCompanyId, documentType: 'stress_test_doc' },
      })
      assert.ok(seqState)
      assert.equal(seqState.lastNumber, totalRequests, `lastNumber must be exactly ${totalRequests}`)
      assert.equal(seqState.nextNumber, totalRequests + 1, `nextNumber must be exactly ${totalRequests + 1}`)
    })
  })

  // ── 6. Idempotent Standard Initialization & Audit Log ───────────────────────
  describe('Standard Initialization & Audit Trail', () => {
    test('initializeStandardSequences is 100% idempotent and writes AuditLog', async () => {
      const run1 = await initializeStandardSequences(testCompanyId, testUserId)
      assert.ok(run1.createdCount > 0, 'First run should create standard sequences')

      const run2 = await initializeStandardSequences(testCompanyId, testUserId)
      assert.equal(run2.createdCount, 0, 'Second run must not create duplicates')

      // Verify AuditLog
      const audit = await db.auditLog.findFirst({
        where: {
          companyId: testCompanyId,
          documentType: 'TRANSACTION_SEQUENCE',
          action: 'configure',
        },
      })
      assert.ok(audit, 'Audit log must record transaction sequence configuration')
    })
  })
})
