'use client'

// =============================================================================
// Enterprise ERP — Transaction Sequences Module (تسلسلات العمليات)
// Designed to match Screenshots 1, 2, 3, 4, 5 with full Arabic/English (RTL/LTR)
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  FileText,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  Edit2,
  Trash2,
  Eye,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  Building2,
  AlertTriangle,
  Lock,
  ArrowUpDown,
  MoreHorizontal,
  Columns,
  RotateCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useNav } from '@/stores/nav-store'
import { useT } from '@/lib/i18n/use-t'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import { cn } from '@/lib/utils'

interface SequenceDocType {
  id: string
  code: string
  docTypeKey: string
  nameAr: string
  nameEn?: string
  moduleCode: string
  mainDocType: string
  active: boolean
}

interface SequenceSegmentItem {
  id?: string
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

interface TransactionSequenceItem {
  id: string
  companyId: string
  sequenceDocTypeId: string
  sequenceNumber: number
  nameAr: string
  nameEn?: string | null
  dateDisplayMode: 'automatic' | 'manual'
  active: boolean
  initialValue: number
  numberLength: number
  prefix?: string | null
  suffix?: string | null
  resetPolicy: 'fiscal_year' | 'monthly' | 'never'
  branchScope: 'all' | 'single_branch'
  branchId?: string | null
  fiscalYearScope?: number | null
  isLocked: boolean
  version: number
  notes?: string | null
  entryStartDate: string
  createdById?: string | null
  createdAt: string
  updatedAt: string
  sequenceDocType: SequenceDocType
  segments: SequenceSegmentItem[]
  sequenceStates: Array<{
    id: string
    fiscalYear?: number | null
    lastNumber: number
    nextNumber: number
    branchId?: string | null
  }>
  totalIssued: number
  isUsed: boolean
}

export function TransactionSequencesModule() {
  const { setActiveModule } = useNav()
  const { isRTL } = useT()
  const isAr = isRTL

  // Selection state (matching fiscal-periods-module.tsx)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<TransactionSequenceItem | null>(null)

  // Module state
  const [items, setItems] = useState<TransactionSequenceItem[]>([])
  const selectedItem = useMemo(() => items.find((it) => it.id === selectedId) || null, [items, selectedId])
  const [docTypes, setDocTypes] = useState<SequenceDocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string>('ALL')
  const [groupBy, setGroupBy] = useState<string | null>(null)

  // Pagination (matching fiscal-periods-module.tsx)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)

  // View / Edit Mode: 'list' | 'create' | 'edit'
  const [viewMode, setViewMode] = useState<'list' | 'create' | 'edit'>('list')
  const [currentRecordIndex, setCurrentRecordIndex] = useState<number>(0)
  const [activeItem, setActiveItem] = useState<TransactionSequenceItem | null>(null)

  // Form State
  const [formData, setFormData] = useState<{
    sequenceDocTypeId: string
    sequenceNumber: number
    nameAr: string
    nameEn: string
    dateDisplayMode: 'automatic' | 'manual'
    active: boolean
    initialValue: number
    numberLength: number
    prefix: string
    suffix: string
    resetPolicy: 'fiscal_year' | 'monthly' | 'never'
    branchScope: 'all' | 'single_branch'
    branchId: string
    fiscalYearScope: string
    notes: string
    segments: SequenceSegmentItem[]
  }>({
    sequenceDocTypeId: '',
    sequenceNumber: 1,
    nameAr: '',
    nameEn: '',
    dateDisplayMode: 'automatic',
    active: true,
    initialValue: 1,
    numberLength: 6,
    prefix: '',
    suffix: '',
    resetPolicy: 'fiscal_year',
    branchScope: 'all',
    branchId: '',
    fiscalYearScope: '',
    notes: '',
    segments: [],
  })

  // Visible Columns toggler (matching fiscal-periods-module.tsx)
  const DEFAULT_VISIBLE_COLUMNS = useMemo(
    () => ({
      docTypeCode: true,
      nameAr: true,
      sequenceNumber: true,
      dateDisplayMode: true,
      active: true,
      initialValue: true,
      numberLength: true,
      createdById: true,
      entryStartDate: true,
      actions: true,
    }),
    []
  )
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLUMNS)

  // Column Resizing Controls (matching fiscal-periods-module.tsx)
  const DEFAULT_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      docTypeCode: 140,
      nameAr: 180,
      sequenceNumber: 85,
      dateDisplayMode: 120,
      active: 85,
      initialValue: 110,
      numberLength: 110,
      createdById: 100,
      entryStartDate: 150,
      actions: 110,
    }),
    []
  )
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)

  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 120

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = isAr ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(60, startWidth + deltaX)
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Export handlers (matching fiscal-periods-module.tsx)
  const handleExportCSV = () => {
    if (!items.length) {
      toast.error(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }
    exportToCSV(
      `transaction_sequences_${new Date().toISOString().slice(0, 10)}.csv`,
      items.map((it) => ({
        docTypeCode: it.sequenceDocType?.code || '',
        nameAr: it.nameAr,
        nameEn: it.nameEn || '',
        sequenceNumber: it.sequenceNumber,
        dateDisplayMode: it.dateDisplayMode === 'automatic' ? 'Auto' : 'Manual',
        active: it.active ? 'Active' : 'Inactive',
        initialValue: it.initialValue,
        numberLength: it.numberLength,
        createdById: it.createdById || '1',
        entryStartDate: it.entryStartDate || it.createdAt,
      })),
      [
        { key: 'docTypeCode', label: isAr ? 'نوع وثيقة التسلسل' : 'Doc Type Code' },
        { key: 'nameAr', label: isAr ? 'الاسم' : 'Name' },
        { key: 'nameEn', label: isAr ? 'الاسم الإنجليزي' : 'English Name' },
        { key: 'sequenceNumber', label: isAr ? 'التسلسل' : 'Sequence' },
        { key: 'dateDisplayMode', label: isAr ? 'طريقة عرض التاريخ' : 'Date Mode' },
        { key: 'active', label: isAr ? 'الحالة' : 'Status' },
        { key: 'initialValue', label: isAr ? 'القيمة الابتدائية' : 'Initial Value' },
        { key: 'numberLength', label: isAr ? 'طول الرقم' : 'Length' },
        { key: 'createdById', label: isAr ? 'مدخل البيانات' : 'Created By' },
        { key: 'entryStartDate', label: isAr ? 'تاريخ بدء الإدخال' : 'Start Date' },
      ]
    )
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
    const title = isAr ? 'تقرير تسلسلات العمليات' : 'Transaction Sequences Report'
    const headers = [
      isAr ? 'نوع الوثيقة' : 'Doc Type Code',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'التسلسل' : 'Seq',
      isAr ? 'طريقة التاريخ' : 'Date Mode',
      isAr ? 'الحالة' : 'Status',
      isAr ? 'القيمة الابتدائية' : 'Initial Val',
      isAr ? 'طول الرقم' : 'Length',
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
                (it: any) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${it.sequenceDocType?.code || '-'}</td>
                <td>${isAr ? it.nameAr : it.nameEn || it.nameAr}</td>
                <td>${it.sequenceNumber}</td>
                <td>${it.dateDisplayMode === 'automatic' ? (isAr ? 'آلي' : 'Auto') : (isAr ? 'يدوي' : 'Manual')}</td>
                <td>${it.active ? (isAr ? 'فعال' : 'Active') : (isAr ? 'معطل' : 'Inactive')}</td>
                <td>${it.initialValue}</td>
                <td>${it.numberLength || '-'}</td>
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
    link.setAttribute('download', `transaction_sequences_${new Date().toISOString().slice(0, 10)}.doc`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isAr ? 'تم تصدير البيانات إلى Word بنجاح' : 'Exported to Word successfully')
  }

  const handleExportPDF = () => {
    window.print()
  }

  // Fetch items & document catalog
  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Fetch doc types
      const docRes = await fetch('/api/erp/sequence-doc-types?pageSize=100')
      const docJson = await docRes.json()
      if (docRes.ok && docJson.data) {
        setDocTypes(Array.isArray(docJson.data) ? docJson.data : docJson.data.items || [])
      }

      // 2. Fetch sequences
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      })
      if (searchQuery) params.set('search', searchQuery)
      if (activeOnly) params.set('active', 'true')
      if (selectedModule !== 'ALL') params.set('moduleCode', selectedModule)

      const seqRes = await fetch(`/api/erp/transaction-sequences?${params.toString()}`)
      const seqJson = await seqRes.json()

      if (seqRes.ok && seqJson.data) {
        const rawItems = Array.isArray(seqJson.data) ? seqJson.data : seqJson.data.items || []
        setItems(rawItems)
        setTotalItems(seqJson.meta?.pagination?.total ?? seqJson.data?.total ?? rawItems.length ?? 0)
      } else {
        setError(seqJson.error?.message || 'فشل تحميل تسلسلات العمليات')
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, pageSize, searchQuery, activeOnly, selectedModule])

  // Initialize standard sequences if empty
  const handleInitialize = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/erp/transaction-sequences/initialize', { method: 'POST' })
      const json = await res.json()
      if (res.ok || json.success) {
        toast.success(isAr ? 'تمت تهيئة التسلسلات القياسية بنجاح' : 'Standard sequences initialized successfully')
        await fetchData()
      } else {
        toast.error(json.error?.message || (isAr ? 'فشلت التهيئة القياسية' : 'Failed to initialize'))
      }
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle active status
  const handleToggleStatus = async (item: TransactionSequenceItem) => {
    try {
      const res = await fetch(`/api/erp/transaction-sequences/${item.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      const json = await res.json()
      if (res.ok || json.success) {
        toast.success(isAr ? 'تم تعديل حالة التسلسل بنجاح' : 'Status updated successfully')
        await fetchData()
      } else {
        toast.error(json.error?.message || (isAr ? 'فشل تعديل الحالة' : 'Failed to update status'))
      }
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  // Open Form Mode
  const openCreateForm = () => {
    setFormData({
      sequenceDocTypeId: docTypes[0]?.id || '',
      sequenceNumber: 1,
      nameAr: docTypes[0]?.nameAr || '',
      nameEn: docTypes[0]?.nameEn || '',
      dateDisplayMode: 'automatic',
      active: true,
      initialValue: 1,
      numberLength: 6,
      prefix: '',
      suffix: '',
      resetPolicy: 'fiscal_year',
      branchScope: 'all',
      branchId: '',
      fiscalYearScope: '',
      notes: '',
      segments: [
        { segmentNumber: 1, segmentType: 'prefix', value: 'INV', segmentLength: null, isResetTrigger: false },
        { segmentNumber: 2, segmentType: 'delimiter', value: '-', segmentLength: null, isResetTrigger: false },
        { segmentNumber: 3, segmentType: 'fiscal_year', value: '2026', segmentLength: 4, isResetTrigger: true, dateFormat: 'YYYY' },
        { segmentNumber: 4, segmentType: 'delimiter', value: '-', segmentLength: null, isResetTrigger: false },
        { segmentNumber: 5, segmentType: 'sequence_number', value: '00001', segmentLength: 6, isResetTrigger: false, formatType: 'padded' },
      ],
    })
    setActiveItem(null)
    setViewMode('create')
  }

  const openEditForm = (item: TransactionSequenceItem, index: number) => {
    setActiveItem(item)
    setCurrentRecordIndex(index)
    setFormData({
      sequenceDocTypeId: item.sequenceDocTypeId,
      sequenceNumber: item.sequenceNumber,
      nameAr: item.nameAr || '',
      nameEn: item.nameEn || '',
      dateDisplayMode: item.dateDisplayMode,
      active: item.active,
      initialValue: item.initialValue,
      numberLength: item.numberLength,
      prefix: item.prefix || '',
      suffix: item.suffix || '',
      resetPolicy: item.resetPolicy,
      branchScope: item.branchScope,
      branchId: item.branchId || '',
      fiscalYearScope: item.fiscalYearScope ? String(item.fiscalYearScope) : '',
      notes: item.notes || '',
      segments: item.segments?.length
        ? item.segments
        : [
          { segmentNumber: 1, segmentType: 'prefix', value: item.prefix || 'DOC', isResetTrigger: false },
          { segmentNumber: 2, segmentType: 'delimiter', value: '-', isResetTrigger: false },
          { segmentNumber: 3, segmentType: 'fiscal_year', value: item.fiscalYearScope ? String(item.fiscalYearScope) : '2026', isResetTrigger: true, dateFormat: 'YYYY' },
          { segmentNumber: 4, segmentType: 'delimiter', value: '-', isResetTrigger: false },
          { segmentNumber: 5, segmentType: 'sequence_number', value: '000001', segmentLength: item.numberLength, isResetTrigger: false },
        ],
    })
    setViewMode('edit')
  }

  // Delete sequence with enterprise confirmation dialog
  const promptDelete = (item: TransactionSequenceItem) => {
    if (item.isUsed || item.totalIssued > 0) {
      alert(
        isAr
          ? `لا يمكن حذف التسلسل "${item.nameAr}" لوجود أرقام ومعاملات صادرة منه (${item.totalIssued}). يرجى تعطيله بدلاً من ذلك.`
          : `Cannot delete sequence "${item.nameAr}" because it has ${item.totalIssued} issued documents. Deactivate it instead.`
      )
      return
    }
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return
    try {
      const res = await fetch(`/api/erp/transaction-sequences/${itemToDelete.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok || json.success) {
        await fetchData()
      } else {
        alert(json.error?.message || 'فشل حذف التسلسل')
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // Form Save
  const handleSaveForm = async () => {
    if (!formData.sequenceDocTypeId) {
      alert(isAr ? 'يرجى اختيار نوع وثيقة التسلسل' : 'Please select a sequence document type')
      return
    }

    try {
      setLoading(true)
      const payload = {
        ...formData,
        fiscalYearScope: formData.fiscalYearScope ? parseInt(formData.fiscalYearScope, 10) : null,
      }

      const url = viewMode === 'create' ? '/api/erp/transaction-sequences' : `/api/erp/transaction-sequences/${activeItem?.id}`
      const method = viewMode === 'create' ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (res.ok || json.success) {
        await fetchData()
        setViewMode('list')
      } else {
        alert(json.error?.message || 'فشل حفظ إعدادات التسلسل')
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Record navigator in Form View
  const handleNavigateRecord = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (items.length === 0) return
    let newIndex = currentRecordIndex
    if (direction === 'first') newIndex = 0
    else if (direction === 'prev') newIndex = Math.max(0, currentRecordIndex - 1)
    else if (direction === 'next') newIndex = Math.min(items.length - 1, currentRecordIndex + 1)
    else if (direction === 'last') newIndex = items.length - 1

    openEditForm(items[newIndex], newIndex)
  }

  // Live Pattern Preview
  const livePatternPreview = useMemo(() => {
    if (formData.segments.length === 0) {
      const p = formData.prefix || 'DOC'
      return `${p}-2026-${'0'.repeat(Math.max(0, formData.numberLength - 1))}1`
    }
    return formData.segments
      .map((seg) => {
        if (seg.segmentType === 'prefix') return seg.value || formData.prefix || 'DOC'
        if (seg.segmentType === 'delimiter') return seg.value || '-'
        if (seg.segmentType === 'fiscal_year') return seg.dateFormat === 'YY' ? '26' : '2026'
        if (seg.segmentType === 'calendar_year') return '2026'
        if (seg.segmentType === 'month') return '03'
        if (seg.segmentType === 'day') return '08'
        if (seg.segmentType === 'branch') return seg.value || 'TAIZ'
        if (seg.segmentType === 'sequence_number') {
          const len = seg.segmentLength || formData.numberLength
          return '1'.padStart(len, '0')
        }
        return seg.value || ''
      })
      .join('')
  }, [formData.segments, formData.prefix, formData.numberLength])

  // Segment operations
  const handleAddSegment = () => {
    const nextNum = formData.segments.length + 1
    setFormData({
      ...formData,
      segments: [
        ...formData.segments,
        {
          segmentNumber: nextNum,
          segmentType: 'delimiter',
          value: '-',
          isResetTrigger: false,
        },
      ],
    })
  }

  const handleRemoveSegment = (index: number) => {
    const updated = formData.segments
      .filter((_, idx) => idx !== index)
      .map((s, idx) => ({ ...s, segmentNumber: idx + 1 }))
    setFormData({ ...formData, segments: updated })
  }

  const handleUpdateSegment = (index: number, patch: Partial<SequenceSegmentItem>) => {
    const updated = [...formData.segments]
    updated[index] = { ...updated[index], ...patch }
    setFormData({ ...formData, segments: updated })
  }

  return (
    <div className="flex flex-col flex-1 h-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-3 space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header / Breadcrumb matching Screenshot 1 & 5 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-4 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 gap-1.5 font-medium">
            <span className="hover:text-primary cursor-pointer">{isAr ? 'الرئيسية' : 'Home'}</span>
            <span>&gt;</span>
            <span
              className="text-primary hover:underline cursor-pointer font-semibold"
              onClick={() => setViewMode('list')}
            >
              {isAr ? 'تسلسلات العمليات' : 'Transaction Sequences'}
            </span>
            <span>&gt;</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold">
              {viewMode === 'list'
                ? isAr
                  ? 'الكل'
                  : 'All'
                : activeItem?.nameAr || (isAr ? 'سجل جديد' : 'New Record')}
            </span>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          {viewMode !== 'list' && (
            <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-700 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5">
              <button
                onClick={() => handleNavigateRecord('first')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="السجل الأول"
              >
                <ChevronsRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </button>
              <button
                onClick={() => handleNavigateRecord('prev')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="السابق"
              >
                <ChevronRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </button>
              <span className="text-xs font-mono px-2 text-slate-700 dark:text-slate-300">
                [ {currentRecordIndex + 1} / {Math.max(1, items.length)} ]
              </span>
              <button
                onClick={() => handleNavigateRecord('next')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="التالي"
              >
                <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </button>
              <button
                onClick={() => handleNavigateRecord('last')}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                title="السجل الأخير"
              >
                <ChevronsLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
              </button>
            </div>
          )}


          {items.length === 0 && (
            <Button
              size="sm"
              onClick={handleInitialize}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'تهيئة التسلسلات القياسية' : 'Init Standard Sequences'}
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. LIST VIEW (Matching fiscal-periods-module.tsx Design Standard)          */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
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
                      checked={visibleColumns.docTypeCode}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, docTypeCode: !!v }))}
                    >
                      {isAr ? 'نوع وثيقة التسلسل' : 'Doc Type Code'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.nameAr}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, nameAr: !!v }))}
                    >
                      {isAr ? 'النوع / الاسم' : 'Type / Name'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.sequenceNumber}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, sequenceNumber: !!v }))}
                    >
                      {isAr ? 'التسلسل' : 'Sequence'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.dateDisplayMode}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, dateDisplayMode: !!v }))}
                    >
                      {isAr ? 'طريقة عرض التاريخ' : 'Date Display Mode'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.active}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, active: !!v }))}
                    >
                      {isAr ? 'الحالة (فعال)' : 'Active'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.initialValue}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, initialValue: !!v }))}
                    >
                      {isAr ? 'القيمة الابتدائية' : 'Initial Value'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.numberLength}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, numberLength: !!v }))}
                    >
                      {isAr ? 'طول رقم الوثيقة' : 'Number Length'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.createdById}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, createdById: !!v }))}
                    >
                      {isAr ? 'مدخل البيانات' : 'Created By'}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleColumns.entryStartDate}
                      onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, entryStartDate: !!v }))}
                    >
                      {isAr ? 'تاريخ بدء الإدخال' : 'Entry Start Date'}
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
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setPage(1)
                    }}
                    placeholder={isAr ? 'بحث بالاسم، الكود، البادئة...' : 'Search by name, code...'}
                    className={cn('h-8 text-xs bg-background w-full', isAr ? 'pr-7 pl-6' : 'pl-7 pr-6')}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
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
                      setActiveOnly(false)
                      setPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer",
                      !activeOnly
                        ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isAr ? 'الكل' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveOnly(true)
                      setPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                      activeOnly
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {isAr ? 'الفعال فقط' : 'Active Only'}
                  </button>
                </div>

                {/* Module Filter Dropdown */}
                <Select
                  value={selectedModule}
                  onValueChange={(v) => {
                    setSelectedModule(v)
                    setPage(1)
                  }}
                  dir={isAr ? 'rtl' : 'ltr'}
                >
                  <SelectTrigger className="h-8 min-w-[130px] max-w-[170px] text-xs bg-background shrink-0" dir={isAr ? 'rtl' : 'ltr'}>
                    <SelectValue placeholder={isAr ? 'جميع الوحدات' : 'All Modules'} />
                  </SelectTrigger>
                  <SelectContent dir={isAr ? 'rtl' : 'ltr'}>
                    <SelectItem value="ALL">{isAr ? 'جميع الوحدات (الكل)' : 'All Modules'}</SelectItem>
                    <SelectItem value="FIN">{isAr ? 'الحسابات والمالية (FIN)' : 'Financial (FIN)'}</SelectItem>
                    <SelectItem value="SAL">{isAr ? 'المبيعات (SAL)' : 'Sales (SAL)'}</SelectItem>
                    <SelectItem value="PUR">{isAr ? 'المشتريات (PUR)' : 'Purchases (PUR)'}</SelectItem>
                    <SelectItem value="INV">{isAr ? 'المخازن والمستودعات (INV)' : 'Inventory (INV)'}</SelectItem>
                    <SelectItem value="POS">{isAr ? 'نقاط البيع (POS)' : 'Point of Sale (POS)'}</SelectItem>
                    <SelectItem value="HR">{isAr ? 'الموارد البشرية (HR)' : 'Human Resources (HR)'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3 on mobile (Right Group on Desktop): Action Tools & Add Sequence Button */}
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
                  onClick={fetchData}
                  title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
                >
                  <RotateCw className={cn("size-4", loading && "animate-spin")} />
                </Button>

                {/* Active / Inactive status toggle for selected sequence */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem
                      ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 shadow-xs hover:scale-105 cursor-pointer"
                      : "text-slate-400 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) handleToggleStatus(selectedItem)
                  }}
                  title={
                    selectedItem
                      ? selectedItem.active
                        ? isAr ? 'تعطيل التسلسل المحدد' : 'Deactivate selected'
                        : isAr ? 'تفعيل التسلسل المحدد' : 'Activate selected'
                      : isAr ? 'اختر تسلسلاً من الجدول لتغيير حالته' : 'Select a sequence to toggle status'
                  }
                >
                  <Lock className="size-4" />
                </Button>

                {/* Edit selected sequence */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem
                      ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs hover:scale-105 cursor-pointer"
                      : "text-amber-300 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) {
                      const idx = items.findIndex((it) => it.id === selectedItem.id)
                      openEditForm(selectedItem, idx >= 0 ? idx : 0)
                    }
                  }}
                  title={
                    selectedItem
                      ? isAr ? 'تعديل التسلسل المحدد' : 'Edit selected sequence'
                      : isAr ? 'اختر تسلسلاً من الجدول للتعديل' : 'Select a sequence to edit'
                  }
                >
                  <Edit2 className="size-4" />
                </Button>

                {/* Delete selected sequence */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem || selectedItem.isUsed}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem && !selectedItem.isUsed
                      ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs hover:scale-105 cursor-pointer"
                      : "text-rose-300 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem && !selectedItem.isUsed) promptDelete(selectedItem)
                  }}
                  title={
                    selectedItem
                      ? selectedItem.isUsed
                        ? isAr ? 'ممنوع الحذف لتسلسل مستخدم' : 'Cannot delete used sequence'
                        : isAr ? 'حذف التسلسل المحدد' : 'Delete selected sequence'
                      : isAr ? 'اختر تسلسلاً من الجدول للحذف' : 'Select a sequence to delete'
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Add Sequence Button */}
              <Button
                onClick={openCreateForm}
                size="sm"
                className="h-8 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 px-3 shadow-xs font-bold shrink-0"
              >
                <Plus className="size-3.5" />
                <span>{isAr ? 'إضافة' : 'Add'}</span>
              </Button>
            </div>
          </div>

          {/* MAIN GRID TABLE WITH HORIZONTAL SCROLLBAR */}
          <div className="overflow-x-auto min-h-[380px] w-full flex-1 scrollbar-thin">
            <Table className="min-w-[1090px] border-collapse text-[11px] table-fixed w-full">
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                  {visibleColumns.docTypeCode && (
                    <TableHead
                      style={{
                        width: `${colWidths.docTypeCode || 140}px`,
                        minWidth: `${colWidths.docTypeCode || 140}px`,
                        maxWidth: `${colWidths.docTypeCode || 140}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isAr ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{isAr ? 'نوع وثيقة التسلسل' : 'Doc Type Code'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('docTypeCode', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, docTypeCode: DEFAULT_COL_WIDTHS.docTypeCode }))}
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
                        width: `${colWidths.nameAr || 180}px`,
                        minWidth: `${colWidths.nameAr || 180}px`,
                        maxWidth: `${colWidths.nameAr || 180}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isAr ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{isAr ? 'النوع / الاسم' : 'Type / Name'}</span>
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

                  {visibleColumns.sequenceNumber && (
                    <TableHead
                      style={{
                        width: `${colWidths.sequenceNumber || 85}px`,
                        minWidth: `${colWidths.sequenceNumber || 85}px`,
                        maxWidth: `${colWidths.sequenceNumber || 85}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{isAr ? 'التسلسل' : 'Seq'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('sequenceNumber', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, sequenceNumber: DEFAULT_COL_WIDTHS.sequenceNumber }))}
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

                  {visibleColumns.dateDisplayMode && (
                    <TableHead
                      style={{
                        width: `${colWidths.dateDisplayMode || 120}px`,
                        minWidth: `${colWidths.dateDisplayMode || 120}px`,
                        maxWidth: `${colWidths.dateDisplayMode || 120}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{isAr ? 'طريقة عرض التاريخ' : 'Date Mode'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('dateDisplayMode', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, dateDisplayMode: DEFAULT_COL_WIDTHS.dateDisplayMode }))}
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

                  {visibleColumns.initialValue && (
                    <TableHead
                      style={{
                        width: `${colWidths.initialValue || 110}px`,
                        minWidth: `${colWidths.initialValue || 110}px`,
                        maxWidth: `${colWidths.initialValue || 110}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{isAr ? 'القيمة الابتدائية' : 'Initial Val'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('initialValue', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, initialValue: DEFAULT_COL_WIDTHS.initialValue }))}
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

                  {visibleColumns.numberLength && (
                    <TableHead
                      style={{
                        width: `${colWidths.numberLength || 110}px`,
                        minWidth: `${colWidths.numberLength || 110}px`,
                        maxWidth: `${colWidths.numberLength || 110}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>{isAr ? 'طول الرقم' : 'Length'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('numberLength', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, numberLength: DEFAULT_COL_WIDTHS.numberLength }))}
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
                        width: `${colWidths.createdById || 100}px`,
                        minWidth: `${colWidths.createdById || 100}px`,
                        maxWidth: `${colWidths.createdById || 100}px`,
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

                  {visibleColumns.entryStartDate && (
                    <TableHead
                      style={{
                        width: `${colWidths.entryStartDate || 150}px`,
                        minWidth: `${colWidths.entryStartDate || 150}px`,
                        maxWidth: `${colWidths.entryStartDate || 150}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isAr ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span>{isAr ? 'تاريخ بدء الإدخال' : 'Start Date'}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('entryStartDate', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, entryStartDate: DEFAULT_COL_WIDTHS.entryStartDate }))}
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
                        width: `${colWidths.actions || 110}px`,
                        minWidth: `${colWidths.actions || 110}px`,
                        maxWidth: `${colWidths.actions || 110}px`,
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
                      {Array.from({ length: Object.values(visibleColumns).filter(Boolean).length }).map((_, j) => (
                        <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-12">
                      <Layers className="size-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-sm">{isAr ? 'لا توجد تسلسلات عمليات' : 'No transaction sequences found'}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isAr ? 'اضغط على "تهيئة التسلسلات القياسية" للبدء سريعاً' : 'Click "Init Standard Sequences" to start quickly'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => {
                    const isSelected = selectedId === item.id

                    return (
                      <TableRow
                        key={item.id}
                        data-selected={isSelected || undefined}
                        onClick={() => setSelectedId(item.id)}
                        onDoubleClick={() => openEditForm(item, index)}
                        className={cn(
                          "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                          isSelected
                            ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60",
                          !item.active && !isSelected && "opacity-75 bg-slate-50/50 dark:bg-slate-900/40"
                        )}
                        style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                      >
                        {visibleColumns.docTypeCode && (
                          <TableCell
                            style={{
                              width: `${colWidths.docTypeCode || 140}px`,
                              minWidth: `${colWidths.docTypeCode || 140}px`,
                              maxWidth: `${colWidths.docTypeCode || 140}px`,
                            }}
                            className="font-semibold text-primary font-mono border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <span className="truncate block w-full cursor-default" title={item.sequenceDocType?.code || '-'}>
                              {item.sequenceDocType?.code || '-'}
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.nameAr && (
                          <TableCell
                            style={{
                              width: `${colWidths.nameAr || 180}px`,
                              minWidth: `${colWidths.nameAr || 180}px`,
                              maxWidth: `${colWidths.nameAr || 180}px`,
                            }}
                            className="font-medium text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate block w-full cursor-default" title={isAr ? item.nameAr : item.nameEn || item.nameAr}>
                                {isAr ? item.nameAr : item.nameEn || item.nameAr}
                              </span>
                              {item.isUsed && (
                                <span title={isAr ? `تسلسل مستخدم (${item.totalIssued || 0} وثيقة صادرة)` : `Used sequence (${item.totalIssued || 0} issued)`}>
                                  <Lock className="size-3 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {visibleColumns.sequenceNumber && (
                          <TableCell
                            style={{
                              width: `${colWidths.sequenceNumber || 85}px`,
                              minWidth: `${colWidths.sequenceNumber || 85}px`,
                              maxWidth: `${colWidths.sequenceNumber || 85}px`,
                            }}
                            className="text-center font-bold font-mono text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            {item.sequenceNumber}
                          </TableCell>
                        )}

                        {visibleColumns.dateDisplayMode && (
                          <TableCell
                            style={{
                              width: `${colWidths.dateDisplayMode || 120}px`,
                              minWidth: `${colWidths.dateDisplayMode || 120}px`,
                              maxWidth: `${colWidths.dateDisplayMode || 120}px`,
                            }}
                            className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <div className="flex items-center justify-center">
                              {item.dateDisplayMode === 'automatic' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                  <span className="size-1.5 rounded-full bg-blue-500" />
                                  {isAr ? 'آلي' : 'Auto'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                  <span className="size-1.5 rounded-full bg-amber-500" />
                                  {isAr ? 'يدوي' : 'Manual'}
                                </span>
                              )}
                            </div>
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
                                  handleToggleStatus(item)
                                }}
                                className="cursor-pointer focus:outline-none"
                                title={isAr ? 'انقر لتغيير الحالة' : 'Click to toggle status'}
                              >
                                {item.active ? (
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

                        {visibleColumns.initialValue && (
                          <TableCell
                            style={{
                              width: `${colWidths.initialValue || 110}px`,
                              minWidth: `${colWidths.initialValue || 110}px`,
                              maxWidth: `${colWidths.initialValue || 110}px`,
                            }}
                            className="text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            {item.initialValue}
                          </TableCell>
                        )}

                        {visibleColumns.numberLength && (
                          <TableCell
                            style={{
                              width: `${colWidths.numberLength || 110}px`,
                              minWidth: `${colWidths.numberLength || 110}px`,
                              maxWidth: `${colWidths.numberLength || 110}px`,
                            }}
                            className="text-center font-mono text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            {item.numberLength || '-'}
                          </TableCell>
                        )}

                        {visibleColumns.createdById && (
                          <TableCell
                            style={{
                              width: `${colWidths.createdById || 100}px`,
                              minWidth: `${colWidths.createdById || 100}px`,
                              maxWidth: `${colWidths.createdById || 100}px`,
                            }}
                            className="text-center text-slate-500 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden font-mono text-[11px]"
                          >
                            <span className="truncate block w-full">{item.createdById || '1'}</span>
                          </TableCell>
                        )}

                        {visibleColumns.entryStartDate && (
                          <TableCell
                            style={{
                              width: `${colWidths.entryStartDate || 150}px`,
                              minWidth: `${colWidths.entryStartDate || 150}px`,
                              maxWidth: `${colWidths.entryStartDate || 150}px`,
                            }}
                            className="font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <span
                              className="truncate block w-full cursor-default"
                              title={item.entryStartDate ? new Date(item.entryStartDate).toLocaleString(isAr ? 'ar-EG' : 'en-US') : '-'}
                            >
                              {item.entryStartDate
                                ? new Date(item.entryStartDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit',
                                  })
                                : '-'}
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.actions && (
                          <TableCell
                            style={{
                              width: `${colWidths.actions || 110}px`,
                              minWidth: `${colWidths.actions || 110}px`,
                              maxWidth: `${colWidths.actions || 110}px`,
                            }}
                            className="py-1 px-2 overflow-hidden text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-6 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                onClick={() => openEditForm(item, index)}
                                title={isAr ? 'تعديل' : 'Edit'}
                              >
                                <Edit2 className="size-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  "size-6 p-0",
                                  item.isUsed
                                    ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                    : "text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                                )}
                                onClick={() => !item.isUsed && promptDelete(item)}
                                disabled={item.isUsed}
                                title={
                                  item.isUsed
                                    ? isAr
                                      ? 'ممنوع الحذف لتسلسل مستخدم'
                                      : 'Cannot delete used sequence'
                                    : isAr
                                      ? 'حذف'
                                      : 'Delete'
                                }
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
      )}

      {/* ========================================================================= */}
      {/* 2. FORM VIEW (Matching Screenshot 5: docsequence)                         */}
      {/* ========================================================================= */}
      {viewMode !== 'list' && (
        <div className="flex-1 flex flex-col p-4 space-y-4 max-w-7xl mx-auto w-full">
          {/* Form Top Actions matching Screenshot 5 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs gap-1.5"
              >
                <ArrowRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                {isAr ? 'رجوع ' : 'Back'}
              </Button>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {viewMode === 'create'
                  ? isAr
                    ? 'إنشاء تسلسل عمليات جديد'
                    : 'Create New Transaction Sequence'
                  : isAr
                    ? `تعديل تسلسل العمليات: ${activeItem?.nameAr}`
                    : `Edit Transaction Sequence: ${activeItem?.nameAr}`}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                size="sm"
                onClick={handleSaveForm}
                disabled={loading}
                className="bg-primary hover:bg-primary/90 text-white text-xs gap-1 shadow"
              >
                <Check className="w-3.5 h-3.5" />
                {isAr ? 'حفظ' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Live Pattern Preview Banner */}
          <div className="bg-primary dark:bg-blue-600/90 border border-blue-200 dark:border-blue-900/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-100 dark:text-blue-300" />
              <span className="text-xs font-semibold text-slate-100 dark:text-slate-200">
                {isAr ? 'معاينة رقم التسلسل:' : ' Document Number Preview:'}
              </span>
            </div>
            <div className="font-mono text-base font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 tracking-wider shadow-inner">
              {livePatternPreview}
            </div>
          </div>

          {/* Form Header Fields matching Screenshot 5 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end ">
              {/* 1. نوع وثيقة التسلسل (إجباري) */}
              <div className="space-y-1.5 lg:col-span-2">
                <Label className="text-xs font-bold flex items-center gap-1">
                  {isAr ? 'نوع وثيقة التسلسل' : 'Sequence Doc Type'}
                  <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formData.sequenceDocTypeId}
                  onChange={(e) => {
                    const dt = docTypes.find((d) => d.id === e.target.value)
                    setFormData({
                      ...formData,
                      sequenceDocTypeId: e.target.value,
                      nameAr: dt?.nameAr || formData.nameAr,
                      nameEn: dt?.nameEn || formData.nameEn,
                    })
                  }}
                  className="w-50 md:w-60 lg:w-full h-9 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-primary"
                >
                  <option value="">{isAr ? ' اختر نوع الوثيقة -- ' : ' Select Document Type --'}</option>
                  {docTypes.map((dt) => (
                    <option key={dt.id} value={dt.id}>
                      [{dt.code}] {dt.nameAr}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. التسلسل (إجباري) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1">
                  {isAr ? 'التسلسل' : 'Sequence'}
                  <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.sequenceNumber}
                  onChange={(e) => setFormData({ ...formData, sequenceNumber: parseInt(e.target.value, 10) || 1 })}
                  className="h-9 text-xs font-mono font-bold"
                  disabled={activeItem?.isUsed}
                />
              </div>

              {/* 3. طريقة عرض تاريخ الوثيقة (إجباري) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1">
                  {isAr ? 'طريقة عرض تاريخ الوثيقة' : 'Date Display Mode'}
                  <span className="text-rose-500">*</span>
                </Label>
                <select
                  value={formData.dateDisplayMode}
                  onChange={(e) =>
                    setFormData({ ...formData, dateDisplayMode: e.target.value as 'automatic' | 'manual' })
                  }
                  className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="automatic">{isAr ? 'آلي' : 'Automatic'}</option>
                  <option value="manual">{isAr ? 'يدوي' : 'Manual'}</option>
                </select>
              </div>

              {/* 4. فعال (مربع اختيار) */}
              <div className="space-y-1.5 flex flex-col justify-end">
                <div className="flex items-center gap-2 h-9">
                  <input
                    type="checkbox"
                    id="seq-active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-slate-300"
                  />
                  <Label htmlFor="seq-active" className="text-xs font-bold cursor-pointer">
                    {isAr ? 'فعال' : 'Active'}
                  </Label>
                </div>
              </div>

              {/* 5. القيمة الإبتدائية (إجباري) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold flex items-center gap-1">
                  {isAr ? 'القيمة الأولية' : 'Initial Value'}
                  <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.initialValue}
                  onChange={(e) => setFormData({ ...formData, initialValue: parseInt(e.target.value, 10) || 1 })}
                  className="h-9 text-xs font-mono"
                  disabled={activeItem?.isUsed}
                />
              </div>

              {/* 6. طول رقم الوثيقة */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {isAr ? 'طول رقم الوثيقة' : 'Number Length'}
                </Label>
                <Input
                  type="number"
                  min={3}
                  max={20}
                  value={formData.numberLength}
                  onChange={(e) => setFormData({ ...formData, numberLength: parseInt(e.target.value, 10) || 6 })}
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* 7. سياسة التصفير */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {isAr ? 'سياسة إعادة التصفير' : 'Reset Policy'}
                </Label>
                <select
                  value={formData.resetPolicy}
                  onChange={(e) =>
                    setFormData({ ...formData, resetPolicy: e.target.value as 'fiscal_year' | 'monthly' | 'never' })
                  }
                  className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="fiscal_year">{isAr ? 'السنة المالية' : 'Fiscal Year'}</option>
                  <option value="monthly">{isAr ? 'شهرياً' : 'Monthly'}</option>
                  <option value="never">{isAr ? 'مستمر بدون تصفير' : 'Continuous'}</option>
                </select>
              </div>

              {/* 8. نطاق الفرع */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  {isAr ? 'نطاق الفرع' : 'Branch Scope'}
                </Label>
                <select
                  value={formData.branchScope}
                  onChange={(e) =>
                    setFormData({ ...formData, branchScope: e.target.value as 'all' | 'single_branch' })
                  }
                  className="w-full h-9 px-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
                >
                  <option value="all">{isAr ? 'جميع الفروع (عام)' : 'All Branches'}</option>
                  <option value="single_branch">{isAr ? 'فرع محدد' : 'Single Branch'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 1: حقول التسلسل أ (Pattern Segments Builder matching Screenshot 5) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {isAr ? 'حقول التسلسل أ (مقاطع بناء الصيغة)' : 'Sequence Segments Builder'}
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSegment}
                className="h-7 text-xs gap-1 border-primary/40 text-primary hover:bg-primary/10"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة مقطع' : 'Add Segment'}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-2 text-center w-8">#</th>
                    <th className="py-2 px-2 text-center w-24">{isAr ? 'رقم المقطع *' : 'Seg No *'}</th>
                    <th className="py-2 px-2 text-start w-48">{isAr ? 'نوع المقطع *' : 'Segment Type *'}</th>
                    <th className="py-2 px-2 text-start w-40">{isAr ? 'القيمة *' : 'Value *'}</th>
                    <th className="py-2 px-2 text-center w-24">{isAr ? 'طول المقطع' : 'Length'}</th>
                    <th className="py-2 px-2 text-center w-24">{isAr ? 'يعتمد عليه...' : 'Reset Trigger'}</th>
                    <th className="py-2 px-2 text-start w-32">{isAr ? 'نوع الصيغة' : 'Format'}</th>
                    <th className="py-2 px-2 text-start w-32">{isAr ? 'صيغة التاريخ' : 'Date Format'}</th>
                    <th className="py-2 px-2 text-center w-12">{isAr ? 'حذف' : 'Del'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {formData.segments.map((seg, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-1.5 px-2 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-1.5 px-2 text-center">
                        <Input
                          type="number"
                          value={seg.segmentNumber}
                          onChange={(e) => handleUpdateSegment(idx, { segmentNumber: parseInt(e.target.value, 10) || idx + 1 })}
                          className="h-7 text-xs text-center font-mono p-1"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <select
                          value={seg.segmentType}
                          onChange={(e) => handleUpdateSegment(idx, { segmentType: e.target.value as any })}
                          className="w-full h-7 px-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        >
                          <option value="prefix">{isAr ? 'بادئة نصية' : 'Prefix'}</option>
                          <option value="fiscal_year">{isAr ? 'السنة المالية' : 'Fiscal Year'}</option>
                          <option value="calendar_year">{isAr ? 'السنة الميلادية' : 'Calendar Year'}</option>
                          <option value="month">{isAr ? 'الشهر' : 'Month'}</option>
                          <option value="day">{isAr ? 'اليوم' : 'Day'}</option>
                          <option value="branch">{isAr ? 'كود الفرع ' : 'Branch'}</option>
                          <option value="sequence_number">{isAr ? 'رقم العداد' : 'Sequence Counter'}</option>
                          <option value="delimiter">{isAr ? 'فاصل' : 'Delimiter'}</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <Input
                          value={seg.value}
                          onChange={(e) => handleUpdateSegment(idx, { value: e.target.value })}
                          placeholder={seg.segmentType === 'delimiter' ? '-' : 'INV'}
                          className="h-7 text-xs font-mono p-1"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <Input
                          type="number"
                          value={seg.segmentLength || ''}
                          onChange={(e) => handleUpdateSegment(idx, { segmentLength: parseInt(e.target.value, 10) || null })}
                          className="h-7 text-xs text-center font-mono p-1"
                          placeholder="6"
                        />
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={seg.isResetTrigger || false}
                          onChange={(e) => handleUpdateSegment(idx, { isResetTrigger: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-300"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <select
                          value={seg.formatType || ''}
                          onChange={(e) => handleUpdateSegment(idx, { formatType: e.target.value || null })}
                          className="w-full h-7 px-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        >
                          <option value="">{isAr ? 'افتراضي' : 'Default'}</option>
                          <option value="padded">{isAr ? 'محشو بأصفار' : 'Padded'}</option>
                          <option value="uppercase">{isAr ? 'أحرف كبيرة' : 'Uppercase'}</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <select
                          value={seg.dateFormat || ''}
                          onChange={(e) => handleUpdateSegment(idx, { dateFormat: e.target.value || null })}
                          className="w-full h-7 px-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded"
                        >
                          <option value="">-</option>
                          <option value="YYYY">YYYY (2026)</option>
                          <option value="YY">YY (26)</option>
                          <option value="MM">MM (03)</option>
                          <option value="DD">DD (08)</option>
                        </select>
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveSegment(idx)}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: التسلسل (Live Counter State matching Screenshot 5) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {isAr ? 'حالة العداد اللحظية والتاريخية (Sequence Runtime Counter State)' : 'Runtime Counter State'}
              </h3>
            </div>

            {activeItem?.sequenceStates && activeItem.sequenceStates.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3 text-start">{isAr ? 'السنة المالية' : 'Fiscal Year'}</th>
                      <th className="py-2 px-3 text-center">{isAr ? 'آخر رقم مستخدم' : 'Last Issued'}</th>
                      <th className="py-2 px-3 text-center">{isAr ? 'الرقم القادم' : 'Next Number'}</th>
                      <th className="py-2 px-3 text-start">{isAr ? 'الفرع' : 'Branch'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeItem.sequenceStates.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono font-bold text-primary">{st.fiscalYear ? String(st.fiscalYear) : (isAr ? 'عام' : 'General')}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-600">{st.lastNumber}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-blue-600">{st.nextNumber}</td>
                        <td className="py-2 px-3 text-slate-500">{st.branchId || (isAr ? 'جميع الفروع' : 'All Branches')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                {isAr ? 'لا يوجد سجل للعرض (لم تصدر أي وثيقة من هذا التسلسل حتى الآن)' : 'No records to display (no documents issued yet)'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enterprise Safe Deletion Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isAr ? 'rtl' : 'ltr'}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-start">
              {isAr ? 'تأكيد حذف تسلسل العمليات' : 'Confirm Sequence Deletion'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-start text-xs text-slate-600 dark:text-slate-300">
              {isAr
                ? `هل أنت متأكد من حذف تسلسل العمليات "${itemToDelete?.nameAr}"؟ هذا الإجراء لا يمكن التراجع عنه.`
                : `Are you sure you want to delete transaction sequence "${itemToDelete?.nameAr}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs">
              {isAr ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs"
            >
              {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
