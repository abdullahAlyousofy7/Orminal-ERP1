'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ModuleShell } from '@/components/erp/module-shell'
import { KpiCard } from '@/components/erp/kpi-card'
import { useT } from '@/lib/i18n/use-t'
import { formatInt, formatDateTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  Users as UsersIcon, ShieldCheck, UserCheck, KeyRound, Plus, Pencil, Trash2,
  Lock, Unlock, Eye, EyeOff, Search, X, ChevronLeft, ChevronRight, ChevronsLeft,
  ChevronsRight, RotateCw, Printer, FileSpreadsheet, Columns, FileText,
} from 'lucide-react'

interface Role {
  id: string
  code: string
  nameAr: string
  nameEn?: string
  isSystem: boolean
}

interface Branch {
  id: string
  code: string
  nameAr: string
  nameEn?: string
}

interface User {
  id: string
  username: string
  email: string
  nameAr: string
  nameEn?: string
  phone?: string
  avatar?: string
  active: boolean
  mfaEnabled: boolean
  defaultBranchId?: string
  locale: string
  timezone: string
  lastLoginAt?: string
  createdAt: string
  defaultBranch?: Branch
  userRoles: { role: Role }[]
  _count?: { auditLogs: number }
}

export function UsersModule() {
  const { t, isRTL } = useT()
  const isAr = isRTL
  const qc = useQueryClient()

  // Search & Filter State
  const [search, setSearch] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all')
  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('all')

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  // Selection & Modal State
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedBranch, setSelectedBranch] = useState<string>('')

  // Column Visibility Controls (matching fiscal-periods-module.tsx)
  const DEFAULT_VISIBLE_COLS = useMemo(
    () => ({
      username: true,
      nameAr: true,
      nameEn: false,
      email: true,
      phone: false,
      role: true,
      branch: true,
      mfaEnabled: true,
      active: true,
      lastLoginAt: true,
      createdAt: false,
      actions: true,
    }),
    []
  )
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>(DEFAULT_VISIBLE_COLS)

  // Column Resizing Controls (matching fiscal-periods-module.tsx)
  const DEFAULT_COL_WIDTHS = useMemo<Record<string, number>>(
    () => ({
      username: 130,
      nameAr: 160,
      nameEn: 140,
      email: 180,
      phone: 115,
      role: 130,
      branch: 130,
      mfaEnabled: 85,
      active: 85,
      lastLoginAt: 125,
      createdAt: 110,
      actions: 120,
    }),
    []
  )
  const [colWidths, setColWidths] = useState<Record<string, number>>(DEFAULT_COL_WIDTHS)

  const handleResizeStart = (colKey: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startWidth = colWidths[colKey] || DEFAULT_COL_WIDTHS[colKey] || 100

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = isAr ? startX - moveEvent.clientX : moveEvent.clientX - startX
      const newWidth = Math.max(50, startWidth + deltaX)
      setColWidths((prev) => ({ ...prev, [colKey]: newWidth }))
    }

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  // Data Queries
  const { data, isLoading } = useQuery<{ data: User[]; meta: any }>({
    queryKey: ['users', search, filterActive],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (filterActive === 'active') params.set('active', 'true')
      if (filterActive === 'inactive') params.set('active', 'false')
      params.set('pageSize', '200')
      const r = await fetch(`/api/erp/users?${params}`)
      if (!r.ok) throw new Error('Failed')
      return r.json()
    },
  })

  const { data: rolesData } = useQuery<{ data: Role[] }>({
    queryKey: ['roles-for-users'],
    queryFn: async () => {
      const r = await fetch('/api/erp/roles?pageSize=200')
      if (!r.ok) return { data: [] }
      return r.json()
    },
  })
  const roles = rolesData?.data ?? []

  const { data: branchesData } = useQuery<{ data: Branch[] }>({
    queryKey: ['branches-for-users'],
    queryFn: async () => {
      const r = await fetch('/api/erp/branches?pageSize=200')
      if (!r.ok) return { data: [] }
      return r.json()
    },
  })
  const branches = branchesData?.data ?? []

  const users = data?.data ?? []

  // Selected User helper
  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  )

  // Filtered & Paginated Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (selectedRoleFilter !== 'all') {
        const hasRole = u.userRoles?.some((ur) => ur.role?.id === selectedRoleFilter)
        if (!hasRole) return false
      }
      if (selectedBranchFilter !== 'all') {
        if (u.defaultBranchId !== selectedBranchFilter) return false
      }
      return true
    })
  }, [users, selectedRoleFilter, selectedBranchFilter])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  // KPIs
  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    withMfa: users.filter((u) => u.mfaEnabled).length,
    byRole: users.reduce((acc, u) => {
      const r = u.userRoles?.[0]?.role
      if (r) acc[r.nameAr] = (acc[r.nameAr] || 0) + 1
      return acc
    }, {} as Record<string, number>),
  }
  const topRole = Object.entries(stats.byRole).sort((a, b) => b[1] - a[1])[0]
  const topRoleLabel = topRole ? `${topRole[0]} (${topRole[1]})` : '—'

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const url = editing ? `/api/erp/users/${editing.id}` : '/api/erp/users'
      const method = editing ? 'PUT' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? 'Failed')
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success(editing ? 'تم تحديث المستخدم بنجاح' : 'تم إنشاء المستخدم بنجاح')
      qc.invalidateQueries({ queryKey: ['users'] })
      setDialogOpen(false)
      setEditing(null)
      setChangePasswordOpen(false)
      setShowPassword(false)
      setSelectedRole('')
      setSelectedBranch('')
    },
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/erp/users/${id}`, { method: 'DELETE' })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? 'Failed')
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success('تم حذف المستخدم')
      if (selectedUserId) setSelectedUserId(null)
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (e: any) => toast.error(e.message || 'حدث خطأ'),
  })

  const openEdit = (u: User) => {
    setEditing(u)
    setSelectedRole(u.userRoles?.[0]?.role?.id ?? '')
    setSelectedBranch(u.defaultBranchId ?? '')
    setChangePasswordOpen(false)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const openAdd = () => {
    setEditing(null)
    setSelectedRole('')
    setSelectedBranch('')
    setChangePasswordOpen(false)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const openChangePassword = (u: User) => {
    setEditing(u)
    setSelectedRole(u.userRoles?.[0]?.role?.id ?? '')
    setSelectedBranch(u.defaultBranchId ?? '')
    setChangePasswordOpen(true)
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleToggleStatus = (u: User) => {
    saveMutation.mutate({
      username: u.username,
      nameAr: u.nameAr,
      nameEn: u.nameEn,
      email: u.email,
      phone: u.phone,
      roleId: u.userRoles?.[0]?.role?.id,
      defaultBranchId: u.defaultBranchId,
      active: !u.active,
      mfaEnabled: u.mfaEnabled,
    })
  }

  const handleDeleteUser = (u: User) => {
    if (u.username === 'admin') {
      toast.error('لا يمكن حذف حساب مدير النظام (admin)')
      return
    }
    if (confirm(`هل أنت متأكد من رغبتك في حذف المستخدم "${u.nameAr}"؟`)) {
      deleteMutation.mutate(u.id)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload: any = {
      username: editing ? editing.username : fd.get('username'),
      nameAr: fd.get('nameAr'),
      nameEn: fd.get('nameEn') || undefined,
      email: fd.get('email'),
      phone: fd.get('phone') || undefined,
      roleId: selectedRole || undefined,
      defaultBranchId: selectedBranch || undefined,
      active: fd.get('active') === 'on',
      mfaEnabled: fd.get('mfaEnabled') === 'on',
    }
    if (!editing) {
      const pw = fd.get('password')
      if (!pw) {
        toast.error('كلمة المرور مطلوبة للمستخدم الجديد')
        return
      }
      payload.password = pw
    } else if (changePasswordOpen) {
      const pw = fd.get('password')
      if (pw) payload.password = pw
    }
    saveMutation.mutate(payload)
  }

  // Export Handlers (Matching fiscal-periods-module.tsx Standard)
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      toast.error(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }
    const headers = [
      isAr ? 'اسم المستخدم' : 'Username',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'الاسم الإنجليزي' : 'English Name',
      isAr ? 'البريد الإلكتروني' : 'Email',
      isAr ? 'الهاتف' : 'Phone',
      isAr ? 'الدور / الصلاحية' : 'Role',
      isAr ? 'الفرع' : 'Branch',
      isAr ? 'MFA' : 'MFA',
      isAr ? 'الحالة' : 'Status',
      isAr ? 'آخر تسجيل دخول' : 'Last Login',
    ]
    const rows = filteredUsers.map((u) => [
      `"${u.username}"`,
      `"${u.nameAr}"`,
      `"${u.nameEn || ''}"`,
      `"${u.email}"`,
      `"${u.phone || ''}"`,
      `"${u.userRoles?.[0]?.role?.nameAr ?? ''}"`,
      `"${u.defaultBranch?.nameAr ?? ''}"`,
      `"${u.mfaEnabled ? (isAr ? 'مفعّل' : 'Enabled') : (isAr ? 'معطّل' : 'Disabled')}"`,
      `"${u.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}"`,
      `"${u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}"`,
    ])
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `users_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    toast.success(isAr ? 'تم تصدير البيانات إلى CSV بنجاح' : 'Exported to CSV successfully')
  }

  const handleExportExcel = () => {
    handleExportCSV()
  }

  const handleExportWord = () => {
    if (!filteredUsers.length) {
      toast.error(isAr ? 'لا توجد بيانات للتصدير' : 'No data to export')
      return
    }
    const title = isAr ? 'تقرير مستخدمي النظام' : 'System Users Report'
    const headers = [
      isAr ? 'اسم المستخدم' : 'Username',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'البريد الإلكتروني' : 'Email',
      isAr ? 'الدور' : 'Role',
      isAr ? 'الفرع' : 'Branch',
      isAr ? 'الحالة' : 'Status',
    ]

    const docHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'}; padding: 25px; }
          h1 { color: #2563eb; text-align: center; margin-bottom: 5px; font-size: 22px; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          p.subtitle { text-align: center; color: #64748b; margin-bottom: 25px; font-size: 13px; }
          table { border-collapse: collapse; width: 100%; margin-top: 15px; direction: ${isAr ? 'rtl' : 'ltr'}; }
          th { background-color: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; padding: 8px 10px; font-size: 13px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 6px 8px; font-size: 12px; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body dir='${isAr ? 'rtl' : 'ltr'}'>
        <h1>${title}</h1>
        <p class="subtitle">${isAr ? 'تاريخ التصدير:' : 'Export Date:'} ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')} | ${isAr ? 'إجمالي السجلات:' : 'Total Records:'} ${filteredUsers.length}</p>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredUsers
        .map(
          (u) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${u.username}</td>
                <td>${u.nameAr}</td>
                <td style="direction:ltr;">${u.email}</td>
                <td>${u.userRoles?.[0]?.role?.nameAr ?? '—'}</td>
                <td>${u.defaultBranch?.nameAr ?? '—'}</td>
                <td>${u.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}</td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
        <div class="footer">${isAr ? 'تم التصدير تلقائياً بواسطة نظام أورمينال ERP' : 'Exported automatically by Orminal ERP'}</div>
      </body>
      </html>
    `

    const blob = new Blob(['\uFEFF' + docHtml], { type: 'application/msword;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `users_${new Date().toISOString().slice(0, 10)}.doc`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(isAr ? 'تم تصدير البيانات إلى Word بنجاح' : 'Exported to Word successfully')
  }

  const handleExportPDF = () => {
    const printWin = window.open('', '_blank')
    if (!printWin) {
      toast.error(isAr ? 'تعذر فتح نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة.' : 'Could not open print window. Allow popups.')
      return
    }

    const title = isAr ? 'تقرير مستخدمي النظام' : 'System Users Report'
    const headers = [
      isAr ? 'اسم المستخدم' : 'Username',
      isAr ? 'الاسم' : 'Name',
      isAr ? 'البريد الإلكتروني' : 'Email',
      isAr ? 'الدور' : 'Role',
      isAr ? 'الفرع' : 'Branch',
      isAr ? 'الحالة' : 'Status',
    ]

    const content = `
      <!DOCTYPE html>
      <html dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, system-ui, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; text-align: ${isAr ? 'right' : 'left'}; color: #0f172a; margin: 0; padding: 20px; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 20px; font-weight: bold; color: #2563eb; }
          .info { font-size: 11px; color: #475569; }
          h2 { font-size: 16px; color: #1e293b; margin: 0 0 15px 0; text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
          th { background-color: #2563eb; color: white; padding: 7px 9px; border: 1px solid #1d4ed8; text-align: center; font-weight: 600; }
          td { padding: 6px 8px; border: 1px solid #cbd5e1; text-align: center; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; display: inline-block; }
          .badge-active { background-color: #dcfce7; color: #166534; }
          .badge-inactive { background-color: #fee2e2; color: #991b1b; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; text-align: center; font-size: 10px; color: #94a3b8; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">أورمينال تك - ORMINAL ERP</div>
          <div class="info">${isAr ? 'تاريخ التقرير:' : 'Report Date:'} ${new Date().toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</div>
        </div>
        <h2>${title}</h2>
        <table>
          <thead>
            <tr>
              ${headers.map((h) => `<th>${h}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${filteredUsers
        .map(
          (u) => `
              <tr>
                <td style="font-weight:bold; color:#2563eb;">${u.username}</td>
                <td>${u.nameAr}</td>
                <td style="direction:ltr;">${u.email}</td>
                <td>${u.userRoles?.[0]?.role?.nameAr ?? '—'}</td>
                <td>${u.defaultBranch?.nameAr ?? '—'}</td>
                <td>
                  <span class="badge ${u.active ? 'badge-active' : 'badge-inactive'}">
                    ${u.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                  </span>
                </td>
              </tr>
            `
        )
        .join('')}
          </tbody>
        </table>
        <div class="footer">${isAr ? 'تم إنشاء المستند تلقائياً عبر نظام Orminal ERP' : 'Document generated by Orminal ERP System'}</div>
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
    toast.success(isAr ? 'جارٍ فتح نافذة الطباعة…' : 'Opening print view…')
  }

  return (
    <ModuleShell
      title={t('module.users')}
      description={isAr ? "إدارة مستخدمي النظام وأدوارهم وصلاحيات الوصول" : "Users management and access control"}
      icon={<UsersIcon className="size-5" />}
    >
      {/* ── KPI SECTION ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 mb-2">
        <KpiCard title={isAr ? "إجمالي المستخدمين" : "Total Users"} value={formatInt(stats.total)} icon={<UsersIcon className="size-5" />} accent="blue" />
        <KpiCard title={isAr ? "المستخدمون النشطون" : "Active Users"} value={formatInt(stats.active)} icon={<UserCheck className="size-5" />} accent="sky" />
        <KpiCard title={isAr ? "الأكثر دوراً" : "Most Active Role"} value={topRoleLabel} icon={<KeyRound className="size-5" />} accent="amber" />
        <KpiCard title={isAr ? "مع التحقق الثنائي (MFA)" : "With 2FA"} value={formatInt(stats.withMfa)} icon={<ShieldCheck className="size-5" />} accent="violet" />
      </div>

      {/* ── MAIN DATAGRID CARD (Matching fiscal-periods-module.tsx Standard) ── */}
      <Card className="border border-border shadow-xs rounded-lg overflow-hidden bg-card flex-1 flex flex-col">
        {/* ACTION TOOLBAR */}
        <div className="p-2 sm:p-2.5 border-b flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 bg-slate-50/60 dark:bg-slate-900/40">
          {/* Left Group: Columns, Search, Status Filter & Role/Branch Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            {/* Row 1 on mobile: Columns Dropdown + Search Box */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              {/* Columns Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs bg-background shrink-0">
                    <span>{isAr ? 'أعمدة' : 'Columns'}</span>
                    <ChevronLeft className="size-3 -rotate-90 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} className="w-42 max-h-80 overflow-y-auto">
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.username}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, username: !!v }))}
                  >
                    {isAr ? 'اسم المستخدم' : 'Username'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.nameAr}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, nameAr: !!v }))}
                  >
                    {isAr ? 'الاسم العربي' : 'Arabic Name'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.nameEn}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, nameEn: !!v }))}
                  >
                    {isAr ? 'الاسم الإنجليزي' : 'English Name'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.email}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, email: !!v }))}
                  >
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.phone}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, phone: !!v }))}
                  >
                    {isAr ? 'الهاتف' : 'Phone'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.role}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, role: !!v }))}
                  >
                    {isAr ? 'الدور / الصلاحية' : 'Role'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.branch}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, branch: !!v }))}
                  >
                    {isAr ? 'الفرع' : 'Branch'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.mfaEnabled}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, mfaEnabled: !!v }))}
                  >
                    {isAr ? 'MFA (التحقق الثنائي)' : 'MFA'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.active}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, active: !!v }))}
                  >
                    {isAr ? 'الحالة' : 'Status'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.lastLoginAt}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, lastLoginAt: !!v }))}
                  >
                    {isAr ? 'آخر تسجيل دخول' : 'Last Login'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.createdAt}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, createdAt: !!v }))}
                  >
                    {isAr ? 'تاريخ الإنشاء' : 'Created At'}
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleCols.actions}
                    onCheckedChange={(v) => setVisibleCols((p) => ({ ...p, actions: !!v }))}
                  >
                    {isAr ? 'الإجراءات' : 'Actions'}
                  </DropdownMenuCheckboxItem>

                  <DropdownMenuSeparator className="my-1" />
                  <DropdownMenuItem
                    onClick={() => {
                      setVisibleCols(DEFAULT_VISIBLE_COLS)
                      toast.success(isAr ? 'تمت استعادة إعدادات الأعمدة الافتراضية' : 'Columns reset to default')
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer justify-center py-1.5"
                  >
                    {isAr ? 'إعادة ضبط الأعمدة الافتراضية' : 'Reset Default Columns'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Search Box */}
              <div className="relative flex-1 sm:w-56 min-w-0">
                <Search className={cn('size-3.5 absolute top-2.5 text-muted-foreground pointer-events-none', isAr ? 'right-2.5' : 'left-2.5')} />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder={isAr ? 'بحث بالاسم، المستخدم، البريد...' : 'Search users...'}
                  className={cn('h-8 text-xs bg-background w-full', isAr ? 'pr-7 pl-6' : 'pl-7 pr-6')}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('')
                      setCurrentPage(1)
                    }}
                    className={cn('absolute top-2 text-muted-foreground hover:text-foreground cursor-pointer', isAr ? 'left-2' : 'right-2')}
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row 2 on mobile: Status Filter Pills + Role & Branch Dropdowns */}
            <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none py-0.5">
              {/* Status Filter Pills */}
              <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-md border border-slate-300/50 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFilterActive('all')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all whitespace-nowrap cursor-pointer",
                    filterActive === 'all'
                      ? "bg-white dark:bg-slate-900 text-foreground font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isAr ? 'الكل' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterActive('active')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                    filterActive === 'active'
                      ? "bg-emerald-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-emerald-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  {isAr ? 'نشط' : 'Active'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterActive('inactive')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer",
                    filterActive === 'inactive'
                      ? "bg-rose-600 text-white font-bold shadow-xs"
                      : "text-muted-foreground hover:text-rose-600"
                  )}
                >
                  <span className="size-1.5 rounded-full bg-rose-400" />
                  {isAr ? 'غير نشط' : 'Inactive'}
                </button>
              </div>

              {/* Role Filter Dropdown */}
              <Select
                value={selectedRoleFilter}
                onValueChange={(val) => {
                  setSelectedRoleFilter(val)
                  setCurrentPage(1)
                }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <SelectTrigger className="h-8 min-w-[110px] max-w-[120px] text-xs bg-background shrink-0" dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={isAr ? 'جميع الأدوار' : 'All Roles'} />
                </SelectTrigger>
                <SelectContent dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectItem value="all" >{isAr ? 'جميع الأدوار' : 'All Roles'}</SelectItem>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id} >
                      {isAr ? r.nameAr : r.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Branch Filter Dropdown */}
              <Select
                value={selectedBranchFilter}
                onValueChange={(val) => {
                  setSelectedBranchFilter(val)
                  setCurrentPage(1)
                }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                <SelectTrigger className="h-8 min-w-[110px] max-w-[120px] text-xs bg-background shrink-0" dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectValue placeholder={isAr ? 'جميع الفروع' : 'All Branches'} />
                </SelectTrigger>
                <SelectContent dir={isAr ? 'rtl' : 'ltr'}>
                  <SelectItem value="all">{isAr ? 'جميع الفروع' : 'All Branches'}</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {isAr ? b.nameAr : b.nameEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right Group: Action Tools & Add User Button */}
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
                    title={isAr ? 'خيارات التصدير (Excel, CSV, Word, PDF)' : 'Export Options (Excel, CSV, Word, PDF)'}
                  >
                    <FileSpreadsheet className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isAr ? 'start' : 'end'} sideOffset={6} className="w-36 shadow-xl border-slate-200 dark:border-slate-800 z-50">
                  <DropdownMenuItem onClick={handleExportExcel} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'Excel' : 'Excel'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Columns className="size-4 text-blue-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'CSV' : 'CSV'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <FileText className="size-4 text-indigo-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'Word' : 'Word'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="gap-2.5 text-xs font-medium cursor-pointer py-2">
                    <Printer className="size-4 text-red-600 shrink-0" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{isAr ? 'PDF / طباعة' : 'PDF / Print'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Print */}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 cursor-pointer"
                onClick={handleExportPDF}
                title={isAr ? 'طباعة الجدول' : 'Print Table'}
              >
                <Printer className="size-4" />
              </Button>

              {/* Refresh
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                onClick={() => {
                  qc.invalidateQueries({ queryKey: ['users'] })
                  toast.success(isAr ? 'تم تحديث البيانات' : 'Data refreshed')
                }}
                title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              >
                <RotateCw className={cn("size-4", isLoading && "animate-spin")} />
              </Button> */}

              {/* Active / Inactive status toggle for selected user */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedUser}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedUser
                    ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-slate-400 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedUser) handleToggleStatus(selectedUser)
                }}
                title={
                  selectedUser
                    ? selectedUser.active
                      ? isAr ? 'تعطيل حساب المستخدم المحدد' : 'Deactivate selected'
                      : isAr ? 'تفعيل حساب المستخدم المحدد' : 'Activate selected'
                    : isAr ? 'اختر مستخدماً لتغيير حالته' : 'Select a user to toggle status'
                }
              >
                {selectedUser && !selectedUser.active ? <Unlock className="size-4 text-emerald-600" /> : <Lock className="size-4" />}
              </Button>

              {/* Reset / Change password for selected user */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedUser}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedUser
                    ? "text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-indigo-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedUser) openChangePassword(selectedUser)
                }}
                title={
                  selectedUser
                    ? isAr ? 'تغيير كلمة المرور للمستخدم المحدد' : 'Change password for selected'
                    : isAr ? 'اختر مستخدماً لتغيير كلمة المرور' : 'Select a user to change password'
                }
              >
                <KeyRound className="size-4" />
              </Button>

              {/* Edit selected user */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedUser}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedUser
                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-amber-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedUser) openEdit(selectedUser)
                }}
                title={
                  selectedUser
                    ? isAr ? 'تعديل بيانات المستخدم المحدد' : 'Edit selected'
                    : isAr ? 'اختر مستخدماً من الجدول للتعديل' : 'Select a user to edit'
                }
              >
                <Pencil className="size-4" />
              </Button>

              {/* Delete selected user */}
              <Button
                variant="ghost"
                size="sm"
                disabled={!selectedUser || selectedUser.username === 'admin'}
                className={cn(
                  "h-8 w-8 p-0 transition-all",
                  selectedUser && selectedUser.username !== 'admin'
                    ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-xs hover:scale-105 cursor-pointer"
                    : "text-rose-300 opacity-40 cursor-not-allowed"
                )}
                onClick={() => {
                  if (selectedUser) handleDeleteUser(selectedUser)
                }}
                title={
                  selectedUser
                    ? selectedUser.username === 'admin'
                      ? isAr ? 'لا يمكن حذف حساب مدير النظام الرئيسي' : 'Admin cannot be deleted'
                      : isAr ? 'حذف المستخدم المحدد' : 'Delete selected'
                    : isAr ? 'اختر مستخدماً لحذفه' : 'Select a user to delete'
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            {/* Add User Button */}
            <Button
              onClick={openAdd}
              size="sm"
              className="h-8 bg-primary hover:bg-primary/90 text-white text-xs gap-1.5 px-3 shadow-xs font-bold shrink-0"
            >
              <Plus className="size-3.5" />
              <span>{isAr ? 'إضافة جديد' : 'Add New'}</span>
            </Button>
          </div>
        </div>

        {/* MAIN GRID TABLE WITH HORIZONTAL SCROLLBAR */}
        <div className="overflow-x-auto min-h-[380px] w-full flex-1 scrollbar-thin">
          <Table className="min-w-[1240px] border-collapse text-[11px] table-fixed w-full">
            <TableHeader className="bg-slate-100/90 dark:bg-slate-900 border-b">
              <TableRow className="h-8 hover:bg-transparent text-slate-700 dark:text-slate-200">
                <TableHead style={{ width: '45px', minWidth: '45px', maxWidth: '45px' }} className="font-bold py-1.5 px-1 text-center whitespace-nowrap select-none border-r border-slate-200 dark:border-slate-800">
                  #
                </TableHead>

                {visibleCols.username && (
                  <TableHead
                    style={{
                      width: `${colWidths.username || 130}px`,
                      minWidth: `${colWidths.username || 130}px`,
                      maxWidth: `${colWidths.username || 130}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'اسم المستخدم' : 'Username'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('username', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, username: DEFAULT_COL_WIDTHS.username }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.nameAr && (
                  <TableHead
                    style={{
                      width: `${colWidths.nameAr || 160}px`,
                      minWidth: `${colWidths.nameAr || 160}px`,
                      maxWidth: `${colWidths.nameAr || 160}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الاسم العربي' : 'Arabic Name'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('nameAr', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, nameAr: DEFAULT_COL_WIDTHS.nameAr }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.nameEn && (
                  <TableHead
                    style={{
                      width: `${colWidths.nameEn || 140}px`,
                      minWidth: `${colWidths.nameEn || 140}px`,
                      maxWidth: `${colWidths.nameEn || 140}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الاسم الأجنبي' : 'English Name'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('nameEn', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, nameEn: DEFAULT_COL_WIDTHS.nameEn }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.email && (
                  <TableHead
                    style={{
                      width: `${colWidths.email || 180}px`,
                      minWidth: `${colWidths.email || 180}px`,
                      maxWidth: `${colWidths.email || 180}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'البريد الإلكتروني' : 'Email'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('email', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, email: DEFAULT_COL_WIDTHS.email }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.phone && (
                  <TableHead
                    style={{
                      width: `${colWidths.phone || 115}px`,
                      minWidth: `${colWidths.phone || 115}px`,
                      maxWidth: `${colWidths.phone || 115}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الهاتف' : 'Phone'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('phone', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, phone: DEFAULT_COL_WIDTHS.phone }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.role && (
                  <TableHead
                    style={{
                      width: `${colWidths.role || 130}px`,
                      minWidth: `${colWidths.role || 130}px`,
                      maxWidth: `${colWidths.role || 130}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الدور / الصلاحية' : 'Role'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('role', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, role: DEFAULT_COL_WIDTHS.role }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.branch && (
                  <TableHead
                    style={{
                      width: `${colWidths.branch || 130}px`,
                      minWidth: `${colWidths.branch || 130}px`,
                      maxWidth: `${colWidths.branch || 130}px`,
                    }}
                    className={cn(
                      'font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap relative select-none group',
                      isAr ? 'text-right' : 'text-left'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate">{isAr ? 'الفرع' : 'Branch'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('branch', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, branch: DEFAULT_COL_WIDTHS.branch }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.mfaEnabled && (
                  <TableHead
                    style={{
                      width: `${colWidths.mfaEnabled || 85}px`,
                      minWidth: `${colWidths.mfaEnabled || 85}px`,
                      maxWidth: `${colWidths.mfaEnabled || 85}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>MFA</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('mfaEnabled', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, mfaEnabled: DEFAULT_COL_WIDTHS.mfaEnabled }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.active && (
                  <TableHead
                    style={{
                      width: `${colWidths.active || 85}px`,
                      minWidth: `${colWidths.active || 85}px`,
                      maxWidth: `${colWidths.active || 85}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'الحالة' : 'Status'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('active', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, active: DEFAULT_COL_WIDTHS.active }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.lastLoginAt && (
                  <TableHead
                    style={{
                      width: `${colWidths.lastLoginAt || 125}px`,
                      minWidth: `${colWidths.lastLoginAt || 125}px`,
                      maxWidth: `${colWidths.lastLoginAt || 125}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'آخر دخول' : 'Last Login'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('lastLoginAt', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, lastLoginAt: DEFAULT_COL_WIDTHS.lastLoginAt }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.createdAt && (
                  <TableHead
                    style={{
                      width: `${colWidths.createdAt || 110}px`,
                      minWidth: `${colWidths.createdAt || 110}px`,
                      maxWidth: `${colWidths.createdAt || 110}px`,
                    }}
                    className="font-bold py-1.5 px-2 border-r border-slate-200 dark:border-slate-800 text-center whitespace-nowrap relative select-none group"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{isAr ? 'تاريخ الإنشاء' : 'Created At'}</span>
                    </div>
                    <div
                      onMouseDown={(e) => handleResizeStart('createdAt', e)}
                      onDoubleClick={() => setColWidths((p) => ({ ...p, createdAt: DEFAULT_COL_WIDTHS.createdAt }))}
                      className={cn(
                        "absolute top-0 bottom-0 w-3 z-30 cursor-col-resize hover:bg-blue-500/80 transition-colors flex items-center justify-center group/handle",
                        isAr ? "-left-1.5" : "-right-1.5",
                        "bg-transparent"
                      )}
                      title={isAr ? 'سحب لتغيير عرض العمود (انقر مرتين للإعادة)' : 'Drag to resize column (Double click to reset)'}
                    >
                      <div className="w-[2px] h-4/5 bg-slate-300 dark:bg-slate-700 group-hover/handle:bg-white rounded-full" />
                    </div>
                  </TableHead>
                )}

                {visibleCols.actions && (
                  <TableHead
                    style={{
                      width: `${colWidths.actions || 120}px`,
                      minWidth: `${colWidths.actions || 120}px`,
                      maxWidth: `${colWidths.actions || 120}px`,
                    }}
                    className="font-bold py-1.5 px-2 text-center whitespace-nowrap select-none"
                  >
                    <span>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="h-8 border-b border-slate-200 dark:border-slate-700">
                    <TableCell className="py-1 px-1 border-r border-slate-100 dark:border-slate-800 text-center">
                      <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
                    {Array.from({ length: Object.values(visibleCols).filter(Boolean).length }).map((_, j) => (
                      <TableCell key={j} className="py-1 px-2 border-r border-slate-100 dark:border-slate-800">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={13} className="text-center text-muted-foreground py-12">
                    <UsersIcon className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-sm">{isAr ? 'لا يوجد مستخدمون مطابقون لشروط البحث' : 'No users found'}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {isAr ? 'ابدأ بإضافة أول مستخدم أو قم بتغيير شروط التصفية أعلاه' : 'Add your first user or clear filters'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const isSelected = selectedUserId === u.id

                  return (
                    <TableRow
                      key={u.id}
                      data-selected={isSelected || undefined}
                      onClick={() => setSelectedUserId(u.id)}
                      onDoubleClick={() => openEdit(u)}
                      className={cn(
                        "h-8 select-none cursor-pointer border-b border-slate-200 dark:border-slate-700 transition-colors",
                        isSelected
                          ? "!bg-[#d0e2f7] dark:!bg-[#1e3a5f] !border-l-[3px] !border-l-blue-600 dark:!border-l-blue-400"
                          : "bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900/60",
                        !u.active && !isSelected && "opacity-75 bg-slate-50/50 dark:bg-slate-900/40"
                      )}
                      style={isSelected ? { backgroundColor: '#a0ccff50' } : undefined}
                    >
                      {/* Row Index */}
                      <TableCell className="py-1 px-1 text-center font-mono font-bold text-slate-400 border-r border-slate-100 dark:border-slate-800 text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </TableCell>

                      {/* Username */}
                      {visibleCols.username && (
                        <TableCell
                          style={{
                            width: `${colWidths.username || 130}px`,
                            minWidth: `${colWidths.username || 130}px`,
                            maxWidth: `${colWidths.username || 130}px`,
                          }}
                          className="font-bold text-primary font-mono border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          dir="ltr"
                        >
                          <span className="truncate block w-full cursor-default text-right" title={u.username}>
                            {u.username}
                          </span>
                        </TableCell>
                      )}

                      {/* Arabic Name */}
                      {visibleCols.nameAr && (
                        <TableCell
                          style={{
                            width: `${colWidths.nameAr || 160}px`,
                            minWidth: `${colWidths.nameAr || 160}px`,
                            maxWidth: `${colWidths.nameAr || 160}px`,
                          }}
                          className="font-semibold text-foreground border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={u.nameAr}>
                            {u.nameAr}
                          </span>
                        </TableCell>
                      )}

                      {/* English Name */}
                      {visibleCols.nameEn && (
                        <TableCell
                          style={{
                            width: `${colWidths.nameEn || 140}px`,
                            minWidth: `${colWidths.nameEn || 140}px`,
                            maxWidth: `${colWidths.nameEn || 140}px`,
                          }}
                          className="text-slate-600 dark:text-slate-400 font-sans border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          dir="ltr"
                        >
                          <span className="truncate block w-full cursor-default" title={u.nameEn || '—'}>
                            {u.nameEn || '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Email */}
                      {visibleCols.email && (
                        <TableCell
                          style={{
                            width: `${colWidths.email || 180}px`,
                            minWidth: `${colWidths.email || 180}px`,
                            maxWidth: `${colWidths.email || 180}px`,
                          }}
                          className="text-slate-700 dark:text-slate-300 font-mono border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          dir="ltr"
                        >
                          <span className="truncate block w-full cursor-default text-right" title={u.email}>
                            {u.email}
                          </span>
                        </TableCell>
                      )}

                      {/* Phone */}
                      {visibleCols.phone && (
                        <TableCell
                          style={{
                            width: `${colWidths.phone || 115}px`,
                            minWidth: `${colWidths.phone || 115}px`,
                            maxWidth: `${colWidths.phone || 115}px`,
                          }}
                          className="text-slate-600 dark:text-slate-400 font-mono text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                          dir="ltr"
                        >
                          <span className="truncate block w-full cursor-default" title={u.phone || '—'}>
                            {u.phone || '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Role */}
                      {visibleCols.role && (
                        <TableCell
                          style={{
                            width: `${colWidths.role || 130}px`,
                            minWidth: `${colWidths.role || 130}px`,
                            maxWidth: `${colWidths.role || 130}px`,
                          }}
                          className="border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          {u.userRoles?.[0]?.role ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 truncate max-w-full" title={u.userRoles[0].role.nameAr}>
                              {u.userRoles[0].role.nameAr}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </TableCell>
                      )}

                      {/* Branch */}
                      {visibleCols.branch && (
                        <TableCell
                          style={{
                            width: `${colWidths.branch || 130}px`,
                            minWidth: `${colWidths.branch || 130}px`,
                            maxWidth: `${colWidths.branch || 130}px`,
                          }}
                          className="text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full cursor-default" title={u.defaultBranch?.nameAr ?? '—'}>
                            {u.defaultBranch?.nameAr ?? '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* MFA */}
                      {visibleCols.mfaEnabled && (
                        <TableCell
                          style={{
                            width: `${colWidths.mfaEnabled || 85}px`,
                            minWidth: `${colWidths.mfaEnabled || 85}px`,
                            maxWidth: `${colWidths.mfaEnabled || 85}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            {u.mfaEnabled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-700 border border-violet-200 dark:bg-violet-950/40 dark:text-violet-400">
                                <ShieldCheck className="size-3" />
                                {isAr ? 'مفعّل' : 'On'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </div>
                        </TableCell>
                      )}

                      {/* Status */}
                      {visibleCols.active && (
                        <TableCell
                          style={{
                            width: `${colWidths.active || 85}px`,
                            minWidth: `${colWidths.active || 85}px`,
                            maxWidth: `${colWidths.active || 85}px`,
                          }}
                          className="text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleToggleStatus(u)
                              }}
                              className="cursor-pointer focus:outline-none"
                              title={u.active ? (isAr ? 'انقر للتعطيل' : 'Click to deactivate') : (isAr ? 'انقر للتفعيل' : 'Click to activate')}
                            >
                              {u.active ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  {isAr ? 'نشط' : 'Active'}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors">
                                  <span className="size-1.5 rounded-full bg-rose-400" />
                                  {isAr ? 'غير نشط' : 'Inactive'}
                                </span>
                              )}
                            </button>
                          </div>
                        </TableCell>
                      )}

                      {/* Last Login */}
                      {visibleCols.lastLoginAt && (
                        <TableCell
                          style={{
                            width: `${colWidths.lastLoginAt || 125}px`,
                            minWidth: `${colWidths.lastLoginAt || 125}px`,
                            maxWidth: `${colWidths.lastLoginAt || 125}px`,
                          }}
                          className="font-mono text-slate-500 text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full" title={u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}>
                            {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}
                          </span>
                        </TableCell>
                      )}

                      {/* Created At */}
                      {visibleCols.createdAt && (
                        <TableCell
                          style={{
                            width: `${colWidths.createdAt || 110}px`,
                            minWidth: `${colWidths.createdAt || 110}px`,
                            maxWidth: `${colWidths.createdAt || 110}px`,
                          }}
                          className="font-mono text-slate-500 text-center border-r border-slate-100 dark:border-slate-800 py-1 px-2 overflow-hidden text-[11px]"
                        >
                          <span className="truncate block w-full" title={new Date(u.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}>
                            {new Date(u.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                          </span>
                        </TableCell>
                      )}

                      {/* Quick Actions */}
                      {visibleCols.actions && (
                        <TableCell
                          style={{
                            width: `${colWidths.actions || 120}px`,
                            minWidth: `${colWidths.actions || 120}px`,
                            maxWidth: `${colWidths.actions || 120}px`,
                          }}
                          className="py-1 px-2 overflow-hidden text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                              onClick={() => openEdit(u)}
                              title={isAr ? 'تعديل' : 'Edit'}
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer"
                              onClick={() => openChangePassword(u)}
                              title={isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                            >
                              <KeyRound className="size-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "size-6 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40",
                                u.username === 'admin' ? "opacity-30 cursor-not-allowed" : "cursor-pointer"
                              )}
                              disabled={u.username === 'admin'}
                              onClick={() => handleDeleteUser(u)}
                              title={u.username === 'admin' ? (isAr ? 'لا يمكن حذف حساب المسؤول' : 'Admin cannot be deleted') : (isAr ? 'حذف' : 'Delete')}
                            >
                              <Trash2 className="size-3" />
                            </Button>
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

        {/* PAGINATION FOOTER (Exact replica of fiscal-periods-module.tsx) */}
        <div className="p-2.5 bg-slate-100/90 dark:bg-slate-900 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <span>
              {isAr
                ? `صفحة ${currentPage} من ${totalPages} (إجمالي العناصر ${filteredUsers.length})`
                : `Page ${currentPage} of ${totalPages} (${filteredUsers.length} items)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">{isAr ? 'العناصر' : 'Items'}</span>
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
                disabled={currentPage <= 1}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة الأولى' : 'First Page'}
              >
                <ChevronsLeft className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة السابقة' : 'Previous Page'}
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
                disabled={currentPage >= totalPages}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة التالية' : 'Next Page'}
              >
                <ChevronRight className="size-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 p-0 bg-background"
                title={isAr ? 'الصفحة الأخيرة' : 'Last Page'}
              >
                <ChevronsRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ── Add / Edit User Dialog ─────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? `تعديل بيانات: ${editing.nameAr}` : 'أدخل بيانات المستخدم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit}>
              <ScrollArea className="max-h-[60vh] pe-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                  {!editing && (
                    <div className="space-y-1.5">
                      <Label htmlFor="username">اسم المستخدم *</Label>
                      <Input id="username" name="username" required placeholder="admin" dir="ltr" />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="nameAr">الاسم (عربي) *</Label>
                    <Input id="nameAr" name="nameAr" defaultValue={editing?.nameAr} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="nameEn">الاسم (إنجليزي)</Label>
                    <Input id="nameEn" name="nameEn" defaultValue={editing?.nameEn} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">البريد الإلكتروني *</Label>
                    <Input id="email" name="email" type="email" defaultValue={editing?.email} required dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">الهاتف</Label>
                    <Input id="phone" name="phone" defaultValue={editing?.phone} dir="ltr" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>الدور</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر دوراً" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.nameAr} <span className="text-xs text-muted-foreground ms-1" dir="ltr">({r.code})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>الفرع</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="اختر فرعاً" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.length === 0 ? (
                          <SelectItem value="_none" disabled>لا توجد فروع</SelectItem>
                        ) : (
                          branches.map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.nameAr} <span className="text-xs text-muted-foreground ms-1" dir="ltr">({b.code})</span>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Password section */}
                  {!editing && (
                    <div className="space-y-1.5">
                      <Label htmlFor="password">كلمة المرور *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="••••••••"
                          className="pe-9"
                          dir="ltr"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="absolute end-1 top-1/2 -translate-y-1/2 size-7"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                      </div>
                    </div>
                  )}
                  {editing && (
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
                        <Lock className="size-4 text-muted-foreground" />
                        <span className="text-sm flex-1">كلمة المرور محمية</span>
                        <Button
                          type="button"
                          size="sm"
                          variant={changePasswordOpen ? 'default' : 'outline'}
                          onClick={() => setChangePasswordOpen((v) => !v)}
                        >
                          {changePasswordOpen ? 'إلغاء التغيير' : 'تغيير كلمة المرور'}
                        </Button>
                      </div>
                      {changePasswordOpen && (
                        <div className="mt-3 space-y-1.5">
                          <Label htmlFor="password">كلمة المرور الجديدة</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="اتركها فارغة للإبقاء على الحالية"
                              className="pe-9"
                              dir="ltr"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute end-1 top-1/2 -translate-y-1/2 size-7"
                              onClick={() => setShowPassword((v) => !v)}
                            >
                              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2 flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Switch id="active" name="active" defaultChecked={editing?.active ?? true} />
                      <Label htmlFor="active">نشط</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch id="mfaEnabled" name="mfaEnabled" defaultChecked={editing?.mfaEnabled ?? false} />
                      <Label htmlFor="mfaEnabled">تفعيل التحقق الثنائي (MFA)</Label>
                    </div>
                  </div>
                </div>
              </ScrollArea>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </form>
          </DialogBody>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  )
}
