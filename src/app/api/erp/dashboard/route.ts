import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/erp/api-response'
import {
  requireAuthContext,
  isAuthFailure,
} from '@/lib/erp/rbac'

export async function GET(req: Request) {
  try {
    const auth = await requireAuthContext(req, { capability: 'canRead' })
    if (isAuthFailure(auth)) return auth

    const branchFilter =
      !auth.isSuperAdmin && auth.authorizedBranchIds.length > 0
        ? { branchId: { in: auth.authorizedBranchIds } }
        : {}

    const [
      salesOrders, purchaseOrders, partners, products, stockQuants,
      salesPayments, purchasePayments, journalEntries,
      salesInvoices, purchaseInvoices, keyAccountLines,
    ] = await Promise.all([
      db.salesOrder.findMany({
        where: { companyId: auth.companyId, ...branchFilter },
        include: { partner: { select: { nameAr: true, nameEn: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.purchaseOrder.findMany({
        where: { companyId: auth.companyId, ...branchFilter },
        select: { total: true, paid: true, status: true, createdAt: true },
      }),
      db.partner.count({ where: { companyId: auth.companyId } }),
      db.product.count({ where: { companyId: auth.companyId } }),
      db.stockQuant.findMany({
        where: {
          warehouse: {
            branch: {
              companyId: auth.companyId,
              ...(!auth.isSuperAdmin && auth.authorizedBranchIds.length > 0
                ? { id: { in: auth.authorizedBranchIds } }
                : {}),
            },
          },
        },
        include: {
          product: { select: { nameAr: true, nameEn: true, sku: true, costPrice: true, minStock: true } },
        },
      }),
      db.salesPayment.findMany({
        where: { status: 'posted', companyId: auth.companyId, ...branchFilter },
        select: { amount: true, paymentDate: true },
      }),
      db.purchasePayment.findMany({
        where: { status: 'posted', companyId: auth.companyId, ...branchFilter },
        select: { amount: true, paymentDate: true },
      }),
      db.journalEntry.findMany({
        where: { state: 'posted', companyId: auth.companyId, ...branchFilter },
        include: { lines: { include: { account: { select: { code: true, type: true } } } } },
        orderBy: { postingDate: 'desc' },
      }),
      db.salesInvoice.findMany({
        where: { companyId: auth.companyId, ...branchFilter },
        select: { total: true, paid: true, status: true, createdAt: true, invoiceDate: true },
      }),
      db.purchaseInvoice.findMany({
        where: { companyId: auth.companyId, ...branchFilter },
        select: { total: true, paid: true, status: true, createdAt: true },
      }),
      db.journalLine.findMany({
        where: {
          entry: { companyId: auth.companyId, state: 'posted' },
          account: { code: { in: ['1000', '1100', '2000'] } },
        },
        select: {
          debit: true,
          credit: true,
          account: { select: { code: true } },
        },
      }),
    ])

    const totalSales = salesOrders.reduce((s, o) => s + o.total, 0)
    const totalPurchases = purchaseOrders.reduce((s, o) => s + o.total, 0)
    const totalReceipts = salesPayments.reduce((s, p) => s + p.amount, 0)
    const totalPaid = purchasePayments.reduce((s, p) => s + p.amount, 0)

    const inventoryValue = stockQuants.reduce((s, q) => s + q.quantity * (q.product?.costPrice ?? 0), 0)

    // Net profit from journal: revenue - expense
    let totalRevenue = 0, totalExpense = 0
    for (const je of journalEntries) {
      for (const line of je.lines) {
        if (line.account?.type === 'income') totalRevenue += line.credit - line.debit
        if (line.account?.type === 'expense') totalExpense += line.debit - line.credit
      }
    }
    const netProfit = totalRevenue - totalExpense

    // AR, AP, Cash computed from company-scoped journal lines
    let cashBalance = 0, receivables = 0, payables = 0
    for (const l of keyAccountLines) {
      if (l.account?.code === '1000') cashBalance += l.debit - l.credit
      if (l.account?.code === '1100') receivables += l.debit - l.credit
      if (l.account?.code === '2000') payables += l.credit - l.debit
    }

    // Monthly series (last 6 months)
    const now = new Date()
    const months: { label: string; sales: number; purchases: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthSales = salesOrders.filter((o) => { const d = new Date(o.createdAt); return d >= start && d < end }).reduce((s, o) => s + o.total, 0)
      const monthPurchases = purchaseOrders.filter((o) => { const d = new Date(o.createdAt); return d >= start && d < end }).reduce((s, o) => s + o.total, 0)
      const monthsAr = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر']
      months.push({ label: monthsAr[start.getMonth()], sales: Math.round(monthSales), purchases: Math.round(monthPurchases) })
    }

    // Top products by sales (scoped to company)
    const salesOrderItems = await db.salesOrderLine.findMany({
      where: { order: { companyId: auth.companyId, ...branchFilter } },
      include: { product: { select: { nameAr: true, nameEn: true, sku: true } } },
    })
    const productSales = new Map<string, { name: string; sku: string; qty: number; revenue: number }>()
    for (const it of salesOrderItems) {
      const existing = productSales.get(it.productId) ?? { name: it.product?.nameAr ?? it.product?.nameEn ?? '—', sku: it.product?.sku ?? '', qty: 0, revenue: 0 }
      existing.qty += it.quantity
      existing.revenue += it.total
      productSales.set(it.productId, existing)
    }
    const topProducts = Array.from(productSales.entries()).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

    // Low stock
    const lowStock = stockQuants.filter((q) => q.quantity <= (q.product?.minStock ?? 0)).map((q) => ({
      name: q.product?.nameAr ?? q.product?.nameEn ?? '—',
      sku: q.product?.sku ?? '',
      quantity: q.quantity,
      minStock: q.product?.minStock ?? 0,
    }))

    // Recent orders
    const recentOrders = salesOrders.map((o) => ({
      id: o.id,
      code: o.code,
      clientName: o.partner?.nameAr ?? o.partner?.nameEn ?? '—',
      total: o.total,
      status: o.status,
      date: o.createdAt,
    }))

    // Customers vs suppliers count
    const customers = await db.partner.count({ where: { isCustomer: true, companyId: auth.companyId } })
    const suppliers = await db.partner.count({ where: { isSupplier: true, companyId: auth.companyId } })

    return ok({
      kpis: {
        totalSales,
        totalPurchases,
        netProfit,
        inventoryValue,
        totalPartners: partners,
        totalCustomers: customers,
        totalSuppliers: suppliers,
        totalProducts: products,
        totalReceipts,
        totalPayments: totalPaid,
        netCashFlow: totalReceipts - totalPaid,
        cashBalance,
        receivables,
        payables,
      },
      months,
      topProducts,
      lowStock,
      recentOrders,
    })
  } catch (e: any) {
    console.error('dashboard error', e)
    return serverError(e.message)
  }
}
