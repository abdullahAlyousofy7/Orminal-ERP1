// Enterprise ERP — Subledgers Naming Service
// Architectural Source: ADR-001, ADR-009, ADR-014, ADR-016
// Single Source of Truth for Subledger Display Labels and Subledger-Specific Variables

import { db } from '@/lib/db'
import { writeAudit, diffFields } from '@/lib/erp/audit'
import {
  STANDARD_SUBLEDGER_CATALOG,
  type StandardSubledgerCatalogItem,
  type SubledgerType,
} from './subledger-catalog'
import { invalidateSubledgerLabelCache } from './subledger-label-service'

export interface CreateSubledgerDefinitionInput {
  subledgerType: string
  numericId?: number
  nameAr: string
  nameEn?: string
  description?: string
  variables?: Record<string, any>
  fields?: Array<{
    fieldKey: string
    labelAr: string
    labelEn?: string
    sortOrder?: number
  }>
}

export interface UpdateSubledgerDefinitionInput {
  nameAr?: string
  nameEn?: string
  description?: string
  active?: boolean
  variables?: Record<string, any>
  fields?: Array<{
    fieldKey: string
    labelAr: string
    labelEn?: string
    sortOrder?: number
  }>
}

/**
 * Check whether a subledger type is currently in use in active records or transactions.
 * Prevents changing behavioral variables or deleting once transactions exist.
 */
export async function isSubledgerInUse(
  companyId: string,
  subledgerType: string
): Promise<{ inUse: boolean; reason?: string }> {
  try {
    if (subledgerType === 'COST_CENTER') {
      const ccCount = await db.costCenter.count()
      if (ccCount > 0) {
        const jlCount = await db.journalLine.count({
          where: { costCenterId: { not: null } },
        })
        const prCount = await db.purchaseRequestLine.count({
          where: { costCenterId: { not: null } },
        })
        if (jlCount > 0 || prCount > 0) {
          return {
            inUse: true,
            reason: `يوجد ${jlCount} حركة يومية و ${prCount} طلب شراء مرتبط بمراكز التكلفة`,
          }
        }
        return {
          inUse: true,
          reason: `يوجد ${ccCount} مركز تكلفة معرف بالنظام`,
        }
      }
    } else if (subledgerType === 'ACTIVITY') {
      const actCount = await db.activity.count()
      if (actCount > 0) {
        return {
          inUse: true,
          reason: `يوجد ${actCount} نشاط معرف في النظام`,
        }
      }
    } else if (subledgerType === 'ANALYTIC_ACCOUNT') {
      const aaCount = await db.analyticAccount.count()
      if (aaCount > 0) {
        const jlCount = await db.journalLine.count({
          where: { analyticAccountId: { not: null } },
        })
        if (jlCount > 0) {
          return {
            inUse: true,
            reason: `يوجد ${jlCount} حركة يومية مرتبطة بالحسابات التحليلية`,
          }
        }
        return {
          inUse: true,
          reason: `يوجد ${aaCount} حساب تحليلي معرف بالنظام`,
        }
      }
    }

    return { inUse: false }
  } catch (err) {
    console.warn('[isSubledgerInUse] check failed, defaulting to false:', err)
    return { inUse: false }
  }
}

/**
 * Idempotently seed standard subledgers for a company if not yet initialized.
 */
export async function ensureStandardSubledgers(
  companyId: string,
  userId?: string
): Promise<void> {
  for (const item of STANDARD_SUBLEDGER_CATALOG) {
    const existing = await db.subledgerDefinition.findUnique({
      where: {
        companyId_subledgerType: {
          companyId,
          subledgerType: item.subledgerType,
        },
      },
    })

    if (!existing) {
      const def = await db.subledgerDefinition.create({
        data: {
          companyId,
          numericId: item.numericId,
          subledgerType: item.subledgerType,
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          description: item.descriptionAr,
          active: true,
          isSystem: true,
          variables: JSON.stringify(item.variables),
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
          fields: {
            create: item.fieldLabels.map((f) => ({
              fieldKey: f.fieldKey,
              labelAr: f.labelAr,
              labelEn: f.labelEn,
              sortOrder: f.sortOrder,
            })),
          },
        },
      })

      if (userId) {
        await writeAudit({
          userId,
          companyId,
          moduleCode: 'SYS',
          documentType: 'SUBLEDGER_NAMING',
          documentId: def.id,
          action: 'create',
          newValue: {
            subledgerType: item.subledgerType,
            nameAr: item.nameAr,
            nameEn: item.nameEn,
            isSystem: true,
          },
          reason: 'تهيئة الأدلة الفرعية الافتراضية للشركة',
        })
      }
    }
  }
}

/**
 * Get list of subledger definitions with search, filter, and in-use status.
 */
export async function getSubledgerDefinitions(
  companyId: string,
  options?: {
    search?: string
    subledgerType?: string
    active?: boolean
    skip?: number
    take?: number
  }
) {
  // Ensure standard defaults exist for this company
  await ensureStandardSubledgers(companyId)

  const where: any = { companyId }

  if (options?.subledgerType) {
    where.subledgerType = options.subledgerType
  }

  if (options?.active !== undefined) {
    where.active = options.active
  }

  if (options?.search) {
    const s = options.search.trim()
    where.OR = [
      { nameAr: { contains: s, mode: 'insensitive' } },
      { nameEn: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
      { subledgerType: { contains: s, mode: 'insensitive' } },
    ]
  }

  const [total, rawItems] = await Promise.all([
    db.subledgerDefinition.count({ where }),
    db.subledgerDefinition.findMany({
      where,
      include: {
        fields: {
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: [{ numericId: 'asc' }, { createdAt: 'asc' }],
      skip: options?.skip ?? 0,
      take: options?.take ?? 50,
    }),
  ])

  // Attach in-use check to each item
  const items = await Promise.all(
    rawItems.map(async (item) => {
      const inUseStatus = await isSubledgerInUse(companyId, item.subledgerType)
      let parsedVars = {}
      try {
        parsedVars = item.variables ? JSON.parse(item.variables) : {}
      } catch {
        parsedVars = {}
      }
      return {
        ...item,
        parsedVariables: parsedVars,
        isInUse: inUseStatus.inUse,
        inUseReason: inUseStatus.reason,
      }
    })
  )

  return { total, items }
}

/**
 * Get single subledger definition by ID.
 */
export async function getSubledgerDefinitionById(
  companyId: string,
  id: string
) {
  const item = await db.subledgerDefinition.findFirst({
    where: { id, companyId },
    include: {
      fields: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  if (!item) return null

  const inUseStatus = await isSubledgerInUse(companyId, item.subledgerType)
  let parsedVars = {}
  try {
    parsedVars = item.variables ? JSON.parse(item.variables) : {}
  } catch {
    parsedVars = {}
  }

  return {
    ...item,
    parsedVariables: parsedVars,
    isInUse: inUseStatus.inUse,
    inUseReason: inUseStatus.reason,
  }
}

/**
 * Create custom subledger definition.
 */
export async function createSubledgerDefinition(
  companyId: string,
  input: CreateSubledgerDefinitionInput,
  userId?: string
) {
  const existing = await db.subledgerDefinition.findUnique({
    where: {
      companyId_subledgerType: {
        companyId,
        subledgerType: input.subledgerType,
      },
    },
  })

  if (existing) {
    throw new Error(`نوع الدليل الفرعي (${input.subledgerType}) معرف مسبقاً في المنشأة`)
  }

  // Determine next numericId if not provided or if already taken
  let numericId = input.numericId
  if (numericId) {
    const duplicateNum = await db.subledgerDefinition.findFirst({
      where: { companyId, numericId },
      select: { id: true },
    })
    if (duplicateNum) numericId = undefined
  }
  if (!numericId) {
    const highest = await db.subledgerDefinition.findFirst({
      where: { companyId },
      orderBy: { numericId: 'desc' },
      select: { numericId: true },
    })
    numericId = (highest?.numericId ?? 0) + 1
  }

  const result = await db.$transaction(async (tx) => {
    const def = await tx.subledgerDefinition.create({
      data: {
        companyId,
        numericId,
        subledgerType: input.subledgerType,
        nameAr: input.nameAr,
        nameEn: input.nameEn,
        description: input.description,
        active: true,
        isSystem: false,
        variables: input.variables ? JSON.stringify(input.variables) : null,
        createdBy: userId ?? null,
        updatedBy: userId ?? null,
        fields: input.fields && input.fields.length > 0
          ? {
            create: input.fields.map((f, idx) => ({
              fieldKey: f.fieldKey,
              labelAr: f.labelAr,
              labelEn: f.labelEn ?? null,
              sortOrder: f.sortOrder ?? idx + 1,
            })),
          }
          : undefined,
      },
      include: {
        fields: true,
      },
    })
    return def
  })

  await writeAudit({
    userId: userId ?? null,
    companyId,
    moduleCode: 'SYS',
    documentType: 'SUBLEDGER_NAMING',
    documentId: result.id,
    action: 'create',
    newValue: {
      subledgerType: result.subledgerType,
      nameAr: result.nameAr,
      nameEn: result.nameEn,
      fieldsCount: result.fields.length,
    },
    reason: 'إنشاء تسمية دليل فرعي جديدة',
  })

  invalidateSubledgerLabelCache(companyId, input.subledgerType)
  return result
}

/**
 * Update subledger definition, variables, and field labels.
 * Enforces in-use rule on behavioral variables and protects technical field keys.
 */
export async function updateSubledgerDefinition(
  companyId: string,
  id: string,
  input: UpdateSubledgerDefinitionInput,
  userId?: string
) {
  const existing = await db.subledgerDefinition.findFirst({
    where: { id, companyId },
    include: { fields: true },
  })

  if (!existing) {
    throw new Error('تعريف الدليل الفرعي غير موجود أو لا ينتمي للمنشأة الحالية')
  }

  // Check in-use constraints for variables
  const inUseCheck = await isSubledgerInUse(companyId, existing.subledgerType)
  if (inUseCheck.inUse && input.variables !== undefined) {
    // If attempting to alter behavioral variables while in use, verify if they actually changed
    const existingVarsStr = existing.variables || '{}'
    const newVarsStr = JSON.stringify(input.variables)
    if (existingVarsStr !== newVarsStr) {
      throw new Error(
        `لا يمكن تعديل المتغيرات العامة لهذا الدليل الفرعي نظراً لأنه مستخدم بالفعل في عمليات سابقة: ${inUseCheck.reason}`
      )
    }
  }

  const result = await db.$transaction(async (tx) => {
    // 1. Update master definition attributes
    const updated = await tx.subledgerDefinition.update({
      where: { id },
      data: {
        nameAr: input.nameAr !== undefined ? input.nameAr : undefined,
        nameEn: input.nameEn !== undefined ? input.nameEn : undefined,
        description: input.description !== undefined ? input.description : undefined,
        active: input.active !== undefined ? input.active : undefined,
        variables: input.variables !== undefined ? JSON.stringify(input.variables) : undefined,
        updatedBy: userId ?? null,
      },
    })

    // 2. Update field labels without altering technical keys
    if (input.fields && input.fields.length > 0) {
      for (const field of input.fields) {
        // Upsert by definitionId + fieldKey
        await tx.subledgerFieldLabel.upsert({
          where: {
            definitionId_fieldKey: {
              definitionId: id,
              fieldKey: field.fieldKey,
            },
          },
          update: {
            labelAr: field.labelAr,
            labelEn: field.labelEn ?? null,
            sortOrder: field.sortOrder ?? undefined,
          },
          create: {
            definitionId: id,
            fieldKey: field.fieldKey,
            labelAr: field.labelAr,
            labelEn: field.labelEn ?? null,
            sortOrder: field.sortOrder ?? 0,
          },
        })
      }
    }

    // 3. Diff and audit log
    const diff = diffFields(existing, input as any, [
      'nameAr',
      'nameEn',
      'description',
      'active',
      'variables',
    ])

    await writeAudit(
      {
        userId: userId ?? null,
        companyId,
        moduleCode: 'SYS',
        documentType: 'SUBLEDGER_NAMING',
        documentId: id,
        action: 'update',
        oldValue: diff.old,
        newValue: diff.new,
        reason: 'تحديث تسميات وحقول الدليل الفرعي',
      },
      tx
    )

    return updated
  })

  invalidateSubledgerLabelCache(companyId, existing.subledgerType)
  return getSubledgerDefinitionById(companyId, id)
}

/**
 * Delete subledger definition (system subledgers and in-use subledgers cannot be deleted).
 */
export async function deleteSubledgerDefinition(
  companyId: string,
  id: string,
  userId?: string
) {
  const existing = await db.subledgerDefinition.findFirst({
    where: { id, companyId },
  })

  if (!existing) {
    throw new Error('تعريف الدليل الفرعي غير موجود')
  }

  if (existing.isSystem) {
    throw new Error('لا يمكن حذف دليل فرعي قياسي للنظام')
  }

  const inUseCheck = await isSubledgerInUse(companyId, existing.subledgerType)
  if (inUseCheck.inUse) {
    throw new Error(`لا يمكن حذف هذا الدليل الفرعي نظراً لوجود بيانات مرتبطة به: ${inUseCheck.reason}`)
  }

  await db.$transaction(async (tx) => {
    await tx.subledgerDefinition.delete({ where: { id } })

    await writeAudit(
      {
        userId: userId ?? null,
        companyId,
        moduleCode: 'SYS',
        documentType: 'SUBLEDGER_NAMING',
        documentId: id,
        action: 'delete',
        oldValue: {
          subledgerType: existing.subledgerType,
          nameAr: existing.nameAr,
        },
        reason: 'حذف تعريف دليل فرعي مخصص',
      },
      tx
    )
  })

  invalidateSubledgerLabelCache(companyId, existing.subledgerType)
  return { success: true }
}
