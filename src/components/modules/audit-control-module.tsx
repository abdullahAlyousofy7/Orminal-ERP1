'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogBody,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { exportToCSV } from '@/lib/export'
import {
    ShieldAlert,
    Search,
    RotateCw,
    Printer,
    FileSpreadsheet,
    Filter,
    Calendar,
    Eye,
    ChevronLeft,
    ChevronRight,
    Activity,
    User,
    FileCode,
    ArrowRightLeft,
    AlertCircle,
} from 'lucide-react'

const ACTION_OPTIONS = [
    { value: '', label: 'جميع العمليات' },
    { value: 'CREATE', label: 'إضافة' },
    { value: 'UPDATE', label: 'تعديل ' },
    { value: 'DELETE', label: 'حذف ' },
    { value: 'POST', label: 'ترحيل ' },
    { value: 'REVERSE', label: 'عكس ' },
    { value: 'CANCEL', label: 'إلغاء ' },
    { value: 'APPROVE', label: 'اعتماد' },
    { value: 'LOGIN', label: 'تسجيل دخول ' },
    { value: 'LOGOUT', label: 'تسجيل خروج' },
]

export default function AuditControlModule() {
    const [selectedAction, setSelectedAction] = useState<string>('')
    const [selectedDocType, setSelectedDocType] = useState<string>('')
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [dateFrom, setDateFrom] = useState<string>('')
    const [dateTo, setDateTo] = useState<string>('')
    const [search, setSearch] = useState<string>('')
    const [searchInput, setSearchInput] = useState<string>('')
    const [page, setPage] = useState<number>(1)
    const [pageSize, setPageSize] = useState<number>(25)

    // Selected row for diff modal
    const [activeDiffRow, setActiveDiffRow] = useState<any | null>(null)
    const [diffViewMode, setDiffViewMode] = useState<'side-by-side' | 'raw'>('side-by-side')

    // Fetch Users for filter
    const { data: usersResponse } = useQuery({
        queryKey: ['users-for-audit-control'],
        queryFn: async () => {
            const res = await fetch('/api/erp/permissions/user-data?pageSize=100')
            if (!res.ok) return { data: [] }
            return res.json()
        },
    })
    const rawUsers = usersResponse?.data
    const users: any[] = Array.isArray(rawUsers)
        ? rawUsers
        : Array.isArray(rawUsers?.data)
            ? rawUsers.data
            : []

    // Build query params
    const buildQueryParams = () => {
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('pageSize', String(pageSize))
        if (selectedAction) params.set('action', selectedAction)
        if (selectedDocType) params.set('documentType', selectedDocType)
        if (selectedUserId) params.set('userId', selectedUserId)
        if (dateFrom) params.set('dateFrom', dateFrom)
        if (dateTo) params.set('dateTo', dateTo)
        if (search) params.set('q', search)
        return params.toString()
    }

    // Fetch Audit Records
    const { data: response, isLoading, refetch } = useQuery({
        queryKey: [
            'audit-control-data',
            page,
            pageSize,
            selectedAction,
            selectedDocType,
            selectedUserId,
            dateFrom,
            dateTo,
            search,
        ],
        queryFn: async () => {
            const res = await fetch(`/api/erp/permissions/audit-control?${buildQueryParams()}`)
            if (!res.ok) throw new Error('فشل جلب سجل الرقابة والتدقيق')
            return res.json()
        },
    })

    const rawData = response?.data
    const rows: any[] = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.data)
            ? rawData.data
            : Array.isArray(rawData?.items)
                ? rawData.items
                : Array.isArray(response?.items)
                    ? response.items
                    : []
    const total =
        response?.meta?.pagination?.total ??
        rawData?.total ??
        response?.total ??
        (Array.isArray(rows) ? rows.length : 0)
    const totalPages =
        response?.meta?.pagination?.totalPages ??
        rawData?.totalPages ??
        response?.totalPages ??
        (Math.ceil(total / pageSize) || 1)
    const availableDocTypes: string[] =
        response?.availableDocTypes ??
        rawData?.availableDocTypes ??
        []

    const safeRows = Array.isArray(rows) ? rows : []

    const handleApplyFilter = () => {
        setSearch(searchInput.trim())
        setPage(1)
        refetch()
    }

    const handleResetFilter = () => {
        setSelectedAction('')
        setSelectedDocType('')
        setSelectedUserId('')
        setDateFrom('')
        setDateTo('')
        setSearchInput('')
        setSearch('')
        setPage(1)
    }

    const handleExport = () => {
        const exportData = safeRows.map((r: any) => ({
            '#': r.index,
            'نوع العملية': r.actionAr || r.action,
            'نوع الوثيقة': r.documentType,
            'رقم / معرف الوثيقة': r.documentId || '-',
            'المستخدم': r.userName,
            'كود المستخدم': r.userCode,
            'التاريخ والوقت': r.formattedDate,
            'البيان / السبب': r.reason || '-',
        }))
        exportToCSV(`سجل_الرقابة_والتدقيق_${new Date().toISOString().slice(0, 10)}`, exportData)
    }

    const getActionBadge = (action: string, actionAr?: string) => {
        const act = (action || '').toUpperCase()
        switch (act) {
            case 'CREATE':
                return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-medium">{actionAr || 'إضافة'}</Badge>
            case 'UPDATE':
                return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30 font-medium">{actionAr || 'تعديل'}</Badge>
            case 'DELETE':
                return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 font-medium">{actionAr || 'حذف'}</Badge>
            case 'POST':
                return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30 font-medium">{actionAr || 'ترحيل'}</Badge>
            case 'REVERSE':
                return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 font-medium">{actionAr || 'عكس'}</Badge>
            case 'CANCEL':
                return <Badge className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-medium">{actionAr || 'إلغاء'}</Badge>
            case 'APPROVE':
                return <Badge className="bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30 font-medium">{actionAr || 'اعتماد'}</Badge>
            case 'LOGIN':
                return <Badge className="bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 font-medium">{actionAr || 'دخول'}</Badge>
            case 'LOGOUT':
                return <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30 font-medium">{actionAr || 'خروج'}</Badge>
            default:
                return <Badge variant="outline">{actionAr || act}</Badge>
        }
    }

    // Quick stats calculation
    const createCount = safeRows.filter((r: any) => (r.action || '').toUpperCase() === 'CREATE').length
    const updateCount = safeRows.filter((r: any) => (r.action || '').toUpperCase() === 'UPDATE').length
    const deleteCount = safeRows.filter((r: any) => (r.action || '').toUpperCase() === 'DELETE').length
    const postCount = safeRows.filter((r: any) => (r.action || '').toUpperCase() === 'POST').length

    return (
        <div className="flex flex-col gap-3 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir={'dir'}>
            {/* Top Banner */}
            <div className="flex items-center bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-sm font-semibold">
                        إدارة الصلاحيات › الرقابة
                    </span>
                </div>

            </div>

            {/* Summary KPI Cards - Compact Height */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                <Card className="px-3 py-2 flex items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="min-w-0">
                        <div className="text-[11px] text-muted-foreground font-medium truncate">إجمالي سجلات الصفحة</div>
                        <div className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                            {rows.length} <span className="text-[10px] font-normal text-muted-foreground">من {total}</span>
                        </div>
                    </div>
                    <div className="p-1.5 rounded-md bg-blue-500/10 dark:bg-blue-500/20 text-primary shrink-0 mr-2">
                        <Activity className="h-4 w-4" />
                    </div>
                </Card>

                <Card className="px-3 py-2 flex items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="min-w-0">
                        <div className="text-[11px] text-muted-foreground font-medium truncate">عمليات الإضافة</div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 leading-tight">{createCount}</div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-[10px] px-1.5 py-0.5 shrink-0 mr-2">
                        CREATE
                    </Badge>
                </Card>

                <Card className="px-3 py-2 flex items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="min-w-0">
                        <div className="text-[11px] text-muted-foreground font-medium truncate">عمليات التعديل</div>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400 leading-tight">{updateCount}</div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold text-[10px] px-1.5 py-0.5 shrink-0 mr-2">
                        UPDATE
                    </Badge>
                </Card>

                <Card className="px-3 py-2 flex items-center justify-between bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                    <div className="min-w-0">
                        <div className="text-[11px] text-muted-foreground font-medium truncate">الحذف والترحيل الحساس</div>
                        <div className="text-base font-bold text-rose-600 dark:text-rose-400 leading-tight">{deleteCount + postCount}</div>
                    </div>
                    <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-bold text-[10px] px-1.5 py-0.5 shrink-0 mr-2">
                        CRITICAL
                    </Badge>
                </Card>
            </div>

            {/* Filter Bar Card */}
            <Card className="p-3 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                {/* Tier 1: Responsive 5-column filter fields grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5">
                    {/* Action Filter */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">نوع العملية</Label>
                        <select
                            value={selectedAction}
                            onChange={(e) => setSelectedAction(e.target.value)}
                            className="w-full text-xs h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-primary outline-none text-slate-800 dark:text-slate-100"
                        >
                            {ACTION_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Doc Type Filter */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">نوع الوثيقة</Label>
                        <select
                            value={selectedDocType}
                            onChange={(e) => setSelectedDocType(e.target.value)}
                            className="w-full text-xs h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-primary outline-none text-slate-800 dark:text-slate-100"
                        >
                            <option value="">جميع أنواع الوثائق</option>
                            {availableDocTypes.map((dt) => (
                                <option key={dt} value={dt}>
                                    {dt}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* User Filter */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">المستخدم</Label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            className="w-full text-xs h-8 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md focus:ring-1 focus:ring-primary outline-none text-slate-800 dark:text-slate-100"
                        >
                            <option value="">جميع المستخدمين</option>
                            {users.map((u: any) => (
                                <option key={u.id} value={u.id}>
                                    {u.userCode} - {u.nameAr}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Date From */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">من تاريخ</Label>
                        <Input
                            type="date"
                            dir="ltr"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 w-full"
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex flex-col gap-1">
                        <Label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">إلى تاريخ</Label>
                        <Input
                            type="date"
                            dir="ltr"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="h-8 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 w-full"
                        />
                    </div>
                </div>

                {/* Tier 2: Search input & Action Buttons Row */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
                    {/* Search Box & Active Filter */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="relative flex-1">
                            <Search className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="بحث سريع بالبيان، السبب، معرف الوثيقة، اسم المستخدم..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleApplyFilter()
                                }}
                                className="h-8 text-xs pr-8 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-full"
                            />
                        </div>
                        {search && (
                            <Badge variant="secondary" className="text-xs h-8 gap-1.5 px-2.5 shrink-0">
                                <span>الفلتر: {search}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch('')
                                        setSearchInput('')
                                    }}
                                    className="hover:text-destructive font-bold cursor-pointer"
                                    title="إلغاء الفلتر"
                                >
                                    ×
                                </button>
                            </Badge>
                        )}
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="flex items-center gap-1.5 shrink-0 justify-end flex-wrap sm:flex-nowrap">
                        <Button
                            size="sm"
                            onClick={handleApplyFilter}
                            className="h-8 px-3.5 text-xs gap-1.5 bg-primary hover:bg-primary/90 text-white font-medium shadow-xs flex-1 sm:flex-initial"
                        >
                            <Filter className="h-3.5 w-3.5" />
                            <span>تطبيق</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleResetFilter}
                            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground border-slate-200 dark:border-slate-700"
                            title="إعادة ضبط الفلاتر"
                        >
                            <RotateCw className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline mr-1 text-[11px]">إعادة ضبط</span>
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExport}
                            className="h-8 px-2.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border-slate-200 dark:border-slate-700"
                            title="تصدير إلى Excel / CSV"
                        >
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline mr-1 text-[11px]">تصدير</span>
                        </Button>
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
                    </div>
                </div>
            </Card>

            {/* Main Table Card */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[420px] w-full">
                    <Table className="min-w-[980px] border-collapse text-[11px] table-fixed">
                        <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
                            <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                                <TableHead style={{ width: '45px' }} className="font-bold py-1.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                                    #
                                </TableHead>
                                <TableHead style={{ width: '100px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    نوع العملية
                                </TableHead>
                                <TableHead style={{ width: '140px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    نوع الوثيقة
                                </TableHead>
                                <TableHead style={{ width: '160px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    معرف / رقم السجل
                                </TableHead>
                                <TableHead style={{ width: '150px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    المستخدم
                                </TableHead>
                                <TableHead style={{ width: '140px' }} className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    التاريخ والوقت
                                </TableHead>
                                <TableHead className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
                                    البيان / السبب
                                </TableHead>
                                <TableHead style={{ width: '90px' }} className="font-bold py-1.5 px-2 text-center border-r border-slate-200 dark:border-slate-800">
                                    التفاصيل
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i} className="h-8 border-b border-slate-100 dark:border-slate-800">
                                        <TableCell colSpan={8} className="py-2 px-2 text-center text-muted-foreground animate-pulse">
                                            جاري تحميل سجل الرقابة والتدقيق...
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : safeRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center text-muted-foreground py-16">
                                        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                        لا توجد أحداث أو عمليات مسجلة تطابق الفلاتر المحددة.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRows.map((row: any) => (
                                    <TableRow
                                        key={row.id}
                                        className="h-8 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                    >
                                        <TableCell className="py-1 px-2 text-center font-mono text-slate-500 border-r border-slate-100 dark:border-slate-800">
                                            {row.index}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                            {getActionBadge(row.action, row.actionAr)}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 truncate">
                                            {row.documentType}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 font-mono text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 truncate">
                                            {row.documentId || '—'}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 border-r border-slate-100 dark:border-slate-800 truncate">
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {row.userName}
                                            </span>
                                            {row.userCode && (
                                                <span className="text-[10px] text-muted-foreground mr-1">
                                                    ({row.userCode})
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap font-mono text-[10px]">
                                            {row.formattedDate}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800 truncate max-w-[280px]">
                                            {row.reason || '—'}
                                        </TableCell>
                                        <TableCell className="py-1 px-2 text-center border-r border-slate-100 dark:border-slate-800">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setActiveDiffRow(row)}
                                                className="h-6 px-2 text-[10px] gap-1 text-primary hover:text-primary hover:bg-primary/10"
                                            >
                                                <Eye className="h-3 w-3" />
                                                عرض
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer & Pagination */}
                <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs">
                    <div className="text-muted-foreground text-[11px]">
                        عرض {rows.length > 0 ? (page - 1) * pageSize + 1 : 0} إلى{' '}
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
                                className="h-6 text-[11px] px-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                            >
                                <option value={15}>15</option>
                                <option value={25}>25</option>
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

            {/* JSON Diff & Audit Details Dialog */}
            <Dialog open={Boolean(activeDiffRow)} onOpenChange={(open) => !open && setActiveDiffRow(null)}>
                <DialogContent className="max-w-3xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between text-base">
                            <div className="flex items-center gap-2">
                                <FileCode className="h-4 w-4 text-primary" />
                                <span>تفاصيل تدقيق العملية #{activeDiffRow?.index}</span>
                            </div>

                        </DialogTitle>

                    </DialogHeader>

                    <DialogBody>
                        {activeDiffRow && (
                            <div className="flex flex-col gap-3 py-2 text-xs">
                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">المستخدم:</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-100">{activeDiffRow.userName} ({activeDiffRow.userCode})</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">التاريخ والوقت:</span>
                                        <span className="font-mono">{activeDiffRow.formattedDate}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">نوع الوثيقة:</span>
                                        <span className="font-semibold">{activeDiffRow.documentType}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-muted-foreground block">البيان / السبب:</span>
                                        <span className="text-slate-700 dark:text-slate-300">{activeDiffRow.reason || 'لا يوجد'}</span>
                                    </div>
                                </div>

                                {/* View Mode Toggle */}
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
                                        مقارنة القيم (Old vs New Values)
                                    </span>
                                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md">
                                        <button
                                            onClick={() => setDiffViewMode('side-by-side')}
                                            className={`px-2 py-0.5 text-[10px] rounded ${diffViewMode === 'side-by-side'
                                                ? 'bg-white dark:bg-slate-700 shadow-xs font-semibold'
                                                : 'text-muted-foreground'
                                                }`}
                                        >
                                            مقارنة جنبًا إلى جنب
                                        </button>
                                        <button
                                            onClick={() => setDiffViewMode('raw')}
                                            className={`px-2 py-0.5 text-[10px] rounded ${diffViewMode === 'raw'
                                                ? 'bg-white dark:bg-slate-700 shadow-xs font-semibold'
                                                : 'text-muted-foreground'
                                                }`}
                                        >
                                            عرض JSON
                                        </button>
                                    </div>
                                </div>

                                {/* Diff Content Area */}
                                {diffViewMode === 'side-by-side' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {/* Old Value */}
                                        <div className="flex flex-col border border-rose-200 dark:border-rose-950/60 rounded-md overflow-hidden">
                                            <div className="bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 border-b border-rose-200 dark:border-rose-950/60">
                                                القيم السابقة (Old Value)
                                            </div>
                                            <ScrollArea className="h-64 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                                                {activeDiffRow.oldValue ? (
                                                    <pre className="font-mono text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 dir-ltr text-left">
                                                        {JSON.stringify(activeDiffRow.oldValue, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <div className="text-center text-muted-foreground py-12 text-xs">
                                                        لا توجد قيم سابقة (سجل جديد)
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>

                                        {/* New Value */}
                                        <div className="flex flex-col border border-emerald-200 dark:border-emerald-950/60 rounded-md overflow-hidden">
                                            <div className="bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-950/60">
                                                القيم الجديدة (New Value)
                                            </div>
                                            <ScrollArea className="h-64 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                                                {activeDiffRow.newValue ? (
                                                    <pre className="font-mono text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 dir-ltr text-left">
                                                        {JSON.stringify(activeDiffRow.newValue, null, 2)}
                                                    </pre>
                                                ) : (
                                                    <div className="text-center text-muted-foreground py-12 text-xs">
                                                        لا توجد قيم جديدة (تم حذف السجل)
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden">
                                        <div className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                            بيانات السجل
                                        </div>
                                        <ScrollArea className="h-64 p-2 bg-slate-50/50 dark:bg-slate-900/50">
                                            <pre className="font-mono text-[10px] leading-relaxed text-slate-700 dark:text-slate-300 dir-ltr text-left">
                                                {JSON.stringify(
                                                    {
                                                        id: activeDiffRow.id,
                                                        action: activeDiffRow.action,
                                                        documentType: activeDiffRow.documentType,
                                                        documentId: activeDiffRow.documentId,
                                                        userId: activeDiffRow.userId,
                                                        userName: activeDiffRow.userName,
                                                        createdAt: activeDiffRow.createdAt,
                                                        reason: activeDiffRow.reason,
                                                        oldValue: activeDiffRow.oldValue,
                                                        newValue: activeDiffRow.newValue,
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
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button size="sm" variant="outline" className="text-xs">
                                إغلاق
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
