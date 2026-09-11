// =============================================================================
// Enterprise ERP — Number Sequence Service
// Source: ADR-016 — Legal, scoped, non-reusable sequences with gap reporting
// Dynamic Integration: TransactionSequence + SequenceSegment + NumberSequence
// =============================================================================

import { db } from '@/lib/db'
import { getSetting, getSettingNumber } from './settings-service'

// Default prefixes (used as fallback when DB settings/sequences not available)
const DEFAULT_PREFIXES: Record<string, string> = {
  sales_quotation: 'SQ',
  sales_order: 'SO',
  sales_invoice: 'INV',
  sales_credit_note: 'CN',
  purchase_request: 'PR',
  rfq: 'RFQ',
  purchase_order: 'PO',
  goods_receipt: 'GRN',
  purchase_invoice: 'VB',
  purchase_credit_note: 'PCN',
  purchase_payment: 'PV',
  sales_payment: 'RV',
  journal_entry: 'JE',
  stock_transfer: 'ST',
  inventory_adjustment: 'IA',
  production_order: 'MO',
  payslip: 'PAY',
  delivery: 'DN',
}

// Mapping from document type to setting key
const DOC_TYPE_TO_SETTING: Record<string, string> = {
  sales_quotation: 'numbering.quotationPrefix',
  sales_order: 'numbering.salesOrderPrefix',
  sales_invoice: 'numbering.invoicePrefix',
  sales_credit_note: 'numbering.creditNotePrefix',
  purchase_order: 'numbering.poPrefix',
  goods_receipt: 'numbering.grnPrefix',
  purchase_invoice: 'numbering.vendorBillPrefix',
  purchase_payment: 'numbering.paymentPrefix',
  sales_payment: 'numbering.receiptPrefix',
  journal_entry: 'numbering.journalPrefix',
  stock_transfer: 'numbering.transferPrefix',
  inventory_adjustment: 'numbering.adjustmentPrefix',
  production_order: 'numbering.productionPrefix',
  payslip: 'numbering.payslipPrefix',
}

// Cache for prefixes (avoid DB read on every call)
let prefixCache: Record<string, string> | null = null
let prefixCacheExpiry = 0

async function getPrefix(documentType: string): Promise<string> {
  const now = Date.now()
  if (prefixCache && now < prefixCacheExpiry) {
    return prefixCache[documentType] || DEFAULT_PREFIXES[documentType] || documentType.toUpperCase().slice(0, 3)
  }

  // Reload cache from settings
  prefixCache = {}
  for (const [docType, settingKey] of Object.entries(DOC_TYPE_TO_SETTING)) {
    const configuredPrefix = await getSetting(settingKey, DEFAULT_PREFIXES[docType] || '')
    prefixCache[docType] = configuredPrefix
  }
  prefixCacheExpiry = now + 5 * 60 * 1000 // 5 min cache

  return prefixCache[documentType] || DEFAULT_PREFIXES[documentType] || documentType.toUpperCase().slice(0, 3)
}

async function getNumberLength(): Promise<number> {
  return await getSettingNumber('numbering.numberLength', 6)
}

async function getResetPolicy(): Promise<string> {
  return await getSetting('numbering.resetPolicy', 'fiscal_year')
}

export interface NumberSequenceOptions {
  documentDate?: Date | string
  branchCode?: string
}

/**
 * Resolves dynamic segments into a formatted document number.
 */
function resolveSegments(
  segments: Array<{
    segmentNumber: number
    segmentType: string
    value: string
    segmentLength?: number | null
    formatType?: string | null
    dateFormat?: string | null
  }>,
  context: {
    year: number
    issuedNumber: number
    padding: number
    documentDate?: Date
    branchCode?: string
    prefix: string
  }
): string {
  const parts: string[] = []
  const docDate = context.documentDate ?? new Date()

  for (const seg of segments) {
    switch (seg.segmentType) {
      case 'prefix':
        parts.push(seg.value || context.prefix)
        break
      case 'delimiter':
        parts.push(seg.value || '-')
        break
      case 'fiscal_year': {
        const yrStr = String(context.year)
        parts.push(seg.dateFormat === 'YY' ? yrStr.slice(-2) : yrStr)
        break
      }
      case 'calendar_year': {
        const calYr = String(docDate.getFullYear())
        parts.push(seg.dateFormat === 'YY' ? calYr.slice(-2) : calYr)
        break
      }
      case 'month': {
        const m = String(docDate.getMonth() + 1).padStart(2, '0')
        parts.push(m)
        break
      }
      case 'day': {
        const d = String(docDate.getDate()).padStart(2, '0')
        parts.push(d)
        break
      }
      case 'branch': {
        const br = context.branchCode || seg.value || 'BR'
        parts.push(br)
        break
      }
      case 'sequence_number': {
        const len = seg.segmentLength || context.padding
        parts.push(String(context.issuedNumber).padStart(len, '0'))
        break
      }
      default:
        parts.push(seg.value || '')
        break
    }
  }

  return parts.join('')
}

/**
 * Generate next document number atomically (row-lock via Postgres Advisory Lock + increment).
 * Supports full scope: Company + Branch Scope + Document Type + Fiscal Year.
 */
export async function nextNumber(
  documentType: string,
  companyId: string,
  branchId?: string,
  fiscalYear?: number,
  options?: NumberSequenceOptions
): Promise<string> {
  // 1. Operational Governance: Verify SequenceDocType is not deactivated in this company
  const docTypeRecord = await db.sequenceDocType.findFirst({
    where: {
      companyId,
      docTypeKey: documentType,
    },
    select: { id: true, active: true, nameAr: true },
  })

  if (docTypeRecord && !docTypeRecord.active) {
    throw new Error(
      `نوع الوثيقة "${docTypeRecord.nameAr || documentType}" معطل حالياً في هذه الشركة ولا يمكن إصدار أرقام جديدة له`
    )
  }

  // 2. Locate active TransactionSequence for this doc type and scope
  let activeSeq: any = null
  if (docTypeRecord) {
    activeSeq = await db.transactionSequence.findFirst({
      where: {
        companyId,
        sequenceDocTypeId: docTypeRecord.id,
        active: true,
        OR: [
          { branchScope: 'all' },
          { branchId: branchId ?? null },
        ],
        ...(fiscalYear ? { OR: [{ fiscalYearScope: null }, { fiscalYearScope: fiscalYear }] } : {}),
      },
      include: {
        segments: { orderBy: { segmentNumber: 'asc' } },
      },
      orderBy: [{ branchId: 'desc' }, { sequenceNumber: 'asc' }],
    })
  }

  const docDate = options?.documentDate ? new Date(options.documentDate) : new Date()
  const year = fiscalYear ?? docDate.getFullYear()
  const prefix = activeSeq?.prefix || (await getPrefix(documentType))
  const padding = activeSeq?.numberLength || (await getNumberLength())
  const initialValue = activeSeq?.initialValue ?? 1
  const resetPolicy = activeSeq?.resetPolicy || (await getResetPolicy())

  // Determine effective branch scoping for counter state
  const effectiveBranchId = activeSeq?.branchScope === 'single_branch' ? branchId ?? null : null
  const effectiveYear = resetPolicy !== 'never' ? year : null

  // Concurrency-safe atomic generation via transaction + Postgres advisory lock
  return await db.$transaction(
    async (tx) => {
      // 1. Transaction-level advisory lock on PostgreSQL
      const lockIdentifier = activeSeq ? activeSeq.id : documentType
      const lockKey = `numseq_${companyId}_${effectiveBranchId || 'none'}_${lockIdentifier}_${effectiveYear || 'all'}`
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`

      // 2. Query sequence row (guaranteed isolated and serialized)
      let existing: any = null
      if (activeSeq) {
        existing = await tx.numberSequence.findFirst({
          where: {
            companyId,
            transactionSequenceId: activeSeq.id,
            branchId: effectiveBranchId,
            fiscalYear: effectiveYear,
          },
        })
      }

      // Fallback lookup if no activeSeq-specific counter exists
      if (!existing) {
        existing = await tx.numberSequence.findFirst({
          where: {
            companyId,
            branchId: effectiveBranchId,
            documentType,
            fiscalYear: effectiveYear,
          },
        })
      }

      let issuedNumber = initialValue

      if (existing) {
        issuedNumber = Math.max(existing.nextNumber, initialValue)
        await tx.numberSequence.update({
          where: { id: existing.id },
          data: {
            nextNumber: issuedNumber + 1,
            lastNumber: issuedNumber,
            ...(activeSeq && !existing.transactionSequenceId && { transactionSequenceId: activeSeq.id }),
          },
        })
      } else {
        // Create new sequence state row on first use
        await tx.numberSequence.create({
          data: {
            companyId,
            branchId: effectiveBranchId,
            documentType,
            prefix,
            fiscalYear: effectiveYear,
            nextNumber: initialValue + 1,
            padding,
            resetPolicy,
            lastNumber: initialValue,
            transactionSequenceId: activeSeq?.id ?? null,
          },
        })
        issuedNumber = initialValue
      }

      // Lock sequence definition against structural modifications once used
      if (activeSeq && !activeSeq.isLocked) {
        await tx.transactionSequence.update({
          where: { id: activeSeq.id },
          data: { isLocked: true },
        })
      }

      // Format document number according to segments or default pattern
      if (activeSeq?.segments && activeSeq.segments.length > 0) {
        return resolveSegments(activeSeq.segments, {
          year,
          issuedNumber,
          padding,
          documentDate: docDate,
          branchCode: options?.branchCode,
          prefix,
        })
      }

      const finalPrefix = existing?.prefix || prefix
      const finalPadding = existing?.padding || padding
      return `${finalPrefix}-${year}-${String(issuedNumber).padStart(finalPadding, '0')}`
    },
    {
      isolationLevel: 'ReadCommitted',
      maxWait: 20000,
      timeout: 25000,
    }
  )
}

// Get the list of all document types and their configurable prefixes
export function getDocumentTypes(): { type: string; prefix: string }[] {
  return Object.entries(DEFAULT_PREFIXES).map(([type, prefix]) => ({ type, prefix }))
}

// Clear cache (called when settings are updated)
export function clearPrefixCache() {
  prefixCache = null
  prefixCacheExpiry = 0
}
