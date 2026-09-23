// Enterprise ERP — Standard Subledger Catalog & Default Metadata
// Architectural Source: ADR-001, ADR-009, ADR-014, ADR-016
// Single source of truth for Technical Identity ≠ Display Label separation

export type SubledgerType = 'COST_CENTER' | 'ACTIVITY' | 'PROJECT' | 'ANALYTIC_ACCOUNT'

export interface SubledgerVariableItem {
  key: string
  nameAr: string
  nameEn: string
  type: 'boolean' | 'number' | 'select'
  defaultValue: any
  options?: { value: string; labelAr: string; labelEn: string }[]
  descriptionAr: string
  descriptionEn: string
}

export const SUBLEDGER_VARIABLE_DEFINITIONS: SubledgerVariableItem[] = [
  {
    key: 'includeParentInCode',
    nameAr: 'تضمين الدليل الفرعي الأعلى في رقم الدليل',
    nameEn: 'Include Parent Subledger in Code',
    type: 'boolean',
    defaultValue: true,
    descriptionAr: 'تضمين رقم الدليل الفرعي الأب كبادئة في ترقيم السجلات الفرعية',
    descriptionEn: 'Prefix subledger code with parent subledger code',
  },
  {
    key: 'maxCodeLength',
    nameAr: 'أعلى طول للرقم',
    nameEn: 'Maximum Code Length',
    type: 'number',
    defaultValue: 10,
    descriptionAr: 'الحد الأقصى لعدد الخانات في رمز أو رقم الدليل الفرعي',
    descriptionEn: 'Maximum character length for subledger code',
  },
  {
    key: 'minCodeLength',
    nameAr: 'أدنى طول للرقم',
    nameEn: 'Minimum Code Length',
    type: 'number',
    defaultValue: 1,
    descriptionAr: 'الحد الأدنى لعدد الخانات في رمز أو رقم الدليل الفرعي',
    descriptionEn: 'Minimum character length for subledger code',
  },
  {
    key: 'postingMethod',
    nameAr: 'طريقة الترحيل',
    nameEn: 'Posting Method',
    type: 'select',
    defaultValue: 'all_sides',
    options: [
      { value: 'all_sides', labelAr: 'جميع أطراف القيد', labelEn: 'All Journal Entry Sides' },
      { value: 'expense_revenue_only', labelAr: 'حسابات الإيراد والمصروف فقط', labelEn: 'P&L Accounts Only' },
      { value: 'single_side', labelAr: 'طرف قيد واحد', labelEn: 'Single Side' },
    ],
    descriptionAr: 'سياسة إلزام أو توجيه الترحيل المحاسبي بالدليل الفرعي',
    descriptionEn: 'Accounting posting policy for subledger assignment',
  },
  {
    key: 'numericOnly',
    nameAr: 'إستخدام الأرقام فقط في رقم الدليل',
    nameEn: 'Numeric Digits Only in Code',
    type: 'boolean',
    defaultValue: true,
    descriptionAr: 'حصر ترقيم الدليل في أرقام عددية ومنع الحروف والرموز',
    descriptionEn: 'Restrict code composition to digits only',
  },
  {
    key: 'usageInTransactions',
    nameAr: 'طريقة الإستخدام في العمليات',
    nameEn: 'Usage in Transactions',
    type: 'select',
    defaultValue: 'optional',
    options: [
      { value: 'optional', labelAr: 'إختياري', labelEn: 'Optional' },
      { value: 'mandatory', labelAr: 'إجباري', labelEn: 'Mandatory' },
      { value: 'disabled', labelAr: 'معطل مؤقتاً', labelEn: 'Disabled' },
    ],
    descriptionAr: 'درجة إلزامية تحديد الدليل الفرعي عند إنشاء وتمرير العمليات',
    descriptionEn: 'Mandatory or optional subledger selection during transaction entry',
  },
]

export interface StandardFieldLabel {
  fieldKey: string
  labelAr: string
  labelEn: string
  sortOrder: number
}

export interface StandardSubledgerCatalogItem {
  numericId: number
  subledgerType: SubledgerType
  nameAr: string
  nameEn: string
  descriptionAr: string
  descriptionEn: string
  variables: Record<string, any>
  fieldLabels: StandardFieldLabel[]
}

export const STANDARD_SUBLEDGER_CATALOG: StandardSubledgerCatalogItem[] = [
  {
    numericId: 1,
    subledgerType: 'COST_CENTER',
    nameAr: 'مراكز التكلفة',
    nameEn: 'Cost Centers',
    descriptionAr: 'مراكز التكلفة التحليلية لتتبع الإيرادات والمصروفات',
    descriptionEn: 'Analytical cost centers for revenue and expense allocation',
    variables: {
      includeParentInCode: true,
      maxCodeLength: 10,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'مراكز التكلفة', labelEn: 'Cost Centers', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم المركز', labelEn: 'Cost Center No', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم المركز', labelEn: 'Cost Center Name', sortOrder: 3 },
      { fieldKey: 'type', labelAr: 'نوع مركز التكلفة', labelEn: 'Cost Centers Type', sortOrder: 4 },
      { fieldKey: 'group', labelAr: 'مجموعة مركز التكلفة', labelEn: 'Cost Centers Group', sortOrder: 5 },
      { fieldKey: 'closing', labelAr: 'الإقفال مع مراكز التكلفة', labelEn: 'Closing with Cost Centers', sortOrder: 6 },
    ],
  },
  {
    numericId: 2,
    subledgerType: 'ACTIVITY',
    nameAr: 'الأنشطة',
    nameEn: 'Activities',
    descriptionAr: 'دليل الأنشطة التشغيلية والبرامج الإنتاجية',
    descriptionEn: 'Operational activities and production programs',
    variables: {
      includeParentInCode: false,
      maxCodeLength: 10,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'النشاط', labelEn: 'Activity', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم النشاط', labelEn: 'Activity No', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم النشاط', labelEn: 'Activity Name', sortOrder: 3 },
      { fieldKey: 'branch', labelAr: 'الفرع التابع', labelEn: 'Branch', sortOrder: 4 },
    ],
  },
  {
    numericId: 3,
    subledgerType: 'PROJECT',
    nameAr: 'المشاريع',
    nameEn: 'Projects',
    descriptionAr: 'دليل مشاريع وعقود المنشأة وتكاليفها المباشرة',
    descriptionEn: 'Enterprise projects, contracts, and direct commitments',
    variables: {
      includeParentInCode: false,
      maxCodeLength: 10,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'المشروع', labelEn: 'Project', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم المشروع', labelEn: 'Project No', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم المشروع', labelEn: 'Project Name', sortOrder: 3 },
      { fieldKey: 'manager', labelAr: 'مدير المشروع', labelEn: 'Project Manager', sortOrder: 4 },
      { fieldKey: 'status', labelAr: 'حالة المشروع', labelEn: 'Project Status', sortOrder: 5 },
    ],
  },
  {
    numericId: 4,
    subledgerType: 'ANALYTIC_ACCOUNT',
    nameAr: 'الحسابات التحليلية',
    nameEn: 'Analytic Accounts',
    descriptionAr: 'دليل الحسابات والتحليلات الإضافية المساعدة',
    descriptionEn: 'Auxiliary analytic ledger and secondary tracking accounts',
    variables: {
      includeParentInCode: true,
      maxCodeLength: 12,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'الحساب التحليلي', labelEn: 'Analytic Account', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم الحساب', labelEn: 'Account No', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم الحساب', labelEn: 'Account Name', sortOrder: 3 },
      { fieldKey: 'parent', labelAr: 'الحساب الرئيسي', labelEn: 'Parent Account', sortOrder: 4 },
    ],
  },
]

export const ADDITIONAL_SUBLEDGER_TYPES: StandardSubledgerCatalogItem[] = [
  {
    numericId: 5,
    subledgerType: 'PROFIT_CENTER' as any,
    nameAr: 'مراكز الربحية',
    nameEn: 'Profit Centers',
    descriptionAr: 'مراكز الربحية لتتبع الإيرادات والأرباح التشغيلية',
    descriptionEn: 'Profit centers for revenue and operational profit tracking',
    variables: {
      includeParentInCode: true,
      maxCodeLength: 10,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'مركز الربحية', labelEn: 'Profit Center', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم المركز', labelEn: 'Profit Center No', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم المركز', labelEn: 'Profit Center Name', sortOrder: 3 },
      { fieldKey: 'type', labelAr: 'نوع مركز الربحية', labelEn: 'Profit Center Type', sortOrder: 4 },
      { fieldKey: 'group', labelAr: 'مجموعة مراكز الربحية', labelEn: 'Profit Center Group', sortOrder: 5 },
      { fieldKey: 'closing', labelAr: 'الإقفال مع مراكز الربحية', labelEn: 'Closing with Profit Centers', sortOrder: 6 },
    ],
  },
  {
    numericId: 6,
    subledgerType: 'DEPARTMENT' as any,
    nameAr: 'الأقسام الإدارية',
    nameEn: 'Departments',
    descriptionAr: 'الأقسام والوحدات الإدارية لتتبع المصروفات',
    descriptionEn: 'Administrative departments and units for expense tracking',
    variables: {
      includeParentInCode: false,
      maxCodeLength: 8,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'القسم الإداري', labelEn: 'Department', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رمز القسم', labelEn: 'Department Code', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم القسم', labelEn: 'Department Name', sortOrder: 3 },
      { fieldKey: 'branch', labelAr: 'الفرع التابع', labelEn: 'Branch', sortOrder: 4 },
    ],
  },
  {
    numericId: 7,
    subledgerType: 'FLEET' as any,
    nameAr: 'أسطول المركبات',
    nameEn: 'Fleet & Vehicles',
    descriptionAr: 'تتبع حركة ومصروفات وصيانة المركبات والآليات',
    descriptionEn: 'Tracking vehicle and fleet operations and expenses',
    variables: {
      includeParentInCode: false,
      maxCodeLength: 10,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: false,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'المركبة / الآلية', labelEn: 'Vehicle', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رقم اللوحة / الرمز', labelEn: 'Plate / Code', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم / نوع المركبة', labelEn: 'Vehicle Name / Model', sortOrder: 3 },
      { fieldKey: 'driver', labelAr: 'السائق / العهدة', labelEn: 'Driver / Custody', sortOrder: 4 },
    ],
  },
  {
    numericId: 8,
    subledgerType: 'SALES_REGION' as any,
    nameAr: 'المناطق البيعية',
    nameEn: 'Sales Regions',
    descriptionAr: 'المناطق والقطاعات الجغرافية لتحليل المبيعات والتوزيع',
    descriptionEn: 'Geographical regions for sales and distribution analytics',
    variables: {
      includeParentInCode: false,
      maxCodeLength: 8,
      minCodeLength: 1,
      postingMethod: 'all_sides',
      numericOnly: true,
      usageInTransactions: 'optional',
    },
    fieldLabels: [
      { fieldKey: 'entity', labelAr: 'المنطقة البيعية', labelEn: 'Sales Region', sortOrder: 1 },
      { fieldKey: 'code', labelAr: 'رمز المنطقة', labelEn: 'Region Code', sortOrder: 2 },
      { fieldKey: 'name', labelAr: 'اسم المنطقة', labelEn: 'Region Name', sortOrder: 3 },
      { fieldKey: 'supervisor', labelAr: 'المشرف المسؤول', labelEn: 'Supervisor', sortOrder: 4 },
    ],
  },
]

export const ALL_SUBLEDGER_CATALOG_TEMPLATES = [
  ...STANDARD_SUBLEDGER_CATALOG,
  ...ADDITIONAL_SUBLEDGER_TYPES,
]

