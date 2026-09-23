'use client'

// =============================================================================
// تهيئة النظام — شاشة تسمية الأدلة الفرعية
//
// Standalone module for: تهيئة النظام → الإعدادات العامة → تسمية الأدلة الفرعية.
// Architectural Principle: Technical Identity ≠ Display Label
//
// Sources of truth:
//   • /api/erp/subledgers-naming (GET list, POST create)
//   • /api/erp/subledgers-naming/[id] (GET, PUT, DELETE)
//   • /api/erp/subledgers-naming/resolve (fast dynamic resolution)
//
// UI Architecture:
//   • Table layout, row heights (h-8), typography (text-[11px]), column resizers,
//     selection, and pagination matching fiscal-periods-module.tsx 100%.
//   • Full integration with components in @/components/ui/
//   • In-use protection: behavioral variables locked when operations exist.
//   • Full RTL / LTR bilingual support.
// =============================================================================

import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useT } from '@/lib/i18n/use-t'
import { exportToCSV } from '@/lib/export'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
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
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  Search,
  Lock,
  Unlock,
  Printer,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  RotateCw,
  ShieldAlert,
  Layers,
  Columns,
  Sparkles,
  Undo2,
  X,
  Edit2,
  AlertTriangle,
} from 'lucide-react'
import {
  STANDARD_SUBLEDGER_CATALOG,
  ALL_SUBLEDGER_CATALOG_TEMPLATES,
  ADDITIONAL_SUBLEDGER_TYPES,
  SUBLEDGER_VARIABLE_DEFINITIONS,
  type SubledgerType,
} from '@/lib/erp/subledger-catalog'

interface FieldLabelRecord {
  id?: string
  fieldKey: string
  labelAr: string
  labelEn: string | null
  sortOrder: number
}

interface SubledgerDefinitionRecord {
  id: string
  companyId: string
  numericId: number
  subledgerType: string
  nameAr: string
  nameEn: string | null
  description: string | null
  active: boolean
  isSystem: boolean
  variables: string | null
  parsedVariables: Record<string, any>
  isInUse: boolean
  inUseReason?: string
  createdBy: string | null
  updatedBy: string | null
  createdAt: string
  updatedAt: string
  fields: FieldLabelRecord[]
}

export function SubledgersNamingModule({ embedded = false }: { embedded?: boolean } = {}) {
  const { isRTL, dir: rawDir, t } = useT()
  const dir = rawDir as 'ltr' | 'rtl'
  const qc = useQueryClient()

  // Helper for bilingual strings
  const txt = (ar: string, en: string) => (isRTL ? ar : en)

  // View state: 'list' (Screenshot 1) vs 'detail' (Screenshots 2 & 3)
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'variables' | 'fields'>('fields')

  // Search and filter in List view
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // Search inside Field Naming tab
  const [fieldsSearch, setFieldsSearch] = useState('')

  // Column visibility controls (matching fiscal-periods-module.tsx)
  const DEFAULT_VISIBLE_COLS = useMemo(
    () => ({
      index: true,
      numericId: true,
      name: true,
      description: true,
      subledgerType: true,
      createdBy: true,
      createdAt: true,
      updatedBy: true,
      updatedAt: true,
      inUse: true,
      state: true,
      actions: true,
    }),
    []
  )
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS)

  // Column resizing controls (matching fiscal-periods-module.tsx)
  const DEFAULT_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      index: 45,
      numericId: 65,
      name: 180,
      description: 200,
      subledgerType: 130,
      createdBy: 85,
      createdAt: 135,
      updatedBy: 85,
      updatedAt: 135,
      inUse: 120,
      state: 85,
      actions: 130,
    }),
    []
  )
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)

  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 120

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const diff = isRTL ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(40, startWidth + diff)
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Form Editing State
  const [formData, setFormData] = useState<{
    id?: string
    numericId: number
    subledgerType: string
    nameAr: string
    nameEn: string
    description: string
    active: boolean
    isSystem: boolean
    isInUse: boolean
    inUseReason?: string
    variables: Record<string, any>
    fields: FieldLabelRecord[]
  }>({
    numericId: 1,
    subledgerType: 'COST_CENTER',
    nameAr: '',
    nameEn: '',
    description: '',
    active: true,
    isSystem: true,
    isInUse: false,
    variables: {},
    fields: [],
  })

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [isEditingNew, setIsEditingNew] = useState(false)

  // Fetch Definitions List
  const { data, isLoading, refetch } = useQuery<{
    items: SubledgerDefinitionRecord[]
    total: number
  }>({
    queryKey: ['subledger-definitions'],
    queryFn: async () => {
      const res = await fetch('/api/erp/subledgers-naming?pageSize=100', {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('فشل في جلب تسميات الأدلة الفرعية')
      const json = await res.json()
      return {
        items: json.data || [],
        total: json.meta?.total || (json.data ? json.data.length : 0),
      }
    },
  })

  const items = data?.items || []

  // Derive selected item
  const selectedItem = useMemo(() => {
    return items.find((i) => i.id === selectedId) || items[selectedIndex] || null
  }, [items, selectedId, selectedIndex])

  // Check if chosen subledgerType in Add mode already exists in the company
  const existingItemWithType = useMemo(() => {
    if (!isEditingNew) return null
    return items.find((i) => i.subledgerType === formData.subledgerType) || null
  }, [isEditingNew, items, formData.subledgerType])

  // Sync Form Data when selected record changes
  useEffect(() => {
    if (items.length > 0 && !isEditingNew) {
      const current = selectedItem || items[0]
      if (current) {
        setFormData({
          id: current.id,
          numericId: current.numericId,
          subledgerType: current.subledgerType,
          nameAr: current.nameAr,
          nameEn: current.nameEn || '',
          description: current.description || '',
          active: current.active,
          isSystem: current.isSystem,
          isInUse: current.isInUse,
          inUseReason: current.inUseReason,
          variables: current.parsedVariables || {},
          fields: current.fields || [],
        })
      }
    }
  }, [items, selectedItem, isEditingNew])

  // Helper to extract clean error message from API responses
  const extractApiErrorMessage = (json: any, fallback: string): string => {
    if (!json) return fallback
    if (typeof json.error === 'string') return json.error
    if (json.error && typeof json.error === 'object' && typeof json.error.message === 'string') {
      return json.error.message
    }
    if (typeof json.message === 'string') return json.message
    return fallback
  }

  // Mutation: Save / Update Subledger Definition
  const saveMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      if (isEditingNew) {
        const res = await fetch('/api/erp/subledgers-naming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            subledgerType: payload.subledgerType,
            numericId: payload.numericId,
            nameAr: payload.nameAr,
            nameEn: payload.nameEn || null,
            description: payload.description || null,
            variables: payload.variables,
            fields: payload.fields,
          }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(extractApiErrorMessage(json, 'فشل إنشاء الدليل الفرعي'))
        return json.data
      } else {
        if (!payload.id) throw new Error('معرف السجل مفقود')
        const res = await fetch(`/api/erp/subledgers-naming/${payload.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            nameAr: payload.nameAr,
            nameEn: payload.nameEn || null,
            description: payload.description || null,
            active: payload.active,
            variables: payload.variables,
            fields: payload.fields,
          }),
        })
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(extractApiErrorMessage(json, 'فشل حفظ التعديلات'))
        return json.data
      }
    },
    onSuccess: (savedData: any) => {
      qc.invalidateQueries({ queryKey: ['subledger-definitions'] })
      qc.invalidateQueries({ queryKey: ['subledger-labels'] })
      toast.success(
        isEditingNew
          ? txt('تم إنشاء تسمية الدليل الفرعي بنجاح وإضافته إلى الجدول', 'Subledger definition created successfully and added to table')
          : txt('تم حفظ التعديلات وتحديث مسميات الأدلة في النظام', 'Changes saved and labels updated across system')
      )
      if (savedData?.id) {
        setSelectedId(savedData.id)
      }
      setIsEditingNew(false)
      setViewMode('list')
    },
    onError: (err: any) => {
      toast.error(err.message || txt('حدث خطأ أثناء حفظ التعديلات', 'An error occurred while saving'))
    },
  })

  // Unified Save Form Handler
  const handleSaveForm = () => {
    if (isEditingNew && existingItemWithType) {
      toast.error(
        txt(
          `نوع الدليل (${formData.subledgerType}) معرف مسبقاً في النظام برقم (${existingItemWithType.numericId}). لتعديل مسمياته وحقوله يرجى الانتقال إلى سجله القائم.`,
          `Subledger type (${formData.subledgerType}) is already defined as #${existingItemWithType.numericId}. Please edit the existing record.`
        )
      )
      return
    }
    if (!formData.nameAr.trim()) {
      toast.error(txt('الاسم باللغة العربية مطلوب', 'Arabic name is required'))
      return
    }
    if (!formData.subledgerType.trim()) {
      toast.error(txt('نوع الدليل الفرعي مطلوب', 'Subledger type is required'))
      return
    }
    saveMutation.mutate(formData)
  }

  // Mutation: Delete Definition
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/erp/subledgers-naming/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) throw new Error(extractApiErrorMessage(json, 'فشل حذف الدليل الفرعي'))
      return json
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subledger-definitions'] })
      qc.invalidateQueries({ queryKey: ['subledger-labels'] })
      toast.success(txt('تم حذف تعريف الدليل الفرعي', 'Subledger definition deleted'))
      setConfirmDeleteId(null)
      setSelectedId(null)
      setSelectedIndex(0)
      setViewMode('list')
    },
    onError: (err: any) => {
      toast.error(err.message || txt('تعذر الحذف', 'Failed to delete'))
      setConfirmDeleteId(null)
    },
  })

  // Start New Definition
  const handleStartNew = () => {
    setIsEditingNew(true)
    const nextNumericId = items.length > 0 ? Math.max(...items.map((i) => i.numericId)) + 1 : 1
    // Pick the first template from ALL_SUBLEDGER_CATALOG_TEMPLATES that isn't yet created
    const availableTemplate = ALL_SUBLEDGER_CATALOG_TEMPLATES.find(
      (t) => !items.some((i) => i.subledgerType === t.subledgerType)
    ) || {
      numericId: nextNumericId,
      subledgerType: `CUSTOM_${nextNumericId}` as any,
      nameAr: `دليل فرعي جديد ${nextNumericId}`,
      nameEn: `Custom Subledger ${nextNumericId}`,
      descriptionAr: 'دليل فرعي مخصص للمنشأة',
      descriptionEn: 'Custom subledger for organization',
      variables: {
        includeParentInCode: false,
        maxCodeLength: 10,
        minCodeLength: 1,
        postingMethod: 'all_sides',
        numericOnly: true,
        usageInTransactions: 'optional',
      },
      fieldLabels: [
        { fieldKey: 'entity', labelAr: 'الدليل', labelEn: 'Subledger', sortOrder: 1 },
        { fieldKey: 'code', labelAr: 'الرمز / الرقم', labelEn: 'Code / No', sortOrder: 2 },
        { fieldKey: 'name', labelAr: 'الاسم', labelEn: 'Name', sortOrder: 3 },
        { fieldKey: 'type', labelAr: 'النوع', labelEn: 'Type', sortOrder: 4 },
        { fieldKey: 'status', labelAr: 'الحالة', labelEn: 'Status', sortOrder: 5 },
      ],
    }

    setFormData({
      numericId: nextNumericId,
      subledgerType: availableTemplate.subledgerType,
      nameAr: availableTemplate.nameAr,
      nameEn: availableTemplate.nameEn || '',
      description: availableTemplate.descriptionAr || '',
      active: true,
      isSystem: false,
      isInUse: false,
      variables: availableTemplate.variables,
      fields: availableTemplate.fieldLabels.map((f) => ({
        fieldKey: f.fieldKey,
        labelAr: f.labelAr,
        labelEn: f.labelEn,
        sortOrder: f.sortOrder,
      })),
    })
    setViewMode('detail')
  }

  // Filtered Items for List View
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (typeFilter !== 'ALL' && item.subledgerType !== typeFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesNameAr = item.nameAr.toLowerCase().includes(q)
        const matchesNameEn = (item.nameEn || '').toLowerCase().includes(q)
        const matchesDesc = (item.description || '').toLowerCase().includes(q)
        const matchesType = item.subledgerType.toLowerCase().includes(q)
        if (!matchesNameAr && !matchesNameEn && !matchesDesc && !matchesType) return false
      }
      return true
    })
  }, [items, typeFilter, searchQuery])

  // Pagination in List View
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredItems.slice(start, start + pageSize)
  }, [filteredItems, currentPage, pageSize])

  // Field rows for Tab 2: «تسمية الحقول» (Matching Screenshot 2)
  const fieldNamingRows = useMemo(() => {
    const rows: Array<{
      rowNumber: number
      fieldKey: string
      langCode: 'ar' | 'en'
      langLabel: string
      displayValue: string
      sortOrder: number
    }> = []

    let index = 1
    for (const f of formData.fields) {
      rows.push({
        rowNumber: index++,
        fieldKey: f.fieldKey,
        langCode: 'ar',
        langLabel: 'ar - عربي',
        displayValue: f.labelAr,
        sortOrder: f.sortOrder,
      })
    }
    for (const f of formData.fields) {
      rows.push({
        rowNumber: index++,
        fieldKey: f.fieldKey,
        langCode: 'en',
        langLabel: 'en - English',
        displayValue: f.labelEn || '',
        sortOrder: f.sortOrder,
      })
    }

    if (fieldsSearch.trim()) {
      const q = fieldsSearch.toLowerCase()
      return rows.filter(
        (r) =>
          r.displayValue.toLowerCase().includes(q) ||
          r.fieldKey.toLowerCase().includes(q) ||
          r.langLabel.toLowerCase().includes(q)
      )
    }

    return rows
  }, [formData.fields, fieldsSearch])

  // Handler to update a field label
  const handleFieldLabelChange = (fieldKey: string, lang: 'ar' | 'en', val: string) => {
    setFormData((prev) => {
      const updatedFields = prev.fields.map((f) => {
        if (f.fieldKey === fieldKey) {
          return {
            ...f,
            [lang === 'ar' ? 'labelAr' : 'labelEn']: val,
          }
        }
        return f
      })
      return { ...prev, fields: updatedFields }
    })
  }

  // Handler to update a general variable
  const handleVariableChange = (key: string, val: any) => {
    if (formData.isInUse) {
      toast.error(txt('لا يمكن تعديل المتغيرات نظراً لوجود عمليات سابقة مرتبطة بهذا الدليل', 'Cannot modify variables for an in-use subledger'))
      return
    }
    setFormData((prev) => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: val,
      },
    }))
  }

  // Export handlers (matching fiscal-periods-module.tsx)
  const handleExportCSV = () => {
    exportToCSV(
      'subledgers-naming',
      filteredItems.map((item) => ({
        id: item.numericId,
        type: item.subledgerType,
        nameAr: item.nameAr,
        nameEn: item.nameEn || '',
        description: item.description || '',
        inUse: item.isInUse ? 'مستخدم' : 'غير مستخدم',
        active: item.active ? 'نشط' : 'معطل',
      }))
    )
    toast.success(txt('تم تصدير البيانات إلى CSV بنجاح', 'Exported to CSV successfully'))
  }

  const handleExportExcel = () => {
    exportToCSV(
      `subledgers-naming_${new Date().toISOString().slice(0, 10)}`,
      filteredItems.map((item) => ({
        [txt('الرقم', 'Number')]: item.numericId,
        [txt('نوع الدليل الفرعي', 'Subledger Type')]: item.subledgerType,
        [txt('الاسم (عربي)', 'Name (Ar)')]: item.nameAr,
        [txt('الاسم (إنجليزي)', 'Name (En)')]: item.nameEn || '',
        [txt('الوصف', 'Description')]: item.description || '',
        [txt('حالة الاستخدام', 'Usage Status')]: item.isInUse ? txt('مستخدم بعمليات', 'In Use') : txt('متاح', 'Available'),
        [txt('الحالة', 'Status')]: item.active ? txt('نشط', 'Active') : txt('معطل', 'Inactive'),
      }))
    )
    toast.success(txt('تم تصدير البيانات إلى Excel بنجاح', 'Exported to Excel successfully'))
  }

  const handleExportWord = () => {
    const title = txt('تقرير تسمية الأدلة الفرعية', 'Subledgers Naming Report')
    const headers = [
      txt('الرقم', 'Number'),
      txt('نوع الدليل', 'Type'),
      txt('الاسم العربي', 'Arabic Name'),
      txt('الاسم الأجنبي', 'Foreign Name'),
      txt('الاستخدام', 'Usage'),
      txt('الحالة', 'Status'),
    ]

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; padding: 25px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 5px; font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          p.subtitle { text-align: center; color: #64748b; margin-bottom: 25px; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; direction: ${isRTL ? 'rtl' : 'ltr'}; }
          th { background-color: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; padding: 8px 10px; font-size: 13px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body dir='${isRTL ? 'rtl' : 'ltr'}'>
        <h1>${title}</h1>
        <p class="subtitle">${txt('تاريخ التصدير:', 'Export Date:')} ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')} | ${txt('إجمالي السجلات:', 'Total Records:')} ${filteredItems.length}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredItems
        .map(
          (item) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${item.numericId}</td>
                <td>${item.subledgerType}</td>
                <td>${item.nameAr}</td>
                <td>${item.nameEn || '—'}</td>
                <td>${item.isInUse ? 'مستخدم' : 'متاح'}</td>
                <td>${item.active ? 'نشط' : 'معطل'}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
        <div class="footer">${txt('تم التصدير تلقائياً بواسطة نظام أورمينال ERP', 'Exported automatically by Orminal ERP')}</div>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + docHtml], { type: 'application/msword;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `subledgers_naming_${new Date().toISOString().slice(0, 10)}.doc`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(txt('تم تصدير البيانات إلى Word بنجاح', 'Exported to Word successfully'))
  }

  // Open detail view for a record
  const handleOpenDetail = (item: SubledgerDefinitionRecord, idx: number) => {
    setSelectedId(item.id)
    setSelectedIndex(idx)
    setIsEditingNew(false)
    setViewMode('detail')
  }

  // Subledger Type Badge
  const getSubledgerTypeBadge = (type: string) => {
    switch (type) {
      case 'COST_CENTER':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 text-[10px]">مراكز تكلفة</Badge>
      case 'ACTIVITY':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 text-[10px]">أنشطة</Badge>
      case 'PROJECT':
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 text-[10px]">مشاريع</Badge>
      case 'ANALYTIC_ACCOUNT':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-[10px]">حسابات تحليلية</Badge>
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>
    }
  }

  return (
    <div className={cn("flex flex-col gap-2.5 w-full min-w-0 max-w-full", isRTL ? "text-right" : "text-left")}>
      {/* ========================================================================= */}
      {/* 1. LIST VIEW (SCREENSHOT 1) WITH FISCAL-PERIODS TABLE DESIGN & LOGIC */}
      {/* ========================================================================= */}
      {viewMode === 'list' && (
        <Card className="border border-border shadow-xs rounded-lg overflow-hidden bg-card">
          {/* Top Blue Breadcrumb Banner (Screenshot 1) */}
          <div className="bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-md flex items-center justify-between gap-2 shadow-sm min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0 flex-wrap sm:flex-nowrap">
              <Layers className="size-4 shrink-0" />
              <span>{txt('الرئيسية', 'Home')}</span>
              <span>›</span>
              <span className="truncate">{txt('تسمية الأدلة الفرعية', 'Subledgers Naming')}</span>
              <span className="hidden sm:inline">›</span>
              <span className="hidden sm:inline text-white/90">{txt('الكل', 'All')}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-white hover:bg-white/20 text-xs gap-1"
                onClick={() => {
                  refetch()
                  toast.success(txt('تم تحديث البيانات', 'Data refreshed'))
                }}
              >
                <RotateCw className="size-3.5" />
                <span className="hidden sm:inline">{txt('تحديث', 'Refresh')}</span>
              </Button>
            </div>
          </div>

          {/* ACTION TOOLBAR (Matching fiscal-periods-module.tsx 100%) */}
          <div className="p-2 sm:p-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
            {/* Search, Columns & Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
              {/* Row 1 on mobile: Search Box + Columns Dropdown */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                {/* Columns Selector Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs bg-background shrink-0">
                      <span>{txt('أعمدة', 'Columns')}</span>
                      <ChevronLeft className="size-3 -rotate-90 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52 max-h-80 overflow-y-auto z-50">
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.numericId}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, numericId: !!v }))}
                    >
                      {txt('الرقم', 'Number')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.name}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, name: !!v }))}
                    >
                      {txt('الاسم (Display Label)', 'Name')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.description}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, description: !!v }))}
                    >
                      {txt('الوصف', 'Description')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.subledgerType}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, subledgerType: !!v }))}
                    >
                      {txt('نوع الدليل الفرعي', 'Subledger Type')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.createdBy}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, createdBy: !!v }))}
                    >
                      {txt('مدخل البيانات', 'Created By')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.createdAt}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, createdAt: !!v }))}
                    >
                      {txt('تاريخ الإدخال', 'Entry Date')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.updatedBy}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, updatedBy: !!v }))}
                    >
                      {txt('آخر معدل للبيانات', 'Updated By')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.updatedAt}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, updatedAt: !!v }))}
                    >
                      {txt('تاريخ آخر تعديل', 'Last Modified')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.inUse}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, inUse: !!v }))}
                    >
                      {txt('حالة الاستخدام', 'Usage Status')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.state}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, state: !!v }))}
                    >
                      {txt('الحالة', 'Status')}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={visibleCols.actions}
                      onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, actions: !!v }))}
                    >
                      {txt('الإجراءات', 'Actions')}
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={() => {
                        setVisibleCols(DEFAULT_VISIBLE_COLS)
                        toast.success(txt('تمت استعادة إعدادات الأعمدة الافتراضية', 'Columns reset to default'))
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer justify-center py-1.5"
                    >
                      {txt('إعادة ضبط الأعمدة الافتراضية', 'Reset Default Columns')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search Box with Search Icon and Clear X */}
                <div className="relative flex-1 sm:w-56 min-w-0">
                  <Search className={cn('size-3.5 absolute top-2.5 text-muted-foreground pointer-events-none', isRTL ? 'right-2.5' : 'left-2.5')} />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    placeholder={txt('بحث في الأدلة الفرعية...', 'Search subledgers...')}
                    className={cn('h-8 text-xs bg-background border-input', isRTL ? 'pr-8 pl-6' : 'pl-8 pr-6')}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setCurrentPage(1)
                      }}
                      className={cn(
                        'absolute top-2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors',
                        isRTL ? 'left-2' : 'right-2'
                      )}
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2 on mobile: Type Filter Pills */}
              <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
                <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('ALL')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer",
                      typeFilter === 'ALL'
                        ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {txt('الكل', 'All')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('COST_CENTER')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                      typeFilter === 'COST_CENTER'
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-blue-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-blue-400" />
                    {txt('مراكز التكلفة', 'Cost Centers')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('ACTIVITY')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                      typeFilter === 'ACTIVITY'
                        ? "bg-emerald-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-emerald-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    {txt('الأنشطة', 'Activities')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('PROJECT')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                      typeFilter === 'PROJECT'
                        ? "bg-amber-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-amber-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-amber-400" />
                    {txt('المشاريع', 'Projects')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTypeFilter('ANALYTIC_ACCOUNT')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                      typeFilter === 'ANALYTIC_ACCOUNT'
                        ? "bg-purple-600 text-white font-bold shadow-xs"
                        : "text-muted-foreground hover:text-purple-600"
                    )}
                  >
                    <span className="size-1.5 rounded-full bg-purple-400" />
                    {txt('حسابات تحليلية', 'Analytic')}
                  </button>
                </div>
              </div>
            </div>

            {/* Action Tools & Add Button (Matching fiscal-periods-module.tsx right group) */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 w-full lg:w-auto pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-200/60 dark:border-slate-800 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 max-w-full">
                {/* Export Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer shrink-0"
                      title={txt('خيارات التصدير (Excel, CSV, Word, PDF)', 'Export Options (Excel, CSV, Word, PDF)')}
                    >
                      <FileSpreadsheet className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isRTL ? 'start' : 'end'} sideOffset={6} className="w-36 shadow-xl border-slate-200 dark:border-slate-800 z-50">
                    <DropdownMenuItem onClick={handleExportExcel} className="gap-2 text-xs font-medium cursor-pointer py-1.5">
                      <FileSpreadsheet className="size-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('Excel', 'Excel')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportCSV} className="gap-2 text-xs font-medium cursor-pointer py-1.5">
                      <Columns className="size-3.5 text-blue-600 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('CSV', 'CSV')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportWord} className="gap-2 text-xs font-medium cursor-pointer py-1.5">
                      <FileText className="size-3.5 text-indigo-600 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('Word', 'Word')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.print()} className="gap-2 text-xs font-medium cursor-pointer py-1.5">
                      <Printer className="size-3.5 text-red-600 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('PDF / طباعة', 'PDF / Print')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Print */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer shrink-0"
                  onClick={() => window.print()}
                  title={txt('طباعة الجدول', 'Print Table')}
                >
                  <Printer className="size-4" />
                </Button>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer shrink-0"
                  onClick={() => {
                    refetch()
                    toast.success(txt('تم تحديث البيانات', 'Data refreshed'))
                  }}
                  title={txt('تحديث البيانات', 'Refresh Data')}
                >
                  <RotateCw className="size-4" />
                </Button>

                {/* Lock / Unlock Toggle for Selected Item */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all shrink-0",
                    selectedItem
                      ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
                      : "text-slate-400 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (!selectedItem) return
                    saveMutation.mutate({
                      ...formData,
                      id: selectedItem.id,
                      active: !selectedItem.active,
                    })
                  }}
                  title={
                    selectedItem
                      ? selectedItem.active
                        ? txt('تعطيل الدليل المحدد', 'Deactivate selected subledger')
                        : txt('تفعيل الدليل المحدد', 'Activate selected subledger')
                      : txt('اختر دليلاً من الجدول لتغيير حالته', 'Select a subledger from the table')
                  }
                >
                  {selectedItem?.active ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                </Button>

                {/* Edit selected record */}
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!selectedItem}
                  className={cn(
                    "h-8 w-8 p-0 transition-all shrink-0",
                    selectedItem
                      ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                      : "text-amber-300 opacity-40 cursor-not-allowed"
                  )}
                  onClick={() => {
                    if (selectedItem) {
                      const idx = items.findIndex((i) => i.id === selectedItem.id)
                      handleOpenDetail(selectedItem, idx >= 0 ? idx : 0)
                    }
                  }}
                  title={
                    selectedItem
                      ? txt('تعديل الدليل المحدد', 'Edit selected subledger')
                      : txt('اختر دليلاً من الجدول للتعديل', 'Select a subledger to edit')
                  }
                >
                  <Edit2 className="size-4" />
                </Button>
              </div>

              {/* Primary Add Button (Preserves user's custom text: "إضافة  ") */}
              <Button
                onClick={handleStartNew}
                size="sm"
                className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold gap-1.5 shadow-xs cursor-pointer shrink-0"
              >
                <Plus className="size-4" />
                <span>إضافة  </span>
              </Button>
            </div>
          </div>

          {/* MAIN GRID TABLE (Exact Match to fiscal-periods-module.tsx Grid Structure) */}
          <div className="overflow-x-auto min-h-[380px] w-full scrollbar-thin">
            <Table className="min-w-[980px] border-collapse text-[11px] table-fixed">
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                  {visibleCols.index && (
                    <TableHead
                      style={{
                        width: `${colWidths.index || 45}px`,
                        minWidth: `${colWidths.index || 45}px`,
                        maxWidth: `${colWidths.index || 45}px`,
                      }}
                      className="font-bold py-1 px-1.5 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap select-none"
                    >
                      #
                    </TableHead>
                  )}

                  {visibleCols.numericId && (
                    <TableHead
                      style={{
                        width: `${colWidths.numericId || 65}px`,
                        minWidth: `${colWidths.numericId || 65}px`,
                        maxWidth: `${colWidths.numericId || 65}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('الرقم', 'No')}</span>
                      <div
                        onMouseDown={(e) => handleResizeStart('numericId', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, numericId: DEFAULT_COL_WIDTHS.numericId }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={txt('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.name && (
                    <TableHead
                      style={{
                        width: `${colWidths.name || 180}px`,
                        minWidth: `${colWidths.name || 180}px`,
                        maxWidth: `${colWidths.name || 180}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{txt('الاسم (Display Label)', 'Name')}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('name', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, name: DEFAULT_COL_WIDTHS.name }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={txt('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.description && (
                    <TableHead
                      style={{
                        width: `${colWidths.description || 200}px`,
                        minWidth: `${colWidths.description || 200}px`,
                        maxWidth: `${colWidths.description || 200}px`,
                      }}
                      className={cn(
                        'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                        isRTL ? 'text-right' : 'text-left'
                      )}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{txt('الوصف', 'Description')}</span>
                      </div>
                      <div
                        onMouseDown={(e) => handleResizeStart('description', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, description: DEFAULT_COL_WIDTHS.description }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={txt('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.subledgerType && (
                    <TableHead
                      style={{
                        width: `${colWidths.subledgerType || 130}px`,
                        minWidth: `${colWidths.subledgerType || 130}px`,
                        maxWidth: `${colWidths.subledgerType || 130}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('نوع الدليل الفرعي', 'Subledger Type')}</span>
                      <div
                        onMouseDown={(e) => handleResizeStart('subledgerType', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, subledgerType: DEFAULT_COL_WIDTHS.subledgerType }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                        title={txt('سحب لتغيير عرض العمود (انقر مرتين للإعادة)', 'Drag to resize column (Double click to reset)')}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.createdBy && (
                    <TableHead
                      style={{
                        width: `${colWidths.createdBy || 85}px`,
                        minWidth: `${colWidths.createdBy || 85}px`,
                        maxWidth: `${colWidths.createdBy || 85}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('مدخل البيانات', 'Created By')}</span>
                      <div
                        onMouseDown={(e) => handleResizeStart('createdBy', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, createdBy: DEFAULT_COL_WIDTHS.createdBy }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.createdAt && (
                    <TableHead
                      style={{
                        width: `${colWidths.createdAt || 135}px`,
                        minWidth: `${colWidths.createdAt || 135}px`,
                        maxWidth: `${colWidths.createdAt || 135}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('تاريخ الإدخال', 'Entry Date')}</span>
                      <div
                        onMouseDown={(e) => handleResizeStart('createdAt', e)}
                        onDoubleClick={() => setColWidths((p) => ({ ...p, createdAt: DEFAULT_COL_WIDTHS.createdAt }))}
                        className={cn(
                          "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                          isRTL ? "-left-1.5" : "-right-1.5",
                          "bg-transparent"
                        )}
                      >
                        <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                      </div>
                    </TableHead>
                  )}

                  {visibleCols.updatedBy && (
                    <TableHead
                      style={{
                        width: `${colWidths.updatedBy || 85}px`,
                        minWidth: `${colWidths.updatedBy || 85}px`,
                        maxWidth: `${colWidths.updatedBy || 85}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('آخر معدل', 'Updated By')}</span>
                    </TableHead>
                  )}

                  {visibleCols.updatedAt && (
                    <TableHead
                      style={{
                        width: `${colWidths.updatedAt || 135}px`,
                        minWidth: `${colWidths.updatedAt || 135}px`,
                        maxWidth: `${colWidths.updatedAt || 135}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('آخر تعديل', 'Modified Date')}</span>
                    </TableHead>
                  )}

                  {visibleCols.inUse && (
                    <TableHead
                      style={{
                        width: `${colWidths.inUse || 120}px`,
                        minWidth: `${colWidths.inUse || 120}px`,
                        maxWidth: `${colWidths.inUse || 120}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('الاستخدام', 'Usage')}</span>
                    </TableHead>
                  )}

                  {visibleCols.state && (
                    <TableHead
                      style={{
                        width: `${colWidths.state || 85}px`,
                        minWidth: `${colWidths.state || 85}px`,
                        maxWidth: `${colWidths.state || 85}px`,
                      }}
                      className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                    >
                      <span>{txt('الحالة', 'Status')}</span>
                    </TableHead>
                  )}

                  {visibleCols.actions && (
                    <TableHead
                      style={{
                        width: `${colWidths.actions || 130}px`,
                        minWidth: `${colWidths.actions || 130}px`,
                        maxWidth: `${colWidths.actions || 130}px`,
                      }}
                      className="font-bold py-1.5 px-2 text-center whitespace-nowrap select-none"
                    >
                      <span>{txt('إجراءات سريعة', 'Quick Actions')}</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="h-8 border-b border-slate-200 dark:border-slate-700">
                      {Array.from({ length: 12 }).map((_, j) => (
                        <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-muted-foreground py-12">
                      {txt('لا توجد أدلة فرعية مطابقة للمعايير المحددة', 'No matching subledgers found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, idx) => {
                    const globalIdx = (currentPage - 1) * pageSize + idx
                    const isSelected = selectedId === item.id

                    return (
                      <TableRow
                        key={item.id}
                        data-selected={isSelected || undefined}
                        onClick={() => setSelectedId(item.id)}
                        onDoubleClick={() => handleOpenDetail(item, globalIdx)}
                        className={cn(
                          "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                          isSelected
                            ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                            : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        )}
                        style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                      >
                        {visibleCols.index && (
                          <TableCell
                            style={{
                              width: `${colWidths.index || 45}px`,
                              minWidth: `${colWidths.index || 45}px`,
                              maxWidth: `${colWidths.index || 45}px`,
                            }}
                            className="py-1 px-1.5 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500"
                          >
                            {globalIdx + 1}
                          </TableCell>
                        )}

                        {visibleCols.numericId && (
                          <TableCell
                            style={{
                              width: `${colWidths.numericId || 65}px`,
                              minWidth: `${colWidths.numericId || 65}px`,
                              maxWidth: `${colWidths.numericId || 65}px`,
                            }}
                            className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800 font-bold font-mono text-slate-800 dark:text-slate-200"
                          >
                            {item.numericId}
                          </TableCell>
                        )}

                        {visibleCols.name && (
                          <TableCell
                            style={{
                              width: `${colWidths.name || 180}px`,
                              minWidth: `${colWidths.name || 180}px`,
                              maxWidth: `${colWidths.name || 180}px`,
                            }}
                            className={cn(
                              'py-1 px-2 border-r border-slate-100 dark:border-slate-800 font-semibold text-blue-900 dark:text-blue-300 truncate',
                              isRTL ? 'text-right' : 'text-left'
                            )}
                          >
                            {item.nameAr}
                            {item.nameEn && (
                              <span className="text-[10px] text-slate-500 font-normal mr-1.5">
                                ({item.nameEn})
                              </span>
                            )}
                          </TableCell>
                        )}

                        {visibleCols.description && (
                          <TableCell
                            style={{
                              width: `${colWidths.description || 200}px`,
                              minWidth: `${colWidths.description || 200}px`,
                              maxWidth: `${colWidths.description || 200}px`,
                            }}
                            className={cn(
                              'py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 truncate',
                              isRTL ? 'text-right' : 'text-left'
                            )}
                          >
                            {item.description || item.nameAr}
                          </TableCell>
                        )}

                        {visibleCols.subledgerType && (
                          <TableCell
                            style={{
                              width: `${colWidths.subledgerType || 130}px`,
                              minWidth: `${colWidths.subledgerType || 130}px`,
                              maxWidth: `${colWidths.subledgerType || 130}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center"
                          >
                            {getSubledgerTypeBadge(item.subledgerType)}
                          </TableCell>
                        )}

                        {visibleCols.createdBy && (
                          <TableCell
                            style={{
                              width: `${colWidths.createdBy || 85}px`,
                              minWidth: `${colWidths.createdBy || 85}px`,
                              maxWidth: `${colWidths.createdBy || 85}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-slate-500"
                          >
                            {item.createdBy || '1'}
                          </TableCell>
                        )}

                        {visibleCols.createdAt && (
                          <TableCell
                            style={{
                              width: `${colWidths.createdAt || 135}px`,
                              minWidth: `${colWidths.createdAt || 135}px`,
                              maxWidth: `${colWidths.createdAt || 135}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-[10px] text-slate-500"
                          >
                            {new Date(item.createdAt).toLocaleDateString('en-CA')}
                          </TableCell>
                        )}

                        {visibleCols.updatedBy && (
                          <TableCell
                            style={{
                              width: `${colWidths.updatedBy || 85}px`,
                              minWidth: `${colWidths.updatedBy || 85}px`,
                              maxWidth: `${colWidths.updatedBy || 85}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-slate-500"
                          >
                            {item.updatedBy || '—'}
                          </TableCell>
                        )}

                        {visibleCols.updatedAt && (
                          <TableCell
                            style={{
                              width: `${colWidths.updatedAt || 135}px`,
                              minWidth: `${colWidths.updatedAt || 135}px`,
                              maxWidth: `${colWidths.updatedAt || 135}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center font-mono text-[10px] text-slate-500"
                          >
                            {new Date(item.updatedAt).toLocaleDateString('en-CA')}
                          </TableCell>
                        )}

                        {visibleCols.inUse && (
                          <TableCell
                            style={{
                              width: `${colWidths.inUse || 120}px`,
                              minWidth: `${colWidths.inUse || 120}px`,
                              maxWidth: `${colWidths.inUse || 120}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center"
                          >
                            {item.isInUse ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                <Lock className="size-3" />
                                {txt('مستخدم بعمليات', 'In Use')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                <Unlock className="size-3" />
                                {txt('متاح للتخصيص', 'Available')}
                              </span>
                            )}
                          </TableCell>
                        )}

                        {visibleCols.state && (
                          <TableCell
                            style={{
                              width: `${colWidths.state || 85}px`,
                              minWidth: `${colWidths.state || 85}px`,
                              maxWidth: `${colWidths.state || 85}px`,
                            }}
                            className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 text-center"
                          >
                            {item.active ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {txt('نشط', 'Active')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <span className="size-1.5 rounded-full bg-slate-400" />
                                {txt('معطل', 'Inactive')}
                              </span>
                            )}
                          </TableCell>
                        )}

                        {visibleCols.actions && (
                          <TableCell
                            style={{
                              width: `${colWidths.actions || 130}px`,
                              minWidth: `${colWidths.actions || 130}px`,
                              maxWidth: `${colWidths.actions || 130}px`,
                            }}
                            className="py-1 px-2 overflow-hidden text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-[10px] text-blue-700 hover:text-blue-800 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40 font-medium"
                                onClick={() => handleOpenDetail(item, globalIdx)}
                                title={txt('تعديل وتخصيص المسميات', 'Edit display labels')}
                              >
                                <Pencil className="size-3 mr-0.5" />
                                {txt('تخصيص', 'Customize')}
                              </Button>
                              {!item.isSystem && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                  onClick={() => setConfirmDeleteId(item.id)}
                                  title={txt('حذف', 'Delete')}
                                >
                                  <Trash2 className="size-3" />
                                </Button>
                              )}
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

          {/* PAGINATION FOOTER (Exact Match to fiscal-periods-module.tsx Footer) */}
          <div className="p-2.5 bg-slate-100/90 dark:bg-slate-900 border-t flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 text-center sm:text-start w-full sm:w-auto justify-center sm:justify-start">
              <span>
                {txt(
                  `${currentPage} من ${totalPages} صفحة (العناصر ${filteredItems.length})`,
                  `Page ${currentPage} of ${totalPages} (Items ${filteredItems.length})`
                )}
              </span>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{txt('العناصر', 'Items')}</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(val) => {
                    setPageSize(Number(val))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
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
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0 bg-background"
                  title={txt('الصفحة الأولى', 'First Page')}
                >
                  <ChevronsRight className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0 bg-background"
                  title={txt('الصفحة السابقة', 'Previous Page')}
                >
                  <ChevronRight className="size-3.5" />
                </Button>

                <span className="px-2 py-1 bg-background border rounded text-xs font-semibold">
                  {currentPage}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 w-7 p-0 bg-background"
                  title={txt('الصفحة التالية', 'Next Page')}
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                  className="h-7 w-7 p-0 bg-background"
                  title={txt('الصفحة الأخيرة', 'Last Page')}
                >
                  <ChevronsLeft className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 2. DETAIL / FORM VIEW (SCREENSHOTS 2 & 3) */}
      {/* ========================================================================= */}
      {viewMode === 'detail' && (
        <div className="flex flex-col lg:flex-row gap-2.5 w-full min-w-0 max-w-full">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col gap-2.5 min-w-0 w-full">
            {/* Top Bar with Record Navigation & Breadcrumb Banner */}
            <div className="bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-sm min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 font-semibold text-xs min-w-0 flex-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-white hover:bg-white/20 gap-1 text-xs cursor-pointer shrink-0"
                  onClick={() => setViewMode('list')}
                >
                  <Undo2 className="size-3.5" />
                  <span className="hidden sm:inline">{txt('العودة للجدول', 'Back to Table')}</span>
                  <span className="sm:hidden">{txt('عودة', 'Back')}</span>
                </Button>
                <span className="hidden sm:inline">|</span>
                <span className="hidden sm:inline">{txt('الرئيسية', 'Home')}</span>
                <span className="hidden sm:inline">›</span>
                <span className="hidden md:inline">{txt('تسمية الأدلة الفرعية', 'Subledgers Naming')}</span>
                <span className="hidden md:inline">›</span>
                <span className="text-white/90 font-bold truncate max-w-[150px] sm:max-w-xs md:max-w-md">
                  {isEditingNew
                    ? txt('إضافة دليل فرعي جديد', 'Add New Subledger')
                    : formData.nameAr || txt('تفاصيل الدليل', 'Detail')}
                </span>
              </div>


            </div>

            {/* In-Use Security & Integrity Alert */}
            {formData.isInUse && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="size-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>{txt('تنبيه تكامل البيانات:', 'Data Integrity Guard:')}</strong>{' '}
                    {txt(
                      `هذا الدليل الفرعي مستخدم في حركات وعمليات سابقة في النظام (${formData.inUseReason}). لذلك تم قفل تعديل «المتغيرات العامة السلوكية»، بينما تظل «مسميات الحقول» قابلة للتخصيص بحرية.`,
                      `This subledger is in active use in system transactions (${formData.inUseReason}). Behavioral general variables are locked to preserve integrity, while display field labels remain fully customizable.`
                    )}
                  </span>
                </div>
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] shrink-0">
                  {txt('مقفل سلوكياً', 'Behavior Locked')}
                </Badge>
              </div>
            )}

            {/* Master Header Fields Card (Screenshots 2 & 3) */}
            <Card className="border border-slate-200 dark:border-slate-800 shadow-xs bg-white dark:bg-slate-900 rounded p-2.5 sm:p-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
                {/* Number / الرقم */}
                <div className="flex flex-col gap-1">
                  <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">{txt('الرقم', 'Number')}</Label>
                  <Input
                    value={formData.numericId}
                    disabled
                    className="h-8 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-center text-xs"
                  />
                </div>

                {/* Subledger Type / نوع الدليل الفرعي */}
                <div className="flex flex-col gap-1">
                  <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    {txt('نوع الدليل الفرعي (المعرف التقني)', 'Subledger Type (Technical ID)')}
                  </Label>
                  <Select
                    value={
                      ALL_SUBLEDGER_CATALOG_TEMPLATES.some((t) => t.subledgerType === formData.subledgerType)
                        ? formData.subledgerType
                        : 'CUSTOM'
                    }
                    disabled={!isEditingNew}
                    onValueChange={(val) => {
                      if (val === 'CUSTOM') {
                        const nextId = items.length > 0 ? Math.max(...items.map((i) => i.numericId)) + 1 : 1
                        setFormData((prev) => ({
                          ...prev,
                          subledgerType: `CUSTOM_${nextId}`,
                          nameAr: prev.nameAr || `دليل مخصص ${nextId}`,
                          nameEn: prev.nameEn || `Custom Subledger ${nextId}`,
                        }))
                        return
                      }
                      const match = ALL_SUBLEDGER_CATALOG_TEMPLATES.find((c) => c.subledgerType === val)
                      setFormData((prev) => ({
                        ...prev,
                        subledgerType: val,
                        nameAr: match ? match.nameAr : prev.nameAr,
                        nameEn: match ? match.nameEn : prev.nameEn,
                        description: match ? match.descriptionAr : prev.description,
                        variables: match ? match.variables : prev.variables,
                        fields: match
                          ? match.fieldLabels.map((f) => ({
                            fieldKey: f.fieldKey,
                            labelAr: f.labelAr,
                            labelEn: f.labelEn,
                            sortOrder: f.sortOrder,
                          }))
                          : prev.fields,
                      }))
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {ALL_SUBLEDGER_CATALOG_TEMPLATES.map((tmpl) => {
                        const isAlreadyCreated = items.some((i) => i.subledgerType === tmpl.subledgerType)
                        return (
                          <SelectItem
                            key={tmpl.subledgerType}
                            value={tmpl.subledgerType}
                            className={cn(
                              "text-xs",
                              isAlreadyCreated && "text-slate-400 dark:text-slate-500 font-normal"
                            )}
                          >
                            {tmpl.nameAr} ({tmpl.subledgerType}) {isAlreadyCreated ? txt('— (معرف مسبقاً)', '— (Already Defined)') : ''}
                          </SelectItem>
                        )
                      })}
                      <SelectItem value="CUSTOM" className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {txt('+ دليل مخصص جديد (Custom Type)', '+ New Custom Type')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Custom Subledger Type Key (shown when custom type is selected) */}
                {isEditingNew && !ALL_SUBLEDGER_CATALOG_TEMPLATES.some((t) => t.subledgerType === formData.subledgerType) && (
                  <div className="flex flex-col gap-1">
                    <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                      {txt('المفتاح التقني المخصص (Technical Key)', 'Custom Technical Key')}
                    </Label>
                    <Input
                      value={formData.subledgerType}
                      onChange={(e) => {
                        const sanitized = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '')
                        setFormData((p) => ({ ...p, subledgerType: sanitized }))
                      }}
                      placeholder="CUSTOM_TYPE"
                      className="h-8 text-xs font-mono"
                      dir="ltr"
                    />
                  </div>
                )}

                {/* Name Arabic / الاسم */}
                <div className="flex flex-col gap-1">
                  <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    {txt('الاسم (العربية)', 'Name (Arabic)')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.nameAr}
                    onChange={(e) => setFormData((p) => ({ ...p, nameAr: e.target.value }))}
                    placeholder="مراكز التكلفة..."
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                {/* Name English / الاسم الأجنبي */}
                <div className="flex flex-col gap-1">
                  <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">
                    {txt('الاسم الأجنبي (English)', 'Foreign Name (English)')}
                  </Label>
                  <Input
                    value={formData.nameEn}
                    onChange={(e) => setFormData((p) => ({ ...p, nameEn: e.target.value }))}
                    placeholder="Cost Centers..."
                    className="h-8 text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Description / الوصف */}
                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                  <Label className="text-slate-600 dark:text-slate-400 font-semibold text-xs">{txt('الوصف', 'Description')}</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                    placeholder="وصف استخدام الدليل الفرعي في المنشأة..."
                    className="h-8 text-xs"
                  />
                </div>

                {/* Status Switch */}
                <div className="flex items-center justify-between p-2 border rounded bg-slate-50 dark:bg-slate-800/60 sm:col-span-2 lg:col-span-1">
                  <span className="text-xs font-semibold">{txt('حالة الدليل:', 'Status:')}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      {formData.active ? txt('نشط', 'Active') : txt('معطل', 'Inactive')}
                    </span>
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(val) => setFormData((p) => ({ ...p, active: val }))}
                    />
                  </div>
                </div>

                {/* Duplicate Type Notice Banner */}
                {isEditingNew && existingItemWithType && (
                  <div className="col-span-full p-2.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold">
                          {txt('تنبيه عدم إمكانية التكرار: ', 'Duplicate Notice: ')}
                        </span>
                        <span>
                          {txt(
                            `نوع الدليل (${formData.subledgerType}) معرف مسبقاً برقم (${existingItemWithType.numericId}) باسم "${existingItemWithType.nameAr}". لتعديل مسمياته وحقوله يرجى الانتقال إلى السجل القائم بدلاً من إنشاء دليل مكرر.`,
                            `Subledger type (${formData.subledgerType}) is already defined as #${existingItemWithType.numericId} ("${existingItemWithType.nameAr}").`
                          )}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs bg-white dark:bg-slate-900 border-amber-400 hover:bg-amber-100 text-amber-900 dark:text-amber-100 shrink-0 cursor-pointer font-semibold"
                      onClick={() => {
                        const idx = items.findIndex((i) => i.id === existingItemWithType.id)
                        handleOpenDetail(existingItemWithType, idx >= 0 ? idx : 0)
                      }}
                    >
                      {txt('الانتقال للسجل القائم وتعديله', 'Edit existing record')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Detail Tabs: «تسمية الحقول» & «المتغيرات العامة» (Screenshots 2 & 3) */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xs overflow-hidden min-w-0">
              <Tabs
                value={activeTab}
                onValueChange={(val: any) => setActiveTab(val)}
                className="w-full"
              >
                {/* Tab Navigation Header */}
                <div className="border-b bg-slate-100/70 dark:bg-slate-800/70 px-2 pt-1.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
                  <TabsList className="bg-transparent p-0 gap-1 h-9 overflow-x-auto scrollbar-none w-full sm:w-auto justify-start">
                    <TabsTrigger
                      value="fields"
                      className="data-[state=active]:bg-[#245892] data-[state=active]:text-white rounded-t rounded-b-none px-3 sm:px-4 py-1.5 text-xs font-bold transition-all shadow-none border-b-2 border-transparent data-[state=active]:border-[#245892] cursor-pointer shrink-0"
                    >
                      {txt('تسمية الحقول', 'Field Naming')}
                    </TabsTrigger>
                    <TabsTrigger
                      value="variables"
                      className="data-[state=active]:bg-[#245892] data-[state=active]:text-white rounded-t rounded-b-none px-3 sm:px-4 py-1.5 text-xs font-bold transition-all shadow-none border-b-2 border-transparent data-[state=active]:border-[#245892] cursor-pointer shrink-0"
                    >
                      {txt('المتغيرات العامة', 'General Variables')}
                    </TabsTrigger>
                  </TabsList>

                  <div className="text-[11px] text-slate-500 font-medium pb-1 hidden sm:block truncate max-w-sm lg:max-w-md">
                    {activeTab === 'fields'
                      ? txt('تخصيص مسميات الحقول الظاهرة للمستخدم دون المساس بالهوية التقنية', 'Customize user-facing field display labels without altering technical keys')
                      : txt('ضبط السلوك والمتغيرات المحددة لهذا الدليل الفرعي', 'Configure behavior and parameters specific to this subledger')}
                  </div>
                </div>
                <TabsContent value="variables" className="m-0 p-2 sm:p-3">
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin">
                      <Table className="border-collapse text-[11px] w-full min-w-[500px] table-fixed">
                        <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                          <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                            <TableHead className="py-1 px-2 font-bold text-center w-12 border-r border-slate-200 dark:border-slate-800">#</TableHead>
                            <TableHead className={cn('py-1 px-3 font-bold border-r border-slate-200 dark:border-slate-800 w-2/5', isRTL ? 'text-right' : 'text-left')}>{txt('الاسم', 'Name')}</TableHead>
                            <TableHead className="py-1 px-3 font-bold border-r border-slate-200 dark:border-slate-800 text-center w-1/3">{txt('القيمة', 'Value')}</TableHead>
                            <TableHead className="py-1 px-3 font-bold text-center">{txt('الوصف', 'Description')}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {SUBLEDGER_VARIABLE_DEFINITIONS.map((vDef, vIdx) => {
                            const currentVal = formData.variables[vDef.key] !== undefined
                              ? formData.variables[vDef.key]
                              : vDef.defaultValue

                            return (
                              <TableRow key={vDef.key} className="h-8 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                <TableCell className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500">
                                  {vIdx + 1}
                                </TableCell>
                                <TableCell className={cn('py-1 px-3 border-r border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-200', isRTL ? 'text-right' : 'text-left')}>
                                  {txt(vDef.nameAr, vDef.nameEn)}
                                </TableCell>
                                <TableCell className="py-1 px-3 border-r border-slate-100 dark:border-slate-800 text-center">
                                  {vDef.type === 'boolean' ? (
                                    <div className="flex items-center justify-center gap-2">
                                      <Switch
                                        checked={Boolean(currentVal)}
                                        disabled={formData.isInUse}
                                        onCheckedChange={(val) => handleVariableChange(vDef.key, val)}
                                      />
                                      <span className="text-[11px] font-mono text-slate-500">
                                        {currentVal ? 'Yes' : 'No'}
                                      </span>
                                    </div>
                                  ) : vDef.type === 'number' ? (
                                    <Input
                                      type="number"
                                      value={currentVal}
                                      disabled={formData.isInUse}
                                      onChange={(e) => handleVariableChange(vDef.key, Number(e.target.value))}
                                      className="h-7 w-24 text-center mx-auto text-xs font-mono font-bold"
                                    />
                                  ) : vDef.type === 'select' ? (
                                    <Select
                                      value={String(currentVal)}
                                      disabled={formData.isInUse}
                                      onValueChange={(val) => handleVariableChange(vDef.key, val)}
                                    >
                                      <SelectTrigger className="h-7 text-xs max-w-[200px] mx-auto">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {vDef.options?.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {txt(opt.labelAr, opt.labelEn)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : null}
                                </TableCell>
                                <TableCell className="py-1 px-3 text-center text-slate-500 text-[11px]">
                                  {vDef.type === 'boolean'
                                    ? (currentVal ? 'Yes' : 'No')
                                    : vDef.type === 'select'
                                      ? (vDef.options?.find((o) => o.value === currentVal)?.labelAr || String(currentVal))
                                      : String(currentVal)}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40">
                      <span>{txt('عرض 1 إلى 6 من 6 المدخلات', 'Showing 1 to 6 of 6 entries')}</span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled>
                          <ChevronRight className="size-3" />
                        </Button>
                        <span className="px-2 py-0.5 bg-[#245892] text-white rounded font-bold">1</span>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled>
                          <ChevronLeft className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* ========================================================================= */}
                {/* TAB 2: «تسمية الحقول» (SCREENSHOT 2) */}
                {/* ========================================================================= */}
                <TabsContent value="fields" className="m-0 p-2 sm:p-3 flex flex-col gap-2.5 sm:gap-3">
                  {/* Sub-toolbar inside Tab */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="relative w-full sm:w-72">
                      <Search className={cn('size-3.5 absolute top-2 text-muted-foreground pointer-events-none', isRTL ? 'right-2.5' : 'left-2.5')} />
                      <Input
                        value={fieldsSearch}
                        onChange={(e) => setFieldsSearch(e.target.value)}
                        placeholder={txt('بحث في مسميات الحقول...', 'Search field labels...')}
                        className={cn('h-7.5 text-xs bg-slate-50 dark:bg-slate-800 w-full', isRTL ? 'pr-8 pl-2' : 'pl-8 pr-2')}
                      />
                    </div>

                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50 cursor-pointer"
                        title="Word"
                        onClick={handleExportWord}
                      >
                        <FileText className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                        title="Excel"
                        onClick={handleExportExcel}
                      >
                        <FileSpreadsheet className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 cursor-pointer"
                        title="PDF"
                        onClick={() => window.print()}
                      >
                        <Printer className="size-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Field Naming Grid Table */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
                    <div className="overflow-x-auto scrollbar-thin">
                      <Table className="border-collapse text-[11px] w-full min-w-[500px] table-fixed">
                        <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                          <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                            <TableHead className="py-1 px-2 font-bold text-center w-12 border-r border-slate-200 dark:border-slate-800">#</TableHead>
                            <TableHead className="py-1 px-3 font-bold border-r border-slate-200 dark:border-slate-800 text-center w-28 sm:w-36">{txt('اللغة', 'Language')}</TableHead>
                            <TableHead className={cn('py-1 px-3 font-bold border-r border-slate-200 dark:border-slate-800', isRTL ? 'text-right' : 'text-left')}>
                              {txt('الاسم (Display Label - قابل للتعديل المباشر)', 'Display Label (Editable)')}
                            </TableHead>
                            <TableHead className="py-1 px-3 font-bold text-center w-28 sm:w-36">
                              {txt('المفتاح التقني (الثابت)', 'Technical Key')}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {fieldNamingRows.map((row) => (
                            <TableRow key={`${row.fieldKey}-${row.langCode}`} className="h-8 border-b border-slate-200 dark:border-slate-700 hover:bg-blue-50/40 dark:hover:bg-slate-800/40">
                              <TableCell className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-500">
                                {row.rowNumber}
                              </TableCell>
                              <TableCell className="py-1 px-3 text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-600 dark:text-slate-300">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-semibold",
                                  row.langCode === 'ar'
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
                                    : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300"
                                )}>
                                  {row.langLabel}
                                </span>
                              </TableCell>
                              <TableCell className="py-1 px-3 border-r border-slate-100 dark:border-slate-800">
                                <Input
                                  value={row.displayValue}
                                  onChange={(e) => handleFieldLabelChange(row.fieldKey, row.langCode, e.target.value)}
                                  className="h-7 text-xs font-semibold bg-transparent hover:bg-white focus:bg-white dark:hover:bg-slate-800 dark:focus:bg-slate-800 border-slate-200 dark:border-slate-700"
                                  placeholder={`أدخل مسمى ${row.fieldKey}...`}
                                />
                              </TableCell>
                              <TableCell className="py-1 px-3 text-center font-mono text-[10px] text-slate-400 bg-slate-50/60 dark:bg-slate-800/20 truncate">
                                {row.fieldKey}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Footer */}
                    <div className="p-2 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40">
                      <span>{txt(`عرض 1 إلى ${fieldNamingRows.length} من ${fieldNamingRows.length} المدخلات`, `Showing 1 to ${fieldNamingRows.length} of ${fieldNamingRows.length} entries`)}</span>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled>
                          <ChevronRight className="size-3" />
                        </Button>
                        <span className="px-2 py-0.5 bg-[#245892] text-white rounded font-bold">1</span>
                        <Button variant="outline" size="sm" className="h-6 w-6 p-0" disabled>
                          <ChevronLeft className="size-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Label Live Preview Card */}
                  <Card className="bg-slate-50/80 dark:bg-slate-800/40 border border-dashed border-blue-300 dark:border-blue-900 p-2.5 sm:p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#245892] dark:text-blue-300 mb-2">
                      <Sparkles className="size-4 shrink-0" />
                      <span className="truncate">{txt('معاينة حية: كيف ستظهر المسميات في شاشات وعمليات Orminal ERP؟', 'Live Preview: How customized labels will appear in Orminal ERP screens & transactions')}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2 bg-white dark:bg-slate-900 border rounded shadow-2xs min-w-0">
                        <span className="text-slate-400 text-[10px] block truncate">{txt('عنوان شاشة الدليل:', 'Subledger Screen Title:')}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate block">
                          {formData.nameAr || 'مراكز التكلفة'}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 border rounded shadow-2xs min-w-0">
                        <span className="text-slate-400 text-[10px] block truncate">{txt('حقل الرمز في القيود:', 'Code Field in Journals:')}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate block">
                          {formData.fields.find((f) => f.fieldKey === 'code')?.labelAr || 'رقم المركز'}
                        </span>
                      </div>
                      <div className="p-2 bg-white dark:bg-slate-900 border rounded shadow-2xs min-w-0">
                        <span className="text-slate-400 text-[10px] block truncate">{txt('حقل الاسم في الفواتير:', 'Name Field in Invoices:')}</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate block">
                          {formData.fields.find((f) => f.fieldKey === 'name')?.labelAr || 'اسم المركز'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Side Action Palette (Floating on Desktop, Horizontal Ribbon on Mobile/Tablet) */}
          <div className="flex flex-row lg:flex-col items-center justify-between sm:justify-center lg:justify-start gap-1 sm:gap-1.5 p-1 sm:p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xs w-full lg:w-auto overflow-x-auto self-stretch lg:self-start order-last lg:order-none shrink-0 scrollbar-none">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 cursor-pointer shrink-0"
                    onClick={handleStartNew}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('إضافة دليل جديد (+)', 'Add new subledger (+)')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-all shrink-0",
                      saveMutation.isPending || (isEditingNew && existingItemWithType)
                        ? "text-slate-400 opacity-50 cursor-not-allowed"
                        : "text-emerald-600 hover:bg-emerald-50 cursor-pointer"
                    )}
                    disabled={saveMutation.isPending}
                    onClick={handleSaveForm}
                  >
                    <Save className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('حفظ التعديلات', 'Save changes')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                    onClick={() => toast.info(txt('وضع التعديل مفعل', 'Edit mode active'))}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('تعديل', 'Edit')}</TooltipContent>
              </Tooltip>

              {!formData.isSystem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 cursor-pointer shrink-0"
                      disabled={formData.isInUse}
                      onClick={() => formData.id && setConfirmDeleteId(formData.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={isRTL ? "right" : "left"}>{txt('حذف الدليل', 'Delete subledger')}</TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-50 cursor-pointer shrink-0"
                    onClick={() => setViewMode('list')}
                  >
                    <Search className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('بحث وتصفح السجلات', 'Search and browse table')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 cursor-pointer shrink-0"
                    onClick={() => setFormData((p) => ({ ...p, active: !p.active }))}
                  >
                    {formData.active ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('تفعيل / تعطيل', 'Activate / Deactivate')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-purple-600 hover:bg-purple-50 cursor-pointer shrink-0"
                    onClick={() => window.print()}
                  >
                    <Printer className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('طباعة', 'Print')}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-500 hover:bg-slate-100 cursor-pointer shrink-0"
                    onClick={() => setViewMode('list')}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? "right" : "left"}>{txt('الرجوع للقائمة', 'Back to table')}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={Boolean(confirmDeleteId)} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent className="max-w-[92vw] sm:max-w-lg rounded-lg p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">{txt('تأكيد حذف تعريف الدليل الفرعي', 'Confirm Subledger Deletion')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {txt(
                'هل أنت متأكد من رغبتك في حذف هذا الدليل الفرعي المخصص؟ لن تتمكن من التراجع عن هذه الخطوة.',
                'Are you sure you want to delete this custom subledger definition? This action cannot be undone.'
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4">
            <AlertDialogCancel className="w-full sm:w-auto cursor-pointer">{txt('إلغاء', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-full sm:w-auto"
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
            >
              {txt('تأكيد الحذف', 'Confirm Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default SubledgersNamingModule
