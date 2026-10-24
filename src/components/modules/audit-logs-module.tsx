'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ModuleShell } from '@/components/erp/module-shell'
import { KpiCard } from '@/components/erp/kpi-card'
import { useT } from '@/lib/i18n/use-t'
import { formatInt, formatDateTime } from '@/lib/format'
import { exportToCSV } from '@/lib/export'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody, DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DatePicker } from '@/components/ui/date-picker'
import {
  ScrollText, CalendarClock, Activity, FileEdit, Eye, Printer, FileSpreadsheet, RotateCw, Filter, ArrowRightLeft, FileCode, Search, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react'

interface AuditLog {
  id: string
  userId?: string
  companyId?: string
  moduleCode: string
  documentType: string
  documentId?: string
  action: string
  oldValue?: string | any
  newValue?: string | any
  reason?: string
  ipAddress?: string
  deviceInfo?: string
  correlationId?: string
  createdAt: string
  user?: {
    id: string
    userCode?: number
    nameAr: string
    nameEn?: string
    username?: string
    email?: string
  }
}

interface AuditResponse {
  data: AuditLog[]
  availableDocTypes?: string[]
  meta: {
    pagination: { page: number; pageSize: number; total: number; totalPages: number; hasMore: boolean }
    extras?: {
      today: number
      byAction: { create: number; update: number; delete: number; post: number }
      byModule: Record<string, number>
      availableDocTypes?: string[]
    }
  }
}

const ACTIONS = [
  { value: 'all', label: 'كل الإجراءات' },
  { value: 'create', label: 'إنشاء / إضافة' },
  { value: 'update', label: 'تحديث / تعديل' },
  { value: 'delete', label: 'حذف' },
  { value: 'post', label: 'ترحيل' },
  { value: 'reverse', label: 'عكس' },
  { value: 'cancel', label: 'إلغاء' },
  { value: 'approve', label: 'اعتماد' },
  { value: 'login', label: 'تسجيل دخول' },
  { value: 'logout', label: 'تسجيل خروج' },
  { value: 'export', label: 'تصدير' },
]

const MODULES = [
  { value: 'all', label: 'كل الوحدات' },
  { value: 'FIN', label: 'مالية (FIN)' },
  { value: 'SAL', label: 'مبيعات (SAL)' },
  { value: 'PUR', label: 'مشتريات (PUR)' },
  { value: 'INV', label: 'مخزون (INV)' },
  { value: 'MFG', label: 'تصنيع (MFG)' },
  { value: 'HR', label: 'موارد بشرية (HR)' },
  { value: 'SYS', label: 'نظام وصلاحيات (SYS)' },
]

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  update: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  delete: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  post: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  reverse: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  cancel: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  approve: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  login: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
  logout: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  export: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
}

function truncate(s?: string, n = 45): string {
  if (!s) return '—'
  return s.length > n ? s.slice(0, n) + '…' : s
}

function parseJsonSafe(val?: any): any {
  if (!val) return null
  if (typeof val === 'object') return val
  try {
    return JSON.parse(val)
  } catch {
    return val
  }
}

function prettyJson(val?: any): string {
  if (!val) return ''
  const parsed = parseJsonSafe(val)
  if (typeof parsed === 'object') {
    return JSON.stringify(parsed, null, 2)
  }
  return String(parsed)
}

export function AuditLogsModule() {
  const { t } = useT()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filterAction, setFilterAction] = useState('all')
  const [filterModule, setFilterModule] = useState('all')
  const [filterDocType, setFilterDocType] = useState('all')
  const [filterUserId, setFilterUserId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [dir, setDir] = useState<'rtl' | 'ltr'>('rtl')

  // Diff Modal states
  const [viewOpen, setViewOpen] = useState(false)
  const [viewing, setViewing] = useState<AuditLog | null>(null)
  const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'raw'>('side-by-side')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateDir = () => {
        const docDir = document.documentElement.dir || 'rtl'
        setDir(docDir as 'rtl' | 'ltr')
      }
      updateDir()
      const observer = new MutationObserver(updateDir)
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['dir'],
      })
      return () => observer.disconnect()
    }
  }, [])

  const isRTL = dir === 'rtl'

  // Fetch users for filter dropdown
  const { data: usersResponse } = useQuery({
    queryKey: ['users-for-audit-logs'],
    queryFn: async () => {
      const res = await fetch('/api/erp/users?pageSize=100')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })
  const rawUsers = usersResponse?.data
  const users: any[] = Array.isArray(rawUsers)
    ? rawUsers
    : Array.isArray(rawUsers?.data)
      ? rawUsers.data
      : Array.isArray(rawUsers?.items)
        ? rawUsers.items
        : []

  // Main Audit Logs Query
  const { data, isLoading, refetch } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', filterAction, filterModule, filterDocType, filterUserId, dateFrom, dateTo, search, page, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filterAction !== 'all') params.set('action', filterAction)
      if (filterModule !== 'all') params.set('module', filterModule)
      if (filterDocType !== 'all') params.set('documentType', filterDocType)
      if (filterUserId !== 'all') params.set('userId', filterUserId)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      if (search) params.set('q', search)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const r = await fetch(`/api/erp/audit-logs?${params}`)
      if (!r.ok) throw new Error('فشل جلب سجل التدقيق')
      return r.json()
    },
  })

  const logs = data?.data ?? []
  const total = data?.meta?.pagination?.total ?? 0
  const totalPages = data?.meta?.pagination?.totalPages ?? 1
  const extras = data?.meta?.extras
  const availableDocTypes: string[] = data?.availableDocTypes || extras?.availableDocTypes || []

  // KPI Calculations
  const totalLogs = total
  const todayCount = extras?.today ?? 0
  const byAction = extras?.byAction ?? { create: 0, update: 0, delete: 0, post: 0 }
  const byModule = extras?.byModule ?? {}

  const topActionEntry = Object.entries(byAction).sort((a, b) => b[1] - a[1])[0]
  const topActionLabel = topActionEntry && topActionEntry[1] > 0
    ? `${ACTIONS.find((a) => a.value === topActionEntry[0])?.label ?? topActionEntry[0]} (${topActionEntry[1]})`
    : '—'

  const topModuleEntry = Object.entries(byModule).sort((a, b) => b[1] - a[1])[0]
  const topModuleLabel = topModuleEntry && topModuleEntry[1] > 0
    ? `${MODULES.find((m) => m.value === topModuleEntry[0])?.label ?? topModuleEntry[0]} (${topModuleEntry[1]})`
    : '—'

  const handleApplySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
    refetch()
  }

  const handleResetFilters = () => {
    setSearch('')
    setSearchInput('')
    setFilterAction('all')
    setFilterModule('all')
    setFilterDocType('all')
    setFilterUserId('all')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const handleExport = () => {
    const rows = logs.map((l, idx) => ({
      '#': (page - 1) * pageSize + idx + 1,
      'التاريخ والوقت': formatDateTime(l.createdAt),
      'المستخدم': l.user?.nameAr || l.user?.username || '—',
      'كود المستخدم': l.user?.userCode ?? '—',
      'الوحدة': l.moduleCode,
      'نوع المستند': l.documentType,
      'معرف المستند': l.documentId ?? '—',
      'الإجراء': ACTIONS.find((a) => a.value === l.action.toLowerCase())?.label ?? l.action,
      'البيان / السبب': l.reason ?? '—',
      'القيمة القديمة': prettyJson(l.oldValue),
      'القيمة الجديدة': prettyJson(l.newValue),
      'عنوان IP': l.ipAddress ?? '—',
      'معرف الارتباط': l.correlationId ?? '—',
    }))
    exportToCSV(`سجل_التدقيق_الشامل_${new Date().toISOString().slice(0, 10)}`, rows)
    toast.success('تم تصدير سجل التدقيق بنجاح')
  }

  const openView = (log: AuditLog) => {
    setViewing(log)
    setDiffViewMode('side-by-side')
    setViewOpen(true)
  }

  return (
    <ModuleShell
      title={t('module.audit-logs')}
      description="سجل التدقيق الشامل لكل الإجراءات والمعاملات في النظام "
      icon={<ScrollText className="size-5" />}
      searchValue={searchInput}
      onSearch={setSearchInput}
      searchPlaceholder="ابحث بالبيان، السبب، معرف الوثيقة، اسم المستخدم، نوع الوثيقة..."
      onExport={handleExport}
      actions={
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.print()}
            className="h-8 px-2.5 text-xs text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
            title="طباعة السجل"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline mr-1 text-[11px]">طباعة</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border-slate-200 dark:border-slate-700"
            title="إعادة ضبط الفلاتر"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline mr-1 text-[11px]">إعادة ضبط</span>
          </Button>
        </div>
      }
      filters={
        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
            <SelectTrigger size="sm" className="w-36 text-xs h-8">
              <SelectValue placeholder="نوع الإجراء" />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Module Filter */}
          <Select value={filterModule} onValueChange={(v) => { setFilterModule(v); setPage(1) }}>
            <SelectTrigger size="sm" className="w-36 text-xs h-8">
              <SelectValue placeholder="الوحدة" />
            </SelectTrigger>
            <SelectContent>
              {MODULES.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Document Type Filter */}
          <Select value={filterDocType} onValueChange={(v) => { setFilterDocType(v); setPage(1) }}>
            <SelectTrigger size="sm" className="w-40 text-xs h-8">
              <SelectValue placeholder="نوع الوثيقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">كل أنواع الوثائق</SelectItem>
              {availableDocTypes.map((dt) => (
                <SelectItem key={dt} value={dt} className="text-xs">{dt}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* User Filter */}
          <Select value={filterUserId} onValueChange={(v) => { setFilterUserId(v); setPage(1) }}>
            <SelectTrigger size="sm" className="w-44 text-xs h-8">
              <SelectValue placeholder="المستخدم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">كل المستخدمين</SelectItem>
              {users.map((u: any) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  {u.userCode ? `[${u.userCode}] ` : ''}{u.nameAr || u.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range */}
          <DatePicker
            value={dateFrom}
            onChange={(val) => { setDateFrom(val); setPage(1) }}
            placeholder="من تاريخ"
            className="w-32 h-8 text-xs"
          />
          <DatePicker
            value={dateTo}
            onChange={(val) => { setDateTo(val); setPage(1) }}
            placeholder="إلى تاريخ"
            className="w-32 h-8 text-xs"
          />

          <Button
            size="sm"
            onClick={handleApplySearch}
            className="h-8 px-3 text-xs gap-1 bg-primary hover:bg-primary/90 text-white font-medium shadow-xs"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>تطبيق</span>
          </Button>

          {search && (
            <Badge variant="secondary" className="text-xs h-8 gap-1.5 px-2.5 shrink-0">
              <span>الفلتر: {search}</span>
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setSearchInput('')
                  setPage(1)
                }}
                className="hover:text-destructive font-bold cursor-pointer"
                title="إلغاء الفلتر"
              >
                ×
              </button>
            </Badge>
          )}
        </div>
      }
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mb-3">
        <KpiCard
          title="إجمالي السجلات"
          value={formatInt(totalLogs)}
          icon={<ScrollText className="size-5" />}
          accent="blue"
        />
        <KpiCard
          title="سجلات اليوم"
          value={formatInt(todayCount)}
          icon={<CalendarClock className="size-5" />}
          accent="sky"
        />
        <KpiCard
          title="الأكثر إجراءً"
          value={topActionLabel}
          icon={<Activity className="size-5" />}
          accent="amber"
        />
        <KpiCard
          title="الأكثر وحدةً"
          value={topModuleLabel}
          icon={<FileEdit className="size-5" />}
          accent="violet"
        />
      </div>

      {/* Main Table Card */}
      <Card className="rounded-xl overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
        <div className="overflow-x-auto min-h-[420px] w-full">
          <Table className="min-w-[1050px] border-collapse text-xs table-fixed">
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
              <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                <TableHead style={{ width: '45px' }} className="font-bold py-1.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                  #
                </TableHead>
                <TableHead style={{ width: '135px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  التاريخ والوقت
                </TableHead>
                <TableHead style={{ width: '160px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  المستخدم
                </TableHead>
                <TableHead style={{ width: '80px' }} className="font-bold py-1.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                  الوحدة
                </TableHead>
                <TableHead style={{ width: '130px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  نوع المستند
                </TableHead>
                <TableHead style={{ width: '140px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  معرف المستند
                </TableHead>
                <TableHead style={{ width: '100px' }} className="font-bold py-1.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                  الإجراء
                </TableHead>
                <TableHead className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  البيان / السبب
                </TableHead>
                <TableHead style={{ width: '110px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                  عنوان IP
                </TableHead>
                <TableHead style={{ width: '70px' }} className="font-bold py-1.5 px-2 text-center">
                  عرض
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="h-8 border-b border-slate-100 dark:border-slate-800">
                    <TableCell colSpan={10} className="py-2 px-2 text-center text-muted-foreground animate-pulse">
                      جاري تحميل سجل التدقيق الشامل...
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-16">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                    لا توجد أحداث أو عمليات مسجلة تطابق الفلاتر المحددة.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((l, idx) => {
                  const actKey = (l.action || '').toLowerCase()
                  const actLabel = ACTIONS.find((a) => a.value === actKey)?.label ?? l.action
                  const badgeStyle = ACTION_BADGE[actKey] ?? 'bg-slate-100 text-slate-700'
                  return (
                    <TableRow
                      key={l.id}
                      className="h-8 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      onClick={() => openView(l)}
                    >
                      <TableCell className="py-1 px-2 text-center font-mono text-[11px] text-slate-500 border-r border-slate-100 dark:border-slate-800">
                        {(page - 1) * pageSize + idx + 1}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(l.createdAt)}
                      </TableCell>
                      <TableCell className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 truncate">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {l.user?.nameAr || l.user?.username || <span className="text-muted-foreground">—</span>}
                        </span>
                        {l.user?.userCode && (
                          <span className="text-[10px] font-mono text-muted-foreground mr-1">
                            ({l.user.userCode})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800">
                        <Badge variant="outline" className="font-mono text-[10px] px-1 py-0">
                          {l.moduleCode}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-2 font-mono text-[11px] text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 truncate">
                        {l.documentType}
                      </TableCell>
                      <TableCell className="py-1 px-2 font-mono text-[11px] text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 truncate">
                        {l.documentId ?? '—'}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                        <Badge className={`text-[10px] font-medium px-1.5 py-0.5 ${badgeStyle}`}>
                          {actLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-1 px-2 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 truncate max-w-[220px]" title={l.reason ?? ''}>
                        {l.reason ?? '—'}
                      </TableCell>
                      <TableCell className="py-1 px-2 font-mono text-[10px] text-muted-foreground border-r border-slate-100 dark:border-slate-800 truncate" dir="ltr">
                        {l.ipAddress ?? '—'}
                      </TableCell>
                      <TableCell className="py-1 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openView(l)}
                          className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-3 w-3" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer & Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs gap-2">
          <div className="text-muted-foreground text-[11px]">
            عرض {logs.length > 0 ? (page - 1) * pageSize + 1 : 0} إلى{' '}
            {Math.min(page * pageSize, total)} من إجمالي {total} عملية مسجلة
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">عدد السجلات:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-6 w-16 text-[11px] px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
              >
                <option value={10}>10</option>
                <option value={25}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-6 w-6 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[11px] px-2 font-medium">
                {page} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-6 w-6 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Advanced Audit Diff & Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800" dir={dir}>
          <DialogHeader className="bg-gradient-to-r rtl:bg-gradient-to-l from-blue-50 to-[#E6F0FF] dark:bg-none dark:bg-blue-700/80 border-b border-blue-100 dark:border-blue-600/40 p-4 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-white dark:bg-blue-950/60 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-300 flex items-center justify-center shadow-xs shrink-0">
                  <ScrollText className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-blue-950 dark:text-white">
                    تفاصيل تدقيق العملية
                  </DialogTitle>
                  <DialogDescription className="text-xs text-blue-700/70 dark:text-blue-200/60">
                    {viewing && (
                      <span>
                        سجل بتاريخ <span className="font-mono dir-ltr">{formatDateTime(viewing.createdAt)}</span> — للقراءة فقط (ADR-014)
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <DialogBody className="p-4 overflow-y-auto max-h-[75vh]">
            {viewing && (
              <div className="space-y-4">
                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">المستخدم:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      {viewing.user?.nameAr || viewing.user?.username || '—'}
                      {viewing.user?.userCode ? ` (${viewing.user.userCode})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">البريد الإلكتروني:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300 truncate block" dir="ltr">
                      {viewing.user?.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">الوحدة والمستند:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">
                      [{viewing.moduleCode}] {viewing.documentType}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">معرف المستند:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {viewing.documentId || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">نوع الإجراء:</span>
                    <Badge variant="outline" className="text-[10px] font-semibold mt-0.5">
                      {ACTIONS.find((a) => a.value === viewing.action.toLowerCase())?.label ?? viewing.action}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">عنوان IP:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300" dir="ltr">
                      {viewing.ipAddress || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">معرف الارتباط (Correlation):</span>
                    <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate block" dir="ltr" title={viewing.correlationId || ''}>
                      {viewing.correlationId || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">البيان / السبب:</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {viewing.reason || 'لا يوجد سبب مدون'}
                    </span>
                  </div>
                </div>

                {/* Mode Toggle Bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                    مقارنة القيم (Old vs New Values)
                  </span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                    <button
                      onClick={() => setDiffViewMode('side-by-side')}
                      className={`px-2.5 py-1 text-[11px] rounded ${diffViewMode === 'side-by-side'
                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      مقارنة جنبًا إلى جنب
                    </button>
                    <button
                      onClick={() => setDiffViewMode('raw')}
                      className={`px-2.5 py-1 text-[11px] rounded ${diffViewMode === 'raw'
                        ? 'bg-white dark:bg-slate-700 text-primary dark:text-white shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                      عرض JSON الخام
                    </button>
                  </div>
                </div>

                {/* Side-by-side or Raw JSON */}
                {diffViewMode === 'side-by-side' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Old Value Box */}
                    <div className="flex flex-col border border-rose-200 dark:border-rose-950/60 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-rose-50 dark:bg-rose-950/30 px-3 py-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 border-b border-rose-200 dark:border-rose-950/60 flex items-center justify-between">
                        <span>القيم السابقة (Old Value)</span>
                        <span className="text-[10px] font-normal text-rose-600/70">قبل التعديل</span>
                      </div>
                      <ScrollArea className="h-64 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                        {viewing.oldValue ? (
                          <pre className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 dir-ltr text-left whitespace-pre-wrap break-all">
                            {prettyJson(viewing.oldValue)}
                          </pre>
                        ) : (
                          <div className="text-center text-muted-foreground py-16 text-xs">
                            لا توجد قيم سابقة (سجل جديد تم إنشاؤه)
                          </div>
                        )}
                      </ScrollArea>
                    </div>

                    {/* New Value Box */}
                    <div className="flex flex-col border border-emerald-200 dark:border-emerald-950/60 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-950/60 flex items-center justify-between">
                        <span>القيم الجديدة (New Value)</span>
                        <span className="text-[10px] font-normal text-emerald-600/70">بعد التعديل</span>
                      </div>
                      <ScrollArea className="h-64 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                        {viewing.newValue ? (
                          <pre className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 dir-ltr text-left whitespace-pre-wrap break-all">
                            {prettyJson(viewing.newValue)}
                          </pre>
                        ) : (
                          <div className="text-center text-muted-foreground py-16 text-xs">
                            لا توجد قيم جديدة (تم حذف السجل أو إلغاؤه)
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <FileCode className="h-3.5 w-3.5 text-primary" />
                      <span>بيانات السجل الكاملة (Raw JSON Record)</span>
                    </div>
                    <ScrollArea className="h-64 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                      <pre className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-slate-200 dir-ltr text-left whitespace-pre-wrap">
                        {JSON.stringify(
                          {
                            id: viewing.id,
                            userId: viewing.userId,
                            user: viewing.user,
                            companyId: viewing.companyId,
                            moduleCode: viewing.moduleCode,
                            documentType: viewing.documentType,
                            documentId: viewing.documentId,
                            action: viewing.action,
                            createdAt: viewing.createdAt,
                            ipAddress: viewing.ipAddress,
                            deviceInfo: viewing.deviceInfo,
                            correlationId: viewing.correlationId,
                            reason: viewing.reason,
                            oldValue: parseJsonSafe(viewing.oldValue),
                            newValue: parseJsonSafe(viewing.newValue),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </ScrollArea>
                  </div>
                )}
              </div>
            )}
          </DialogBody>

          <DialogFooter className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <DialogClose asChild>
              <Button size="sm" variant="outline" className="text-xs">
                إغلاق
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}

