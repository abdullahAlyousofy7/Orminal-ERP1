// Enterprise ERP — Subledger Dynamic Label Resolution Service
// Architectural Source: ADR-001, ADR-009, ADR-014
// Guarantees: Dynamic Label Resolution with In-Memory Caching & Fail-Safe Fallbacks

import { db } from '@/lib/db'
import { STANDARD_SUBLEDGER_CATALOG } from './subledger-catalog'

interface SubledgerResolvedMetadata {
  nameAr: string
  nameEn: string | null
  fields: Record<string, { ar: string; en: string | null }>
}

// In-memory cache keyed by companyId -> Record<subledgerType, SubledgerResolvedMetadata>
const labelCache = new Map<string, { timestamp: number; data: Record<string, SubledgerResolvedMetadata> }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function invalidateSubledgerLabelCache(companyId?: string, subledgerType?: string) {
  if (companyId) {
    labelCache.delete(companyId)
  } else {
    labelCache.clear()
  }
}

/**
 * Load all resolved labels for a company from database or cache.
 */
export async function getCompanySubledgerMetadata(companyId: string): Promise<Record<string, SubledgerResolvedMetadata>> {
  const cached = labelCache.get(companyId)
  const now = Date.now()
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const definitions = await db.subledgerDefinition.findMany({
      where: { companyId, active: true },
      include: { fields: true },
    })

    const result: Record<string, SubledgerResolvedMetadata> = {}

    for (const def of definitions) {
      const fieldMap: Record<string, { ar: string; en: string | null }> = {}
      for (const f of def.fields) {
        fieldMap[f.fieldKey] = {
          ar: f.labelAr,
          en: f.labelEn,
        }
      }

      result[def.subledgerType] = {
        nameAr: def.nameAr,
        nameEn: def.nameEn,
        fields: fieldMap,
      }
    }

    // Populate catalog fallbacks for any subledger type not yet saved in DB
    for (const cat of STANDARD_SUBLEDGER_CATALOG) {
      if (!result[cat.subledgerType]) {
        const fieldMap: Record<string, { ar: string; en: string | null }> = {}
        for (const f of cat.fieldLabels) {
          fieldMap[f.fieldKey] = {
            ar: f.labelAr,
            en: f.labelEn,
          }
        }
        result[cat.subledgerType] = {
          nameAr: cat.nameAr,
          nameEn: cat.nameEn,
          fields: fieldMap,
        }
      }
    }

    labelCache.set(companyId, { timestamp: now, data: result })
    return result
  } catch (err) {
    console.error('[getCompanySubledgerMetadata] error, returning static catalog:', err)
    const fallbackResult: Record<string, SubledgerResolvedMetadata> = {}
    for (const cat of STANDARD_SUBLEDGER_CATALOG) {
      const fieldMap: Record<string, { ar: string; en: string | null }> = {}
      for (const f of cat.fieldLabels) {
        fieldMap[f.fieldKey] = {
          ar: f.labelAr,
          en: f.labelEn,
        }
      }
      fallbackResult[cat.subledgerType] = {
        nameAr: cat.nameAr,
        nameEn: cat.nameEn,
        fields: fieldMap,
      }
    }
    return fallbackResult
  }
}

/**
 * Resolve display label dynamically.
 * @param companyId Tenant identifier
 * @param subledgerType E.g. 'COST_CENTER', 'ACTIVITY', 'PROJECT', 'ANALYTIC_ACCOUNT'
 * @param fieldKey Optional field key ('entity', 'code', 'name', etc.). If omitted, returns subledger entity name.
 * @param locale 'ar' or 'en'
 * @param fallback Safe hardcoded fallback if resolution fails
 */
export async function resolveSubledgerLabel(
  companyId: string,
  subledgerType: string,
  fieldKey?: string,
  locale: string = 'ar',
  fallback: string = ''
): Promise<string> {
  const metadata = await getCompanySubledgerMetadata(companyId)
  const entry = metadata[subledgerType]

  if (!entry) {
    return fallback
  }

  const isEn = locale.startsWith('en')

  if (!fieldKey || fieldKey === 'entity') {
    if (isEn && entry.nameEn) return entry.nameEn
    return entry.nameAr || fallback
  }

  const field = entry.fields[fieldKey]
  if (!field) {
    return fallback
  }

  if (isEn && field.en) {
    return field.en
  }

  return field.ar || fallback
}

/**
 * Get all labels for a company formatted for API consumption.
 */
export async function getSubledgerBundle(companyId: string, locale: string = 'ar') {
  const metadata = await getCompanySubledgerMetadata(companyId)
  const isEn = locale.startsWith('en')

  const bundle: Record<
    string,
    {
      name: string
      nameAr: string
      nameEn: string | null
      fields: Record<string, string>
      rawFields: Record<string, { ar: string; en: string | null }>
    }
  > = {}

  for (const [key, val] of Object.entries(metadata)) {
    const flatFields: Record<string, string> = {}
    for (const [fKey, fVal] of Object.entries(val.fields)) {
      flatFields[fKey] = (isEn && fVal.en ? fVal.en : fVal.ar) || fVal.ar
    }

    bundle[key] = {
      name: (isEn && val.nameEn ? val.nameEn : val.nameAr) || val.nameAr,
      nameAr: val.nameAr,
      nameEn: val.nameEn,
      fields: flatFields,
      rawFields: val.fields,
    }
  }

  return bundle
}
