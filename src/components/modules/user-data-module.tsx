'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  DialogFooter,
  DialogBody,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import {
  UserCircle,
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCw,
  Printer,
  FileSpreadsheet,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Calendar,
  DollarSign,
  Building,
  Image as ImageIcon,
} from 'lucide-react'

interface UserItem {
  id: string
  userCode?: number
  username: string
  nameAr: string
  nameEn?: string
  email: string
  phone?: string
  avatar?: string
  active: boolean
  employeeNumber?: string
  nationalId?: string
  managerId?: string
  validFromDate?: string
  validToDate?: string
  validFromTime?: string
  validToTime?: string
  defaultPriceLevel?: string
  minPriceLimit?: number
  maxPriceLimit?: number
  manager?: { id: string; userCode?: number; username: string; nameAr: string }
  defaultBranch?: { id: string; code: string; nameAr: string }
  branches?: { id: string; code: string; nameAr: string }[]
  userRoles?: { role: { id: string; roleCode?: number; code: string; nameAr: string } }[]
}

export default function UserDataModule() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    userCode: 0,
    username: '',
    nameAr: '',
    nameEn: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
    employeeNumber: '',
    nationalId: '',
    managerId: '',
    defaultBranchId: '',
    selectedRoleIds: [] as string[],
    validFromDate: '',
    validToDate: '',
    validFromTime: '',
    validToTime: '',
    defaultPriceLevel: '',
    minPriceLimit: '',
    maxPriceLimit: '',
    active: true,
  })

  // Fetch Users
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['user-data', search, page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/erp/permissions/user-data?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(search)}`)
      if (!res.ok) throw new Error('فشل جلب بيانات المستخدمين')
      return res.json()
    },
  })

  // Fetch Roles for assignment
  const { data: rolesResponse } = useQuery({
    queryKey: ['user-groups-options'],
    queryFn: async () => {
      const res = await fetch('/api/erp/permissions/user-groups?pageSize=100')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })

  // Fetch Branches
  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-options'],
    queryFn: async () => {
      const res = await fetch('/api/erp/branches')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })

  const rawUsers = response?.data
  const users: UserItem[] = Array.isArray(rawUsers)
    ? rawUsers
    : Array.isArray(rawUsers?.data)
      ? rawUsers.data
      : []
  const safeUsers = Array.isArray(users) ? users : []
  const total =
    response?.meta?.pagination?.total ??
    rawUsers?.total ??
    response?.total ??
    safeUsers.length
  const totalPages =
    response?.meta?.pagination?.totalPages ??
    (Math.ceil(total / pageSize) || 1)

  const rawRoles = rolesResponse?.data
  const roles: any[] = Array.isArray(rawRoles)
    ? rawRoles
    : Array.isArray(rawRoles?.data)
      ? rawRoles.data
      : []

  const rawBranches = branchesResponse?.data
  const branches: any[] = Array.isArray(rawBranches)
    ? rawBranches
    : Array.isArray(rawBranches?.data)
      ? rawBranches.data
      : []

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/erp/permissions/user-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل حفظ بيانات المستخدم')
      return data
    },
    onSuccess: () => {
      toast.success('تم إنشاء حساب المستخدم بنجاح')
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['user-data'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/erp/permissions/user-data', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل تحديث بيانات المستخدم')
      return data
    },
    onSuccess: () => {
      toast.success('تم تحديث بيانات المستخدم بنجاح')
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['user-data'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const openAdd = () => {
    setSelectedUser(null)
    setFormData({
      userCode: (users[users.length - 1]?.userCode || users.length) + 1,
      username: '',
      nameAr: '',
      nameEn: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      pin: '',
      employeeNumber: '',
      nationalId: '',
      managerId: '',
      defaultBranchId: branches[0]?.id || '',
      selectedRoleIds: [],
      validFromDate: '',
      validToDate: '',
      validFromTime: '',
      validToTime: '',
      defaultPriceLevel: 'retail',
      minPriceLimit: '',
      maxPriceLimit: '',
      active: true,
    })
    setDialogOpen(true)
  }

  const openEdit = (u: UserItem) => {
    setSelectedUser(u)
    setFormData({
      userCode: u.userCode || 0,
      username: u.username,
      nameAr: u.nameAr,
      nameEn: u.nameEn || '',
      email: u.email,
      phone: u.phone || '',
      password: '',
      confirmPassword: '',
      pin: '',
      employeeNumber: u.employeeNumber || '',
      nationalId: u.nationalId || '',
      managerId: u.managerId || '',
      defaultBranchId: u.defaultBranch?.id || '',
      selectedRoleIds: u.userRoles?.map((ur) => ur.role.id) || [],
      validFromDate: u.validFromDate ? u.validFromDate.split('T')[0] : '',
      validToDate: u.validToDate ? u.validToDate.split('T')[0] : '',
      validFromTime: u.validFromTime || '',
      validToTime: u.validToTime || '',
      defaultPriceLevel: u.defaultPriceLevel || 'retail',
      minPriceLimit: u.minPriceLimit ? String(u.minPriceLimit) : '',
      maxPriceLimit: u.maxPriceLimit ? String(u.maxPriceLimit) : '',
      active: Boolean(u.active),
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.nameAr.trim()) {
      toast.error('اسم المستخدم إجباري')
      return
    }
    if (!selectedUser && !formData.username.trim()) {
      toast.error('رمز المستخدم (اسم الدخول) إجباري')
      return
    }
    if (!selectedUser && !formData.password.trim()) {
      toast.error('كلمة المرور مطلوبة')
      return
    }
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('كلمة المرور وتأكيدها غير متطابقين')
      return
    }

    if (selectedUser) {
      updateMutation.mutate({
        id: selectedUser.id,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        pin: formData.pin || undefined,
        employeeNumber: formData.employeeNumber,
        nationalId: formData.nationalId,
        managerId: formData.managerId || null,
        defaultBranchId: formData.defaultBranchId || null,
        roleIds: formData.selectedRoleIds,
        validFromDate: formData.validFromDate || null,
        validToDate: formData.validToDate || null,
        validFromTime: formData.validFromTime || null,
        validToTime: formData.validToTime || null,
        defaultPriceLevel: formData.defaultPriceLevel || null,
        minPriceLimit: formData.minPriceLimit ? Number(formData.minPriceLimit) : null,
        maxPriceLimit: formData.maxPriceLimit ? Number(formData.maxPriceLimit) : null,
        active: formData.active,
      })
    } else {
      createMutation.mutate({
        userCode: formData.userCode,
        username: formData.username,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        pin: formData.pin || null,
        employeeNumber: formData.employeeNumber,
        nationalId: formData.nationalId,
        managerId: formData.managerId || null,
        defaultBranchId: formData.defaultBranchId || null,
        roleIds: formData.selectedRoleIds,
        validFromDate: formData.validFromDate || null,
        validToDate: formData.validToDate || null,
        validFromTime: formData.validFromTime || null,
        validToTime: formData.validToTime || null,
        defaultPriceLevel: formData.defaultPriceLevel,
        minPriceLimit: formData.minPriceLimit ? Number(formData.minPriceLimit) : null,
        maxPriceLimit: formData.maxPriceLimit ? Number(formData.maxPriceLimit) : null,
        active: formData.active,
      })
    }
  }

  const handleExport = () => {
    const rows = safeUsers.map((u) => ({
      'رقم المستخدم': u.userCode || 1,
      'رمز المستخدم': u.username,
      'اسم المستخدم': u.nameAr,
      'المدير المباشر': u.manager?.nameAr || '-',
      'دور المستخدم': u.userRoles?.map((r) => r.role.nameAr).join(', ') || '-',
      'الوحدة التشغيلية': u.defaultBranch?.nameAr || '-',
      'رقم الموظف': u.employeeNumber || '-',
      'الحالة': u.active ? 'نشط' : 'موقوف',
    }))
    exportToCSV(rows, 'بيانات_المستخدمين')
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir={'dir'}>
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <UserCircle className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › بيانات المستخدمين</span>
        </div>

      </div>

      {/* Main Grid Card */}
      <Card className="p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        {/* Toolbar Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برمز المستخدم أو الاسم أو رقم الموظف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              إضافة مستخدم
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 w-8 p-0">
              <RotateCw className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} className="h-8 w-8 p-0" title="تصدير Excel">
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 w-8 p-0" title="طباعة">
              <Printer className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-x-auto mt-3">
          <Table>
            <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80">
              <TableRow className="h-9">

                <TableHead className="w-20 text-xs font-bold">رقم المستخدم</TableHead>
                <TableHead className="w-28 text-xs font-bold">رمز المستخدم</TableHead>
                <TableHead className="text-xs font-bold">اسم المستخدم</TableHead>
                <TableHead className="text-xs font-bold">المدير المباشر</TableHead>
                <TableHead className="text-xs font-bold">دور المستخدم</TableHead>
                <TableHead className="text-xs font-bold">الوحدة التشغيلية</TableHead>
                <TableHead className="w-24 text-xs font-bold">رقم الموظف</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">التوقيف</TableHead>
                <TableHead className="w-20 text-center text-xs font-bold">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    جاري تحميل المستخدمين...
                  </TableCell>
                </TableRow>
              ) : safeUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-32 text-center text-xs text-muted-foreground">
                    لا يوجد مستخدمون مطابقون
                  </TableCell>
                </TableRow>
              ) : (
                safeUsers.map((u, idx) => (
                  <TableRow key={u.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <TableCell className="text-xs font-semibold text-primary">
                      {u.userCode || idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{u.username}</TableCell>
                    <TableCell className="text-xs font-medium">{u.nameAr}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.manager?.nameAr || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {u.userRoles?.[0] ? (
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {u.userRoles[0].role.nameAr}
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{u.defaultBranch?.nameAr || 'الفرع الرئيسي'}</TableCell>
                    <TableCell className="text-xs font-mono">{u.employeeNumber || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={u.active}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: u.id, active: checked })
                        }
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(u)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>إجمالي المستخدمين: {total}</span>
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

      {/* SkeyERP User Detail Form Modal (Screenshot 173335.png) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-hidden scrollbar-thin" dir="rtl">
          <DialogHeader >
            <DialogTitle className="text-base flex items-center ">
              <div className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                <span>{selectedUser ? `تعديل بيانات المستخدم: ${selectedUser.nameAr}` : 'إضافة بيانات مستخدم جديد'}</span>
              </div>

            </DialogTitle>
          </DialogHeader>
          <DialogBody className="scrollbar-thin">
            <div className="flex flex-col gap-4 py-2">
              {/* Top Identity Block */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border">
                <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-3 bg-card">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mb-1" />
                  <span className="text-[11px] text-muted-foreground">حدد الصورة</span>
                </div>

                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-red-600">رمز المستخدم (اسم الدخول) *</Label>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={Boolean(selectedUser)}
                      placeholder="e.g. ahmed, admin..."
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-red-600">اسم المستخدم (بالعربية) *</Label>
                    <Input
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="الاسم الكامل بالعربية..."
                      className="h-8 text-xs mt-1 border-red-300"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">رقم الموظف</Label>
                    <Input
                      value={formData.employeeNumber}
                      onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                      placeholder="e.g. EMP-104"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">رقم التعريف الشخصي (الهوية / PIN)</Label>
                    <Input
                      value={formData.nationalId}
                      onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                      placeholder="رقم الهوية الوطنية أو الإقامة..."
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">الوحدة التشغيلية (الفرع)</Label>
                    <select
                      value={formData.defaultBranchId}
                      onChange={(e) => setFormData({ ...formData, defaultBranchId: e.target.value })}
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1"
                    >
                      <option value="">-- اختر الفرع الافتراضي --</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.code} - {b.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-red-600">دور ومجموعة المستخدم *</Label>
                    <select
                      value={formData.selectedRoleIds[0] || ''}
                      onChange={(e) => setFormData({ ...formData, selectedRoleIds: e.target.value ? [e.target.value] : [] })}
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1 border-red-300"
                    >
                      <option value="">-- اختر الدور الرئيسي --</option>
                      {roles.map((r: any) => (
                        <option key={r.id} value={r.id}>
                          {r.roleCode || r.code} - {r.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 1: Password & Credentials */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-primary/10 px-3 py-1.5 border-b font-semibold text-xs flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span>إعادة تعيين كلمة المرور وبيانات الأمان</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3">
                  <div>
                    <Label className="text-xs font-semibold">
                      {selectedUser ? 'تغيير كلمة المرور (اتركه فارغاً للإبقاء)' : 'كلمة المرور *'}
                    </Label>
                    <Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">تأكيد كلمة المرور</Label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">البريد الإلكتروني *</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@orminal.com"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">رقم الجوال</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+967 ..."
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 & 3: Date & Time Access Windows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Window */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-primary/10 px-3 py-1.5 border-b font-semibold text-xs flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    <span>صلاحية التاريخ (Access Date Window)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    <div>
                      <Label className="text-[11px]">من تاريخ</Label>
                      <Input
                        type="date"
                        value={formData.validFromDate}
                        onChange={(e) => setFormData({ ...formData, validFromDate: e.target.value })}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">إلى تاريخ</Label>
                      <Input
                        type="date"
                        value={formData.validToDate}
                        onChange={(e) => setFormData({ ...formData, validToDate: e.target.value })}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Time Window */}
                <div className="border rounded-md overflow-hidden">
                  <div className="bg-primary/10 px-3 py-1.5 border-b font-semibold text-xs flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" />
                    <span>صلاحية الوقت اليومي (Access Time Window)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-3">
                    <div>
                      <Label className="text-[11px]">من وقت</Label>
                      <Input
                        type="time"
                        value={formData.validFromTime}
                        onChange={(e) => setFormData({ ...formData, validFromTime: e.target.value })}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px]">إلى وقت</Label>
                      <Input
                        type="time"
                        value={formData.validToTime}
                        onChange={(e) => setFormData({ ...formData, validToTime: e.target.value })}
                        className="h-8 text-xs mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Pricing Defaults & Limits */}
              <div className="border rounded-md overflow-hidden">
                <div className="bg-primary/10 px-3 py-1.5 border-b font-semibold text-xs flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-primary" />
                  <span>البيانات الإفتراضية وحدود التسعيرة</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
                  <div>
                    <Label className="text-[11px]">مستوى التسعيرة الإفتراضي</Label>
                    <select
                      value={formData.defaultPriceLevel}
                      onChange={(e) => setFormData({ ...formData, defaultPriceLevel: e.target.value })}
                      className="w-full h-8 text-xs rounded-md border border-input bg-background px-2 mt-1"
                    >
                      <option value="retail">تجزئة </option>
                      <option value="wholesale">جملة </option>
                      <option value="special">خاص </option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-[11px]">الحد الأدنى للتسعيرة</Label>
                    <Input
                      type="number"
                      value={formData.minPriceLimit}
                      onChange={(e) => setFormData({ ...formData, minPriceLimit: e.target.value })}
                      placeholder="0.00"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px]">الحد الأعلى للتسعيرة</Label>
                    <Input
                      type="number"
                      value={formData.maxPriceLimit}
                      onChange={(e) => setFormData({ ...formData, maxPriceLimit: e.target.value })}
                      placeholder="0.00"
                      className="h-8 text-xs mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </DialogBody>

          <DialogFooter >
            <Button size="sm" variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">
              إلغاء
            </Button>
            <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="text-xs">
              حفظ
            </Button>

          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
