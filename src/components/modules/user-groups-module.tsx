'use client'

import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { exportToCSV } from '@/lib/export'
import {
  Shield,
  Plus,
  Pencil,
  Trash2,
  Search,
  Eye,
  RotateCw,
  Printer,
  FileSpreadsheet,
  Users,
  ChevronLeft,
  ChevronRight,
  UserCheck,
} from 'lucide-react'
import { SCREEN_ACTIONS, INPUT_CATEGORIES } from '@/lib/erp/screen-catalog'
import { isRTL } from '@/stores/i18n-store'

interface UserGroup {
  id: string
  roleCode?: number
  code: string
  nameAr: string
  nameEn?: string
  description?: string
  isSuspended: boolean
  active: boolean
  _count?: {
    userRoles: number
    screenPrivileges: number
    inputPrivileges: number
  }
  inheritedRoles?: any[]
  userRoles?: any[]
}

export default function UserGroupsModule() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('members')

  // Form State
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    roleCode: 0,
    description: '',
    isSuspended: false,
    selectedUserIds: [] as string[],
    parentRoleIds: [] as string[],
  })

  // Fetch Groups
  const { data: response, isLoading, refetch } = useQuery({
    queryKey: ['user-groups', search, page, pageSize],
    queryFn: async () => {
      const res = await fetch(`/api/erp/permissions/user-groups?page=${page}&pageSize=${pageSize}&q=${encodeURIComponent(search)}&details=true`)
      if (!res.ok) throw new Error('فشل جلب مجموعات المستخدمين')
      return res.json()
    },
  })

  // Fetch Users for member selection
  const { data: usersResponse } = useQuery({
    queryKey: ['users-list-simple'],
    queryFn: async () => {
      const res = await fetch('/api/erp/permissions/user-data?pageSize=100')
      if (!res.ok) return { data: [] }
      return res.json()
    },
  })

  const rawGroups = response?.data
  const groups: UserGroup[] = Array.isArray(rawGroups)
    ? rawGroups
    : Array.isArray(rawGroups?.data)
      ? rawGroups.data
      : []
  const safeGroups = Array.isArray(groups) ? groups : []
  const total =
    response?.meta?.pagination?.total ??
    rawGroups?.total ??
    response?.total ??
    safeGroups.length
  const totalPages =
    response?.meta?.pagination?.totalPages ??
    (Math.ceil(total / pageSize) || 1)

  const rawUsers = usersResponse?.data
  const allUsers = Array.isArray(rawUsers)
    ? rawUsers
    : Array.isArray(rawUsers?.data)
      ? rawUsers.data
      : []

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/erp/permissions/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء المجموعة')
      return data
    },
    onSuccess: () => {
      toast.success('تم إنشاء مجموعة المستخدمين بنجاح')
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['user-groups'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await fetch(`/api/erp/permissions/user-groups/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل تحديث المجموعة')
      return data
    },
    onSuccess: () => {
      toast.success('تم تحديث مجموعة المستخدمين بنجاح')
      setDialogOpen(false)
      qc.invalidateQueries({ queryKey: ['user-groups'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/erp/permissions/user-groups/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل حذف المجموعة')
      return data
    },
    onSuccess: () => {
      toast.success('تم حذف المجموعة بنجاح')
      qc.invalidateQueries({ queryKey: ['user-groups'] })
    },
    onError: (e: any) => toast.error(e.message),
  })

  const openAdd = () => {
    setSelectedGroup(null)
    setFormData({
      nameAr: '',
      nameEn: '',
      roleCode: (groups[groups.length - 1]?.roleCode || groups.length) + 1,
      description: '',
      isSuspended: false,
      selectedUserIds: [],
      parentRoleIds: [],
    })
    setActiveTab('members')
    setDialogOpen(true)
  }

  const openEdit = (g: UserGroup) => {
    setSelectedGroup(g)
    setFormData({
      nameAr: g.nameAr,
      nameEn: g.nameEn || '',
      roleCode: g.roleCode || 0,
      description: g.description || '',
      isSuspended: Boolean(g.isSuspended),
      selectedUserIds: g.userRoles?.map((ur: any) => ur.user?.id).filter(Boolean) || [],
      parentRoleIds: g.inheritedRoles?.map((ir: any) => ir.parentRoleId).filter(Boolean) || [],
    })
    setActiveTab('members')
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!formData.nameAr.trim()) {
      toast.error('اسم المجموعة إجباري')
      return
    }

    if (selectedGroup) {
      updateMutation.mutate({
        id: selectedGroup.id,
        payload: {
          nameAr: formData.nameAr,
          nameEn: formData.nameEn,
          description: formData.description,
          isSuspended: formData.isSuspended,
          userIds: formData.selectedUserIds,
          parentRoleIds: formData.parentRoleIds,
        },
      })
    } else {
      createMutation.mutate({
        roleCode: formData.roleCode,
        nameAr: formData.nameAr,
        nameEn: formData.nameEn,
        description: formData.description,
        isSuspended: formData.isSuspended,
      })
    }
  }

  const handleExport = () => {
    const rows = safeGroups.map((g) => ({
      'رقم المجموعة': g.roleCode || g.code,
      'اسم المجموعة': g.nameAr,
      'الاسم الإنجليزي': g.nameEn || '',
      'عدد الأعضاء': g._count?.userRoles || 0,
      'الحالة': g.isSuspended ? 'موقوفة' : 'نشطة',
    }))
    exportToCSV(rows, 'مجموعات_المستخدمين')
  }

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-slate-50/50 dark:bg-slate-950/50" dir={'dir'}>
      {/* Top Banner / Breadcrumb */}
      <div className="flex items-center  bg-primary dark:bg-blue-600/90 border-b border-blue-100 dark:border-blue-700/50 text-white px-4 py-2.5 rounded-t-md shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-semibold">إدارة الصلاحيات › مجموعات المستخدمين</span>
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
                placeholder="بحث في مجموعات المستخدمين..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-8 h-9 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              إضافة
            </Button>
            <Button size="sm" variant="outline" onClick={() => refetch()} className="h-8 w-8 p-0" title="تحديث ">
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
        <div className="rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden mt-3">
          <Table>
            <TableHeader className="bg-slate-100/80 dark:bg-slate-900/80">
              <TableRow className="h-9">
                <TableHead className="w-12 text-center text-xs font-bold">#</TableHead>
                <TableHead className="w-28 text-xs font-bold">رقم المجموعة</TableHead>
                <TableHead className="text-xs font-bold">اسم المجموعة</TableHead>
                <TableHead className="text-xs font-bold">الاسم بالإنجليزي</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">الأعضاء</TableHead>
                <TableHead className="w-28 text-center text-xs font-bold">التوقيف</TableHead>
                <TableHead className="w-24 text-center text-xs font-bold">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    جاري تحميل البيانات...
                  </TableCell>
                </TableRow>
              ) : safeGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    لا توجد مجموعات مستخدمين مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                safeGroups.map((g, idx) => (
                  <TableRow key={g.id} className="h-9 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {(page - 1) * pageSize + idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-primary">
                      {g.roleCode || idx + 1}
                    </TableCell>
                    <TableCell className="text-xs font-medium">{g.nameAr}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{g.nameEn || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="h-5 px-1.5 text-[11px] gap-1">
                        <Users className="h-3 w-3" />
                        {g._count?.userRoles || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={!g.isSuspended}
                        onCheckedChange={(checked) =>
                          updateMutation.mutate({ id: g.id, payload: { isSuspended: !checked } })
                        }
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEdit(g)}
                          className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف مجموعة "${g.nameAr}"؟`)) {
                              deleteMutation.mutate(g.id)
                            }
                          }}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between pt-3 text-xs text-muted-foreground">
          <span>إجمالي المجموعات: {total}</span>
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

      {/* SkeyERP Group Modal Dialog (Tabs: مجموعات المستخدمين, المدخلات, صلاحيات الشاشات) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>{selectedGroup ? `تعديل مجموعة: ${selectedGroup.nameAr}` : 'إضافة مجموعة مستخدمين جديدة'}</span>
              </div>

            </DialogTitle>
          </DialogHeader>

          {/* Group Main Header Form */}
          <DialogBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-3 border-b">
              <div>
                <Label className="text-xs font-semibold text-red-600">اسم المجموعة *</Label>
                <Input
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="أدخل اسم المجموعة بالعربية..."
                  className="h-8 text-xs mt-1 border-red-300 focus-visible:ring-red-400"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">اسم المجموعة (إنجليزي)</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Group Name in English..."
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-semibold">الوصف</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="وصف مهام وصلاحيات هذه المجموعة..."
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            {/* SkeyERP Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full bg-slate-100 dark:bg-slate-900 h-9">
                <TabsTrigger value="members" className="text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  مجموعات المستخدمين (الأعضاء)
                </TabsTrigger>
                <TabsTrigger value="inputs" className="text-xs gap-1.5">
                  المدخلات
                </TabsTrigger>
                <TabsTrigger value="screens" className="text-xs gap-1.5">
                  صلاحيات الشاشات
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Members */}
              <TabsContent value="members" className="pt-3">
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow className="h-8">
                        <TableHead className="w-10 text-center"></TableHead>
                        <TableHead className="text-xs">رقم المستخدم</TableHead>
                        <TableHead className="text-xs">اسم المستخدم</TableHead>
                        <TableHead className="text-xs">البريد الإلكتروني</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {allUsers.map((u: any) => {
                        const isChecked = formData.selectedUserIds.includes(u.id)
                        return (
                          <TableRow key={u.id} className="h-8 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                            <TableCell className="text-center">
                              <Checkbox
                                checked={isChecked}
                                onCheckedChange={(c) => {
                                  const newIds = c
                                    ? [...formData.selectedUserIds, u.id]
                                    : formData.selectedUserIds.filter((id) => id !== u.id)
                                  setFormData({ ...formData, selectedUserIds: newIds })
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-xs font-mono">{u.userCode || u.username}</TableCell>
                            <TableCell className="text-xs font-medium">{u.nameAr}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              {/* Tab 2: Inputs Preview */}
              <TabsContent value="inputs" className="pt-3">
                <div className="border rounded-md max-h-60 overflow-y-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900">
                      <TableRow className="h-8">
                        <TableHead className="text-xs">فئة المدخلات</TableHead>
                        <TableHead className="w-20 text-center text-xs">الشاشة</TableHead>
                        <TableHead className="w-20 text-center text-xs">التقارير</TableHead>
                        <TableHead className="w-20 text-center text-xs">إنزال من</TableHead>
                        <TableHead className="w-20 text-center text-xs">صلاحية</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {INPUT_CATEGORIES.map((cat) => (
                        <TableRow key={cat.code} className="h-8">
                          <TableCell className="text-xs font-medium">{cat.code} - {cat.nameAr}</TableCell>
                          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
                          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
                          <TableCell className="text-center"><Checkbox /></TableCell>
                          <TableCell className="text-center"><Checkbox defaultChecked /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  * لإدارة الصلاحيات التفصيلية لكل سجل داخل المدخلات، استخدم شاشة «صلاحيات المدخلات».
                </p>
              </TabsContent>

              {/* Tab 3: Screen Privileges (13 Actions Matrix Template) */}
              <TabsContent value="screens" className="pt-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-md border">
                  {SCREEN_ACTIONS.map((act) => (
                    <div key={act.key} className="flex items-center gap-2">
                      <Checkbox id={`act_${act.key}`} defaultChecked={['view', 'include', 'add'].includes(act.key)} />
                      <Label htmlFor={`act_${act.key}`} className="text-xs font-medium cursor-pointer">
                        {act.nameAr}
                      </Label>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  * لضبط وتخصيص صلاحيات الشاشات الـ 344 لكل شاشة على حدة، انتقل إلى شاشة «صلاحيات الشاشات».
                </p>
              </TabsContent>
            </Tabs>
          </DialogBody>
          <DialogFooter className="border-t pt-3 flex gap-2">
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
