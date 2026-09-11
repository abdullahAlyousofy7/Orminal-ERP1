// Enterprise ERP — Sequence Document Types Service
// Master Data Registry Management, Safe Governance & Audit Logging
// Source: ADR-009, ADR-014, ADR-016

import { db } from '@/lib/db'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import {
  STANDARD_SEQUENCE_DOC_TYPES,
  STANDARD_SEQUENCE_DOC_TYPES_VERSION,
  type StandardDocTypeItem,
} from './sequence-doc-catalog'

export interface CreateSequenceDocTypeInput {
  code: string
  docTypeKey: string
  nameAr: string
  nameEn?: string | null
  moduleCode: string
  mainDocType: string
  affectsFinancial?: boolean
  affectsInventory?: boolean
  postingProfileCode?: string | null
  requiresApproval?: boolean
  active?: boolean
  sortOrder?: number
  notes?: string | null
}

export interface UpdateSequenceDocTypeInput {
  code?: string
  docTypeKey?: string
  nameAr?: string
  nameEn?: string | null
  moduleCode?: string
  mainDocType?: string
  affectsFinancial?: boolean
  affectsInventory?: boolean
  postingProfileCode?: string | null
  requiresApproval?: boolean
  active?: boolean
  sortOrder?: number
  notes?: string | null
}

/**
 * 100% Idempotent Initialization of the Standard Document Catalog for a company.
 * Repeated calls do NOT duplicate records or overwrite tenant customizations.
 */
export async function initializeStandardCatalog(companyId: string, userId?: string): Promise<{
  createdCount: number
  existingCount: number
  totalStandardCount: number
}> {
  // Fetch existing keys for this company to avoid overwriting or duplicating
  const existingDocs = await db.sequenceDocType.findMany({
    where: { companyId },
    select: { docTypeKey: true, code: true },
  })

  const existingKeySet = new Set(existingDocs.map((d) => d.docTypeKey))
  const existingCodeSet = new Set(existingDocs.map((d) => d.code))

  let createdCount = 0

  for (const item of STANDARD_SEQUENCE_DOC_TYPES) {
    if (!existingKeySet.has(item.docTypeKey) && !existingCodeSet.has(item.code)) {
      await db.sequenceDocType.create({
        data: {
          companyId,
          code: item.code,
          docTypeKey: item.docTypeKey,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          moduleCode: item.moduleCode,
          mainDocType: item.mainDocType,
          affectsFinancial: item.affectsFinancial,
          affectsInventory: item.affectsInventory,
          postingProfileCode: item.postingProfileCode ?? null,
          requiresApproval: item.requiresApproval ?? false,
          active: true,
          sortOrder: item.sortOrder,
          notes: item.notes ?? null,
          createdById: userId ?? null,
        },
      })
      existingKeySet.add(item.docTypeKey)
      existingCodeSet.add(item.code)
      createdCount++
    }
  }

  // Audit log the initialization event
  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SEQUENCE_DOC_TYPE',
    action: 'configure',
    reason: 'تهيئة الكتالوج القياسي لأنواع وثائق التسلسل',
    newValue: {
      catalogVersion: STANDARD_SEQUENCE_DOC_TYPES_VERSION,
      createdCount,
      existingCount: existingDocs.length,
      totalCatalogItems: STANDARD_SEQUENCE_DOC_TYPES.length,
      timestamp: new Date().toISOString(),
    },
  })

  return {
    createdCount,
    existingCount: existingDocs.length,
    totalStandardCount: STANDARD_SEQUENCE_DOC_TYPES.length,
  }
}

/**
 * Pure, side-effect free query for Sequence Document Types.
 */
export async function getSequenceDocTypes(
  companyId: string,
  options: {
    search?: string
    moduleCode?: string
    mainDocType?: string
    active?: boolean
    skip?: number
    take?: number
  } = {}
) {
  const { search, moduleCode, mainDocType, active, skip = 0, take = 100 } = options

  const where: any = { companyId }

  if (active !== undefined) {
    where.active = active
  }

  if (moduleCode) {
    where.moduleCode = moduleCode
  }

  if (mainDocType) {
    where.mainDocType = mainDocType
  }

  if (search) {
    where.OR = [
      { code: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
      { nameEn: { contains: search, mode: 'insensitive' } },
      { docTypeKey: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    db.sequenceDocType.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      skip,
      take,
    }),
    db.sequenceDocType.count({ where }),
  ])

  return { items, total }
}

/**
 * Count active or historical transactions for a given document type.
 */
export async function countTransactionsForDocType(companyId: string, docTypeKey: string): Promise<number> {
  let count = 0

  switch (docTypeKey) {
    case 'sales_invoice':
      count = await db.salesInvoice.count({ where: { companyId } })
      break
    case 'sales_order':
      count = await db.salesOrder.count({ where: { companyId } })
      break
    case 'sales_quotation':
      count = await db.salesQuotation.count({ where: { companyId } })
      break
    case 'sales_return':
      count = await db.salesReturn.count({ where: { companyId } })
      break
    case 'sales_credit_note':
      count = await db.salesCreditNote.count({ where: { companyId } })
      break
    case 'sales_payment':
      count = await db.salesPayment.count({ where: { companyId } })
      break
    case 'purchase_invoice':
      count = await db.purchaseInvoice.count({ where: { companyId } })
      break
    case 'purchase_order':
      count = await db.purchaseOrder.count({ where: { companyId } })
      break
    case 'purchase_request':
      count = await db.purchaseRequest.count({ where: { companyId } })
      break
    case 'purchase_return':
      count = await db.purchaseReturn.count({ where: { companyId } })
      break
    case 'purchase_credit_note':
      count = await db.purchaseCreditNote.count({ where: { companyId } })
      break
    case 'purchase_payment':
      count = await db.purchasePayment.count({ where: { companyId } })
      break
    case 'goods_receipt':
      count = await db.goodsReceipt.count({ where: { companyId } })
      break
    case 'delivery':
      count = await db.delivery.count({ where: { companyId } })
      break
    case 'stock_transfer':
      count = await db.stockTransfer.count({ where: { companyId } })
      break
    case 'stock_take':
    case 'inventory_adjustment':
      count = await db.inventoryAdjustment.count({ where: { companyId } })
      break
    case 'journal_entry':
      count = await db.journalEntry.count({ where: { companyId } })
      break
    case 'production_order':
      count = await db.productionOrder.count({ where: { companyId } })
      break
    case 'payslip':
      count = await db.payslip.count({ where: { payrollRun: { companyId } } })
      break
    default:
      break
  }

  // Also verify if a runtime sequence has ever issued an incremented number (lastNumber > 0)
  const seqCount = await db.numberSequence.count({
    where: {
      companyId,
      documentType: docTypeKey,
      lastNumber: { gt: 0 },
    },
  })

  return count + seqCount
}

/**
 * Get single Sequence Document Type by ID, enriched with linked sequence info & usage count.
 */
export async function getSequenceDocTypeById(id: string, companyId: string) {
  const doc = await db.sequenceDocType.findFirst({
    where: { id, companyId },
  })

  if (!doc) return null

  const [usageCount, sequences] = await Promise.all([
    countTransactionsForDocType(companyId, doc.docTypeKey),
    db.numberSequence.findMany({
      where: { companyId, documentType: doc.docTypeKey },
    }),
  ])

  return {
    ...doc,
    usageCount,
    sequences,
  }
}

/**
 * Create a new custom Sequence Document Type with code uniqueness checks.
 */
export async function createSequenceDocType(
  companyId: string,
  input: CreateSequenceDocTypeInput,
  userId?: string
) {
  // Check for duplicate code in this company
  const existingCode = await db.sequenceDocType.findFirst({
    where: { companyId, code: input.code },
  })
  if (existingCode) {
    throw new Error(`كود نوع الوثيقة (${input.code}) مستخدم مسبقاً في هذه الشركة`)
  }

  // Check for duplicate docTypeKey in this company
  const existingKey = await db.sequenceDocType.findFirst({
    where: { companyId, docTypeKey: input.docTypeKey },
  })
  if (existingKey) {
    throw new Error(`المعرف التقني (${input.docTypeKey}) مسجل مسبقاً في هذه الشركة`)
  }

  const created = await db.sequenceDocType.create({
    data: {
      companyId,
      code: input.code,
      docTypeKey: input.docTypeKey,
      nameAr: input.nameAr,
      nameEn: input.nameEn ?? null,
      moduleCode: input.moduleCode,
      mainDocType: input.mainDocType,
      affectsFinancial: input.affectsFinancial ?? false,
      affectsInventory: input.affectsInventory ?? false,
      postingProfileCode: input.postingProfileCode ?? null,
      requiresApproval: input.requiresApproval ?? false,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
      notes: input.notes ?? null,
      createdById: userId ?? null,
    },
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SEQUENCE_DOC_TYPE',
    documentId: created.id,
    action: 'create',
    reason: 'إنشاء نوع وثيقة تسلسل جديد',
    newValue: created,
  })

  return created
}

/**
 * Update an existing Sequence Document Type with immutability protection for docTypeKey.
 */
export async function updateSequenceDocType(
  id: string,
  companyId: string,
  input: UpdateSequenceDocTypeInput,
  userId?: string
) {
  const existing = await db.sequenceDocType.findFirst({
    where: { id, companyId },
  })

  if (!existing) {
    throw new Error('نوع وثيقة التسلسل غير موجود')
  }

  // If code is changing, check uniqueness
  if (input.code && input.code !== existing.code) {
    const codeConflict = await db.sequenceDocType.findFirst({
      where: { companyId, code: input.code, id: { not: id } },
    })
    if (codeConflict) {
      throw new Error(`كود نوع الوثيقة (${input.code}) مستخدم مسبقاً في هذه الشركة`)
    }
  }

  // Immutability Guard: If docTypeKey is changing, verify no historical transactions exist
  if (input.docTypeKey && input.docTypeKey !== existing.docTypeKey) {
    const usageCount = await countTransactionsForDocType(companyId, existing.docTypeKey)
    if (usageCount > 0) {
      throw new Error(
        `لا يمكن تعديل الهوية التقنية (docTypeKey) لنوع وثيقة تم استخدامه في ${usageCount} معاملة فعلية أو عداد ترقيم`
      )
    }

    const keyConflict = await db.sequenceDocType.findFirst({
      where: { companyId, docTypeKey: input.docTypeKey, id: { not: id } },
    })
    if (keyConflict) {
      throw new Error(`المعرف التقني (${input.docTypeKey}) مسجل مسبقاً في هذه الشركة`)
    }
  }

  const { old, new: changes } = diffFields(existing as any, input as any)

  const updated = await db.sequenceDocType.update({
    where: { id },
    data: {
      ...(input.code !== undefined && { code: input.code }),
      ...(input.docTypeKey !== undefined && { docTypeKey: input.docTypeKey }),
      ...(input.nameAr !== undefined && { nameAr: input.nameAr }),
      ...(input.nameEn !== undefined && { nameEn: input.nameEn }),
      ...(input.moduleCode !== undefined && { moduleCode: input.moduleCode }),
      ...(input.mainDocType !== undefined && { mainDocType: input.mainDocType }),
      ...(input.affectsFinancial !== undefined && { affectsFinancial: input.affectsFinancial }),
      ...(input.affectsInventory !== undefined && { affectsInventory: input.affectsInventory }),
      ...(input.postingProfileCode !== undefined && { postingProfileCode: input.postingProfileCode }),
      ...(input.requiresApproval !== undefined && { requiresApproval: input.requiresApproval }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      ...(input.notes !== undefined && { notes: input.notes }),
      updatedById: userId ?? null,
    },
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SEQUENCE_DOC_TYPE',
    documentId: id,
    action: 'update',
    reason: 'تحديث بيانات نوع وثيقة التسلسل',
    oldValue: old,
    newValue: changes,
  })

  return updated
}

/**
 * Toggle active status with audit logging.
 */
export async function toggleSequenceDocTypeStatus(
  id: string,
  companyId: string,
  active: boolean,
  userId?: string
) {
  const existing = await db.sequenceDocType.findFirst({
    where: { id, companyId },
  })

  if (!existing) {
    throw new Error('نوع وثيقة التسلسل غير موجود')
  }

  const updated = await db.sequenceDocType.update({
    where: { id },
    data: { active, updatedById: userId ?? null },
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SEQUENCE_DOC_TYPE',
    documentId: id,
    action: active ? 'reactivate' : 'deactivate',
    reason: active ? 'إعادة تفعيل نوع وثيقة التسلسل' : 'تعطيل نوع وثيقة التسلسل',
    oldValue: { active: existing.active },
    newValue: { active },
  })

  return updated
}

/**
 * Safe deletion: blocked if historical transactions or sequence state exists.
 */
export async function deleteSequenceDocType(id: string, companyId: string, userId?: string) {
  const existing = await db.sequenceDocType.findFirst({
    where: { id, companyId },
  })

  if (!existing) {
    throw new Error('نوع وثيقة التسلسل غير موجود')
  }

  const usageCount = await countTransactionsForDocType(companyId, existing.docTypeKey)
  if (usageCount > 0) {
    throw new Error(
      `لا يمكن حذف نوع الوثيقة "${existing.nameAr}" لوجود (${usageCount}) معاملة مرتبطة به؛ يمكنك تعطيله بدلاً من ذلك`
    )
  }

  await db.sequenceDocType.delete({
    where: { id },
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SEQUENCE_DOC_TYPE',
    documentId: id,
    action: 'delete',
    reason: 'حذف نوع وثيقة تسلسل غير مستخدم',
    oldValue: existing,
  })

  return true
}
