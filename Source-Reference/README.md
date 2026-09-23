# دليل المستخدمين في Odoo 19.0

> **نسخة موحّدة وشاملة:** يجمع هذا الملف صفحات `content/applications/general/users` وصفحتي بوابة المستخدمين التابعتين لها في مستند واحد. أُدرجت الصور في مواضعها باستخدام روابط مباشرة إلى ملفات الصور في نفس الفرع، لذلك تظهر داخل GitHub ولا تحتاج إلى فتح صفحة أخرى.

## المحتويات

- [حقوق الوصول](#حقوق-الوصول)
  - [الأدوار](#الأدوار)
  - [صلاحيات المستخدم](#صلاحيات-المستخدم)
  - [المجموعات](#إنشاء-وتعديل-المجموعات)
  - [مهل الجلسة وعدم النشاط](#مهل-الجلسة-وعدم-النشاط)
  - [وضع المستخدم الخارق](#وضع-المستخدم-الخارق)
- [المصادقة الثنائية](#المصادقة-الثنائية)
- [بوابات المستخدمين](#بوابات-المستخدمين)
  - [منح الوصول](#منح-الوصول-إلى-البوابة)
  - [تحديث بيانات البوابة](#تحديث-بيانات-البوابة)
- [تغيير اللغات](#تغيير-اللغات)
- [مصادقة LDAP](#مصادقة-ldap)
- [تسجيل الدخول بواسطة Google](#تسجيل-الدخول-بواسطة-google)
- [تسجيل الدخول بواسطة Microsoft Azure](#تسجيل-الدخول-بواسطة-microsoft-azure)
- [تسجيل الدخول بواسطة Facebook](#تسجيل-الدخول-بواسطة-facebook)

---

# حقوق الوصول

حقوق الوصول هي الأذونات التي تحدد المحتوى والتطبيقات التي يمكن للمستخدمين الوصول إليها أو تعديلها. يمكن ضبطها لمستخدم منفرد أو لمجموعة مستخدمين. ويضمن تقييد الأذونات على من يحتاجها فقط عدم تعديل المستخدمين أو حذفهم لبيانات لا ينبغي لهم الوصول إليها.

لا يستطيع تغيير حقوق الوصول إلا **المسؤول**. وقد تؤدي التغييرات غير الصحيحة إلى فقدان قدرة جميع المستخدمين على إدارة الحقوق (حالة *impotent admin*)؛ لذلك يُنصح باختبار التغييرات والتواصل مع محلل أعمال Odoo أو فريق الدعم قبل تعديل إعدادات حساسة.

ولكي يغيّر مسؤولٌ إعدادات مستخدم آخر، يجب أن تكون قيمة **Administration** في ملفه الشخصي هي **Access Rights**. المسار: **Settings → Manage Users → اختر المستخدم → Access Rights → Administration → Administration**، ثم احفظ التغيير.

## الأدوار

يُسند الدور عند إضافة المستخدم، وتحدد المجموعات حقوقه التفصيلية. الأدوار الأربعة هي:

- **Administrator:** مستخدم داخلي يملك الوصول إلى الميزات التقنية وإنشاء المنتجات والتصدير والصلاحيات المتقدمة.
- **User:** مستخدم داخلي يستطيع عادةً الوصول إلى الواجهة الخلفية وإنشاء السجلات وتعديلها، بصلاحيات أقل من المسؤول.
- **Portal:** عميل أو مورّد يصل إلى بياناته من خلال البوابة.
- **Public:** زائر الموقع أو مستخدم خارجي، وهو الأقل صلاحية عادةً.

## صلاحيات المستخدم

تُضبط الصلاحيات الأولية عند إضافة المستخدم ويمكن تعديلها لاحقاً:

1. افتح تطبيق **Settings** ثم **Manage Users**.
2. افتح ملف المستخدم المطلوب.
3. من تبويب **Access Rights** راجع أقسام التطبيقات.
4. استخدم القائمة المنسدلة لكل تطبيق واختر المستوى المناسب: **Blank/None** أو **User: Own Documents** أو **User: All Documents** أو **Administrator**.
5. راجع قسم **Administration** واختر **Settings** أو **Access Rights** عند الحاجة، ثم احفظ.

![قائمة المستخدمين](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/navigate-to-users-menu.png)

![قائمة صلاحيات التطبيق](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/user-permissions-dropdown-menu.png)

### الصلاحيات التفصيلية

فعّل **Developer mode**، ثم افتح **Settings → Manage Users → المستخدم → Technical Access Rights**. تظهر قائمتان:

- **Selected groups:** مجموعات الصلاحيات التفصيلية الناتجة عن اختيارات تبويب Access Rights.
- **Groups added automatically:** مجموعات موروثة أو ضمنية تضاف تلقائياً بسبب المجموعات المختارة.

لإضافة صلاحية، اضغط **Add a line** في Selected groups. ولحذفها اضغط أيقونة الإلغاء في نهاية الصف. لا يمكن حذف الصلاحيات الموروثة من قائمة Groups added automatically، لكنها تتأثر بتغيير المجموعة الأصلية.

الألوان والدلالات:

- الأخضر: الصلاحية ممنوحة أصلاً بواسطة صلاحية أخرى.
- الأحمر: صلاحيات متعارضة لا يمكن تفعيلها معاً.
- المائل: صلاحية ضمنية موروثة غالباً.

![الصلاحيات التقنية](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/tech-access-rights.png)

## إنشاء وتعديل المجموعات

المجموعات هي حزم صلاحيات خاصة بالتطبيقات، وتفيد في إدارة عدد كبير من المستخدمين. بعد تفعيل وضع المطوّر، انتقل إلى **Settings → Users & Companies → Groups**.

![الوصول إلى Users & Companies](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/click-users-and-companies.png)

اضغط **Create** لإنشاء مجموعة، أو افتح مجموعة موجودة لتعديلها. اختر **Application**، واكتب **Name**، وفعل **Share Group** إذا كانت المجموعة مخصصة لمشاركة البيانات. اختبر دائماً أثر التغيير على مستخدم تجريبي قبل اعتماده.

![نموذج المجموعة](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/groups-form.png)

تبويبات نموذج المجموعة:

- **Users:** المستخدمون الحاليون في المجموعة؛ الأسود إداريون والأزرق مستخدمون عاديون.
- **Inherited:** مجموعات تُمنح تلقائياً لكل مستخدم يضاف إلى هذه المجموعة.
- **Menus:** القوائم التي يمكن للمجموعة الوصول إليها.
- **Views:** عروض Odoo المتاحة للمجموعة.
- **Access Rights:** حقوق المستوى الأول للنماذج. لكل نموذج يمكن تفعيل **Read** و**Write** و**Create** و**Delete**.
- **Record Rules:** المستوى الثاني للتحكم في الظهور والتعديل، ويستخدم تعبيرات domain. مثال: `[(\'mrp_production_ids\', \'in\', user.partner_id.commercial_partner_id.production_ids.ids)]`.

![اسم حق الوصول](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/access_rights/name-field.png)

في **Record Rules** يمكن تفعيل **Apply for Read/Write/Create/Delete**. القواعد تُنقّح أو تتجاوز حقوق النموذج، ولذلك يجب ألا تُعدل إلا مع فهم domains أو بعد استشارة مختص.

## مهل الجلسة وعدم النشاط

عند تثبيت وحدة `auth_timeout` (وقد تثبتها بعض التوطينات تلقائياً) يظهر تبويب **Timeouts** في نموذج المجموعة.

### مهلة عدم النشاط

فعّل **Inactivity**، ثم اختر **Screen lock** أو **Screen lock with two-factor authentication**، وحدد المدة ووحدتها (دقائق أو ساعات أو أيام). يُقفل الحساب بعد فترة عدم استخدام، وقد يطلب 2FA عند العودة.

### مهلة الجلسة

فعّل **Session**، ثم اختر **Logout** أو **Logout with two-factor authentication**، وحدد مدة الجلسة ووحدتها. تنتهي الجلسة بعد المدة المحددة بغض النظر عن نشاط المستخدم.

## وضع المستخدم الخارق

بعد تفعيل وضع المطوّر، افتح قائمة التصحيح (أيقونة الحشرة) ثم اضغط **Become Superuser**. لا يتوفر ذلك إلا لمن لديه **Settings** في قسم Administration.

يحايل هذا الوضع على حقوق الوصول وقواعد السجلات؛ استخدمه بحذر شديد. قد يؤدي الخروج منه بعد تغييرات غير صحيحة إلى قفل المسؤولين عن قاعدة البيانات. للخروج، سجّل الخروج من قائمة اسم **OdooBot**. ويمكن الدخول من صفحة تسجيل الدخول عبر **Log in as superuser**.

---

# المصادقة الثنائية

المصادقة الثنائية (2FA) إجراء أمني يمنع الوصول غير المصرح به؛ إذ تتطلب كلمة المرور ورمزاً من تطبيق مصادقة يحتوي على سر خاص بالحساب.

## المتطلبات

يمكن استخدام تطبيقات هاتف مثل Authy وFreeOTP وGoogle Authenticator وLastPass Authenticator وMicrosoft Authenticator، أو مديري كلمات المرور مثل 1Password وBitwarden. هذه أمثلة وليست توصيات أو اعتماداً لمنتج محدد.

## تفعيل 2FA

1. سجّل الدخول، واضغط صورة الحساب، ثم **My Preferences**.
2. افتح تبويب **Security** واضغط **Enable 2FA**.
3. أدخل كلمة مرور Odoo واضغط **Confirm Password**.
4. امسح رمز QR في نافذة **Two-Factor Authentication Activation** بتطبيق المصادقة.
5. إذا تعذر المسح، اضغط **Cannot scan it?** وانسخ السر لإعداده يدوياً.
6. أدخل رمز التحقق ذي الستة أرقام واضغط **Enable Two-Factor Authentication**.

![تبويب أمان الحساب](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/account-security.png)

![رمز QR](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/qr-code.png)

![السر اليدوي](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/secret-visible.png)

![رمز تطبيق المصادقة](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/authenticator.png)

![نجاح التفعيل](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/2fa-enabled.png)

## تسجيل الدخول بعد التفعيل

سجّل الخروج، ثم أدخل اسم المستخدم وكلمة المرور واضغط **Log in**. في صفحة 2FA أدخل الرمز في **Authentication Code** واضغط **Log in**.

![تسجيل الدخول مع 2FA](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/2fa-login.png)

إذا فقد المستخدم تطبيق المصادقة، يجب على مسؤول تعطيل 2FA لحسابه قبل أن يتمكن من الدخول.

## فرض 2FA على المستخدمين

من **Settings → Permissions** فعل **Enforce two-factor authentication**، واختر **Employees only** أو **All users**، ثم اضغط **Save**. يشمل خيار All users مستخدمي البوابة أيضاً. إذا تكرر طلب الدخول وإتمام 2FA، راجع مهل الجلسة وعدم النشاط في مجموعات المستخدمين.

![إعداد فرض 2FA](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/2fa/enforce-settings.png)

---

# بوابات المستخدمين

بوابة المستخدمين وحدة متاحة افتراضياً. يمكن منح العملاء والمورّدين وصولاً لعرض أو متابعة أو دفع الطلبات والفواتير، إدارة طرق الدفع والاشتراكات والعناوين، وضبط معلمات الاتصال بخدمات خارجية. مستخدم البوابة يملك صلاحية القراءة والعرض فقط ولا يستطيع تعديل مستندات قاعدة البيانات.

## منح الوصول إلى البوابة

يبدأ الإجراء من تطبيق **Contacts**:

1. أنشئ جهة اتصال جديدة أو افتح جهة موجودة.
2. من قائمة **Actions** اختر **Grant portal access**.
3. راجع نافذة **Portal Access Management**: جهة الاتصال، البريد المستخدم للدخول، وآخر مصادقة.
4. أدخل البريد عند الحاجة واضغط **Grant Access**. يرسل Odoo رسالة دعوة.

![منح الوصول من Contacts](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/user_portals/portal_access/grant-portal-access.png)

![نافذة إدارة الوصول](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/user_portals/portal_access/portal-access-management.png)

عند منح الوصول لشركة، يُمنح جميع جهات الاتصال التابعة لها الوصول؛ ويمكن إزالة جهات فردية لاحقاً. لمنح الوصول لعدة مستخدمين: افتح جهة الشركة ثم **Action → Grant portal access**، واختر **Grant Access** لكل جهة اتصال.

![منح الوصول لعدة مستخدمين](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/user_portals/portal_access/multiple-user-access.png)

### إلغاء الوصول

افتح جهة الاتصال، ثم **Action → Grant portal access → Revoke Access**.

![إلغاء وصول المستخدم](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/user_portals/portal_access/revoke-user-access.png)

## تحديث بيانات البوابة

يمكن للمستخدم من لوحة البوابة تحديث معظم بياناته، بينما تحتاج بعض التغييرات إلى مسؤول. كلمات مرور مستخدمي البوابة وكلمات مرور Odoo.com منفصلة حتى إذا استُخدم البريد نفسه.

### تحديث بيانات الاتصال

من لوحة البوابة اضغط **Edit information**. يمكن تعديل الاسم والبريد والهاتف واسم الشركة والعنوان وتفضيل إرسال الفواتير. احفظ عبر **Save Address** أو تراجع عبر **Discard**. بعد إنشاء مستندات للحساب لا يمكن للمستخدم تغيير الدولة؛ يجب التواصل مع مسؤول.

### تحديث طرق الدفع

اضغط **Payment methods**، واختر طريقة الدفع وأدخل بياناتها واضغط **Save**. للحذف اضغط أيقونة سلة المهملات ثم **Confirm Deletion**. لا يمكن تعديل بيانات طريقة دفع محفوظة؛ يجب حذفها وإدخالها من جديد.

### كلمة المرور والأمان

من **Connection & Security**:

- **Change Password:** أدخل كلمة المرور الحالية والجديدة ثم احفظ.
- **Two-factor authentication:** يعرض الحالة، ويوفر **Enable two-factor authentication** أو **Disable two-factor authentication**.
- **Passkeys:** اضغط **Add Passkey**، أكد كلمة المرور، سمِّ المفتاح، اضغط **Create** وأكمل نافذة المتصفح. يمكن إعادة التسمية أو الحذف.
- **Revoke All Sessions:** اضغط **Log out from all devices**، أكد كلمة المرور؛ تُغلق كل الجلسات عدا الحالية.
- **Delete Account:** الحذف نهائي وغير قابل للعكس، ويتطلب كلمة المرور واسم الدخول، مع خيار إضافة البريد والهاتف إلى قائمة حظر الاتصالات المستقبلية.

### تعديلات المسؤول

من **Settings → Users → Manage Users** أزل مرشح **Internal Users**، وأضف مرشح **Portal Users**، ثم افتح المستخدم.

- يغيّر المسؤول البريد من حقل **Email**. لا يستطيع المستخدم تغيير اسم الدخول بنفسه؛ تغيير **Login** يغيّر اسم المستخدم فقط.
- من تبويب **Security** يمكن استخدام **Change password** لتعيين كلمة مرور، أو **Invite to use 2FA** لإرسال دعوة تفعيل المصادقة الثنائية.

---

# تغيير اللغات

تُحدد لغة قاعدة البيانات عند إنشائها، ويمكن تثبيت لغات إضافية ليستعملها المستخدمون أو لترجمة الموقع.

## إضافة لغة

إما أن تضغط صورة الحساب ثم **My profile** ثم أيقونة الكرة الأرضية بجانب **Language**، أو تفتح **Settings** وتضغط **Add Languages** في قسم **Languages**. اختر اللغات واضغط **Add**.

## اختيار اللغة وتغيير لغة مستخدم آخر

يختار المستخدم لغته من **My profile → Language**. لتغيير لغة مستخدم آخر، افتح **Settings → Manage Users → المستخدم → Preferences**، واختر لغة مثبتة من **Language**. تُرسل الرسائل والمستندات لذلك المستخدم باللغة المختارة.

---

# مصادقة LDAP

1. افتح **Settings**، وانزل إلى **Integrations** وفعل **LDAP Authentication**.
2. احفظ، ثم اضغط **LDAP Server** وأنشئ سجلاً جديداً واختر الشركة.
3. في **Server information** أدخل عنوان LDAP والمنفذ، وفعل **Use TLS** إذا كان StartTLS مفعلاً.
4. في **Login information** أدخل `LDAP binddn` و`LDAP password`. تركهما فارغين ينفذ الاستعلام بشكل مجهول.
5. في **Process parameter** أدخل قاعدة LDAP بصيغة مثل `dc=example,dc=com`، واجعل المرشح `uid=%s`.
6. في **User information** فعل **Create user** لإنشاء مستخدم Odoo عند أول دخول، واختر **User template**؛ وإذا لم تختر قالباً يستخدم Odoo ملف المسؤول.

عند استخدام Microsoft Active Directory وظهور مشاكل دخول رغم صحة البيانات، فعّل وضع المطور، ثم **Settings → Technical → System Parameters → New**، وأنشئ:

- **Key:** `auth_ldap.disable_chase_ref`
- **Value:** `True`

---

# تسجيل الدخول بواسطة Google

يتيح Google Sign-In للمستخدمين الدخول إلى Odoo بحساب Google. **تحذير:** لا تستخدم OAuth لمالك أو مسؤول قاعدة مستضافة على Odoo.com، لأن ذلك قد يفصل قاعدة البيانات عن حساب Odoo.com ويمنع تكرارها أو إعادة تسميتها أو إدارتها من البوابة.

## إعداد Google API

1. افتح [Google API Dashboard](https://console.developers.google.com/) واختر المشروع الصحيح، أو اضغط **Create Project** وأدخل تفاصيل الشركة.

![تفاصيل المشروع](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/new-project-details.png)

2. من **OAuth consent screen** اختر **Internal** أو **External** ثم **Create**.

![اختيار OAuth consent](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/consent-selection.png)

![نوع المستخدم](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/consent.png)

الحسابات الشخصية Gmail تكون External وقد تحتاج موافقة أو Scopes؛ يسمح Google Workspace عادةً بـ Internal. وفي وضع External التجريبي يمكن إضافة 100 مستخدم اختبار دون موافقة.

3. أكمل البيانات، واضغط **Save and Continue** في Details وScopes. في وضع External أضف المستخدمين في **Test users**، ثم **Save and Continue** و**Back to Dashboard**.
4. افتح **Credentials → Create Credentials → OAuth client ID**.

![Credentials](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/credentials-button.png)

![اختيار OAuth client ID](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/client-id.png)

5. اختر **Web Application**. في **Authorized redirect URIs** أدخل نطاق Odoo متبوعاً بـ `/auth_oauth/signin`، مثل `https://mydomain.odoo.com/auth_oauth/signin`، ثم **Create**.
6. انسخ **Client ID** (ويظهر أيضاً Client Secret) لاستخدامه في Odoo.

![المعرفات التي أنشأها Google](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/secret-ids.png)

## تفعيلها في Odoo

1. من **Settings → Integrations** فعل **OAuth Authentication**، واحفظ. قد يطلب Odoo تسجيل الدخول من جديد.
2. عد إلى **Integrations → OAuth Authentication** وفعل الإعداد واحفظ، ثم افتح **Google Authentication** وفعلها.
3. أدخل Client ID واحفظ. ويمكن الوصول إلى الإعداد من **OAuth Providers**.

![إدخال Client ID](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/odoo-client-id.png)

## تسجيل الدخول

في أول دخول اضغط **Log in with Google**. على المستخدم الحالي إعادة تعيين كلمة المرور للوصول إلى الصفحة، أما المستخدم الجديد فيمكنه الضغط على الزر بدلاً من تعيين كلمة مرور.

![أول دخول](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/google/first-login.png)

---

# تسجيل الدخول بواسطة Microsoft Azure

يتيح Azure OAuth تسجيل الدخول بحساب Microsoft. لا تستخدمه لمالك أو مسؤول قاعدة Odoo.com للأسباب نفسها الخاصة بفصل الحساب.

## إعداد معامل Odoo

فعّل وضع المطور، ثم **Settings → Technical → System Parameters → New**، وأضف:

- **Key:** `auth_oauth.authorization_header`
- **Value:** `1`

## إنشاء تطبيق Azure

1. افتح [Azure Portal](https://portal.azure.com/) بحساب إداري، ثم **Manage Microsoft Entra ID**.
2. اختر **Add (+) → App registration**. سمِّ التطبيق `Odoo Login OAuth`.
3. اختر نوع الحساب المناسب: **Single tenant** للمستخدمين الداخليين، أو **Personal Microsoft accounts only** لمستخدمي البوابة.
4. في Redirect URL اختر **Web** وأدخل `https://<odoo base url>/auth_oauth/signin`، ثم **Register**.
5. افتح **Authentication** وفعل **Access tokens (used for implicit flows)** و**ID tokens (used for implicit and hybrid flows)**، ثم احفظ.

![إعداد رموز المصادقة](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/azure/authentication-tokens.png)

6. من **Overview** انسخ **Application (client) ID**. ومن **Endpoints** انسخ **OAuth 2.0 authorization endpoint (v2)**.

![بيانات تطبيق Azure](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/azure/overview-azure-app.png)

7. من **Manage → API permissions → Add a Permission → Microsoft Graph → Delegated Permissions** اختر `User.Read` واضغط **Add permissions**. يحتاج Odoo هذه الصلاحية لقراءة معلومات الملف الشخصي.

## إعداد مزود Odoo

من **Settings → Integrations** فعل OAuth Authentication واحفظ، ثم **OAuth Providers → New** وأدخل:

- **Provider name:** `Azure`
- **Client ID:** Application (client) ID
- **Authorization URL:** OAuth 2.0 authorization endpoint (v2)
- **UserInfo URL:** `https://graph.microsoft.com/oidc/userinfo`
- **Scope:** `openid profile email`
- **CSS class:** `fa fa-fw fa-windows`
- فعل **Allowed**
- **Login button label:** `Microsoft Azure`

![إعداد مزود Azure في Odoo](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/azure/odoo-provider-settings.png)

احفظ. لربط حساب المستخدم أول مرة، استخدم صفحة إعادة تعيين كلمة مرور Odoo أو رابط دعوة المستخدم الجديد واضغط **Microsoft Azure**، ثم سجل الدخول بحساب Microsoft واقبل صلاحيات التطبيق. قد يطلب 2FA من Microsoft.

---

# تسجيل الدخول بواسطة Facebook

يتيح Facebook OAuth الدخول بحساب Facebook. لا تستخدمه لمالك أو مسؤول قاعدة Odoo.com حتى لا تنفصل قاعدة البيانات عن حساب Odoo.com.

## إعداد Meta for Developers

1. افتح [Meta for Developers](https://developers.facebook.com/) وسجل الدخول، ثم **My Apps → Create App**.
2. اختر **Authenticate and request data from users with Facebook Login** ثم **Next**.
3. سمِّ التطبيق `Odoo Login OAuth`، راجع شروط Meta والسياسات، ثم **Create app**.
4. من لوحة التطبيق اضغط **Customize adding a Facebook Login button**.

![متطلبات التطبيق](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/facebook/app-requirements.png)

5. من **Customize → Settings** أدخل في **Valid OAuth Redirect URIs**: `https://<odoo base url>/auth_oauth/signin`، ثم **Save changes**.
6. من **App settings → Basic** أدخل سياسة الخصوصية `https://www.odoo.com/privacy`، ارفع أيقونة، وأدخل رابط حذف البيانات `https://www.odoo.com/documentation/17.0/administration/odoo_accounts.html`، واختر **Business and pages**، ثم احفظ.

![الإعدادات الأساسية وApp ID](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/facebook/app-id.png)

7. بعد اعتماد التطبيق انسخ **App ID**. من **Publish** أكمل التحقق المطلوب واضغط **Publish**.

## إعداد Odoo

1. فعّل وضع المطور.
2. من **Settings → Integrations** فعل **OAuth Authentication** واحفظ.
3. بعد تسجيل الدخول افتح **Settings → Users & Companies → OAuth Providers → Facebook Graph**.
4. أدخل App ID في **Client ID** وفعل **Allowed**.

![تفعيل OAuth](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/facebook/enable-oauth.png)

![مزود Facebook Graph](https://raw.githubusercontent.com/AbdullahMaresh9/documentation/19.0/content/applications/general/users/facebook/facebook-graph.png)

---

## ملاحظات الصور والملفات المصدرية

هذا الملف يضم محتوى الصفحات التالية في مستند واحد: `2fa.rst`، `access_rights.rst`، `azure.rst`، `facebook.rst`، `google.rst`، `language.rst`، `ldap.rst`، `user_portals.rst`، `user_portals/portal_access.rst`، و`user_portals/updating_portal_info.rst`. الصور ليست روابط تنقل إلى صفحات شرح؛ إنها عناصر Markdown مضمّنة في مواضع الشرح وتُحمّل مباشرة من ملفات الصور في فرع `19.0`.
