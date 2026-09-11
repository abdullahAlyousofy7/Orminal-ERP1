// =============================================================================
// Enterprise ERP — Document Date Policy & Governance Service
// Source: Directive 6, 10, 11 (Separation of Document Date, Posting Date, and System Date)
//
// Rules:
// 1. If dateDisplayMode === 'automatic':
//    - Document date is forced to system date (today).
//    - User modification is strictly rejected in backend.
// 2. If dateDisplayMode === 'manual':
//    - Document date defaults to system date.
//    - Modification is permitted ONLY IF user holds CAN_EDIT_DOC_DATE capability.
//    - Unpermitted modification is rejected with 403 INSUFFICIENT_PERMISSION.
// =============================================================================

import { db } from '@/lib/db'

export interface DocumentDateUserContext {
  userId: string
  companyId: string
  isSuperAdmin?: boolean
}

export interface DocumentDateValidationResult {
  valid: boolean
  effectiveDate: Date
  dateDisplayMode: 'automatic' | 'manual'
  error?: string
  status?: number
}

/**
 * Checks whether two dates belong to the same calendar day (ignoring hours/minutes).
 */
function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

/**
 * Checks if user has permission to manually alter document dates.
 * Evaluates RBAC permissions (CAN_EDIT_DOC_DATE) or superadmin status.
 */
export async function canUserEditDocumentDate(user: DocumentDateUserContext): Promise<boolean> {
  if (user.isSuperAdmin) return true

  // Check database permissions for user's assigned roles in this company
  const userRoles = await db.userRole.findMany({
    where: {
      userId: user.userId,
      companyId: user.companyId,
      active: true,
    },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  })

  for (const ur of userRoles) {
    // If role has full wildcard or SYS_TENANT_ADMIN
    if (['ADMIN', 'SUPERADMIN', 'SYSTEM', 'OWNER'].includes(ur.role.code.toUpperCase())) {
      return true
    }

    const hasCap = ur.role.rolePermissions.some((rp) => {
      const code = rp.permission.actionCode.toUpperCase()
      return (
        code === 'CAN_EDIT_DOC_DATE' ||
        code === 'EDIT_DOC_DATE' ||
        code === 'DOC_DATE_OVERRIDE' ||
        code === 'SYS_TENANT_ADMIN' ||
        rp.dataScope === 'all'
      )
    })

    if (hasCap) return true
  }

  return false
}

/**
 * Validates document date according to the active sequence's date policy.
 */
export async function validateDocumentDatePolicy(
  companyId: string,
  docTypeKey: string,
  submittedDate: Date | string | undefined | null,
  user?: DocumentDateUserContext | null,
  branchId?: string | null
): Promise<DocumentDateValidationResult> {
  const today = new Date()
  const targetDate = submittedDate ? new Date(submittedDate) : today

  // Locate the SequenceDocType
  const docType = await db.sequenceDocType.findFirst({
    where: { companyId, docTypeKey },
  })

  if (!docType) {
    // No specific doc type configured; accept date
    return {
      valid: true,
      effectiveDate: targetDate,
      dateDisplayMode: 'automatic',
    }
  }

  // Locate active TransactionSequence for this doc type
  const activeSeq = await db.transactionSequence.findFirst({
    where: {
      companyId,
      sequenceDocTypeId: docType.id,
      active: true,
      OR: [
        { branchScope: 'all' },
        { branchId: branchId ?? null },
      ],
    },
    orderBy: { branchId: 'desc' }, // specific branch takes precedence over 'all'
  })

  const mode = (activeSeq?.dateDisplayMode as 'automatic' | 'manual') || 'automatic'

  // If Automatic: Document date must be today
  if (mode === 'automatic') {
    if (submittedDate && !isSameDay(targetDate, today)) {
      return {
        valid: false,
        effectiveDate: today,
        dateDisplayMode: mode,
        error: `طريقة عرض تاريخ الوثيقة لنوع "${docType.nameAr}" محددة كـ 'آلي'؛ لا يُسمح بتعديل تاريخ الوثيقة يدوياً`,
        status: 400,
      }
    }
    return {
      valid: true,
      effectiveDate: today,
      dateDisplayMode: mode,
    }
  }

  // If Manual: Check if user changed the date from today
  if (!isSameDay(targetDate, today)) {
    if (user) {
      const permitted = await canUserEditDocumentDate(user)
      if (!permitted) {
        return {
          valid: false,
          effectiveDate: today,
          dateDisplayMode: mode,
          error: 'صلاحية غير كافية: لا تملك صلاحية تعديل تاريخ الوثيقة (CAN_EDIT_DOC_DATE)',
          status: 403,
        }
      }
    }
  }

  return {
    valid: true,
    effectiveDate: targetDate,
    dateDisplayMode: mode,
  }
}
