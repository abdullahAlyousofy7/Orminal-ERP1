'use client'

import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import {
  FileCheck,
  Search,
  RotateCw,
  Printer,
  FileSpreadsheet,
  Save,
  Filter,
  History,
} from 'lucide-react'

export default function TransactionPrivilegesModule() {
  const qc = useQueryClient()
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [search, setSearch] = useState('')

  // Local pending state for the 37 variables: policyKey -> value
  const [pendingValues, setPendingValues] = useState<Record<string, any>>({})

  // Fetch Roles
  const { data: rolesResponse } = useQuery({
    queryKey: ['roles-for-tx-privileges'],
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

  // Fetch Users
  const { data: usersResponse } = useQuery({
    queryKey: ['users-for-tx-privileges'],
    queryFn: async () => {
      const res = await fetch('/api/erp/permissions/user-data?pageSize=50')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })
  const users = Array.isArray(usersResponse?.data)
    ? usersResponse.data
    : Array.isArray(usersResponse?.data?.data)
      ? usersResponse.data.data
      : []

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  // Fetch Policies
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['transaction-privileges', selectedRoleId, selectedUserId, search],
    queryFn: async () => {
      const targetParam = selectedUserId ? `userId=${selectedUserId}` : `roleId=${selectedRoleId}`
      const res = await fetch(`/api/erp/permissions/transaction-privileges?${targetParam}&q=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('فشل جلب صلاحيات العمليات')
      return res.json()
    },
    enabled: Boolean(selectedRoleId || selectedUserId),
  })

  const rawData = response?.data
  const rows: any[] = Array.isArray(rawData)
    ? rawData
    : Array.isArray(rawData?.data)
      ? rawData.data
      : []
  const safeRows = Array.isArray(rows) ? rows : []

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(pendingValues).map(([policyKey, value]) => ({
        policyKey,
        value,
      }))
      const res = await fetch('/api/erp/permissions/transaction-privileges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedUserId ? undefined : selectedRoleId,
          userId: selectedUserId ? selectedUserId : undefined,
          updates,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل حفظ السياسات')
      return data
    },
    onSuccess: (data) => {
      toast.success(`تم حفظ ${data.count} سياسات تشغيلية بنجاح`)
      setPendingValues({})
      qc.invalidateQueries({ queryKey: ['transaction-privileges'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const handleValChange = (policyKey: string, val: any) => {
    setPendingValues({
      ...pendingValues,
      [policyKey]: val,
    })
  }

  const getCurrentVal = (row: any) => {
    return pendingValues[row.policyKey] !== undefined ? pendingValues[row.policyKey] : row.value
  }

  const hasPending = Object.keys(pendingValues).length > 0

  const handleExport = () => {
    const exportRows = safeRows.map((r: any) => ({
      '#': r.index,
      'اسم المتغير': r.nameAr,
      'النوع': r.dataType,
      'القيمة': String(getCurrentVal(r)),
      'الوحدة': r.module,
    }))
    exportToCSV(exportRows, 'صلاحيات_العمليات_37')
  }

  return (
    <div className="flex flex-col gap-3 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir="rtl">
      {/* Top Banner */}
      <div className="flex items-center bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › صلاحيات العمليات</span>
        </div>

      </div>

      {/* SkeyERP Top Filter Bar (Screenshots 034403.png & 174953.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">مجموعات المستخدمين</Label>
            <select
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value)
                setSelectedUserId('')
                setPendingValues({})
              }}
              disabled={Boolean(selectedUserId)}
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
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">أو تخصيص لمستخدم محدد</Label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value)
                setPendingValues({})
              }}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1"
            >
              <option value="">-- حسب المجموعة الافتراضية --</option>
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.userCode || u.username} - {u.nameAr}
                </option>
              ))}
            </select>
          </div>

          <div className="w-56">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">اسم المتغير</Label>
            <div className="relative mt-1">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث في أسماء المتغيرات..."
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
              حفظ السياسات ({Object.keys(pendingValues).length})
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

      {/* SkeyERP 37 Operational Variables Grid (Screenshots 034403.png & 035716.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
              <TableRow className="h-8 text-center">
                <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                <TableHead className="w-48 text-xs font-bold text-right">رقم المستخدم / المجموعة</TableHead>
                <TableHead className="text-xs font-bold text-right">اسم المتغير</TableHead>
                <TableHead className="w-44 text-center text-xs font-bold">القيمة</TableHead>
                <TableHead className="w-36 text-center text-xs font-bold">الوصف</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">بيانات تاريخية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-xs text-muted-foreground">
                    جاري تحميل المتغيرات الـ 37...
                  </TableCell>
                </TableRow>
              ) : safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-xs text-muted-foreground">
                    لا توجد متغيرات مطابقة للبحث.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row: any) => {
                  const targetLabel = selectedUserId
                    ? users.find((u: any) => u.id === selectedUserId)?.nameAr || 'المستخدم المحدد'
                    : roles.find((r: any) => r.id === selectedRoleId)?.nameAr || 'المجموعة المحددة'
                  const currentVal = getCurrentVal(row)

                  return (
                    <TableRow key={row.policyKey} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400 font-medium">{targetLabel}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.nameAr}
                        {row.description && (
                          <span className="block text-[10px] text-muted-foreground font-normal">
                            {row.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center p-1">
                        {row.dataType === 'boolean' ? (
                          <div className="flex justify-center">
                            <Switch
                              checked={Boolean(currentVal)}
                              onCheckedChange={(checked) => handleValChange(row.policyKey, checked)}
                              className="scale-90"
                            />
                          </div>
                        ) : row.options ? (
                          <select
                            value={String(currentVal)}
                            onChange={(e) => handleValChange(row.policyKey, e.target.value)}
                            className="h-7 text-xs rounded border border-input bg-background px-2"
                          >
                            {row.options.map((opt: any) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            type="number"
                            value={currentVal !== undefined ? currentVal : ''}
                            onChange={(e) => handleValChange(row.policyKey, e.target.value)}
                            className="h-7 w-28 text-center text-xs mx-auto"
                          />
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs font-medium text-slate-700 dark:text-slate-300">
                        {row.dataType === 'boolean'
                          ? Boolean(currentVal) ? 'نعم' : 'لا'
                          : row.options?.find((o: any) => o.value === currentVal)?.label || String(currentVal)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toast.info(`سجل التعديلات للمتغير: ${row.nameAr}`)}
                          className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700"
                          title="عرض البيانات التاريخية والتعديلات"
                        >
                          <History className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Legend */}
        <div className="pt-3 text-xs text-muted-foreground">
          <span>عرض 1 إلى {rows.length} من {rows.length} من المتغيرات التشغيلية الحقيقية</span>
        </div>
      </Card>
    </div>
  )
}
