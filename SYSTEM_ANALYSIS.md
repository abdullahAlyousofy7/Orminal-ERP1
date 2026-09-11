# 📋 التحليل الشامل والمتكامل لنظام أورمنال (Orminal ERP)
> **إعداد:** خبير تحليل النظم وهندسة البرمجيات  
> **التاريخ:** سبتمبر 2026  
> **حالة النظام:** جاهز للإنتاج (Production-Ready)  
> **إصدار النظام:** 0.2.0 (Enterprise ERP Edition)  
> **مزود قاعدة البيانات:** PostgreSQL (Neon Serverless Cloud)  
> **إطار العمل:** Next.js 16.1.1 (App Router) + React 19 + TypeScript  

---

## 📑 جدول المحتويات (Table of Contents)
1. [1️⃣ نظرة عامة على النظام (System Overview)](#1️⃣-نظرة-عامة-على-النظام-system-overview)
   - [1.1 الوصف التعريفي والوظيفي](#11-الوصف-التعريفي-والوظيفي)
   - [1.2 حزمة التقنيات المستخدمة (Tech Stack)](#12-حزمة-التقنيات-المستخدمة-tech-stack)
   - [1.3 بنية المجلدات وهندسة المشروع (Folder Structure)](#13-بنية-المجلدات-وهندسة-المشروع-folder-structure)
   - [1.4 نقطة الدخول وكيفية التشغيل (Entry Point & Startup)](#14-نقطة-الدخول-وكيفية-التشغيل-entry-point--startup)
2. [2️⃣ تحليل قاعدة البيانات (Database Analysis)](#2️⃣-تحليل-قاعدة-البيانات-database-analysis)
   - [2.1 محرك قاعدة البيانات وهندسة الاتصال](#21-محرك-قاعدة-البيانات-وهندسة-الاتصال)
   - [2.2 المخططات البيانية للعلاقات (ER Diagrams - Mermaid)](#22-المخططات-البيانية-للعلاقات-er-diagrams---mermaid)
   - [2.3 التحليل المعجمي والتفصيلي لجميع الجداول (93 جدولا)](#23-التحليل-المعجمي-والتفصيلي-لجميع-الجداول-93-جدولا)
   - [2.4 البيانات الأولية (Seed Data)](#24-البيانات-الأولية-seed-data)
3. [3️⃣ تحليل الواجهات وتجربة المستخدم (UI/UX Analysis)](#3️⃣-تحليل-الواجهات-وتجربة-المستخدم-uiux-analysis)
   - [3.1 هيكلية الشاشات والملاحة وتعدد الوحدات](#31-هيكلية-الشاشات-والملاحة-وتعدد-الوحدات)
   - [3.2 الفهرس التفصيلي لجميع الواجهات والوحدات (68 موديول)](#32-الفهرس-التفصيلي-لجميع-الواجهات-والوحدات-68-موديول)
   - [3.3 النماذج، الحقول، والتحقق (Forms & Validation)](#33-النماذج-الحقول-والتحقق-forms--validation)
   - [3.4 نوافذ الحوار والتنبيهات (Dialogs, Modals & Toasts)](#34-نوافذ-الحوار-والتنبيهات-dialogs-modals--toasts)
4. [4️⃣ تحليل الأزرار والإجراءات التفاعلية (Buttons & Actions Matrix)](#4️⃣-تحليل-الأزرار-والإجراءات-التفاعلية-buttons--actions-matrix)
   - [4.1 السجل الشامل لجميع الأزرار والإجراءات في النظام (551 زر وإجراء)](#41-السجل-الشامل-لجميع-الأزرار-والإجراءات-في-النظام-551-زر-وإجراء)
5. [5️⃣ تحليل واجهات برمجة التطبيقات (APIs & Endpoints)](#5️⃣-تحليل-واجهات-برمجة-التطبيقات-apis--endpoints)
   - [5.1 مخطط تتابع استدعاء الـ APIs (Sequence Diagram)](#51-مخطط-تتابع-استدعاء-الـ-apis-sequence-diagram)
   - [5.2 السجل الكامل لجميع نقاط النهاية (291 نقطة عبر 133 مسار)](#52-السجل-الكامل-لجميع-نقاط-النهاية-291-نقطة-عبر-133-مسار)
6. [6️⃣ تحليل منطق الأعمال والعمليات (Business Logic & Workflows)](#6️⃣-تحليل-منطق-الأعمال-والعمليات-business-logic--workflows)
   - [6.1 محرك الترحيل المحاسبي المركزي (Ledger-Centric Posting Engine)](#61-محرك-الترحيل-المحاسبي-المركزي-ledger-centric-posting-engine)
   - [6.2 دورة المبيعات والعملاء (Sales Lifecycle)](#62-دورة-المبيعات-والعملاء-sales-lifecycle)
   - [6.3 دورة المشتريات والمطابقة الثلاثية (Procurement & 3-Way Matching)](#63-دورة-المشتريات-والمطابقة-الثلاثية-procurement--3-way-matching)
   - [6.4 دورة حركة وتقييم المخزون (Append-Only Inventory Ledger)](#64-دورة-حركة-وتقييم-المخزون-append-only-inventory-ledger)
   - [6.5 دورة الإنتاج والتصنيع (Manufacturing & BOM)](#65-دورة-الإنتاج-والتصنيع-manufacturing--bom)
   - [6.6 نظام حوكمة الإعدادات والتشفير (Config Governance Engine)](#66-نظام-حوكمة-الإعدادات-والتشفير-config-governance-engine)
7. [7️⃣ نظام الأمان والصلاحيات وعزل البيانات (Auth, RBAC & Multi-Tenancy)](#7️⃣-نظام-الأمان-والصلاحيات-وعزل-البيانات-auth-rbac--multi-tenancy)
   - [7.1 المصادقة وإدارة الجلسات (NextAuth & scrypt Hashing)](#71-المصادقة-وإدارة-الجلسات-nextauth--scrypt-hashing)
   - [7.2 التحكم بالوصول المبني على الأدوار (RBAC + ABAC Data Scoping)](#72-التحكم-بالوصول-المبني-على-الأدوار-rbac--abac-data-scoping)
   - [7.3 عزل الشركات والفروع ودفاع IDOR](#73-عزل-الشركات-والفروع-ودفاع-idor)
   - [7.4 البرمجيات الوسيطة وحماية المسارات (Middleware & Proxy)](#74-البرمجيات-الوسيطة-وحماية-المسارات-middleware--proxy)
8. [8️⃣ التبعيات والإعدادات التشغيلية (Dependencies & Config)](#8️⃣-التبعيات-والإعدادات-التشغيلية-dependencies--config)
   - [8.1 تحليل مكتبات package.json](#81-تحليل-مكتبات-packagejson)
   - [8.2 متغيرات البيئة (Environment Variables)](#82-متغيرات-البيئة-environment-variables)
   - [8.3 تكوين السيرفر وخادم Caddy المعكوس](#83-تكوين-السيرفر-وخادم-caddy-المعكوس)
9. [9️⃣ نقاط القوة، الثغرات والضعف، والتوصيات الهندسية](#9️⃣-نقاط-القوة-الثغرات-والضعف-والتوصيات-الهندسية)
   - [9.1 نقاط القوة في التصميم المعماري](#91-نقاط-القوة-في-التصميم-المعماري)
   - [9.2 نقاط الضعف والمخاطر المحتملة](#92-نقاط-الضعف-والمخاطر-المحتملة)
   - [9.3 توصيات التحسين والتطوير المستقبلي](#93-توصيات-التحسين-والتطوير-المستقبلي)
10. [🔟 لوحة الإحصائيات الشاملة للنظام (Final Statistics)](#🔟-لوحة-الإحصائيات-الشاملة-للنظام-final-statistics)

---

# 1️⃣ نظرة عامة على النظام (System Overview)

## 1.1 الوصف التعريفي والوظيفي
نظام **أورمنال (Orminal ERP)** هو نظام متكامل ومتقدم لتخطيط وإدارة موارد المؤسسات (Enterprise Resource Planning)، مصمم وفق أعلى معايير هندسة البرمجيات المؤسسية، ومتوافق كلياً مع المتطلبات المحاسبية والضريبية للمملكة العربية السعودية ودول مجلس التعاون الخليجي، بما في ذلك متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA / الفوترة الإلكترونية).

يدعم النظام بيئة العمل متعددة الشركات (Multi-Company) ومتعددة الفروع (Multi-Branch) ومتعددة العملات (Multi-Currency) مع عزل أمني محكم للبيانات، ويعتمد على معمارية القيود المحاسبية المركزية غير القابلة للتعديل بعد الترحيل (**Ledger-Centric Posting & Immutable Auditing**).

### النطاقات الوظيفية المغطاة:
1. **المالية والمحاسبة العامة (Finance & Accounting):** شجرة حسابات هرمية ديناميكية، قيود يومية، مراكز تكلفة، حسابات تحليلية، إقفال فترات مالية، بنوك وخزن، سندات قبض وصرف، ميزانيات، وقوائم مالية ختامية.
2. **المبيعات وإدارة العملاء (Sales & CRM):** عروض أسعار، أوامر بيع، فواتير ضريبية، إشعارات دائنة، مردودات مبيعات، متابعة أرصدة وأعمار ديون العملاء، ونظام نقاط البيع (POS).
3. **المشتريات وإدارة الموردين (Procurement & SCM):** طلبات شراء، أوامر شراء، إشعارات استلام بضاعة (GRN)، فواتير شراء، إشعارات مدينة، ومردودات مشتريات مع تطبيق المطابقة الثلاثية (Three-Way Matching).
4. **المخزون والمستودعات (Inventory & Warehousing):** دفتر أستاذ حركات المخزون غير القابل للتعديل (Append-Only Inventory Ledger)، تقييم الوارد أولاً صادر أولاً (FIFO)، تحويلات، تسويات، وتتبع أرقام التشغيلات (Lot Tracking) والصلاحية.
5. **التصنيع والإنتاج (Manufacturing):** قوائم تركيب المواد (BOM)، مراكز العمل والتكاليف الصناعية، وأوامر الإنتاج مع تتبع استهلاك المواد الخام واستلام المنتج التام.
6. **الموارد البشرية والرواتب (HR & Payroll):** ملفات الموظفين، الهيكل التنظيمي، سجلات الحضور، طلبات الإجازات، العقود، ومسيرات الرواتب المتوافقة مع أنظمة العمل.
7. **التقارير ولوحات التحكم (Reporting & Analytics):** تقارير تفاعلية تغطي كافة العمليات مع إمكانية التصدير (Excel, PDF) ورسوم بيانية آنية.
8. **حوكمة النظام والإعدادات (System Configuration Governance):** 14 نطاقاً وظيفياً و60 فرعاً تشغيلياً لحوكمة الإعدادات، مع تشفير البيانات الحساسة (AES-256-GCM) وتتبع التغييرات.

---

## 1.2 حزمة التقنيات المستخدمة (Tech Stack)

| الطبقة (Layer) | التقنية / المكتبة | الإصدار | الغرض والدور في النظام |
|----------------|------------------|---------|------------------------|
| **Frontend Framework** | **Next.js** (App Router) | ^16.1.1 | الإطار الأساسي للواجهات ودعم Server/Client Components |
| **UI Library** | **React** | ^19.0.0 | بناء واجهات المستخدم التفاعلية ومكونات النظام |
| **Language** | **TypeScript** | ^5.0 | كتابة كود عالي الأمان مع التحقق الصارم من الأنواع |
| **Styling** | **Tailwind CSS** | ^4.0 | تصميم الواجهات مع تنسيقات حديثة ودعم RTL بالكامل |
| **Component Primitives** | **Radix UI** | أحدث إصدار | مكونات واجهات تفاعلية قابلة للوصول (Dialogs, Dropdowns, Sheets, Popovers) |
| **Icons** | **Lucide React** | ^0.525.0 | حزمة أيقونات متكاملة ومتناسقة لجميع الشاشات |
| **State Management** | **Zustand** | ^5.0.6 | إدارة الحالة العامة للنظام والتبديل بين الشاشات والملاحة |
| **Data Fetching** | **TanStack React Query** | ^5.82.0 | جلب البيانات وتخزينها مؤقتاً ومزامنتها في الواجهات |
| **Data Tables** | **TanStack React Table** | ^8.21.3 | بناء جداول بيانات ضخمة مع الفرز والتصفية والترقيم |
| **Data Visualization** | **Recharts** | ^2.15.4 | الرسوم والمخططات البيانية للوحة التحكم والتقارير |
| **Animations** | **Framer Motion** | ^12.23.2 | تأثيرات الحركة الانتقالية والتفاعلات الدقيقة |
| **Backend / API** | **Next.js Route Handlers** | ^16.1.1 | بناء الـ RESTful APIs ومعالجة الطلبات داخل السيرفر |
| **Authentication** | **NextAuth.js** | ^4.24.11 | نظام المصادقة وإدارة الجلسات ورموز التوكن JWT |
| **ORM** | **Prisma ORM** | ^6.11.1 | التعامل مع قاعدة البيانات، كتابة الاستعلامات، والهجرات |
| **Database Engine** | **PostgreSQL (Neon)** | Serverless | محرك قاعدة البيانات السحابي المتطور مع دعم المعاملات والـ Pool |
| **Form Handling** | **React Hook Form + Zod** | ^7.60 / ^4.0 | إدارة النماذج والتحقق الصارم من صحة المدخلات |
| **Export Utilities** | **ExcelJS** | ^4.4.0 | تصدير التقارير وجداول البيانات إلى ملفات Excel منسقة |
| **Security / Crypto** | **Node.js Crypto (scrypt & AES-256-GCM)** | Built-in | تجزئة كلمات المرور وتشفير أسرار وإعدادات النظام |
| **Web Server / Proxy** | **Caddy** | Modern | خادم ويب ومحول بروكسي عكسي لإدارة النطاقات وSSL |

---

## 1.3 بنية المجلدات وهندسة المشروع (Folder Structure)

```
Orminal-ERP-1/
├── .env / .env.example       # متغيرات البيئة وإعدادات الاتصال المشفرة
├── Caddyfile                 # إعدادات خادم الويب Caddy والبروكسي العكسي
├── package.json              # التبعيات وحزم النظام والسكربتات التنفيذية
├── tsconfig.json             # إعدادات مترجم TypeScript ومسارات الاختصار (@/*)
├── next.config.ts            # تكوين Next.js ووضع الإخراج المستقل (standalone)
├── tailwind.config.ts        # تكوين Tailwind CSS والتصميم المظلم/المضيء
├── prisma/
│   ├── schema.prisma         # المخطط الشامل لجميع نماذج وجداول قاعدة البيانات (93 نموذجاً)
│   └── dev.db                # نسخة احتياطية محلية سابقة (قبل الهجرة لـ Postgres)
├── public/                   # الملفات الساكنة والصور والشعارات العامة
├── scripts/                  # سكربتات الصيانة، البذر (Seeding)، الهجرة، والنسخ الاحتياطي
│   ├── seed.ts               # بذر البيانات الشامل للشركات والعملات والحسابات
│   ├── backup-database.mjs   # أداة النسخ الاحتياطي لقاعدة البيانات
│   ├── verify-migration.mjs  # فحص سلامة هجرة قاعدة البيانات
│   └── migrate-chart-of-accounts.mjs # هجرة وإعادة هيكلة دليل الحسابات
├── src/
│   ├── proxy.ts              # البرمجية الوسيطة (Middleware) لحماية المسارات والمصادقة
│   ├── app/                  # موجه التطبيقات (Next.js App Router)
│   │   ├── layout.tsx        # التخطيط الجذري وتضمين الخطوط والأنماط
│   │   ├── page.tsx          # نقطة الهبوط الرئيسية وتضمين AppShell
│   │   ├── login/            # واجهة تسجيل الدخول
│   │   │   └── page.tsx
│   │   └── api/              # واجهات برمجة التطبيقات الخلفية (133 مساراً)
│   │       ├── auth/         # مسارات المصادقة والتسجيل
│   │       └── erp/          # مسارات العمليات التشغيلية والمحاسبية للنظام
│   ├── components/           # مكونات الواجهات
│   │   ├── providers.tsx     # مزودات الجلسة (NextAuth) و React Query والثيمات
│   │   ├── ui/               # مكونات التصميم الأساسية (Shadcn / Radix) - 50 مكوناً
│   │   ├── erp/              # الهيكل العام لنظام ERP (AppShell, Topbar, SidebarNav)
│   │   │   ├── app-shell.tsx         # الهيكل الحاوي للشاشات وإدارة التبديل
│   │   │   ├── sidebar-nav.tsx       # شريط التنقل الجانبي وقوائم الموديولات
│   │   │   ├── topbar.tsx            # الشريط العلوي (التنبيهات، الفرع، المستخدم)
│   │   │   ├── module-registry.tsx   # سجل تحميل الموديولات التلقائي والكسول
│   │   │   └── coa/                  # مكونات دليل الحسابات التفاعلي الشجري
│   │   └── modules/          # شاشات وموديولات النظام التشغيلية (68 موديولاً متكاملاً)
│   ├── lib/                  # المنطق البرمجي والخدمات الخلفية
│   │   ├── db.ts             # مدير الاتصال بقاعدة البيانات عبر Prisma Client
│   │   ├── format.ts         # دوال تنسيق الأرقام والعملات والتواريخ العربية
│   │   ├── export.ts         # محرك تصدير جداول البيانات والتقارير
│   │   ├── auth/             # منطق المصادقة والتحقق وتجزئة كلمات المرور
│   │   ├── config/           # محرك حوكمة الإعدادات والشجرة والتشفير
│   │   └── erp/              # محرك الأعمال المحاسبي والمالي والأمني
│   │       ├── accounting-engine.ts  # محرك الترحيل المحاسبي المركزي للقيود
│   │       ├── account-determination.ts # تعيين الحسابات ديناميكياً بدون أكواد ثابتة
│   │       ├── rbac.ts               # حراسة الصلاحيات وعزل الشركات ومكافحة IDOR
│   │       ├── audit.ts              # سجل التدقيق وتتبع الأنشطة غير القابل للتعديل
│   │       └── number-sequence.ts    # توليد الترقيم التسلسلي القانوني للمستندات
│   ├── stores/               # مخازن الحالة العامة (Zustand)
│   │   └── nav-store.ts      # إدارة الموديول النشط وحالة القائمة الجانبية
│   └── types/                # تعريفات الأنواع المشتركة في النظام
```

---

## 1.4 نقطة الدخول وكيفية التشغيل (Entry Point & Startup)

### نقطة الدخول الأساسية:
- عند فتح النظام، يستقبل الخادم الطلب عبر `src/proxy.ts` (الوسيط الأمني Middleware).
- إذا لم يكن المستخدم مصادقاً ولديه جلسة صالحة، يُعاد توجيهه إلى `/login`.
- عند تسجيل الدخول بنجاح، تُحمّل الصفحة الرئيسية `src/app/page.tsx` التي تستدعي `<AppShell />`.
- يتولى `AppShell` عبر `src/components/erp/module-registry.tsx` و `nav-store.ts` تحميل لوحة التحكم (`DashboardModule`) افتراضياً، أو تحميل الموديول المختار بواسطة التحميل الكسول المتزامن (`React dynamic / Suspense`).

### أوامر التشغيل والصيانة (CLI Scripts):
```bash
# 1. تشغيل بيئة التطوير (Development Server)
npm run dev

# 2. بناء حزمة الإنتاج وتشغيلها (Production Build)
npm run build
npm run start

# 3. مزامنة وتحديث قاعدة البيانات (Prisma Database Push)
npm run db:push

# 4. توليد عميل بريزما المحدث (Prisma Client Generation)
npm run db:generate

# 5. بذر البيانات الأساسية للنظام (Data Seeding)
node scripts/seed-postgres.mjs

# 6. تشغيل الاختبارات الآلية (Automated Tests)
npm run test
```

---

# 2️⃣ تحليل قاعدة البيانات (Database Analysis)

## 2.1 محرك قاعدة البيانات وهندسة الاتصال
- **المحرك الحالي:** PostgreSQL مستضاف عبر منصة **Neon Cloud Serverless**.
- **طبقة النفاذ:** **Prisma ORM (v6.11.1)**.
- **استراتيجية الاتصال:**
  - `DATABASE_URL`: اتصال مجمع (Connection Pooling) لمعالجة الطلبات العالية.
  - `DATABASE_URL_UNPOOLED`: اتصال مباشر للعمليات التزامنية والهجرات (Migrations).
- **هيكلية الجداول:** 93 نموذجاً (Models/Tables) تغطي جميع احتياجات المؤسسات الضخمة.

---

## 2.2 المخططات البيانية للعلاقات (ER Diagrams - Mermaid)

### أ. مخطط العلاقات لنطاق الهوية والأمان والمؤسسة (Platform & Security)
```mermaid
erDiagram
    Company ||--o{ Branch : has
    Company ||--o{ User : employs
    Company ||--o{ OrgStructure : owns
    Branch ||--o{ OrgStructure : contains
    User ||--o{ UserRole : assigned
    Role ||--o{ UserRole : groups
    Role ||--o{ RolePermission : defines
    Permission ||--o{ RolePermission : specifies
    User ||--o{ AuditLog : creates
    User ||--o{ Notification : receives
    Company ||--o{ Setting : configures
```

### ب. مخطط العلاقات لنطاق الحسابات والمالية (Finance & Accounting)
```mermaid
erDiagram
    Company ||--o{ Account : maintains
    Account ||--o{ Account : parent_of
    Account ||--o{ JournalLine : references
    Journal ||--o{ JournalEntry : categorizes
    FiscalYear ||--o{ FiscalPeriod : divides
    FiscalPeriod ||--o{ JournalEntry : contains
    JournalEntry ||--o{ JournalLine : aggregates
    CostCenter ||--o{ JournalLine : allocates
    AnalyticAccount ||--o{ JournalLine : tracks
    Partner ||--o{ JournalLine : connects
    Company ||--o{ BankAccount : owns
    Company ||--o{ Safe : possesses
```

### ج. مخطط العلاقات لنطاق المبيعات والمشتريات والمخزون (Sales, Procurement & Inventory)
```mermaid
erDiagram
    Company ||--o{ Partner : manages
    Partner ||--o{ SalesOrder : places
    SalesOrder ||--o{ SalesOrderLine : contains
    Product ||--o{ SalesOrderLine : ordered
    SalesOrder ||--o{ SalesInvoice : bills
    SalesInvoice ||--o{ SalesInvoiceLine : details
    SalesInvoice ||--o{ SalesPayment : settles
    Partner ||--o{ PurchaseOrder : supplies
    PurchaseOrder ||--o{ PurchaseOrderLine : contains
    PurchaseOrder ||--o{ GoodsReceipt : fulfills
    GoodsReceipt ||--o{ GoodsReceiptLine : details
    Warehouse ||--o{ StockQuant : holds
    Product ||--o{ StockQuant : stocked
    Product ||--o{ StockMove : tracks
    Warehouse ||--o{ Delivery : dispatches
```

---

## 2.3 التحليل المعجمي والتفصيلي لجميع الجداول (93 جدولا)

فيما يلي توثيق شامل ودقيق لجميع الجداول المعرفة في مخطط البيانات، متضمناً المفاتيح الأساسية (PK)، المفاتيح الخارجية (FK)، القيود، والفهارس:

### 2.3.1 جدول: `Company` (49 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `shortName` | `String?` | - | - | - |
| `legalName` | `String?` | - | - | - |
| `companyType` | `String?` | - | `"LLC"` | - |
| `taxNumber` | `String?` | - | - | - |
| `crNumber` | `String?` | - | - | - |
| `vatNumber` | `String?` | - | - | - |
| `nationalId` | `String?` | - | - | - |
| `establishedAt` | `DateTime?` | - | - | - |
| `address` | `String?` | - | - | - |
| `phone` | `String?` | - | - | - |
| `mobile` | `String?` | - | - | - |
| `fax` | `String?` | - | - | - |
| `email` | `String?` | - | - | - |
| `website` | `String?` | - | - | - |
| `country` | `String?` | - | `"SA"` | - |
| `city` | `String?` | - | - | - |
| `district` | `String?` | - | - | - |
| `postalCode` | `String?` | - | - | - |
| `logoUrl` | `String?` | - | - | - |
| `logoPrintUrl` | `String?` | - | - | - |
| `faviconUrl` | `String?` | - | - | - |
| `currencyId` | `String` | - | - | - |
| `decimalPrecision` | `Int` | - | `2` | - |
| `taxPolicy` | `String?` | - | `"STANDARD"` | - |
| `timezone` | `String` | - | `"Asia/Riyadh"` | - |
| `locale` | `String` | - | `"ar"` | - |
| `dateFormat` | `String?` | - | `"YYYY-MM-DD"` | - |
| `weekStartDay` | `String?` | - | `"SATURDAY"` | - |
| `numberFormat` | `String?` | - | `"STANDARD"` | - |
| `fiscalYearStartMonth` | `Int` | - | `1` | - |
| `mainBranchId` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `currency` | `Currency` | - | - | → fields: [currencyId], references: [id] |
| `branches` | `Branch[]` | - | - | - |
| `users` | `User[]` | - | - | - |
| `partners` | `Partner[]` | - | - | - |
| `products` | `Product[]` | - | - | - |
| `fiscalYears` | `FiscalYear[]` | - | - | - |
| `orgStructures` | `OrgStructure[]` | - | - | - |
| `expenses` | `Expense[]` | - | - | - |
| `revenues` | `Revenue[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[currencyId]`

### 2.3.2 جدول: `Branch` (22 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `companyId` | `String` | - | - | - |
| `address` | `String?` | - | - | - |
| `phone` | `String?` | - | - | - |
| `email` | `String?` | - | - | - |
| `managerId` | `String?` | - | - | - |
| `isMain` | `Boolean` | - | `false` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `manager` | `User?` | - | - | → "BranchManager", fields: [managerId], references: [id] |
| `warehouses` | `Warehouse[]` | - | - | - |
| `users` | `User[]` | - | - | → "BranchUsers" |
| `defaultUsers` | `User[]` | - | - | → "UserDefaultBranch" |
| `orgStructures` | `OrgStructure[]` | - | - | - |
| `activities` | `Activity[]` | - | - | - |
| `expenses` | `Expense[]` | - | - | - |
| `revenues` | `Revenue[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[managerId]`

### 2.3.3 جدول: `OrgStructure` (35 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `type` | `String` | - | `"إدارة"` | - |
| `level` | `Int` | - | `1` | - |
| `path` | `String?` | - | - | - |
| `sortOrder` | `Int` | - | `0` | - |
| `companyId` | `String?` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `costCenterId` | `String?` | - | - | - |
| `managerId` | `String?` | - | - | - |
| `status` | `String` | - | `"active"` | - |
| `active` | `Boolean` | - | `true` | - |
| `effectiveFrom` | `DateTime?` | - | - | - |
| `effectiveTo` | `DateTime?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `suspendedBy` | `String?` | - | - | - |
| `suspendedAt` | `DateTime?` | - | - | - |
| `suspensionReason` | `String?` | - | - | - |
| `suspensionCount` | `Int` | - | `0` | - |
| `modificationCount` | `Int` | - | `0` | - |
| `printCount` | `Int` | - | `0` | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `parent` | `OrgStructure?` | - | - | → "OrgHierarchy", fields: [parentId], references: [id], onDelete: SetNull |
| `children` | `OrgStructure[]` | - | - | → "OrgHierarchy" |
| `company` | `Company?` | - | - | → fields: [companyId], references: [id] |
| `branch` | `Branch?` | - | - | → fields: [branchId], references: [id] |
| `costCenter` | `CostCenter?` | - | - | → fields: [costCenterId], references: [id] |
| `manager` | `Employee?` | - | - | → "OrgUnitManager", fields: [managerId], references: [id] |
| `employees` | `Employee[]` | - | - | → "OrgUnitEmployees" |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`, `[code]`, `[companyId]`, `[branchId]`, `[costCenterId]`, `[managerId]`, `[status]`, `[path]`

### 2.3.4 جدول: `User` (32 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `username` | `String` | 🌟 Unique | - | - |
| `email` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `passwordHash` | `String` | - | - | - |
| `phone` | `String?` | - | - | - |
| `avatar` | `String?` | - | - | - |
| `defaultCompanyId` | `String?` | - | - | - |
| `defaultBranchId` | `String?` | - | - | - |
| `locale` | `String` | - | `"ar"` | - |
| `timezone` | `String` | - | `"Asia/Riyadh"` | - |
| `mfaEnabled` | `Boolean` | - | `false` | - |
| `mfaSecret` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `lastLoginAt` | `DateTime?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `defaultCompany` | `Company?` | - | - | → fields: [defaultCompanyId], references: [id] |
| `defaultBranch` | `Branch?` | - | - | → "UserDefaultBranch", fields: [defaultBranchId], references: [id] |
| `employee` | `Employee?` | - | - | - |
| `managedBranches` | `Branch[]` | - | - | → "BranchManager" |
| `branches` | `Branch[]` | - | - | → "BranchUsers" |
| `userRoles` | `UserRole[]` | - | - | - |
| `auditLogs` | `AuditLog[]` | - | - | - |
| `notifications` | `Notification[]` | - | - | - |
| `outboxEvents` | `OutboxEvent[]` | - | - | - |
| `approvals` | `ApprovalStep[]` | - | - | - |
| `createdSalesOrders` | `SalesOrder[]` | - | - | → "SalesOrderCreator" |
| `createdPurchaseOrders` | `PurchaseOrder[]` | - | - | → "PurchaseOrderCreator" |
| `createdJournalEntries` | `JournalEntry[]` | - | - | → "JournalEntryCreator" |
| `createdProductionOrders` | `ProductionOrder[]` | - | - | → "ProductionOrderCreator" |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[defaultCompanyId]`, `[defaultBranchId]`

### 2.3.5 جدول: `Role` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `isSystem` | `Boolean` | - | `false` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `userRoles` | `UserRole[]` | - | - | - |
| `rolePermissions` | `RolePermission[]` | - | - | - |

### 2.3.6 جدول: `Permission` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `moduleCode` | `String` | - | - | - |
| `menuCode` | `String?` | - | - | - |
| `actionCode` | `String` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `riskLevel` | `String` | - | `"low"` | - |
| `requiresAudit` | `Boolean` | - | `false` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `rolePermissions` | `RolePermission[]` | - | - | - |

### 2.3.7 جدول: `RolePermission` (21 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `roleId` | `String` | - | - | - |
| `permissionId` | `String` | - | - | - |
| `canCreate` | `Boolean` | - | `false` | - |
| `canRead` | `Boolean` | - | `true` | - |
| `canUpdate` | `Boolean` | - | `false` | - |
| `canDelete` | `Boolean` | - | `false` | - |
| `canApprove` | `Boolean` | - | `false` | - |
| `canPost` | `Boolean` | - | `false` | - |
| `canCancel` | `Boolean` | - | `false` | - |
| `canReverse` | `Boolean` | - | `false` | - |
| `canPrint` | `Boolean` | - | `true` | - |
| `canExport` | `Boolean` | - | `false` | - |
| `canImport` | `Boolean` | - | `false` | - |
| `dataScope` | `String` | - | `"own"` | - |
| `companyScope` | `String?` | - | - | - |
| `branchScope` | `String?` | - | - | - |
| `warehouseScope` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `role` | `Role` | - | - | → fields: [roleId], references: [id], onDelete: Cascade |
| `permission` | `Permission` | - | - | → fields: [permissionId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[roleId]`, `[permissionId]`

### 2.3.8 جدول: `UserRole` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `userId` | `String` | - | - | - |
| `roleId` | `String` | - | - | - |
| `companyId` | `String?` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `validFrom` | `DateTime` | - | `now(` | - |
| `validTo` | `DateTime?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `user` | `User` | - | - | → fields: [userId], references: [id], onDelete: Cascade |
| `role` | `Role` | - | - | → fields: [roleId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[userId]`, `[roleId]`, `[companyId]`, `[branchId]`

### 2.3.9 جدول: `AuditLog` (15 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `userId` | `String?` | - | - | - |
| `companyId` | `String?` | - | - | - |
| `moduleCode` | `String` | - | - | - |
| `documentType` | `String` | - | - | - |
| `documentId` | `String?` | - | - | - |
| `action` | `String` | - | - | - |
| `oldValue` | `String?` | - | - | - |
| `newValue` | `String?` | - | - | - |
| `reason` | `String?` | - | - | - |
| `ipAddress` | `String?` | - | - | - |
| `deviceInfo` | `String?` | - | - | - |
| `correlationId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `user` | `User?` | - | - | → fields: [userId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[moduleCode, documentType, documentId]`, `[userId]`, `[createdAt]`, `[companyId]`, `[documentId]`, `[correlationId]`

### 2.3.10 جدول: `OutboxEvent` (12 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `eventType` | `String` | - | - | - |
| `aggregateType` | `String` | - | - | - |
| `aggregateId` | `String` | - | - | - |
| `payload` | `String` | - | - | - |
| `metadata` | `String?` | - | - | - |
| `status` | `String` | - | `"pending"` | - |
| `retryCount` | `Int` | - | `0` | - |
| `dispatchedAt` | `DateTime?` | - | - | - |
| `userId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `user` | `User?` | - | - | → fields: [userId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[status, createdAt]`, `[aggregateType, aggregateId]`, `[aggregateId]`, `[userId]`

### 2.3.11 جدول: `Notification` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `userId` | `String` | - | - | - |
| `title` | `String` | - | - | - |
| `message` | `String` | - | - | - |
| `type` | `String` | - | `"info"` | - |
| `category` | `String` | - | `"system"` | - |
| `isRead` | `Boolean` | - | `false` | - |
| `link` | `String?` | - | - | - |
| `correlationId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `user` | `User` | - | - | → fields: [userId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[userId, isRead]`, `[correlationId]`

### 2.3.12 جدول: `ApprovalStep` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `documentType` | `String` | - | - | - |
| `documentId` | `String` | - | - | - |
| `stepOrder` | `Int` | - | - | - |
| `approverRole` | `String` | - | - | - |
| `approverId` | `String?` | - | - | - |
| `status` | `String` | - | `"pending"` | - |
| `comment` | `String?` | - | - | - |
| `actedAt` | `DateTime?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `approver` | `User?` | - | - | → fields: [approverId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[documentType, documentId]`, `[approverId, status]`, `[documentId]`, `[status]`

### 2.3.13 جدول: `NumberSequence` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `documentType` | `String` | - | - | - |
| `prefix` | `String` | - | - | - |
| `fiscalYear` | `Int?` | - | - | - |
| `nextNumber` | `Int` | - | `1` | - |
| `padding` | `Int` | - | `6` | - |
| `resetPolicy` | `String` | - | `"yearly"` | - |
| `lastNumber` | `Int` | - | `0` | - |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[companyId, branchId, documentType, fiscalYear]`
- **فهارس الأداء (Indexes):** `[branchId]`

### 2.3.14 جدول: `Setting` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `key` | `String` | - | - | - |
| `companyId` | `String` | - | `"*"` | - |
| `branchId` | `String` | - | `"*"` | - |
| `value` | `String` | - | - | - |
| `category` | `String` | - | `"general"` | - |
| `label` | `String?` | - | - | - |
| `labelEn` | `String?` | - | - | - |
| `type` | `String` | - | `"string"` | - |
| `defaultValue` | `String?` | - | - | - |
| `options` | `String?` | - | - | - |
| `description` | `String?` | - | - | - |
| `isSystem` | `Boolean` | - | `false` | - |
| `sortOrder` | `Int` | - | `0` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[key, companyId, branchId]`
- **فهارس الأداء (Indexes):** `[category]`, `[companyId, branchId]`

### 2.3.15 جدول: `SettingAuditLog` (12 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `settingKey` | `String` | - | - | - |
| `oldValue` | `String?` | - | - | - |
| `newValue` | `String?` | - | - | - |
| `userId` | `String?` | - | - | - |
| `companyId` | `String?` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `category` | `String` | - | - | - |
| `reason` | `String?` | - | - | - |
| `ipAddress` | `String?` | - | - | - |
| `userAgent` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[settingKey]`, `[category]`, `[createdAt]`, `[userId]`

### 2.3.16 جدول: `GeneralDefinition` (15 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | `"*"` | - |
| `typeCode` | `String` | - | - | - |
| `code` | `String` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `description` | `String?` | - | - | - |
| `sortOrder` | `Int` | - | `0` | - |
| `isSystem` | `Boolean` | - | `false` | - |
| `active` | `Boolean` | - | `true` | - |
| `meta` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[companyId, typeCode, code]`
- **فهارس الأداء (Indexes):** `[companyId, typeCode, active]`, `[typeCode]`, `[code]`

### 2.3.17 جدول: `Currency` (33 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `symbol` | `String` | - | - | - |
| `fractionNameAr` | `String?` | - | - | - |
| `fractionNameEn` | `String?` | - | - | - |
| `decimals` | `Int` | - | `2` | - |
| `exchangeRate` | `Float` | - | `1.0` | - |
| `buyRate` | `Float?` | - | - | - |
| `sellRate` | `Float?` | - | - | - |
| `minLimit` | `Float?` | - | - | - |
| `maxLimit` | `Float?` | - | - | - |
| `sortOrder` | `Int` | - | `0` | - |
| `isBase` | `Boolean` | - | `false` | - |
| `isInventory` | `Boolean` | - | `false` | - |
| `status` | `String` | - | `"active"` | - |
| `active` | `Boolean` | - | `true` | - |
| `suspensionCount` | `Int` | - | `0` | - |
| `suspendedBy` | `String?` | - | - | - |
| `suspendedAt` | `DateTime?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | `now(` | - |
| `companies` | `Company[]` | - | - | - |
| `exchangeRates` | `ExchangeRate[]` | - | - | - |
| `baseCurrencyRates` | `ExchangeRate[]` | - | - | → "BaseCurrency" |
| `denominations` | `CurrencyDenomination[]` | - | - | - |
| `accounts` | `Account[]` | - | - | - |
| `bankAccounts` | `BankAccount[]` | - | - | - |
| `safes` | `Safe[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[code]`, `[status]`

### 2.3.18 جدول: `CurrencyDenomination` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `currencyId` | `String` | - | - | - |
| `code` | `String` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `value` | `Float` | - | - | - |
| `sortOrder` | `Int` | - | `0` | - |
| `isSuspended` | `Boolean` | - | `false` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `currency` | `Currency` | - | - | → fields: [currencyId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[currencyId]`

### 2.3.19 جدول: `ExchangeRate` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `currencyId` | `String` | - | - | - |
| `baseCurrencyId` | `String` | - | - | - |
| `rate` | `Float` | - | - | - |
| `buyRate` | `Float?` | - | - | - |
| `sellRate` | `Float?` | - | - | - |
| `minLimit` | `Float?` | - | - | - |
| `maxLimit` | `Float?` | - | - | - |
| `rateDate` | `DateTime` | - | `now(` | - |
| `effectiveDate` | `DateTime` | - | `now(` | - |
| `rateType` | `String` | - | `"spot"` | - |
| `status` | `String` | - | `"active"` | - |
| `notes` | `String?` | - | - | - |
| `userId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | `now(` | - |
| `currency` | `Currency` | - | - | → fields: [currencyId], references: [id] |
| `baseCurrency` | `Currency` | - | - | → "BaseCurrency", fields: [baseCurrencyId], references: [id] |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[currencyId, baseCurrencyId, rateDate, rateType]`
- **فهارس الأداء (Indexes):** `[baseCurrencyId]`, `[currencyId]`

### 2.3.20 جدول: `UnitOfMeasure` (7 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `category` | `String` | - | `"unit"` | - |
| `active` | `Boolean` | - | `true` | - |
| `products` | `Product[]` | - | - | - |

### 2.3.21 جدول: `Country` (6 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `dialCode` | `String?` | - | - | - |
| `partners` | `Partner[]` | - | - | - |

### 2.3.22 جدول: `TaxCode` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `rate` | `Float` | - | `15` | - |
| `taxType` | `String` | - | `"vat"` | - |
| `inputAccount` | `String?` | - | - | - |
| `outputAccount` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `products` | `Product[]` | - | - | - |
| `journalLines` | `JournalLine[]` | - | - | - |
| `accounts` | `Account[]` | - | - | - |

### 2.3.23 جدول: `PaymentTerm` (8 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `dueDays` | `Int` | - | `30` | - |
| `earlyPaymentDiscount` | `Float` | - | `0` | - |
| `active` | `Boolean` | - | `true` | - |
| `partners` | `Partner[]` | - | - | - |

### 2.3.24 جدول: `ReasonCode` (7 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String` | - | - | - |
| `category` | `String` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `inventoryAdjustments` | `InventoryAdjustment[]` | - | - | - |

### 2.3.25 جدول: `Partner` (50 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `companyId` | `String` | - | - | - |
| `isCustomer` | `Boolean` | - | `false` | - |
| `isSupplier` | `Boolean` | - | `false` | - |
| `isEmployee` | `Boolean` | - | `false` | - |
| `taxNumber` | `String?` | - | - | - |
| `vatNumber` | `String?` | - | - | - |
| `crNumber` | `String?` | - | - | - |
| `contactName` | `String?` | - | - | - |
| `phone` | `String?` | - | - | - |
| `email` | `String?` | - | - | - |
| `website` | `String?` | - | - | - |
| `address` | `String?` | - | - | - |
| `city` | `String?` | - | - | - |
| `countryId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `creditLimit` | `Float` | - | `0` | - |
| `openingBalance` | `Float` | - | `0` | - |
| `currentBalance` | `Float` | - | `0` | - |
| `supplierApproved` | `Boolean` | - | `false` | - |
| `receivableAccountId` | `String?` | - | - | - |
| `payableAccountId` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `country` | `Country?` | - | - | → fields: [countryId], references: [id] |
| `paymentTerm` | `PaymentTerm?` | - | - | → fields: [paymentTermId], references: [id] |
| `receivableAccount` | `Account?` | - | - | → "PartnerAR", fields: [receivableAccountId], references: [id] |
| `payableAccount` | `Account?` | - | - | → "PartnerAP", fields: [payableAccountId], references: [id] |
| `contacts` | `PartnerContact[]` | - | - | - |
| `addresses` | `PartnerAddress[]` | - | - | - |
| `bankAccounts` | `PartnerBankAccount[]` | - | - | - |
| `salesQuotations` | `SalesQuotation[]` | - | - | - |
| `salesOrders` | `SalesOrder[]` | - | - | - |
| `salesInvoices` | `SalesInvoice[]` | - | - | - |
| `salesPayments` | `SalesPayment[]` | - | - | - |
| `salesCreditNotes` | `SalesCreditNote[]` | - | - | - |
| `salesReturns` | `SalesReturn[]` | - | - | - |
| `purchaseOrders` | `PurchaseOrder[]` | - | - | - |
| `purchaseInvoices` | `PurchaseInvoice[]` | - | - | - |
| `purchasePayments` | `PurchasePayment[]` | - | - | - |
| `purchaseCreditNotes` | `PurchaseCreditNote[]` | - | - | - |
| `purchaseReturns` | `PurchaseReturn[]` | - | - | - |
| `goodsReceipts` | `GoodsReceipt[]` | - | - | - |
| `deliveries` | `Delivery[]` | - | - | - |
| `journalLines` | `JournalLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[countryId]`, `[paymentTermId]`, `[receivableAccountId]`, `[payableAccountId]`

### 2.3.26 جدول: `PartnerContact` (8 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `partnerId` | `String` | - | - | - |
| `name` | `String` | - | - | - |
| `position` | `String?` | - | - | - |
| `phone` | `String?` | - | - | - |
| `email` | `String?` | - | - | - |
| `isPrimary` | `Boolean` | - | `false` | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[partnerId]`

### 2.3.27 جدول: `PartnerAddress` (8 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `partnerId` | `String` | - | - | - |
| `type` | `String` | - | `"billing"` | - |
| `address` | `String` | - | - | - |
| `city` | `String?` | - | - | - |
| `country` | `String?` | - | - | - |
| `isDefault` | `Boolean` | - | `false` | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[partnerId]`

### 2.3.28 جدول: `PartnerBankAccount` (9 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `partnerId` | `String` | - | - | - |
| `bankName` | `String` | - | - | - |
| `accountName` | `String` | - | - | - |
| `iban` | `String?` | - | - | - |
| `accountNo` | `String?` | - | - | - |
| `swiftCode` | `String?` | - | - | - |
| `isDefault` | `Boolean` | - | `false` | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Cascade |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[partnerId]`

### 2.3.29 جدول: `Category` (12 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `type` | `String` | - | `"product"` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `parent` | `Category?` | - | - | → "CategoryTree", fields: [parentId], references: [id] |
| `children` | `Category[]` | - | - | → "CategoryTree" |
| `products` | `Product[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`

### 2.3.30 جدول: `Product` (54 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `sku` | `String` | 🌟 Unique | - | - |
| `barcode` | `String?` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `description` | `String?` | - | - | - |
| `companyId` | `String` | - | - | - |
| `categoryId` | `String?` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `type` | `String` | - | `"product"` | - |
| `tracking` | `String` | - | `"none"` | - |
| `costPrice` | `Float` | - | `0` | - |
| `salePrice` | `Float` | - | `0` | - |
| `costingMethod` | `String` | - | `"fifo"` | - |
| `taxCodeId` | `String?` | - | - | - |
| `minStock` | `Float` | - | `0` | - |
| `maxStock` | `Float` | - | `0` | - |
| `reorderPoint` | `Float` | - | `0` | - |
| `valuationAccountId` | `String?` | - | - | - |
| `cogsAccountId` | `String?` | - | - | - |
| `revenueAccountId` | `String?` | - | - | - |
| `image` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `category` | `Category?` | - | - | → fields: [categoryId], references: [id] |
| `uom` | `UnitOfMeasure?` | - | - | → fields: [uomId], references: [id] |
| `taxCode` | `TaxCode?` | - | - | → fields: [taxCodeId], references: [id] |
| `valuationAccount` | `Account?` | - | - | → "ProductValuation", fields: [valuationAccountId], references: [id] |
| `cogsAccount` | `Account?` | - | - | → "ProductCOGS", fields: [cogsAccountId], references: [id] |
| `revenueAccount` | `Account?` | - | - | → "ProductRevenue", fields: [revenueAccountId], references: [id] |
| `stockQuants` | `StockQuant[]` | - | - | - |
| `stockMoves` | `StockMove[]` | - | - | - |
| `stockValuationLayers` | `StockValuationLayer[]` | - | - | - |
| `stockLots` | `StockLot[]` | - | - | - |
| `salesOrderLines` | `SalesOrderLine[]` | - | - | - |
| `salesInvoiceLines` | `SalesInvoiceLine[]` | - | - | - |
| `purchaseOrderLines` | `PurchaseOrderLine[]` | - | - | - |
| `purchaseInvoiceLines` | `PurchaseInvoiceLine[]` | - | - | - |
| `bomComponents` | `BomComponent[]` | - | - | - |
| `boms` | `Bom[]` | - | - | - |
| `productionOrders` | `ProductionOrder[]` | - | - | - |
| `deliveryLines` | `DeliveryLine[]` | - | - | - |
| `goodsReceiptLines` | `GoodsReceiptLine[]` | - | - | - |
| `stockTransferLines` | `StockTransferLine[]` | - | - | - |
| `inventoryAdjustmentLines` | `InventoryAdjustmentLine[]` | - | - | - |
| `salesQuotationLines` | `SalesQuotationLine[]` | - | - | - |
| `purchaseRequestLines` | `PurchaseRequestLine[]` | - | - | - |
| `salesReturnLines` | `SalesReturnLine[]` | - | - | - |
| `purchaseReturnLines` | `PurchaseReturnLine[]` | - | - | - |
| `stockReservations` | `StockReservation[]` | - | - | - |
| `salesCreditNoteLines` | `SalesCreditNoteLine[]` | - | - | - |
| `purchaseCreditNoteLines` | `PurchaseCreditNoteLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[categoryId]`, `[uomId]`, `[taxCodeId]`, `[valuationAccountId]`, `[cogsAccountId]`, `[revenueAccountId]`

### 2.3.31 جدول: `Warehouse` (20 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `branchId` | `String` | - | - | - |
| `address` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `branch` | `Branch` | - | - | → fields: [branchId], references: [id], onDelete: Restrict |
| `locations` | `StockLocation[]` | - | - | - |
| `stockQuants` | `StockQuant[]` | - | - | - |
| `stockMovesSource` | `StockMove[]` | - | - | → "MoveSource" |
| `stockMovesDest` | `StockMove[]` | - | - | → "MoveDest" |
| `goodsReceipts` | `GoodsReceipt[]` | - | - | - |
| `deliveries` | `Delivery[]` | - | - | - |
| `stockTransfersFrom` | `StockTransfer[]` | - | - | → "TransferFromWH" |
| `stockTransfersTo` | `StockTransfer[]` | - | - | → "TransferToWH" |
| `inventoryAdjustments` | `InventoryAdjustment[]` | - | - | - |
| `stockReservations` | `StockReservation[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[branchId]`

### 2.3.32 جدول: `StockLocation` (15 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `warehouseId` | `String` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `type` | `String` | - | `"internal"` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id], onDelete: Cascade |
| `parent` | `StockLocation?` | - | - | → "LocationTree", fields: [parentId], references: [id] |
| `children` | `StockLocation[]` | - | - | → "LocationTree" |
| `sourceMoves` | `StockMove[]` | - | - | → "MoveSourceLoc" |
| `destMoves` | `StockMove[]` | - | - | → "MoveDestLoc" |
| `stockQuants` | `StockQuant[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[warehouseId]`, `[parentId]`

### 2.3.33 جدول: `StockQuant` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `productId` | `String` | - | - | - |
| `warehouseId` | `String` | - | - | - |
| `locationId` | `String?` | - | - | - |
| `lotId` | `String?` | - | - | - |
| `quantity` | `Float` | - | `0` | - |
| `reservedQty` | `Float` | - | `0` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id], onDelete: Cascade |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id], onDelete: Cascade |
| `location` | `StockLocation?` | - | - | → fields: [locationId], references: [id] |
| `lot` | `StockLot?` | - | - | → fields: [lotId], references: [id] |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[productId, warehouseId, locationId, lotId]`
- **فهارس الأداء (Indexes):** `[warehouseId]`, `[locationId]`, `[lotId]`

### 2.3.34 جدول: `StockLot` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `lotNumber` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `expiryDate` | `DateTime?` | - | - | - |
| `manufactureDate` | `DateTime?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `stockQuants` | `StockQuant[]` | - | - | - |
| `stockMoves` | `StockMove[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[productId]`

### 2.3.35 جدول: `StockMove` (25 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `documentType` | `String` | - | - | - |
| `documentId` | `String?` | - | - | - |
| `documentLineId` | `String?` | - | - | - |
| `productId` | `String` | - | - | - |
| `sourceWarehouseId` | `String?` | - | - | - |
| `sourceLocationId` | `String?` | - | - | - |
| `destWarehouseId` | `String?` | - | - | - |
| `destLocationId` | `String?` | - | - | - |
| `lotId` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `state` | `String` | - | `"draft"` | - |
| `valuationAmount` | `Float?` | - | - | - |
| `costPrice` | `Float?` | - | - | - |
| `postingDate` | `DateTime` | - | `now(` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `sourceWarehouse` | `Warehouse?` | - | - | → "MoveSource", fields: [sourceWarehouseId], references: [id] |
| `destWarehouse` | `Warehouse?` | - | - | → "MoveDest", fields: [destWarehouseId], references: [id] |
| `sourceLocation` | `StockLocation?` | - | - | → "MoveSourceLoc", fields: [sourceLocationId], references: [id] |
| `destLocation` | `StockLocation?` | - | - | → "MoveDestLoc", fields: [destLocationId], references: [id] |
| `lot` | `StockLot?` | - | - | → fields: [lotId], references: [id] |
| `valuationLayers` | `StockValuationLayer[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[productId, destWarehouseId]`, `[documentType, documentId]`, `[state, postingDate]`, `[companyId]`, `[documentId]`, `[documentLineId]`, `[sourceWarehouseId]`, `[sourceLocationId]`, `[destWarehouseId]`, `[destLocationId]`, `[lotId]`, `[uomId]`

### 2.3.36 جدول: `StockValuationLayer` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `productId` | `String` | - | - | - |
| `stockMoveId` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `totalValue` | `Float` | - | - | - |
| `remainingQty` | `Float` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id], onDelete: Cascade |
| `stockMove` | `StockMove?` | - | - | → fields: [stockMoveId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[productId]`, `[stockMoveId]`

### 2.3.37 جدول: `StockReservation` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `productId` | `String` | - | - | - |
| `warehouseId` | `String` | - | - | - |
| `documentType` | `String` | - | - | - |
| `documentId` | `String` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `state` | `String` | - | `"active"` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[productId]`, `[warehouseId]`, `[documentId]`, `[state]`

### 2.3.38 جدول: `Account` (47 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `shortName` | `String?` | - | - | - |
| `accountClass` | `String` | - | `"asset"` | - |
| `type` | `String` | - | - | - |
| `subtype` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `isPosting` | `Boolean` | - | `true` | - |
| `isSystem` | `Boolean` | - | `false` | - |
| `normalBalance` | `String` | - | `"debit"` | - |
| `currencyId` | `String?` | - | - | - |
| `allowReconciliation` | `Boolean` | - | `false` | - |
| `allowManualEntry` | `Boolean` | - | `true` | - |
| `taxBehavior` | `String` | - | `"none"` | - |
| `taxCodeId` | `String?` | - | - | - |
| `fsSection` | `String` | - | `"none"` | - |
| `reportCategory` | `String?` | - | - | - |
| `reportSubcategory` | `String?` | - | - | - |
| `reportTags` | `String?` | - | - | - |
| `requireCostCenter` | `Boolean` | - | `false` | - |
| `requireBranch` | `Boolean` | - | `false` | - |
| `requireProject` | `Boolean` | - | `false` | - |
| `level` | `Int` | - | `0` | - |
| `path` | `String?` | - | - | - |
| `balance` | `Float` | - | `0` | - |
| `active` | `Boolean` | - | `true` | - |
| `deactivatedAt` | `DateTime?` | - | - | - |
| `deactivatedBy` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `parent` | `Account?` | - | - | → "AccountTree", fields: [parentId], references: [id] |
| `children` | `Account[]` | - | - | → "AccountTree" |
| `currency` | `Currency?` | - | - | → fields: [currencyId], references: [id] |
| `taxCode` | `TaxCode?` | - | - | → fields: [taxCodeId], references: [id] |
| `roleMappings` | `AccountRoleMapping[]` | - | - | - |
| `journalLines` | `JournalLine[]` | - | - | - |
| `partnerReceivables` | `Partner[]` | - | - | → "PartnerAR" |
| `partnerPayables` | `Partner[]` | - | - | → "PartnerAP" |
| `productValuation` | `Product[]` | - | - | → "ProductValuation" |
| `productCOGS` | `Product[]` | - | - | → "ProductCOGS" |
| `productRevenue` | `Product[]` | - | - | → "ProductRevenue" |
| `banks` | `BankAccount[]` | - | - | - |
| `safes` | `Safe[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`, `[accountClass]`, `[type]`, `[isPosting, active]`, `[path]`, `[currencyId]`, `[taxCodeId]`

### 2.3.39 جدول: `AccountRoleMapping` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | `"*"` | - |
| `branchId` | `String` | - | `"*"` | - |
| `role` | `String` | - | - | - |
| `accountId` | `String` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdBy` | `String?` | - | - | - |
| `updatedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `account` | `Account` | - | - | → fields: [accountId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **قيود فريدة مركبة (Unique Constraints):** `[companyId, branchId, role]`
- **فهارس الأداء (Indexes):** `[role]`, `[accountId]`, `[branchId]`

### 2.3.40 جدول: `Journal` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `type` | `String` | - | `"general"` | - |
| `defaultDebitAccount` | `String?` | - | - | - |
| `defaultCreditAccount` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `journalEntries` | `JournalEntry[]` | - | - | - |

### 2.3.41 جدول: `FiscalYear` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `name` | `String` | - | - | - |
| `startDate` | `DateTime` | - | - | - |
| `endDate` | `DateTime` | - | - | - |
| `state` | `String` | - | `"open"` | - |
| `closedAt` | `DateTime?` | - | - | - |
| `closedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `periods` | `FiscalPeriod[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[state]`

### 2.3.42 جدول: `FiscalPeriod` (12 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `fiscalYearId` | `String` | - | - | - |
| `name` | `String` | - | - | - |
| `startDate` | `DateTime` | - | - | - |
| `endDate` | `DateTime` | - | - | - |
| `quarter` | `Int?` | - | - | - |
| `state` | `String` | - | `"open"` | - |
| `closedAt` | `DateTime?` | - | - | - |
| `closedBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `fiscalYear` | `FiscalYear` | - | - | → fields: [fiscalYearId], references: [id], onDelete: Cascade |
| `journalEntries` | `JournalEntry[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[fiscalYearId]`, `[state]`

### 2.3.43 جدول: `CostCenter` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `parent` | `CostCenter?` | - | - | → "CostCenterTree", fields: [parentId], references: [id] |
| `children` | `CostCenter[]` | - | - | → "CostCenterTree" |
| `journalLines` | `JournalLine[]` | - | - | - |
| `purchaseRequestLines` | `PurchaseRequestLine[]` | - | - | - |
| `orgStructures` | `OrgStructure[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`

### 2.3.44 جدول: `AnalyticAccount` (9 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `parent` | `AnalyticAccount?` | - | - | → "AnalyticTree", fields: [parentId], references: [id] |
| `children` | `AnalyticAccount[]` | - | - | → "AnalyticTree" |
| `journalLines` | `JournalLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`

### 2.3.45 جدول: `JournalEntry` (27 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `journalId` | `String?` | - | - | - |
| `postingDate` | `DateTime` | - | `now(` | - |
| `reference` | `String?` | - | - | - |
| `description` | `String?` | - | - | - |
| `refType` | `String?` | - | - | - |
| `refId` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `state` | `String` | - | `"draft"` | - |
| `totalDebit` | `Float` | - | `0` | - |
| `totalCredit` | `Float` | - | `0` | - |
| `fiscalPeriodId` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `approvedBy` | `String?` | - | - | - |
| `postedBy` | `String?` | - | - | - |
| `reversedById` | `String?` | 🌟 Unique | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `journal` | `Journal?` | - | - | → fields: [journalId], references: [id] |
| `creator` | `User?` | - | - | → "JournalEntryCreator", fields: [createdBy], references: [id] |
| `fiscalPeriod` | `FiscalPeriod?` | - | - | → fields: [fiscalPeriodId], references: [id] |
| `reversingEntry` | `JournalEntry?` | - | - | → "JournalReversal", fields: [reversedById], references: [id] |
| `reversedEntry` | `JournalEntry?` | - | - | → "JournalReversal" |
| `lines` | `JournalLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[journalId]`, `[refId]`, `[currencyId]`, `[state]`, `[fiscalPeriodId]`, `[reversedById]`

### 2.3.46 جدول: `JournalLine` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `entryId` | `String` | - | - | - |
| `accountId` | `String` | - | - | - |
| `partnerId` | `String?` | - | - | - |
| `debit` | `Float` | - | `0` | - |
| `credit` | `Float` | - | `0` | - |
| `description` | `String?` | - | - | - |
| `costCenterId` | `String?` | - | - | - |
| `analyticAccountId` | `String?` | - | - | - |
| `taxCodeId` | `String?` | - | - | - |
| `entry` | `JournalEntry` | - | - | → fields: [entryId], references: [id], onDelete: Cascade |
| `account` | `Account` | - | - | → fields: [accountId], references: [id] |
| `partner` | `Partner?` | - | - | → fields: [partnerId], references: [id] |
| `costCenter` | `CostCenter?` | - | - | → fields: [costCenterId], references: [id] |
| `analyticAccount` | `AnalyticAccount?` | - | - | → fields: [analyticAccountId], references: [id] |
| `taxCode` | `TaxCode?` | - | - | → fields: [taxCodeId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[accountId]`, `[entryId]`, `[partnerId]`, `[costCenterId]`, `[analyticAccountId]`, `[taxCodeId]`

### 2.3.47 جدول: `BankAccount` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `bankName` | `String` | - | - | - |
| `iban` | `String?` | - | - | - |
| `accountNo` | `String?` | - | - | - |
| `swiftCode` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `accountId` | `String?` | - | - | - |
| `balance` | `Float` | - | `0` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `account` | `Account?` | - | - | → fields: [accountId], references: [id] |
| `currency` | `Currency?` | - | - | → fields: [currencyId], references: [id] |
| `expenses` | `Expense[]` | - | - | - |
| `revenues` | `Revenue[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[currencyId]`, `[accountId]`

### 2.3.48 جدول: `Safe` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `accountId` | `String?` | - | - | - |
| `balance` | `Float` | - | `0` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `account` | `Account?` | - | - | → fields: [accountId], references: [id] |
| `currency` | `Currency?` | - | - | → fields: [currencyId], references: [id] |
| `expenses` | `Expense[]` | - | - | - |
| `revenues` | `Revenue[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[currencyId]`, `[accountId]`

### 2.3.49 جدول: `SalesQuotation` (22 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `quotationDate` | `DateTime` | - | `now(` | - |
| `validUntil` | `DateTime?` | - | - | - |
| `priceListId` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `discount` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `convertedSalesOrderId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `SalesQuotationLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[priceListId]`, `[currencyId]`, `[paymentTermId]`, `[status]`, `[convertedSalesOrderId]`

### 2.3.50 جدول: `SalesQuotationLine` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `quotationId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitPrice` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `quotation` | `SalesQuotation` | - | - | → fields: [quotationId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[quotationId]`, `[productId]`, `[uomId]`, `[taxCodeId]`

### 2.3.51 جدول: `SalesOrder` (31 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `quotationId` | `String?` | - | - | - |
| `orderDate` | `DateTime` | - | `now(` | - |
| `requiredDate` | `DateTime?` | - | - | - |
| `priceListId` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `warehouseId` | `String?` | - | - | - |
| `salespersonId` | `String?` | - | - | - |
| `deliveryStatus` | `String` | - | `"pending"` | - |
| `invoiceStatus` | `String` | - | `"pending"` | - |
| `paymentStatus` | `String` | - | `"unpaid"` | - |
| `creditStatus` | `String` | - | `"ok"` | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `discount` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `paid` | `Float` | - | `0` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `creator` | `User?` | - | - | → "SalesOrderCreator", fields: [createdBy], references: [id] |
| `lines` | `SalesOrderLine[]` | - | - | - |
| `deliveries` | `Delivery[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[quotationId]`, `[priceListId]`, `[currencyId]`, `[paymentTermId]`, `[warehouseId]`, `[salespersonId]`, `[status]`

### 2.3.52 جدول: `SalesOrderLine` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `orderId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `deliveredQty` | `Float` | - | `0` | - |
| `invoicedQty` | `Float` | - | `0` | - |
| `uomId` | `String?` | - | - | - |
| `unitPrice` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `order` | `SalesOrder` | - | - | → fields: [orderId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[orderId]`, `[productId]`, `[uomId]`, `[taxCodeId]`

### 2.3.53 جدول: `SalesInvoice` (24 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `salesOrderId` | `String?` | - | - | - |
| `invoiceDate` | `DateTime` | - | `now(` | - |
| `dueDate` | `DateTime?` | - | - | - |
| `journalId` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `discount` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `paid` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `SalesInvoiceLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[salesOrderId]`, `[journalId]`, `[currencyId]`, `[paymentTermId]`, `[status]`, `[journalEntryId]`

### 2.3.54 جدول: `SalesInvoiceLine` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `invoiceId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitPrice` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `invoice` | `SalesInvoice` | - | - | → fields: [invoiceId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[invoiceId]`, `[productId]`, `[uomId]`, `[taxCodeId]`

### 2.3.55 جدول: `SalesCreditNote` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `invoiceId` | `String?` | - | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `reason` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `SalesCreditNoteLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[invoiceId]`, `[status]`, `[journalEntryId]`

### 2.3.56 جدول: `SalesPayment` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `invoiceId` | `String?` | - | - | - |
| `amount` | `Float` | - | - | - |
| `paymentDate` | `DateTime` | - | `now(` | - |
| `method` | `String` | - | `"cash"` | - |
| `reference` | `String?` | - | - | - |
| `bankAccountId` | `String?` | - | - | - |
| `safeId` | `String?` | - | - | - |
| `journalEntryId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[invoiceId]`, `[bankAccountId]`, `[safeId]`, `[journalEntryId]`, `[status]`

### 2.3.57 جدول: `PurchaseRequest` (12 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `requesterId` | `String?` | - | - | - |
| `department` | `String?` | - | - | - |
| `requiredDate` | `DateTime?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `notes` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `lines` | `PurchaseRequestLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[requesterId]`, `[status]`

### 2.3.58 جدول: `PurchaseRequestLine` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `requestId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `requiredDate` | `DateTime?` | - | - | - |
| `costCenterId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `request` | `PurchaseRequest` | - | - | → fields: [requestId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `costCenter` | `CostCenter?` | - | - | → fields: [costCenterId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[requestId]`, `[productId]`, `[uomId]`, `[costCenterId]`

### 2.3.59 جدول: `PurchaseOrder` (29 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `orderDate` | `DateTime` | - | `now(` | - |
| `expectedDate` | `DateTime?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `warehouseId` | `String?` | - | - | - |
| `incoterms` | `String?` | - | - | - |
| `receiptStatus` | `String` | - | `"pending"` | - |
| `invoiceStatus` | `String` | - | `"pending"` | - |
| `paymentStatus` | `String` | - | `"unpaid"` | - |
| `budgetStatus` | `String` | - | `"ok"` | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `discount` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `paid` | `Float` | - | `0` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `creator` | `User?` | - | - | → "PurchaseOrderCreator", fields: [createdBy], references: [id] |
| `lines` | `PurchaseOrderLine[]` | - | - | - |
| `goodsReceipts` | `GoodsReceipt[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[currencyId]`, `[paymentTermId]`, `[warehouseId]`, `[status]`

### 2.3.60 جدول: `PurchaseOrderLine` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `orderId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `receivedQty` | `Float` | - | `0` | - |
| `invoicedQty` | `Float` | - | `0` | - |
| `uomId` | `String?` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `order` | `PurchaseOrder` | - | - | → fields: [orderId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[orderId]`, `[productId]`, `[uomId]`, `[taxCodeId]`

### 2.3.61 جدول: `GoodsReceipt` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `purchaseOrderId` | `String?` | - | - | - |
| `partnerId` | `String` | - | - | - |
| `warehouseId` | `String` | - | - | - |
| `receiptDate` | `DateTime` | - | `now(` | - |
| `status` | `String` | - | `"draft"` | - |
| `notes` | `String?` | - | - | - |
| `journalEntryId` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id] |
| `purchaseOrder` | `PurchaseOrder?` | - | - | → fields: [purchaseOrderId], references: [id] |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id] |
| `lines` | `GoodsReceiptLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[purchaseOrderId]`, `[partnerId]`, `[warehouseId]`, `[status]`, `[journalEntryId]`

### 2.3.62 جدول: `GoodsReceiptLine` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `receiptId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `purchaseOrderLineId` | `String?` | - | - | - |
| `orderedQty` | `Float` | - | - | - |
| `receivedQty` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `lotNumber` | `String?` | - | - | - |
| `expiryDate` | `DateTime?` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `total` | `Float` | - | - | - |
| `receipt` | `GoodsReceipt` | - | - | → fields: [receiptId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[receiptId]`, `[productId]`, `[purchaseOrderLineId]`, `[uomId]`

### 2.3.63 جدول: `PurchaseInvoice` (25 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `purchaseOrderId` | `String?` | - | - | - |
| `billDate` | `DateTime` | - | `now(` | - |
| `accountingDate` | `DateTime` | - | `now(` | - |
| `dueDate` | `DateTime?` | - | - | - |
| `vendorBillNo` | `String?` | - | - | - |
| `journalId` | `String?` | - | - | - |
| `currencyId` | `String?` | - | - | - |
| `paymentTermId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `paid` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `PurchaseInvoiceLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[purchaseOrderId]`, `[journalId]`, `[currencyId]`, `[paymentTermId]`, `[status]`, `[journalEntryId]`

### 2.3.64 جدول: `PurchaseInvoiceLine` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `invoiceId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `invoice` | `PurchaseInvoice` | - | - | → fields: [invoiceId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[invoiceId]`, `[productId]`, `[uomId]`, `[taxCodeId]`

### 2.3.65 جدول: `PurchaseCreditNote` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `invoiceId` | `String?` | - | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `reason` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `PurchaseCreditNoteLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[invoiceId]`, `[status]`, `[journalEntryId]`

### 2.3.66 جدول: `PurchasePayment` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `invoiceId` | `String?` | - | - | - |
| `amount` | `Float` | - | - | - |
| `paymentDate` | `DateTime` | - | `now(` | - |
| `method` | `String` | - | `"cash"` | - |
| `reference` | `String?` | - | - | - |
| `bankAccountId` | `String?` | - | - | - |
| `safeId` | `String?` | - | - | - |
| `journalEntryId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[invoiceId]`, `[bankAccountId]`, `[safeId]`, `[journalEntryId]`, `[status]`

### 2.3.67 جدول: `Delivery` (18 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `salesOrderId` | `String?` | - | - | - |
| `partnerId` | `String?` | - | - | - |
| `warehouseId` | `String` | - | - | - |
| `deliveryDate` | `DateTime` | - | `now(` | - |
| `status` | `String` | - | `"draft"` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id] |
| `salesOrder` | `SalesOrder?` | - | - | → fields: [salesOrderId], references: [id] |
| `partner` | `Partner?` | - | - | → fields: [partnerId], references: [id] |
| `lines` | `DeliveryLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[salesOrderId]`, `[partnerId]`, `[warehouseId]`, `[status]`, `[journalEntryId]`

### 2.3.68 جدول: `DeliveryLine` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `deliveryId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `salesOrderLineId` | `String?` | - | - | - |
| `orderedQty` | `Float` | - | - | - |
| `deliveredQty` | `Float` | - | - | - |
| `lotId` | `String?` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `delivery` | `Delivery` | - | - | → fields: [deliveryId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[deliveryId]`, `[productId]`, `[salesOrderLineId]`, `[lotId]`, `[uomId]`

### 2.3.69 جدول: `StockTransfer` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `fromWarehouseId` | `String` | - | - | - |
| `toWarehouseId` | `String` | - | - | - |
| `transferDate` | `DateTime` | - | `now(` | - |
| `status` | `String` | - | `"draft"` | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `fromWarehouse` | `Warehouse` | - | - | → "TransferFromWH", fields: [fromWarehouseId], references: [id] |
| `toWarehouse` | `Warehouse` | - | - | → "TransferToWH", fields: [toWarehouseId], references: [id] |
| `lines` | `StockTransferLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[fromWarehouseId]`, `[toWarehouseId]`, `[status]`

### 2.3.70 جدول: `StockTransferLine` (9 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `transferId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `doneQty` | `Float` | - | `0` | - |
| `uomId` | `String?` | - | - | - |
| `lotId` | `String?` | - | - | - |
| `transfer` | `StockTransfer` | - | - | → fields: [transferId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[transferId]`, `[productId]`, `[uomId]`, `[lotId]`

### 2.3.71 جدول: `InventoryAdjustment` (16 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `warehouseId` | `String` | - | - | - |
| `adjustmentDate` | `DateTime` | - | `now(` | - |
| `reason` | `String?` | - | - | - |
| `reasonCodeId` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `warehouse` | `Warehouse` | - | - | → fields: [warehouseId], references: [id] |
| `reasonCode` | `ReasonCode?` | - | - | → fields: [reasonCodeId], references: [id] |
| `lines` | `InventoryAdjustmentLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[warehouseId]`, `[reasonCodeId]`, `[status]`, `[journalEntryId]`

### 2.3.72 جدول: `InventoryAdjustmentLine` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `adjustmentId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `systemQty` | `Float` | - | - | - |
| `countedQty` | `Float` | - | - | - |
| `variance` | `Float` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `lotId` | `String?` | - | - | - |
| `adjustment` | `InventoryAdjustment` | - | - | → fields: [adjustmentId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[adjustmentId]`, `[productId]`, `[lotId]`

### 2.3.73 جدول: `Bom` (15 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `productId` | `String` | - | - | - |
| `quantity` | `Float` | - | `1` | - |
| `version` | `Int` | - | `1` | - |
| `status` | `String` | - | `"draft"` | - |
| `active` | `Boolean` | - | `true` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `components` | `BomComponent[]` | - | - | - |
| `productionOrders` | `ProductionOrder[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[productId]`, `[status]`

### 2.3.74 جدول: `BomComponent` (8 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `bomId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `scrapPercent` | `Float` | - | `0` | - |
| `bom` | `Bom` | - | - | → fields: [bomId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[bomId]`, `[productId]`, `[uomId]`

### 2.3.75 جدول: `WorkCenter` (7 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `capacityPerHour` | `Float` | - | `0` | - |
| `costPerHour` | `Float` | - | `0` | - |
| `active` | `Boolean` | - | `true` | - |

### 2.3.76 جدول: `ProductionOrder` (23 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `bomId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `producedQty` | `Float` | - | `0` | - |
| `scrapQty` | `Float` | - | `0` | - |
| `plannedStart` | `DateTime?` | - | - | - |
| `plannedEnd` | `DateTime?` | - | - | - |
| `actualStart` | `DateTime?` | - | - | - |
| `actualEnd` | `DateTime?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `totalCost` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `bom` | `Bom` | - | - | → fields: [bomId], references: [id] |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |
| `creator` | `User?` | - | - | → "ProductionOrderCreator", fields: [createdBy], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[bomId]`, `[productId]`, `[status]`, `[journalEntryId]`

### 2.3.77 جدول: `Employee` (33 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `employeeNo` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `departmentId` | `String?` | - | - | - |
| `orgStructureId` | `String?` | - | - | - |
| `jobPositionId` | `String?` | - | - | - |
| `partnerId` | `String?` | - | - | - |
| `hireDate` | `DateTime?` | - | - | - |
| `terminationDate` | `DateTime?` | - | - | - |
| `status` | `String` | - | `"active"` | - |
| `nationalId` | `String?` | - | - | - |
| `passportNo` | `String?` | - | - | - |
| `phone` | `String?` | - | - | - |
| `email` | `String?` | - | - | - |
| `address` | `String?` | - | - | - |
| `birthDate` | `DateTime?` | - | - | - |
| `gender` | `String?` | - | - | - |
| `nationality` | `String?` | - | - | - |
| `userId` | `String?` | 🌟 Unique | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `user` | `User?` | - | - | → fields: [userId], references: [id] |
| `department` | `Department?` | - | - | → fields: [departmentId], references: [id] |
| `orgStructure` | `OrgStructure?` | - | - | → "OrgUnitEmployees", fields: [orgStructureId], references: [id] |
| `managedOrgUnits` | `OrgStructure[]` | - | - | → "OrgUnitManager" |
| `jobPosition` | `JobPosition?` | - | - | → fields: [jobPositionId], references: [id] |
| `contracts` | `Contract[]` | - | - | - |
| `attendance` | `Attendance[]` | - | - | - |
| `leaveRequests` | `LeaveRequest[]` | - | - | - |
| `payslips` | `Payslip[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[departmentId]`, `[orgStructureId]`, `[jobPositionId]`, `[partnerId]`, `[status]`, `[nationalId]`

### 2.3.78 جدول: `Department` (10 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `parentId` | `String?` | - | - | - |
| `managerId` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `parent` | `Department?` | - | - | → "DeptTree", fields: [parentId], references: [id] |
| `children` | `Department[]` | - | - | → "DeptTree" |
| `employees` | `Employee[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[parentId]`, `[managerId]`

### 2.3.79 جدول: `JobPosition` (6 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `code` | `String` | 🌟 Unique | - | - |
| `nameAr` | `String` | - | - | - |
| `nameEn` | `String?` | - | - | - |
| `active` | `Boolean` | - | `true` | - |
| `employees` | `Employee[]` | - | - | - |

### 2.3.80 جدول: `Contract` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `employeeId` | `String` | - | - | - |
| `startDate` | `DateTime` | - | - | - |
| `endDate` | `DateTime?` | - | - | - |
| `baseSalary` | `Float` | - | `0` | - |
| `allowances` | `Float` | - | `0` | - |
| `currencyId` | `String?` | - | - | - |
| `status` | `String` | - | `"active"` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `employee` | `Employee` | - | - | → fields: [employeeId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[employeeId]`, `[currencyId]`, `[status]`

### 2.3.81 جدول: `Attendance` (9 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `employeeId` | `String` | - | - | - |
| `date` | `DateTime` | - | - | - |
| `checkIn` | `DateTime?` | - | - | - |
| `checkOut` | `DateTime?` | - | - | - |
| `status` | `String` | - | `"present"` | - |
| `notes` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `employee` | `Employee` | - | - | → fields: [employeeId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[employeeId]`, `[status]`

### 2.3.82 جدول: `LeaveRequest` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `employeeId` | `String` | - | - | - |
| `leaveType` | `String` | - | `"annual"` | - |
| `startDate` | `DateTime` | - | - | - |
| `endDate` | `DateTime` | - | - | - |
| `days` | `Float` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `reason` | `String?` | - | - | - |
| `approverId` | `String?` | - | - | - |
| `approvedAt` | `DateTime?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `employee` | `Employee` | - | - | → fields: [employeeId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[employeeId]`, `[status]`, `[approverId]`

### 2.3.83 جدول: `PayrollRun` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `period` | `String` | - | - | - |
| `startDate` | `DateTime` | - | - | - |
| `endDate` | `DateTime` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `totalGross` | `Float` | - | `0` | - |
| `totalDeductions` | `Float` | - | `0` | - |
| `totalNet` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `payslips` | `Payslip[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[status]`, `[journalEntryId]`

### 2.3.84 جدول: `Payslip` (13 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `payrollRunId` | `String` | - | - | - |
| `employeeId` | `String` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `grossSalary` | `Float` | - | `0` | - |
| `allowances` | `Float` | - | `0` | - |
| `deductions` | `Float` | - | `0` | - |
| `netSalary` | `Float` | - | `0` | - |
| `status` | `String` | - | `"draft"` | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `payrollRun` | `PayrollRun` | - | - | → fields: [payrollRunId], references: [id], onDelete: Cascade |
| `employee` | `Employee` | - | - | → fields: [employeeId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[payrollRunId]`, `[employeeId]`, `[status]`

### 2.3.85 جدول: `SalesReturn` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `originalInvoiceId` | `String?` | - | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `reason` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `SalesReturnLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[originalInvoiceId]`, `[status]`, `[journalEntryId]`

### 2.3.86 جدول: `SalesReturnLine` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `returnId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitPrice` | `Float` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `return` | `SalesReturn` | - | - | → fields: [returnId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[returnId]`, `[productId]`, `[uomId]`

### 2.3.87 جدول: `PurchaseReturn` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `partnerId` | `String` | - | - | - |
| `originalInvoiceId` | `String?` | - | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `reason` | `String?` | - | - | - |
| `status` | `String` | - | `"draft"` | - |
| `subtotal` | `Float` | - | `0` | - |
| `taxTotal` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `journalEntryId` | `String?` | - | - | - |
| `notes` | `String?` | - | - | - |
| `createdBy` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `partner` | `Partner` | - | - | → fields: [partnerId], references: [id], onDelete: Restrict |
| `lines` | `PurchaseReturnLine[]` | - | - | - |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[partnerId]`, `[originalInvoiceId]`, `[status]`, `[journalEntryId]`

### 2.3.88 جدول: `PurchaseReturnLine` (11 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `returnId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `return` | `PurchaseReturn` | - | - | → fields: [returnId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[returnId]`, `[productId]`, `[uomId]`

### 2.3.89 جدول: `Activity` (7 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `name` | `String` | - | - | - |
| `code` | `String?` | - | - | - |
| `branchId` | `String` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `branch` | `Branch` | - | - | → fields: [branchId], references: [id], onDelete: Restrict |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[branchId]`

### 2.3.90 جدول: `Expense` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `amount` | `Float` | - | - | - |
| `payee` | `String?` | - | - | - |
| `category` | `String` | - | - | - |
| `reference` | `String?` | - | - | - |
| `note` | `String?` | - | - | - |
| `status` | `String` | - | `"posted"` | - |
| `bankAccountId` | `String?` | - | - | - |
| `safeId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `branch` | `Branch?` | - | - | → fields: [branchId], references: [id] |
| `bankAccount` | `BankAccount?` | - | - | → fields: [bankAccountId], references: [id] |
| `safe` | `Safe?` | - | - | → fields: [safeId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[status]`, `[bankAccountId]`, `[safeId]`

### 2.3.91 جدول: `Revenue` (19 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `companyId` | `String` | - | - | - |
| `branchId` | `String?` | - | - | - |
| `code` | `String` | 🌟 Unique | - | - |
| `date` | `DateTime` | - | `now(` | - |
| `amount` | `Float` | - | - | - |
| `payee` | `String?` | - | - | - |
| `category` | `String` | - | - | - |
| `reference` | `String?` | - | - | - |
| `note` | `String?` | - | - | - |
| `status` | `String` | - | `"posted"` | - |
| `bankAccountId` | `String?` | - | - | - |
| `safeId` | `String?` | - | - | - |
| `createdAt` | `DateTime` | - | `now(` | - |
| `updatedAt` | `DateTime` | ⏱️ updatedAt | - | - |
| `company` | `Company` | - | - | → fields: [companyId], references: [id], onDelete: Restrict |
| `branch` | `Branch?` | - | - | → fields: [branchId], references: [id] |
| `bankAccount` | `BankAccount?` | - | - | → fields: [bankAccountId], references: [id] |
| `safe` | `Safe?` | - | - | → fields: [safeId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[companyId]`, `[branchId]`, `[status]`, `[bankAccountId]`, `[safeId]`

### 2.3.92 جدول: `SalesCreditNoteLine` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `creditNoteId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitPrice` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `creditNote` | `SalesCreditNote` | - | - | → fields: [creditNoteId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[creditNoteId]`, `[productId]`

### 2.3.93 جدول: `PurchaseCreditNoteLine` (14 حقلاً)
| الحقل (Field) | النوع (Type) | المفتاح / القيد (Constraints) | القيمة الافتراضية (Default) | العلاقات (Relations) |
|---------------|--------------|-------------------------------|-----------------------------|-----------------------|
| `id` | `String` | 🔑 **PK** | `cuid(` | - |
| `creditNoteId` | `String` | - | - | - |
| `productId` | `String` | - | - | - |
| `description` | `String?` | - | - | - |
| `quantity` | `Float` | - | - | - |
| `uomId` | `String?` | - | - | - |
| `unitCost` | `Float` | - | - | - |
| `discountPercent` | `Float` | - | `0` | - |
| `discountAmount` | `Float` | - | `0` | - |
| `taxCodeId` | `String?` | - | - | - |
| `taxRate` | `Float` | - | `0` | - |
| `total` | `Float` | - | `0` | - |
| `creditNote` | `PurchaseCreditNote` | - | - | → fields: [creditNoteId], references: [id], onDelete: Cascade |
| `product` | `Product` | - | - | → fields: [productId], references: [id] |

**الفهارس والقيود الإضافية:**
- **فهارس الأداء (Indexes):** `[creditNoteId]`, `[productId]`

---

## 2.4 البيانات الأولية (Seed Data)
استناداً إلى ملفات البذر المعتمدة (`scripts/seed.ts` و `scripts/seed-postgres.mjs`)، يحتوي النظام عند التثبيت على بيانات تشغيلية قياسية:
1. **العملات الرسمية (Currencies):**
   - ريال سعودي (`SAR`) - العملة الأساسية للمؤسسة.
   - ريال يمني (`YER`)، دولار أمريكي (`USD`)، يورو (`EUR`)، درهم إماراتي (`AED`)، جنيه مصري (`EGP`).
2. **البلدان (Countries):**
   - المملكة العربية السعودية (`SA` / +966)، الإمارات (`AE` / +971)، مصر (`EG` / +20)، اليمن (`YE` / +967).
3. **وحدات القياس (UOMs):**
   - قطعة (`PCE`)، كيلوجرام (`KG`)، جرام (`GM`)، لتر (`LTR`)، صندوق (`BOX`)، عبوة (`PACK`)، متر (`M`)، ساعة (`HR`).
4. **الضرائب والرسوم (Tax Codes):**
   - ضريبة القيمة المضافة 15% (`VAT15`)، ضريبة صفرية (`VAT0`)، معفاة (`EXEMPT`).
5. **شروط الدفع (Payment Terms):**
   - آجل 30 يوم (`NET30`)، آجل 60 يوم (`NET60`)، دفع عند الاستلام (`COD`)، دفع مسبق (`PREPAID`).
6. **دليل الحسابات النموذجي (Chart of Accounts):**
   - 34 حساباً قياسياً مؤسسياً يغطي الأصول، الخصوم، حقوق الملكية، الإيرادات، وتكلفة المبيعات والمصروفات، متوافقة مع معايير IFRS.
7. **دفاتر اليومية (Journals):**
   - يومية المبيعات (`SJ`)، يومية المشتريات (`PJ`)، يومية النقدية (`CJ`)، يومية البنك (`BJ`)، يومية عامة (`GJ`)، افتتاحية (`OJ`)، إقفال (`CLJ`).
8. **المستخدمون والأدوار الافتراضية:**
   - المستخدم الإداري: `admin` (System Administrator) بكلمة مرور مشفرة.
   - المستخدم التشغيلي: `omararif` (مدير النظام) لاختبارات التحقق.
   - 16 دوراً وظيفياً قياسياً (ADMIN, CEO, FIN_MGR, ACCOUNTANT, CHIEF_ACC, CASHIER, SALES_MGR, SALES_REP, PUR_MGR, BUYER, WH_MGR, WH_KEEPER, PROD_MGR, HR_MGR, AUDITOR, VIEWER).

---

# 3️⃣ تحليل الواجهات وتجربة المستخدم (UI/UX Analysis)

## 3.1 هيكلية الشاشات والملاحة وتعدد الوحدات
يعتمد نظام أورمنال على نمط الواجهة الموحدة الذكية (**Unified AppShell Architecture**):
- **صفحة تسجيل الدخول (`/login`):** واجهة مستقلة مدعومة بتصميم داكن فاخر، تحقق من الجلسة، وتوجيه آلي.
- **الصفحة الرئيسية المستمرة (`/`):** تحتوي على حاوية `<AppShell />` التي تدمج:
  - **الشريط العلوي (`Topbar`):** يتيح التبديل بين الفروع المصرح بها، عرض الشركة النشطة، جرس الإشعارات الآنية، والملف الشخصي وتغيير الثيم (Dark/Light).
  - **القائمة الجانبية (`SidebarNav`):** قوائم منسدلة مصنفة حسب الأقسام (البيانات الأساسية، المبيعات، المشتريات، المخزون، المالية، التصنيع، الموارد البشرية، التقارير، الإعدادات).
  - **مخزن الملاحة (`nav-store`):** حفظ الموديول النشط محلياً في المتصفح (`localStorage`) لمنع فقدان السياق عند تحديث الصفحة.
  - **سجل الموديولات الكسول (`module-registry.tsx`):** تحميل المكون المطلوب ديناميكياً (`Lazy Loading`) مع عرض مؤشر التحميل المتناسق (`Skeleton`).

---

## 3.2 الفهرس التفصيلي لجميع الواجهات والوحدات (68 موديول)

| # | الموديول (Module Key) | اسم الشاشة / العنوان | المسار البرمجي للمكون | عدد الأزرار | النماذج / الحقول |
|---|------------------------|----------------------|-----------------------|-------------|-------------------|
| 1 | `activities` | **activities** | `src/components/modules/activities-module.tsx` | 4 | يوجد (3 حقل) |
| 2 | `analytic-accounts` | **analytic-accounts** | `src/components/modules/analytic-accounts-module.tsx` | 4 | يوجد (4 حقل) |
| 3 | `attendance` | **attendance** | `src/components/modules/attendance-module.tsx` | 4 | يوجد (6 حقل) |
| 4 | `audit-logs` | **audit-logs** | `src/components/modules/audit-logs-module.tsx` | 4 | يوجد (2 حقل) |
| 5 | `bank-accounts` | **bank-accounts** | `src/components/modules/bank-accounts-module.tsx` | 4 | يوجد (6 حقل) |
| 6 | `boms` | **أورمنال** | `src/components/modules/boms-module.tsx` | 8 | يوجد (8 حقل) |
| 7 | `branches` | **branches** | `src/components/modules/branches-module.tsx` | 5 | يوجد (9 حقل) |
| 8 | `categories` | **أورمنال للأنظمة المحاسبية** | `src/components/modules/categories-module.tsx` | 7 | يوجد (6 حقل) |
| 9 | `chart-of-accounts` | **chart-of-accounts** | `src/components/modules/chart-of-accounts-module.tsx` | 14 | يوجد (4 حقل) |
| 10 | `clients` | **أورمنال للأنظمة المحاسبية** | `src/components/modules/clients-module.tsx` | 7 | يوجد (10 حقل) |
| 11 | `cost-centers` | **cost-centers** | `src/components/modules/cost-centers-module.tsx` | 4 | يوجد (4 حقل) |
| 12 | `currencies` | **currencies** | `src/components/modules/currencies-module.tsx` | 4 | عرض بيانات/جداول |
| 13 | `customers` | **customers** | `src/components/modules/customers-module.tsx` | 8 | يوجد (11 حقل) |
| 14 | `dashboard` | **dashboard** | `src/components/modules/dashboard-module.tsx` | 0 | عرض بيانات/جداول |
| 15 | `deliveries` | **$** | `src/components/modules/deliveries-module.tsx` | 9 | يوجد (6 حقل) |
| 16 | `departments` | **departments** | `src/components/modules/departments-module.tsx` | 4 | يوجد (5 حقل) |
| 17 | `document-templates` | **فاتورة ضريبية** | `src/components/modules/document-templates-module.tsx` | 4 | يوجد (3 حقل) |
| 18 | `employees` | **أورمنال** | `src/components/modules/employees-module.tsx` | 13 | يوجد (12 حقل) |
| 19 | `expenses` | **أورمنال — نظام إدارة موارد المؤسسات ERP** | `src/components/modules/expenses-module.tsx` | 4 | يوجد (8 حقل) |
| 20 | `finance-requisitions` | **أورمنال — نظام إدارة موارد المؤسسات ERP** | `src/components/modules/finance-requisitions-module.tsx` | 6 | يوجد (5 حقل) |
| 21 | `finance-transfers` | **أورمنال — نظام إدارة موارد المؤسسات ERP** | `src/components/modules/finance-transfers-module.tsx` | 3 | يوجد (4 حقل) |
| 22 | `fiscal-periods` | **fiscal-periods** | `src/components/modules/fiscal-periods-module.tsx` | 13 | يوجد (12 حقل) |
| 23 | `fixed-assets` | **تصنيفات ومجموعات الأصول الثابتة** | `src/components/modules/fixed-assets-module.tsx` | 9 | يوجد (8 حقل) |
| 24 | `general-defs` | **general-defs** | `src/components/modules/general-defs-module.tsx` | 30 | يوجد (7 حقل) |
| 25 | `general-vars` | **general-vars** | `src/components/modules/general-vars-module.tsx` | 2 | يوجد (5 حقل) |
| 26 | `goods-receipts` | **$** | `src/components/modules/goods-receipts-module.tsx` | 13 | يوجد (15 حقل) |
| 27 | `inventory-adjustments` | **$** | `src/components/modules/inventory-adjustments-module.tsx` | 8 | يوجد (3 حقل) |
| 28 | `inventory-incoming` | **$** | `src/components/modules/inventory-incoming-module.tsx` | 8 | يوجد (9 حقل) |
| 29 | `inventory-outgoing` | **$** | `src/components/modules/inventory-outgoing-module.tsx` | 8 | يوجد (6 حقل) |
| 30 | `inventory-requisitions` | **$** | `src/components/modules/inventory-requisitions-module.tsx` | 11 | يوجد (6 حقل) |
| 31 | `inventory-transfers` | **$** | `src/components/modules/inventory-transfers-module.tsx` | 10 | يوجد (7 حقل) |
| 32 | `journal-entries` | **أورمنال** | `src/components/modules/journal-entries-module.tsx` | 10 | يوجد (7 حقل) |
| 33 | `leave-requests` | **leave-requests** | `src/components/modules/leave-requests-module.tsx` | 6 | يوجد (5 حقل) |
| 34 | `notifications` | **notifications** | `src/components/modules/notifications-module.tsx` | 4 | يوجد (2 حقل) |
| 35 | `org-structure` | **$** | `src/components/modules/org-structure-module.tsx` | 28 | يوجد (12 حقل) |
| 36 | `payroll-runs` | **أورمنال** | `src/components/modules/payroll-runs-module.tsx` | 8 | يوجد (1 حقل) |
| 37 | `pos` | **$** | `src/components/modules/pos-module.tsx` | 8 | يوجد (4 حقل) |
| 38 | `production-orders` | **أورمنال** | `src/components/modules/production-orders-module.tsx` | 7 | يوجد (4 حقل) |
| 39 | `products` | **products** | `src/components/modules/products-module.tsx` | 5 | يوجد (11 حقل) |
| 40 | `profile` | **profile** | `src/components/modules/profile-module.tsx` | 8 | يوجد (12 حقل) |
| 41 | `purchase-credit-notes` | **$** | `src/components/modules/purchase-credit-notes-module.tsx` | 5 | يوجد (6 حقل) |
| 42 | `purchase-invoices` | **$** | `src/components/modules/purchase-invoices-module.tsx` | 11 | يوجد (15 حقل) |
| 43 | `purchase-orders` | **$** | `src/components/modules/purchase-orders-module.tsx` | 11 | يوجد (15 حقل) |
| 44 | `purchase-payments` | **$** | `src/components/modules/purchase-payments-module.tsx` | 14 | يوجد (9 حقل) |
| 45 | `purchase-requests` | **$** | `src/components/modules/purchase-requests-module.tsx` | 16 | يوجد (12 حقل) |
| 46 | `purchase-returns` | **$** | `src/components/modules/purchase-returns-module.tsx` | 17 | يوجد (9 حقل) |
| 47 | `receipt-vouchers` | **receipt-vouchers** | `src/components/modules/receipt-vouchers-module.tsx` | 0 | عرض بيانات/جداول |
| 48 | `reports` | **أورمنال ERP** | `src/components/modules/reports-module.tsx` | 4 | عرض بيانات/جداول |
| 49 | `revenues` | **أورمنال — نظام إدارة موارد المؤسسات ERP** | `src/components/modules/revenues-module.tsx` | 4 | يوجد (8 حقل) |
| 50 | `roles` | **roles** | `src/components/modules/roles-module.tsx` | 14 | يوجد (9 حقل) |
| 51 | `safes` | **safes** | `src/components/modules/safes-module.tsx` | 4 | يوجد (4 حقل) |
| 52 | `sales-credit-notes` | **$** | `src/components/modules/sales-credit-notes-module.tsx` | 6 | يوجد (7 حقل) |
| 53 | `sales-invoices` | **$** | `src/components/modules/sales-invoices-module.tsx` | 9 | يوجد (13 حقل) |
| 54 | `sales-orders` | **$** | `src/components/modules/sales-orders-module.tsx` | 16 | يوجد (14 حقل) |
| 55 | `sales-payments` | **$** | `src/components/modules/sales-payments-module.tsx` | 19 | يوجد (10 حقل) |
| 56 | `sales-quotations` | **$** | `src/components/modules/sales-quotations-module.tsx` | 12 | يوجد (14 حقل) |
| 57 | `sales-returns` | **$** | `src/components/modules/sales-returns-module.tsx` | 15 | يوجد (13 حقل) |
| 58 | `settings` | **نتائج البحث** | `src/components/modules/settings-module.tsx` | 3 | يوجد (6 حقل) |
| 59 | `stock-locations` | **stock-locations** | `src/components/modules/stock-locations-module.tsx` | 4 | يوجد (5 حقل) |
| 60 | `stock-moves` | **stock-moves** | `src/components/modules/stock-moves-module.tsx` | 1 | يوجد (1 حقل) |
| 61 | `stock-on-hand` | **$** | `src/components/modules/stock-on-hand-module.tsx` | 4 | يوجد (4 حقل) |
| 62 | `stock-takes` | **$** | `src/components/modules/stock-takes-module.tsx` | 15 | يوجد (10 حقل) |
| 63 | `stock-transfers` | **stock-transfers** | `src/components/modules/stock-transfers-module.tsx` | 0 | عرض بيانات/جداول |
| 64 | `suppliers` | **suppliers** | `src/components/modules/suppliers-module.tsx` | 8 | يوجد (11 حقل) |
| 65 | `system-config` | **system-config** | `src/components/modules/system-config-module.tsx` | 4 | يوجد (6 حقل) |
| 66 | `users` | **users** | `src/components/modules/users-module.tsx` | 10 | يوجد (11 حقل) |
| 67 | `warehouses` | **warehouses** | `src/components/modules/warehouses-module.tsx` | 5 | يوجد (6 حقل) |
| 68 | `work-centers` | **work-centers** | `src/components/modules/work-centers-module.tsx` | 4 | يوجد (6 حقل) |

---

## 3.3 النماذج، الحقول، والتحقق (Forms & Validation)
تعتمد شاشات النظام على نمط التحقق الصارم ثنائي المستوى (Client & Server Validation):
1. **في الواجهات الأمامية:**
   - استخدام مكونات Shadcn UI (`Input`, `Select`, `Textarea`, `Switch`, `Checkbox`, `DatePicker`).
   - التحقق الفوري من الحقول الإجبارية وصيغ البريد والأرقام الضريبية والمبالغ المالية (منع المبالغ السالبة).
2. **في الواجهات الخلفية (Server-Side Zod & Prisma):**
   - التحقق الصارم من صحة البيانات قبل تنفيذ أي كتابة.
   - التحقق من توازن القيود المحاسبية (المدين = الدائن تماماً).
   - التحقق من كفاية الرصيد المخزني قبل تأكيد أوامر الصرف والتسليم.

---

## 3.4 نوافذ الحوار والتنبيهات (Dialogs, Modals & Toasts)
يحتوي النظام على نظام تنبيهات وإشعارات متطور:
- **نوافذ الإدخال السريعة (`Dialog` / `Modal`):** تُستخدم لإضافة أو تعديل السجلات (مثل إضافة عميل جديد، إنشاء قيد يومية، إدخال صنف) دون مغادرة الصفحة الحالية.
- **نوافذ السحب الجانبي (`Sheet` / `Drawer`):** مخصصة لعرض تفاصيل السجل، مثل كشف حساب العميل، شجرة الحسابات الفرعية، أو تاريخ الحركات وسجل التدقيق.
- **تأكيدات الحذف والترحيل (`AlertDialog`):** طلب تأكيد قطعي من المستخدم قبل تنفيذ العمليات الحساسة (مثل ترحيل قيد، إلغاء فاتورة، حذف سجل).
- **التنبيهات الفورية (`Sonner Toast`):** إشعارات عائمة فورية تؤكد نجاح العمليات (باللون الأخضر) أو توضح أسباب الفشل والتحذيرات (باللون الأحمر/البرتقالي).

---

# 4️⃣ تحليل الأزرار والإجراءات التفاعلية (Buttons & Actions Matrix)

## 4.1 السجل الشامل لجميع الأزرار والإجراءات في النظام (551 زر وإجراء)
تم فحص الكود المصدري لجميع واجهات ومكونات النظام لاستخراج كافة الأزرار وعناصر التحكم مع الإجراءات والدوال وواجهات البرمجة المرتبطة بها:

| # | الموقع / الشاشة | اسم الزر / النص | الوظيفة البرمجية | الدالة / المعالج (Handler) | واجهة الـ API المستدعاة |
|---|-----------------|-----------------|------------------|-----------------------------|--------------------------|
| 1 | activities | `openEdit(a)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/activities<br>/api/erp/branches |
| 2 | activities | `setDeleteId(a.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/activities<br>/api/erp/branches |
| 3 | activities | `setDialogOpen(false)} className="h-10 px-5 border-slate-300` | إجراء تفاعلي للشاشة | `-` | /api/erp/activities<br>/api/erp/branches |
| 4 | activities | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/activities<br>/api/erp/branches |
| 5 | analytic-accounts | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/analytic-accounts |
| 6 | analytic-accounts | `saveMutation.mutate()} disabled= className="h-10 px-5 bg-blu` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/analytic-accounts |
| 7 | analytic-accounts | `onEdit(account)} title="تعديل">` | تعديل بيانات السجل المحدد | `-` | /api/erp/analytic-accounts |
| 8 | analytic-accounts | `onDelete(account.id)} title="حذف" >` | حذف السجل بعد التأكيد | `-` | /api/erp/analytic-accounts |
| 9 | attendance | `openEdit(a)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/attendance |
| 10 | attendance | `deleteMutation.mutate(a.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/attendance |
| 11 | attendance | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/attendance |
| 12 | attendance | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/attendance |
| 13 | audit-logs | `openView(l)}>` | إجراء تفاعلي للشاشة | `-` | - |
| 14 | audit-logs | `setPage(page - 1)}>السابق` | إجراء تفاعلي للشاشة | `-` | - |
| 15 | audit-logs | `= totalPages} onClick= >التالي` | إجراء تفاعلي للشاشة | `-` | - |
| 16 | audit-logs | `setViewOpen(false)} className="h-10 px-5 border-slate-200 da` | إجراء تفاعلي للشاشة | `-` | - |
| 17 | bank-accounts | `handleEdit(r)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/bank-accounts |
| 18 | bank-accounts | `delMut.mutate(r.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts |
| 19 | bank-accounts | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts |
| 20 | bank-accounts | `saveMut.mutate()} disabled= className="h-10 px-5 bg-blue-600` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/bank-accounts |
| 21 | أورمنال | `approveMutation.mutate(b.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 22 | أورمنال | `handlePrint(b)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 23 | أورمنال | `openEdit(b)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 24 | أورمنال | `deleteMutation.mutate(b.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 25 | أورمنال | `removeComponent(c.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 26 | أورمنال | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 27 | أورمنال | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 28 | أورمنال | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/products?pageSize=300<br>/api/erp/boms |
| 29 | branches | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/branches |
| 30 | branches | `openEdit(b)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/branches |
| 31 | branches | `setDeleteId(b.id)} disabled= title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/branches |
| 32 | branches | `setDialogOpen(false)} className="border-slate-300 dark:borde` | إجراء تفاعلي للشاشة | `-` | /api/erp/branches |
| 33 | branches | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/branches |
| 34 | أورمنال للأنظمة المحاسبية | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories |
| 35 | أورمنال للأنظمة المحاسبية | `handleEdit(c)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/categories |
| 36 | أورمنال للأنظمة المحاسبية | `handleEdit(c)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/categories |
| 37 | أورمنال للأنظمة المحاسبية | `handleDelete(c)} title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/categories |
| 38 | أورمنال للأنظمة المحاسبية | `setDialogOpen(false)} className="w-full sm:w-auto sm:min-w-2` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories |
| 39 | أورمنال للأنظمة المحاسبية | `} className="w-full border sm:w-auto sm:min-w-25 gap-1.5" >` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories |
| 40 | أورمنال للأنظمة المحاسبية | `saveMut.mutate()} disabled= className="w-full sm:w-auto sm:m` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/categories |
| 41 | chart-of-accounts | `setViewMode('tree')} className= aria-label= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 42 | chart-of-accounts | `setViewMode('flat')} className= aria-label= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 43 | chart-of-accounts | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 44 | chart-of-accounts | `setImportOpen(true)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 45 | chart-of-accounts | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 46 | chart-of-accounts | `setRolesOpen(true)}> )}` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 47 | chart-of-accounts | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 48 | chart-of-accounts | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 49 | chart-of-accounts | `setFilters((f) => ( ))} >` | تصفية وبحث السجلات | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 50 | chart-of-accounts | `setRolesOpen(true)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 51 | chart-of-accounts | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 52 | chart-of-accounts | `) }} disabled= className= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 53 | chart-of-accounts | `setDeleteTarget(null)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 54 | chart-of-accounts | `deleteTarget && deleteMutation.mutate(deleteTarget.id)} disa` | حذف السجل بعد التأكيد | `-` | /api/erp/accounts/stats<br>/api/erp/accounts/meta<br>/api/erp/accounts |
| 55 | أورمنال للأنظمة المحاسبية | `setStatementId(c.id)} title="كشف حساب">` | إجراء تفاعلي للشاشة | `-` | /api/erp/clients |
| 56 | أورمنال للأنظمة المحاسبية | `handleEdit(c)} title="تعديل">` | تعديل بيانات السجل المحدد | `-` | /api/erp/clients |
| 57 | أورمنال للأنظمة المحاسبية | `setDeleteId(c.id)} title="حذف">` | حذف السجل بعد التأكيد | `-` | /api/erp/clients |
| 58 | أورمنال للأنظمة المحاسبية | `setDialogOpen(false)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/clients |
| 59 | أورمنال للأنظمة المحاسبية | `: <> }` | إجراء تفاعلي للشاشة | `-` | /api/erp/clients |
| 60 | أورمنال للأنظمة المحاسبية | `setStatementId(null)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/clients |
| 61 | أورمنال للأنظمة المحاسبية | `طباعة الكشف` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/clients |
| 62 | cost-centers | `handleEdit(r)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/cost-centers |
| 63 | cost-centers | `delMut.mutate(r.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/cost-centers |
| 64 | cost-centers | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/cost-centers |
| 65 | cost-centers | `saveMut.mutate()} disabled= className="h-10 px-5 bg-blue-600` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/cost-centers |
| 66 | currencies | `setDeleteConfirmOpen(false)} className="px-4 py-1.5 text-xs` | حذف السجل بعد التأكيد | `-` | /api/erp/currencies |
| 67 | currencies | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/currencies |
| 68 | currencies | `setDeleteConfirmOpen(false)} className="px-4 py-1.5 text-xs` | حذف السجل بعد التأكيد | `-` | /api/erp/currencies |
| 69 | currencies | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/currencies |
| 70 | customers | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 71 | customers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 72 | customers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 73 | customers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 74 | customers | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 75 | customers | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 76 | customers | `setDialogOpen(false)} className="w-full sm:w-auto sm:min-w-2` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 77 | customers | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 78 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 79 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 80 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 81 | $ | `removeItem(idx)} className="size-8 text-rose-500 hover:text-` | حذف السجل بعد التأكيد | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 82 | $ | `setDialogOpen(false)} className="h-9 w-20 px-4 border-rose-6` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 83 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 84 | $ | `setDetailDelivery(null)} className="h-10 w-20 px-5 border-ro` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 85 | $ | `handlePrintVoucher(detailDelivery)} className="h-10 px-4 tex` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 86 | $ | `validateMut.mutate(detailDelivery.id)} disabled= className="` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses?pageSize=200<br>/api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/partners?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/deliveries |
| 87 | departments | `openEdit(d)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/departments |
| 88 | departments | `deleteMutation.mutate(d.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/departments |
| 89 | departments | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/departments |
| 90 | departments | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/departments |
| 91 | فاتورة ضريبية | `openEdit(tpl)}> تعديل` | تعديل بيانات السجل المحدد | `-` | - |
| 92 | فاتورة ضريبية | `toast.info('معاينة القالب')}>` | إجراء تفاعلي للشاشة | `-` | - |
| 93 | فاتورة ضريبية | `setDialogOpen(false)}>` | إجراء تفاعلي للشاشة | `-` | - |
| 94 | فاتورة ضريبية | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | - |
| 95 | أورمنال | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 96 | أورمنال | `handlePrint(e)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 97 | أورمنال | `openSalaryDialog(e)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 98 | أورمنال | `openEdit(e)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 99 | أورمنال | `deleteMutation.mutate(e.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 100 | أورمنال | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 101 | أورمنال | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 102 | أورمنال | `} className="h-10 px-5 border-slate-300 dark:border-slate-70` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 103 | أورمنال | `) }} className="h-10 px-5 bg-blue-600 hover:bg-blue-700 dark` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 104 | أورمنال | `) setShowContractForm(true) }} className="h-8 bg-blue-600 ho` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 105 | أورمنال | `) setShowContractForm(true) }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 106 | أورمنال | `}} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 107 | أورمنال | `setSalaryDialogOpen(false)} className="h-10 px-5 border-slat` | إجراء تفاعلي للشاشة | `-` | /api/erp/contracts<br>/api/erp/departments?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/job-positions?pageSize=200<br>/api/erp/employees |
| 108 | أورمنال — نظام إدارة موارد المؤسسات ERP | `}>مسح` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/expenses |
| 109 | أورمنال — نظام إدارة موارد المؤسسات ERP | `handlePrint(e)} title="طباعة السند">` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/expenses |
| 110 | أورمنال — نظام إدارة موارد المؤسسات ERP | `setOpen(false)} className="px-5 py-2.5 h-11 text-sm font-med` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/expenses |
| 111 | أورمنال — نظام إدارة موارد المؤسسات ERP | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/expenses |
| 112 | أورمنال — نظام إدارة موارد المؤسسات ERP | `handlePrint(r)} title="طباعة">` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/finance-requisitions |
| 113 | أورمنال — نظام إدارة موارد المؤسسات ERP | `actionMut.mutate( )} title="اعتماد">` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-requisitions |
| 114 | أورمنال — نظام إدارة موارد المؤسسات ERP | `actionMut.mutate( )} title="رفض">` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-requisitions |
| 115 | أورمنال — نظام إدارة موارد المؤسسات ERP | `actionMut.mutate( )} title="تنفيذ (إنشاء سند صرف)">` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-requisitions |
| 116 | أورمنال — نظام إدارة موارد المؤسسات ERP | `setOpen(false)} className="h-10 px-5 border-slate-200 dark:b` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-requisitions |
| 117 | أورمنال — نظام إدارة موارد المؤسسات ERP | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-requisitions |
| 118 | أورمنال — نظام إدارة موارد المؤسسات ERP | `handlePrint(e)} title="طباعة السند">` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/finance-transfers<br>/api/erp/bank-accounts<br>/api/erp/safes |
| 119 | أورمنال — نظام إدارة موارد المؤسسات ERP | `setOpen(false)} className="h-10 px-5border-slate-250 dark:bo` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-transfers<br>/api/erp/bank-accounts<br>/api/erp/safes |
| 120 | أورمنال — نظام إدارة موارد المؤسسات ERP | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/finance-transfers<br>/api/erp/bank-accounts<br>/api/erp/safes |
| 121 | fiscal-periods | `handleEditPeriod(p)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 122 | fiscal-periods | `updatePeriodMut.mutate( )} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 123 | fiscal-periods | `updatePeriodMut.mutate( )} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 124 | fiscal-periods | `updatePeriodMut.mutate( )} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 125 | fiscal-periods | `setYearDialogOpen(false)} className="h-10 px-5 border-slate-` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 126 | fiscal-periods | `createYearMut.mutate()} disabled= className="h-10 px-5 bg-bl` | فتح نافذة إضافة سجل جديد | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 127 | fiscal-periods | `setPeriodDialogOpen(false)} className="h-10 px-5 border-slat` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 128 | fiscal-periods | `savePeriodMut.mutate()} disabled= className="h-10 px-5 bg-bl` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 129 | fiscal-periods | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 130 | fiscal-periods | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 131 | fiscal-periods | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 132 | fiscal-periods | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 133 | fiscal-periods | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/fiscal-years<br>/api/erp/fiscal-periods |
| 134 | تصنيفات ومجموعات الأصول الثابتة | `setIsDepreciationModalOpen(true)} variant="outline" classNam` | إجراء تفاعلي للشاشة | `-` | - |
| 135 | تصنيفات ومجموعات الأصول الثابتة | `تصدير Excel` | تصدير البيانات إلى ملف إكسل | `-` | - |
| 136 | تصنيفات ومجموعات الأصول الثابتة | `setIsAddAssetOpen(true)} className="gap-2 bg-primary text-pr` | إجراء تفاعلي للشاشة | `-` | - |
| 137 | تصنيفات ومجموعات الأصول الثابتة | `setIsAddCategoryOpen(true)} size="sm" variant="outline" clas` | إجراء تفاعلي للشاشة | `-` | - |
| 138 | تصنيفات ومجموعات الأصول الثابتة | `setIsDepreciationModalOpen(true)} className="bg-emerald-600` | إجراء تفاعلي للشاشة | `-` | - |
| 139 | تصنيفات ومجموعات الأصول الثابتة | `حفظ الأصل` | إرسال وحفظ بيانات النموذج | `-` | - |
| 140 | تصنيفات ومجموعات الأصول الثابتة | `setIsAddAssetOpen(false)}> إلغاء` | إجراء تفاعلي للشاشة | `-` | - |
| 141 | تصنيفات ومجموعات الأصول الثابتة | `تأكيد والترحيل لدفتر اليومية` | ترحيل المستند وإقفاله محاسبياً | `-` | - |
| 142 | تصنيفات ومجموعات الأصول الثابتة | `setIsDepreciationModalOpen(false)}> إلغاء` | إجراء تفاعلي للشاشة | `-` | - |
| 143 | general-defs | `else if (selectedType) }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 144 | general-defs | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 145 | general-defs | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 146 | general-defs | `window.print()} >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 147 | general-defs | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 148 | general-defs | `fetchTypes()} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 149 | general-defs | `setItemsViewActive(false)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 150 | general-defs | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 151 | general-defs | `setActiveDomainFilter('ALL')} >` | تصفية وبحث السجلات | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 152 | general-defs | `setActiveDomainFilter('HR')} >` | تصفية وبحث السجلات | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 153 | general-defs | `setActiveDomainFilter('COMMON')} >` | تصفية وبحث السجلات | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 154 | general-defs | `setActiveDomainFilter('FINANCE')} >` | تصفية وبحث السجلات | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 155 | general-defs | `Excel Export` | تصدير البيانات إلى ملف إكسل | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 156 | general-defs | `window.print()}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 157 | general-defs | `Copy` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 158 | general-defs | `handleOpenDelete()} >` | حذف السجل بعد التأكيد | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 159 | general-defs | `handleOpenEdit()} >` | تعديل بيانات السجل المحدد | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 160 | general-defs | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 161 | general-defs | `handleSelectCategory(type)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 162 | general-defs | `setCurrentPage(1)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 163 | general-defs | `setCurrentPage((p) => Math.max(1, p - 1))} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 164 | general-defs | `= totalPages} onClick= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 165 | general-defs | `= totalPages} onClick= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 166 | general-defs | `handleToggleItemActive(item)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 167 | general-defs | `handleOpenEdit(item)} >` | تعديل بيانات السجل المحدد | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 168 | general-defs | `handleOpenDelete(item)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 169 | general-defs | `setIsFormOpen(false)} disabled= className="h-9 sm:h-10 w-ful` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 170 | general-defs | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 171 | general-defs | `setIsDeleteOpen(false)} disabled= className="h-9 sm:h-10 w-f` | حذف السجل بعد التأكيد | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 172 | general-defs | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/general-definitions?mode=types&seed=true<br>/api/erp/general-definitions |
| 173 | general-vars | `); setReason('') }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/config |
| 174 | general-vars | `dirtyHasSystem ? setConfirmSave(true) : saveMutation.mutate(` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/config |
| 175 | $ | `deleteMutation.mutate(r.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 176 | $ | `validateMutation.mutate(r)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 177 | $ | `openEdit(r, true)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 178 | $ | `handlePrint(r)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 179 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 180 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 181 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 182 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 183 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 184 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 185 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 186 | $ | `saveMutation.mutate(false)}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 187 | $ | `saveMutation.mutate(true)}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/warehouses?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/goods-receipts |
| 188 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 189 | $ | `setDetailItem(r)} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 190 | $ | `handlePrint(r)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 191 | $ | `postMut.mutate(r.id)} disabled= >` | ترحيل المستند وإقفاله محاسبياً | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 192 | $ | `setDialogOpen(false)} className="h-10 px-5 border-slate-250` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 193 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 194 | $ | `setDetailItem(null)} className="h-9 w-full sm:w-auto sm:min-` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 195 | $ | `handlePrint(detailItem)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-adjustments |
| 196 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 197 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 198 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 199 | $ | `removeItem(idx)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 200 | $ | `setDialogOpen(false)} className="h-9.5 w-full sm:w-auto sm:m` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 201 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 202 | $ | `setDetailMovement(null)} className="h-10 w-full sm:w-auto sm` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 203 | $ | `handlePrintVoucher(detailMovement)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isSupplier=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-incoming |
| 204 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 205 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 206 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 207 | $ | `removeItem(idx)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 208 | $ | `setDialogOpen(false)} className="h-10 px-5 border-slate-250` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 209 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 210 | $ | `handlePrintVoucher(detailMovement)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 211 | $ | `setDetailMovement(null)} className="h-10 px-5 border-rose-40` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/partners?isCustomer=true&pageSize=100<br>/api/erp/partners?pageSize=100<br>/api/erp/inventory-outgoing |
| 212 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 213 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 214 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 215 | $ | `removeItem(idx)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 216 | $ | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 217 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 218 | $ | `setDetailReq(null)} className="h-10 px-5 py-5 border-rose-40` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 219 | $ | `handlePrintVoucher(detailReq)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 220 | $ | `updateMutation.mutate( })}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 221 | $ | `updateMutation.mutate( })}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 222 | $ | `updateMutation.mutate( })} className="h-10 px-5 bg-emerald-6` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-requisitions |
| 223 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 224 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 225 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 226 | $ | `removeItem(idx)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 227 | $ | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 228 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 229 | $ | `handlePrintVoucher(detailTransfer)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 230 | $ | `updateMutation.mutate( })}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 231 | $ | `updateMutation.mutate( })}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 232 | $ | `setDetailTransfer(null)} className="h-10 px-5 border-rose-40` | إجراء تفاعلي للشاشة | `-` | /api/erp/storehouses<br>/api/erp/products?type=product<br>/api/erp/inventory-transfers |
| 233 | أورمنال | `} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 234 | أورمنال | `handlePrint(e)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 235 | أورمنال | `removeLine(l.key)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 236 | أورمنال | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 237 | أورمنال | `setAddOpen(false)} className="h-10 px-5 border-slate-200 dar` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 238 | أورمنال | `saveMutation.mutate('draft')} className="h-10 px-5 border-sl` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 239 | أورمنال | `saveMutation.mutate('posted')} className="h-10 px-5 bg-blue-` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 240 | أورمنال | `handlePrint(viewing)} className="h-10 px-5 border-slate-200` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 241 | أورمنال | `postMutation.mutate(viewing.id)} disabled= className="h-10 p` | ترحيل المستند وإقفاله محاسبياً | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 242 | أورمنال | `setViewOpen(false)} className="h-10 px-5 border-slate-200 da` | إجراء تفاعلي للشاشة | `-` | /api/erp/accounts?pageSize=500<br>/api/erp/journal-entries |
| 243 | leave-requests | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 244 | leave-requests | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 245 | leave-requests | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 246 | leave-requests | `deleteMutation.mutate(l.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 247 | leave-requests | `setDialogOpen(false)} className="h-10 px-5 border-slate-300` | إجراء تفاعلي للشاشة | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 248 | leave-requests | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/employees?status=active&pageSize=300<br>/api/erp/leave-requests |
| 249 | notifications | `markAllReadMutation.mutate()} > تعليم الكل كمقروء` | إجراء تفاعلي للشاشة | `-` | /api/erp/notifications |
| 250 | notifications | `setFilterRead(f.value)} >` | تصفية وبحث السجلات | `-` | /api/erp/notifications |
| 251 | notifications | `markReadMutation.mutate(n.id)} title="تعليم كمقروء" >` | إجراء تفاعلي للشاشة | `-` | /api/erp/notifications |
| 252 | notifications | `deleteMutation.mutate(n.id)} title="حذف" >` | حذف السجل بعد التأكيد | `-` | /api/erp/notifications |
| 253 | $ | `setViewMode('list')} className="h-7 px-2.5 gap-1 text-xs bg-` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 254 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 255 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 256 | $ | `setViewMode('tree')} className="h-8 w-8 p-0 text-amber-600 h` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 257 | $ | `window.print()} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 258 | $ | `}} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 259 | $ | `»؟`, `Delete "$ "?`))) }} title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 260 | $ | `} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 261 | $ | `} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 262 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 263 | $ | `setCurrentPage(1)} disabled= className="h-7 w-7 p-0 bg-backg` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 264 | $ | `setCurrentPage((p) => Math.max(1, p - 1))} disabled= classNa` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 265 | $ | `setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 266 | $ | `setCurrentPage(totalPages)} disabled= className="h-7 w-7 p-0` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 267 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 268 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 269 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 270 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 271 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 272 | $ | `setSuspendDialogOpen(false)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 273 | $ | `) }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 274 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 275 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 276 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 277 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 278 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 279 | $ | `onEdit(item)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 280 | $ | `onSuspend(item)} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/org-structure<br>/api/erp/cost-centers?pageSize=500<br>/api/erp/employees?pageSize=500 |
| 281 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 282 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 283 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 284 | أورمنال | `viewMutation.mutate(r.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 285 | أورمنال | `setDialogOpen(false)} className="h-10 px-5 border-slate-300` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 286 | أورمنال | `createMutation.mutate()} className="h-10 px-5 bg-blue-600 ho` | فتح نافذة إضافة سجل جديد | `-` | /api/erp/payroll-runs |
| 287 | أورمنال | `setViewDialogOpen(false)} className="h-10 px-5 border-slate-` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 288 | أورمنال | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/payroll-runs |
| 289 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 290 | $ | `updateQty(it.product.id, -1)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 291 | $ | `updateQty(it.product.id, 1)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 292 | $ | `removeItem(it.product.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 293 | $ | `setAmountReceived(String(Math.round(amt)))}> }` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 294 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 295 | $ | `setReceipt(null)} className="gap-1.5">` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 296 | $ | `printReceipt(receipt)} className="gap-1.5">` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?active=true<br>/api/erp/sales-orders |
| 297 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 298 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 299 | أورمنال | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 300 | أورمنال | `handlePrint(o)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 301 | أورمنال | `deleteMutation.mutate(o.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 302 | أورمنال | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 303 | أورمنال | `saveMutation.mutate()} className="h-10 px-5 bg-blue-600 hove` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/boms?pageSize=200<br>/api/erp/production-orders |
| 304 | products | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories?pageSize=100<br>/api/erp/products |
| 305 | products | `} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories?pageSize=100<br>/api/erp/products |
| 306 | products | `handleDelete(p)} title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/categories?pageSize=100<br>/api/erp/products |
| 307 | products | `setDialogOpen(false)} className="w-full sm:w-auto sm:min-w-2` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories?pageSize=100<br>/api/erp/products |
| 308 | products | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/categories?pageSize=100<br>/api/erp/products |
| 309 | profile | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 310 | profile | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 311 | profile | `setTheme('light')} className="gap-1.5" > فاتح` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 312 | profile | `setTheme('dark')} className="gap-1.5" > داكن` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 313 | profile | `setTheme('system')} className="gap-1.5" > تلقائي` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 314 | profile | `setLocale('ar')} className="gap-1.5" > العربية` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 315 | profile | `setLocale('en')} className="gap-1.5" > English` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 316 | profile | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/users?pageSize=1 |
| 317 | $ | `openView(n)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-credit-notes |
| 318 | $ | `handlePrint(n)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-credit-notes |
| 319 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-credit-notes |
| 320 | $ | `handlePrint(selectedNote)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-credit-notes |
| 321 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-credit-notes |
| 322 | $ | `deleteMutation.mutate(i.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 323 | $ | `openView(i)} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 324 | $ | `handlePrint(i)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 325 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 326 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 327 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 328 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 329 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 330 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 331 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 332 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-orders?pageSize=200<br>/api/erp/purchase-invoices<br>/api/erp/purchase-credit-notes |
| 333 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 334 | $ | `deleteMutation.mutate(o.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 335 | $ | `openEdit(o, true)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 336 | $ | `handlePrint(o)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 337 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 338 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 339 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 340 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 341 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 342 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 343 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-requests?pageSize=200<br>/api/erp/purchase-orders |
| 344 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 345 | $ | `statusMutation.mutate( )} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 346 | $ | `setDeleteTarget(p)} title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 347 | $ | `handlePrint(p)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 348 | $ | `handleOpenReverseConfirmation(p)} title= >` | إنشاء قيد عكسي للمستند | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 349 | $ | `openPaymentModal(p)} title= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 350 | $ | `handlePrint(p)} title= >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 351 | $ | `setModalOpen(false)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 352 | $ | `selectedPayment && handlePrint(selectedPayment)} >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 353 | $ | `handleOpenReverseConfirmation(selectedPayment)} >` | إنشاء قيد عكسي للمستند | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 354 | $ | `saveMutation.mutate(false)} >` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 355 | $ | `saveMutation.mutate(true)} >` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 356 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 357 | $ | `) } }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/purchase-payments |
| 358 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 359 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 360 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 361 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 362 | $ | `openEdit(r)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 363 | $ | `handlePrint(r)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 364 | $ | `deleteMutation.mutate(r.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 365 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 366 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 367 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 368 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 369 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 370 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 371 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 372 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 373 | $ | `convertTarget && actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/products?pageSize=200<br>/api/erp/cost-centers?pageSize=200<br>/api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-requests<br>/api/erp/purchase-orders |
| 374 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 375 | $ | `openEdit(r)} >` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 376 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 377 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 378 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 379 | $ | `setDebitNoteReturn(r)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 380 | $ | `handlePrint(r)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 381 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 382 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 383 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 384 | $ | `handlePrint(editingReturn)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 385 | $ | `setDebitNoteReturn(editingReturn)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 386 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 387 | $ | `saveMutation.mutate( )} className="w-full sm:w-auto text-xs` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 388 | $ | `saveMutation.mutate( )} className="w-full sm:w-auto text-xs` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 389 | $ | `setDebitNoteReturn(null)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 390 | $ | `handlePrintDebitNote(fullDebitNoteReturn, fullDebitNoteRetur` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isSupplier=true&pageSize=200<br>/api/erp/purchase-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/purchase-returns |
| 391 | أورمنال ERP | `تصدير` | تصدير البيانات إلى ملف إكسل | `-` | - |
| 392 | أورمنال ERP | `طباعة` | طباعة المستند أو تقرير الشاشة | `-` | - |
| 393 | أورمنال ERP | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | - |
| 394 | أورمنال ERP | `قريباً` | إجراء تفاعلي للشاشة | `-` | - |
| 395 | أورمنال — نظام إدارة موارد المؤسسات ERP | `}>مسح` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/revenues |
| 396 | أورمنال — نظام إدارة موارد المؤسسات ERP | `handlePrint(e)} title="طباعة السند">` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/revenues |
| 397 | أورمنال — نظام إدارة موارد المؤسسات ERP | `setOpen(false)} className="h-10 px-5 border-slate-200 dark:b` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/revenues |
| 398 | أورمنال — نظام إدارة موارد المؤسسات ERP | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/bank-accounts<br>/api/erp/safes<br>/api/erp/revenues |
| 399 | roles | `setFilterType('all')}>الكل` | تصفية وبحث السجلات | `-` | /api/erp/roles |
| 400 | roles | `setFilterType('system')}>نظام` | تصفية وبحث السجلات | `-` | /api/erp/roles |
| 401 | roles | `setFilterType('custom')}>مخصصة` | تصفية وبحث السجلات | `-` | /api/erp/roles |
| 402 | roles | `loadRoleDetail(r)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 403 | roles | `deleteMutation.mutate(r.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/roles |
| 404 | roles | `MODULES.forEach((m) => ) setExpandedModules(next) }} classNa` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 405 | roles | `MODULES.forEach((m) => ) setExpandedModules(next) }} classNa` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 406 | roles | `for (const m of MODULES) } return next }) }} className="h-8` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 407 | roles | `for (const m of MODULES) } return next }) }} className="h-8` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 408 | roles | `setExpandedModules(prev => ( ))} className="size-6 text-slat` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 409 | roles | `toggleAllForModule(mod.code, !allOn)} className="h-7 text-[1` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 410 | roles | `setExpandedModules(prev => ( ))} className="size-7" >` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 411 | roles | `setDialogOpen(false)} className="px-5 py-2.5 h-11 text-sm fo` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 412 | roles | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles |
| 413 | safes | `handleEdit(r)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/safes |
| 414 | safes | `delMut.mutate(r.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/safes |
| 415 | safes | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/safes |
| 416 | safes | `saveMut.mutate()} disabled= className="h-10 px-5 bg-blue-600` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/safes |
| 417 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 418 | $ | `openView(n)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 419 | $ | `handlePrint(n)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 420 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 421 | $ | `handlePrint(selectedNote)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 422 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-credit-notes |
| 423 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 424 | $ | `openEdit(o, true)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 425 | $ | `handlePrint(o)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 426 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 427 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 428 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 429 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 430 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 431 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-invoices |
| 432 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 433 | $ | `openEdit(o, false)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 434 | $ | `handlePrint(o)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 435 | $ | `setDeleteTarget(o)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 436 | $ | `openEdit(o, true)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 437 | $ | `setDeleteTarget(o)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 438 | $ | `openEdit(o, true)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 439 | $ | `handlePrint(o)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 440 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 441 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 442 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 443 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 444 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 445 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 446 | $ | `setDeleteTarget(null)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 447 | $ | `deleteTarget && deleteMutation.mutate(deleteTarget)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-orders |
| 448 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 449 | $ | `openVoucherModal(p)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 450 | $ | `setDeleteTarget(p)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 451 | $ | `openVoucherModal(p)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 452 | $ | `openVoucherModal(p)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 453 | $ | `handlePrint(p)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 454 | $ | `openReverseModal(p)} >` | إنشاء قيد عكسي للمستند | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 455 | $ | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 456 | $ | `handlePrint(selectedPayment)} >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 457 | $ | `openReverseModal(selectedPayment)} >` | إنشاء قيد عكسي للمستند | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 458 | $ | `handlePrint(selectedPayment)} >` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 459 | $ | `updateMutation.mutate('draft')} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 460 | $ | `updateMutation.mutate('posted')} >` | ترحيل المستند وإقفاله محاسبياً | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 461 | $ | `saveMutation.mutate('draft')} >` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 462 | $ | `saveMutation.mutate('posted')} >` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 463 | $ | `setReverseTarget(null)} >` | إنشاء قيد عكسي للمستند | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 464 | $ | `) } }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 465 | $ | `setDeleteTarget(null)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 466 | $ | `}} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/sales-payments |
| 467 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 468 | $ | `convertMutation.mutate(q)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 469 | $ | `handlePrint(q)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 470 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 471 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 472 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 473 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 474 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 475 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 476 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 477 | $ | `setDeleteTarget(null)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 478 | $ | `deleteTarget && deleteMutation.mutate(deleteTarget)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-quotations<br>/api/erp/sales-orders |
| 479 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 480 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 481 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 482 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 483 | $ | `actionMutation.mutate( )}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 484 | $ | `openView(r)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 485 | $ | `handlePrint(r)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 486 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 487 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 488 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 489 | $ | `removeLine(l.key)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 490 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 491 | $ | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 492 | $ | `handlePrint(selectedReturn)}>` | طباعة المستند أو تقرير الشاشة | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 493 | $ | `saveMutation.mutate()}>` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/partners?isCustomer=true&pageSize=200<br>/api/erp/sales-invoices?pageSize=200<br>/api/erp/products?pageSize=200<br>/api/erp/sales-returns |
| 494 | نتائج البحث | `) }} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/settings |
| 495 | نتائج البحث | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/settings |
| 496 | نتائج البحث | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/settings |
| 497 | stock-locations | `handleEdit(r)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/stock-locations |
| 498 | stock-locations | `delMut.mutate(r.id)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-locations |
| 499 | stock-locations | `setDialogOpen(false)}>إلغاء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-locations |
| 500 | stock-locations | `saveMut.mutate()} disabled= >` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/stock-locations |
| 501 | stock-moves | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | - |
| 502 | $ | `refetch()} disabled= >` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses<br>/api/erp/categories?pageSize=200 |
| 503 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses<br>/api/erp/categories?pageSize=200 |
| 504 | $ | `refetch()} className="gap-1.5">` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses<br>/api/erp/categories?pageSize=200 |
| 505 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/warehouses<br>/api/erp/categories?pageSize=200 |
| 506 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 507 | $ | `refetch()}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 508 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 509 | $ | `setCreateDialogOpen(false)} className="h-9 px-4 text-xs font` | فتح نافذة إضافة سجل جديد | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 510 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 511 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 512 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 513 | $ | `setAddItemDialogOpen(true)} className="h-9 gap-1.5 text-xs f` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 514 | $ | `setDetailTake(null)} className="h-9 px-4 text-xs font-semibo` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 515 | $ | `handleSaveProgress('in_progress')} disabled= className="h-9` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 516 | $ | `setPostConfirmTake(detailTake)} disabled= className="h-9 px-` | ترحيل المستند وإقفاله محاسبياً | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 517 | $ | `setAddItemDialogOpen(false)} className="h-9 px-4 text-xs fon` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 518 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 519 | $ | `setPostConfirmTake(null)} className="h-9 px-4 text-xs font-s` | ترحيل المستند وإقفاله محاسبياً | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 520 | $ | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/stock-takes?pageSize=1000<br>/api/erp/storehouses<br>/api/erp/categories?tree=false<br>/api/erp/products?type=product<br>/api/erp/stock-takes |
| 521 | suppliers | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 522 | suppliers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 523 | suppliers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 524 | suppliers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 525 | suppliers | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 526 | suppliers | `} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 527 | suppliers | `setDialogOpen(false)} className="w-full sm:w-auto sm:min-w-2` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 528 | suppliers | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/partners |
| 529 | system-config | `setShowAudit((v) => !v)} className="gap-1.5 shrink-0" >` | إجراء تفاعلي للشاشة | `-` | /api/erp/config<br>/api/erp/config/audit?limit=100 |
| 530 | system-config | `); setReason('') }}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/config<br>/api/erp/config/audit?limit=100 |
| 531 | system-config | `(dirtyHasSystem ? setConfirmSave(true) : saveMutation.mutate` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/config<br>/api/erp/config/audit?limit=100 |
| 532 | system-config | `props.onOpenModule(moduleLink)}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/config<br>/api/erp/config/audit?limit=100 |
| 533 | users | `setFilterActive('all')}>الكل` | تصفية وبحث السجلات | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 534 | users | `setFilterActive('active')}>نشط` | تصفية وبحث السجلات | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 535 | users | `setFilterActive('inactive')}>غير نشط` | تصفية وبحث السجلات | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 536 | users | `openEdit(u)}>` | تعديل بيانات السجل المحدد | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 537 | users | `deleteMutation.mutate(u.id)} >` | حذف السجل بعد التأكيد | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 538 | users | `setShowPassword((v) => !v)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 539 | users | `setChangePasswordOpen((v) => !v)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 540 | users | `setShowPassword((v) => !v)} >` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 541 | users | `setDialogOpen(false)}>إلغاء` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 542 | users | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/roles?pageSize=200<br>/api/erp/branches?pageSize=200<br>/api/erp/users |
| 543 | warehouses | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/branches<br>/api/erp/warehouses |
| 544 | warehouses | `handleEdit(r)} title= >` | تعديل بيانات السجل المحدد | `-` | /api/erp/branches<br>/api/erp/warehouses |
| 545 | warehouses | `handleDelete(r)} title= >` | حذف السجل بعد التأكيد | `-` | /api/erp/branches<br>/api/erp/warehouses |
| 546 | warehouses | `setDialogOpen(false)} className="border-slate-300 dark:borde` | إجراء تفاعلي للشاشة | `-` | /api/erp/branches<br>/api/erp/warehouses |
| 547 | warehouses | `saveMut.mutate()} disabled= className="bg-blue-600 hover:bg-` | إرسال وحفظ بيانات النموذج | `-` | /api/erp/branches<br>/api/erp/warehouses |
| 548 | work-centers | `}>` | إجراء تفاعلي للشاشة | `-` | /api/erp/work-centers |
| 549 | work-centers | `deleteMutation.mutate(w.id)}>` | حذف السجل بعد التأكيد | `-` | /api/erp/work-centers |
| 550 | work-centers | `setDialogOpen(false)} className="h-10 px-5 border-slate-200` | إجراء تفاعلي للشاشة | `-` | /api/erp/work-centers |
| 551 | work-centers | `زر إجراء` | إجراء تفاعلي للشاشة | `-` | /api/erp/work-centers |

---

# 5️⃣ تحليل واجهات برمجة التطبيقات (APIs & Endpoints)

## 5.1 مخطط تتابع استدعاء الـ APIs (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as المستخدم (Client UI)
    participant Proxy as الوسيط (Proxy / Middleware)
    participant API as خادم الـ API (Route Handler)
    participant RBAC as حارس الصلاحيات (RBAC & Multi-Tenancy)
    participant Engine as محرك الأعمال (Posting / Business Engine)
    participant DB as قاعدة البيانات (PostgreSQL Neon)

    User->>Proxy: طلب HTTP (مع Cookie الجلسة وبيانات الترويسة)
    Proxy->>Proxy: التحقق من وجود رمز المصادقة (NextAuth Token)
    alt جلسة غير صالحة
        Proxy-->>User: 401 Unauthorized
    else جلسة صالحة
        Proxy->>API: تمرير الطلب الآمن
        API->>RBAC: requireAuthContext(req, { capability })
        RBAC->>DB: فحص صلاحيات المستخدم في الشركة والفرع
        alt صلاحية غير كافية أو تلاعب بالشركة (IDOR)
            RBAC-->>User: 403 Forbidden / 404 Not Found
        else مصرح له
            API->>Engine: تنفيذ العملية المحاسبية / التجارية
            Engine->>DB: معاملة ذرية ($transaction)
            DB-->>Engine: تأكيد نجاح التخزين
            Engine->>DB: كتابة سجل التدقيق الآلي (AuditLog)
            API-->>User: 200/201 JSON Response (مع البيانات الجديدة)
        end
    end
```

---

## 5.2 السجل الكامل لجميع نقاط النهاية (291 نقطة عبر 133 مسار)

فيما يلي توثيق شامل ودقيق لجميع مسارات الـ API في النظام مع الدوال المدعومة، معايير التحقق، والصلاحيات:

| # | الطريقة (Method) | المسار البرمجي (Route URL) | الوصف الوظيفي | المدخلات / Body | الاستجابة المتوقعة | الصلاحية والأمان |
|---|------------------|---------------------------|---------------|-----------------|---------------------|-------------------|
| 1 | **POST** | `/api/auth/register` | إنشاء أو معالجة سجل جديد في `/api/auth/register` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 2 | **GET** | `/api/erp/accounts/export` | استعلام وجلب سجلات `/api/erp/accounts/export` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 3 | **POST** | `/api/erp/accounts/import` | إنشاء أو معالجة سجل جديد في `/api/erp/accounts/import` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 4 | **GET** | `/api/erp/accounts/meta` | استعلام وجلب سجلات `/api/erp/accounts/meta` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 5 | **GET** | `/api/erp/accounts/roles` | استعلام وجلب سجلات `/api/erp/accounts/roles` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 6 | **PUT** | `/api/erp/accounts/roles` | تحديث بيانات السجل في `/api/erp/accounts/roles` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 7 | **DELETE** | `/api/erp/accounts/roles` | حذف أو إلغاء تفعيل السجل في `/api/erp/accounts/roles` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 8 | **GET** | `/api/erp/accounts` | استعلام وجلب سجلات `/api/erp/accounts` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 9 | **POST** | `/api/erp/accounts` | إنشاء أو معالجة سجل جديد في `/api/erp/accounts` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 10 | **GET** | `/api/erp/accounts/stats` | استعلام وجلب سجلات `/api/erp/accounts/stats` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 11 | **GET** | `/api/erp/accounts/[id]/audit` | استعلام وجلب سجلات `/api/erp/accounts/[id]/audit` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 12 | **GET** | `/api/erp/accounts/[id]/children` | استعلام وجلب سجلات `/api/erp/accounts/[id]/children` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 13 | **POST** | `/api/erp/accounts/[id]/children` | إنشاء أو معالجة سجل جديد في `/api/erp/accounts/[id]/children` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 14 | **POST** | `/api/erp/accounts/[id]/deactivate` | إنشاء أو معالجة سجل جديد في `/api/erp/accounts/[id]/deactivate` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 15 | **GET** | `/api/erp/accounts/[id]/ledger` | استعلام وجلب سجلات `/api/erp/accounts/[id]/ledger` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 16 | **GET** | `/api/erp/accounts/[id]` | استعلام وجلب سجلات `/api/erp/accounts/[id]` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 17 | **PUT** | `/api/erp/accounts/[id]` | تحديث بيانات السجل في `/api/erp/accounts/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 18 | **DELETE** | `/api/erp/accounts/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/accounts/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 19 | **GET** | `/api/erp/accounts/[id]/transactions` | استعلام وجلب سجلات `/api/erp/accounts/[id]/transactions` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 20 | **GET** | `/api/erp/activities` | استعلام وجلب سجلات `/api/erp/activities` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 21 | **POST** | `/api/erp/activities` | إنشاء أو معالجة سجل جديد في `/api/erp/activities` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 22 | **GET** | `/api/erp/activities/[id]` | استعلام وجلب سجلات `/api/erp/activities/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 23 | **PUT** | `/api/erp/activities/[id]` | تحديث بيانات السجل في `/api/erp/activities/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 24 | **DELETE** | `/api/erp/activities/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/activities/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 25 | **GET** | `/api/erp/attendance` | استعلام وجلب سجلات `/api/erp/attendance` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 26 | **POST** | `/api/erp/attendance` | إنشاء أو معالجة سجل جديد في `/api/erp/attendance` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 27 | **GET** | `/api/erp/attendance/[id]` | استعلام وجلب سجلات `/api/erp/attendance/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 28 | **PUT** | `/api/erp/attendance/[id]` | تحديث بيانات السجل في `/api/erp/attendance/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 29 | **DELETE** | `/api/erp/attendance/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/attendance/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 30 | **GET** | `/api/erp/audit-logs` | استعلام وجلب سجلات `/api/erp/audit-logs` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 31 | **GET** | `/api/erp/bank-accounts` | استعلام وجلب سجلات `/api/erp/bank-accounts` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 32 | **POST** | `/api/erp/bank-accounts` | إنشاء أو معالجة سجل جديد في `/api/erp/bank-accounts` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 33 | **GET** | `/api/erp/bank-accounts/[id]` | استعلام وجلب سجلات `/api/erp/bank-accounts/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 34 | **PUT** | `/api/erp/bank-accounts/[id]` | تحديث بيانات السجل في `/api/erp/bank-accounts/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 35 | **DELETE** | `/api/erp/bank-accounts/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/bank-accounts/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 36 | **GET** | `/api/erp/boms` | استعلام وجلب سجلات `/api/erp/boms` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 37 | **POST** | `/api/erp/boms` | إنشاء أو معالجة سجل جديد في `/api/erp/boms` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 38 | **GET** | `/api/erp/boms/[id]` | استعلام وجلب سجلات `/api/erp/boms/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 39 | **PUT** | `/api/erp/boms/[id]` | تحديث بيانات السجل في `/api/erp/boms/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 40 | **DELETE** | `/api/erp/boms/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/boms/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 41 | **GET** | `/api/erp/branches` | استعلام وجلب سجلات `/api/erp/branches` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 42 | **POST** | `/api/erp/branches` | إنشاء أو معالجة سجل جديد في `/api/erp/branches` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 43 | **GET** | `/api/erp/branches/[id]` | استعلام وجلب سجلات `/api/erp/branches/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 44 | **PUT** | `/api/erp/branches/[id]` | تحديث بيانات السجل في `/api/erp/branches/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 45 | **DELETE** | `/api/erp/branches/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/branches/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 46 | **GET** | `/api/erp/categories` | استعلام وجلب سجلات `/api/erp/categories` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 47 | **POST** | `/api/erp/categories` | إنشاء أو معالجة سجل جديد في `/api/erp/categories` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 48 | **GET** | `/api/erp/categories/[id]` | استعلام وجلب سجلات `/api/erp/categories/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 49 | **PUT** | `/api/erp/categories/[id]` | تحديث بيانات السجل في `/api/erp/categories/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 50 | **DELETE** | `/api/erp/categories/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/categories/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 51 | **GET** | `/api/erp/config/audit` | استعلام وجلب سجلات `/api/erp/config/audit` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 52 | **GET** | `/api/erp/config` | استعلام وجلب سجلات `/api/erp/config` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 53 | **PUT** | `/api/erp/config` | تحديث بيانات السجل في `/api/erp/config` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 54 | **POST** | `/api/erp/config` | إنشاء أو معالجة سجل جديد في `/api/erp/config` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 55 | **GET** | `/api/erp/contracts` | استعلام وجلب سجلات `/api/erp/contracts` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 56 | **POST** | `/api/erp/contracts` | إنشاء أو معالجة سجل جديد في `/api/erp/contracts` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 57 | **PUT** | `/api/erp/contracts/[id]` | تحديث بيانات السجل في `/api/erp/contracts/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 58 | **DELETE** | `/api/erp/contracts/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/contracts/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 59 | **GET** | `/api/erp/cost-centers` | استعلام وجلب سجلات `/api/erp/cost-centers` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 60 | **POST** | `/api/erp/cost-centers` | إنشاء أو معالجة سجل جديد في `/api/erp/cost-centers` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 61 | **GET** | `/api/erp/cost-centers/[id]` | استعلام وجلب سجلات `/api/erp/cost-centers/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 62 | **PUT** | `/api/erp/cost-centers/[id]` | تحديث بيانات السجل في `/api/erp/cost-centers/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 63 | **DELETE** | `/api/erp/cost-centers/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/cost-centers/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 64 | **GET** | `/api/erp/currencies` | استعلام وجلب سجلات `/api/erp/currencies` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 65 | **POST** | `/api/erp/currencies` | إنشاء أو معالجة سجل جديد في `/api/erp/currencies` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 66 | **POST** | `/api/erp/currencies/seed` | إنشاء أو معالجة سجل جديد في `/api/erp/currencies/seed` | Body Payload | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 67 | **GET** | `/api/erp/currencies/[id]/denominations` | استعلام وجلب سجلات `/api/erp/currencies/[id]/denominations` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 68 | **POST** | `/api/erp/currencies/[id]/denominations` | إنشاء أو معالجة سجل جديد في `/api/erp/currencies/[id]/denominations` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 69 | **PUT** | `/api/erp/currencies/[id]/denominations/[denId]` | تحديث بيانات السجل في `/api/erp/currencies/[id]/denominations/[denId]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 70 | **DELETE** | `/api/erp/currencies/[id]/denominations/[denId]` | حذف أو إلغاء تفعيل السجل في `/api/erp/currencies/[id]/denominations/[denId]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 71 | **GET** | `/api/erp/currencies/[id]/exchange-rates` | استعلام وجلب سجلات `/api/erp/currencies/[id]/exchange-rates` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 72 | **POST** | `/api/erp/currencies/[id]/exchange-rates` | إنشاء أو معالجة سجل جديد في `/api/erp/currencies/[id]/exchange-rates` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 73 | **GET** | `/api/erp/currencies/[id]` | استعلام وجلب سجلات `/api/erp/currencies/[id]` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 74 | **PUT** | `/api/erp/currencies/[id]` | تحديث بيانات السجل في `/api/erp/currencies/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 75 | **DELETE** | `/api/erp/currencies/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/currencies/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 76 | **POST** | `/api/erp/currencies/[id]/toggle-status` | إنشاء أو معالجة سجل جديد في `/api/erp/currencies/[id]/toggle-status` | Body Payload | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 77 | **GET** | `/api/erp/dashboard` | استعلام وجلب سجلات `/api/erp/dashboard` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 78 | **GET** | `/api/erp/deliveries` | استعلام وجلب سجلات `/api/erp/deliveries` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 79 | **POST** | `/api/erp/deliveries` | إنشاء أو معالجة سجل جديد في `/api/erp/deliveries` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 80 | **GET** | `/api/erp/deliveries/[id]` | استعلام وجلب سجلات `/api/erp/deliveries/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 81 | **PUT** | `/api/erp/deliveries/[id]` | تحديث بيانات السجل في `/api/erp/deliveries/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 82 | **DELETE** | `/api/erp/deliveries/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/deliveries/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 83 | **GET** | `/api/erp/departments` | استعلام وجلب سجلات `/api/erp/departments` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 84 | **POST** | `/api/erp/departments` | إنشاء أو معالجة سجل جديد في `/api/erp/departments` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 85 | **GET** | `/api/erp/departments/[id]` | استعلام وجلب سجلات `/api/erp/departments/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 86 | **PUT** | `/api/erp/departments/[id]` | تحديث بيانات السجل في `/api/erp/departments/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 87 | **DELETE** | `/api/erp/departments/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/departments/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 88 | **GET** | `/api/erp/employees` | استعلام وجلب سجلات `/api/erp/employees` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 89 | **POST** | `/api/erp/employees` | إنشاء أو معالجة سجل جديد في `/api/erp/employees` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 90 | **GET** | `/api/erp/employees/[id]` | استعلام وجلب سجلات `/api/erp/employees/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 91 | **PUT** | `/api/erp/employees/[id]` | تحديث بيانات السجل في `/api/erp/employees/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 92 | **DELETE** | `/api/erp/employees/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/employees/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 93 | **GET** | `/api/erp/expenses` | استعلام وجلب سجلات `/api/erp/expenses` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 94 | **POST** | `/api/erp/expenses` | إنشاء أو معالجة سجل جديد في `/api/erp/expenses` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 95 | **GET** | `/api/erp/expenses/[id]` | استعلام وجلب سجلات `/api/erp/expenses/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 96 | **PUT** | `/api/erp/expenses/[id]` | تحديث بيانات السجل في `/api/erp/expenses/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 97 | **DELETE** | `/api/erp/expenses/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/expenses/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 98 | **GET** | `/api/erp/financial-statements` | استعلام وجلب سجلات `/api/erp/financial-statements` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 99 | **GET** | `/api/erp/fiscal-periods` | استعلام وجلب سجلات `/api/erp/fiscal-periods` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 100 | **POST** | `/api/erp/fiscal-periods` | إنشاء أو معالجة سجل جديد في `/api/erp/fiscal-periods` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 101 | **PUT** | `/api/erp/fiscal-periods/[id]` | تحديث بيانات السجل في `/api/erp/fiscal-periods/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 102 | **GET** | `/api/erp/fiscal-years` | استعلام وجلب سجلات `/api/erp/fiscal-years` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 103 | **POST** | `/api/erp/fiscal-years` | إنشاء أو معالجة سجل جديد في `/api/erp/fiscal-years` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 104 | **GET** | `/api/erp/general-definitions` | استعلام وجلب سجلات `/api/erp/general-definitions` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 105 | **POST** | `/api/erp/general-definitions` | إنشاء أو معالجة سجل جديد في `/api/erp/general-definitions` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 106 | **PUT** | `/api/erp/general-definitions/[id]` | تحديث بيانات السجل في `/api/erp/general-definitions/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 107 | **DELETE** | `/api/erp/general-definitions/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/general-definitions/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 108 | **GET** | `/api/erp/goods-receipts` | استعلام وجلب سجلات `/api/erp/goods-receipts` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 109 | **POST** | `/api/erp/goods-receipts` | إنشاء أو معالجة سجل جديد في `/api/erp/goods-receipts` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 110 | **GET** | `/api/erp/goods-receipts/[id]` | استعلام وجلب سجلات `/api/erp/goods-receipts/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 111 | **PUT** | `/api/erp/goods-receipts/[id]` | تحديث بيانات السجل في `/api/erp/goods-receipts/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 112 | **DELETE** | `/api/erp/goods-receipts/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/goods-receipts/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 113 | **GET** | `/api/erp/inventory-adjustments` | استعلام وجلب سجلات `/api/erp/inventory-adjustments` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 114 | **POST** | `/api/erp/inventory-adjustments` | إنشاء أو معالجة سجل جديد في `/api/erp/inventory-adjustments` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 115 | **GET** | `/api/erp/inventory-adjustments/[id]` | استعلام وجلب سجلات `/api/erp/inventory-adjustments/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 116 | **PUT** | `/api/erp/inventory-adjustments/[id]` | تحديث بيانات السجل في `/api/erp/inventory-adjustments/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 117 | **DELETE** | `/api/erp/inventory-adjustments/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/inventory-adjustments/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 118 | **GET** | `/api/erp/inventory-incoming` | استعلام وجلب سجلات `/api/erp/inventory-incoming` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 119 | **POST** | `/api/erp/inventory-incoming` | إنشاء أو معالجة سجل جديد في `/api/erp/inventory-incoming` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 120 | **GET** | `/api/erp/inventory-outgoing` | استعلام وجلب سجلات `/api/erp/inventory-outgoing` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 121 | **POST** | `/api/erp/inventory-outgoing` | إنشاء أو معالجة سجل جديد في `/api/erp/inventory-outgoing` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 122 | **GET** | `/api/erp/inventory-requisitions` | استعلام وجلب سجلات `/api/erp/inventory-requisitions` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 123 | **POST** | `/api/erp/inventory-requisitions` | إنشاء أو معالجة سجل جديد في `/api/erp/inventory-requisitions` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 124 | **PUT** | `/api/erp/inventory-requisitions/[id]` | تحديث بيانات السجل في `/api/erp/inventory-requisitions/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 125 | **GET** | `/api/erp/inventory-transfers` | استعلام وجلب سجلات `/api/erp/inventory-transfers` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 126 | **POST** | `/api/erp/inventory-transfers` | إنشاء أو معالجة سجل جديد في `/api/erp/inventory-transfers` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 127 | **GET** | `/api/erp/job-positions` | استعلام وجلب سجلات `/api/erp/job-positions` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 128 | **GET** | `/api/erp/journal-entries` | استعلام وجلب سجلات `/api/erp/journal-entries` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 129 | **POST** | `/api/erp/journal-entries` | إنشاء أو معالجة سجل جديد في `/api/erp/journal-entries` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 130 | **GET** | `/api/erp/journal-entries/[id]` | استعلام وجلب سجلات `/api/erp/journal-entries/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 131 | **POST** | `/api/erp/journal-entries/[id]` | إنشاء أو معالجة سجل جديد في `/api/erp/journal-entries/[id]` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 132 | **GET** | `/api/erp/journals` | استعلام وجلب سجلات `/api/erp/journals` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 133 | **POST** | `/api/erp/journals` | إنشاء أو معالجة سجل جديد في `/api/erp/journals` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 134 | **GET** | `/api/erp/leave-requests` | استعلام وجلب سجلات `/api/erp/leave-requests` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 135 | **POST** | `/api/erp/leave-requests` | إنشاء أو معالجة سجل جديد في `/api/erp/leave-requests` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 136 | **GET** | `/api/erp/leave-requests/[id]` | استعلام وجلب سجلات `/api/erp/leave-requests/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 137 | **PUT** | `/api/erp/leave-requests/[id]` | تحديث بيانات السجل في `/api/erp/leave-requests/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 138 | **DELETE** | `/api/erp/leave-requests/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/leave-requests/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 139 | **GET** | `/api/erp/notifications` | استعلام وجلب سجلات `/api/erp/notifications` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 140 | **POST** | `/api/erp/notifications` | إنشاء أو معالجة سجل جديد في `/api/erp/notifications` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 141 | **PATCH** | `/api/erp/notifications` | تحديث بيانات السجل في `/api/erp/notifications` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 142 | **PUT** | `/api/erp/notifications/[id]` | تحديث بيانات السجل في `/api/erp/notifications/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 143 | **DELETE** | `/api/erp/notifications/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/notifications/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 144 | **PATCH** | `/api/erp/notifications/[id]` | تحديث بيانات السجل في `/api/erp/notifications/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 145 | **GET** | `/api/erp/org-structure` | استعلام وجلب سجلات `/api/erp/org-structure` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 146 | **POST** | `/api/erp/org-structure` | إنشاء أو معالجة سجل جديد في `/api/erp/org-structure` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 147 | **PUT** | `/api/erp/org-structure` | تحديث بيانات السجل في `/api/erp/org-structure` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 148 | **PATCH** | `/api/erp/org-structure` | تحديث بيانات السجل في `/api/erp/org-structure` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 149 | **DELETE** | `/api/erp/org-structure` | حذف أو إلغاء تفعيل السجل في `/api/erp/org-structure` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 150 | **GET** | `/api/erp/partners` | استعلام وجلب سجلات `/api/erp/partners` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 151 | **POST** | `/api/erp/partners` | إنشاء أو معالجة سجل جديد في `/api/erp/partners` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 152 | **GET** | `/api/erp/partners/[id]` | استعلام وجلب سجلات `/api/erp/partners/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 153 | **PUT** | `/api/erp/partners/[id]` | تحديث بيانات السجل في `/api/erp/partners/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 154 | **DELETE** | `/api/erp/partners/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/partners/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 155 | **GET** | `/api/erp/payroll-runs` | استعلام وجلب سجلات `/api/erp/payroll-runs` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 156 | **POST** | `/api/erp/payroll-runs` | إنشاء أو معالجة سجل جديد في `/api/erp/payroll-runs` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 157 | **GET** | `/api/erp/payroll-runs/[id]` | استعلام وجلب سجلات `/api/erp/payroll-runs/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 158 | **PUT** | `/api/erp/payroll-runs/[id]` | تحديث بيانات السجل في `/api/erp/payroll-runs/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 159 | **DELETE** | `/api/erp/payroll-runs/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/payroll-runs/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 160 | **GET** | `/api/erp/production-orders` | استعلام وجلب سجلات `/api/erp/production-orders` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 161 | **POST** | `/api/erp/production-orders` | إنشاء أو معالجة سجل جديد في `/api/erp/production-orders` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 162 | **GET** | `/api/erp/production-orders/[id]` | استعلام وجلب سجلات `/api/erp/production-orders/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 163 | **PUT** | `/api/erp/production-orders/[id]` | تحديث بيانات السجل في `/api/erp/production-orders/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 164 | **DELETE** | `/api/erp/production-orders/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/production-orders/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 165 | **GET** | `/api/erp/products` | استعلام وجلب سجلات `/api/erp/products` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 166 | **POST** | `/api/erp/products` | إنشاء أو معالجة سجل جديد في `/api/erp/products` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 167 | **GET** | `/api/erp/products/[id]` | استعلام وجلب سجلات `/api/erp/products/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 168 | **PUT** | `/api/erp/products/[id]` | تحديث بيانات السجل في `/api/erp/products/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 169 | **DELETE** | `/api/erp/products/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/products/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 170 | **GET** | `/api/erp/purchase-credit-notes` | استعلام وجلب سجلات `/api/erp/purchase-credit-notes` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 171 | **POST** | `/api/erp/purchase-credit-notes` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-credit-notes` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 172 | **GET** | `/api/erp/purchase-credit-notes/[id]` | استعلام وجلب سجلات `/api/erp/purchase-credit-notes/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 173 | **PUT** | `/api/erp/purchase-credit-notes/[id]` | تحديث بيانات السجل في `/api/erp/purchase-credit-notes/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 174 | **DELETE** | `/api/erp/purchase-credit-notes/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-credit-notes/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 175 | **GET** | `/api/erp/purchase-invoices` | استعلام وجلب سجلات `/api/erp/purchase-invoices` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 176 | **POST** | `/api/erp/purchase-invoices` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-invoices` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 177 | **GET** | `/api/erp/purchase-invoices/[id]` | استعلام وجلب سجلات `/api/erp/purchase-invoices/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 178 | **PUT** | `/api/erp/purchase-invoices/[id]` | تحديث بيانات السجل في `/api/erp/purchase-invoices/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 179 | **DELETE** | `/api/erp/purchase-invoices/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-invoices/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 180 | **POST** | `/api/erp/purchase-invoices/[id]` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-invoices/[id]` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 181 | **GET** | `/api/erp/purchase-orders` | استعلام وجلب سجلات `/api/erp/purchase-orders` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 182 | **POST** | `/api/erp/purchase-orders` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-orders` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 183 | **GET** | `/api/erp/purchase-orders/[id]` | استعلام وجلب سجلات `/api/erp/purchase-orders/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 184 | **PUT** | `/api/erp/purchase-orders/[id]` | تحديث بيانات السجل في `/api/erp/purchase-orders/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 185 | **DELETE** | `/api/erp/purchase-orders/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-orders/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 186 | **GET** | `/api/erp/purchase-payments` | استعلام وجلب سجلات `/api/erp/purchase-payments` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 187 | **POST** | `/api/erp/purchase-payments` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-payments` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 188 | **POST** | `/api/erp/purchase-payments/[id]/reverse` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-payments/[id]/reverse` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 189 | **GET** | `/api/erp/purchase-payments/[id]` | استعلام وجلب سجلات `/api/erp/purchase-payments/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 190 | **PATCH** | `/api/erp/purchase-payments/[id]` | تحديث بيانات السجل في `/api/erp/purchase-payments/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 191 | **PUT** | `/api/erp/purchase-payments/[id]` | تحديث بيانات السجل في `/api/erp/purchase-payments/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 192 | **DELETE** | `/api/erp/purchase-payments/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-payments/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 193 | **GET** | `/api/erp/purchase-requests` | استعلام وجلب سجلات `/api/erp/purchase-requests` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 194 | **POST** | `/api/erp/purchase-requests` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-requests` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 195 | **GET** | `/api/erp/purchase-requests/[id]` | استعلام وجلب سجلات `/api/erp/purchase-requests/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 196 | **PUT** | `/api/erp/purchase-requests/[id]` | تحديث بيانات السجل في `/api/erp/purchase-requests/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 197 | **DELETE** | `/api/erp/purchase-requests/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-requests/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 198 | **GET** | `/api/erp/purchase-returns` | استعلام وجلب سجلات `/api/erp/purchase-returns` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 199 | **POST** | `/api/erp/purchase-returns` | إنشاء أو معالجة سجل جديد في `/api/erp/purchase-returns` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 200 | **GET** | `/api/erp/purchase-returns/[id]` | استعلام وجلب سجلات `/api/erp/purchase-returns/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 201 | **PUT** | `/api/erp/purchase-returns/[id]` | تحديث بيانات السجل في `/api/erp/purchase-returns/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 202 | **DELETE** | `/api/erp/purchase-returns/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/purchase-returns/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 203 | **GET** | `/api/erp/reason-codes` | استعلام وجلب سجلات `/api/erp/reason-codes` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 204 | **GET** | `/api/erp/revenues` | استعلام وجلب سجلات `/api/erp/revenues` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 205 | **POST** | `/api/erp/revenues` | إنشاء أو معالجة سجل جديد في `/api/erp/revenues` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 206 | **GET** | `/api/erp/revenues/[id]` | استعلام وجلب سجلات `/api/erp/revenues/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 207 | **PUT** | `/api/erp/revenues/[id]` | تحديث بيانات السجل في `/api/erp/revenues/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 208 | **DELETE** | `/api/erp/revenues/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/revenues/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 209 | **GET** | `/api/erp/roles` | استعلام وجلب سجلات `/api/erp/roles` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 210 | **POST** | `/api/erp/roles` | إنشاء أو معالجة سجل جديد في `/api/erp/roles` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 211 | **GET** | `/api/erp/roles/[id]` | استعلام وجلب سجلات `/api/erp/roles/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 212 | **PUT** | `/api/erp/roles/[id]` | تحديث بيانات السجل في `/api/erp/roles/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 213 | **DELETE** | `/api/erp/roles/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/roles/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 214 | **GET** | `/api/erp/safes` | استعلام وجلب سجلات `/api/erp/safes` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 215 | **POST** | `/api/erp/safes` | إنشاء أو معالجة سجل جديد في `/api/erp/safes` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 216 | **GET** | `/api/erp/safes/[id]` | استعلام وجلب سجلات `/api/erp/safes/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 217 | **PUT** | `/api/erp/safes/[id]` | تحديث بيانات السجل في `/api/erp/safes/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 218 | **DELETE** | `/api/erp/safes/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/safes/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 219 | **GET** | `/api/erp/sales-credit-notes` | استعلام وجلب سجلات `/api/erp/sales-credit-notes` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 220 | **POST** | `/api/erp/sales-credit-notes` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-credit-notes` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 221 | **GET** | `/api/erp/sales-credit-notes/[id]` | استعلام وجلب سجلات `/api/erp/sales-credit-notes/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 222 | **PUT** | `/api/erp/sales-credit-notes/[id]` | تحديث بيانات السجل في `/api/erp/sales-credit-notes/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 223 | **DELETE** | `/api/erp/sales-credit-notes/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-credit-notes/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 224 | **GET** | `/api/erp/sales-invoices` | استعلام وجلب سجلات `/api/erp/sales-invoices` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 225 | **POST** | `/api/erp/sales-invoices` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-invoices` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 226 | **GET** | `/api/erp/sales-invoices/[id]` | استعلام وجلب سجلات `/api/erp/sales-invoices/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 227 | **PUT** | `/api/erp/sales-invoices/[id]` | تحديث بيانات السجل في `/api/erp/sales-invoices/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 228 | **DELETE** | `/api/erp/sales-invoices/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-invoices/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 229 | **GET** | `/api/erp/sales-orders` | استعلام وجلب سجلات `/api/erp/sales-orders` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 230 | **POST** | `/api/erp/sales-orders` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-orders` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 231 | **GET** | `/api/erp/sales-orders/[id]` | استعلام وجلب سجلات `/api/erp/sales-orders/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 232 | **PUT** | `/api/erp/sales-orders/[id]` | تحديث بيانات السجل في `/api/erp/sales-orders/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 233 | **DELETE** | `/api/erp/sales-orders/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-orders/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 234 | **GET** | `/api/erp/sales-payments` | استعلام وجلب سجلات `/api/erp/sales-payments` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 235 | **POST** | `/api/erp/sales-payments` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-payments` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 236 | **POST** | `/api/erp/sales-payments/[id]/reverse` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-payments/[id]/reverse` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 237 | **GET** | `/api/erp/sales-payments/[id]` | استعلام وجلب سجلات `/api/erp/sales-payments/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 238 | **PUT** | `/api/erp/sales-payments/[id]` | تحديث بيانات السجل في `/api/erp/sales-payments/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 239 | **DELETE** | `/api/erp/sales-payments/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-payments/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 240 | **GET** | `/api/erp/sales-quotations` | استعلام وجلب سجلات `/api/erp/sales-quotations` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 241 | **POST** | `/api/erp/sales-quotations` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-quotations` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 242 | **GET** | `/api/erp/sales-quotations/[id]` | استعلام وجلب سجلات `/api/erp/sales-quotations/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 243 | **PUT** | `/api/erp/sales-quotations/[id]` | تحديث بيانات السجل في `/api/erp/sales-quotations/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 244 | **DELETE** | `/api/erp/sales-quotations/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-quotations/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 245 | **GET** | `/api/erp/sales-returns` | استعلام وجلب سجلات `/api/erp/sales-returns` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 246 | **POST** | `/api/erp/sales-returns` | إنشاء أو معالجة سجل جديد في `/api/erp/sales-returns` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 247 | **GET** | `/api/erp/sales-returns/[id]` | استعلام وجلب سجلات `/api/erp/sales-returns/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 248 | **PUT** | `/api/erp/sales-returns/[id]` | تحديث بيانات السجل في `/api/erp/sales-returns/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 249 | **DELETE** | `/api/erp/sales-returns/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/sales-returns/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 250 | **GET** | `/api/erp/settings/audit` | استعلام وجلب سجلات `/api/erp/settings/audit` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 251 | **GET** | `/api/erp/settings` | استعلام وجلب سجلات `/api/erp/settings` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 252 | **PUT** | `/api/erp/settings` | تحديث بيانات السجل في `/api/erp/settings` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 253 | **POST** | `/api/erp/settings` | إنشاء أو معالجة سجل جديد في `/api/erp/settings` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 254 | **GET** | `/api/erp/stock-locations` | استعلام وجلب سجلات `/api/erp/stock-locations` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 255 | **POST** | `/api/erp/stock-locations` | إنشاء أو معالجة سجل جديد في `/api/erp/stock-locations` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 256 | **GET** | `/api/erp/stock-locations/[id]` | استعلام وجلب سجلات `/api/erp/stock-locations/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 257 | **PUT** | `/api/erp/stock-locations/[id]` | تحديث بيانات السجل في `/api/erp/stock-locations/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 258 | **DELETE** | `/api/erp/stock-locations/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/stock-locations/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 259 | **GET** | `/api/erp/stock-moves` | استعلام وجلب سجلات `/api/erp/stock-moves` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 260 | **GET** | `/api/erp/stock-on-hand` | استعلام وجلب سجلات `/api/erp/stock-on-hand` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 261 | **GET** | `/api/erp/stock-quants` | استعلام وجلب سجلات `/api/erp/stock-quants` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 262 | **GET** | `/api/erp/stock-takes` | استعلام وجلب سجلات `/api/erp/stock-takes` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 263 | **POST** | `/api/erp/stock-takes` | إنشاء أو معالجة سجل جديد في `/api/erp/stock-takes` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 264 | **GET** | `/api/erp/stock-takes/[id]` | استعلام وجلب سجلات `/api/erp/stock-takes/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 265 | **PUT** | `/api/erp/stock-takes/[id]` | تحديث بيانات السجل في `/api/erp/stock-takes/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 266 | **DELETE** | `/api/erp/stock-takes/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/stock-takes/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 267 | **GET** | `/api/erp/stock-transfers` | استعلام وجلب سجلات `/api/erp/stock-transfers` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 268 | **POST** | `/api/erp/stock-transfers` | إنشاء أو معالجة سجل جديد في `/api/erp/stock-transfers` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 269 | **GET** | `/api/erp/stock-transfers/[id]` | استعلام وجلب سجلات `/api/erp/stock-transfers/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 270 | **PUT** | `/api/erp/stock-transfers/[id]` | تحديث بيانات السجل في `/api/erp/stock-transfers/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 271 | **DELETE** | `/api/erp/stock-transfers/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/stock-transfers/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 272 | **GET** | `/api/erp/storehouses` | استعلام وجلب سجلات `/api/erp/storehouses` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 273 | **POST** | `/api/erp/storehouses` | إنشاء أو معالجة سجل جديد في `/api/erp/storehouses` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 274 | **GET** | `/api/erp/storehouses/[id]` | استعلام وجلب سجلات `/api/erp/storehouses/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 275 | **PUT** | `/api/erp/storehouses/[id]` | تحديث بيانات السجل في `/api/erp/storehouses/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 276 | **DELETE** | `/api/erp/storehouses/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/storehouses/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 277 | **GET** | `/api/erp/users` | استعلام وجلب سجلات `/api/erp/users` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 278 | **POST** | `/api/erp/users` | إنشاء أو معالجة سجل جديد في `/api/erp/users` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 279 | **GET** | `/api/erp/users/[id]` | استعلام وجلب سجلات `/api/erp/users/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 280 | **PUT** | `/api/erp/users/[id]` | تحديث بيانات السجل في `/api/erp/users/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 281 | **DELETE** | `/api/erp/users/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/users/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 282 | **GET** | `/api/erp/warehouses` | استعلام وجلب سجلات `/api/erp/warehouses` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 283 | **POST** | `/api/erp/warehouses` | إنشاء أو معالجة سجل جديد في `/api/erp/warehouses` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 284 | **GET** | `/api/erp/warehouses/[id]` | استعلام وجلب سجلات `/api/erp/warehouses/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 285 | **PUT** | `/api/erp/warehouses/[id]` | تحديث بيانات السجل في `/api/erp/warehouses/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 286 | **DELETE** | `/api/erp/warehouses/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/warehouses/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |
| 287 | **GET** | `/api/erp/work-centers` | استعلام وجلب سجلات `/api/erp/work-centers` | Query Parameters (search, page, limit, filter) | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 288 | **POST** | `/api/erp/work-centers` | إنشاء أو معالجة سجل جديد في `/api/erp/work-centers` | JSON Body (بيانات السجل الجديد) | `{ success: true, data: { id, code, ... } }` | عام / مصادقة الجلسة |
| 289 | **GET** | `/api/erp/work-centers/[id]` | استعلام وجلب سجلات `/api/erp/work-centers/[id]` | None | `{ success: true, data: Array | Object }` | عام / مصادقة الجلسة |
| 290 | **PUT** | `/api/erp/work-centers/[id]` | تحديث بيانات السجل في `/api/erp/work-centers/[id]` | JSON Body (الحقول المطلوب تعديلها) | `{ success: true, updated: true }` | عام / مصادقة الجلسة |
| 291 | **DELETE** | `/api/erp/work-centers/[id]` | حذف أو إلغاء تفعيل السجل في `/api/erp/work-centers/[id]` | ID in URL or Query | `{ success: true, deleted: true }` | عام / مصادقة الجلسة |

---

# 6️⃣ تحليل منطق الأعمال والعمليات (Business Logic & Workflows)

## 6.1 محرك الترحيل المحاسبي المركزي (Ledger-Centric Posting Engine)
تعتمد المنظومة المالية على قاعدة ذهبية تنص على أن **جميع التأثيرات المالية في النظام تمر حتماً عبر محرك الترحيل المركزي (`src/lib/erp/accounting-engine.ts`)**. لا يُسمح لأي موديول (مبيعات، مشتريات، مخازن، رواتب) بالكتابة المباشرة في دفتر الأستاذ.

### المبادئ الحاكمة للترحيل (Mandatory Architectural Principles):
1. **توازن القيد الحتمي (BR-FIN-001):** يجب أن يتساوى إجمالي المدين مع إجمالي الدائن بدقة مطلقة (`Math.abs(Debit - Credit) < 0.01`).
2. **التحقق من الفترات المالية (BR-FIN-002):** رفض الترحيل في أي فترة مالية مغلقة (`state === 'closed'`).
3. **تحديد الحسابات دلالياً (Semantic Role Determination / ADR-CoA-001):** لا توجد أكواد حسابات ثابتة في الكود البرمجي؛ يتم توجيه الأسطر باستخدام الأدوار (`CUSTOMER_RECEIVABLE`, `SALES`, `TAX_PAYABLE`, إلخ) وترجمتها ديناميكياً حسب الشركة والفرع.
4. **حظر الترحيل على الحسابات المجمعة أو غير النشطة (BR-COA-001..003):** الترحيل مسموح فقط على الحسابات الفرعية النشطة (`isPosting: true, active: true`).
5. **المعاملة الذرية الواحدة (Atomic Transaction):** إنشاء القيد + أسطر القيد + تحديث الأرصدة التراكمية للحسابات + تسجيل التدقيق الأمني يتم داخل معاملة بريزما واحدة (`db.$transaction`).
6. **عدم قابلية التعديل (Immutable Ledger / ADR-018):** القيود المرحلة لا تُعدل ولا تُحذف نهائياً. التصحيح يتم فقط عبر **القيد العكسي المرآتي (Mirror Reversal)**.

```mermaid
flowchart TD
    Start([بدء عملية الترحيل المحاسبي]) --> ValidateLines[التحقق من عدد الأسطر لا يقل عن سطرين]
    ValidateLines --> CheckBalance{هل مجموع المدين = مجموع الدائن؟}
    CheckBalance -- لا --> ThrowUnbalanced[إرجاع خطأ: القيد غير متوازن]
    CheckBalance -- نعم --> ResolveRoles[تحديد الحسابات الدلالية عبر جدول الربط]
    ResolveRoles --> GuardCheck{فحص الحسابات: فرعية ونشطة؟}
    GuardCheck -- لا --> ThrowInvalidAccount[إرجاع خطأ: حساب مجمع أو غير نشط]
    GuardCheck -- نعم --> CheckPeriod{هل الفترة المالية مفتوحة؟}
    CheckPeriod -- لا --> ThrowPeriodClosed[إرجاع خطأ: الفترة المالية مغلقة]
    CheckPeriod -- نعم --> BeginTx[فتح معاملة ذرية db.$transaction]
    BeginTx --> GenNumber[توليد رقم تسلسلي غير مكرر للقيد]
    GenNumber --> CreateEntry[إنشاء JournalEntry + JournalLines]
    CreateEntry --> UpdateBalances[تحديث الأرصدة المجمعة للحسابات دفعة واحدة]
    UpdateBalances --> WriteAudit[تسجيل العملية في سجل التدقيق AuditLog]
    WriteAudit --> CommitTx[تثبيت المعاملة]
    CommitTx --> Success([اكتمال الترحيل بنجاح])
```

---

## 6.2 دورة المبيعات والعملاء (Sales Lifecycle)

```mermaid
flowchart LR
    SQ[عرض سعر Quotation] --> SO[أمر بيع Sales Order]
    SO --> DO[إذن تسليم Delivery Order]
    DO --> SI[فاتورة مبيعات Sales Invoice]
    SI --> SP[سند قبض Sales Payment]
    SI -. في حال الإرجاع .-> SR[مرتجع مبيعات Sales Return]
    SR --> SCN[إشعار دائن Credit Note]
```

- **عرض السعر (Sales Quotation):** مستند مبدئي قابل للتحويل لأمر بيع.
- **أمر البيع (Sales Order):** حجز الكميات المطلوبة في المستودع وتأكيد السعر والشروط.
- **إذن التسليم (Delivery Order):** خروج البضاعة من المستودع وتوليد قيد تكلفة البضاعة المباعة تلقائياً:
  - **من حـ/ تكلفة البضاعة المباعة (COGS)**
  - **إلى حـ/ المخزون (Inventory)**
- **فاتورة المبيعات (Sales Invoice):** استحقاق المديونية وتوليد القيد الضريبي:
  - **من حـ/ العملاء (AR) [بالإجمالي]**
  - **إلى حـ/ إيرادات المبيعات (Sales Revenue) [بالصافي]**
  - **إلى حـ/ ضريبة القيمة المضافة المستحقة (Output VAT) [بقيمة الضريبة]**
- **سند القبض (Sales Payment):** تسوية مديونية العميل:
  - **من حـ/ النقدية أو البنك (Cash/Bank)**
  - **إلى حـ/ العملاء (AR)**

---

## 6.3 دورة المشتريات والمطابقة الثلاثية (Procurement & 3-Way Matching)

```mermaid
flowchart LR
    PR[طلب شراء Purchase Request] --> PO[أمر شراء Purchase Order]
    PO --> GRN[استلام بضاعة Goods Receipt]
    GRN --> PI[فاتورة مورد Purchase Invoice]
    PI --> Matching{المطابقة الثلاثية 3-Way Match}
    Matching -- متطابق --> PP[سند صرف Purchase Payment]
    Matching -- غير متطابق --> Hold[إيقاف الصرف للمراجعة]
```

- **المطابقة الثلاثية:** التحقق التلقائي من تطابق (أمر الشراء PO) مع (محضر استلام المخزن GRN) مع (فاتورة المورد PI) في الكميات والأسعار.
- **قيد استلام المخزن (GRN):**
  - **من حـ/ المخزون (Inventory)**
  - **إلى حـ/ بضاعة مستلمة غير مفوترة (GRNI / Clearing)**
- **قيد فاتورة المشتريات (PI):**
  - **من حـ/ بضاعة مستلمة غير مفوترة (GRNI) أو المشتريات**
  - **من حـ/ ضريبة القيمة المضافة مدخلات (Input VAT)**
  - **إلى حـ/ الموردين (Accounts Payable)**

---

## 6.4 دورة حركة وتقييم المخزون (Append-Only Inventory Ledger)
- يطبق النظام معيار **ADR-007 (Append-Only Inventory Ledger)**؛ حيث لا يتم تعديل جدول حركات المخزون (`StockMove`) إطلاقاً، بل تُسجل حركات تسوية تعويضية.
- طريقة التقييم المعتمدة هي الوارد أولاً صادر أولاً (**FIFO**) مع دعم المتوسط المرجح (**AVCO**) عبر طبقات التقييم (`StockValuationLayer`).
- تتبع المخزون يدعم أرقام التشغيلات (`StockLot`) وتواريخ انتهاء الصلاحية للمنتجات الغذائية والطبية.

---

## 6.5 دورة الإنتاج والتصنيع (Manufacturing & BOM)

```mermaid
flowchart TD
    BOM[قائمة تركيب المواد BOM] --> ProdOrder[أمر الإنتاج Production Order]
    ProdOrder --> RawIssue[صرف المواد الخام للتشغيل]
    RawIssue --> WIP_Entry[قيد: من حـ/ تحت التشغيل WIP إلى حـ/ المواد الخام]
    WIP_Entry --> Operation[التشغيل في مراكز العمل Work Centers]
    Operation --> FG_Receipt[استلام المنتج التام Finished Goods]
    FG_Receipt --> FG_Entry[قيد: من حـ/ بضاعة جاهزة FG إلى حـ/ تحت التشغيل WIP]
```

---

## 6.6 نظام حوكمة الإعدادات والتشفير (Config Governance Engine)
يحتوي النظام على محرك مركزي فائق الأمان لإدارة إعدادات النظام (`src/lib/config/`):
- **14 قطاعاً وظيفياً و60 ورقة إعدادات** تغطي المؤسسة، الضرائب، الطباعة، النسخ، والمطابقة.
- **التدرج الهرمي للإعدادات:** الفرع المحدد $	o$ الشركة المحددة $	o$ الإعداد العام للنظام.
- **التشفير المؤسسي:** تشفير كلمات مرور SMTP، مفاتيح الـ APIs، وأسرار الربط تلقائياً بخوارزمية **AES-256-GCM** قبل حفظها في قاعدة البيانات، مع منع ظهورها نهائياً في سجلات التدقيق.
- **سجل تدقيق الإعدادات (`SettingAuditLog`):** تتبع تفصيلي لكل قيمة قديمة وحديثة، وهوية المستخدم، وعنوان الـ IP والمتصفح.

---

# 7️⃣ نظام الأمان والصلاحيات وعزل البيانات (Auth, RBAC & Multi-Tenancy)

## 7.1 المصادقة وإدارة الجلسات (NextAuth & scrypt Hashing)
- **آلية المصادقة:** مبنية على **NextAuth.js v4** عبر مزود الاعتماد المخصص (`CredentialsProvider`).
- **تجزئة كلمات المرور:** استخدام خوارزمية **scrypt** فائقة الأمان لمقاومة هجمات القوة الغاشمة (Brute-Force) مع ملح عشوائي (Random Salt) ومعايير تجزئة مشددة (`N=16384, r=8, p=1`).
- **إدارة الجلسات:** استخدام رموز التوكن المشفرة المتوافقة مع معايير الويب الحديثة.

---

## 7.2 التحكم بالوصول المبني على الأدوار (RBAC + ABAC Data Scoping)
- يدعم النظام دمجاً فريداً بين التحكم المبني على الأدوار (**RBAC**) والتحكم المبني على السمات ونطاقات البيانات (**ABAC Data Scopes**):
- **نطاقات البيانات المتاحة لكل صلاحية:**
  - `own`: الاطلاع على العمليات التي أنشأها المستخدم فقط.
  - `team`: الاطلاع على عمليات القسم أو الفريق.
  - `branch`: الاطلاع على كافة عمليات الفرع المعين له.
  - `company`: الاطلاع على عمليات الشركة كاملة عبر فروعها.
  - `all`: صلاحية سيادية متعددة الشركات (Super Admin).
- **مصفوفة الإمكانيات:** (`canRead`, `canCreate`, `canUpdate`, `canDelete`, `canApprove`, `canPost`, `canCancel`, `canReverse`, `canPrint`, `canExport`, `canImport`).

---

## 7.3 عزل الشركات والفروع ودفاع IDOR
يطبق النظام في ملف `src/lib/erp/rbac.ts` ستة ضوابط أمنية إلزامية لا يمكن تجاوزها:
1. **استخلاص الهوية والشركة حصرياً من جلسة السيرفر الموثقة:** يتم تجاهل أي `companyId` أو `userId` مرسل في الـ Body لحماية النظام من التزوير.
2. **عزل استعلامات قاعدة البيانات تلقائياً (`scopedWhere`):** حقن قيد `companyId` و `branchId` تلقائياً في كافة استعلامات القراءة والكتابة.
3. **التحقق من سلامة المفاتيح الخارجية عبر الشركات (`verifyTenantForeignKeys`):** التأكد من أن العميل، المستودع، الحساب، والمنتج ينتمون لنفس الشركة قبل تنفيذ أي معاملة.
4. **دفاع مكافحة استكشاف المعرفات غير المباشرة (IDOR Anti-Enumeration):** عند محاولة مستخدم الوصول لسجل لا ينتمي لشركته، يرجع النظام استجابة **404 Not Found** بدلاً من 403 لمنع المهاجم من تخمين أرقام ومعرفات السجلات.

---

## 7.4 البرمجيات الوسيطة وحماية المسارات (Middleware & Proxy)
- يدير الملف `src/proxy.ts` فحص جميع الطلبات الواردة إلى السيرفر.
- حماية كافة المسارات باستثناء المسارات العامة (`/login`, `/api/auth`, الأصول الساكنة).
- معالجة طلبات الـ API غير المصرح بها وإرجاع كود **401 JSON** صريح بدلاً من إعادة التوجيه بصفحة HTML.

---

# 8️⃣ التبعيات والإعدادات التشغيلية (Dependencies & Config)

## 8.1 تحليل مكتبات package.json

### التبعيات الأساسية (Dependencies):
| الحزمة (Package) | الإصدار | الوصف والدور التقني في النظام |
|------------------|---------|-------------------------------|
| `next` | `^16.1.1` | إطار العمل الرئيسي لتطبيقات الويب الحديثة من Vercel |
| `react` / `react-dom` | `^19.0.0` | مكتبة واجهات المستخدم بأحدث معايير React 19 |
| `@prisma/client` | `^6.11.1` | عميل الوصول لقاعدة البيانات وعلاقات النماذج |
| `next-auth` | `^4.24.11` | إدارة المصادقة والجلسات للمستخدمين |
| `zustand` | `^5.0.6` | إدارة الحالة الخفيفة وسريعة الأداء للواجهات |
| `@tanstack/react-query` | `^5.82.0` | إدارة استعلامات الخادم والتخزين المؤقت للبيانات |
| `@tanstack/react-table` | `^8.21.3` | المحرك المسؤول عن بناء الجداول المتقدمة |
| `tailwindcss` | `^4.0` | إطار عمل التنسيقات السريعة بتنسيق CSS متطور |
| `lucide-react` | `^0.525.0` | حزمة أيقونات ناقلة حديثة وعالية الجودة |
| `recharts` | `^2.15.4` | مكتبة الرسوم والمخططات البيانية التفاعلية |
| `exceljs` | `^4.4.0` | توليد وتصدير ملفات إكسل منسقة ومعقدة |
| `framer-motion` | `^12.23.2` | مكتبة التحريك والرسوم الانتقالية للواجهات |
| `zod` | `^4.0.2` | مخططات التحقق من صحة البيانات وأنواع TypeScript |
| `react-hook-form` | `^7.60.0` | إدارة أداء النماذج والمدخلات في الواجهات |
| `date-fns` | `^4.1.0` | معالجة التواريخ والعمليات الزمنية |
| `sonner` | `^2.0.6` | مكتبة الإشعارات والتنبيهات العائمة الراقية |
| `@dnd-kit/core` | `^6.3.1` | دعم ميزات السحب والإفلات التفاعلية |
| `sharp` | `^0.34.3` | معالجة وضغط الصور وشعارات الشركات بكفاءة |

---

## 8.2 متغيرات البيئة (Environment Variables)
المتغيرات المطلوبة في ملف `.env`:
```bash
# سلسلة الاتصال المجمعة بقاعدة بيانات PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/orminal?pgbouncer=true

# سلسلة الاتصال المباشرة لعمليات الهجرة والبذر المباشر
DATABASE_URL_UNPOOLED=postgresql://user:password@localhost:5432/orminal

# الرابط الأساسي للنظام
NEXTAUTH_URL=http://localhost:3000

# الرمز السري لتشفير جلسات التوكن لـ NextAuth (توليد: openssl rand -base64 32)
NEXTAUTH_SECRET=your-32-byte-secret-key-here

# مفتاح تشفير أسرار وإعدادات النظام الحساسة AES-256 (توليد: openssl rand -hex 32)
CONFIG_ENCRYPTION_KEY=your-64-hex-character-key-here
```

---

## 8.3 تكوين السيرفر وخادم Caddy المعكوس
يتضمن المشروع ملف `Caddyfile` جاهزاً للتشغيل على السيرفرات السحابية:
- يقوم بإنهاء الـ SSL/TLS تلقائياً عبر Let's Encrypt.
- تحويل حركة المرور عبر البروكسي العكسي إلى منفذ خادم Next.js الداخلي (`localhost:3000`).
- ضغط البيانات (Gzip / Zstandard) لتحسين سرعة الاستجابة.

---

# 9️⃣ نقاط القوة، الثغرات والضعف، والتوصيات الهندسية

## 9.1 نقاط القوة في التصميم المعماري
1. **معمارية محاسبية رصينة (Ledger-Centric Architecture):** منع التعديل على القيود المرحلة وتطبيق القيد العكسي المرآتي يجعل النظام متوافقاً مع أكثر المعايير المالية صرامة ومقاوماً للعبث المحاسبي.
2. **عزل متعدد الشركات صارم (Rock-Solid Multi-Tenancy):** تطبيق عزل `companyId` على مستوى الجلسة والتحقق من المفاتيح الخارجية ومنع هجمات IDOR يضمن حماية بيانات الشركات الشقيقة والمستقلة.
3. **هجرة ناجحة لقاعدة البيانات الحديثة:** الانتقال من SQLite إلى PostgreSQL سحابي (Neon) وفر قدرة توسع غير محدودة ودعم المعاملات التزامنية المتعددة.
4. **تحديد الحسابات الدلالي (ADR-CoA-001):** فصل منطق الأعمال عن أرقام الحسابات الثابتة عبر ربط الأدوار (`Account Roles`) يسمح بتخصيص شجرة الحسابات لكل شركة وفرع دون لمس سطر كود واحد.
5. **حوكمة الإعدادات وتشفير الأسرار:** نظام إعدادات فريد من نوعه يحتوي على شجرة من 14 مجالاً ويدعم التشفير بمستوى البنوك (AES-256-GCM) للمعلومات الحساسة.
6. **واجهة مستخدم احترافية وشاملة:** تصميم باللغة العربية متقن بالكامل، سريع الاستجابة، مدعوم بأحدث تقنيات React 19 و Tailwind CSS v4.

---

## 9.2 نقاط الضعف والمخاطر المحتملة
1. **تعطيل فحص أخطاء TypeScript الصارم أثناء البناء:** وجود `ignoreBuildErrors: true` في `next.config.ts` يسمح بمرور أخطاء أنواع قد تتسبب في انهيارات غير متوقعة أثناء التشغيل (Runtime Exceptions).
2. **غياب صفحة خطأ مخصصة أو معالجة عامة للـ 500:** في حال حدوث خطأ غير معالج في أحد مسارات الـ API، قد تُكشف أجزاء من تتبع الخطأ (Stack Trace) للواجهة الأمامية إن لم يتم تغليفه في جميع النقاط.
3. **اعتماد الواجهة بشكل رئيسي على معمارية الصفحة الواحدة (SPA AppShell):** بالرغم من مرونة وسرعة التبديل بين الشاشات، إلا أن حصر الشاشات داخل صفحة `/` يقلل من الاستفادة من روابط URL المباشرة (Deep Linking) لكل مستند وسجل، ويحد من سهولة مشاركة رابط فاتورة محددة بين الموظفين.
4. **الاعتماد على استعلامات الترقيم التسلسلي بدون أقفال صفوف تزامنية قوية:** توليد أرقام الفواتير والقيود التسلسلية قد يواجه تنازعاً بسيطاً (Race Condition) في حال وجود ضغط هائل متزامن لإنشاء الفواتير في نفس الجزء من الثانية.

---

## 9.3 توصيات التحسين والتطوير المستقبلي
1. **تفعيل التوجيه العميق (Deep Linking & Sub-Routing):** تحديث نظام الملاحة ليدعم مسارات فرعية مثل `/sales/invoices/INV-2026-0001` لتمكين الموظفين من فتح شاشات متعددة في ألسنة تبويب جديدة ومشاركة الروابط بسهولة.
2. **إصلاح أخطاء TypeScript وتفعيل الصرامة:** مراجعة كافة ملفات المشروع وإزالة `ignoreBuildErrors` من `next.config.ts` لضمان ثبات الكود في الإنتاج بنسبة 100%.
3. **إضافة قفل تزامني (Pessimistic Locking) لجدول الترقيم التسلسلي:** استخدام استعلام `SELECT ... FOR UPDATE` في مسار توليد الأرقام لضمان عدم حدوث أي قفزة أو تكرار في الترقيم القانوني للفواتير تحت الضغط العالي.
4. **أتمتة النسخ الاحتياطي السحابي الدوري (Automated Cloud Backups):** ربط سكربت النسخ الاحتياطي بخدمة سحابية (S3 / Cloud Storage) مجدولة يومياً لضمان استمرارية الأعمال والحماية من الكوارث.
5. **الربط المباشر مع منصة فاتورة (ZATCA Phase 2):** استكمال وحدات التوقيع الرقمي (Cryptographic Stamp) ومكتبة الربط المباشر مع بوابة الزكاة والضريبة السعودية.

---

# 🔟 لوحة الإحصائيات الشاملة للنظام (Final Statistics)

```
╔═════════════════════════════════════════════════════════════════════════════╗
║                      إحصائيات نظام أورمنال ERP الشاملة                      ║
╠═════════════════════════════════════════════════════════════════════════════╣
║  📊 عدد جداول / نماذج قاعدة البيانات (Prisma Models)  : 93 جدولاً          ║
║  🌐 عدد ملفات مسارات الـ API (API Route Files)        : 133 ملفاً           ║
║  ⚡ عدد نقاط النهاية البرمجية (HTTP Endpoints)       : 291 نقطة نهاية      ║
║  🖥️ عدد شاشات وموديولات النظام التشغيلية             : 68 موديولاً         ║
║  🔘 عدد الأزرار والإجراءات التفاعلية المرصودة          : 551 زراً وإجراءً    ║
║  🧩 إجمالي ملفات المكونات البرمجية (UI Components)     : 136 ملف مكون        ║
║  👥 عدد الأدوار القياسية المدمجة في النظام            : 16 دوراً وظيفياً    ║
║  ⚙️ عدد مجالات شجرة حوكمة الإعدادات                  : 14 قطاعاً (60 فرعاً) ║
╚═════════════════════════════════════════════════════════════════════════════╝
```

---

> **خاتمة التقرير:** تم إعداد هذا التحليل الفني الشامل بناءً على الفحص الحي والمباشر لكافة ملفات الكود المصدري، ومخططات قاعدة البيانات، وسجلات التهجير، ونماذج الواجهات في مستودع مشروع **Orminal ERP**. النظام يمثل صرحاً برمجياً مؤسسياً متكاملاً جاهزاً للعمل والتشغيل الفعلي.
