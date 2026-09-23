'use client'

// Enterprise ERP — Dynamic Subledger Labels Hook
// Central React hook for resolving custom subledger entity names and field labels
// Architectural Principle: Technical Identity ≠ Display Label

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useT } from '@/lib/i18n/use-t'

interface SubledgerBundleItem {
  name: string
  nameAr: string
  nameEn: string | null
  fields: Record<string, string>
  rawFields: Record<string, { ar: string; en: string | null }>
}

type SubledgerBundle = Record<string, SubledgerBundleItem>

export function useSubledgerLabels() {
  const { isRTL } = useT()
  const locale = isRTL ? 'ar' : 'en'
  const queryClient = useQueryClient()

  const { data: bundle, isLoading, error } = useQuery<SubledgerBundle>({
    queryKey: ['subledger-labels', locale],
    queryFn: async () => {
      const res = await fetch(`/api/erp/subledgers-naming/resolve?locale=${locale}`, {
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Failed to load subledger labels')
      }
      const json = await res.json()
      return json.data || {}
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  })

  /**
   * Resolve an entity name or a field label with fallback.
   */
  const resolveSubledger = (
    subledgerType: string,
    fieldKey?: string,
    fallback?: string
  ): string => {
    if (!bundle) return fallback || ''

    const item = bundle[subledgerType]
    if (!item) return fallback || ''

    if (!fieldKey || fieldKey === 'entity') {
      return item.name || fallback || ''
    }

    const fieldVal = item.fields[fieldKey]
    return fieldVal || fallback || ''
  }

  /**
   * Get the display name of a subledger entity (e.g. 'COST_CENTER' -> 'مراكز التكلفة' or 'المهام التشغيلية')
   */
  const getSubledgerName = (subledgerType: string, fallback?: string): string => {
    return resolveSubledger(subledgerType, 'entity', fallback)
  }

  /**
   * Get the display label of a specific field on a subledger (e.g. 'COST_CENTER', 'code' -> 'رقم المركز')
   */
  const getFieldLabel = (
    subledgerType: string,
    fieldKey: string,
    fallback?: string
  ): string => {
    return resolveSubledger(subledgerType, fieldKey, fallback)
  }

  /**
   * Invalidate query cache so all screens instantly reflect new labels.
   */
  const refreshLabels = () => {
    queryClient.invalidateQueries({ queryKey: ['subledger-labels'] })
    queryClient.invalidateQueries({ queryKey: ['subledger-definitions'] })
  }

  return {
    bundle: bundle || {},
    isLoading,
    error,
    resolveSubledger,
    getSubledgerName,
    getFieldLabel,
    refreshLabels,
  }
}
