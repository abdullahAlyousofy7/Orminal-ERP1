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
  Lock,
  FileSpreadsheet,
  Columns,
  RotateCw,
} from 'lucide-react'
import { useNav } from '@/stores/nav-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/lib/i18n/use-t'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import { cn } from '@/lib/utils'

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
  const { isRTL } = useT()
  const isAr = isRTL

  const [items, setItems] = useState<SequenceDocType[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Modals & Selection
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const selectedDoc = useMemo(
    () => items.find((i) => i.id === selectedDocId) || null,
    [items, selectedDocId]
  )
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create')
  const [viewDetailDoc, setViewDetailDoc] = useState<SequenceDocType | null>(null)

  // Column Visibility (matching fiscal-periods-module.tsx)
  const DEFAULT_VISIBLE_COLUMNS = useMemo(
    () => ({
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
    }),
    []
  )
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLUMNS)

  // Column Resizing Controls (matching fiscal-periods-module.tsx)
  const DEFAULT_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      code: 80,
      nameAr: 190,
      nameEn: 160,
      moduleCode: 140,
      mainDocType: 140,
      active: 85,
      affectsFinancial: 90,
      affectsInventory: 90,
      requiresApproval: 85,
      createdById: 85,
      createdAt: 110,
      updatedAt: 110,
      actions: 120,
    }),
    []
  )
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)

  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 100

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = isAr ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

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

  // Export Handlers (matching fiscal-periods-module.tsx)
  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }
    const headers = [
      isAr ? 'الرقم' : 'Code',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'الاسم الأجنبي' : 'English Name',
      isAr ? 'الوحدة/النظام' : 'Module',
      isAr ? 'نوع الوثيقة الرئيسي' : 'Main Doc Type',
      isAr ? 'الحالة' : 'Status',
      isAr ? 'الأثر المالي' : 'Financial Impact',
      isAr ? 'الأثر المخزني' : 'Inventory Impact',
      isAr ? 'الاعتماد' : 'Requires Approval',
    ]
    const rows = items.map((i) => [
      `"${i.code}"`,
      `"${i.nameAr}"`,
      `"${i.nameEn || ''}"`,
      `"${MODULE_LABELS[i.moduleCode]?.ar || i.moduleCode}"`,
      `"${MAIN_TYPE_LABELS[i.mainDocType] || i.mainDocType}"`,
      `"${i.active ? (isAr ? 'فعال' : 'Active') : (isAr ? 'معطل' : 'Inactive')}"`,
      `"${i.affectsFinancial ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}"`,
      `"${i.affectsInventory ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}"`,
      `"${i.requiresApproval ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `sequence_doc_types_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    toast.success(isAr ? 'تم تصدير البيانات إلى CSV بنجاح' : 'Exported to CSV successfully')
  }

  const handleExportExcel = () => {
    handleExportCSV()
  }

  const handleExportWord = () => {
    if (!items.length) {
      toast.error(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }
    const title = isAr ? 'تقرير أنواع وثائق التسلسل' : 'Sequence Document Types Report'
    const headers = [
      isAr ? 'الرقم' : 'Code',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'الاسم الأجنبي' : 'English Name',
      isAr ? 'الوحدة / النظام' : 'Module',
      isAr ? 'التصنيف' : 'Type',
      isAr ? 'الحالة' : 'Status',
    ]

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'}; padding: 25px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 5px; font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          p.subtitle { text-align: center; color: #64748b; margin-bottom: 25px; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; direction: ${isAr ? 'rtl' : 'ltr'}; }
          th { background-color: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; padding: 8px 10px; font-size: 13px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body dir='${isAr ? 'rtl' : 'ltr'}'>
        <h1>${title}</h1>
        <p class="subtitle">${isAr ? 'تاريخ التصدير:' : 'Export Date:'} ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} | ${isAr ? 'إجمالي السجلات:' : 'Total Records:'} ${items.length}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${items
              .map(
                (it) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${it.code}</td>
                <td>${it.nameAr}</td>
                <td>${it.nameEn || '—'}</td>
                <td>${MODULE_LABELS[it.moduleCode]?.ar || it.moduleCode}</td>
                <td>${MAIN_TYPE_LABELS[it.mainDocType] || it.mainDocType}</td>
                <td>${it.active ? (isAr ? 'فعال' : 'Active') : (isAr ? 'معطل' : 'Inactive')}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">${isAr ? 'تم التصدير تلقائياً بواسطة نظام أورمينال ERP' : 'Exported automatically by Orminal ERP'}</div>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + docHtml], { type: 'application/msword;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `sequence_doc_types_${new Date().toISOString().slice(0, 10)}.doc`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isAr ? 'تم تصدير البيانات إلى Word بنجاح' : 'Exported to Word successfully')
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 p-4 space-y-4" dir="rtl">
      {/* ── Breadcrumb & Top Bar ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-2 space-x-reverse text-sm">

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
          <span className="text-[11px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
            إجمالي الوثائق المسجلة: {items.length}
          </span>

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

      {/* ── Main DataGrid Card (Matching fiscal-periods-module.tsx Standard) ── */}
      <Card className="border border-border shadow-xs rounded-lg overflow-hidden bg-card flex-1 flex flex-col">
        {/* ACTION TOOLBAR (Matching fiscal-periods-module.tsx) */}
        <div className="p-2 sm:p-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
          {/* Search, Columns, Status Filter & Module Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Row 1 on mobile: Columns Dropdown + Search Box */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {/* Columns Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs bg-background shrink-0">
                    <span>{isAr ? 'أعمدة' : 'Columns'}</span>
                    <ChevronLeft className="size-3 -rotate-90 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-52 max-h-80 overflow-y-auto">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.code}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, code: !!v }))}
                  >
                    {isAr ? 'الرقم' : 'Code'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.nameAr}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, nameAr: !!v }))}
                  >
                    {isAr ? 'الاسم العربي' : 'Arabic Name'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.nameEn}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, nameEn: !!v }))}
                  >
                    {isAr ? 'الاسم الأجنبي' : 'English Name'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.moduleCode}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, moduleCode: !!v }))}
                  >
                    {isAr ? 'النظام / الوحدة' : 'Module'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.mainDocType}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, mainDocType: !!v }))}
                  >
                    {isAr ? 'التصنيف الرئيسي' : 'Main Doc Type'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.active}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, active: !!v }))}
                  >
                    {isAr ? 'الحالة (فعال)' : 'Active'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.affectsFinancial}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, affectsFinancial: !!v }))}
                  >
                    {isAr ? 'الأثر المالي' : 'Financial Impact'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.affectsInventory}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, affectsInventory: !!v }))}
                  >
                    {isAr ? 'الأثر المخزني' : 'Inventory Impact'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.requiresApproval}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, requiresApproval: !!v }))}
                  >
                    {isAr ? 'طلب الاعتماد' : 'Requires Approval'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.createdById}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, createdById: !!v }))}
                  >
                    {isAr ? 'مدخل البيانات' : 'Created By'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.createdAt}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, createdAt: !!v }))}
                  >
                    {isAr ? 'تاريخ الإدخال' : 'Created At'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.updatedAt}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, updatedAt: !!v }))}
                  >
                    {isAr ? 'تاريخ آخر تعديل' : 'Updated At'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, actions: !!v }))}
                  >
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => {
                      setVisibleColumns(DEFAULT_VISIBLE_COLUMNS)
                      toast.success(isAr ? 'تمت استعادة إعدادات الأعمدة الافتراضية' : 'Columns reset to default')
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer justify-center py-1.5"
                  >
                    {isAr ? 'إعادة ضبط الأعمدة الافتراضية' : 'Reset Default Columns'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-56 min-w-0">
                <Search className={cn('size-3.5 absolute top-2.5 text-muted-foreground pointer-events-none', isAr ? 'right-2.5' : 'left-2.5')} />
                <Input
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setPage(1)
                  }}
                  placeholder={isAr ? 'بحث بالرقم، الاسم، الكود...' : 'Search by code, name...'}
                  className={cn('h-8 text-xs bg-background w-full', isAr ? 'pr-7 pl-6' : 'pl-7 pr-6')}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('')
                      setPage(1)
                    }}
                    className={cn('absolute top-2 text-muted-foreground hover:text-foreground cursor-pointer', isAr ? 'left-2' : 'right-2')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2 on mobile: Status Filter Pills + Module Dropdown */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('')
                    setPage(1)
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer",
                    selectedStatus === ''
                      ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('active')
                    setPage(1)
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                    selectedStatus === 'active'
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-emerald-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {isAr ? 'الفعال فقط' : 'Active Only'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus('inactive')
                    setPage(1)
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                    selectedStatus === 'inactive'
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-rose-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  {isAr ? 'معطل' : 'Inactive'}
                </button>
              </div>

              {/* Module Filter Dropdown */}
              <Select
                value={selectedModule || 'ALL'}
                onValueChange={(val) => {
                  setSelectedModule(val === 'ALL' ? '' : val)
                  setPage(1)
                }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <SelectTrigger className="h-8 min-w-[130px] max-w-[170px] text-xs bg-background shrink-0" dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={isAr ? 'جميع الوحدات' : 'All Modules'} />
                </SelectTrigger>
                <SelectContent dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectItem value="ALL">{isAr ? 'جميع الأنظمة / الوحدات' : 'All Modules'}</SelectItem>
                  {Object.entries(MODULE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>
                      {v.ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 on mobile (Right Group on Desktop): Action Tools & Add Sequence Doc Type Button */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full lg:w-auto pt-1 sm:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
            {/* Action Tool Icons */}
            <div className="flex items-center gap-1 mx-1">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    title={isAr ? 'خيارات التصدير (Excel, CSV, Word, PDF)' : 'Export Options (Excel, CSV, Word, PDF)'}
                  >
                    <FileSpreadsheet className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} sideOffset={6} className="w-36 shadow-xl border-slate-200 dark:border-slate-800 z-50">
                  <DropdownMenuItem onClick={handleExportExcel} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'Excel' : 'Excel'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Columns className="size-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'CSV' : 'CSV'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileText className="size-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'Word' : 'Word'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Printer className="size-4 text-red-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'PDF / طباعة' : 'PDF / Print'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Print */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer"
                onClick={handleExportPDF}
                title={isAr ? 'طباعة الجدول' : 'Print Table'}
              >
                <Printer className="size-4" />
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                onClick={fetchItems}
                title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RotateCw className={cn("size-4", loading && "animate-spin")} />
              </Button>

              {/* Active / Inactive status toggle for selected document */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedDoc}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedDoc
                    ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-slate-400 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedDoc) handleToggleStatus(selectedDoc)
                }}
                title={
                  selectedDoc
                    ? selectedDoc.active
                      ? isAr ? 'تعطيل نوع الوثيقة المحدد' : 'Deactivate selected'
                      : isAr ? 'تفعيل نوع الوثيقة المحدد' : 'Activate selected'
                    : isAr ? 'اختر وثيقة من الجدول لتغيير حالتها' : 'Select a document to toggle status'
                }
              >
                <Lock className="size-4" />
              </Button>

              {/* Edit selected document */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedDoc}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedDoc
                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-amber-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedDoc) handleOpenEdit(selectedDoc)
                }}
                title={
                  selectedDoc
                    ? isAr ? 'تعديل نوع الوثيقة المحدد' : 'Edit selected'
                    : isAr ? 'اختر وثيقة من الجدول للتعديل' : 'Select a document to edit'
                }
              >
                <Edit2 className="size-4" />
              </Button>

              {/* View details of selected document */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedDoc}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedDoc
                    ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-blue-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedDoc) setViewDetailDoc(selectedDoc)
                }}
                title={
                  selectedDoc
                    ? isAr ? 'عرض تفاصيل نوع الوثيقة' : 'View details'
                    : isAr ? 'اختر وثيقة من الجدول لعرض تفاصيلها' : 'Select a document to view'
                }
              >
                <Eye className="size-4" />
              </Button>

              {/* Jump to Sequence setup */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedDoc}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedDoc
                    ? "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-indigo-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedDoc) handleGoToSequenceConfig(selectedDoc.docTypeKey)
                }}
                title={
                  selectedDoc
                    ? isAr ? 'الانتقال لإعداد التسلسل والعداد' : 'Go to Sequence Setup'
                    : isAr ? 'اختر وثيقة للانتقال لإعداد تسلسلها' : 'Select a document to setup sequence'
                }
              >
                <ExternalLink className="size-4" />
              </Button>

              {/* Delete selected document */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedDoc}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedDoc
                    ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-rose-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedDoc) handleDelete(selectedDoc)
                }}
                title={
                  selectedDoc
                    ? isAr ? 'حذف نوع الوثيقة المحدد' : 'Delete selected'
                    : isAr ? 'اختر وثيقة من الجدول للحذف' : 'Select a document to delete'
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Add Sequence Doc Type Button */}
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 px-3 shadow-xs font-bold shrink-0"
            >
              <Plus className="size-3.5" />
              <span>{isAr ? 'إضافة جديد' : 'Add New'}</span>
            </Button>
          </div>
        </div>

        {/* MAIN GRID TABLE WITH HORIZONTAL SCROLLBAR */}
        <div className="overflow-x-auto min-h-[380px] w-full flex-1 scrollbar-thin">
          <Table className="min-w-[1320px] border-collapse text-[11px] table-fixed w-full">
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
              <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                <TableHead style={{ width: '45px', minWidth: '45px', maxWidth: '45px' }} className="font-bold py-1.5 px-1 text-center whitespace-nowrap select-none border-r border-slate-200 dark:border-slate-800">
                  #
                </TableHead>

                {visibleColumns.code && (
                  <TableHead
                    style={{
                      width: `${colWidths.code || 80}px`,
                      minWidth: `${colWidths.code || 80}px`,
                      maxWidth: `${colWidths.code || 80}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الرقم' : 'Code'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('code', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, code: DEFAULT_COL_WIDTHS.code }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.nameAr && (
                  <TableHead
                    style={{
                      width: `${colWidths.nameAr || 190}px`,
                      minWidth: `${colWidths.nameAr || 190}px`,
                      maxWidth: `${colWidths.nameAr || 190}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الاسم العربي' : 'Arabic Name'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('nameAr', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, nameAr: DEFAULT_COL_WIDTHS.nameAr }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.nameEn && (
                  <TableHead
                    style={{
                      width: `${colWidths.nameEn || 160}px`,
                      minWidth: `${colWidths.nameEn || 160}px`,
                      maxWidth: `${colWidths.nameEn || 160}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الاسم الأجنبي' : 'English Name'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('nameEn', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, nameEn: DEFAULT_COL_WIDTHS.nameEn }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.moduleCode && (
                  <TableHead
                    style={{
                      width: `${colWidths.moduleCode || 140}px`,
                      minWidth: `${colWidths.moduleCode || 140}px`,
                      maxWidth: `${colWidths.moduleCode || 140}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'النظام / الوحدة' : 'Module'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('moduleCode', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, moduleCode: DEFAULT_COL_WIDTHS.moduleCode }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.mainDocType && (
                  <TableHead
                    style={{
                      width: `${colWidths.mainDocType || 140}px`,
                      minWidth: `${colWidths.mainDocType || 140}px`,
                      maxWidth: `${colWidths.mainDocType || 140}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'التصنيف الرئيسي' : 'Main Doc Type'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('mainDocType', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, mainDocType: DEFAULT_COL_WIDTHS.mainDocType }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.active && (
                  <TableHead
                    style={{
                      width: `${colWidths.active || 85}px`,
                      minWidth: `${colWidths.active || 85}px`,
                      maxWidth: `${colWidths.active || 85}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الحالة' : 'Status'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('active', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, active: DEFAULT_COL_WIDTHS.active }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.affectsFinancial && (
                  <TableHead
                    style={{
                      width: `${colWidths.affectsFinancial || 90}px`,
                      minWidth: `${colWidths.affectsFinancial || 90}px`,
                      maxWidth: `${colWidths.affectsFinancial || 90}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الأثر المالي' : 'Financial'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('affectsFinancial', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, affectsFinancial: DEFAULT_COL_WIDTHS.affectsFinancial }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.affectsInventory && (
                  <TableHead
                    style={{
                      width: `${colWidths.affectsInventory || 90}px`,
                      minWidth: `${colWidths.affectsInventory || 90}px`,
                      maxWidth: `${colWidths.affectsInventory || 90}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الأثر المخزني' : 'Inventory'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('affectsInventory', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, affectsInventory: DEFAULT_COL_WIDTHS.affectsInventory }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.requiresApproval && (
                  <TableHead
                    style={{
                      width: `${colWidths.requiresApproval || 85}px`,
                      minWidth: `${colWidths.requiresApproval || 85}px`,
                      maxWidth: `${colWidths.requiresApproval || 85}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الاعتماد' : 'Approval'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('requiresApproval', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, requiresApproval: DEFAULT_COL_WIDTHS.requiresApproval }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.createdById && (
                  <TableHead
                    style={{
                      width: `${colWidths.createdById || 85}px`,
                      minWidth: `${colWidths.createdById || 85}px`,
                      maxWidth: `${colWidths.createdById || 85}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'مدخل البيانات' : 'Created By'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('createdById', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, createdById: DEFAULT_COL_WIDTHS.createdById }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.createdAt && (
                  <TableHead
                    style={{
                      width: `${colWidths.createdAt || 110}px`,
                      minWidth: `${colWidths.createdAt || 110}px`,
                      maxWidth: `${colWidths.createdAt || 110}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{isAr ? 'تاريخ الإدخال' : 'Created At'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('createdAt', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, createdAt: DEFAULT_COL_WIDTHS.createdAt }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.updatedAt && (
                  <TableHead
                    style={{
                      width: `${colWidths.updatedAt || 110}px`,
                      minWidth: `${colWidths.updatedAt || 110}px`,
                      maxWidth: `${colWidths.updatedAt || 110}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>{isAr ? 'آخر تعديل' : 'Updated At'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('updatedAt', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, updatedAt: DEFAULT_COL_WIDTHS.updatedAt }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleColumns.actions && (
                  <TableHead
                    style={{
                      width: `${colWidths.actions || 120}px`,
                      minWidth: `${colWidths.actions || 120}px`,
                      maxWidth: `${colWidths.actions || 120}px`,
                    }}
                    className="font-bold py-1.5 px-2 text-center whitespace-nowrap select-none"
                  >
                    <span>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && items.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-8 border-b border-slate-200 dark:border-slate-700">
                    <TableCell className="py-1 px-1 border-r border-slate-100 dark:border-slate-800 text-center">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
                    {Array.from({ length: Object.values(visibleColumns).filter(Boolean).length }).map((_, j) => (
                      <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="text-center text-muted-foreground py-12">
                    <Layers className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">{isAr ? 'لا توجد أنواع وثائق مسجلة مطابقة للبحث' : 'No sequence document types found'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'يمكنك الضغط على "تهيئة الكتالوج القياسي" لإضافة الوثائق الافتراضية سريعاً' : 'Click "Initialize Standard Catalog" to load defaults quickly'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((doc, idx) => {
                  const isSelected = selectedDocId === doc.id
                  const mod = MODULE_LABELS[doc.moduleCode] || { ar: doc.moduleCode, color: 'bg-slate-100 text-slate-700 border-slate-200' }

                  return (
                    <TableRow
                      key={doc.id}
                      data-selected={isSelected || undefined}
                      onClick={() => setSelectedDocId(doc.id)}
                      onDoubleClick={() => handleOpenEdit(doc)}
                      className={cn(
                        "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                        isSelected
                          ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                          : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60",
                        !doc.active && !isSelected && "opacity-75 bg-slate-50/50 dark:bg-slate-900/40"
                      )}
                      style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                    >
                      <TableCell className="py-1 px-1 text-center font-mono font-bold text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>

                      {visibleColumns.code && (
                        <TableCell
                          style={{
                            width: `${colWidths.code || 80}px`,
                            minWidth: `${colWidths.code || 80}px`,
                            maxWidth: `${colWidths.code || 80}px`,
                          }}
                          className="font-bold text-primary font-mono text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={doc.code}>
                            {doc.code}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.nameAr && (
                        <TableCell
                          style={{
                            width: `${colWidths.nameAr || 190}px`,
                            minWidth: `${colWidths.nameAr || 190}px`,
                            maxWidth: `${colWidths.nameAr || 190}px`,
                          }}
                          className="font-semibold text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={doc.nameAr}>
                            {doc.nameAr}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.nameEn && (
                        <TableCell
                          style={{
                            width: `${colWidths.nameEn || 160}px`,
                            minWidth: `${colWidths.nameEn || 160}px`,
                            maxWidth: `${colWidths.nameEn || 160}px`,
                          }}
                          className="text-slate-600 dark:text-slate-400 font-sans border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={doc.nameEn || '—'}>
                            {doc.nameEn || '—'}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.moduleCode && (
                        <TableCell
                          style={{
                            width: `${colWidths.moduleCode || 140}px`,
                            minWidth: `${colWidths.moduleCode || 140}px`,
                            maxWidth: `${colWidths.moduleCode || 140}px`,
                          }}
                          className="border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border truncate max-w-full",
                              mod.color
                            )}
                            title={mod.ar}
                          >
                            {mod.ar}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.mainDocType && (
                        <TableCell
                          style={{
                            width: `${colWidths.mainDocType || 140}px`,
                            minWidth: `${colWidths.mainDocType || 140}px`,
                            maxWidth: `${colWidths.mainDocType || 140}px`,
                          }}
                          className="text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={MAIN_TYPE_LABELS[doc.mainDocType] || doc.mainDocType}>
                            {MAIN_TYPE_LABELS[doc.mainDocType] || doc.mainDocType}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.active && (
                        <TableCell
                          style={{
                            width: `${colWidths.active || 85}px`,
                            minWidth: `${colWidths.active || 85}px`,
                            maxWidth: `${colWidths.active || 85}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(doc)
                              }}
                              className="cursor-pointer focus:outline-none"
                              title={doc.active ? (isAr ? 'انقر للتعطيل' : 'Click to deactivate') : (isAr ? 'انقر للتفعيل' : 'Click to activate')}
                            >
                              {doc.active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {isAr ? 'فعال' : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors">
                                  <span className="size-1.5 rounded-full bg-slate-400" />
                                  {isAr ? 'معطل' : 'Inactive'}
                                </span>
                              )}
                            </button>
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.affectsFinancial && (
                        <TableCell
                          style={{
                            width: `${colWidths.affectsFinancial || 90}px`,
                            minWidth: `${colWidths.affectsFinancial || 90}px`,
                            maxWidth: `${colWidths.affectsFinancial || 90}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            {doc.affectsFinancial ? (
                              <span className="inline-flex items-center justify-center size-4 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.affectsInventory && (
                        <TableCell
                          style={{
                            width: `${colWidths.affectsInventory || 90}px`,
                            minWidth: `${colWidths.affectsInventory || 90}px`,
                            maxWidth: `${colWidths.affectsInventory || 90}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            {doc.affectsInventory ? (
                              <span className="inline-flex items-center justify-center size-4 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 text-[10px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.requiresApproval && (
                        <TableCell
                          style={{
                            width: `${colWidths.requiresApproval || 85}px`,
                            minWidth: `${colWidths.requiresApproval || 85}px`,
                            maxWidth: `${colWidths.requiresApproval || 85}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            {doc.requiresApproval ? (
                              <span className="inline-flex items-center justify-center size-4 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 text-[10px] font-bold">
                                ✓
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleColumns.createdById && (
                        <TableCell
                          style={{
                            width: `${colWidths.createdById || 85}px`,
                            minWidth: `${colWidths.createdById || 85}px`,
                            maxWidth: `${colWidths.createdById || 85}px`,
                          }}
                          className="text-center text-slate-500 font-mono border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full">
                            {doc.createdById ? '1' : (isAr ? 'النظام' : 'System')}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.createdAt && (
                        <TableCell
                          style={{
                            width: `${colWidths.createdAt || 110}px`,
                            minWidth: `${colWidths.createdAt || 110}px`,
                            maxWidth: `${colWidths.createdAt || 110}px`,
                          }}
                          className="font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full" title={new Date(doc.createdAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}>
                            {new Date(doc.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.updatedAt && (
                        <TableCell
                          style={{
                            width: `${colWidths.updatedAt || 110}px`,
                            minWidth: `${colWidths.updatedAt || 110}px`,
                            maxWidth: `${colWidths.updatedAt || 110}px`,
                          }}
                          className="font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full" title={new Date(doc.updatedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}>
                            {new Date(doc.updatedAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </span>
                        </TableCell>
                      )}

                      {visibleColumns.actions && (
                        <TableCell
                          style={{
                            width: `${colWidths.actions || 120}px`,
                            minWidth: `${colWidths.actions || 120}px`,
                            maxWidth: `${colWidths.actions || 120}px`,
                          }}
                          className="py-1 px-2 overflow-hidden text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                              onClick={() => handleGoToSequenceConfig(doc.docTypeKey)}
                              title={isAr ? 'الانتقال لإعداد التسلسل والعداد' : 'Go to Sequence Setup'}
                            >
                              <ExternalLink className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                              onClick={() => handleOpenEdit(doc)}
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Edit2 className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              onClick={() => setViewDetailDoc(doc)}
                              title={isAr ? 'عرض التفاصيل' : 'View Details'}
                            >
                              <Eye className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              onClick={() => handleDelete(doc)}
                              title={isAr ? 'حذف' : 'Delete'}
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION FOOTER (Exact replica of fiscal-periods-module.tsx) */}
        <div className="p-2.5 bg-slate-100/90 dark:bg-slate-900 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>
              {isAr
                ? `صفحة ${page} من ${Math.max(1, Math.ceil(totalItems / pageSize))} (إجمالي العناصر ${totalItems})`
                : `Page ${page} of ${Math.max(1, Math.ceil(totalItems / pageSize))} (${totalItems} items)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{isAr ? 'العناصر' : 'Items'}</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(val) => {
                  setPageSize(Number(val))
                  setPage(1)
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 dir-ltr">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة الأولى' : 'First Page'}
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <span className="h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md bg-blue-600 text-white font-mono font-bold text-xs">
                {page}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(Math.max(1, Math.ceil(totalItems / pageSize)), p + 1))}
                disabled={page >= Math.max(1, Math.ceil(totalItems / pageSize))}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة التالية' : 'Next Page'}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, Math.ceil(totalItems / pageSize)))}
                disabled={page >= Math.max(1, Math.ceil(totalItems / pageSize))}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة الأخيرة' : 'Last Page'}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Dialog Matching Screenshot 3 (Add / Edit Form) ─────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Top Navigation & Breadcrumb in Dialog */}
            <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold">
                <FileText className="w-4 h-4" />
                <span>{formMode === 'create' ? 'إضافة جديد' : 'تعديل السجل'}</span>
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
