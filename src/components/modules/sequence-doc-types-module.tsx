'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Printer,
  Download,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Save,
  RotateCcw,
  ShieldAlert,
  ArrowRightLeft,
  Layers,
  Sparkles,
  X,
  ExternalLink,
  History,
} from 'lucide-react'
import { useNav } from '@/stores/nav-store'

interface SequenceDocType {
  id: string
  companyId: string
  code: string
  docTypeKey: string
  nameAr: string
  nameEn: string | null
  moduleCode: string
  mainDocType: string
  affectsFinancial: boolean
  affectsInventory: boolean
  postingProfileCode: string | null
  requiresApproval: boolean
  active: boolean
  sortOrder: number
  notes: string | null
  entryStartDate: string | null
  createdById: string | null
  updatedById: string | null
  createdAt: string
  updatedAt: string
  usageCount?: number
}

const MODULE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  FIN: { ar: 'الحسابات والمالية', en: 'Finance', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SAL: { ar: 'إدارة المبيعات', en: 'Sales', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  PUR: { ar: 'إدارة المشتريات', en: 'Purchases', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  INV: { ar: 'إدارة المخزون', en: 'Inventory', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  POS: { ar: 'نقاط البيع', en: 'POS', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  HR: { ar: 'الموارد البشرية والرواتب', en: 'HR & Payroll', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  MFG: { ar: 'التصنيع والإنتاج', en: 'Manufacturing', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  AST: { ar: 'الأصول الثابتة', en: 'Fixed Assets', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  SYS: { ar: 'إدارة النظام', en: 'System', color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

const MAIN_TYPE_LABELS: Record<string, string> = {
  financial: 'وثيقة مالية ومحاسبية',
  sales: 'وثيقة مبيعات وعملاء',
  purchases: 'وثيقة مشتريات وموردين',
  inventory: 'وثيقة مخازن ومستودعات',
  pos: 'وثيقة نقاط بيع',
  payroll: 'وثيقة أفراد ورواتب',
  manufacturing: 'وثيقة تصنيع وإنتاج',
  assets: 'وثيقة أصول ثابتة',
  system: 'وثيقة نظام عامة',
}

export function SequenceDocTypesModule() {
  const setActiveModule = useNav((s) => s.setActiveModule)

  const [items, setItems] = useState<SequenceDocType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(50)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Modals & Selection
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [viewDetailDoc, setViewDetailDoc] = useState<SequenceDocType | null>(null)

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    code: true,
    nameAr: true,
    nameEn: true,
    moduleCode: true,
    mainDocType: true,
    active: true,
    affectsFinancial: true,
    affectsInventory: true,
    requiresApproval: true,
    createdById: true,
    createdAt: true,
    updatedAt: true,
    actions: true,
  })
  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false)

  // Form State matching Screenshot 3
  const [formData, setFormData] = useState({
    id: '',
    code: '',
    docTypeKey: '',
    nameAr: '',
    nameEn: '',
    moduleCode: 'FIN',
    mainDocType: 'financial',
    affectsFinancial: false,
    affectsInventory: false,
    postingProfileCode: '',
    requiresApproval: false,
    active: true,
    sortOrder: 0,
    notes: '',
  })
  const [formErrors, setFormErrors] = useState<{ nameAr?: string; code?: string; docTypeKey?: string }>({})
  const [formNavIndex, setFormNavIndex] = useState<number>(0)

  // Fetch Items (Pure Read-Only GET)
  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (searchTerm.trim()) params.set('q', searchTerm.trim())
      if (selectedModule) params.set('moduleCode', selectedModule)
      if (selectedStatus) params.set('status', selectedStatus)

      const res = await fetch(`/api/erp/sequence-doc-types?${params.toString()}`)
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error?.message || 'فشل في تحميل أنواع وثائق التسلسل')
      }

      setItems(json.data || [])
      setTotalItems(json.meta?.pagination?.total ?? json.data?.length ?? 0)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, searchTerm, selectedModule, selectedStatus])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Clear messages after 4 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  // Explicit Idempotent Seeding / Initialize
  const handleInitializeCatalog = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/sequence-doc-types/initialize', {
        method: 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error?.message || 'فشل في تهيئة الكتالوج القياسي')
      }
      setSuccessMessage(json.data?.message || 'تمت تهيئة الكتالوج القياسي بنجاح')
      fetchItems()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Open Add Dialog
  const handleOpenAdd = () => {
    // Determine next numeric code
    const maxCode = items.reduce((max, item) => {
      const num = parseInt(item.code, 10)
      return !isNaN(num) && num > max ? num : max
    }, 0)

    setFormData({
      id: '',
      code: String(maxCode + 1),
      docTypeKey: '',
      nameAr: '',
      nameEn: '',
      moduleCode: 'FIN',
      mainDocType: 'financial',
      affectsFinancial: false,
      affectsInventory: false,
      postingProfileCode: '',
      requiresApproval: false,
      active: true,
      sortOrder: items.length + 1,
      notes: '',
    })
    setFormErrors({})
    setFormMode('create')
    setFormNavIndex(items.length)
    setIsFormOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (doc: SequenceDocType) => {
    const idx = items.findIndex((i) => i.id === doc.id)
    setFormData({
      id: doc.id,
      code: doc.code,
      docTypeKey: doc.docTypeKey,
      nameAr: doc.nameAr,
      nameEn: doc.nameEn || '',
      moduleCode: doc.moduleCode,
      mainDocType: doc.mainDocType,
      affectsFinancial: doc.affectsFinancial,
      affectsInventory: doc.affectsInventory,
      postingProfileCode: doc.postingProfileCode || '',
      requiresApproval: doc.requiresApproval,
      active: doc.active,
      sortOrder: doc.sortOrder,
      notes: doc.notes || '',
    })
    setFormErrors({})
    setFormMode('edit')
    setFormNavIndex(idx >= 0 ? idx : 0)
    setIsFormOpen(true)
  }

  // Navigate through records in the dialog (matching Screenshot 3 `< < 58 [ 1 ] > >`)
  const handleNavigateDialog = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (items.length === 0) return
    let newIndex = formNavIndex
    if (direction === 'first') newIndex = 0
    if (direction === 'prev') newIndex = Math.max(0, formNavIndex - 1)
    if (direction === 'next') newIndex = Math.min(items.length - 1, formNavIndex + 1)
    if (direction === 'last') newIndex = items.length - 1

    const doc = items[newIndex]
    if (doc) {
      handleOpenEdit(doc)
      setFormNavIndex(newIndex)
    }
  }

  // Save Form (Create or Update)
  const handleSaveForm = async () => {
    // Validate required fields (Screenshot 3: "هذا الحقل إجباري")
    const errors: { nameAr?: string; code?: string; docTypeKey?: string } = {}
    if (!formData.nameAr.trim()) {
      errors.nameAr = 'هذا الحقل إجباري'
    }
    if (!formData.code.trim()) {
      errors.code = 'هذا الحقل إجباري'
    }
    if (!formData.docTypeKey.trim()) {
      errors.docTypeKey = 'هذا الحقل إجباري'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      setLoading(true)
      const isEdit = formMode === 'edit' && formData.id
      const url = isEdit
        ? `/api/erp/sequence-doc-types/${formData.id}`
        : '/api/erp/sequence-doc-types'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json?.error?.message || 'فشل في حفظ نوع وثيقة التسلسل')
      }

      setSuccessMessage(isEdit ? 'تم تحديث نوع الوثيقة بنجاح' : 'تم إنشاء نوع الوثيقة بنجاح')
      setIsFormOpen(false)
      fetchItems()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (doc: SequenceDocType) => {
    try {
      const res = await fetch(`/api/erp/sequence-doc-types/${doc.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !doc.active }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error?.message || 'فشل في تغيير الحالة')
      }
      setSuccessMessage(doc.active ? 'تم تعطيل نوع الوثيقة بنجاح' : 'تم تفعيل نوع الوثيقة بنجاح')
      fetchItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Safe Delete
  const handleDelete = async (doc: SequenceDocType) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف نوع الوثيقة "${doc.nameAr}"؟`)) return

    try {
      const res = await fetch(`/api/erp/sequence-doc-types/${doc.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json?.error?.message || 'فشل في حذف نوع الوثيقة')
      }
      setSuccessMessage('تم حذف نوع الوثيقة بنجاح')
      fetchItems()
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Jump to Sequence Configuration Screen («تسلسلات العمليات»)
  const handleGoToSequenceConfig = (docTypeKey: string) => {
    // Store requested doc type filter in memory/localStorage for transaction-sequences module
    try {
      localStorage.setItem('selectedSequenceDocType', docTypeKey)
    } catch (_) { }
    setActiveModule('transaction-sequences')
  }

  // Print Table
  const handlePrint = () => {
    window.print()
  }

  // Export CSV
  const handleExportCSV = () => {
    if (items.length === 0) return
    const headers = [
      'الرقم',
      'الاسم',
      'الاسم الأجنبي',
      'الوحدة/النظام',
      'نوع الوثيقة الرئيسي',
      'الحالة',
      'الأثر المالي',
      'الأثر المخزني',
      'الاعتماد',
    ]
    const rows = items.map((i) => [
      `"${i.code}"`,
      `"${i.nameAr}"`,
      `"${i.nameEn || ''}"`,
      `"${MODULE_LABELS[i.moduleCode]?.ar || i.moduleCode}"`,
      `"${MAIN_TYPE_LABELS[i.mainDocType] || i.mainDocType}"`,
      `"${i.active ? 'فعال' : 'غير فعال'}"`,
      `"${i.affectsFinancial ? 'نعم' : 'لا'}"`,
      `"${i.affectsInventory ? 'نعم' : 'لا'}"`,
      `"${i.requiresApproval ? 'نعم' : 'لا'}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sequence_doc_types_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-4" dir="rtl">
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 space-x-reverse text-sm">
          <span className="text-slate-500">الرئيسية</span>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">أنواع وثائق التسلسل</span>
          <span className="text-slate-400">/</span>
          <span className="text-blue-600 dark:text-blue-400 font-medium">الكل</span>
        </div>

        <div className="flex items-center gap-2">
          {items.length === 0 && !loading && (
            <button
              onClick={handleInitializeCatalog}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-md shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              تهيئة الكتالوج القياسي (58 وثيقة)
            </button>
          )}

          <button
            onClick={() => setActiveModule('transaction-sequences')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
            الانتقال إلى تسلسلات العمليات
          </button>
        </div>
      </div>

      {/* ── Notifications / Alerts ────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-3 text-sm bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between p-3 text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Drag Column Header Zone (Matching Screenshot 1 & 2) ────────── */}
      <div className="bg-slate-100/80 dark:bg-slate-900/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>اسحب العمود هنا للتجميع الخاص به</span>
        <span className="text-[11px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
          إجمالي الوثائق المسجلة: {totalItems}
        </span>
      </div>

      {/* ── Toolbar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Actions Group */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            إضافة جديد
          </button>

          <button
            onClick={() => {
              if (selectedDocId) {
                const doc = items.find((i) => i.id === selectedDocId)
                if (doc) handleOpenEdit(doc)
              }
            }}
            disabled={!selectedDocId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40 transition"
          >
            <Edit2 className="w-3.5 h-3.5 text-amber-600" />
            تعديل
          </button>

          <button
            onClick={() => {
              if (selectedDocId) {
                const doc = items.find((i) => i.id === selectedDocId)
                if (doc) setViewDetailDoc(doc)
              }
            }}
            disabled={!selectedDocId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40 transition"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            عرض
          </button>

          <button
            onClick={() => {
              if (selectedDocId) {
                const doc = items.find((i) => i.id === selectedDocId)
                if (doc) handleToggleStatus(doc)
              }
            }}
            disabled={!selectedDocId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            تفعيل / تعطيل
          </button>

          <button
            onClick={() => {
              if (selectedDocId) {
                const doc = items.find((i) => i.id === selectedDocId)
                if (doc) handleDelete(doc)
              }
            }}
            disabled={!selectedDocId}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 disabled:opacity-40 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            حذف
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition"
            title="طباعة"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCSV}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition"
            title="تصدير CSV"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={fetchItems}
            className="p-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Column Visibility Menu */}
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-md border border-slate-300 dark:border-slate-700 transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              أعمدة
            </button>
            {showColumnMenu && (
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-30 p-2 text-xs">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-2 pb-1 border-b">
                  إظهار الأعمدة
                </div>
                {Object.entries({
                  code: 'الرقم',
                  nameAr: 'الاسم',
                  nameEn: 'الاسم الأجنبي',
                  moduleCode: 'النظام/الوحدة',
                  mainDocType: 'التصنيف',
                  active: 'الحالة',
                  affectsFinancial: 'الأثر المالي',
                  affectsInventory: 'الأثر المخزني',
                  requiresApproval: 'الاعتماد',
                  createdAt: 'تاريخ الإدخال',
                  updatedAt: 'آخر تعديل',
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 py-1 px-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key]}
                      onChange={(e) =>
                        setVisibleColumns((prev) => ({ ...prev, [key]: e.target.checked }))
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Filter & Search Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Module Filter */}
          <select
            value={selectedModule}
            onChange={(e) => {
              setSelectedModule(e.target.value)
              setPage(1)
            }}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع الأنظمة / الوحدات</option>
            {Object.entries(MODULE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v.ar}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setPage(1)
            }}
            className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">جميع الحالات</option>
            <option value="active">فعال فقط</option>
            <option value="inactive">غير فعال</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="بحث بالرقم أو الاسم..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              className="text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-44 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* ── Main DataGrid (Matching Screenshot 1 & 2) ────────────────── */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold select-none">
                <th className="py-2.5 px-3 w-10 text-center">#</th>
                {visibleColumns.code && <th className="py-2.5 px-3 w-16 text-center">الرقم</th>}
                {visibleColumns.nameAr && <th className="py-2.5 px-4 min-w-[180px]">الاسم</th>}
                {visibleColumns.nameEn && <th className="py-2.5 px-4 min-w-[160px]">الاسم الأجنبي</th>}
                {visibleColumns.moduleCode && <th className="py-2.5 px-3">النظام / الوحدة</th>}
                {visibleColumns.mainDocType && <th className="py-2.5 px-3">التصنيف الرئيسي</th>}
                {visibleColumns.active && <th className="py-2.5 px-3 text-center">الحالة</th>}
                {visibleColumns.affectsFinancial && <th className="py-2.5 px-3 text-center">الأثر المالي</th>}
                {visibleColumns.affectsInventory && <th className="py-2.5 px-3 text-center">الأثر المخزني</th>}
                {visibleColumns.requiresApproval && <th className="py-2.5 px-3 text-center">اعتماد</th>}
                {visibleColumns.createdById && <th className="py-2.5 px-3 text-center">مدخل البيانات</th>}
                {visibleColumns.createdAt && <th className="py-2.5 px-3">تاريخ الإدخال</th>}
                {visibleColumns.updatedAt && <th className="py-2.5 px-3">تاريخ آخر تعديل</th>}
                {visibleColumns.actions && <th className="py-2.5 px-4 text-center w-36">الإجراءات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    جاري تحميل أنواع وثائق التسلسل...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-slate-500">
                    لا توجد أنواع وثائق مسجلة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                items.map((doc, idx) => {
                  const isSelected = selectedDocId === doc.id
                  const mod = MODULE_LABELS[doc.moduleCode] || { ar: doc.moduleCode, color: 'bg-slate-100 text-slate-700' }

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      onDoubleClick={() => handleOpenEdit(doc)}
                      className={`hover:bg-blue-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition ${isSelected ? 'bg-blue-50/80 dark:bg-blue-950/40 font-medium' : ''
                        }`}
                    >
                      <td className="py-2 px-3 text-center text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>

                      {visibleColumns.code && (
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                          {doc.code}
                        </td>
                      )}

                      {visibleColumns.nameAr && (
                        <td className="py-2 px-4 font-semibold text-slate-900 dark:text-slate-100">
                          {doc.nameAr}
                        </td>
                      )}

                      {visibleColumns.nameEn && (
                        <td className="py-2 px-4 text-slate-600 dark:text-slate-400 font-sans">
                          {doc.nameEn || '—'}
                        </td>
                      )}

                      {visibleColumns.moduleCode && (
                        <td className="py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full border ${mod.color}`}
                          >
                            {mod.ar}
                          </span>
                        </td>
                      )}

                      {visibleColumns.mainDocType && (
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">
                          {MAIN_TYPE_LABELS[doc.mainDocType] || doc.mainDocType}
                        </td>
                      )}

                      {visibleColumns.active && (
                        <td className="py-2 px-3 text-center">
                          {doc.active ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              فعال
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                              <XCircle className="w-3 h-3" />
                              معطل
                            </span>
                          )}
                        </td>
                      )}

                      {visibleColumns.affectsFinancial && (
                        <td className="py-2 px-3 text-center">
                          {doc.affectsFinancial ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.affectsInventory && (
                        <td className="py-2 px-3 text-center">
                          {doc.affectsInventory ? (
                            <span className="text-blue-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.requiresApproval && (
                        <td className="py-2 px-3 text-center">
                          {doc.requiresApproval ? (
                            <span className="text-amber-600 font-bold">✓</span>
                          ) : (
                            <span className="text-slate-300">✕</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.createdById && (
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                          {doc.createdById ? '1' : 'النظام'}
                        </td>
                      )}

                      {visibleColumns.createdAt && (
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {new Date(doc.createdAt).toLocaleDateString('ar-SA')}
                        </td>
                      )}

                      {visibleColumns.updatedAt && (
                        <td className="py-2 px-3 text-slate-500 text-[11px]">
                          {new Date(doc.updatedAt).toLocaleDateString('ar-SA')}
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="py-2 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleGoToSequenceConfig(doc.docTypeKey)
                              }}
                              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 rounded"
                              title="الانتقال لإعداد التسلسل والعداد"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenEdit(doc)
                              }}
                              className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-600 rounded"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setViewDetailDoc(doc)
                              }}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 rounded"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(doc)
                              }}
                              className={`p-1 rounded ${doc.active
                                  ? 'hover:bg-slate-200 text-slate-600'
                                  : 'hover:bg-emerald-100 text-emerald-600'
                                }`}
                              title={doc.active ? 'تعطيل' : 'تفعيل'}
                            >
                              {doc.active ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Bar (Matching Screenshot 1 & 2) ────────────────── */}
        <div className="bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400">
          <div>
            {totalItems > 0 ? (
              <span>
                {page} من {Math.ceil(totalItems / pageSize)} صفحة العناصر {totalItems}
              </span>
            ) : (
              <span>0 عناصر</span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>العناصر في كل صفحة:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs font-semibold focus:outline-none"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="الأولى"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="السابقة"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 bg-blue-600 text-white font-bold rounded text-xs">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => (p * pageSize < totalItems ? p + 1 : p))}
                disabled={page * pageSize >= totalItems}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="التالية"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage(Math.ceil(totalItems / pageSize))}
                disabled={page * pageSize >= totalItems}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30"
                title="الأخيرة"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dialog Matching Screenshot 3 (Add / Edit Form) ─────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Top Navigation & Breadcrumb in Dialog */}
            <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="w-4 h-4" />
                <span>الرئيسية</span>
                <span>/</span>
                <span>أنواع وثائق التسلسل</span>
                <span>/</span>
                <span>{formMode === 'create' ? 'إضافة جديد' : 'تعديل السجل'}</span>
              </div>

              {/* Record Navigator Bar `< < 58 [ 1 ] > >` */}
              <div className="flex items-center gap-1 bg-blue-700/60 px-2 py-1 rounded">
                <button
                  type="button"
                  onClick={() => handleNavigateDialog('first')}
                  className="hover:bg-blue-500 p-0.5 rounded"
                  title="أول سجل"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateDialog('prev')}
                  className="hover:bg-blue-500 p-0.5 rounded"
                  title="السابق"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono px-1.5 font-bold">
                  {formNavIndex + 1} / {items.length || 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleNavigateDialog('next')}
                  className="hover:bg-blue-500 p-0.5 rounded"
                  title="التالي"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigateDialog('last')}
                  className="hover:bg-blue-500 p-0.5 rounded"
                  title="آخر سجل"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded hover:bg-blue-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields matching Screenshot 3 */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Row 1: Code and Name */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    الرقم <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => {
                      setFormData({ ...formData, code: e.target.value })
                      if (formErrors.code) setFormErrors({ ...formErrors, code: undefined })
                    }}
                    className={`w-full font-mono font-bold bg-slate-50 dark:bg-slate-800 border rounded-md px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${formErrors.code
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                      }`}
                    placeholder="3772"
                  />
                  {formErrors.code && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {formErrors.code}
                    </span>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    الاسم <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => {
                        setFormData({ ...formData, nameAr: e.target.value })
                        if (formErrors.nameAr) setFormErrors({ ...formErrors, nameAr: undefined })
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-md px-3 py-2 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 ${formErrors.nameAr
                          ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/30'
                          : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                        }`}
                      placeholder="اسم نوع الوثيقة بالعربية..."
                    />
                    {/* Validation tooltip matching Screenshot 3 red banner */}
                    {formErrors.nameAr && (
                      <div className="absolute -bottom-6 right-2 bg-rose-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow z-10">
                        هذا الحقل إجباري
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 2: English Name and System Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    الاسم اللاتيني / الإنجليزي
                  </label>
                  <input
                    type="text"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-100 font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Document Name in English..."
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    المفتاح البرمجي الثابت (docTypeKey) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.docTypeKey}
                    disabled={formMode === 'edit' && formData.id !== ''}
                    onChange={(e) => {
                      setFormData({ ...formData, docTypeKey: e.target.value })
                      if (formErrors.docTypeKey) setFormErrors({ ...formErrors, docTypeKey: undefined })
                    }}
                    className={`w-full font-mono bg-slate-50 dark:bg-slate-800 border rounded-md px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 ${formErrors.docTypeKey
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
                      } ${formMode === 'edit' ? 'opacity-70 cursor-not-allowed bg-slate-200 dark:bg-slate-800' : ''}`}
                    placeholder="e.g. sales_invoice"
                  />
                  {formMode === 'edit' && (
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      الهوية التقنية ثابتة ومحمية من التعديل بعد الإنشاء
                    </span>
                  )}
                  {formErrors.docTypeKey && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      {formErrors.docTypeKey}
                    </span>
                  )}
                </div>
              </div>

              {/* Row 3: Module / System & Main Document Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    النظام / الوحدة
                  </label>
                  <select
                    value={formData.moduleCode}
                    onChange={(e) => setFormData({ ...formData, moduleCode: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(MODULE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.ar} ({k})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    نوع الوثيقة الرئيسي
                  </label>
                  <select
                    value={formData.mainDocType}
                    onChange={(e) => setFormData({ ...formData, mainDocType: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(MAIN_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Capability Indicators (Operational Metadata) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  المحددات والمؤشرات التشغيلية (Metadata Capabilities):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.affectsFinancial}
                      onChange={(e) => setFormData({ ...formData, affectsFinancial: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">أثر مالي ومحاسبي</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.affectsInventory}
                      onChange={(e) => setFormData({ ...formData, affectsInventory: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">أثر مخزني</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresApproval}
                      onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">يتطلب اعتماد</span>
                  </label>
                </div>
              </div>

              {/* Row 5: Notes */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  ملاحظات
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="أي ملاحظات أو قيود إدارية حول نوع الوثيقة..."
                />
              </div>

              {/* Direct Bridge to Sequence Definition Screen */}
              {formMode === 'edit' && (
                <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                  <div className="text-xs text-blue-900 dark:text-blue-300">
                    <span className="font-bold">قواعد الترقيم والعداد (HOW):</span> تدار البادئة، الطول، العداد الحالي، وسياسة التصفير في شاشة تسلسلات العمليات.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsFormOpen(false)
                      handleGoToSequenceConfig(formData.docTypeKey)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold whitespace-nowrap transition"
                  >
                    الانتقال لإعداد التسلسل
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Dialog Action Bar (matching Screenshot 3) */}
            <div className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveForm}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow transition"
                >
                  <Save className="w-4 h-4" />
                  حفظ البيانات
                </button>

                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition"
                  title="سجل جديد"
                >
                  <Plus className="w-4 h-4" />
                  جديد
                </button>

                {formMode === 'edit' && formData.id && (
                  <button
                    type="button"
                    onClick={() => {
                      const doc = items.find((i) => i.id === formData.id)
                      if (doc) handleDelete(doc)
                    }}
                    className="inline-flex items-center gap-1 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded transition"
                    title="حذف السجل"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View Detail Drawer / Modal ─────────────────────────────────── */}
      {viewDetailDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                تفاصيل نوع وثيقة التسلسل: {viewDetailDoc.nameAr}
              </h3>
              <button onClick={() => setViewDetailDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700 dark:text-slate-300">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">رمز نوع الوثيقة (Display Code):</span>
                <span className="font-bold text-sm">{viewDetailDoc.code}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">المعرف التقني (docTypeKey):</span>
                <span className="font-mono font-bold text-xs text-blue-600">{viewDetailDoc.docTypeKey}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">الاسم العربي:</span>
                <span className="font-semibold">{viewDetailDoc.nameAr}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">الاسم الإنجليزي:</span>
                <span>{viewDetailDoc.nameEn || '—'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">النظام / الوحدة:</span>
                <span className="font-semibold">{MODULE_LABELS[viewDetailDoc.moduleCode]?.ar || viewDetailDoc.moduleCode}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">التصنيف الرئيسي:</span>
                <span>{MAIN_TYPE_LABELS[viewDetailDoc.mainDocType] || viewDetailDoc.mainDocType}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">الأثر المالي:</span>
                <span>{viewDetailDoc.affectsFinancial ? 'نعم (يخضع لمحرك الترحيل)' : 'لا'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded">
                <span className="text-slate-400 block text-[11px]">الأثر المخزني:</span>
                <span>{viewDetailDoc.affectsInventory ? 'نعم (حركة مخزنية)' : 'لا'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <button
                onClick={() => {
                  const key = viewDetailDoc.docTypeKey
                  setViewDetailDoc(null)
                  handleGoToSequenceConfig(key)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                الانتقال لإعداد التسلسل في تسلسلات العمليات
              </button>

              <button
                onClick={() => setViewDetailDoc(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs font-medium"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
