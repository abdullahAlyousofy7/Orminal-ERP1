'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  FileInput,
  Search,
  RotateCw,
  Printer,
  FileSpreadsheet,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import { INPUT_CATEGORIES } from '@/lib/erp/screen-catalog'

export default function InputPrivilegesModule() {
  const qc = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedInputCode, setSelectedInputCode] = useState<string>('6') // 6 - تنبيهات النظام
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Dirty state tracking: recordId -> { canScreen?, canReports?, canDownload?, canAccess? }
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, boolean>>>({})

  // Fetch Roles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles-for-input-privileges'],
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

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  // Fetch Input Privileges
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['input-privileges', selectedRoleId, selectedInputCode, search],
    queryFn: async () => {
      if (!selectedRoleId) return { data: [], total: 0 }
      const res = await fetch(
        `/api/erp/permissions/input-privileges?roleId=${selectedRoleId}&inputCode=${selectedInputCode}&q=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('فشل جلب صلاحيات المدخلات')
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
  const total = rawData?.total ?? response?.total ?? safeRows.length
  const totalPages = Math.ceil(total / pageSize) || 1
  const pageRows = safeRows.slice((page - 1) * pageSize, page * pageSize)
  const safePageRows = Array.isArray(pageRows) ? pageRows : []

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(pendingChanges).map(([recordId, changes]) => ({
        recordId,
        ...changes,
      }))
      const res = await fetch('/api/erp/permissions/input-privileges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRoleId,
          inputCode: selectedInputCode,
          updates,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل حفظ التعديلات')
      return data
    },
    onSuccess: (data) => {
      toast.success(`تم حفظ ${data.count} صلاحيات مدخلات بنجاح`)
      setPendingChanges({})
      qc.invalidateQueries({ queryKey: ['input-privileges'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleToggle = (recordId: string, field: string, currentVal: boolean) => {
    const recChanges = pendingChanges[recordId] || {}
    const newVal = recChanges[field] !== undefined ? !recChanges[field] : !currentVal

    setPendingChanges({
      ...pendingChanges,
      [recordId]: {
        ...recChanges,
        [field]: newVal,
      },
    })
  }

  const isChecked = (row: any, field: string) => {
    const pending = pendingChanges[row.recordId]?.[field]
    return pending !== undefined ? pending : Boolean(row[field])
  }

  const hasPending = Object.keys(pendingChanges).length > 0

  const handleExport = () => {
    const exportRows = rows.map((r: any) => ({
      '#': r.index,
      'المجموعة': roles.find((role: any) => role.id === selectedRoleId)?.nameAr || '',
      'اسم المدخل/السجل': r.recordTitle,
      'الشاشة': isChecked(r, 'canScreen') ? 'نعم' : 'لا',
      'التقارير': isChecked(r, 'canReports') ? 'نعم' : 'لا',
      'إنزال من': isChecked(r, 'canDownload') ? 'نعم' : 'لا',
      'صلاحية': isChecked(r, 'canAccess') ? 'نعم' : 'لا',
    }))
    exportToCSV(exportRows, 'صلاحيات_المدخلات')
  }

  return (
    <div className="flex flex-col gap-3 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir="rtl">
      {/* Top Banner */}
      <div className="flex items-center bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <FileInput className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › صلاحيات المدخلات </span>
        </div>

      </div>

      {/* SkeyERP Top Filter Bar (Screenshot 175621.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-64">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">المدخلات (فئة السجلات) *</Label>
            <select
              value={selectedInputCode}
              onChange={(e) => {
                setSelectedInputCode(e.target.value)
                setPendingChanges({})
                setPage(1)
              }}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 font-medium"
            >
              {INPUT_CATEGORIES.map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.code} - {cat.nameAr}
                </option>
              ))}
            </select>
          </div>

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
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">بحث في السجلات</Label>
            <div className="relative mt-1">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث باسم السجل أو التنبيه..."
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

      {/* SkeyERP Input Privileges Grid (Screenshot 175621.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
              <TableRow className="h-8 text-center">
                <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                <TableHead className="w-48 text-xs font-bold text-right">مجموعات المستخدمين</TableHead>
                <TableHead className="text-xs font-bold text-right">
                  {INPUT_CATEGORIES.find((c) => c.code === selectedInputCode)?.nameAr || 'اسم السجل / المدخل'}
                </TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">الشاشة</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">التقارير</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">إنزال من</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">صلاحية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                    جاري تحميل سجلات المدخلات...
                  </TableCell>
                </TableRow>
              ) : safePageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                    لا توجد سجلات مطابقة لهذه الفئة.
                  </TableCell>
                </TableRow>
              ) : (
                safePageRows.map((row: any) => {
                  const roleName = roles.find((r: any) => r.id === selectedRoleId)?.nameAr || 'المجموعة الحالية'
                  return (
                    <TableRow key={row.recordId} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium">{roleName}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.recordTitle}
                      </TableCell>
                      <TableCell className="text-center p-1">
                        <Checkbox
                          checked={isChecked(row, 'canScreen')}
                          onCheckedChange={() => handleToggle(row.recordId, 'canScreen', isChecked(row, 'canScreen'))}
                        />
                      </TableCell>
                      <TableCell className="text-center p-1">
                        <Checkbox
                          checked={isChecked(row, 'canReports')}
                          onCheckedChange={() => handleToggle(row.recordId, 'canReports', isChecked(row, 'canReports'))}
                        />
                      </TableCell>
                      <TableCell className="text-center p-1">
                        <Checkbox
                          checked={isChecked(row, 'canDownload')}
                          onCheckedChange={() => handleToggle(row.recordId, 'canDownload', isChecked(row, 'canDownload'))}
                        />
                      </TableCell>
                      <TableCell className="text-center p-1">
                        <Checkbox
                          checked={isChecked(row, 'canAccess')}
                          onCheckedChange={() => handleToggle(row.recordId, 'canAccess', isChecked(row, 'canAccess'))}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Legend */}
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
