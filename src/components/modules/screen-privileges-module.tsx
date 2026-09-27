'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import {
  LayoutList,
  Search,
  RotateCw,
  Printer,
  FileSpreadsheet,
  Save,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  CheckCheck,
} from 'lucide-react'
import { SCREEN_ACTIONS, type ScreenActionKey } from '@/lib/erp/screen-catalog'

export default function ScreenPrivilegesModule() {
  const qc = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Local dirty state map: key = `${screenCode}_${actionKey}` -> boolean
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({})

  // Fetch Roles for the dropdown
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles-for-screen-privileges'],
    queryFn: async () => {
      const res = await fetch('/api/erp/permissions/user-groups?pageSize=50')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })
  const roles = Array.isArray(rolesResponse?.data)
    ? rolesResponse.data
    : Array.isArray(rolesResponse?.data?.data)
      ? rolesResponse.data.data
      : []

  // Auto-select first role if none selected
  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  // Fetch Screen Privileges Matrix
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['screen-privileges', selectedRoleId, search, selectedModule, page, pageSize],
    queryFn: async () => {
      if (!selectedRoleId) return { data: [], total: 0 }
      const res = await fetch(
        `/api/erp/permissions/screen-privileges?roleId=${selectedRoleId}&page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('فشل جلب مصفوفة صلاحيات الشاشات')
      return res.json()
    },
    enabled: Boolean(selectedRoleId),
  })

  const rawData = response?.data
  const rows: any[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : []
  const safeRows = Array.isArray(rows) ? rows : []
  const total =
    response?.meta?.pagination?.total ??
    rawData?.total ??
    response?.total ??
    safeRows.length
  const totalPages =
    response?.meta?.pagination?.totalPages ??
    (Math.ceil(total / pageSize) || 1)

  // Seed Excel Grants Mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/erp/permissions/screen-privileges?seed=true&roleId=${selectedRoleId}`)
      if (!res.ok) throw new Error('فشل استيراد الصلاحيات القياسية')
      return res.json()
    },
    onSuccess: () => {
      toast.success('تم استيراد مصفوفة الصلاحيات القياسية من ملف Excel بنجاح (657 سجلاً)')
      qc.invalidateQueries({ queryKey: ['screen-privileges'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Save Changes Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(pendingChanges).map(([screenCode, actions]) => ({
        screenCode,
        ...actions,
      }))
      const res = await fetch('/api/erp/permissions/screen-privileges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: selectedRoleId, updates }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل حفظ التعديلات')
      return data
    },
    onSuccess: (data) => {
      toast.success(`تم حفظ ${data.count} تعديلات بنجاح`)
      setPendingChanges({})
      qc.invalidateQueries({ queryKey: ['screen-privileges'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleToggle = (screenCode: string, actionKey: ScreenActionKey, currentVal: boolean) => {
    const screenPending = pendingChanges[screenCode] || {}
    const fieldName = `can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`
    const newVal = screenPending[fieldName] !== undefined ? !screenPending[fieldName] : !currentVal

    setPendingChanges({
      ...pendingChanges,
      [screenCode]: {
        ...screenPending,
        [fieldName]: newVal,
      },
    })
  }

  const isChecked = (row: any, actionKey: ScreenActionKey) => {
    const fieldName = `can${actionKey.charAt(0).toUpperCase()}${actionKey.slice(1)}`
    const pending = pendingChanges[row.screenCode]?.[fieldName]
    return pending !== undefined ? pending : Boolean(row[fieldName])
  }

  const hasPending = Object.keys(pendingChanges).length > 0

  const handleExport = () => {
    const exportRows = rows.map((r: any) => {
      const item: any = {
        '#': r.index,
        'المجموعة': roles.find((role: any) => role.id === selectedRoleId)?.nameAr || '',
        'الشاشة': r.screenTitle,
      }
      SCREEN_ACTIONS.forEach((a) => {
        item[a.nameAr] = isChecked(r, a.key) ? '✓' : ''
      })
      return item
    })
    exportToCSV(exportRows, 'صلاحيات_الشاشات')
  }

  return (
    <div className="flex flex-col gap-3 p-4 flex-1 min-h-full bg-slate-50/50 dark:bg-slate-950/50">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <LayoutList className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › صلاحيات الشاشات (Screen Privileges Matrix)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="h-7 text-[11px] gap-1 bg-white/20 hover:bg-white/30 text-white"
          >
            <Download className="h-3 w-3" />
            استيراد مصفوفة Excel القياسية (657)
          </Button>
          <span className="text-xs bg-primary-foreground/20 px-2 py-0.5 rounded">إدارة الصلاحيات</span>
        </div>
      </div>

      {/* SkeyERP Top Search & Filter Bar (Screenshot 175054.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">مجموعات المستخدمين *</Label>
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value)
                setPendingChanges({})
              }}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 font-medium"
            >
              {roles.map((r: any) => (
                <option key={r.id} value={r.id}>
                  {r.roleCode ? `${r.roleCode} - ` : ''}{r.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="w-56">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">الشاشة</Label>
            <div className="relative mt-1">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الشاشة أو اسمها..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8 h-8 text-xs"
              />
            </div>
          </div>

          <Button size="sm" onClick={() => refetch()} className="h-8 gap-1.5 text-xs font-medium">
            <Filter className="h-3.5 w-3.5" />
            عرض
          </Button>

          {hasPending && (
            <Button
              size="sm"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="h-8 gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium animate-pulse"
            >
              <Save className="h-3.5 w-3.5" />
              حفظ التعديلات ({Object.keys(pendingChanges).length})
            </Button>
          )}

          <div className="mr-auto flex items-center gap-1.5">
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 w-8 p-0" title="تصدير Excel">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 w-8 p-0" title="طباعة">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* SkeyERP 13 Actions Grid (Screenshot 175054.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
              <TableRow className="h-8 text-center">
                <TableHead className="w-10 text-center text-xs font-bold">#</TableHead>
                <TableHead className="w-36 text-xs font-bold text-right">مجموعات المستخدمين</TableHead>
                <TableHead className="w-64 text-xs font-bold text-right">الشاشة</TableHead>
                {SCREEN_ACTIONS.map((act) => (
                  <TableHead key={act.key} className="text-center text-[11px] font-bold px-1.5 whitespace-nowrap min-w-16">
                    {act.nameAr}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={16} className="h-40 text-center text-xs text-muted-foreground">
                    جاري تحميل مصفوفة صلاحيات الشاشات...
                  </TableCell>
                </TableRow>
              ) : safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="h-40 text-center text-xs text-muted-foreground">
                    لا توجد شاشات مطابقة. اضغط على «استيراد مصفوفة Excel القياسية» لتغذية الصلاحيات فوراً.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row: any) => {
                  const roleName = roles.find((r: any) => r.id === selectedRoleId)?.nameAr || 'المجموعة الحالية'
                  return (
                    <TableRow key={row.screenCode} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-36">{roleName}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-64">
                        {row.screenTitle}
                      </TableCell>
                      {SCREEN_ACTIONS.map((act) => {
                        const checked = isChecked(row, act.key)
                        return (
                          <TableCell key={act.key} className="text-center p-1">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={() => handleToggle(row.screenCode, act.key, checked)}
                              className="scale-90"
                            />
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* SkeyERP Exact Pagination Legend (Screenshot 175054.png: "عرض 1 إلى 20 من 657 المدخلات") */}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>
            عرض {(page - 1) * pageSize + 1} إلى {Math.min(page * pageSize, total)} من {total} المدخلات
          </span>
          <div className="flex items-center gap-2">
            <span>صفحة {page} من {totalPages}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
