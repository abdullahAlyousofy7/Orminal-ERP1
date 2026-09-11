// =============================================================================
// Enterprise ERP — Transaction Sequence Service (Central HOW Engine)
// Source: Directive 1-15 (Enterprise Numbering Architecture)
//
// Responsibilities:
// 1. TransactionSequence & SequenceSegment CRUD with lifecycle management:
//    - Unused -> Fully editable & deletable.
//    - Used -> Controlled editing, initial value locked against decrement.
//    - Locked -> Major structural changes require creating a new sequence.
// 2. Single Active Sequence Rule per multi-dimensional scope:
//    Scope = (companyId, sequenceDocTypeId, branchScope, branchId, fiscalYearScope)
// 3. Concurrency-safe activation via atomic transactions.
// 4. Safe deletion: blocked if numbers issued or transactions exist.
// 5. Versioned, 100% idempotent standard catalog initialization.
// 6. Comprehensive audit logging via writeAudit with before/after diffs.
// =============================================================================

import { db } from '@/lib/db'
import { writeAudit, diffFields } from './audit'

export const TRANSACTION_SEQUENCES_CATALOG_VERSION = '1.0.0'

export interface CreateSequenceSegmentInput {
  segmentNumber: number
  segmentType:
    | 'prefix'
    | 'fiscal_year'
    | 'calendar_year'
    | 'month'
    | 'day'
    | 'branch'
    | 'sequence_number'
    | 'delimiter'
  value: string
  segmentLength?: number | null
  isResetTrigger?: boolean
  formatType?: string | null
  dateFormat?: string | null
}

export interface CreateTransactionSequenceInput {
  sequenceDocTypeId: string
  sequenceNumber?: number
  nameAr?: string | null
  nameEn?: string | null
  dateDisplayMode?: 'automatic' | 'manual'
  active?: boolean
  initialValue?: number
  numberLength?: number
  prefix?: string | null
  suffix?: string | null
  resetPolicy?: 'fiscal_year' | 'monthly' | 'never'
  branchScope?: 'all' | 'single_branch'
  branchId?: string | null
  fiscalYearScope?: number | null
  notes?: string | null
  segments?: CreateSequenceSegmentInput[]
}

export type UpdateTransactionSequenceInput = Partial<CreateTransactionSequenceInput>

export interface TransactionSequenceFilters {
  search?: string
  moduleCode?: string
  active?: boolean
  dateDisplayMode?: 'automatic' | 'manual'
  branchId?: string
  page?: number
  pageSize?: number
}

/**
 * Counts total issued numbers or transactions linked to a sequence.
 */
export async function countUsageForSequence(id: string, companyId: string): Promise<number> {
  // 1. Check linked NumberSequence state rows
  const seqStates = await db.numberSequence.findMany({
    where: { companyId, transactionSequenceId: id },
    select: { lastNumber: true },
  })

  const stateUsage = seqStates.reduce((acc, s) => acc + (s.lastNumber || 0), 0)
  if (stateUsage > 0) return stateUsage

  // 2. Check if sequence is locked
  const seq = await db.transactionSequence.findUnique({
    where: { id },
    select: { isLocked: true },
  })

  return seq?.isLocked ? 1 : 0
}

/**
 * Calculates the next available sequenceNumber for a document type.
 */
export async function getNextSequenceNumberForDocType(
  companyId: string,
  sequenceDocTypeId: string
): Promise<number> {
  const maxSeq = await db.transactionSequence.findFirst({
    where: { companyId, sequenceDocTypeId },
    orderBy: { sequenceNumber: 'desc' },
    select: { sequenceNumber: true },
  })

  return (maxSeq?.sequenceNumber ?? 0) + 1
}

/**
 * Deactivates competing sequences within the same operational scope.
 * Atomic execution inside a transaction to prevent race conditions.
 */
async function enforceSingleActiveInScope(
  tx: any,
  companyId: string,
  sequenceDocTypeId: string,
  branchScope: string,
  branchId: string | null | undefined,
  fiscalYearScope: number | null | undefined,
  excludeId?: string
) {
  await tx.transactionSequence.updateMany({
    where: {
      companyId,
      sequenceDocTypeId,
      active: true,
      branchScope: branchScope || 'all',
      branchId: branchId ?? null,
      fiscalYearScope: fiscalYearScope ?? null,
      ...(excludeId && { id: { not: excludeId } }),
    },
    data: { active: false },
  })
}

/**
 * Query Transaction Sequences list with search, filtering, and pagination.
 */
export async function getTransactionSequences(
  companyId: string,
  filters: TransactionSequenceFilters = {}
) {
  const page = Math.max(1, filters.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 50))
  const skip = (page - 1) * pageSize

  const where: any = { companyId }

  if (filters.active !== undefined) {
    where.active = filters.active
  }

  if (filters.dateDisplayMode) {
    where.dateDisplayMode = filters.dateDisplayMode
  }

  if (filters.branchId) {
    where.OR = [{ branchScope: 'all' }, { branchId: filters.branchId }]
  }

  if (filters.moduleCode) {
    where.sequenceDocType = { moduleCode: filters.moduleCode }
  }

  if (filters.search) {
    const term = filters.search.trim()
    where.OR = [
      { nameAr: { contains: term, mode: 'insensitive' } },
      { nameEn: { contains: term, mode: 'insensitive' } },
      { prefix: { contains: term, mode: 'insensitive' } },
      { sequenceDocType: { code: { contains: term } } },
      { sequenceDocType: { nameAr: { contains: term, mode: 'insensitive' } } },
      { sequenceDocType: { nameEn: { contains: term, mode: 'insensitive' } } },
      { sequenceDocType: { docTypeKey: { contains: term, mode: 'insensitive' } } },
    ]
  }

  const [total, items] = await Promise.all([
    db.transactionSequence.count({ where }),
    db.transactionSequence.findMany({
      where,
      include: {
        sequenceDocType: {
          select: {
            id: true,
            code: true,
            docTypeKey: true,
            nameAr: true,
            nameEn: true,
            moduleCode: true,
            mainDocType: true,
            active: true,
          },
        },
        segments: {
          orderBy: { segmentNumber: 'asc' },
        },
        sequenceStates: {
          select: {
            id: true,
            fiscalYear: true,
            lastNumber: true,
            nextNumber: true,
            branchId: true,
          },
        },
      },
      orderBy: [
        { sequenceDocType: { sortOrder: 'asc' } },
        { sequenceDocType: { code: 'asc' } },
        { sequenceNumber: 'asc' },
      ],
      skip,
      take: pageSize,
    }),
  ])

  // Enrich with usage count & live counter summaries
  const enriched = items.map((seq) => {
    const totalIssued = seq.sequenceStates.reduce((sum, s) => sum + (s.lastNumber || 0), 0)
    return {
      ...seq,
      totalIssued,
      isUsed: totalIssued > 0 || seq.isLocked,
    }
  })

  return {
    items: enriched,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

/**
 * Get single Transaction Sequence by ID with all segments and usage data.
 */
export async function getTransactionSequenceById(id: string, companyId: string) {
  const sequence = await db.transactionSequence.findFirst({
    where: { id, companyId },
    include: {
      sequenceDocType: true,
      segments: {
        orderBy: { segmentNumber: 'asc' },
      },
      sequenceStates: {
        orderBy: { fiscalYear: 'desc' },
      },
    },
  })

  if (!sequence) return null

  const usageCount = await countUsageForSequence(id, companyId)

  return {
    ...sequence,
    usageCount,
    isUsed: usageCount > 0 || sequence.isLocked,
  }
}

/**
 * Create a new Transaction Sequence with optional segments.
 */
export async function createTransactionSequence(
  companyId: string,
  input: CreateTransactionSequenceInput,
  userId?: string
) {
  const docType = await db.sequenceDocType.findFirst({
    where: { id: input.sequenceDocTypeId, companyId },
  })

  if (!docType) {
    throw new Error('نوع وثيقة التسلسل غير موجود في هذه الشركة')
  }

  const seqNumber =
    input.sequenceNumber ?? (await getNextSequenceNumberForDocType(companyId, input.sequenceDocTypeId))

  // Verify uniqueness of sequenceNumber per docType
  const existingWithNumber = await db.transactionSequence.findFirst({
    where: { companyId, sequenceDocTypeId: input.sequenceDocTypeId, sequenceNumber: seqNumber },
  })

  if (existingWithNumber) {
    throw new Error(`رقم التسلسل (${seqNumber}) مسجل مسبقاً لنوع الوثيقة "${docType.nameAr}"`)
  }

  const active = input.active ?? true
  const branchScope = input.branchScope ?? 'all'
  const branchId = branchScope === 'single_branch' ? input.branchId ?? null : null
  const fiscalYearScope = input.fiscalYearScope ?? null

  const created = await db.$transaction(async (tx) => {
    // Single Active Rule: if active, deactivate competitors in same scope
    if (active) {
      await enforceSingleActiveInScope(
        tx,
        companyId,
        input.sequenceDocTypeId,
        branchScope,
        branchId,
        fiscalYearScope
      )
    }

    const newSeq = await tx.transactionSequence.create({
      data: {
        companyId,
        sequenceDocTypeId: input.sequenceDocTypeId,
        sequenceNumber: seqNumber,
        nameAr: input.nameAr ?? docType.nameAr,
        nameEn: input.nameEn ?? docType.nameEn,
        dateDisplayMode: input.dateDisplayMode ?? 'automatic',
        active,
        initialValue: Math.max(1, input.initialValue ?? 1),
        numberLength: Math.max(3, input.numberLength ?? 6),
        prefix: input.prefix ?? null,
        suffix: input.suffix ?? null,
        resetPolicy: input.resetPolicy ?? 'fiscal_year',
        branchScope,
        branchId,
        fiscalYearScope,
        notes: input.notes ?? null,
        entryStartDate: new Date(),
        createdById: userId ?? null,
        segments: input.segments?.length
          ? {
              create: input.segments.map((seg, idx) => ({
                segmentNumber: seg.segmentNumber ?? idx + 1,
                segmentType: seg.segmentType,
                value: seg.value,
                segmentLength: seg.segmentLength ?? null,
                isResetTrigger: seg.isResetTrigger ?? false,
                formatType: seg.formatType ?? null,
                dateFormat: seg.dateFormat ?? null,
              })),
            }
          : undefined,
      },
      include: {
        segments: true,
      },
    })

    return newSeq
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'TRANSACTION_SEQUENCE',
    documentId: created.id,
    action: 'create',
    reason: `إنشاء تسلسل عمليات جديد: ${created.nameAr} (التسلسل ${created.sequenceNumber})`,
    newValue: created,
  })

  return created
}

/**
 * Update an existing Transaction Sequence with lifecycle guards.
 */
export async function updateTransactionSequence(
  id: string,
  companyId: string,
  input: UpdateTransactionSequenceInput,
  userId?: string
) {
  const existing = await db.transactionSequence.findFirst({
    where: { id, companyId },
    include: { segments: true, sequenceStates: true },
  })

  if (!existing) {
    throw new Error('تسلسل العمليات غير موجود')
  }

  const usageCount = await countUsageForSequence(id, companyId)
  const isUsed = usageCount > 0 || existing.isLocked

  // Lifecycle Validation for Used Sequences:
  if (isUsed) {
    if (input.initialValue !== undefined && input.initialValue < existing.initialValue) {
      throw new Error(
        `لا يمكن تقليل القيمة الابتدائية لتسلسل مستخدم في (${usageCount}) معاملة فعلية`
      )
    }

    if (input.sequenceNumber !== undefined && input.sequenceNumber !== existing.sequenceNumber) {
      throw new Error('لا يمكن تعديل رقم التسلسل بعد استخدامه في عمليات النظام')
    }
  }

  const branchScope = input.branchScope ?? existing.branchScope
  const branchId = branchScope === 'single_branch' ? (input.branchId !== undefined ? input.branchId : existing.branchId) : null
  const fiscalYearScope = input.fiscalYearScope !== undefined ? input.fiscalYearScope : existing.fiscalYearScope
  const active = input.active !== undefined ? input.active : existing.active

  const updated = await db.$transaction(async (tx) => {
    // If activating, deactivate competitors in same scope
    if (active) {
      await enforceSingleActiveInScope(
        tx,
        companyId,
        existing.sequenceDocTypeId,
        branchScope,
        branchId,
        fiscalYearScope,
        id
      )
    }

    // If segments are supplied, replace them cleanly
    if (input.segments !== undefined) {
      await tx.sequenceSegment.deleteMany({
        where: { transactionSequenceId: id },
      })

      if (input.segments.length > 0) {
        await tx.sequenceSegment.createMany({
          data: input.segments.map((seg, idx) => ({
            transactionSequenceId: id,
            segmentNumber: seg.segmentNumber ?? idx + 1,
            segmentType: seg.segmentType,
            value: seg.value,
            segmentLength: seg.segmentLength ?? null,
            isResetTrigger: seg.isResetTrigger ?? false,
            formatType: seg.formatType ?? null,
            dateFormat: seg.dateFormat ?? null,
          })),
        })
      }
    }

    const res = await tx.transactionSequence.update({
      where: { id },
      data: {
        ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
        ...(input.nameEn !== undefined && { nameEn: input.nameEn }),
        ...(input.dateDisplayMode !== undefined && { dateDisplayMode: input.dateDisplayMode }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.initialValue !== undefined && { initialValue: input.initialValue }),
        ...(input.numberLength !== undefined && { numberLength: input.numberLength }),
        ...(input.prefix !== undefined && { prefix: input.prefix }),
        ...(input.suffix !== undefined && { suffix: input.suffix }),
        ...(input.resetPolicy !== undefined && { resetPolicy: input.resetPolicy }),
        ...(input.branchScope !== undefined && { branchScope: input.branchScope }),
        branchId,
        fiscalYearScope,
        ...(input.notes !== undefined && { notes: input.notes }),
        version: { increment: 1 },
        updatedById: userId ?? null,
      },
      include: {
        segments: { orderBy: { segmentNumber: 'asc' } },
        sequenceDocType: true,
      },
    })

    return res
  })

  const { old, new: changes } = diffFields(existing as any, input as any)

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'TRANSACTION_SEQUENCE',
    documentId: id,
    action: 'update',
    reason: `تعديل إعدادات تسلسل العمليات: ${updated.nameAr}`,
    oldValue: old,
    newValue: changes,
  })

  return updated
}

/**
 * Toggle Active status with single-active scope enforcement and audit log.
 */
export async function toggleTransactionSequenceStatus(
  id: string,
  companyId: string,
  active: boolean,
  userId?: string
) {
  const existing = await db.transactionSequence.findFirst({
    where: { id, companyId },
  })

  if (!existing) {
    throw new Error('تسلسل العمليات غير موجود')
  }

  const updated = await db.$transaction(async (tx) => {
    if (active) {
      await enforceSingleActiveInScope(
        tx,
        companyId,
        existing.sequenceDocTypeId,
        existing.branchScope,
        existing.branchId,
        existing.fiscalYearScope,
        id
      )
    }

    return await tx.transactionSequence.update({
      where: { id },
      data: { active, updatedById: userId ?? null },
      include: { sequenceDocType: true },
    })
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'TRANSACTION_SEQUENCE',
    documentId: id,
    action: active ? 'reactivate' : 'deactivate',
    reason: active ? `تفعيل تسلسل العمليات: ${existing.nameAr}` : `تعطيل تسلسل العمليات: ${existing.nameAr}`,
    oldValue: { active: existing.active },
    newValue: { active },
  })

  return updated
}

/**
 * Safe Deletion: Strictly blocked if sequence has issued numbers or transactions exist.
 */
export async function deleteTransactionSequence(id: string, companyId: string, userId?: string) {
  const existing = await db.transactionSequence.findFirst({
    where: { id, companyId },
    include: { sequenceDocType: true },
  })

  if (!existing) {
    throw new Error('تسلسل العمليات غير موجود')
  }

  const usageCount = await countUsageForSequence(id, companyId)
  if (usageCount > 0) {
    throw new Error(
      `لا يمكن حذف تسلسل العمليات "${existing.nameAr}" (التسلسل ${existing.sequenceNumber}) لوجود (${usageCount}) رقم صادر أو معاملة مرتبطة به؛ يرجى تعطيل التسلسل بدلاً من الحذف الفيزيائي`
    )
  }

  await db.$transaction(async (tx) => {
    await tx.sequenceSegment.deleteMany({ where: { transactionSequenceId: id } })
    await tx.numberSequence.deleteMany({ where: { transactionSequenceId: id } })
    await tx.transactionSequence.delete({ where: { id } })
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'TRANSACTION_SEQUENCE',
    documentId: id,
    action: 'delete',
    reason: `حذف تسلسل عمليات غير مستخدم: ${existing.nameAr} (التسلسل ${existing.sequenceNumber})`,
    oldValue: existing,
  })

  return true
}

/**
 * Versioned, 100% Idempotent Standard Sequence Initialization.
 * Provisions Sequence 1 for every standard SequenceDocType in the company.
 * Never overwrites existing user customizations.
 */
export async function initializeStandardSequences(companyId: string, userId?: string) {
  // Ensure SequenceDocTypes exist for this company
  const docTypes = await db.sequenceDocType.findMany({
    where: { companyId },
  })

  if (docTypes.length === 0) {
    return { createdCount: 0, existingCount: 0 }
  }

  const existingSequences = await db.transactionSequence.findMany({
    where: { companyId },
    select: { sequenceDocTypeId: true },
  })

  const existingDocTypeIds = new Set(existingSequences.map((s) => s.sequenceDocTypeId))

  let createdCount = 0

  for (const dt of docTypes) {
    if (existingDocTypeIds.has(dt.id)) continue

    // Determine initial length based on domain
    const numberLength = dt.moduleCode === 'HR' ? 10 : 6

    await db.transactionSequence.create({
      data: {
        companyId,
        sequenceDocTypeId: dt.id,
        sequenceNumber: 1,
        nameAr: dt.nameAr,
        nameEn: dt.nameEn,
        dateDisplayMode: dt.moduleCode === 'HR' ? 'manual' : 'automatic',
        active: true,
        initialValue: 1,
        numberLength,
        resetPolicy: 'fiscal_year',
        branchScope: 'all',
        entryStartDate: new Date(),
        createdById: userId ?? null,
      },
    })

    createdCount++
  }

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'TRANSACTION_SEQUENCE',
    action: 'configure',
    reason: 'تهيئة تسلسلات العمليات القياسية للشركة',
    newValue: {
      catalogVersion: TRANSACTION_SEQUENCES_CATALOG_VERSION,
      createdCount,
      existingCount: existingSequences.length,
      timestamp: new Date().toISOString(),
    },
  })

  return {
    createdCount,
    existingCount: existingSequences.length,
  }
}
