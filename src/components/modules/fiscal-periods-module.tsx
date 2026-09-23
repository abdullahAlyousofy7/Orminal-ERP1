'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModuleShell } from '@/components/erp/module-shell'
import { KpiCard } from '@/components/erp/kpi-card'
import { useT } from '@/lib/i18n/use-t'
import { exportToCSV } from '@/lib/export'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { DatePicker } from '@/components/ui/date-picker'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  CalendarClock,
  Plus,
  Lock,
  Unlock,
  AlertCircle,
  Pencil,
  Search,
  ShieldAlert,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  FileText,
  Printer,
  RotateCw,
  Edit2,
  Columns,
} from 'lucide-react'

export function FiscalPeriodsModule({ embedded = false }: { embedded?: boolean } = {}) {
  const { isRTL, dir: rawDir } = useT()
  const dir = rawDir as 'ltr' | 'rtl'
  const qc = useQueryClient()

  // Filters & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [yearFilter, setYearFilter] = useState('all')

  // Pagination & Row selection (matching org-structure-module.tsx)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Column visibility controls
  const DEFAULT_VISIBLE_COLS = useMemo(
    () => ({
      fiscalYear: true,
      name: true,
      startDate: true,
      endDate: true,
      quarter: true,
      state: true,
      actions: true,
    }),
    []
  )
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE_COLS)

  // Column resizing controls
  const DEFAULT_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      fiscalYear: 140,
      name: 180,
      startDate: 125,
      endDate: 125,
      quarter: 90,
      state: 110,
      actions: 160,
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
      const deltaX = isRTL ? startX - moveEvent.clientX : moveEvent.clientX - startX
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

  // Dialog States
  const [yearDialogOpen, setYearDialogOpen] = useState(false)
  const [yearForm, setYearForm] = useState<any>({
    name: '',
    startDate: '',
    endDate: '',
    periodType: 'monthly',
    autoPeriods: true,
  })

  const [periodDialogOpen, setPeriodDialogOpen] = useState(false)
  const [editPeriodId, setEditPeriodId] = useState<string | null>(null)
  const [periodForm, setPeriodForm] = useState<any>({
    fiscalYearId: '',
    name: '',
    startDate: '',
    endDate: '',
    quarter: 1,
    state: 'open',
  })

  // Helper for bilingual translations
  const txt = (ar: string, en: string) => (isRTL ? ar : en)

  const formatDateForInput = (dStr: string) => {
    if (!dStr) return ''
    try {
      const d = new Date(dStr)
      return d.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const { data: yearsData, isLoading, error } = useQuery<any>({
    queryKey: ['fiscal-years'],
    queryFn: async () => {
      const r = await fetch('/api/erp/fiscal-years')
      if (r.status === 403) throw new Error('FORBIDDEN')
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.message || err.error || `HTTP ${r.status}`)
      }
      return r.json()
    },
  })
  const years = yearsData?.data ?? []
  const periods = years.flatMap((y: any) =>
    (y.periods || []).map((p: any) => ({ ...p, fiscalYearName: y.name }))
  )

  // Filtering client-side for rapid search/filtering experience
  const filteredPeriods = periods.filter((p: any) => {
    const matchesSearch = search
      ? p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.fiscalYearName.toLowerCase().includes(search.toLowerCase())
      : true
    const matchesStatus = statusFilter === 'all' ? true : p.state === statusFilter
    const matchesYear = yearFilter === 'all' ? true : p.fiscalYearId === yearFilter
    return matchesSearch && matchesStatus && matchesYear
  })

  // Pagination calculation
  const totalPages = Math.ceil(filteredPeriods.length / pageSize) || 1
  const paginatedPeriods = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredPeriods.slice(start, start + pageSize)
  }, [filteredPeriods, currentPage, pageSize])

  // Selected period derivation
  const selectedPeriod = useMemo(
    () => periods.find((p: any) => p.id === selectedId) || null,
    [periods, selectedId]
  )

  const createYearMut = useMutation({
    mutationFn: async () => {
      const r = await fetch('/api/erp/fiscal-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: yearForm.name,
          startDate: yearForm.startDate,
          endDate: yearForm.endDate,
          periodType: yearForm.periodType,
          autoPeriods: yearForm.autoPeriods,
        }),
      })
      if (r.status === 403) {
        throw new Error(
          txt(
            'صلاحية غير كافية: لا تملك صلاحية إنشاء سنة مالية لهذه المؤسسة',
            'Insufficient permission: you cannot create a fiscal year for this company'
          )
        )
      }
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        throw new Error(e.message || e.error || txt('فشل في إنشاء السنة المالية', 'Failed to create fiscal year'))
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success(txt('تم إنشاء السنة المالية بنجاح', 'Fiscal year created successfully'))
      qc.invalidateQueries({ queryKey: ['fiscal-years'] })
      setYearDialogOpen(false)
      setYearForm({ name: '', startDate: '', endDate: '', periodType: 'monthly', autoPeriods: true })
    },
    onError: (e: any) => toast.error(e.message || txt('حدث خطأ', 'An error occurred')),
  })

  const savePeriodMut = useMutation({
    mutationFn: async () => {
      const url = editPeriodId ? `/api/erp/fiscal-periods/${editPeriodId}` : '/api/erp/fiscal-periods'
      const method = editPeriodId ? 'PUT' : 'POST'
      const payload: any = {
        name: periodForm.name,
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
        quarter: periodForm.quarter ? parseInt(periodForm.quarter) : null,
        state: periodForm.state,
      }
      if (!editPeriodId) {
        payload.fiscalYearId = periodForm.fiscalYearId
      }
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.status === 403) {
        throw new Error(
          txt(
            'صلاحية غير كافية: لا تملك صلاحية حفظ أو تعديل الفترة المالية',
            'Insufficient permission: you cannot save or modify fiscal periods'
          )
        )
      }
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        throw new Error(e.message || e.error || txt('فشل في حفظ الفترة المالية', 'Failed to save fiscal period'))
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success(
        editPeriodId
          ? txt('تم تحديث الفترة بنجاح', 'Period updated successfully')
          : txt('تم إنشاء الفترة بنجاح', 'Period created successfully')
      )
      qc.invalidateQueries({ queryKey: ['fiscal-years'] })
      setPeriodDialogOpen(false)
      setEditPeriodId(null)
      setPeriodForm({ fiscalYearId: '', name: '', startDate: '', endDate: '', quarter: 1, state: 'open' })
    },
    onError: (e: any) => toast.error(e.message || txt('حدث خطأ', 'An error occurred')),
  })

  const updatePeriodMut = useMutation({
    mutationFn: async ({ id, state }: { id: string; state: string }) => {
      const r = await fetch(`/api/erp/fiscal-periods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      })
      if (r.status === 403) {
        throw new Error(
          txt('صلاحية غير كافية لتعديل حالة الفترة المالية', 'Insufficient permission to change period status')
        )
      }
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        throw new Error(e.message || e.error || txt('فشل في تحديث حالة الفترة', 'Failed to update period state'))
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success(txt('تم تحديث حالة الفترة بنجاح', 'Period state updated successfully'))
      qc.invalidateQueries({ queryKey: ['fiscal-years'] })
    },
    onError: (e: any) => toast.error(e.message || txt('حدث خطأ', 'An error occurred')),
  })

  const handleAddYear = () => {
    setYearForm({
      name: '',
      startDate: '',
      endDate: '',
      periodType: 'monthly',
      autoPeriods: true,
    })
    setYearDialogOpen(true)
  }

  const handleAddPeriod = () => {
    setEditPeriodId(null)
    setPeriodForm({
      fiscalYearId: years[0]?.id || '',
      name: '',
      startDate: '',
      endDate: '',
      quarter: 1,
      state: 'open',
    })
    setPeriodDialogOpen(true)
  }

  const handleEditPeriod = (p: any) => {
    setEditPeriodId(p.id)
    setPeriodForm({
      fiscalYearId: p.fiscalYearId,
      name: p.name,
      startDate: formatDateForInput(p.startDate),
      endDate: formatDateForInput(p.endDate),
      quarter: p.quarter || 1,
      state: p.state,
    })
    setPeriodDialogOpen(true)
  }

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(
      'fiscal-periods',
      filteredPeriods.map((p: any) => ({
        year: p.fiscalYearName,
        period: p.name,
        start: new Date(p.startDate).toLocaleDateString('en-CA'),
        end: new Date(p.endDate).toLocaleDateString('en-CA'),
        quarter: p.quarter ? `Q${p.quarter}` : '',
        state: p.state,
      }))
    )
    toast.success(txt('تم تصدير البيانات إلى CSV بنجاح', 'Exported to CSV successfully'))
  }

  const handleExportExcel = () => {
    exportToCSV(
      `fiscal-periods_${new Date().toISOString().slice(0, 10)}`,
      filteredPeriods.map((p: any) => ({
        [txt('السنة المالية', 'Fiscal Year')]: p.fiscalYearName,
        [txt('اسم الفترة', 'Period Name')]: p.name,
        [txt('تاريخ البداية', 'Start Date')]: new Date(p.startDate).toLocaleDateString('en-CA'),
        [txt('تاريخ النهاية', 'End Date')]: new Date(p.endDate).toLocaleDateString('en-CA'),
        [txt('الربع', 'Quarter')]: p.quarter ? `Q${p.quarter}` : '',
        [txt('الحالة', 'Status')]: p.state,
      }))
    )
    toast.success(txt('تم تصدير البيانات إلى Excel بنجاح', 'Exported to Excel successfully'))
  }

  const handleExportWord = () => {
    const title = txt('تقرير الفترات المالية', 'Fiscal Periods Report')
    const headers = [
      txt('السنة المالية', 'Fiscal Year'),
      txt('اسم الفترة', 'Period Name'),
      txt('تاريخ البداية', 'Start Date'),
      txt('تاريخ النهاية', 'End Date'),
      txt('الربع', 'Quarter'),
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
        <p class="subtitle">${txt('تاريخ التصدير:', 'Export Date:')} ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')} | ${txt('إجمالي السجلات:', 'Total Records:')} ${filteredPeriods.length}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredPeriods
        .map(
          (p: any) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${p.fiscalYearName}</td>
                <td>${p.name}</td>
                <td>${new Date(p.startDate).toLocaleDateString('en-CA')}</td>
                <td>${new Date(p.endDate).toLocaleDateString('en-CA')}</td>
                <td>Q${p.quarter || '—'}</td>
                <td>${p.state}</td>
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
    link.setAttribute('download', `fiscal_periods_${new Date().toISOString().slice(0, 10)}.doc`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(txt('تم تصدير البيانات إلى Word بنجاح', 'Exported to Word successfully'))
  }

  const handleExportPDF = () => {
    const printWin = window.open('', '_blank')
    if (!printWin) {
      toast.error(txt('تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.', 'Could not open print window. Allow popups.'))
      return
    }

    const title = txt('تقرير الفترات المالية', 'Fiscal Periods Report')
    const headers = [
      txt('السنة المالية', 'Fiscal Year'),
      txt('اسم الفترة', 'Period Name'),
      txt('تاريخ البداية', 'Start Date'),
      txt('تاريخ النهاية', 'End Date'),
      txt('الربع', 'Quarter'),
      txt('الحالة', 'Status'),
    ]

    const content = `
      <!DOCTYPE html>
      <html dir="${isRTL ? 'rtl' : 'ltr'}" lang="${isRTL ? 'ar' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, system-ui, sans-serif; direction: ${isRTL ? 'rtl' : 'ltr'}; text-align: ${isRTL ? 'right' : 'left'}; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: bold; color: #2563eb; }
          .info { font-size: 11px; color: #475569; }
          h2 { font-size: 16px; color: #1e293b; margin: 0 0 15px 0; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #2563eb; color: white; padding: 7px 9px; border: 1px solid #1d4ed8; text-align: center; font-weight: 600; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; display: inline-block; }
          .badge-open { background-color: #dcfce7; color: #166534; }
          .badge-closed { background-color: #fef3c7; color: #92400e; }
          .badge-locked { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">أورمينال تك - ORMINAL ERP</div>
          <div class="info">${txt('تاريخ التقرير:', 'Report Date:')} ${new Date().toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</div>
        </div>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredPeriods
        .map(
          (p: any) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${p.fiscalYearName}</td>
                <td>${p.name}</td>
                <td>${new Date(p.startDate).toLocaleDateString('en-CA')}</td>
                <td>${new Date(p.endDate).toLocaleDateString('en-CA')}</td>
                <td>Q${p.quarter || '—'}</td>
                <td>
                  <span class="badge ${p.state === 'open' ? 'badge-open' : p.state === 'closed' ? 'badge-closed' : 'badge-locked'}">
                    ${p.state}
                  </span>
                </td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
        <div class="footer">${txt('تم إنشاء المستند تلقائياً عبر نظام Orminal ERP', 'Document generated by Orminal ERP System')}</div>
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
    toast.success(txt('جارٍ فتح نافذة الطباعة…', 'Opening print view…'))
  }

  if (error?.message === 'FORBIDDEN') {
    return (
      <ModuleShell
        title={txt('الفترات المالية', 'Financial Periods')}
        description={txt('إدارة السنوات والفترات المالية', 'Manage fiscal years, periods')}
        icon={<CalendarClock className="size-5" />}
      >
        <Card className="p-10 flex flex-col items-center gap-3 text-center border-destructive/20 bg-destructive/5">
          <ShieldAlert className="size-10 text-destructive" />
          <p className="font-semibold text-lg">{txt('صلاحية غير كافية', 'Insufficient permission')}</p>
          <p className="text-sm text-muted-foreground max-w-md">
            {txt(
              'عرض وإدارة الفترات المالية يتطلب صلاحيات إدارية لتهيئة النظام للمستأجر الحالي. تواصل مع مدير النظام لمنحك الصلاحية.',
              'Viewing and managing fiscal periods requires system configuration administrative permissions for the current tenant. Contact your system administrator.'
            )}
          </p>
        </Card>
      </ModuleShell>
    )
  }

  const bodyContent = (
    <>
      {/* KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              title={txt('السنوات المالية', 'Fiscal Years')}
              value={String(years.length)}
              icon={<CalendarClock className="size-5" />}
              accent="blue"
            />
            <KpiCard
              title={txt('فترات مفتوحة', 'Open Periods')}
              value={String(periods.filter((p: any) => p.state === 'open').length)}
              icon={<Unlock className="size-5" />}
              accent="sky"
            />
            <KpiCard
              title={txt('فترات مغلقة', 'Closed Periods')}
              value={String(periods.filter((p: any) => p.state === 'closed').length)}
              icon={<Lock className="size-5" />}
              accent="amber"
            />
            <KpiCard
              title={txt('فترات مقفلة', 'Locked Periods')}
              value={String(periods.filter((p: any) => p.state === 'locked').length)}
              icon={<AlertCircle className="size-5" />}
              accent="rose"
            />
          </>
        )}
      </div>

      {/* Main Table Card (matching org-structure-module.tsx) */}
      <Card className="border border-border shadow-xs rounded-lg overflow-hidden bg-card">

        {/* ACTION TOOLBAR (Fully Responsive for Mobile & Desktop) */}
        <div className="p-2 sm:p-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
          {/* Search, Columns, Status Filter & Year Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Row 1 on mobile: Search Box + Columns Dropdown */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {/* Columns Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs bg-background shrink-0">
                    <span>{txt('أعمدة', 'Columns')}</span>
                    <ChevronLeft className="size-3 -rotate-90 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-52 max-h-80 overflow-y-auto">
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.fiscalYear}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, fiscalYear: !!v }))}
                  >
                    {txt('السنة المالية', 'Fiscal Year')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.name}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, name: !!v }))}
                  >
                    {txt('اسم الفترة', 'Period Name')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.startDate}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, startDate: !!v }))}
                  >
                    {txt('تاريخ البداية', 'Start Date')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.endDate}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, endDate: !!v }))}
                  >
                    {txt('تاريخ النهاية', 'End Date')}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.quarter}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, quarter: !!v }))}
                  >
                    {txt('الربع', 'Quarter')}
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

              {/* Search Box */}
              <div className="relative flex-1 sm:w-52 min-w-0">
                <Search className={cn('size-3.5 absolute top-2.5 text-muted-foreground pointer-events-none', isRTL ? 'right-2.5' : 'left-2.5')} />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder={txt('بحث في الفترات…', 'Search periods…')}
                  className={cn('h-8 text-xs bg-background w-full', isRTL ? 'pr-7 pl-6' : 'pl-7 pr-6')}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setCurrentPage(1)
                    }}
                    className={cn('absolute top-2 text-muted-foreground hover:text-foreground', isRTL ? 'left-2' : 'right-2')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2 on mobile: Status Filter Pills + Year Dropdown */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap",
                    statusFilter === 'all'
                      ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {txt('الكل', 'All')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('open')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                    statusFilter === 'open'
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-emerald-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {txt('مفتوح', 'Open')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('closed')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                    statusFilter === 'closed'
                      ? "bg-amber-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-amber-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  {txt('مغلق', 'Closed')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('locked')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap",
                    statusFilter === 'locked'
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-rose-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  {txt('مقفل', 'Locked')}
                </button>
              </div>

              {/* Fiscal Year Filter Dropdown */}
              <Select
                value={yearFilter}
                onValueChange={(v) => {
                  setYearFilter(v)
                  setCurrentPage(1)
                }}
                dir={dir}
              >
                <SelectTrigger className="h-7.5 min-w-[110px] max-w-[140px] sm:w-30 text-xs bg-background shrink-0" dir={dir}>
                  <SelectValue placeholder={txt('السنة المالية', 'Fiscal Year')} />
                </SelectTrigger>
                <SelectContent dir={dir}>
                  <SelectItem value="all">{txt('الجميع', 'All')}</SelectItem>
                  {years.map((y: any) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3 on mobile (Right Group on Desktop): Action Tools & Add Buttons */}
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
                    title={txt('خيارات التصدير (Excel, CSV, Word, PDF)', 'Export Options (Excel, CSV, Word, PDF)')}
                  >
                    <FileSpreadsheet className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} sideOffset={6} className="w-35 shadow-xl border-slate-200 dark:border-slate-800 z-50">
                  <DropdownMenuItem onClick={handleExportExcel} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('Excel', 'Excel')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Columns className="size-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('CSV', 'CSV')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileText className="size-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('Word', 'Word')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Printer className="size-4 text-red-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{txt('PDF / طباعة', 'PDF / Print')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Print */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                onClick={handleExportPDF}
                title={txt('طباعة الجدول', 'Print Table')}
              >
                <Printer className="size-4" />
              </Button>

              {/* Refresh */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ['fiscal-years'] })
                  toast.success(txt('تم تحديث البيانات', 'Data refreshed'))
                }}
                title={txt('تحديث البيانات', 'Refresh Data')}
              >
                <RotateCw className="size-4" />
              </Button>

              {/* Lock / Unlock status toggle for selected period */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedPeriod}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedPeriod
                    ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 shadow-xs hover:scale-105"
                    : "text-slate-400 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (!selectedPeriod) return
                  if (selectedPeriod.state === 'open') {
                    updatePeriodMut.mutate({ id: selectedPeriod.id, state: 'closed' })
                  } else if (selectedPeriod.state === 'closed') {
                    updatePeriodMut.mutate({ id: selectedPeriod.id, state: 'locked' })
                  } else {
                    updatePeriodMut.mutate({ id: selectedPeriod.id, state: 'open' })
                  }
                }}
                title={
                  selectedPeriod
                    ? selectedPeriod.state === 'open'
                      ? txt('إغلاق الفترة المحددة', 'Close selected period')
                      : selectedPeriod.state === 'closed'
                        ? txt('قفل الفترة المحددة', 'Lock selected period')
                        : txt('فتح الفترة المحددة', 'Open selected period')
                    : txt('اختر فترة من الجدول لتغيير حالتها', 'Select a period from the table')
                }
              >
                <Lock className="size-4" />
              </Button>

              {/* Edit selected period */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedPeriod}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedPeriod
                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs hover:scale-105"
                    : "text-amber-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedPeriod) handleEditPeriod(selectedPeriod)
                }}
                title={
                  selectedPeriod
                    ? txt('تعديل الفترة المحددة', 'Edit selected period')
                    : txt('اختر فترة من الجدول للتعديل', 'Select a period to edit')
                }
              >
                <Edit2 className="size-4" />
              </Button>
            </div>

          </div>
        </div>

        {/* MAIN GRID TABLE WITH HORIZONTAL SCROLLBAR */}
        <div className="overflow-x-auto min-h-[380px] w-full">
          <Table className="min-w-[860px] border-collapse text-[11px] table-fixed">
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
              <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                {visibleCols.fiscalYear && (
                  <TableHead
                    style={{
                      width: `${colWidths.fiscalYear || 140}px`,
                      minWidth: `${colWidths.fiscalYear || 140}px`,
                      maxWidth: `${colWidths.fiscalYear || 140}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isRTL ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{txt('السنة المالية', 'Fiscal Year')}</span>

                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('fiscalYear', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, fiscalYear: DEFAULT_COL_WIDTHS.fiscalYear }))}
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
                      <span className="truncate">{txt('اسم الفترة', 'Period Name')}</span>

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

                {visibleCols.startDate && (
                  <TableHead
                    style={{
                      width: `${colWidths.startDate || 125}px`,
                      minWidth: `${colWidths.startDate || 125}px`,
                      maxWidth: `${colWidths.startDate || 125}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{txt('تاريخ البداية', 'Start Date')}</span>

                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('startDate', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, startDate: DEFAULT_COL_WIDTHS.startDate }))}
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

                {visibleCols.endDate && (
                  <TableHead
                    style={{
                      width: `${colWidths.endDate || 125}px`,
                      minWidth: `${colWidths.endDate || 125}px`,
                      maxWidth: `${colWidths.endDate || 125}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{txt('تاريخ النهاية', 'End Date')}</span>

                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('endDate', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, endDate: DEFAULT_COL_WIDTHS.endDate }))}
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

                {visibleCols.quarter && (
                  <TableHead
                    style={{
                      width: `${colWidths.quarter || 90}px`,
                      minWidth: `${colWidths.quarter || 90}px`,
                      maxWidth: `${colWidths.quarter || 90}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{txt('الربع', 'Quarter')}</span>

                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('quarter', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, quarter: DEFAULT_COL_WIDTHS.quarter }))}
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

                {visibleCols.state && (
                  <TableHead
                    style={{
                      width: `${colWidths.state || 110}px`,
                      minWidth: `${colWidths.state || 110}px`,
                      maxWidth: `${colWidths.state || 110}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{txt('الحالة', 'Status')}</span>

                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('state', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, state: DEFAULT_COL_WIDTHS.state }))}
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

                {visibleCols.actions && (
                  <TableHead
                    style={{
                      width: `${colWidths.actions || 160}px`,
                      minWidth: `${colWidths.actions || 160}px`,
                      maxWidth: `${colWidths.actions || 160}px`,
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
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedPeriods.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    {txt('لا توجد فترات مالية مطابقة للمعايير المحددة', 'No matching financial periods found')}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPeriods.map((p: any) => {
                  const isSelected = selectedId === p.id

                  return (
                    <TableRow
                      key={p.id}
                      data-selected={isSelected || undefined}
                      onClick={() => setSelectedId(p.id)}
                      onDoubleClick={() => handleEditPeriod(p)}
                      className={cn(
                        "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                        isSelected
                          ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                          : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60"
                      )}
                      style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                    >
                      {visibleCols.fiscalYear && (
                        <TableCell
                          style={{
                            width: `${colWidths.fiscalYear || 140}px`,
                            minWidth: `${colWidths.fiscalYear || 140}px`,
                            maxWidth: `${colWidths.fiscalYear || 140}px`,
                          }}
                          className="font-semibold text-blue-600 dark:text-blue-400 font-mono border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          <span className="truncate block w-full cursor-default" title={p.fiscalYearName}>
                            {p.fiscalYearName}
                          </span>
                        </TableCell>
                      )}

                      {visibleCols.name && (
                        <TableCell
                          style={{
                            width: `${colWidths.name || 180}px`,
                            minWidth: `${colWidths.name || 180}px`,
                            maxWidth: `${colWidths.name || 180}px`,
                          }}
                          className="font-medium text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          <span className="truncate block w-full cursor-default" title={p.name}>
                            {p.name}
                          </span>
                        </TableCell>
                      )}

                      {visibleCols.startDate && (
                        <TableCell
                          style={{
                            width: `${colWidths.startDate || 125}px`,
                            minWidth: `${colWidths.startDate || 125}px`,
                            maxWidth: `${colWidths.startDate || 125}px`,
                          }}
                          className="text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          <span className="truncate block w-full cursor-default">
                            {new Date(p.startDate).toLocaleDateString('en-CA')}
                          </span>
                        </TableCell>
                      )}

                      {visibleCols.endDate && (
                        <TableCell
                          style={{
                            width: `${colWidths.endDate || 125}px`,
                            minWidth: `${colWidths.endDate || 125}px`,
                            maxWidth: `${colWidths.endDate || 125}px`,
                          }}
                          className="text-center font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          <span className="truncate block w-full cursor-default">
                            {new Date(p.endDate).toLocaleDateString('en-CA')}
                          </span>
                        </TableCell>
                      )}

                      {visibleCols.quarter && (
                        <TableCell
                          style={{
                            width: `${colWidths.quarter || 90}px`,
                            minWidth: `${colWidths.quarter || 90}px`,
                            maxWidth: `${colWidths.quarter || 90}px`,
                          }}
                          className="text-center font-mono font-bold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          Q{p.quarter || '—'}
                        </TableCell>
                      )}

                      {visibleCols.state && (
                        <TableCell
                          style={{
                            width: `${colWidths.state || 110}px`,
                            minWidth: `${colWidths.state || 110}px`,
                            maxWidth: `${colWidths.state || 110}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden"
                        >
                          <div className="flex items-center justify-center">
                            {p.state === 'open' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                {txt('مفتوح', 'Open')}
                              </span>
                            )}
                            {p.state === 'closed' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                <span className="size-1.5 rounded-full bg-amber-500" />
                                {txt('مغلق', 'Closed')}
                              </span>
                            )}
                            {p.state === 'locked' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                                <span className="size-1.5 rounded-full bg-rose-500" />
                                {txt('مقفل', 'Locked')}
                              </span>
                            )}
                            {p.state !== 'open' && p.state !== 'closed' && p.state !== 'locked' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                <span className="size-1.5 rounded-full bg-slate-400" />
                                {txt('مسودة', 'Draft')}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {visibleCols.actions && (
                        <TableCell
                          style={{
                            width: `${colWidths.actions || 160}px`,
                            minWidth: `${colWidths.actions || 160}px`,
                            maxWidth: `${colWidths.actions || 160}px`,
                          }}
                          className="py-1 px-2 overflow-hidden"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                              onClick={() => handleEditPeriod(p)}
                              title={txt('تعديل الفترة', 'Edit Period')}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            {p.state === 'open' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-1.5 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/40 border-amber-300/60 font-medium"
                                onClick={() => updatePeriodMut.mutate({ id: p.id, state: 'closed' })}
                              >
                                {txt('إغلاق', 'Close')}
                              </Button>
                            )}
                            {p.state === 'closed' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-1.5 text-[10px] text-rose-700 hover:text-rose-800 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border-rose-300/60 font-medium"
                                  onClick={() => updatePeriodMut.mutate({ id: p.id, state: 'locked' })}
                                >
                                  {txt('قفل', 'Lock')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 px-1.5 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border-emerald-300/60 font-medium"
                                  onClick={() => updatePeriodMut.mutate({ id: p.id, state: 'open' })}
                                >
                                  {txt('فتح', 'Open')}
                                </Button>
                              </>
                            )}
                            {p.state === 'locked' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-1.5 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border-emerald-300/60 font-medium"
                                onClick={() => updatePeriodMut.mutate({ id: p.id, state: 'open' })}
                              >
                                {txt('فتح', 'Open')}
                              </Button>
                            )}
                            {p.state === 'draft' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-1.5 text-[10px] text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40 border-emerald-300/60 font-medium"
                                onClick={() => updatePeriodMut.mutate({ id: p.id, state: 'open' })}
                              >
                                {txt('فتح', 'Open')}
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

        {/* PAGINATION FOOTER (Exact replica of org-structure-module.tsx) */}
        <div className="p-2.5 bg-slate-100/90 dark:bg-slate-900 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>
              {txt(
                `${currentPage} من ${totalPages} صفحة العناصر ${filteredPeriods.length}`,
                `Page ${currentPage} of ${totalPages} (Items ${filteredPeriods.length})`
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
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
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
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
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 p-0 bg-background"
                title={txt('الصفحة السابقة', 'Previous Page')}
              >
                <ChevronLeft className="size-3.5" />
              </Button>

              <span className="h-7 min-w-[28px] px-2 flex items-center justify-center rounded-md bg-blue-600 text-white font-mono font-bold text-xs">
                {currentPage}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 bg-background"
                title={txt('الصفحة التالية', 'Next Page')}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-7 w-7 p-0 bg-background"
                title={txt('الصفحة الأخيرة', 'Last Page')}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog: Add Fiscal Year */}
      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent
          className="max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700"
          dir={dir}
        >
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-[#E6F0FF] dark:bg-none dark:bg-blue-700/80 border-b border-blue-100 dark:border-blue-600/40 p-6 shrink-0 relative">
            <div className="flex items-start gap-4 text-start">
              <div className="size-12 rounded-xl bg-white dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-sm shrink-0">
                <CalendarClock className="size-6" />
              </div>
              <div className="space-y-1 flex-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-blue-955 dark:text-white">
                  {txt('إضافة سنة مالية جديدة', 'Add New Fiscal Year')}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="p-6 space-y-5 bg-slate-50/30 dark:bg-slate-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
              {/* Year Name */}
              <div className="space-y-1.5 text-start md:col-span-2">
                <Label htmlFor="yearName" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('اسم السنة *', 'Year Name *')}
                </Label>
                <Input
                  id="yearName"
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="2026"
                  className="h-10 border-slate-250 dark:border-blue-400/30 focus-visible:ring-blue-500"
                  dir={dir}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="yearStartDate" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('تاريخ البداية *', 'Start Date *')}
                </Label>
                <DatePicker
                  id="yearStartDate"
                  value={yearForm.startDate}
                  onChange={(val) => setYearForm({ ...yearForm, startDate: val })}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="yearEndDate" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('تاريخ النهاية *', 'End Date *')}
                </Label>
                <DatePicker
                  id="yearEndDate"
                  value={yearForm.endDate}
                  onChange={(val) => setYearForm({ ...yearForm, endDate: val })}
                />
              </div>

              {/* Period Type */}
              <div className="space-y-1.5 text-start md:col-span-2">
                <Label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('نوع الفترة', 'Period Type')}
                </Label>
                <Select
                  value={yearForm.periodType}
                  onValueChange={(val) => setYearForm({ ...yearForm, periodType: val })}
                  dir={dir}
                >
                  <SelectTrigger className="h-10 border-slate-250 dark:border-blue-400/30" dir={dir}>
                    <SelectValue placeholder={txt('اختر نوع الفترة', 'Select period type')} />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value="monthly">{txt('شهري', 'Monthly')}</SelectItem>
                    <SelectItem value="quarterly">{txt('ربع سنوي', 'Quarterly')}</SelectItem>
                    <SelectItem value="semi-annual">{txt('نصف سنوي', 'Semi-Annual')}</SelectItem>
                    <SelectItem value="annual">{txt('سنوي', 'Annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Auto Generate Periods */}
              <div className="md:col-span-2 flex items-center gap-3 p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-300/50 dark:border-blue-400/30 rounded-xl">
                <Switch
                  checked={yearForm.autoPeriods}
                  onCheckedChange={(val) => setYearForm({ ...yearForm, autoPeriods: val })}
                  id="auto-gen-periods"
                  className="data-[state=checked]:bg-blue-600 shrink-0"
                />
                <div className="space-y-0.5 flex-1 text-start">
                  <Label
                    htmlFor="auto-gen-periods"
                    className="text-sm font-bold text-blue-955 dark:text-blue-200 cursor-pointer"
                  >
                    {txt('توليد الفترات تلقائياً', 'Auto Generate Periods')}
                  </Label>
                  <p className="text-xs text-blue-800/70 dark:text-blue-300/60 leading-normal">
                    {txt(
                      'توليد جميع الفترات المالية تلقائياً داخل هذه السنة بناء على النوع المحدد',
                      'Automatically generate all related financial periods based on the selected type'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setYearDialogOpen(false)}
              className="h-10 px-5 border-slate-250 dark:border-blue-400/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {txt('إلغاء', 'Cancel')}
            </Button>
            <Button
              onClick={() => createYearMut.mutate()}
              disabled={!yearForm.name || !yearForm.startDate || !yearForm.endDate || createYearMut.isPending}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              {createYearMut.isPending ? txt('جاري الإضافة...', 'Adding...') : txt('اضافة وحفـظ', 'Add and Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Add/Edit Fiscal Period */}
      <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
        <DialogContent
          className="max-w-xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          dir={dir}
        >
          <DialogHeader className="bg-gradient-to-r from-blue-50 to-[#E6F0FF] dark:bg-none dark:bg-blue-700/80 border-b border-blue-100 dark:border-blue-600/40 p-6 shrink-0 relative">
            <div className="flex items-start gap-4 text-start">
              <div className="size-12 rounded-xl bg-white dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-sm shrink-0">
                <CalendarClock className="size-6" />
              </div>
              <div className="space-y-1 flex-1">
                <DialogTitle className="text-xl font-bold tracking-tight text-blue-955 dark:text-white">
                  {editPeriodId
                    ? txt('تعديل الفترة المالية', 'Edit Financial Period')
                    : txt('إضافة فترة مالية جديدة', 'Add New Financial Period')}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="p-6 space-y-5 bg-slate-50/30 dark:bg-slate-900/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-1">
              {/* Fiscal Year (Selected) */}
              <div className="space-y-1.5 text-start md:col-span-2">
                <Label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('السنة المالية *', 'Fiscal Year *')}
                </Label>
                <Select
                  value={periodForm.fiscalYearId}
                  onValueChange={(val) => setPeriodForm({ ...periodForm, fiscalYearId: val })}
                  disabled={!!editPeriodId}
                  dir={dir}
                >
                  <SelectTrigger className="h-10 border-slate-250 dark:border-blue-400/30" dir={dir}>
                    <SelectValue placeholder={txt('اختر السنة المالية', 'Select Fiscal Year')} />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    {years.map((y: any) => (
                      <SelectItem key={y.id} value={y.id}>
                        {y.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Period Name */}
              <div className="space-y-1.5 text-start md:col-span-2">
                <Label htmlFor="periodName" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('اسم الفترة *', 'Period Name *')}
                </Label>
                <Input
                  id="periodName"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  placeholder={txt('يناير 2026', 'January 2026')}
                  className="h-10 border-slate-250 dark:border-blue-400/30 focus-visible:ring-blue-500"
                  dir={dir}
                />
              </div>

              {/* Start Date */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="periodStartDate" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('تاريخ البداية *', 'Start Date *')}
                </Label>
                <DatePicker
                  id="periodStartDate"
                  value={periodForm.startDate}
                  onChange={(val) => setPeriodForm({ ...periodForm, startDate: val })}
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5 text-start">
                <Label htmlFor="periodEndDate" className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('تاريخ النهاية *', 'End Date *')}
                </Label>
                <DatePicker
                  id="periodEndDate"
                  value={periodForm.endDate}
                  onChange={(val) => setPeriodForm({ ...periodForm, endDate: val })}
                />
              </div>

              {/* Quarter Select */}
              <div className="space-y-1.5 text-start">
                <Label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('الربع', 'Quarter')}
                </Label>
                <Select
                  value={String(periodForm.quarter)}
                  onValueChange={(val) => setPeriodForm({ ...periodForm, quarter: parseInt(val) })}
                  dir={dir}
                >
                  <SelectTrigger className="h-10 border-slate-250 dark:border-blue-400/30" dir={dir}>
                    <SelectValue placeholder={txt('الربع', 'Quarter')} />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value="1">{txt('الربع الأول (Q1)', 'Q1')}</SelectItem>
                    <SelectItem value="2">{txt('الربع الثاني (Q2)', 'Q2')}</SelectItem>
                    <SelectItem value="3">{txt('الربع الثالث (Q3)', 'Q3')}</SelectItem>
                    <SelectItem value="4">{txt('الربع الرابع (Q4)', 'Q4')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5 text-start">
                <Label className="text-xs font-semibold text-slate-650 dark:text-slate-400">
                  {txt('الحالة', 'Status')}
                </Label>
                <Select
                  value={periodForm.state}
                  onValueChange={(val) => setPeriodForm({ ...periodForm, state: val })}
                  dir={dir}
                >
                  <SelectTrigger className="h-10 border-slate-250 dark:border-blue-400/30" dir={dir}>
                    <SelectValue placeholder={txt('الحالة', 'Status')} />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    <SelectItem value="draft">{txt('مسودة', 'Draft')}</SelectItem>
                    <SelectItem value="open">{txt('مفتوح', 'Open')}</SelectItem>
                    <SelectItem value="closed">{txt('مغلق', 'Closed')}</SelectItem>
                    <SelectItem value="locked">{txt('مقفل', 'Locked')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogBody>

          <DialogFooter className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setPeriodDialogOpen(false)}
              className="h-10 px-5 border-slate-250 dark:border-blue-400/30 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {txt('إلغاء', 'Cancel')}
            </Button>
            <Button
              onClick={() => savePeriodMut.mutate()}
              disabled={
                !periodForm.name ||
                !periodForm.startDate ||
                !periodForm.endDate ||
                !periodForm.fiscalYearId ||
                savePeriodMut.isPending
              }
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold shadow-sm"
            >
              {savePeriodMut.isPending ? txt('جاري الحفظ...', 'Saving...') : txt('حفظ', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )

  if (embedded) {
    return (
      <div className="flex flex-col gap-4 w-full">
        {/* Top Header & Actions Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{txt('الفترات المالية', 'Financial Periods')}</h2>
              <p className="text-xs text-muted-foreground">
                {txt('إدارة السنوات والفترات المالية', 'Manage fiscal years, periods')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddYear}
              className="gap-1.5 border-slate-250 dark:border-blue-400/30 text-slate-700 dark:text-slate-300 h-8 text-xs"
            >
              <CalendarClock className="size-3.5 text-blue-600" />
              <span>{txt('إضافة سنة مالية', 'Add Fiscal Year')}</span>
            </Button>
            {/* <Button
              size="sm"
              onClick={handleAddPeriod}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 text-xs"
            >
              <Plus className="size-3.5" />
              <span>{txt('إضافة فترة مالية', 'Add Financial Period')}</span>
            </Button> */}
          </div>
        </div>

        {bodyContent}
      </div>
    )
  }

  return (
    <ModuleShell
      title={txt('الفترات المالية', 'Financial Periods')}
      description={txt('إدارة السنوات والفترات المالية ', 'Manage fiscal years, periods ')}
      icon={<CalendarClock className="size-5" />}
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddYear}
            className="gap-1.5 border-slate-250 dark:border-blue-400/30 text-slate-700 dark:text-slate-300 h-8 text-xs"
          >
            <CalendarClock className="size-3.5 text-blue-600" />
            <span>{txt('إضافة سنة مالية', 'Add Fiscal Year')}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleAddPeriod}
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-8 text-xs"
          >
            <Plus className="size-3.5" />
            <span>{txt('إضافة فترة مالية', 'Add Financial Period')}</span>
          </Button>
        </div>
      }
    >
      {bodyContent}
    </ModuleShell>
  )
}

export default FiscalPeriodsModule
