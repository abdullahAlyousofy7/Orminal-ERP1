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
import { exportToCSV } from '@/lib/export'
import {
  Search,
  RotateCw,
  Printer,
  FileSpreadsheet,
  Filter,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  GitBranch,
} from 'lucide-react'
import { INPUT_CATEGORIES, SCREEN_ACTIONS } from '@/lib/erp/screen-catalog'

export default function ViewPrivilegesModule() {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [inspectType, setInspectType] = useState<'screens' | 'inputs' | 'policies'>('screens')
  const [selectedInputCode, setSelectedInputCode] = useState<string>('6')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Fetch Users
  const { data: usersResponse } = useQuery({
    queryKey: ['users-for-inspector'],
    queryFn: async () => {
      const res = await fetch('/api/erp/permissions/user-data?pageSize=100')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })
  const users = Array.isArray(usersResponse?.data)
    ? usersResponse.data
    : Array.isArray(usersResponse?.data?.data)
      ? usersResponse.data.data
      : []

  // Auto select first user
  React.useEffect(() => {
    if (!selectedUserId && users.length > 0) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId])

  // Fetch Effective Decisions
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['effective-permissions', selectedUserId, inspectType, selectedInputCode, search, page, pageSize],
    queryFn: async () => {
      if (!selectedUserId) return { data: [], total: 0 }
      const res = await fetch(
        `/api/erp/permissions/view-privileges?userId=${selectedUserId}&type=${inspectType}&inputCode=${selectedInputCode}&page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('فشل جلب الصلاحيات الفعالة')
      return res.json()
    },
    enabled: Boolean(selectedUserId),
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

  const handleExport = () => {
    const exportRows = safeRows.map((r: any) => ({
      '#': r.index,
      'العنصر / الشاشة': r.screenTitle || r.recordTitle || r.nameAr,
      'القرار': r.decision || (r.canAccess ? 'ALLOWED' : 'DENIED'),
      'المصدر': r.sourceRole || r.source || '-',
      'التفسير': r.reason || '-',
    }))
    exportToCSV(`عرض_الصلاحيات_${inspectType}`, exportRows)
  }

  const selectedUserObj = users.find((u: any) => u.id === selectedUserId)

  return (
    <div className="flex flex-col gap-3 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir="rtl">
      {/* Top Banner */}
      <div className="flex items-center bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › عرض الصلاحيات </span>
        </div>

      </div>

      {/* Top Inspector Filter Bar (Screenshot 181227.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-60">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">اختر المستخدم  *</Label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 font-medium"
            >
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.userCode}  {u.nameAr} - ({u.userRoles?.[0]?.role.nameAr || 'لا يوجد دور'})
                </option>
              ))}
            </select>
          </div>

          <div className="w-52">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع الصلاحيات المستهدفة</Label>
            <select
              value={inspectType}
              onChange={(e: any) => {
                setInspectType(e.target.value)
                setPage(1)
              }}
              className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 font-medium"
            >
              <option value="screens">صلاحيات الشاشات (344)</option>
              <option value="inputs">صلاحيات المدخلات والسجلات</option>
              <option value="policies">صلاحيات العمليات  (37)</option>
            </select>
          </div>

          {inspectType === 'inputs' && (
            <div className="w-56">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">فئة المدخلات</Label>
              <select
                value={selectedInputCode}
                onChange={(e) => {
                  setSelectedInputCode(e.target.value)
                  setPage(1)
                }}
                className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1"
              >
                {INPUT_CATEGORIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.nameAr}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="w-56">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">بحث سريع</Label>
            <div className="relative mt-1">
              <Search className="absolute right-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8 h-8 text-xs"
              />
            </div>
          </div>

          <Button size="sm" onClick={() => refetch()} className="h-8 gap-1.5 text-xs font-medium">
            <Filter className="h-3.5 w-3.5" />
            فحص الصلاحيات
          </Button>

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

      {/* Selected User Security Context Card */}
      {selectedUserObj && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-slate-900 border rounded-md text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-200">سياق الأمان للمستخدم:</span>
          <Badge variant="outline" className="font-semibold bg-white dark:bg-slate-950">
            {selectedUserObj.nameAr} ({selectedUserObj.username})
          </Badge>
          <span>الأدوار المباشرة:</span>
          {selectedUserObj.userRoles?.map((ur: any) => (
            <Badge key={ur.role.id} variant="secondary" className="text-[11px]">
              {ur.role.nameAr}
            </Badge>
          ))}
          <span className="mr-auto text-slate-500">
            الحالة: {selectedUserObj.active ? '🟢 نشط' : '🔴 موقوف'}
          </span>
        </div>
      )}

      {/* Main Inspector Table (Screenshot 181227.png) */}
      <Card className="p-3 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto">
          {inspectType === 'screens' ? (
            <Table>
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
                <TableRow className="h-8">
                  <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                  <TableHead className="w-64 text-xs font-bold">الشاشة / المورد</TableHead>
                  <TableHead className="w-24 text-center text-xs font-bold">القرار النهائي</TableHead>
                  <TableHead className="w-44 text-xs font-bold">مصدر الصلاحية</TableHead>
                  <TableHead className="text-xs font-bold">التفسير الأمني (Reason)</TableHead>
                  <TableHead className="w-32 text-center text-xs font-bold">الإجراءات المتاحة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                      جاري فحص وحساب الصلاحيات الفعالة...
                    </TableCell>
                  </TableRow>
                ) : safeRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                      لا توجد نتائج مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  safeRows.map((row: any) => (
                    <TableRow key={row.screenCode} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {row.screenTitle}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.allowed ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] gap-1 px-1.5 py-0">
                            <CheckCircle2 className="h-3 w-3" />
                            مسموح
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[11px] gap-1 px-1.5 py-0">
                            <XCircle className="h-3 w-3" />
                            ممنوع
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          {row.inherited && (
                            <span title="موروث من دور أعلى">
                              <GitBranch className="h-3 w-3 text-amber-500" />
                            </span>
                          )}
                          <span>{row.sourceRole || 'غير محدد'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{row.reason}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-[11px] text-slate-500">
                          {Object.values(row.actions || {}).filter(Boolean).length} / 13 إجراء
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : inspectType === 'inputs' ? (
            <Table>
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
                <TableRow className="h-8">
                  <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                  <TableHead className="text-xs font-bold">اسم السجل / المدخل</TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold">الشاشة</TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold">التقارير</TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold">إنزال من</TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold">صلاحية</TableHead>
                  <TableHead className="w-40 text-xs font-bold">المصدر</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                      جاري فحص وحساب صلاحيات المدخلات...
                    </TableCell>
                  </TableRow>
                ) : safeRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-xs text-muted-foreground">
                      لا توجد نتائج مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  safeRows.map((row: any) => (
                    <TableRow key={row.recordId} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">{row.recordTitle}</TableCell>
                      <TableCell className="text-center text-xs">{row.canScreen ? '✓' : '✗'}</TableCell>
                      <TableCell className="text-center text-xs">{row.canReports ? '✓' : '✗'}</TableCell>
                      <TableCell className="text-center text-xs">{row.canDownload ? '✓' : '✗'}</TableCell>
                      <TableCell className="text-center text-xs">
                        {row.canAccess ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mx-auto" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-red-500 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.sourceRole || 'افتراضي'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-slate-100/90 dark:bg-slate-900/90">
                <TableRow className="h-8">
                  <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                  <TableHead className="text-xs font-bold">اسم المتغير التشغيلي</TableHead>
                  <TableHead className="w-32 text-center text-xs font-bold">القيمة الفعالة</TableHead>
                  <TableHead className="w-36 text-xs font-bold">المصدر الأمني</TableHead>
                  <TableHead className="text-xs font-bold">الوصف</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-xs text-muted-foreground">
                      جاري فحص وحساب سياسات العمليات...
                    </TableCell>
                  </TableRow>
                ) : safeRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center text-xs text-muted-foreground">
                      لا توجد نتائج مطابقة
                    </TableCell>
                  </TableRow>
                ) : (
                  safeRows.map((row: any) => (
                    <TableRow key={row.policyKey} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableCell className="text-center text-xs font-mono text-muted-foreground">{row.index}</TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">{row.nameAr}</TableCell>
                      <TableCell className="text-center text-xs font-bold text-primary">
                        {row.dataType === 'boolean' ? (row.value ? 'نعم' : 'لا') : String(row.value)}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-[10px]">
                          {row.source === 'USER_OVERRIDE'
                            ? 'استثناء مخصص للمستخدم'
                            : row.source === 'ROLE_POLICY'
                              ? `من الدور: ${row.sourceRole}`
                              : 'الافتراضي للنظام'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.description || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>إجمالي العناصر المحسوبة: {total}</span>
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
