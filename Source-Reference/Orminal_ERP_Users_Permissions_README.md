# Orminal ERP — Users, Roles, Permission Groups & Authorization Architecture

> **الوثيقة المرجعية المعمارية والتنفيذية الرسمية لوحدات المستخدمين والصلاحيات والأدوار والرقابة في Orminal ERP.**
>
> هذه الوثيقة ليست نسخة من Odoo وليست وصفًا عامًا لنظام RBAC. تم إعدادها لتكون مرجعًا تنفيذيًا عند تطوير Orminal، مع إلزام أي وكيل برمجي بفحص الكود الحالي وقاعدة البيانات ونظام المصادقة والصلاحيات قبل إجراء أي تعديل.

---

## 1. الغرض من الوثيقة

تهدف هذه الوثيقة إلى توحيد وفصل مفاهيم **Identity, Authentication, Authorization, Roles, Permissions, Data Scoping, Workflow Authorization, Audit** في Orminal ERP، وربطها بشجرة النظام الحالية:

```text
النظام
├── إدارة الصلاحيات
│   ├── مجموعات المستخدمين
│   ├── بيانات المستخدمين
│   ├── صلاحيات العمليات
│   ├── صلاحيات الشاشات
│   ├── صلاحيات المدخلات
│   ├── عرض الصلاحيات
│   └── الرقابة
├── المستخدمون
├── الأدوار
├── سجل التدقيق
├── الإشعارات
├── قوالب المستندات
├── الإعدادات الخاصة بالنظام
├── الملف الشخصي
├── أنواع وثائق التسلسل
├── تسلسلات العمليات
├── تنبيهات النظام
└── البيانات الإفتراضية للعمليات
```

الهدف النهائي هو أن تكون جميع قرارات الوصول الحساسة ناتجة من **Authorization Engine مركزي**، وليس من إخفاء أزرار أو قوائم في الواجهة فقط.

---

## 2. المصدر المرجعي: Odoo

تم استخدام توثيق Odoo 19 المقدم ضمن المشروع كمرجع لفهم الوظائف والمفاهيم التالية:

- Access Rights.
- Roles.
- Groups.
- Record Rules.
- Inherited/Implicit Groups.
- MFA / Two-Factor Authentication.
- Session Security.
- Portal Users.
- User Preferences.

وثيقة Odoo تشرح أن الصلاحيات يمكن ضبطها للمستخدم أو للمجموعة، وأن صلاحيات الوصول الأساسية تختلف عن قواعد السجلات، وأن بعض المجموعات يمكن أن تكون موروثة ضمنيًا. كما تغطي MFA ومهلات الجلسات والبوابة ومصادقة OAuth/LDAP. **هذه المفاهيم مرجع وظيفي فقط، ولا يجوز نسخ Models أو ORM أو أسماء الحقول أو تصميم Odoo الداخلي إلى Orminal دون ضرورة وتحليل.**

التسلسل الصحيح:

```text
Odoo Documentation
        ↓
Functional Reference
        ↓
Orminal Security Architecture
        ↓
Current Orminal Code + Current Database
        ↓
Safe Implementation
```

---

## 3. المبادئ المعمارية الأساسية

يجب فصل المفاهيم التالية بشكل صارم:

```text
User Identity
Authentication
User Membership
Role
Permission Definition
Role Permission Assignment
Data Scope
Context/ABAC Rules
Workflow Authorization
Effective Permissions
Audit
```

النموذج المفاهيمي:

```text
                         ┌──────────────┐
                         │     User     │
                         └──────┬───────┘
                                │
                         Authentication
                                │
                         ┌──────▼───────┐
                         │ Membership   │
                         └──────┬───────┘
                                │
                              Role
                                │
                       ┌────────▼────────┐
                       │ Role Permissions │
                       └────────┬────────┘
                                │
                         Data Scope / Rules
                                │
                      ┌─────────▼─────────┐
                      │ Effective Access  │
                      └─────────┬─────────┘
                                │
             ┌──────────────────┼──────────────────┐
             ▼                  ▼                  ▼
        UI Visibility      API Authorization   Record Scope
             │                  │                  │
             └──────────────────┼──────────────────┘
                                ▼
                       Business Operation
                                │
                      Workflow / State Policy
                                │
                              Audit
```

القواعد الأساسية:

1. `Authentication` يحدد من أنت.
2. `Authorization` يحدد ماذا تستطيع أن تفعل.
3. `Scope` يحدد على أي بيانات تستطيع فعل ذلك.
4. `Workflow` يحدد هل حالة المستند تسمح بالعملية.
5. `Business Rules` تظل مستقلة عن واجهة الصلاحيات.
6. `Audit` يسجل ما حدث ولا يمنح صلاحية.

---

## 4. تعريف المصطلحات

### 4.1 User

حساب المستخدم الذي يمثل هوية تسجيل الدخول إلى Orminal. قد يرتبط بـ Employee أو Partner، وله شركة افتراضية وفرع افتراضي وأدوار ونطاقات أمنية وإعدادات مصادقة.

لا يجب تخزين الصلاحيات النهائية داخل User كمصدر مستقل للحقيقة، إلا إذا كانت قيمة Cache مشتقة من المصدر الرسمي وبآلية إبطال واضحة.

### 4.2 Role

الدور هو الحزمة الأمنية القابلة لإعادة الاستخدام التي تجمع مجموعة من الصلاحيات ويمكن إسنادها لعدد من المستخدمين.

أمثلة مفاهيمية:

```text
System Administrator
Finance Manager
Senior Accountant
Accountant
Purchasing Officer
Sales Officer
Warehouse Officer
HR Officer
Auditor
```

### 4.3 مجموعات المستخدمين

بحسب شجرة Orminal، «مجموعات المستخدمين» هي الواجهة الإدارية التي يجري من خلالها تنظيم مجموعات الصلاحيات. **الافتراض المعماري الافتراضي هو أن Role يمثل Permission Group**، ولا يجوز إنشاء `UserGroup` و`PermissionGroup` و`Role` ككيانات متداخلة دون سبب حقيقي يكشفه الكود الحالي.

النموذج المفضل:

```text
User
  ↓
UserRole
  ↓
Role
  ↓
Permissions + Scope
```

### 4.4 Permission Definition

تعريف ثابت لقدرة أمنية محددة، مثل:

```text
FIN.JOURNAL_ENTRY.READ
FIN.JOURNAL_ENTRY.CREATE
FIN.JOURNAL_ENTRY.UPDATE
FIN.JOURNAL_ENTRY.APPROVE
FIN.JOURNAL_ENTRY.POST
FIN.JOURNAL_ENTRY.CANCEL
FIN.JOURNAL_ENTRY.REVERSE
FIN.JOURNAL_ENTRY.PRINT
FIN.JOURNAL_ENTRY.EXPORT
```

يجب أن يكون Permission Key مستقرًا وتقنيًا وغير مرتبط باللغة المعروضة.

### 4.5 RolePermission

علاقة Role بصلاحية محددة، ويمكن أن تتضمن Scope وسياسات سياقية حسب تصميم النظام الحالي.

### 4.6 Effective Permission

هي النتيجة المحسوبة بعد تجميع جميع المصادر الرسمية:

```text
Role Permissions
+
Role Inheritance
+
Direct Exceptions (if supported)
+
Data Scope
+
System Security Policies
+
Context Rules
+
Workflow State
```

---

## 5. نموذج الصلاحيات الأمني في Orminal

النموذج المستهدف:

```text
RBAC
+
Scoped Authorization
+
Context-Aware Rules when required
+
Workflow Authorization
```

### RBAC

يجيب عن:

> ماذا يستطيع المستخدم أن يفعل؟

### Data Scope

يجيب عن:

> على أي شركة/فرع/مستودع/بيانات يستطيع فعل ذلك؟

### Context / ABAC

يستخدم عندما تكون الصلاحية مرتبطة بسمات أو شروط عملية، مثل:

```text
Amount > ApprovalLimit
Document.Department = User.Department
Document.State = APPROVED
```

لا تنشئ محرك ABAC ضخمًا لمجرد وجود المصطلح. ابدأ بالـRBAC + Scoped Authorization، ثم أضف Rules فعلية عندما يتطلب النظام ذلك.

### Workflow Authorization

لا تعتبر:

```text
POST = true
```

كافية لترحيل أي مستند.

قرار `Approve/Post/Cancel/Reverse` يجب أن يكون نتيجة:

```text
Permission
+
Tenant/Record Scope
+
Document State
+
Workflow Policy
+
Fiscal/Business Rules
```

---

## 6. علاقة شجرة النظام بوحدات الأمن

### 6.1 إدارة الصلاحيات → مجموعات المستخدمين

مسؤولية الوحدة:

- إنشاء وتعديل Roles/Permission Groups.
- الاسم العربي والأجنبي.
- الرمز التقني/التجاري عند الحاجة.
- الوصف.
- الحالة.
- المستخدمون الأعضاء.
- الأدوار الموروثة عند دعمها.
- صلاحيات العمليات.
- صلاحيات الشاشات.
- صلاحيات المدخلات.
- نطاق البيانات.

### 6.2 إدارة الصلاحيات → بيانات المستخدمين

مسؤولة عن إدارة المستخدمين لأغراض الوصول والأمان، مع فصل البيانات الأساسية عن الصلاحيات.

تشمل:

- البيانات الأساسية.
- Employee/Partner relation.
- اللغة.
- المنطقة الزمنية.
- الشركة الافتراضية.
- الفرع الافتراضي.
- Roles.
- الشركات/الفروع/المستودعات المسموحة.
- حالة المستخدم.
- MFA.
- الجلسات.
- Effective Permissions.

### 6.3 إدارة الصلاحيات → صلاحيات العمليات

مسؤولة عن العمليات الفعلية، وليس مجرد فتح الشاشة.

العمليات القياسية:

```text
Create
Read
Update
Delete
Approve
Post
Cancel
Reverse
Print
Export
Import
```

لا يشترط أن تستخدم كل وحدة جميع العمليات.

### 6.4 إدارة الصلاحيات → صلاحيات الشاشات

تتحكم في:

- ظهور القائمة.
- السماح بفتح الشاشة.
- Screen/Route Access.
- View Mode Access.
- الإجراءات المرتبطة بالواجهة عند الحاجة.

**Screen Permission لا تمنح Business Permission.**

### 6.5 إدارة الصلاحيات → صلاحيات المدخلات

تتحكم على مستوى الحقول في:

```text
Visible
Read Only
Editable
Required
Hidden
```

لكن لا تعتبر UI Field Security بديلًا عن حماية API والـBackend.

### 6.6 إدارة الصلاحيات → عرض الصلاحيات

هي `Effective Permission Inspector`.

يجب أن يستطيع المسؤول معرفة:

```text
User
Role
Permission
Source
Scope
Decision
Reason
```

### 6.7 إدارة الصلاحيات → الرقابة

تجمع الأحداث الأمنية والتشغيلية الحساسة من Audit/Authorization/Security Events، ولا تمنح صلاحيات بحد ذاتها.

---

## 7. Role ≠ User Group ≠ Permission

يجب تثبيت هذه القاعدة:

```text
User
  ↓
Role / Permission Group
  ↓
Permission Definitions
```

لا تجعل Role نفسه صلاحية.
ولا تجعل Permission نفسه مجموعة مستخدمين.
ولا تضف كيانًا ثانيًا لـUserGroup ما لم يثبت أن متطلبات Orminal تحتاج طبقتين منفصلتين.

إذا كانت التسمية الوظيفية المطلوبة في القائمة هي «مجموعات المستخدمين»، يمكن عرض Role للمستخدمين بهذا المصطلح، بينما يبقى الاسم التقني `Role` أو الاسم الذي يستخدمه الكود الحالي.

---

## 8. Role Inheritance

يمكن دعم الوراثة:

```text
Accountant
    ↓
Senior Accountant
    ↓
Finance Manager
```

لكن يجب منع:

```text
A → B
B → A
```

وكل دورة أطول من ذلك.

يجب تمييز:

```text
Direct Permission
Inherited Permission
Override
Denied
Policy Restricted
```

عند الحساب والعرض.

---

## 9. Permission Resolution

يجب أن يكون حساب الصلاحيات Deterministic وقابلًا للتفسير.

الناتج المنطقي للمحرك:

```text
allowed: boolean
permissionKey
source
scope
reason
```

لا تعتمد على ترتيب غير مضمون للـdatabase records.

في حال وجود Conflicts يجب وجود سياسة حسم موثقة. لا تضع ترتيبًا افتراضيًا متعسفًا؛ قم بمواءمته مع قواعد Orminal الفعلية.

---

## 10. Data Scoping

يجب فصل:

```text
Permission
```

عن:

```text
Scope
```

النطاقات الأساسية:

```text
own
team
branch
company
all
```

ويمكن إضافة نطاقات أخرى عند الحاجة.

أبعاد النطاق قد تشمل:

```text
Company
Branch
Warehouse
```

حسب الـModule.

مثال:

```text
Permission: PUR.PURCHASE_REQUEST.READ
Scope: branch
Allowed Branches: [Taiz, Aden]
```

امتلاك صلاحية القراءة لا يعني قراءة كل الفروع.

---

## 11. Tenant Isolation

كل طلب حساس يجب أن يعتمد على Security Context موثوق، وليس على `companyId` يرسله المستخدم فقط.

يجب حماية:

- Read.
- Create.
- Update.
- Delete.
- Export.
- Import.
- Print.
- Role Assignment.
- Permission Assignment.
- Scope Changes.

من:

```text
Cross-Tenant IDOR
```

ويجب التحقق من Foreign Keys المرتبطة بالشركة.

---

## 12. Branch وWarehouse Scope

لا تخلط بين:

```text
Company
Branch
Organizational Unit
Department
Cost Center
Warehouse
```

ولا تستخدم معرفًا من كيان كأنه معرف لكيان آخر بلا علاقة صريحة.

في المخزون مثلًا:

```text
INV.STOCK_TRANSFER.CREATE
+
Source Warehouse Scope
+
Destination Warehouse Scope
```

وفي الموارد البشرية قد يرتبط النطاق بالفرع أو وحدة تنظيمية حسب الـBusiness Rules.

---

## 13. Authorization Engine

يجب أن يكون هناك Authorization Service/Engine مركزي، أو استخدام الموجود حاليًا إذا كان يؤدي الوظيفة.

النموذج المفاهيمي:

```ts
authorize({
  userId,
  companyId,
  module,
  resource,
  action,
  recordId,
  context
})
```

النتيجة لا تكون Boolean فقط إذا كان النظام يستطيع توفير سبب القرار.

يجب منع نشر منطق الصلاحيات المختلف في كل Route أو Component.

---

## 14. UI Security ≠ Backend Security

ممنوع اعتبار:

```ts
if (!canDelete) hideButton()
```

أو:

```ts
disabled={true}
```

أو Route Guard وحده، آلية أمان كاملة.

المسار الصحيح:

```text
UI
 ↓
API
 ↓
Authorization
 ↓
Tenant/Scope
 ↓
Business Rules
 ↓
Database Query/Mutation
```

حتى إذا لم يظهر زر Delete، يجب أن يرفض API العملية إذا لم يكن المستخدم مصرحًا بها.

---

## 15. Record Filtering

يجب تطبيق Scope على الاستعلام نفسه عندما يكون ذلك مطلوبًا.

مثال مفاهيمي:

```text
WHERE companyId = CurrentCompany
AND branchId IN AllowedBranches
```

لا تعتمد فقط على جلب السجل ثم فحص الصلاحية لاحقًا.

---

## 16. صلاحيات العمليات المرتبطة بحالة المستند

العمليات المحاسبية والتشغيلية الحساسة لا تعتمد على Permission فقط.

### Approve

```text
Permission
+
Scope
+
Current State
+
Approval Policy
```

### Post

```text
Permission
+
Approved State
+
Open Fiscal Period
+
Valid Accounting Data
+
Scope
```

### Cancel

```text
Permission
+
Allowed State
+
Cancellation Policy
+
Period Rules
```

### Reverse

```text
Permission
+
Posted State
+
Reversal Policy
+
Open Period
```

---

## 17. Last Administrator Protection

يجب منع الشركة من الدخول في حالة لا يوجد فيها مسؤول قادر على إدارة Users/Roles/Permissions.

قبل:

- تعطيل آخر Admin.
- إزالة Role الإداري الوحيد.
- إزالة آخر صلاحية لإدارة الأمن.
- حذف/تعطيل Role أساسي لمسؤولي النظام.

يجب أن يفحص Backend وجود Admin بديل صالح في نفس Tenant.

هذه Business Rule وليست مجرد تحذير UI.

---

## 18. Super Admin

إذا كان النظام يحتوي حاليًا على `isSuperAdmin` أو مفهوم مستخدم خارق، فلا تنشر شرط:

```ts
if (isSuperAdmin) return true;
```

في الخدمات المختلفة.

يجب أن يكون Super Admin مسارًا مركزيًا داخل Authorization Engine.

كل استخدام حساس له يجب أن يسجل:

```text
User
Company
Module
Resource
Action
Record
Timestamp
Context
```

---

## 19. Authentication مقابل Authorization

يجب الفصل بين:

```text
Authentication = من أنت؟
Authorization = ماذا تستطيع أن تفعل؟
```

Auth Layer مسؤولة عن:

- Login.
- Password verification.
- Session.
- MFA.
- External providers.

Authorization Layer مسؤولة عن:

- Roles.
- Permissions.
- Scope.
- Policies.
- Effective Access.

---

## 20. MFA

إذا كان MFA موجودًا حاليًا، يجب الحفاظ على معماريته أو تطويرها بأقل تغيير آمن.

يجب:

- عدم تخزين MFA secret مكشوفًا.
- عدم إظهار secret بعد التهيئة دون سبب.
- دعم Enable/Disable وفق الصلاحيات.
- دعم الشركة إذا لديها Enforcement Policy.
- تسجيل أحداث MFA الحساسة.
- عدم اعتبار `mfaEnabled=true` دليلًا على نجاح رمز MFA أثناء Login.

---

## 21. Session Management

يجب التفريق بين:

```text
Inactivity Timeout
```

و:

```text
Absolute Session Timeout
```

واجهة المستخدم قد تعرض الجلسات أو تسمح بـForce Logout، لكن التنفيذ الحقيقي يجب أن يبقى ضمن Auth/Session Core.

لا تعتمد على Frontend Timer فقط كآلية أمان.

---

## 22. User Status

بحسب ما يدعمه المشروع، يمكن أن تكون حالات المستخدم مثل:

```text
ACTIVE
INACTIVE
LOCKED
PENDING
```

الحساب غير النشط أو المقفل يجب ألا ينفذ عمليات حتى لو كانت Roles تمنحه الصلاحية.

---

## 23. User Profile

الملف الشخصي ليس شاشة إدارة الصلاحيات.

يمكن أن يتضمن:

- الاسم.
- البريد.
- الهاتف.
- اللغة.
- المنطقة الزمنية.
- كلمة المرور.
- MFA Status.
- Session Security.
- Preferences.

لا يستطيع المستخدم تغيير Roles/Scopes من Profile إلا إذا كان ذلك جزءًا من صلاحية إدارية صريحة.

---

## 24. Employee Relation

إذا كان User مرتبطًا بـEmployee:

```text
User
 ↓
Employee
 ↓
Department / Position / Manager / Branch
```

فهذا لا يعني تلقائيًا منح Role.

```text
Employee Identity ≠ Security Role
```

يمكن استخدام خصائص الموظف داخل Policies عندما تكون هناك قاعدة عمل حقيقية.

---

## 25. Portal / Partner Users

إذا كان Orminal سيدعم بوابة للعملاء أو الموردين:

```text
User
 ↓
Portal Access
 ↓
Partner
```

يجب فصل Portal Authorization عن Internal ERP Authorization.

لا يصبح Portal User مستخدم ERP داخليًا لمجرد ارتباطه بPartner.

---

## 26. Permission Keys

يجب أن تكون المفاتيح التقنية غير مرتبطة باللغة، مثال:

```text
FIN.JOURNAL_ENTRY.POST
PUR.PURCHASE_REQUEST.CREATE
INV.STOCK_TRANSFER.CREATE
SYS.USERS.UPDATE
SYS.ROLES.UPDATE
```

لا تستخدم العربية داخل Permission Key.

الترجمة منفصلة عبر Dictionary/Localization.

---

## 27. Screen Permissions

كل شاشة مهمة ينبغي أن تمتلك `screenKey` مستقرًا:

```text
FIN.JOURNAL_ENTRIES
PUR.PURCHASE_REQUESTS
INV.ITEMS
SYS.USERS
SYS.ROLES
```

لا تجعل URL أو Route هو الهوية الأمنية الوحيدة.

---

## 28. Input / Field Permissions

لكل حقل محمي يجب استخدام `fieldKey` ثابت.

يجب أن تدعم البنية عند الحاجة:

```text
VISIBLE
READ_ONLY
EDITABLE
REQUIRED
HIDDEN
```

لكن البيانات الحساسة يجب ألا ترسل إلى Client أصلًا عندما لا يملك المستخدم حق قراءتها.

---

## 29. Effective Permission Inspector

وحدة «عرض الصلاحيات» يجب أن تكون أداة تشخيص حقيقية، وليس مجرد جدول Boolean.

مثال:

```text
المستخدم: أحمد

Module: FIN
Resource: Journal Entry
Action: POST
Decision: ALLOWED
Source: Role = Senior Accountant
Scope: Branch
Branches: Taiz
```

ويجب أن يظهر مصدر الصلاحية عند الإمكان:

```text
Direct
Inherited
Role
Override
Policy
Denied
```

---

## 30. سبب المنع

عند رفض طلب أمني، يجب أن يحدد المحرك سبب القرار داخليًا، مثل:

```text
AUTHENTICATION_REQUIRED
USER_INACTIVE
MFA_REQUIRED
TENANT_SCOPE_DENIED
PERMISSION_DENIED
BRANCH_SCOPE_DENIED
WAREHOUSE_SCOPE_DENIED
INVALID_DOCUMENT_STATE
WORKFLOW_DENIED
FISCAL_PERIOD_CLOSED
```

لا تعرض للمستخدم تفاصيل داخلية حساسة غير ضرورية.

---

## 31. Audit Log

كل تعديل أمني حساس يجب أن يكون قابلاً للتدقيق.

البيانات المنطقية:

```text
Timestamp
UserId
CompanyId
Module
Action
Resource
RecordId
OldValue
NewValue
Result
Source
```

عند توفرها يمكن تسجيل معلومات اتصال مناسبة.

لا تسجل:

- Passwords.
- Password hashes إذا لم تكن هناك ضرورة قانونية/تقنية.
- MFA secrets.
- Access/Refresh tokens.
- API secrets.

---

## 32. Audited Security Changes

يجب تسجيل على الأقل:

- إنشاء Role.
- تعديل Role.
- تعطيل/أرشفة Role.
- إسناد Role للمستخدم.
- إزالة Role.
- Grant Permission.
- Revoke Permission.
- تغيير Scope.
- تغيير حالة المستخدم.
- MFA Reset/Change.
- Administrative Password Reset.
- Session Revoke.
- Super Admin Action.

---

## 33. العلاقات مع بقية شجرة النظام

### الإشعارات

يمكن إرسال Notification بعد أحداث أمنية، لكن:

```text
Notification ≠ Authorization
```

### تنبيهات النظام

يمكن إنشاء System Alert لأحداث مثل:

```text
Repeated Authorization Failures
Last Admin Risk
MFA Disabled
Privilege Change
```

لكن Alert لا يمنح صلاحية.

### قوالب المستندات

صلاحية Print/Export مرتبطة بالتفويض. لا يجوز أن يسمح Template بعرض حقول لا يستطيع المستخدم قراءتها أصلًا.

### الإعدادات الخاصة بالنظام

يمكن أن تحتوي Security Policies مثل:

- MFA Enforcement.
- Password Policy.
- Session Defaults.

لكنها ليست بديلًا عن Role/Permission Engine.

### الملف الشخصي

إدارة تفضيلات المستخدم وأمانه الشخصي ضمن الحدود المسموحة.

### أنواع وثائق التسلسل

صلاحية تعديل Sequence Definitions منفصلة عن صلاحية إنشاء المستندات.

### تسلسلات العمليات

لا يستطيع مستخدم تشغيلي تغيير Numbering Configuration لمجرد امتلاكه صلاحية إنشاء المستند.

### البيانات الإفتراضية للعمليات

Defaults مثل الفرع أو المستودع أو طريقة الدفع لا تمنح صلاحية.

---

## 34. Relationship with Accounting

امتلاك صلاحية:

```text
FIN.JOURNAL_ENTRY.POST
```

لا يسمح بتجاوز:

- الفترة المالية المغلقة.
- الحسابات غير الصحيحة.
- التوازن المحاسبي.
- قواعد الترحيل.
- القيود النظامية.

Authorization وAccounting Validation طبقتان مستقلتان تتكاملان في القرار النهائي.

---

## 35. Relationship with Inventory

صلاحيات المخزون يجب أن تراعي:

```text
Permission
+
Warehouse Scope
+
Source/Destination Constraints
+
Document State
```

ولا يكفي امتلاك Create Transfer فقط.

---

## 36. Relationship with Sales/Purchasing

يمكن للمستخدم أن يمتلك:

```text
PUR.PURCHASE_REQUEST.CREATE
```

ولا يمتلك:

```text
PUR.PURCHASE_REQUEST.APPROVE
```

أو يمتلك Approve في فرع محدد فقط.

---

## 37. Relationship with HR

صلاحيات HR يمكن أن تستخدم Scope على الفرع أو الوحدة التنظيمية، لكن لا تُمنح تلقائيًا من وظيفة الموظف إلا إذا وجدت Policy صريحة.

---

## 38. Reports / Printing / Export

التقرير والطباعة والتصدير يجب ألا تتجاوز Record Scope.

مثال ممنوع:

```text
UI displays only Branch A
BUT
Export API returns all company records
```

أي Report/Export/Print يجب أن يستخدم نفس authorization/data-scope rules الخاصة بالمصدر.

---

## 39. Import

Import يجب أن يمر عبر:

```text
Permission
+
Tenant Scope
+
Record Scope
+
Field Permissions
+
Business Validation
+
Audit
```

وجود Import Permission وحده لا يكفي.

---

## 40. Permission Catalog

تعريف الصلاحيات النظامية يجب أن يكون:

```text
Idempotent
Versioned
Deterministic
```

ولا يتم إنشاء Permission Definitions من GET.

تتم التهيئة عبر:

```text
Tenant Provisioning
OR
System Initialization
OR
Versioned Migration
```

ولا يجوز أن تؤدي إعادة تحميل صفحة إلى إنشاء بيانات جديدة.

---

## 41. Role Seed

الأدوار الافتراضية للنظام يمكن تعريفها كـSystem Roles إذا كان ذلك مناسبًا للبنية الحالية.

يجب أن يكون Seed آمنًا ولا يمحو تخصيصات المؤسسة عند كل نشر.

أي تغيير جذري في معنى Role يجب أن يمر عبر Migration واضح.

---

## 42. Safe Deletion

لا تحذف Role أو Permission Definition مستخدمة في بيانات أو سجلات تاريخية بطريقة تجعل السجلات غير قابلة للتفسير.

الأفضل عند الاستخدام:

```text
Deactivate / Archive
```

بدل الحذف الفيزيائي.

---

## 43. Permission Key Stability

بعد استخدام Permission Key في النظام، لا تغير معناه بصمت.

إذا احتجت لتغييره:

```text
Old Permission
        ↓
Migration
        ↓
New Permission
        ↓
Verification
```

---

## 44. UI Requirements — مجموعات المستخدمين

يجب أن تحتوي الواجهة، وفق تصميم Orminal الحالي، على:

- Toolbar.
- Search.
- Filters.
- Grid.
- Status.
- Users Count.
- Actions.

الإجراءات المحتملة:

```text
Add
View
Edit
Activate/Deactivate
Members
Permissions
Audit
```

لا تعرض Delete إلا إذا كان آمنًا ومسموحًا حسب حالة الدور.

---

## 45. UI Requirements — Role Detail

التبويبات المقترحة:

### البيانات الأساسية

- الاسم العربي.
- الاسم الأجنبي.
- الرمز.
- الوصف.
- الحالة.

### الأعضاء

المستخدمون المنتمون إلى Role.

### الأدوار الموروثة

تظهر فقط إذا كان النظام يدعمها فعليًا.

### صلاحيات العمليات

مصفوفة Modules × Actions.

### صلاحيات الشاشات

Screen Access / Visibility.

### صلاحيات المدخلات

Field-Level Security.

### نطاق البيانات

Company / Branch / Warehouse.

### عرض الصلاحيات الفعلية

Effective Permissions.

---

## 46. UI Requirements — المستخدمون

التبويبات:

### البيانات الأساسية

- الاسم.
- البريد.
- الهاتف.
- Employee / Partner.
- اللغة.
- المنطقة الزمنية.
- الحالة.

### الوصول

- الشركة الافتراضية.
- الفرع الافتراضي.
- Roles.
- الفروع المسموحة.
- المستودعات المسموحة.

### الأمان

- MFA status.
- Password actions.
- Active Sessions.
- Force Logout.

### الصلاحيات الفعالة

عرض Effective Permissions.

### الرقابة

عرض الأحداث الأمنية الخاصة بالمستخدم عندما تكون متاحة من Audit Layer.

---

## 47. User Scope UI

يجب أن تكون اختيارات Company/Branch/Warehouse متوافقة مع Company Context الحالي.

لا تسمح الواجهة بمنح `all` دون تحقق من صلاحية مناسبة، لكن الحماية النهائية يجب أن تكون Backend.

---

## 48. Search / Pagination / Performance

عند كثرة المستخدمين والأدوار يجب استخدام:

- Server-side pagination.
- Server-side filtering.
- Debounced search.
- Stable sorting.
- Query limits.
- Batch permission resolution.

لا تحمل كامل المستخدمين والصلاحيات إلى Browser دون حاجة.

---

## 49. Cache

المصدر الحقيقي:

```text
Database + Current Security State
```

يمكن استخدام:

```text
React Query Cache
Server Cache
In-Memory Cache
```

لكن يجب وجود Invalidation عند:

- Role Change.
- Permission Change.
- Scope Change.
- User Status Change.
- MFA/Security Policy change عندما تؤثر على access decision.

ولا يجوز أن تستمر صلاحية قديمة بلا مدة أو آلية إبطال معروفة.

---

## 50. Client Trust Boundary

كل ما يأتي من Frontend يعتبر غير موثوق، بما في ذلك:

```text
userId
companyId
branchId
warehouseId
roleId
permissionId
recordId
```

يجب التحقق منه داخل Backend.

---

## 51. Bulk Operations

أي Bulk Assignment مثل:

```text
Assign Role to Many Users
Change Scope for Many Users
Bulk Deactivate
```

يجب أن:

- يتحقق من الصلاحية.
- يتحقق من Tenant Scope.
- يستخدم Transaction عند الحاجة.
- يكتب Audit مناسبًا.
- يمنع Partial State غير المرصود.

---

## 52. Transaction Integrity

التغييرات الأمنية التي تتكون من عدة خطوات يجب أن تستخدم Transaction عند الحاجة.

مثال:

```text
Create Role
+
Assign Permissions
+
Assign Scope
+
Audit
```

يجب ألا ينتهي النظام بـRole نصف منشأ بسبب فشل في منتصف العملية.

---

## 53. Concurrency

يجب اختبار التعديل المتزامن على:

- Role permissions.
- User roles.
- Scope.
- Role status.

وحماية النظام من:

```text
Race Condition
Lost Update
Stale Overwrite
```

---

## 54. API Contract

يمكن أن تكون الـEndpoints المفاهيمية:

```text
GET    /api/.../users
GET    /api/.../users/:id
POST   /api/.../users
PUT    /api/.../users/:id
POST   /api/.../users/:id/roles
DELETE /api/.../users/:id/roles/:roleId

GET    /api/.../roles
POST   /api/.../roles
PUT    /api/.../roles/:id
POST   /api/.../roles/:id/permissions
GET    /api/.../authorization/effective
```

**لا تستخدم هذه المسارات حرفيًا إذا كانت Convention الحالية مختلفة.** يجب أولًا اكتشاف نمط API الحالي وإتباعه.

---

## 55. Error Handling

يجب توحيد أخطاء الأمن.

مثال:

```json
{
  "code": "PERMISSION_DENIED",
  "message": "لا تملك الصلاحية المطلوبة لتنفيذ هذه العملية."
}
```

التفاصيل الداخلية مثل Permission Key وScope Trace يمكن أن تكون متاحة للـAudit/Inspector فقط حسب صلاحيات المستخدم.

---

## 56. Database Principles

قبل تعديل Prisma Schema يجب اكتشاف Models الموجودة فعليًا.

إذا وجدت:

```text
User
Role
UserRole
RolePermission
AuditLog
```

فيجب تقييمها وإعادة استخدامها بدل إنشاء نسخ مكررة.

يجب استخدام:

- Foreign Keys.
- Unique Constraints.
- Appropriate Indexes.
- Tenant Scope.
- Safe Delete Rules.

ولا تضف `companyId` عشوائيًا إلى كل Model؛ أضفه حيث يكون الكيان Company-scoped فعلًا.

---

## 57. Security Context

يجب أن يوجد Context موثوق للمستخدم الحالي، وفق آلية المشروع، يتضمن ما يلزم مثل:

```text
userId
companyId
defaultBranchId
roles
session
security flags
```

ولا يجوز اعتبار بيانات Security Context القادمة من العميل مصدرًا للحقيقة.

---

## 58. No Hidden Permission Sources

ممنوع إنشاء صلاحيات سرية عبر:

```text
hard-coded username
hard-coded email
hard-coded route
special boolean
```

إلا في مسار Super Admin مركزي وموثق.

---

## 59. Sensitive Data Protection

لا يجب إرسال أو إظهار:

- Password hashes عند عدم الحاجة.
- MFA secrets.
- Refresh tokens.
- Session secrets.
- API keys.
- Recovery secrets.

ويجب تطبيق principle of least privilege على API responses نفسها.

---

## 60. Authentication Providers

إذا كان Orminal يدعم OAuth/LDAP/Google/Microsoft أو غيرها، يجب عزل إعداداتها داخل Auth/Integration Layer.

لا تجعل Role/Permission UI مسؤولًا عن OAuth internals.

الـREADME المرجعي لـOdoo يوضح هذه الوظائف كقدرات منفصلة، ويجب الحفاظ على نفس الفصل المفاهيمي في Orminal. 

---

## 61. System Initialization

إنشاء Company/Tenant جديد يمكن أن يهيئ ما يلزم من:

```text
Permission Catalog
Default Roles
Required Security Defaults
Initial Administrator
```

ويجب أن يكون Idempotent.

GET requests لا تنشئ Security Data.

---

## 62. Migration Strategy

في حال تعديل Schema، استخدم Migration Strategy المتوافقة مع المشروع.

إذا كان Prisma هو ORM الحالي، فالمبدأ المفضل للإنتاج هو:

```text
Prisma Migration
→ Controlled Deployment
→ Generate
→ Verification
```

ولا تجعل `db push` استراتيجية الإنتاج الأساسية إذا كان المشروع يعتمد على migration history.

لا تفقد بيانات المستخدمين أو العلاقات الحالية.

---

## 63. Odoo → Orminal Functional Mapping

| Odoo Concept | Orminal Concept |
|---|---|
| `res.users` | `User` |
| `res.groups` | `Role / Permission Group` |
| Access Rights | `RolePermission + PermissionDefinition` |
| Record Rules | `Data Scope + Context Policies` |
| Inherited Groups | `Role Inheritance` |
| User Access Rights | `Effective Permissions` |
| Portal User | `Portal/Partner Access` |
| MFA | `Auth/Security Layer` |
| Superuser | `Central Super Admin Policy` |
| Session Timeout | `Auth/Session Layer` |

هذا جدول مواءمة وظيفية، وليس التزامًا بمطابقة Odoo Models.

---

## 64. قواعد العلاقات التي يجب عدم كسرها

```text
Role ≠ User
Permission ≠ Role
Scope ≠ Permission
Authentication ≠ Authorization
Screen Access ≠ Business Permission
Employee ≠ Role
Company ≠ Branch
Audit ≠ Authorization
Notification ≠ Security Decision
Odoo Reference ≠ Orminal Implementation
```

---

## 65. No Fake Security

ممنوع استخدام:

- Mock users.
- Mock roles.
- Mock permissions.
- Fake Effective Permissions.
- Static permission arrays كمصدر للحقيقة.
- Fake API responses.
- UI-only guards.
- Hard-coded admin bypass.

كل قرار وصول يجب أن يعتمد على بيانات حقيقية من النظام.

---

## 66. Discovery قبل التنفيذ

قبل إنشاء أو تعديل أي ملف، يجب على الوكيل البرمجي فحص:

```text
prisma/schema.prisma
Authentication implementation
Current RBAC implementation
Tenant verification
Audit implementation
Users module
Roles module
Module registry
Sidebar navigation
Permission utilities
API routes
Session implementation
MFA implementation
Current tests
```

كما يجب البحث عن كل مكان يستخدم:

```text
userId
roleId
permission
companyId
branchId
warehouseId
canRead
canCreate
canUpdate
canDelete
```

والهدف هو معرفة **الوضع الفعلي** قبل تصميم أي طبقة جديدة.

---

## 67. Discovery Report Required

قبل التنفيذ يجب أن يعرض الوكيل:

```text
Current Behavior
Required Behavior
Existing Models
Existing APIs
Existing Security Helpers
Missing Features
Conflicts
Risks
Affected Files
Migration Impact
```

ولا يبدأ إعادة بناء النظام قبل تحديد ما هو موجود وقابل لإعادة الاستخدام.

---

## 68. Minimal Safe Change Principle

إذا كان لدى Orminal بالفعل Authorization أو RBAC صالح، يجب توسيعه بدل استبداله.

لا تعيد كتابة Auth/RBAC بالكامل لمجرد توحيد أسماء الملفات.

أي Refactor كبير يجب أن يكون مبررًا ومقسمًا إلى مراحل صغيرة قابلة للاختبار.

---

## 69. UI Integration Principle

يمكن استخدام وحدات مشتركة مثل:

```text
roles-module.tsx
users-module.tsx
```

مع `mode` أو `initialView` إذا كانت البنية الحالية تعتمد على Module واحد لإظهار أكثر من وضع.

لكن لا تستخدم View Modes لإخفاء اختلافات Business Logic حقيقية عندما تحتاج الوحدة إلى Service/API مختلف.

---

## 70. Permission Matrix

المصفوفة يجب أن تكون قابلة للقراءة، مثل:

```text
Module      Resource             Read Create Update Delete Approve Post Cancel Reverse Print Export Import
----------------------------------------------------------------------------------------------------------
FIN         Journal Entry          ✓     ✓      ✓      ✗      ✓      ✓     ✓      ✓      ✓      ✓      ✗
PUR         Purchase Request       ✓     ✓      ✓      ✗      ✓      ✗     ✗      ✗      ✓      ✓      ✓
INV         Stock Transfer         ✓     ✓      ✓      ✗      ✓      ✓     ✓      ✓      ✓      ✓      ✓
```

لكن لا تضع قيمًا افتراضية داخل النظام لمجرد المثال؛ القيم الفعلية تأتي من Role/Permission Data.

---

## 71. Role Permission Scope Example

مثال مفاهيمي فقط:

```text
Role: Warehouse Officer

Permission:
INV.STOCK_TRANSFER.CREATE = ALLOW

Scope:
Company = Current Company
Warehouses = [Main Warehouse]
```

هذا يسمح بالإنشاء فقط ضمن النطاق الذي تسمح به Business Rules.

---

## 72. Effective Permission Example

```text
User: Ahmad

Role 1: Accountant
Role 2: Branch Accountant

Effective Permission:
FIN.JOURNAL_ENTRY.READ     = ALLOW
FIN.JOURNAL_ENTRY.CREATE   = ALLOW
FIN.JOURNAL_ENTRY.UPDATE   = ALLOW
FIN.JOURNAL_ENTRY.POST     = DENY

Source:
READ/CREATE/UPDATE → Accountant
POST → no valid granting source

Scope:
Branch = Taiz
```

هذا مثال توضيحي، وليس Seed Data.

---

## 73. Last Admin Security Test

سيناريو إلزامي:

```text
Company A
↓
Admin User A = only valid administrator
```

يجب رفض أي عملية تؤدي إلى:

```text
No valid administrator remains
```

إلا ضمن آلية نقل الإدارة الآمنة إن وجدت.

---

## 74. Cross-Tenant Security Tests

يجب اختبار:

```text
Company A user → Company B user record
Company A user → Company B role
Company A user → Company B permission
Company A user → Company B journal
Company A user → Company B report
Company A user → Company B export
```

ويجب رفض جميع المسارات غير المسموحة.

---

## 75. Cross-Branch Security Tests

اختبار مستخدم له Branch A فقط:

```text
Read Branch A → Allow
Read Branch B → Deny
Update Branch B → Deny
Export Branch B → Deny
```

والاختبار نفسه على Warehouse Scope.

---

## 76. Privilege Escalation Tests

يجب اختبار:

- المستخدم يحاول منح نفسه Role أقوى.
- المستخدم يحاول تعديل Permission Definition.
- المستخدم يحاول تغيير companyId إلى شركة أخرى.
- المستخدم يرسل API request مباشرًا لإجراء إداري.
- المستخدم يحاول تعديل Scope الخاص به.

كل هذه الحالات يجب أن تخضع لـBackend Authorization.

---

## 77. API Bypass Tests

كل عملية مهمة يجب اختبارها بعيدًا عن UI.

مثال:

```text
UI hides Delete
↓
Direct DELETE Request
↓
Backend Authorization
↓
403 / Permission Denied
```

---

## 78. Workflow Tests

يجب اختبار:

```text
Cannot Post Draft
Cannot Post without required approval
Cannot Post closed fiscal period
Cannot Reverse unposted document
Cannot Cancel prohibited state
```

مع وجود Permission صحيحة، لأن Permission ليست Business Validation.

---

## 79. Permission Propagation Test

بعد تعديل Role:

```text
Role Permission Changed
↓
Cache Invalidation
↓
Effective Permission Recalculated
↓
Next Request uses new security state
```

لا تتطلب العملية إعادة تشغيل الخادم.

---

## 80. Concurrency Tests

يجب اختبار التعديل المتزامن على Role/Permission/Scope لمنع:

```text
Race Conditions
Lost Updates
Duplicated Assignments
Broken Transactions
```

---

## 81. UI Acceptance — Users

وحدة المستخدمين تعتبر ناجحة عندما:

- تعرض بيانات Database حقيقية.
- تستخدم Authentication الحالي.
- تحترم Tenant/Branch/Scope.
- تدعم Roles حقيقية.
- تسجل التغييرات.
- تعرض الحالة الأمنية.
- لا تعرض الأسرار.
- لا تستخدم Mock Data.
- تعمل مع API الحقيقي.
- تعمل في RTL واللغة الحالية.

---

## 82. UI Acceptance — Roles

تعتبر وحدة الأدوار/مجموعات المستخدمين ناجحة عندما:

- إنشاء/تعديل Role حقيقي.
- ربط المستخدمين حقيقي.
- ربط Permissions حقيقي.
- تطبيق Scope حقيقي.
- Effective Permissions صادرة من Backend.
- Inheritance آمنة إن كانت مدعومة.
- Audit يعمل.
- لا يوجد Authorization Bypass.

---

## 83. Effective Permission Acceptance

يجب أن يستطيع المسؤول تفسير قرار مثل:

```text
Allowed / Denied
↓
Permission
↓
Source
↓
Scope
↓
Context
↓
Reason
```

والنتيجة يجب أن تكون Deterministic.

---

## 84. Performance Requirements

لا يجب تنفيذ Query Permission كامل لكل صف من Grid.

استخدم:

- Batch Loading.
- Caching عند الحاجة.
- Efficient joins.
- Server Pagination.
- Memoized resolution حيث يناسب.

لكن لا تسمح للأداء بإلغاء Tenant/Scope Validation.

---

## 85. Observability

يجب أن تكون الأحداث الأمنية الحساسة قابلة للرصد، مثل:

```text
AUTHORIZATION_DENIED
PRIVILEGE_CHANGED
ROLE_CHANGED
SCOPE_CHANGED
MFA_CHANGED
SESSION_REVOKED
```

مع معلومات كافية للتشخيص دون تسجيل أسرار.

---

## 86. Documentation Rules

كل تغيير في Security Architecture يجب أن يوثق عند الحاجة:

```text
Architecture
Database
API
Permission Catalog
Role Model
Scope Model
Migration
Tests
```

ويجب أن يذكر:

- السبب.
- الأثر.
- التوافق الخلفي.
- المخاطر.
- الاختبارات.

---

## 87. Files Potentially Involved

هذه أسماء محتملة يجب التحقق منها قبل استخدامها:

```text
prisma/schema.prisma

src/lib/auth/*
src/lib/erp/rbac.ts
src/lib/erp/audit.ts

src/components/modules/users-module.tsx
src/components/modules/roles-module.tsx
src/components/erp/module-registry.tsx

src/app/api/**/*
src/hooks/**/*
src/types/**/*
```

لا تنشئ ملفًا جديدًا بنفس الوظيفة إذا كانت هناك خدمة/Utility موجودة بالفعل.

---

## 88. Implementation Phases

### Phase 1 — Discovery

فحص المشروع الحالي وتوثيق ما هو موجود.

### Phase 2 — Security Architecture Reconciliation

مطابقة التصميم المطلوب مع Models/Auth/RBAC الحالية وتحديد الفجوات.

### Phase 3 — Data/Backend

تحديث Schema عند الضرورة، Services، Validation، Tenant Isolation، Authorization، Audit.

### Phase 4 — Roles & Permission Groups

تنفيذ مجموعة المستخدمين/Role على بيانات حقيقية.

### Phase 5 — Users

تنفيذ User Management وربطه بالأدوار والنطاقات والأمان.

### Phase 6 — Permission Views

تنفيذ Operation, Screen, Input, Effective Permission views.

### Phase 7 — Consumer Integration

ربط Modules الحالية بAuthorization Engine الحقيقي.

### Phase 8 — Security Testing

اختبارات Tenant/Scope/Privilege Escalation/API Bypass/Workflow.

### Phase 9 — Regression

تشغيل النظام كاملًا والتأكد من عدم كسر Modules الموجودة.

### Phase 10 — Documentation

تحديث وثائق Architektur/API/Database/Tests وكتابة Walkthrough للنتيجة.

---

## 89. Verification Commands

استخدم الأوامر المعتمدة من المشروع الحالي فقط.

عند توفر Prisma/TypeScript/Jest مثلًا، يمكن أن تشمل عملية التحقق:

```text
npx prisma generate
npx tsc --noEmit
npm test
npm run build
```

لكن لا تفترض أن جميع الأوامر موجودة بنفس الأسماء. افحص `package.json` أولًا.

---

## 90. Regression Checklist

بعد التنفيذ يجب التحقق من:

```text
Login
Logout
Session
MFA
Users
Roles
Role Assignment
Permission Assignment
Screen Access
Field Security
Tenant Isolation
Branch Scope
Warehouse Scope
Audit
Reports
Print
Export
Import
Accounting Posting
Inventory Operations
Workflow
Notifications
System Alerts
Profile
Sequence Types
Transaction Sequences
Default Operation Data
```

---

## 91. ممنوعات صارمة

ممنوع:

1. إنشاء Mock Users/Roles/Permissions.
2. Fake Effective Permissions.
3. Hard-coded Admin Bypass.
4. UI-only Security.
5. Trusting client companyId.
6. Cross-Tenant queries.
7. استخدام بيانات تجريبية بدل DB الحقيقية.
8. تكرار Models/Services القائمة.
9. إنشاء GET يقوم بإنشاء Security Data.
10. تغيير Auth/RBAC كله بدون تحليل.
11. حذف Security History المطلوبة للتدقيق.
12. كشف Password/MFA/API Secrets.
13. السماح للصلاحية بتجاوز Workflow/Accounting Rules.
14. تعديل Schema دون Migration/Recovery Plan.
15. تنفيذ تغييرات واسعة خارج نطاق المهمة دون سبب واضح.

---

## 92. Definition of Done

لا تعتبر المهمة مكتملة لمجرد أن:

```text
UI Opens
```

بل يجب أن يتحقق:

```text
Real Database
+
Real Authentication
+
Real Authorization
+
Tenant Isolation
+
Scope Enforcement
+
Workflow Rules
+
Audit
+
UI
+
API
+
Localization
+
Security Tests
+
Regression Tests
+
Build Success
```

---

## 93. أمر التنفيذ النهائي للوكيل البرمجي

> اقرأ هذه الوثيقة كاملة، ثم افحص Orminal ERP الحالي فعليًا قبل تعديل أي ملف. لا تفترض أن أسماء Models أو API Routes أو Auth Helpers المذكورة هنا موجودة حرفيًا. اكتشف الموجود، وحدد الفجوات، ثم اقترح أقل تغيير آمن يحقق المتطلبات.
>
> يجب أن تحافظ على سلوك النظام الحالي، وبيانات المستخدمين، والشركات، والأدوار والعلاقات والعمليات المحاسبية والمخزنية. لا تستخدم Mock Data أو Fake API أو UI-only Authorization.
>
> إذا وجدت تعارضًا بين الوثيقة والكود الحالي، لا تتجاهله ولا تخترع حلاً صامتًا؛ قدم `Current Behavior / Required Behavior / Risk / Recommended Change / Affected Files / Migration Impact` ثم طبق التغيير الآمن بعد التأكد من توافقه.
>
> كل Permission وRole وScope وAudit يجب أن يعتمد على بيانات حقيقية وقواعد قابلة للتفسير. وكل API حساس يجب أن يتحقق من Authentication وTenant وPermission وScope وBusiness/Workflow Rules.
>
> يجب منع Cross-Tenant Access وPrivilege Escalation وAPI Bypass، وحماية آخر Administrator، وإبطال Cache الصلاحيات بعد التغييرات، والحفاظ على تاريخ التدقيق.
>
> لا تعتبر المهمة منتهية حتى تنجح اختبارات الأمن، واختبارات التكامل، واختبارات Regression، وBuild/Typecheck، وتثبت عمليًا أن المستخدم غير المصرح له لا يستطيع الوصول إلى البيانات أو العمليات عبر UI أو API أو Print أو Export أو Import أو أي مسار بديل.

---

## 94. Final Security Architecture

```text
                         ORMINAL SECURITY CORE

                              ┌─────────┐
                              │  User   │
                              └────┬────┘
                                   │
                           Authentication
                                   │
                     ┌─────────────┴────────────┐
                     │                          │
                  Sessions                     MFA
                     │
                User Membership
                     │
                   Roles
                     │
             ┌───────┴────────┐
             │                │
       Role Inheritance   Permissions
                              │
                         Data Scope
                              │
                    Effective Permission
                              │
              ┌───────────────┼───────────────┐
              │               │               │
            Screen          API          Record Scope
           Access        Authorization     Filtering
              │               │               │
              └───────────────┼───────────────┘
                              │
                     Workflow Authorization
                              │
                     Business Validation
                              │
                           Decision
                              │
                           Audit
                              │
                  Notifications / Alerts
```

هذه البنية هي الهدف المعماري: **User → Role → Permission → Scope → Effective Authorization → Workflow/Business Validation → Allow/Deny → Audit**، مع الحفاظ على Authentication في طبقة مستقلة، وبقاء Odoo مرجعًا وظيفيًا لا مصدرًا للنسخ الحرفي.
