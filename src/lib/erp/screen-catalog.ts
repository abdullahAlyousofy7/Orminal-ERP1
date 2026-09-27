// Enterprise ERP — Canonical Screen & Security Catalog
// Source of Truth: Excel Matrix (344 unique screens, 657 assignments, 13 screen actions)
// and SkeyERP Operational Variables (37 policies).

import rawData from './screen-catalog-data'

export interface ScreenActionMeta {
  key: ScreenActionKey
  nameAr: string
  nameEn: string
  description: string
}

export type ScreenActionKey =
  | 'include'      // تضمين
  | 'add'          // إضافة
  | 'edit'         // تعديل
  | 'delete'       // حذف
  | 'view'         // عرض
  | 'print'        // طباعة
  | 'cancelDoc'    // إلغاء الوثيقة
  | 'post'         // ترحيل
  | 'suspend'      // تعليق
  | 'viewJournal'  // عرض قيد اليومية
  | 'screenVars'   // متغيرات الشاشة
  | 'review'       // مراجعة
  | 'stop'         // التوقيف

export const SCREEN_ACTIONS: ScreenActionMeta[] = [
  { key: 'include', nameAr: 'تضمين', nameEn: 'Include', description: 'تضمين الشاشة في القائمة وصلاحيات المجموعة' },
  { key: 'add', nameAr: 'إضافة', nameEn: 'Add', description: 'إضافة سجلات جديدة' },
  { key: 'edit', nameAr: 'تعديل', nameEn: 'Edit', description: 'تعديل السجلات القائمة' },
  { key: 'delete', nameAr: 'حذف', nameEn: 'Delete', description: 'حذف السجلات' },
  { key: 'view', nameAr: 'عرض', nameEn: 'View', description: 'استعراض البيانات والبحث' },
  { key: 'print', nameAr: 'طباعة', nameEn: 'Print', description: 'طباعة التقارير والمستندات' },
  { key: 'cancelDoc', nameAr: 'إلغاء الوثيقة', nameEn: 'Cancel Document', description: 'إلغاء الوثيقة الرسمية' },
  { key: 'post', nameAr: 'ترحيل', nameEn: 'Post', description: 'ترحيل الوثائق إلى الحسابات والأستاذ' },
  { key: 'suspend', nameAr: 'تعليق', nameEn: 'Suspend', description: 'تعليق المستند مؤقتاً' },
  { key: 'viewJournal', nameAr: 'عرض قيد اليومية', nameEn: 'View Journal Entry', description: 'معاينة القيد المحاسبي المتولد' },
  { key: 'screenVars', nameAr: 'متغيرات الشاشة', nameEn: 'Screen Variables', description: 'تعديل محددات ومتغيرات الشاشة' },
  { key: 'review', nameAr: 'مراجعة', nameEn: 'Review', description: 'مراجعة وتدقيق السجل' },
  { key: 'stop', nameAr: 'التوقيف', nameEn: 'Stop / Deactivate', description: 'إيقاف وتعطيل السجل' },
]

export const ACTION_NAME_TO_KEY: Record<string, ScreenActionKey> = {
  'تضمين': 'include',
  'إضافة': 'add',
  'تعديل': 'edit',
  'حذف': 'delete',
  'عرض': 'view',
  'طباعة': 'print',
  'إلغاء الوثيقة': 'cancelDoc',
  'ترحيل': 'post',
  'تعليق': 'suspend',
  'عرض قيد اليومية': 'viewJournal',
  'متغيرات الشاشة': 'screenVars',
  'مراجعة': 'review',
  'التوقيف': 'stop',
}

export const ACTION_KEY_TO_NAME: Record<ScreenActionKey, string> = {
  include: 'تضمين',
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  view: 'عرض',
  print: 'طباعة',
  cancelDoc: 'إلغاء الوثيقة',
  post: 'ترحيل',
  suspend: 'تعليق',
  viewJournal: 'عرض قيد اليومية',
  screenVars: 'متغيرات الشاشة',
  review: 'مراجعة',
  stop: 'التوقيف',
}

export interface ScreenCatalogItem {
  code: string
  nameAr: string
  fullTitle: string
  moduleCode: string
  routePath?: string
  parentCode?: string
}

function detectModule(code: string, nameAr: string): string {
  const n = parseInt(code, 10)
  if (isNaN(n)) return 'SYS'
  if (n >= 1 && n <= 19) return 'SYS'
  if (n >= 20 && n <= 99) return 'FIN'
  if (n >= 100 && n <= 299) return 'FIN'
  if (n >= 300 && n <= 499) return 'SAL'
  if (n >= 500 && n <= 699) return 'PUR'
  if (n >= 700 && n <= 999) return 'INV'
  if (n >= 1000 && n <= 1999) return 'SYS'
  if (n >= 2000 && n <= 2299) return 'HR'
  if (nameAr.includes('مبيعات') || nameAr.includes('عملاء') || nameAr.includes('تسعير')) return 'SAL'
  if (nameAr.includes('مشتريات') || nameAr.includes('موردين')) return 'PUR'
  if (nameAr.includes('مخزون') || nameAr.includes('صنف') || nameAr.includes('مستودع')) return 'INV'
  if (nameAr.includes('حسابات') || nameAr.includes('مالية') || nameAr.includes('قيد') || nameAr.includes('سند')) return 'FIN'
  if (nameAr.includes('موظف') || nameAr.includes('حضور') || nameAr.includes('رواتب')) return 'HR'
  return 'SYS'
}

export const CANONICAL_SCREENS: ScreenCatalogItem[] = (rawData.screens as unknown as any[]).map((s) => ({
  code: s.code,
  nameAr: s.nameAr,
  fullTitle: s.fullTitle,
  moduleCode: detectModule(s.code, s.nameAr),
}))

export const SCREEN_BY_CODE = new Map<string, ScreenCatalogItem>(
  CANONICAL_SCREENS.map((s) => [s.code, s])
)

export const STANDARD_EXCEL_ASSIGNMENTS = (rawData.assignments as unknown as Array<{
  group: string
  screenCode: string
  screenTitle: string
  grants: Record<string, boolean>
}>)

// ── Transaction Policies (The 37 Operational Variables from SkeyERP) ─────────
export type PolicyDataType = 'boolean' | 'integer' | 'decimal' | 'string' | 'enum'

export interface TransactionPolicyDef {
  key: string
  nameAr: string
  nameEn: string
  dataType: PolicyDataType
  defaultValue: boolean | number | string
  module: string
  description?: string
  options?: { label: string; value: string }[]
}

export const TRANSACTION_POLICY_DEFINITIONS: TransactionPolicyDef[] = [
  {
    key: 'USE_AI_CHAT',
    nameAr: 'إستخدام المحادثة بالذكاء الاصطناعي',
    nameEn: 'Use AI Assistant Chat',
    dataType: 'boolean',
    defaultValue: true,
    module: 'SYS',
  },
  {
    key: 'ALLOW_EDIT_DELETE_FIN_DOC_AFTER_PRINT',
    nameAr: 'السماح بتعديل/حذف المستندات المالية بعد طباعتها',
    nameEn: 'Allow Edit/Delete Financial Docs After Printing',
    dataType: 'boolean',
    defaultValue: false,
    module: 'FIN',
  },
  {
    key: 'ALLOW_REPRINT_FIN_DOC',
    nameAr: 'السماح بطباعة المستندات المالية أكثر من مرة',
    nameEn: 'Allow Re-printing Financial Docs',
    dataType: 'boolean',
    defaultValue: true,
    module: 'FIN',
  },
  {
    key: 'ALLOW_PRINT_SUSPENDED_DOCS',
    nameAr: 'السماح بطباعة المستندات المعلقة',
    nameEn: 'Allow Printing Suspended Docs',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_PRINT_UNAPPROVED_DOCS',
    nameAr: 'السماح بطباعة المستندات الغير معتمدة',
    nameEn: 'Allow Printing Unapproved Docs',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_PRINT_UNREVIEWED_FIN_DOCS',
    nameAr: 'السماح بطباعة المستندات المالية الغير مراجعة',
    nameEn: 'Allow Printing Unreviewed Financial Docs',
    dataType: 'boolean',
    defaultValue: false,
    module: 'FIN',
  },
  {
    key: 'DOC_EDIT_WINDOW_MINUTES',
    nameAr: 'مدة السماح بتعديل الوثائق بعد / بالدقائق',
    nameEn: 'Document Edit Allowed Window (Minutes)',
    dataType: 'integer',
    defaultValue: 0,
    module: 'SYS',
    description: '0 تعني غير مقيد بالدقائق أو حسب القواعد المحاسبية',
  },
  {
    key: 'DOC_DELETE_WINDOW_MINUTES',
    nameAr: 'مدة السماح بحذف الوثائق بعد / بالدقائق',
    nameEn: 'Document Delete Allowed Window (Minutes)',
    dataType: 'integer',
    defaultValue: 0,
    module: 'SYS',
  },
  {
    key: 'ALLOW_EDIT_NAMES_IN_SETUP',
    nameAr: 'السماح بتعديل الاسماء في التهيئة والمدخلات',
    nameEn: 'Allow Editing Names in Setup & Inputs',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_EDIT_EXCHANGE_RATE_IN_TX',
    nameAr: 'السماح بتعديل سعر تحويل العملة في العمليات',
    nameEn: 'Allow Editing Currency Exchange Rate in Transactions',
    dataType: 'boolean',
    defaultValue: false,
    module: 'FIN',
  },
  {
    key: 'ALLOW_EDIT_DOC_DATE',
    nameAr: 'السماح بتعديل تاريخ الوثيقة',
    nameEn: 'Allow Manual Document Date Modification',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_EDIT_REPORT_TITLE',
    nameAr: 'السماح بتعديل عنوان التقرير في شاشة التقارير',
    nameEn: 'Allow Editing Report Title',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'DOC_VIEW_SCOPE',
    nameAr: 'صلاحيات عرض الوثائق',
    nameEn: 'Document View Scope',
    dataType: 'enum',
    defaultValue: 'ALL_USERS',
    module: 'SYS',
    options: [
      { label: '1- كل المستخدمين', value: 'ALL_USERS' },
      { label: '2- وثائق الفرع فقط', value: 'BRANCH_ONLY' },
      { label: '3- وثائق المستخدم فقط', value: 'USER_ONLY' },
    ],
  },
  {
    key: 'ALLOW_ADD_CUSTOM_FIELDS',
    nameAr: 'السماح بإضافة حقول إضافية',
    nameEn: 'Allow Adding Custom Fields',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_IMPORT_FROM_FILE',
    nameAr: 'إستيراد من ملف',
    nameEn: 'Allow File Import',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SYS',
  },
  {
    key: 'ALLOW_EXCEED_ITEM_MAX_LIMIT',
    nameAr: 'السماح بتجاوز الحد الأعلى للاصناف',
    nameEn: 'Allow Exceeding Items Max Stock Limit',
    dataType: 'boolean',
    defaultValue: false,
    module: 'INV',
  },
  {
    key: 'SHOW_AVAILABLE_QTY_IN_TX',
    nameAr: 'إظهار الكمية المتوفرة في العمليات',
    nameEn: 'Show Available Stock Quantity in Operations',
    dataType: 'boolean',
    defaultValue: true,
    module: 'INV',
  },
  {
    key: 'ALLOW_EXCEED_ITEM_MIN_LIMIT',
    nameAr: 'السماح بتجاوز الحد الأدنى للاصناف',
    nameEn: 'Allow Exceeding Items Min Stock Limit',
    dataType: 'boolean',
    defaultValue: false,
    module: 'INV',
  },
  {
    key: 'ALLOW_VIEW_ITEM_COST',
    nameAr: 'السماح بعرض تكلفة الصنف',
    nameEn: 'Allow Viewing Item Cost Price',
    dataType: 'boolean',
    defaultValue: false,
    module: 'INV',
  },
  {
    key: 'TOLERANCE_BELOW_MIN_PRICE_PCT',
    nameAr: 'نسبة السماح بتجاوز الحد الأدنى للتسعيرة',
    nameEn: 'Tolerance % Below Minimum Price',
    dataType: 'decimal',
    defaultValue: 0,
    module: 'SAL',
  },
  {
    key: 'MAX_DOC_DISCOUNT_PCT_SALES',
    nameAr: 'أعلى نسبة خصم على مستوى الوثيقة في عمليات المبيعات',
    nameEn: 'Max Document Discount % in Sales',
    dataType: 'decimal',
    defaultValue: 0,
    module: 'SAL',
  },
  {
    key: 'MAX_LINE_DISCOUNT_PCT_SALES',
    nameAr: 'أعلى نسبة خصم على مستوى الوثيقة والأصناف في عمليات المبيعات',
    nameEn: 'Max Line Item Discount % in Sales',
    dataType: 'decimal',
    defaultValue: 0,
    module: 'SAL',
  },
  {
    key: 'ALLOW_MANUAL_PRICE_ENTRY',
    nameAr: 'السماح بإدخال الأسعار يدويا',
    nameEn: 'Allow Manual Price Entry',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'SELL_BELOW_COST_PCT',
    nameAr: 'نسبة البيع بأقل من التكلفة',
    nameEn: 'Tolerance % Selling Below Cost',
    dataType: 'decimal',
    defaultValue: 0,
    module: 'SAL',
  },
  {
    key: 'TOLERANCE_ABOVE_MAX_PRICE_PCT',
    nameAr: 'نسبة السماح بتجاوز الحد الأعلى للتسعيرة',
    nameEn: 'Tolerance % Above Maximum Price',
    dataType: 'decimal',
    defaultValue: 0,
    module: 'SAL',
  },
  {
    key: 'ALLOW_EXCEED_RETURN_PERIOD_SALES',
    nameAr: 'السماح بتجاوز فترة الارجاع في مردود المبيعات',
    nameEn: 'Allow Exceeding Return Window in Sales Returns',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'ALLOW_EDIT_CUSTOMER_LINKED_DATA',
    nameAr: 'السماح بتعديل البيانات المرتبطه بالعميل في عمليات المبيعات',
    nameEn: 'Allow Editing Customer-Linked Data in Sales',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'SHOW_VERIFY_DIALOG_ON_SAVE_SALES_INV',
    nameAr: 'إظهار شاشة التدقيق في فاتورة المبيعات عند الحفظ',
    nameEn: 'Show Verification Dialog on Saving Sales Invoice',
    dataType: 'boolean',
    defaultValue: true,
    module: 'SAL',
  },
  {
    key: 'ALLOW_FREE_SALE_ONLY',
    nameAr: 'السماح ببيع مجاني فقط',
    nameEn: 'Allow Free Sale Only',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'ALLOW_BYPASS_SUPPLIER_BLACKLIST',
    nameAr: 'السماح بتخطي القائمة السوداء للموردين',
    nameEn: 'Allow Bypassing Supplier Blacklist',
    dataType: 'boolean',
    defaultValue: false,
    module: 'PUR',
  },
  {
    key: 'ALLOW_BYPASS_CUSTOMER_BLACKLIST',
    nameAr: 'السماح بتخطي القائمة السوداء للعملاء',
    nameEn: 'Allow Bypassing Customer Blacklist',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'SHOW_PRICE_IN_DISPATCH_ORDER',
    nameAr: 'اظهار السعر في شاشة أمر صرف فاتورة مبيعات',
    nameEn: 'Show Price on Sales Invoice Dispatch Order',
    dataType: 'boolean',
    defaultValue: false,
    module: 'SAL',
  },
  {
    key: 'ALLOW_ADD_CUSTOMERS_FROM_POS',
    nameAr: 'السماح بإضافة عملاء من نقاط البيع',
    nameEn: 'Allow Adding Customers in POS',
    dataType: 'boolean',
    defaultValue: true,
    module: 'POS',
  },
  {
    key: 'ALLOW_DELETE_CART_ITEM_BEFORE_SAVE',
    nameAr: 'السماح بحذف صنف من السله قبل الحفظ',
    nameEn: 'Allow Deleting Cart Item Before Save in POS',
    dataType: 'boolean',
    defaultValue: true,
    module: 'POS',
  },
  {
    key: 'ALLOW_DELETE_CART_ITEM_AFTER_KITCHEN',
    nameAr: 'السماح بحذف صنف من السله بعد ارساله للمطبخ',
    nameEn: 'Allow Deleting Cart Item After Kitchen Order',
    dataType: 'boolean',
    defaultValue: false,
    module: 'POS',
  },
  {
    key: 'ALLOW_SUSPENDED_INVOICES_IN_POS',
    nameAr: 'السماح باضافة فواتير معلقه في نقاط البيع',
    nameEn: 'Allow Suspended Invoices in POS',
    dataType: 'boolean',
    defaultValue: true,
    module: 'POS',
  },
  {
    key: 'ALLOW_ZERO_COST_FOR_ITEMS',
    nameAr: 'السماح بإدخال تكلفة صفرية للأصناف',
    nameEn: 'Allow Zero Cost Entry for Items',
    dataType: 'boolean',
    defaultValue: false,
    module: 'INV',
  },
]

export const POLICY_BY_KEY = new Map<string, TransactionPolicyDef>(
  TRANSACTION_POLICY_DEFINITIONS.map((p) => [p.key, p])
)

// ── Input Categories & Items (SkeyERP Input Privileges Reference) ────────────
export interface InputCategoryMeta {
  code: string
  nameAr: string
  nameEn: string
  standardItems: { id: string; nameAr: string }[]
}

export const INPUT_CATEGORIES: InputCategoryMeta[] = [
  {
    code: '3',
    nameAr: 'أنواع وثائق النظام',
    nameEn: 'System Document Types',
    standardItems: [
      { id: 'SO', nameAr: 'أمر بيع' },
      { id: 'INV', nameAr: 'فاتورة مبيعات' },
      { id: 'PO', nameAr: 'أمر شراء' },
      { id: 'PINV', nameAr: 'فاتورة مشتريات' },
      { id: 'JE', nameAr: 'قيد يومية' },
      { id: 'REC', nameAr: 'سند قبض' },
      { id: 'PAY', nameAr: 'سند صرف' },
      { id: 'ST', nameAr: 'تحويل مخزني' },
    ],
  },
  {
    code: '4',
    nameAr: 'نماذج الطباعة',
    nameEn: 'Print Templates',
    standardItems: [
      { id: 'TMPL_INV_STANDARD', nameAr: 'فاتورة ضريبية قياسية' },
      { id: 'TMPL_REC_STANDARD', nameAr: 'سند قبض قياسي' },
      { id: 'TMPL_PAY_STANDARD', nameAr: 'سند صرف قياسي' },
      { id: 'TMPL_JE_STANDARD', nameAr: 'مستند قيد محاسبي' },
    ],
  },
  {
    code: '5',
    nameAr: 'القوائم الثابتة',
    nameEn: 'Static Lists',
    standardItems: [
      { id: 'LST_CURRENCIES', nameAr: 'قائمة العملات' },
      { id: 'LST_COUNTRIES', nameAr: 'قائمة الدول' },
      { id: 'LST_PAY_TERMS', nameAr: 'شروط السداد' },
    ],
  },
  {
    code: '6',
    nameAr: 'تنبيهات النظام',
    nameEn: 'System Alerts',
    standardItems: [
      { id: 'ALT_SCHEDULE', nameAr: 'جدولة الأعمال' },
      { id: 'ALT_ACC_DISCREPANCY', nameAr: 'حسابات أرصدتها مخالفة لطبيعتها' },
      { id: 'ALT_SUSPENDED_DOCS', nameAr: 'الوثائق المعلقة' },
      { id: 'ALT_NO_STOCK_ACCOUNTS', nameAr: 'مجموعات رئيسية لم يتم تعريف حسابات المخزون لها' },
      { id: 'ALT_ITEM_MIN_BREACH', nameAr: 'الأصناف المتجاوزة الحد الأدنى' },
      { id: 'ALT_ITEM_SAFETY_BREACH', nameAr: 'الأصناف المتجاوزة حد الأمان' },
      { id: 'ALT_ITEM_ORDER_POINT', nameAr: 'الأصناف المتجاوزة حد الطلب' },
      { id: 'ALT_ITEM_MAX_BREACH', nameAr: 'الأصناف المتجاوزة الحد الأعلى' },
      { id: 'ALT_EXPIRY_NEAR', nameAr: 'أصناف قريبة إنتهاء الصلاحية' },
      { id: 'ALT_EXPIRY_OVER', nameAr: 'أصناف منتهية الصلاحية' },
    ],
  },
  {
    code: '7',
    nameAr: 'مؤشرات الأداء',
    nameEn: 'KPI Indicators',
    standardItems: [
      { id: 'KPI_SALES_GROWTH', nameAr: 'نمو المبيعات' },
      { id: 'KPI_GROSS_MARGIN', nameAr: 'هامش الربح الإجمالي' },
      { id: 'KPI_INV_TURNOVER', nameAr: 'معدل دوران المخزون' },
    ],
  },
  {
    code: '8',
    nameAr: 'التقارير الديناميكية',
    nameEn: 'Dynamic Reports',
    standardItems: [
      { id: 'RPT_TRIAL_BALANCE', nameAr: 'ميزان المراجعة' },
      { id: 'RPT_INCOME_STMT', nameAr: 'قائمة الدخل' },
      { id: 'RPT_BALANCE_SHEET', nameAr: 'الميزانية العمومية' },
      { id: 'RPT_AGING', nameAr: 'أعمار الديون' },
    ],
  },
  {
    code: '10',
    nameAr: 'الوحدات المالية',
    nameEn: 'Financial Units / Branches',
    standardItems: [], // Loaded dynamically from Company / Branch table
  },
  {
    code: '11',
    nameAr: 'دليل الحسابات',
    nameEn: 'Chart of Accounts',
    standardItems: [], // Loaded dynamically from Account table
  },
  {
    code: '12',
    nameAr: 'مراكز التكلفة',
    nameEn: 'Cost Centers',
    standardItems: [], // Loaded dynamically from CostCenter table
  },
  {
    code: '13',
    nameAr: 'المستودعات',
    nameEn: 'Warehouses',
    standardItems: [], // Loaded dynamically from Warehouse table
  },
]
