'use client'

// =============================================================================
// Enterprise ERP — General Reference Definitions Master-Detail & Table Module
// Unified Lookup Center for HR, Org, Finance, and Common System Modules.
// Features: Unified High-Density ERP Table (h-8), Column Resizing, Mobile-Ready
// Action Toolbar, Grouping Banner, Double-Click Navigation, Export & Pagination.
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react'
import { useT } from '@/lib/i18n/use-t'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  STATIC_TYPE_SUMMARIES,
  getStaticSeedItems,
  DefinitionTypeMeta,
} from '@/lib/erp/general-definitions-registry'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu'

// Lucide Icons
import {
  LayoutGrid,
  RefreshCw,
  RotateCw,
  Plus,
  Pencil,
  Trash2,
  Eye,
  FileSpreadsheet,
  Printer,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  ShieldAlert,
  Briefcase,
  Award,
  GraduationCap,
  BookMarked,
  UserX,
  HeartPulse,
  ShieldCheck,
  FileText,
  Network,
  Layers,
  Save,
  CheckCircle2,
  XCircle,
  Columns,
} from 'lucide-react'

export interface DefinitionTypeSummary {
  code: string
  numericId: number
  nameAr: string
  nameEn: string
  domain: 'HR' | 'ORG' | 'COMMON' | 'FINANCE'
  icon: string
  isSystem: boolean
  totalItems: number
  activeItems: number
}

export interface DefinitionItem {
  id: string
  companyId: string
  typeCode: string
  code: string
  nameAr: string
  nameEn?: string | null
  description?: string | null
  sortOrder: number
  isSystem: boolean
  active: boolean
  usageCount?: number
  createdAt: string
  updatedAt: string
}

interface GeneralDefsModuleProps {
  embedded?: boolean
}

// Icon Mapping Helper
const ICON_MAP: Record<string, React.ReactNode> = {
  Briefcase: <Briefcase className="size-3.5" />,
  Award: <Award className="size-3.5" />,
  ShieldAlert: <ShieldAlert className="size-3.5" />,
  Layers: <Layers className="size-3.5" />,
  GraduationCap: <GraduationCap className="size-3.5" />,
  BookMarked: <BookMarked className="size-3.5" />,
  UserX: <UserX className="size-3.5" />,
  HeartPulse: <HeartPulse className="size-3.5" />,
  ShieldCheck: <ShieldCheck className="size-3.5" />,
  FileText: <FileText className="size-3.5" />,
  Network: <Network className="size-3.5" />,
}

export default function GeneralDefsModule({ embedded = false }: GeneralDefsModuleProps) {
  const { isRTL, locale } = useT()
  const { toast } = useToast()

  // Primary State initialized with fallback registry so table is NEVER empty
  const [types, setTypes] = useState<DefinitionTypeSummary[]>(STATIC_TYPE_SUMMARIES)
  const [selectedType, setSelectedType] = useState<DefinitionTypeSummary | null>(STATIC_TYPE_SUMMARIES[0] || null)
  const [items, setItems] = useState<DefinitionItem[]>(() => getStaticSeedItems(STATIC_TYPE_SUMMARIES[0]?.code || 'ACCOUNT_GROUP'))

  const [loadingTypes, setLoadingTypes] = useState(false)
  const [loadingItems, setLoadingItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // View Mode: 'TABLE' (Categories) vs Items Detail Active
  const [itemsViewActive, setItemsViewActive] = useState(false)

  // Selection & Highlight State
  const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(STATIC_TYPE_SUMMARIES[0]?.code || null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([])

  // Search & Filters
  const [searchCategory, setSearchCategory] = useState('')
  const [searchItem, setSearchItem] = useState('')
  const [activeDomainFilter, setActiveDomainFilter] = useState<'ALL' | 'HR' | 'ORG' | 'COMMON' | 'FINANCE'>('ALL')
  const [itemStatusFilter, setItemStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Pagination for Categories
  const [pageSize, setPageSize] = useState(20)
  const [currentPage, setCurrentPage] = useState(1)

  // Pagination for Items
  const [itemsPageSize, setItemsPageSize] = useState(20)
  const [itemsCurrentPage, setItemsCurrentPage] = useState(1)

  // Column Widths for Types Table
  const DEFAULT_TYPE_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      numericId: 80,
      name: 260,
      code: 160,
      domain: 130,
      itemCount: 140,
      actions: 100,
    }),
    []
  )
  const [typeColWidths, setTypeColWidths] = useState<Record<string, number>>(DEFAULT_TYPE_COL_WIDTHS)

  // Column Widths for Items Table
  const DEFAULT_ITEM_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      checkbox: 44,
      index: 50,
      code: 130,
      name: 250,
      active: 110,
      sortOrder: 80,
      description: 240,
      actions: 90,
    }),
    []
  )
  const [itemColWidths, setItemColWidths] = useState<Record<string, number>>(DEFAULT_ITEM_COL_WIDTHS)

  // Visible columns for Categories
  const DEFAULT_TYPE_VISIBLE_COLS = useMemo<Record<string, boolean>>(
    () => ({
      numericId: true,
      name: true,
      code: true,
      domain: true,
      itemCount: true,
      actions: true,
    }),
    []
  )
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(DEFAULT_TYPE_VISIBLE_COLS)

  // Visible columns for Items
  const DEFAULT_ITEM_VISIBLE_COLS = useMemo<Record<string, boolean>>(
    () => ({
      checkbox: true,
      index: true,
      code: true,
      name: true,
      active: true,
      sortOrder: true,
      description: true,
      actions: true,
    }),
    []
  )
  const [visibleItemColumns, setVisibleItemColumns] = useState<Record<string, boolean>>(DEFAULT_ITEM_VISIBLE_COLS)

  // Column Resizing Handlers
  const handleTypeResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = typeColWidths[colKey] || DEFAULT_TYPE_COL_WIDTHS[colKey] || 100

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = isRTL ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      setTypeColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const handleItemResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = itemColWidths[colKey] || DEFAULT_ITEM_COL_WIDTHS[colKey] || 100

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = isRTL ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(40, startWidth + deltaX)
      setItemColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DefinitionItem | null>(null)
  const [formData, setFormData] = useState({
    code: '',
    nameAr: '',
    nameEn: '',
    description: '',
    sortOrder: 0,
    active: true,
  })
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Dialog State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<DefinitionItem | null>(null)

  // i18n Label Helper
  const L = (ar: string, en: string) => (locale === 'en' ? en || ar : ar)

  // Fetch Definition Types from API with Graceful Fallback
  const fetchTypes = async (autoSelectCode?: string) => {
    try {
      setLoadingTypes(true)
      const res = await fetch('/api/erp/general-definitions?mode=types&seed=true')
      const json = await res.json()
      if (res.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
        setTypes(json.data)
        const target = autoSelectCode
          ? json.data.find((t: DefinitionTypeSummary) => t.code === autoSelectCode)
          : selectedType
            ? json.data.find((t: DefinitionTypeSummary) => t.code === selectedType.code)
            : json.data[0]

        if (target) {
          setSelectedType(target)
          setSelectedCategoryCode(target.code)
        }
      } else {
        setTypes(STATIC_TYPE_SUMMARIES)
      }
    } catch (_err) {
      setTypes(STATIC_TYPE_SUMMARIES)
    } finally {
      setLoadingTypes(false)
    }
  }

  // Fetch Items for Selected Definition Type
  const fetchItems = async (typeCode: string) => {
    try {
      setLoadingItems(true)
      const query = searchItem.trim() ? `&q=${encodeURIComponent(searchItem.trim())}` : ''
      const res = await fetch(`/api/erp/general-definitions?typeCode=${typeCode}${query}`)
      const json = await res.json()
      if (res.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
        setItems(json.data)
      } else {
        setItems(getStaticSeedItems(typeCode))
      }
    } catch (_err) {
      setItems(getStaticSeedItems(typeCode))
    } finally {
      setLoadingItems(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  useEffect(() => {
    if (selectedType) {
      fetchItems(selectedType.code)
    }
  }, [selectedType, searchItem])

  // Filtered Categories
  const filteredTypes = useMemo(() => {
    return types.filter((t) => {
      const matchDomain = activeDomainFilter === 'ALL' || t.domain === activeDomainFilter
      const q = searchCategory.toLowerCase().trim()
      const matchSearch =
        !q ||
        t.nameAr.toLowerCase().includes(q) ||
        t.nameEn.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        String(t.numericId).includes(q)
      return matchDomain && matchSearch
    })
  }, [types, activeDomainFilter, searchCategory])

  // Paginated Categories
  const totalPages = Math.ceil(filteredTypes.length / pageSize) || 1
  const paginatedTypes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredTypes.slice(start, start + pageSize)
  }, [filteredTypes, currentPage, pageSize])

  // Filtered Items
  const filteredItems = useMemo(() => {
    const q = searchItem.toLowerCase().trim()
    return items.filter((item) => {
      const matchesSearch =
        !q ||
        item.nameAr.toLowerCase().includes(q) ||
        (item.nameEn && item.nameEn.toLowerCase().includes(q)) ||
        item.code.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      const matchesStatus =
        itemStatusFilter === 'all'
          ? true
          : itemStatusFilter === 'active'
            ? item.active
            : !item.active
      return matchesSearch && matchesStatus
    })
  }, [items, searchItem, itemStatusFilter])

  // Paginated Items
  const itemsTotalPages = Math.ceil(filteredItems.length / itemsPageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (itemsCurrentPage - 1) * itemsPageSize
    return filteredItems.slice(start, start + itemsPageSize)
  }, [filteredItems, itemsCurrentPage, itemsPageSize])

  // Selected item derivation
  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) || null,
    [items, selectedItemId]
  )

  // Selected category derivation
  const selectedCategory = useMemo(
    () => types.find((t) => t.code === selectedCategoryCode) || selectedType || null,
    [types, selectedCategoryCode, selectedType]
  )

  // Handler for Selecting/Opening a Category (Double Click or View Button)
  const handleSelectCategory = (type: DefinitionTypeSummary) => {
    setSelectedType(type)
    setSelectedCategoryCode(type.code)
    setSelectedItemId(null)
    setCheckedItemIds([])
    setItemsViewActive(true)
    setItemsCurrentPage(1)
    fetchItems(type.code)
  }

  // Open Add Dialog
  const handleOpenAdd = () => {
    if (!selectedType) return
    setEditingItem(null)
    setFormData({
      code: '',
      nameAr: '',
      nameEn: '',
      description: '',
      sortOrder: (items.length + 1) * 10,
      active: true,
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  // Open Edit Dialog
  const handleOpenEdit = (item?: DefinitionItem | null) => {
    const target = item || selectedItem || items[0]
    if (!target) {
      toast({
        title: L('تنبيه', 'Notice'),
        description: L('يرجى تحديد عنصر أولاً لتعديله.', 'Please select an item first to edit.'),
      })
      return
    }
    setEditingItem(target)
    setFormData({
      code: target.code,
      nameAr: target.nameAr,
      nameEn: target.nameEn || '',
      description: target.description || '',
      sortOrder: target.sortOrder,
      active: target.active,
    })
    setFormError(null)
    setIsFormOpen(true)
  }

  // Save Item Handler
  const handleSaveItem = async () => {
    if (!selectedType) return
    setFormError(null)

    if (!formData.nameAr.trim()) {
      setFormError(L('الاسم العربي مطلوب.', 'Arabic Name is required.'))
      return
    }

    if (!editingItem && !formData.code.trim()) {
      setFormError(L('رمز التعريف مطلوب.', 'Definition Code is required.'))
      return
    }

    try {
      setSubmitting(true)
      if (editingItem) {
        const res = await fetch(`/api/erp/general-definitions/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: formData.code,
            nameAr: formData.nameAr,
            nameEn: formData.nameEn,
            description: formData.description,
            sortOrder: formData.sortOrder,
            active: formData.active,
          }),
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error?.message || json.message || L('فشل تعديل البيانات.', 'Failed to update.'))
        }

        toast({
          title: L('تم التعديل بنجاح', 'Updated Successfully'),
          description: L(`تم تحديث «${formData.nameAr}».`, `Updated "${formData.nameAr}".`),
        })
      } else {
        const res = await fetch('/api/erp/general-definitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            typeCode: selectedType.code,
            code: formData.code,
            nameAr: formData.nameAr,
            nameEn: formData.nameEn,
            description: formData.description,
            sortOrder: formData.sortOrder,
            active: formData.active,
          }),
        })
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error?.message || json.message || L('فشل حفظ العنصر الجديد.', 'Failed to create.'))
        }

        toast({
          title: L('تم الحفظ بنجاح', 'Saved Successfully'),
          description: L(`تمت إضافة «${formData.nameAr}».`, `Added "${formData.nameAr}".`),
        })
      }

      setIsFormOpen(false)
      fetchItems(selectedType.code)
      fetchTypes(selectedType.code)
    } catch (err: any) {
      setFormError(err.message || L('حدث خطأ أثناء الحفظ.', 'An error occurred while saving.'))
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Prompt
  const handleOpenDelete = (item?: DefinitionItem | null) => {
    const target = item || selectedItem
    if (!target) {
      toast({
        title: L('تنبيه', 'Notice'),
        description: L('يرجى تحديد عنصر أولاً لحذفه.', 'Please select an item first to delete.'),
      })
      return
    }
    setDeletingItem(target)
    setIsDeleteOpen(true)
  }

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!deletingItem || !selectedType) return
    try {
      setSubmitting(true)
      const res = await fetch(`/api/erp/general-definitions/${deletingItem.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error?.message || json.message || L('تعذر حذف السجل.', 'Failed to delete definition.'))
      }

      toast({
        title: L('تم الحذف بنجاح', 'Deleted successfully'),
        description: json.data?.message || L('تم إزالة عنصر التعريف.', 'Definition item removed.'),
      })

      setIsDeleteOpen(false)
      setDeletingItem(null)
      setSelectedItemId(null)
      fetchItems(selectedType.code)
      fetchTypes(selectedType.code)
    } catch (err: any) {
      toast({
        title: L('تعذر الحذف', 'Delete Blocked'),
        description: err.message,
        variant: 'destructive',
      })
      setIsDeleteOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Toggle Item Active/Disable State
  const handleToggleItemActive = async (item: DefinitionItem) => {
    try {
      const res = await fetch(`/api/erp/general-definitions/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      })
      if (res.ok) {
        toast({
          title: !item.active ? L('تم التفعيل', 'Activated') : L('تم التوقيف', 'Deactivated'),
          description: !item.active
            ? L(`تم تنشيط عنصر «${item.nameAr}».`, `Activated "${item.nameAr}".`)
            : L(`تم توقيف عنصر «${item.nameAr}».`, `Deactivated "${item.nameAr}".`),
        })
        if (selectedType) {
          fetchItems(selectedType.code)
          fetchTypes(selectedType.code)
        }
      }
    } catch (_err) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, active: !i.active } : i))
      )
    }
  }

  // Export Handlers (CSV, Excel, Word, PDF)
  const handleExportCSV = () => {
    if (itemsViewActive && selectedType) {
      const headers = ['#', L('الرمز', 'Code'), L('الاسم بالعربية', 'Arabic Name'), L('الاسم بالإنجليزية', 'English Name'), L('الحالة', 'Status'), L('الترتيب', 'Sort'), L('ملاحظات', 'Notes')]
      const rows = filteredItems.map((item, idx) => [
        idx + 1,
        item.code,
        `"${(item.nameAr || '').replace(/"/g, '""')}"`,
        `"${(item.nameEn || '').replace(/"/g, '""')}"`,
        item.active ? L('نشط', 'Active') : L('موقوف', 'Inactive'),
        item.sortOrder,
        `"${(item.description || '').replace(/"/g, '""')}"`,
      ])
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `general-defs-${selectedType.code}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const headers = [L('الرقم', 'ID'), L('الاسم بالعربية', 'Arabic Name'), L('الاسم بالإنجليزية', 'English Name'), L('الرمز', 'Code'), L('النطاق', 'Domain'), L('العناصر النشطة', 'Active Items'), L('إجمالي العناصر', 'Total Items')]
      const rows = filteredTypes.map((t) => [
        t.numericId,
        `"${(t.nameAr || '').replace(/"/g, '""')}"`,
        `"${(t.nameEn || '').replace(/"/g, '""')}"`,
        t.code,
        t.domain,
        t.activeItems,
        t.totalItems,
      ])
      const csv = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `general-definition-types-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const handleExportWord = () => {
    const isItems = itemsViewActive && selectedType
    const title = isItems
      ? `${L('عناصر التعريف:', 'Definition Items:')} ${isRTL ? selectedType.nameAr : selectedType.nameEn}`
      : L('قائمة أنواع التعريفات العامة', 'General Definition Categories')
    const headers = isItems
      ? ['#', L('الرمز', 'Code'), L('الاسم', 'Name'), L('الحالة', 'Status'), L('الترتيب', 'Sort'), L('ملاحظات', 'Notes')]
      : [L('الرقم', 'ID'), L('الاسم', 'Name'), L('الرمز النظامي', 'Code'), L('النطاق', 'Domain'), L('عدد العناصر', 'Count')]

    const rowsHtml = isItems
      ? filteredItems.map((item, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${item.code}</td>
            <td>${isRTL ? item.nameAr : item.nameEn || item.nameAr}</td>
            <td>${item.active ? L('نشط', 'Active') : L('موقوف', 'Inactive')}</td>
            <td>${item.sortOrder}</td>
            <td>${item.description || '-'}</td>
          </tr>
        `).join('')
      : filteredTypes.map((t) => `
          <tr>
            <td>${t.numericId}</td>
            <td>${isRTL ? t.nameAr : t.nameEn}</td>
            <td>${t.code}</td>
            <td>${t.domain}</td>
            <td>${t.activeItems} / ${t.totalItems}</td>
          </tr>
        `).join('')

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'}; padding: 20px; }
        table { border-collapse: collapse; width: 100%; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: ${isRTL ? 'right' : 'left'}; }
        th { background-color: #f1f5f9; font-weight: bold; }
        h2 { color: #1e3a8a; }
      </style>
      </head>
      <body>
        <h2>${title}</h2>
        <table>
          <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `
    const blob = new Blob(['\uFEFF' + content], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${isItems ? 'general-defs-items' : 'general-defs-categories'}-${new Date().toISOString().split('T')[0]}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const isItems = itemsViewActive && selectedType
    const title = isItems
      ? `${L('عناصر التعريف:', 'Definition Items:')} ${isRTL ? selectedType.nameAr : selectedType.nameEn}`
      : L('أنواع التعريفات العامة', 'General Definition Types')
    const headers = isItems
      ? ['#', L('الرمز', 'Code'), L('الاسم', 'Name'), L('الحالة', 'Status'), L('الترتيب', 'Sort'), L('ملاحظات', 'Notes')]
      : [L('الرقم', 'ID'), L('الاسم', 'Name'), L('الرمز النظامي', 'Code'), L('النطاق', 'Domain'), L('عدد العناصر', 'Count')]

    const rowsHtml = isItems
      ? filteredItems.map((item, idx) => `
          <tr>
            <td style="text-align:center;">${idx + 1}</td>
            <td style="font-weight:bold; font-family:monospace;">${item.code}</td>
            <td>${isRTL ? item.nameAr : item.nameEn || item.nameAr}</td>
            <td style="text-align:center;">
              <span class="badge ${item.active ? 'badge-active' : 'badge-inactive'}">
                ${item.active ? L('نشط', 'Active') : L('موقوف', 'Inactive')}
              </span>
            </td>
            <td style="text-align:center;">${item.sortOrder}</td>
            <td>${item.description || '-'}</td>
          </tr>
        `).join('')
      : filteredTypes.map((t) => `
          <tr>
            <td style="text-align:center; font-weight:bold;">${t.numericId}</td>
            <td style="font-weight:600;">${isRTL ? t.nameAr : t.nameEn}</td>
            <td style="font-family:monospace;">${t.code}</td>
            <td style="text-align:center;">${t.domain}</td>
            <td style="text-align:center;">${t.activeItems} / ${t.totalItems}</td>
          </tr>
        `).join('')

    const printWin = window.open('', '_blank')
    if (!printWin) {
      window.print()
      return
    }

    const content = `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}">
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; direction: ${isRTL ? 'rtl' : 'ltr'}; color: #1e293b; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: bold; color: #1e3a8a; }
          .info { font-size: 12px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: ${isRTL ? 'right' : 'left'}; }
          th { background: #f1f5f9; color: #0f172a; font-weight: bold; }
          tr:nth-child(even) { background: #f8fafc; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge-active { background: #dcfce7; color: #166534; }
          .badge-inactive { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">أورمينال تك - ORMINAL ERP</div>
          <div class="info">${L('تاريخ التقرير:', 'Report Date:')} ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</div>
        </div>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        <div class="footer">${L('تم إنشاء المستند تلقائياً عبر نظام Orminal ERP', 'Document generated by Orminal ERP System')}</div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `
    printWin.document.write(content)
    printWin.document.close()
  }

  return (
    <div className={`space-y-3 sm:space-y-4 w-full ${embedded ? 'p-1' : 'p-2 sm:p-4'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Header Banner & Navigation Path */}
      <div className="rounded-lg overflow-hidden border border-border shadow-xs">
        {/* Top Dark Blue Title Bar */}
        <div className="bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 overflow-hidden">
            <div className="p-1 rounded bg-white/15 backdrop-blur-sm text-white shrink-0">
              <LayoutGrid className="size-4" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-semibold truncate">
              <span
                className="cursor-pointer hover:underline truncate"
                onClick={() => setItemsViewActive(false)}
              >
                {L('التعريفات العامة', 'General Definitions')}
              </span>
              {itemsViewActive && selectedType && (
                <>
                  <span className="shrink-0 opacity-70">/</span>
                  <span className="text-amber-300 font-bold truncate">
                    {isRTL ? selectedType.nameAr : selectedType.nameEn}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/15 size-7"
              onClick={() => {
                fetchTypes()
                if (selectedType) fetchItems(selectedType.code)
              }}
              title={L('تحديث البيانات', 'Refresh Data')}
            >
              <RotateCw className={`size-3.5 ${loadingTypes || loadingItems ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Sub Header & Breadcrumb when viewing Items */}
        {itemsViewActive && selectedType && (
          <div className="bg-slate-50 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 text-xs px-3 sm:px-4 py-1.5 border-t border-border flex flex-wrap items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-xs border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-50/60 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0"
              onClick={() => setItemsViewActive(false)}
            >
              {isRTL ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
              <span>{L(' رجوع', 'Back')}</span>
            </Button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-xs shrink-0 font-mono">
                {L('النوع', 'Type')}: {selectedType.numericId}
              </span>
              <span className="font-bold text-xs text-foreground truncate">
                {isRTL ? selectedType.nameAr : selectedType.nameEn}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                {selectedType.code}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* 2. Main Card Container containing Grouping Banner, Toolbar, Table & Pagination */}
      <Card className="border border-border shadow-xs rounded-lg overflow-hidden bg-card">
        {/* TOP INFO & GROUPING BANNER (Identical to FiscalPeriodsModule & OrgStructureModule) */}


        {/* ACTION TOOLBAR (Fully Responsive for Mobile & Desktop - Identical to FiscalPeriodsModule) */}
        <div className="p-2 sm:p-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
          {/* Search, Columns & Filter Pills */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Row 1 on mobile: Search Box + Columns Dropdown */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">

              {/* Columns Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs bg-background shrink-0">
                    <span>{L('أعمدة', 'Columns')}</span>
                    <ChevronLeft className="size-3 -rotate-90 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52 max-h-80 overflow-y-auto">
                  <DropdownMenuLabel className="text-xs">
                    {itemsViewActive
                      ? L('أعمدة عناصر التعريف', 'Definition Items Columns')
                      : L('أعمدة أنواع التعريفات', 'Category Columns')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {itemsViewActive ? (
                    <>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.index}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, index: !!v }))}
                      >
                        # {L('التسلسل', 'Index')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.code}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, code: !!v }))}
                      >
                        {L('الرمز', 'Code')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.name}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, name: !!v }))}
                      >
                        {L('الاسم', 'Name')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.active}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, active: !!v }))}
                      >
                        {L('الحالة', 'Status')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.sortOrder}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, sortOrder: !!v }))}
                      >
                        {L('الترتيب', 'Sort Order')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.description}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, description: !!v }))}
                      >
                        {L('ملاحظات', 'Notes')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleItemColumns.actions}
                        onCheckedChange={(v) => setVisibleItemColumns((p) => ({ ...p, actions: !!v }))}
                      >
                        {L('الإجراءات', 'Actions')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => setVisibleItemColumns(DEFAULT_ITEM_VISIBLE_COLS)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer justify-center py-1.5"
                      >
                        {L('إعادة ضبط الأعمدة الافتراضية', 'Reset Default Columns')}
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.numericId}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, numericId: !!v }))}
                      >
                        {L('النوع / الرقم', 'Type ID')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.name}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, name: !!v }))}
                      >
                        {L('الاسم', 'Name')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.code}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, code: !!v }))}
                      >
                        {L('الرمز النظامي', 'System Code')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.domain}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, domain: !!v }))}
                      >
                        {L('النطاق', 'Domain')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.itemCount}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, itemCount: !!v }))}
                      >
                        {L('عدد العناصر', 'Items Count')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={visibleColumns.actions}
                        onCheckedChange={(v) => setVisibleColumns((p) => ({ ...p, actions: !!v }))}
                      >
                        {L('الإجراءات', 'Actions')}
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => setVisibleColumns(DEFAULT_TYPE_VISIBLE_COLS)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer justify-center py-1.5"
                      >
                        {L('إعادة ضبط الأعمدة الافتراضية', 'Reset Default Columns')}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-56 min-w-0">
                <Search className={cn('size-3.5 absolute top-2.5 text-muted-foreground pointer-events-none', isRTL ? 'right-2.5' : 'left-2.5')} />
                <Input
                  value={itemsViewActive ? searchItem : searchCategory}
                  onChange={(e) => {
                    if (itemsViewActive) {
                      setSearchItem(e.target.value)
                      setItemsCurrentPage(1)
                    } else {
                      setSearchCategory(e.target.value)
                      setCurrentPage(1)
                    }
                  }}
                  placeholder={
                    itemsViewActive
                      ? L('بحث في عناصر التعريف…', 'Search items…')
                      : L('بحث في أنواع التعريفات…', 'Search categories…')
                  }
                  className={cn('h-8 text-xs bg-background w-full', isRTL ? 'pr-7 pl-6' : 'pl-7 pr-6')}
                />
                {(itemsViewActive ? searchItem : searchCategory) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (itemsViewActive) {
                        setSearchItem('')
                        setItemsCurrentPage(1)
                      } else {
                        setSearchCategory('')
                        setCurrentPage(1)
                      }
                    }}
                    className={cn('absolute top-2 text-muted-foreground hover:text-foreground', isRTL ? 'left-2' : 'right-2')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2 on mobile: Filter Pills */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
              {itemsViewActive ? (
                /* Item Status Filter Pills */
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setItemStatusFilter('all')
                      setItemsCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap",
                      itemStatusFilter === 'all'
                        ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {L('الكل', 'All')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemStatusFilter('active')
                      setItemsCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      itemStatusFilter === 'active'
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {L('نشط', 'Active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setItemStatusFilter('inactive')
                      setItemsCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      itemStatusFilter === 'inactive'
                        ? "bg-rose-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-rose-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-rose-400" />
                    {L('موقوف', 'Inactive')}
                  </button>
                </div>
              ) : (
                /* Category Domain Filter Pills */
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0 overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter('ALL')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap",
                      activeDomainFilter === 'ALL'
                        ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {L('الكل', 'All')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter('HR')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      activeDomainFilter === 'HR'
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-blue-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-blue-400" />
                    {L('الموارد البشرية', 'HR')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter('ORG')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      activeDomainFilter === 'ORG'
                        ? "bg-amber-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-amber-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    {L('المؤسسة', 'Organization')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter('FINANCE')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      activeDomainFilter === 'FINANCE'
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {L('مالية', 'Finance')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveDomainFilter('COMMON')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                      activeDomainFilter === 'COMMON'
                        ? "bg-purple-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-purple-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-purple-400" />
                    {L('عامة', 'Common')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Row 3 on mobile (Right Group on Desktop): Action Tools & Action Buttons */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full lg:w-auto pt-1 sm:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-slate-800">
            {/* Tool Icons: Export, Print, Refresh */}
            <div className="flex items-center gap-1">
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                    title={L('خيارات التصدير (Excel, CSV, Word, PDF)', 'Export Options (Excel, CSV, Word, PDF)')}
                  >
                    <FileSpreadsheet className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} sideOffset={6} className="w-48 shadow-xl border-slate-200 dark:border-slate-800 z-50">
                  <DropdownMenuItem onClick={handleExportCSV} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{L('Excel / CSV', 'Excel / CSV')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileText className="size-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{L('Word', 'Word')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Printer className="size-4 text-red-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{L('PDF / طباعة', 'PDF / Print')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Print Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                onClick={handleExportPDF}
                title={L('طباعة الجدول', 'Print Table')}
              >
                <Printer className="size-4" />
              </Button>

              {/* Refresh Button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                onClick={() => {
                  fetchTypes()
                  if (selectedType) fetchItems(selectedType.code)
                  toast({
                    title: L('تم التحديث', 'Refreshed'),
                    description: L('تم تحديث البيانات بنجاح', 'Data refreshed successfully'),
                  })
                }}
                title={L('تحديث البيانات', 'Refresh Data')}
              >
                <RotateCw className={`size-4 ${loadingTypes || loadingItems ? 'animate-spin' : ''}`} />
              </Button>

              {/* View / Open Category Button (Categories view) */}
              {!itemsViewActive && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedCategory}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedCategory
                      ? "text-primary hover:bg-primary/10 shadow-xs hover:scale-105"
                      : "text-slate-400 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedCategory) handleSelectCategory(selectedCategory)
                  }}
                  title={L('عرض عناصر التعريف', 'View definition items')}
                >
                  <Eye className="size-4" />
                </Button>
              )}
            </div>

            {/* Action Buttons for Items */}
            {itemsViewActive && selectedType && (
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Toggle Active Status */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem
                      ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 shadow-xs hover:scale-105"
                      : "text-slate-400 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) handleToggleItemActive(selectedItem)
                  }}
                  title={
                    selectedItem
                      ? selectedItem.active
                        ? L('توقيف العنصر المحدد', 'Deactivate selected item')
                        : L('تنشيط العنصر المحدد', 'Activate selected item')
                      : L('اختر عنصراً لتغيير حالته', 'Select an item to change status')
                  }
                >
                  <Lock className="size-4" />
                </Button>

                {/* Edit Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem
                      ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs hover:scale-105"
                      : "text-amber-300 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) handleOpenEdit(selectedItem)
                  }}
                  title={L('تعديل العنصر المحدد', 'Edit selected item')}
                >
                  <Pencil className="size-4" />
                </Button>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all",
                    selectedItem
                      ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs hover:scale-105"
                      : "text-rose-300 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) handleOpenDelete(selectedItem)
                  }}
                  title={L('حذف العنصر المحدد', 'Delete selected item')}
                >
                  <Trash2 className="size-4" />
                </Button>

                {/* Add New Item Button */}
                <Button
                  size="sm"
                  className="h-8 px-2.5 gap-1 text-xs bg-primary hover:bg-primary/90 font-semibold shrink-0"
                  onClick={handleOpenAdd}
                >
                  <Plus className="size-3.5" />
                  <span>{L('إضافة', 'Add')}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 3. MAIN GRID TABLE (HIGH-DENSITY ERP STANDARD: h-8, text-[11px], fixed columns) */}
        {!itemsViewActive ? (
          /* ========================================================
             TABLE 1: CATEGORIES / DEFINITION TYPES TABLE
             ======================================================== */
          <div className="overflow-x-auto min-h-[380px] w-full">
            <Table className="min-w-[800px] border-collapse text-[11px] table-fixed">
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                  {visibleColumns.numericId && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.numericId || 80}px`,
                        minWidth: `${typeColWidths.numericId || 80}px`,
                        maxWidth: `${typeColWidths.numericId || 80}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{L('الرقم', 'ID')}</span>
                      <div
                        onMouseDown={(e) => handleTypeResizeStart('numericId', e)}
                        onDoubleClick={() => setTypeColWidths((p) => ({ ...p, numericId: DEFAULT_TYPE_COL_WIDTHS.numericId }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleColumns.name && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.name || 260}px`,
                        minWidth: `${typeColWidths.name || 260}px`,
                        maxWidth: `${typeColWidths.name || 260}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="truncate">{L('اسم التعريف', 'Category Name')}</span>
                      <div
                        onMouseDown={(e) => handleTypeResizeStart('name', e)}
                        onDoubleClick={() => setTypeColWidths((p) => ({ ...p, name: DEFAULT_TYPE_COL_WIDTHS.name }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleColumns.code && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.code || 160}px`,
                        minWidth: `${typeColWidths.code || 160}px`,
                        maxWidth: `${typeColWidths.code || 160}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="truncate">{L('الرمز النظامي', 'System Code')}</span>
                      <div
                        onMouseDown={(e) => handleTypeResizeStart('code', e)}
                        onDoubleClick={() => setTypeColWidths((p) => ({ ...p, code: DEFAULT_TYPE_COL_WIDTHS.code }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleColumns.domain && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.domain || 130}px`,
                        minWidth: `${typeColWidths.domain || 130}px`,
                        maxWidth: `${typeColWidths.domain || 130}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{L('النطاق', 'Domain')}</span>
                      <div
                        onMouseDown={(e) => handleTypeResizeStart('domain', e)}
                        onDoubleClick={() => setTypeColWidths((p) => ({ ...p, domain: DEFAULT_TYPE_COL_WIDTHS.domain }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleColumns.itemCount && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.itemCount || 140}px`,
                        minWidth: `${typeColWidths.itemCount || 140}px`,
                        maxWidth: `${typeColWidths.itemCount || 140}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{L('عدد العناصر (نشط / كلي)', 'Items (Active / Total)')}</span>
                      <div
                        onMouseDown={(e) => handleTypeResizeStart('itemCount', e)}
                        onDoubleClick={() => setTypeColWidths((p) => ({ ...p, itemCount: DEFAULT_TYPE_COL_WIDTHS.itemCount }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleColumns.actions && (
                    <TableHead
                      style={{
                        width: `${typeColWidths.actions || 100}px`,
                        minWidth: `${typeColWidths.actions || 100}px`,
                        maxWidth: `${typeColWidths.actions || 100}px`,
                      }}
                      className="font-bold py-1.5 px-2 text-center whitespace-nowrap select-none"
                    >
                      <span>{L('الإجراءات', 'Actions')}</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingTypes ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="h-8 border-b border-slate-200 dark:border-slate-700">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                      {L('لا توجد نتائج مطابقة للبحث المحدد', 'No matching categories found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTypes.map((type) => {
                    const isSelected = selectedCategoryCode === type.code

                    return (
                      <TableRow
                        key={type.code}
                        data-selected={isSelected || undefined}
                        onClick={() => {
                          setSelectedCategoryCode(type.code)
                          setSelectedType(type)
                        }}
                        onDoubleClick={() => handleSelectCategory(type)}
                        className={cn(
                          "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                          isSelected
                            ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        )}
                        style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                      >
                        {visibleColumns.numericId && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.numericId || 80}px`,
                              minWidth: `${typeColWidths.numericId || 80}px`,
                              maxWidth: `${typeColWidths.numericId || 80}px`,
                            }}
                            className="text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            {type.numericId}
                          </TableCell>
                        )}

                        {visibleColumns.name && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.name || 260}px`,
                              minWidth: `${typeColWidths.name || 260}px`,
                              maxWidth: `${typeColWidths.name || 260}px`,
                            }}
                            className="font-medium text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="p-0.5 rounded bg-primary/10 text-primary shrink-0">
                                {ICON_MAP[type.icon] || <Layers className="size-3.5" />}
                              </span>
                              <span className="truncate block w-full cursor-default font-semibold" title={isRTL ? type.nameAr : type.nameEn}>
                                {isRTL ? type.nameAr : type.nameEn}
                              </span>
                            </div>
                          </TableCell>
                        )}

                        {visibleColumns.code && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.code || 160}px`,
                              minWidth: `${typeColWidths.code || 160}px`,
                              maxWidth: `${typeColWidths.code || 160}px`,
                            }}
                            className="font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <span className="truncate block w-full" title={type.code}>
                              {type.code}
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.domain && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.domain || 130}px`,
                              minWidth: `${typeColWidths.domain || 130}px`,
                              maxWidth: `${typeColWidths.domain || 130}px`,
                            }}
                            className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            <span
                              className={cn(
                                "inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold",
                                type.domain === 'HR' && "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800",
                                type.domain === 'ORG' && "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                                type.domain === 'FINANCE' && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
                                type.domain === 'COMMON' && "bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800"
                              )}
                            >
                              {type.domain}
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.itemCount && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.itemCount || 140}px`,
                              minWidth: `${typeColWidths.itemCount || 140}px`,
                              maxWidth: `${typeColWidths.itemCount || 140}px`,
                            }}
                            className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            <span className="inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[10px]">
                              <span className="text-emerald-600 dark:text-emerald-400">{type.activeItems}</span>
                              <span className="text-slate-400">/</span>
                              <span>{type.totalItems}</span>
                            </span>
                          </TableCell>
                        )}

                        {visibleColumns.actions && (
                          <TableCell
                            style={{
                              width: `${typeColWidths.actions || 100}px`,
                              minWidth: `${typeColWidths.actions || 100}px`,
                              maxWidth: `${typeColWidths.actions || 100}px`,
                            }}
                            className="text-center py-1 px-1 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px] gap-1 border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => handleSelectCategory(type)}
                            >
                              <Eye className="size-3" />
                              <span>{L('عرض', 'View')}</span>
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          /* ========================================================
             TABLE 2: CATEGORY ITEMS TABLE
             ======================================================== */
          <div className="overflow-x-auto min-h-[380px] w-full">
            <Table className="min-w-[860px] border-collapse text-[11px] table-fixed">
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                  {visibleItemColumns.checkbox && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.checkbox || 44}px`,
                        minWidth: `${itemColWidths.checkbox || 44}px`,
                        maxWidth: `${itemColWidths.checkbox || 44}px`,
                      }}
                      className="w-11 text-center py-1.5 px-1 border-r border-slate-200 dark:border-slate-800 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checkedItemIds.length > 0 && checkedItemIds.length === items.length}
                        onChange={(e) => {
                          if (e.target.checked) setCheckedItemIds(items.map((i) => i.id))
                          else setCheckedItemIds([])
                        }}
                        className="size-3.5 rounded border-input align-middle cursor-pointer"
                      />
                    </TableHead>
                  )}

                  {visibleItemColumns.index && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.index || 50}px`,
                        minWidth: `${itemColWidths.index || 50}px`,
                        maxWidth: `${itemColWidths.index || 50}px`,
                      }}
                      className="font-bold py-1.5 px-1 border-r border-slate-200 dark:border-slate-800 text-center select-none"
                    >
                      #
                    </TableHead>
                  )}

                  {visibleItemColumns.code && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.code || 130}px`,
                        minWidth: `${itemColWidths.code || 130}px`,
                        maxWidth: `${itemColWidths.code || 130}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="truncate">{L('الرمز', 'Code')}</span>
                      <div
                        onMouseDown={(e) => handleItemResizeStart('code', e)}
                        onDoubleClick={() => setItemColWidths((p) => ({ ...p, code: DEFAULT_ITEM_COL_WIDTHS.code }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleItemColumns.name && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.name || 250}px`,
                        minWidth: `${itemColWidths.name || 250}px`,
                        maxWidth: `${itemColWidths.name || 250}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="truncate">{L('الاسم', 'Name')}</span>
                      <div
                        onMouseDown={(e) => handleItemResizeStart('name', e)}
                        onDoubleClick={() => setItemColWidths((p) => ({ ...p, name: DEFAULT_ITEM_COL_WIDTHS.name }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleItemColumns.active && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.active || 110}px`,
                        minWidth: `${itemColWidths.active || 110}px`,
                        maxWidth: `${itemColWidths.active || 110}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{L('الحالة', 'Status')}</span>
                      <div
                        onMouseDown={(e) => handleItemResizeStart('active', e)}
                        onDoubleClick={() => setItemColWidths((p) => ({ ...p, active: DEFAULT_ITEM_COL_WIDTHS.active }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleItemColumns.sortOrder && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.sortOrder || 80}px`,
                        minWidth: `${itemColWidths.sortOrder || 80}px`,
                        maxWidth: `${itemColWidths.sortOrder || 80}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{L('الترتيب', 'Sort')}</span>
                      <div
                        onMouseDown={(e) => handleItemResizeStart('sortOrder', e)}
                        onDoubleClick={() => setItemColWidths((p) => ({ ...p, sortOrder: DEFAULT_ITEM_COL_WIDTHS.sortOrder }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleItemColumns.description && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.description || 240}px`,
                        minWidth: `${itemColWidths.description || 240}px`,
                        maxWidth: `${itemColWidths.description || 240}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <span className="truncate">{L('ملاحظات', 'Notes')}</span>
                      <div
                        onMouseDown={(e) => handleItemResizeStart('description', e)}
                        onDoubleClick={() => setItemColWidths((p) => ({ ...p, description: DEFAULT_ITEM_COL_WIDTHS.description }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={L('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleItemColumns.actions && (
                    <TableHead
                      style={{
                        width: `${itemColWidths.actions || 90}px`,
                        minWidth: `${itemColWidths.actions || 90}px`,
                        maxWidth: `${itemColWidths.actions || 90}px`,
                      }}
                      className="font-bold py-1.5 px-2 text-center whitespace-nowrap select-none"
                    >
                      <span>{L('الإجراءات', 'Actions')}</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingItems ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="h-8 border-b border-slate-200 dark:border-slate-700">
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      {L('لا توجد عناصر مسجلة في هذا التعريف حتى الآن', 'No items registered in this category yet')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const isSelected = selectedItemId === item.id
                    const isChecked = checkedItemIds.includes(item.id)

                    return (
                      <TableRow
                        key={item.id}
                        data-selected={isSelected || undefined}
                        onClick={() => setSelectedItemId(item.id)}
                        onDoubleClick={() => handleOpenEdit(item)}
                        className={cn(
                          "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                          isSelected
                            ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        )}
                        style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                      >
                        {visibleItemColumns.checkbox && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.checkbox || 44}px`,
                              minWidth: `${itemColWidths.checkbox || 44}px`,
                              maxWidth: `${itemColWidths.checkbox || 44}px`,
                            }}
                            className="text-center py-1 px-1 border-r border-slate-100 dark:border-slate-800 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) setCheckedItemIds((p) => [...p, item.id])
                                else setCheckedItemIds((p) => p.filter((id) => id !== item.id))
                              }}
                              className="size-3.5 rounded border-input align-middle cursor-pointer"
                            />
                          </TableCell>
                        )}

                        {visibleItemColumns.index && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.index || 50}px`,
                              minWidth: `${itemColWidths.index || 50}px`,
                              maxWidth: `${itemColWidths.index || 50}px`,
                            }}
                            className="text-center font-mono font-bold text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-1 overflow-hidden"
                          >
                            {(itemsCurrentPage - 1) * itemsPageSize + idx + 1}
                          </TableCell>
                        )}

                        {visibleItemColumns.code && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.code || 130}px`,
                              minWidth: `${itemColWidths.code || 130}px`,
                              maxWidth: `${itemColWidths.code || 130}px`,
                            }}
                            className="font-mono font-semibold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          >
                            <span className="truncate block w-full cursor-default" title={item.code}>
                              {item.code}
                            </span>
                          </TableCell>
                        )}

                        {visibleItemColumns.name && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.name || 250}px`,
                              minWidth: `${itemColWidths.name || 250}px`,
                              maxWidth: `${itemColWidths.name || 250}px`,
                            }}
                            className="font-medium text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate block w-full cursor-default" title={isRTL ? item.nameAr : item.nameEn || item.nameAr}>
                                {isRTL ? item.nameAr : item.nameEn || item.nameAr}
                              </span>
                              {item.nameEn && isRTL && (
                                <span className="text-[10px] text-muted-foreground font-normal shrink-0 truncate opacity-70">
                                  ({item.nameEn})
                                </span>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {visibleItemColumns.active && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.active || 110}px`,
                              minWidth: `${itemColWidths.active || 110}px`,
                              maxWidth: `${itemColWidths.active || 110}px`,
                            }}
                            className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-1.5 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleItemActive(item)}
                              className={cn(
                                "inline-flex items-center justify-center gap-1 h-5 px-1.5 rounded text-[10px] font-bold transition-all shadow-2xs cursor-pointer",
                                item.active
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-300/60 dark:border-rose-700/60"
                              )}
                              title={item.active ? L('انقر للتوقيف', 'Click to deactivate') : L('انقر للتفعيل', 'Click to activate')}
                            >
                              <span className={cn("size-1.5 rounded-full", item.active ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
                              <span>{item.active ? L('نشط', 'Active') : L('موقوف', 'Inactive')}</span>
                            </button>
                          </TableCell>
                        )}

                        {visibleItemColumns.sortOrder && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.sortOrder || 80}px`,
                              minWidth: `${itemColWidths.sortOrder || 80}px`,
                              maxWidth: `${itemColWidths.sortOrder || 80}px`,
                            }}
                            className="text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-1 overflow-hidden"
                          >
                            {item.sortOrder}
                          </TableCell>
                        )}

                        {visibleItemColumns.description && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.description || 240}px`,
                              minWidth: `${itemColWidths.description || 240}px`,
                              maxWidth: `${itemColWidths.description || 240}px`,
                            }}
                            className="text-muted-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                          >
                            <span className="truncate block text-slate-500 dark:text-slate-400" title={item.description || ''}>
                              {item.description || '—'}
                            </span>
                          </TableCell>
                        )}

                        {visibleItemColumns.actions && (
                          <TableCell
                            style={{
                              width: `${itemColWidths.actions || 90}px`,
                              minWidth: `${itemColWidths.actions || 90}px`,
                              maxWidth: `${itemColWidths.actions || 90}px`,
                            }}
                            className="text-center py-1 px-1 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                title={L('تعديل', 'Edit')}
                                onClick={() => handleOpenEdit(item)}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                title={L('حذف', 'Delete')}
                                onClick={() => handleOpenDelete(item)}
                              >
                                <Trash2 className="size-3.5" />
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
        )}

        {/* 4. PAGINATION FOOTER (Unified Design across ERP Modules) */}
        <div className="bg-card border-t border-border px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
          <div className="text-muted-foreground font-medium text-[11px]">
            {itemsViewActive ? (
              L(
                `الصفحة ${itemsCurrentPage} من ${itemsTotalPages} (إجمالي ${filteredItems.length} عنصر)`,
                `Page ${itemsCurrentPage} of ${itemsTotalPages} (${filteredItems.length} items)`
              )
            ) : (
              L(
                `الصفحة ${currentPage} من ${totalPages} (إجمالي ${filteredTypes.length} نوع)`,
                `Page ${currentPage} of ${totalPages} (${filteredTypes.length} categories)`
              )
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-[11px]">{L('العناصر في الصفحة', 'Page size')}</span>
              <select
                value={itemsViewActive ? itemsPageSize : pageSize}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (itemsViewActive) {
                    setItemsPageSize(val)
                    setItemsCurrentPage(1)
                  } else {
                    setPageSize(val)
                    setCurrentPage(1)
                  }
                }}
                className="h-7 text-xs rounded border border-input bg-background px-1.5 py-0.5"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={itemsViewActive ? itemsCurrentPage === 1 : currentPage === 1}
                onClick={() => (itemsViewActive ? setItemsCurrentPage(1) : setCurrentPage(1))}
                title={L('الصفحة الأولى', 'First page')}
              >
                {isRTL ? <ChevronsRight className="size-3.5" /> : <ChevronsLeft className="size-3.5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={itemsViewActive ? itemsCurrentPage === 1 : currentPage === 1}
                onClick={() =>
                  itemsViewActive
                    ? setItemsCurrentPage((p) => Math.max(1, p - 1))
                    : setCurrentPage((p) => Math.max(1, p - 1))
                }
                title={L('الصفحة السابقة', 'Previous page')}
              >
                {isRTL ? <ChevronRight className="size-3.5" /> : <ChevronLeft className="size-3.5" />}
              </Button>

              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {itemsViewActive ? itemsCurrentPage : currentPage}
              </span>

              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={itemsViewActive ? itemsCurrentPage >= itemsTotalPages : currentPage >= totalPages}
                onClick={() =>
                  itemsViewActive
                    ? setItemsCurrentPage((p) => Math.min(itemsTotalPages, p + 1))
                    : setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                title={L('الصفحة التالية', 'Next page')}
              >
                {isRTL ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-7"
                disabled={itemsViewActive ? itemsCurrentPage >= itemsTotalPages : currentPage >= totalPages}
                onClick={() =>
                  itemsViewActive
                    ? setItemsCurrentPage(itemsTotalPages)
                    : setCurrentPage(totalPages)
                }
                title={L('الصفحة الأخيرة', 'Last page')}
              >
                {isRTL ? <ChevronsLeft className="size-3.5" /> : <ChevronsRight className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Add / Edit Definition Item Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-border max-w-[95vw] w-full p-0" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="p-4 sm:p-5 border-b border-border/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              {editingItem ? (
                <>
                  <Pencil className="size-4.5 text-amber-500 shrink-0" />
                  <span className="truncate">{L(`تعديل عنصر «${editingItem.nameAr}»`, `Edit Item "${editingItem.nameEn || editingItem.nameAr}"`)}</span>
                </>
              ) : (
                <>
                  <Plus className="size-4.5 text-blue-600 shrink-0" />
                  <span className="truncate">{L(`إضافة عنصر جديد في «${selectedType?.nameAr || ''}»`, `Add Item to "${selectedType?.nameEn || selectedType?.nameAr || ''}"`)}</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {formError && (
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs p-3 rounded-md font-medium">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-semibold block mb-1">
                  {L('رمز التعريف (Code) *', 'Code *')}
                </Label>
                <Input
                  placeholder="EX: ASSET_01"
                  value={formData.code}
                  onChange={(e) => setFormData((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                  disabled={!!editingItem && editingItem.isSystem}
                  className="h-9 sm:h-10 text-xs uppercase font-mono rounded-md px-3"
                />
                {editingItem?.isSystem && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {L('الرمز النظامي غير قابل للتعديل.', 'System code cannot be changed.')}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 min-w-0">
                <Label className="text-xs font-semibold block mb-1">
                  {L('ترتيب العرض', 'Sort Order')}
                </Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((p) => ({ ...p, sortOrder: Number(e.target.value) || 0 }))}
                  className="h-9 sm:h-10 text-xs rounded-md px-3"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block mb-1">
                {L('الاسم بالعربية *', 'Arabic Name *')}
              </Label>
              <Input
                placeholder={L('أدخل الاسم بالعربية…', 'Enter Arabic name…')}
                value={formData.nameAr}
                onChange={(e) => setFormData((p) => ({ ...p, nameAr: e.target.value }))}
                className="h-9 sm:h-10 text-xs rounded-md px-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block mb-1">
                {L('الاسم بالإنجليزية', 'English Name')}
              </Label>
              <Input
                placeholder="Enter English Name..."
                value={formData.nameEn}
                onChange={(e) => setFormData((p) => ({ ...p, nameEn: e.target.value }))}
                className="h-9 sm:h-10 text-xs rounded-md px-3"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold block mb-1">
                {L('ملاحظات', 'Notes')}
              </Label>
              <Input
                placeholder={L("ملاحظات توضيحية خيارية…", "Optional explanatory notes…")}
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="h-9 sm:h-10 text-xs rounded-md px-3"
              />
            </div>

            <div className="flex items-center justify-between p-3 sm:p-4 border border-border rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="space-y-0.5 me-2">
                <Label className="text-xs font-semibold">
                  {L('حالة التنشيط', 'Active Status')}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {L('عند التوقيف لن يظهر هذا العنصر في القوائم المنسدلة الجديدة.', 'When disabled, this item will be hidden from lookups.')}
                </p>
              </div>
              <Switch
                checked={formData.active}
                onCheckedChange={(checked) => setFormData((p) => ({ ...p, active: checked }))}
              />
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border/80 shrink-0 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFormOpen(false)}
              disabled={submitting}
              className="h-9 sm:h-10 w-full sm:w-auto px-4 rounded-md font-medium text-xs"
            >
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button
              size="sm"
              onClick={handleSaveItem}
              disabled={submitting}
              className="h-9 sm:h-10 w-full sm:w-auto px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>{L('حفظ البيانات', 'Save Item')}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-border max-w-[95vw] w-full p-0" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="p-4 sm:p-5 border-b border-border/80 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
            <DialogTitle className="text-base sm:text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
              <ShieldAlert className="size-5 shrink-0" />
              <span className="truncate">{L('تأكيد حذف عنصر التعريف', 'Confirm Definition Delete')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-5 text-xs space-y-3">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              {L(
                `هل أنت متأكد من رغبتك في حذف عنصر التعريف «${deletingItem?.nameAr || ''}» (${deletingItem?.code || ''})؟`,
                `Are you sure you want to delete definition item "${deletingItem?.nameEn || deletingItem?.nameAr || ''}"?`
              )}
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 p-3 rounded-lg text-amber-800 dark:text-amber-300 text-[11px] leading-normal">
              {L(
                'تنبيه نظامي: إذا كان هذا العنصر مستخدماً في سجلات مالية أو وظيفية، سيقوم النظام بمنع الحذف وتنبيهك للحفاظ على سلامة البيانات.',
                'Safety Note: If this item is referenced in transactions or profiles, deletion will be blocked safely.'
              )}
            </div>
          </div>

          <DialogFooter className="p-3 sm:p-4 border-t border-border/80 shrink-0 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col-reverse sm:flex-row justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
              className="h-9 sm:h-10 w-full sm:w-auto px-4 rounded-md font-medium text-xs"
            >
              {L('إلغاء', 'Cancel')}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={submitting}
              className="h-9 sm:h-10 w-full sm:w-auto px-5 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              <span>{L('تأكيد الحذف', 'Confirm Delete')}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export { GeneralDefsModule }
