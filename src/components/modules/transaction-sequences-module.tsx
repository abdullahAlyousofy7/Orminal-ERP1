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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
} from '@/components/ui/dropdown-menu'
import { useNav } from '@/stores/nav-store'

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
  const [isAr, setIsAr] = useState(true)

  // Dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<TransactionSequenceItem | null>(null)

  // Module state
  const [items, setItems] = useState<TransactionSequenceItem[]>([])
  const [docTypes, setDocTypes] = useState<SequenceDocType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [selectedModule, setSelectedModule] = useState<string>('ALL')
  const [groupBy, setGroupBy] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
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

  // Visible Columns toggler
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
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
  })

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
        await fetchData()
      } else {
        alert(json.error?.message || 'فشلت التهيئة القياسية')
      }
    } catch (e: any) {
      alert(e.message)
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
        await fetchData()
      } else {
        alert(json.error?.message || 'فشل تعديل الحالة')
      }
    } catch (e: any) {
      alert(e.message)
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
      {/* 1. LIST VIEW (Matching Screenshot 1, 2, 3, 4)                             */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col space-y-3">

          {/* Action Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute top-2.5 start-3 text-slate-400" />
                <Input
                  placeholder={isAr ? 'بحث بالاسم، الكود، البادئة...' : 'Search by name, code, prefix...'}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="ps-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Module Filter */}
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value)
                  setPage(1)
                }}
                className="h-9 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md"
              >
                <option value="ALL">{isAr ? 'جميع الوحدات (الكل)' : 'All Modules'}</option>
                <option value="FIN">{isAr ? 'الحسابات والمالية (FIN)' : 'Financial'}</option>
                <option value="SAL">{isAr ? 'المبيعات (SAL)' : 'Sales'}</option>
                <option value="PUR">{isAr ? 'المشتريات (PUR)' : 'Purchases'}</option>
                <option value="INV">{isAr ? 'المخازن والمستودعات (INV)' : 'Inventory'}</option>
                <option value="POS">{isAr ? 'نقاط البيع (POS)' : 'Point of Sale'}</option>
                <option value="HR">{isAr ? 'الموارد البشرية (HR)' : 'Human Resources'}</option>
              </select>

              {/* Active Toggle Filter */}
              <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md bg-slate-50 dark:bg-slate-800">
                <Label htmlFor="active-filter" className="text-xs cursor-pointer text-slate-600 dark:text-slate-300">
                  {isAr ? 'الفعال فقط' : 'Active Only'}
                </Label>
                <Switch
                  id="active-filter"
                  checked={activeOnly}
                  onCheckedChange={(val) => {
                    setActiveOnly(val)
                    setPage(1)
                  }}
                />
              </div>

              {/* Column Chooser */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 text-xs gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    {isAr ? 'أعمدة' : 'Columns'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-48 text-xs">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.docTypeCode}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, docTypeCode: val })}
                  >
                    {isAr ? 'نوع وثيقة التسلسل' : 'Doc Type Code'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.nameAr}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, nameAr: val })}
                  >
                    {isAr ? 'النوع' : 'Type'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.sequenceNumber}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, sequenceNumber: val })}
                  >
                    {isAr ? 'التسلسل' : 'Sequence'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.dateDisplayMode}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, dateDisplayMode: val })}
                  >
                    {isAr ? 'طريقة عرض التاريخ' : 'Date Display Mode'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.active}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, active: val })}
                  >
                    {isAr ? 'فعال' : 'Active'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.initialValue}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, initialValue: val })}
                  >
                    {isAr ? 'القيمة الأولية' : 'Initial Value'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.numberLength}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, numberLength: val })}
                  >
                    {isAr ? 'طول رقم الوثيقة' : 'Number Length'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.entryStartDate}
                    onCheckedChange={(val) => setVisibleColumns({ ...visibleColumns, entryStartDate: val })}
                  >
                    {isAr ? 'تاريخ بدء الإدخال' : 'Entry Start Date'}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Action Buttons matching icons in Screenshot 1 */}
              <Button variant="outline" size="sm" onClick={() => window.print()} title={isAr ? 'طباعة' : 'Print'} className="h-9 w-9 p-0">
                <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData} title={isAr ? 'تحديث' : 'Refresh'} className="h-9 w-9 p-0">
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${loading ? 'animate-spin' : ''}`} />
              </Button>

              {/* Add Sequence Button */}
              <Button onClick={openCreateForm} size="sm" className="h-9 bg-primary hover:bg-primary/90 text-white text-xs gap-1 px-3 shadow">
                <Plus className="w-4 h-4" />
                {isAr ? 'إضافة' : 'Add '}
              </Button>
            </div>
          </div>

          {/* DataGrid Table matching Screenshot 1, 2, 3, 4 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs text-start border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 select-none">
                  <tr>
                    {visibleColumns.docTypeCode && (
                      <th className="py-2.5 px-3 text-start font-semibold whitespace-nowrap">
                        {isAr ? 'نوع وثيقة التسلسل' : 'Doc Type Code'}
                      </th>
                    )}
                    {visibleColumns.nameAr && (
                      <th className="py-2.5 px-3 text-start font-semibold whitespace-nowrap">
                        {isAr ? ' النوع' : 'Type'}
                      </th>
                    )}
                    {visibleColumns.sequenceNumber && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'التسلسل' : 'Seq'}
                      </th>
                    )}
                    {visibleColumns.dateDisplayMode && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'طريقة عرض التاريخ ' : 'Date Mode'}
                      </th>
                    )}
                    {visibleColumns.active && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'فعال' : 'Active'}
                      </th>
                    )}
                    {visibleColumns.initialValue && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'القيمة الإبتدائية...' : 'Initial Value'}
                      </th>
                    )}
                    {visibleColumns.numberLength && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'طول رقم الوثيقة' : 'Length'}
                      </th>
                    )}
                    {visibleColumns.createdById && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'مدخل البيانات' : 'Created By'}
                      </th>
                    )}
                    {visibleColumns.entryStartDate && (
                      <th className="py-2.5 px-3 text-start font-semibold whitespace-nowrap">
                        {isAr ? 'تاريخ بدء الإدخال' : 'Start Date'}
                      </th>
                    )}
                    {visibleColumns.actions && (
                      <th className="py-2.5 px-3 text-center font-semibold whitespace-nowrap">
                        {isAr ? 'الإجراءات' : 'Actions'}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading && items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                        {isAr ? 'جاري تحميل تسلسلات العمليات...' : 'Loading transaction sequences...'}
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-400">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm">{isAr ? 'لا توجد تسلسلات عمليات' : 'No transaction sequences found'}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {isAr ? 'اضغط على "تهيئة التسلسلات القياسية" للبدء سريعاً' : 'Click "Init Standard Sequences" to start quickly'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!item.active ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/40' : ''
                          }`}
                        onDoubleClick={() => openEditForm(item, index)}
                      >
                        {visibleColumns.docTypeCode && (
                          <td className="py-2 px-3 font-mono font-bold text-primary">
                            {item.sequenceDocType?.code || '-'}
                          </td>
                        )}
                        {visibleColumns.nameAr && (
                          <td className="py-2 px-3 font-medium">
                            <div className="flex items-center gap-1.5">
                              <span>{isAr ? item.nameAr : item.nameEn || item.nameAr}</span>
                              {item.isUsed && (
                                <span title={isAr ? `تسلسل مستخدم (${item.totalIssued} وثيقة صادرة)` : `Used sequence (${item.totalIssued} issued)`}>
                                  <Lock className="w-3 h-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {visibleColumns.sequenceNumber && (
                          <td className="py-2 px-3 text-center font-bold">
                            {item.sequenceNumber}
                          </td>
                        )}
                        {visibleColumns.dateDisplayMode && (
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${item.dateDisplayMode === 'automatic'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                                }`}
                            >
                              {item.dateDisplayMode === 'automatic' ? (isAr ? 'آلي' : 'Auto') : (isAr ? 'يدوي' : 'Manual')}
                            </span>
                          </td>
                        )}
                        {visibleColumns.active && (
                          <td className="py-2 px-3 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(item)
                              }}
                              className="focus:outline-none"
                            >
                              {item.active ? (
                                <Check className="w-4 h-4 mx-auto text-emerald-600 font-bold" />
                              ) : (
                                <X className="w-4 h-4 mx-auto text-slate-400" />
                              )}
                            </button>
                          </td>
                        )}
                        {visibleColumns.initialValue && (
                          <td className="py-2 px-3 text-center font-mono">
                            {item.initialValue}
                          </td>
                        )}
                        {visibleColumns.numberLength && (
                          <td className="py-2 px-3 text-center font-mono">
                            {item.numberLength || '-'}
                          </td>
                        )}
                        {visibleColumns.createdById && (
                          <td className="py-2 px-3 text-center text-slate-500">
                            1
                          </td>
                        )}
                        {visibleColumns.entryStartDate && (
                          <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                            {new Date(item.entryStartDate || item.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-slate-600 hover:text-primary"
                                onClick={() => openEditForm(item, index)}
                                title={isAr ? 'تعديل' : 'Edit'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 ${item.isUsed
                                  ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                  : 'text-rose-500 hover:text-rose-700'
                                  }`}
                                onClick={() => promptDelete(item)}
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
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer matching Screenshot 1 */}
            <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between text-xs text-slate-600 dark:text-slate-300 gap-3">
              <div>
                {isAr
                  ? `صفحة ${page} من ${Math.max(1, Math.ceil(totalItems / pageSize))} (إجمالي العناصر ${totalItems})`
                  : `Page ${page} of ${Math.max(1, Math.ceil(totalItems / pageSize))} (${totalItems} items total)`}
              </div>

              <div className="flex items-center gap-2">
                <span>{isAr ? 'العناصر في كل صفحة:' : 'Items per page:'}</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="h-7 px-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs"
                >
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>

                <div className="flex items-center gap-1 ms-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage(1)}
                    disabled={page <= 1}
                  >
                    <ChevronsRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                  </Button>
                  <span className="px-2 font-mono font-bold">{page}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= Math.ceil(totalItems / pageSize)}
                  >
                    <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setPage(Math.ceil(totalItems / pageSize))}
                    disabled={page >= Math.ceil(totalItems / pageSize)}
                  >
                    <ChevronsLeft className={`w-3.5 h-3.5 ${isAr ? '' : 'rotate-180'}`} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
