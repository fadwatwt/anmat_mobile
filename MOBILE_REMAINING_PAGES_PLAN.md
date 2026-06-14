# خطة استكمال نسخة الموبايل لتطابق نسخة الويب

> **الهدف:** جعل `anmat_mobile` طبق الأصل من `anmat_front-main` من حيث الصفحات والبيانات والمنطق والأدوار،
> مع تكييف التخطيط لشاشة الهاتف بنفس نسق الموبايل الجاهز (MaterialTopTabs، ListScreen/FormScreen/DetailScreen،
> الثيم/RTL/الترجمة). تاريخ المراجعة: **2026-06-13**.

تمت مراجعة `config/menuItems` في الطرفين + ملفات الشاشات + `RootNavigator.tsx` + صفحات الويب الفعلية.

---

## ملخّص تنفيذي — الفجوات المكتشفة

نسخة الموبايل أنجزت المعظم (Dashboard, HR كامل, Projects, Tasks, Agenda, Analytics, Social Media,
Profile, Conversations, AI, Subscribers, Industries, SystemAdmins, SupportTickets, MoneyMethods,
Subscriptions, Settings). لكن توجد **3 فئات نواقص**:

1. **شاشات موظّف موجودة كملفات لكنها Stub + غير موصولة بالـ Navigator** (4 شاشات).
2. **صفحات موجودة في الويب وغائبة كليًا من قائمة الموبايل** (8 صفحات).
3. **شاشات موصولة لكن تحتاج رفع جودة لتطابق الويب** (Analytics فرعية + Notifications).

---

## القسم 1 — شاشات Stub غير موصولة (✅ أُنجز 2026-06-13)

هذه الملفات موجودة لكنها بطاقة "قيد التطوير / قريبًا" فقط، **وغير مستوردة في
[src/navigation/RootNavigator.tsx](src/navigation/RootNavigator.tsx)** — أي عند الضغط عليها من القائمة
لا يحدث شيء (الـ route مُعرّف في `routeToScreen` بـ Sidebar لكن لا يوجد `Stack.Screen` مقابل).

| الشاشة (route) | الملف الحالي | صفحة الويب | أسطر الويب | ملاحظات |
|----------------|--------------|-----------|-----------|---------|
| `Attendance` (الحضور) | [AttendanceScreen.tsx](src/screens/AttendanceScreen.tsx) (stub 45س) | `(dashboard)/attendance/page.jsx` | 313 | يوجد بالفعل `services/attendance.ts` (checkin/checkout/all) — يحتاج فقط بناء الواجهة |
| `Salary` (راتبي) | [SalaryScreen.tsx](src/screens/SalaryScreen.tsx) (stub 45س) | `(dashboard)/salary/page.jsx` | 89 | جدول معاملات الراتب (مبلغ/مكافأة/خصم/تعليق/تاريخ) |
| `Leaves` (إجازات قصيرة) | [LeavesScreen.tsx](src/screens/LeavesScreen.tsx) (stub 45س) | `(dashboard)/leaves/page.jsx` | 40 | بسيطة نسبيًا |
| `Requests` (طلباتي) | [RequestsScreen.tsx](src/screens/RequestsScreen.tsx) (stub 45س) | `(dashboard)/requests/page.jsx` | 211 | طلبات (إجازة/سلفة/تأخير) + إنشاء طلب |

**ما تم فعله (2026-06-13):**
- `services/attendance.ts` صُحّح ليستخدم `api/employee/attendances` (+ check-in POST / check-out PUT بـ `start_time`/`end_time`).
- أُنشئت `services/{salary,leaves,requests}.ts` بالـ endpoints الصحيحة من redux الويب.
- أُعيدت كتابة الشاشات الأربع: AttendanceScreen (بطاقة check-in/out + سجل)، SalaryScreen (بطاقات معاملات)،
  LeavesScreen (جدول)، RequestsScreen (3 تبويبات + إلغاء + FAB + `requests/CreateRequestModal.tsx`).
- وُصلت الأربع في `RootNavigator.tsx` (الأسماء تطابق `routeToScreen` في Sidebar).
- أُضيفت 9 مفاتيح i18n ناقصة في `locales/{ar,en}`. `npx tsc --noEmit` تمر نظيفة.

---

## القسم 2 — صفحات ويب غائبة كليًا من قائمة الموبايل 🟠

موجودة في `dashboardSideMenuItems` بالويب وغير موجودة في `menuItems.ts` بالموبايل ولا كملفات شاشات.
**هذه أكبر فجوة في التطابق.**

| الصفحة | path الويب | أسطر الويب | الأدوار | الأولوية |
|--------|-----------|-----------|---------|---------|
| **Plans** (الباقات) + AI Token Plans | `/plans`, `/plans/ai-plans` | 320 | Admin | عالية (إدارية مهمة) |
| **Roles** (الأدوار) | `/roles/admins`, `/roles/employees` | 240 | Admin + Subscriber/Employee | عالية |
| **Permissions** (الصلاحيات) | `/permissions/admins`, `/permissions` | 80 | Admin + Subscriber | متوسطة |
| **Orders** (الطلبات/المبيعات) | `/orders` | 160 | Admin | متوسطة |
| **Companies** (الشركات) | `/companies` | 149 | Admin (قائمة MenuAdmin) | متوسطة |
| **Notifications** (الإشعارات) | `/notifications` | 228 | الجميع | عالية (زر الجرس بالـ Header موجود لكنه غير موصول) |
| **Timeline** (الخط الزمني) | `/time-line` | 20 | Subscriber/Employee | منخفضة (صفحة بسيطة) |
| **My Tasks / My Projects** | `/employee/tasks`, `/employee/projects` | 183 لكل | Employee | متوسطة (قد يُعاد استخدام شاشتي Tasks/Projects بفلتر "خاص بي") |

**الإجراء:**
1. ~~**Notifications أولًا**~~ ✅ **أُنجز (2026-06-13):** أُنشئت `services/notifications.ts`
   (GET `/api/notifications/:id/:type`، mark-as-read PATCH، mark-all PATCH) + `NotificationsScreen.tsx`
   (قائمة + شريط أولوية + وضع علامة مقروء/الكل). رُبط جرس [Header.tsx](src/components/Header.tsx) ليتنقّل
   للشاشة مع شارة عدد غير المقروء الحقيقية. أُضيف route في `RootNavigator` + عنوان في `DashboardLayout`.
   ملاحظة: صفحة الويب `/notifications` بيانات وهمية (mock)؛ بنينا على نظام الإشعارات الحقيقي (`notificationsApi`) بدلًا منها.
2. ~~**Plans / Roles / Permissions**~~ ✅ **أُنجز (2026-06-13):**
   - `services/plans.ts`: subscription-plans (list/delete/toggle-activity/toggle-trial) + ai/admin/token-packages (list/delete/toggle).
   - `services/roles.ts`: admin roles (`api/admin/roles`، perms في `admin_permissions_ids`) + subscriber roles (`api/subscriber/organization/roles`، perms في `permissions_ids`) + delete.
   - `services/permissions.ts`: قائمة صلاحيات (admin أو subscriber).
   - `PlansScreen.tsx` (MaterialTopTabs: باقات + حزم AI، بطاقات + toggle/delete عبر StatusActions، Admin فقط).
   - `RolesScreen.tsx` (يتفرّع حسب نوع المستخدم: Admin↔Subscriber؛ بطاقات + شارات صلاحيات + حذف).
   - `PermissionsScreen.tsx` (قائمة عبر ListScreen، للقراءة فقط).
   - أُضيفت لـ `menuItems.ts` + `Sidebar.routeToScreen` + `RootNavigator` + `DashboardLayout`.
   - **ملاحظة:** إنشاء/تعديل الباقات الكاملة (نماذج 400+ سطر بالويب) لم يُنقل — الموبايل يدعم العرض + التفعيل/الإيقاف/الحذف/التجربة. إضافة كاملة لاحقًا عند الحاجة.
   - ⚠️ **Orders / Companies تُخطّيا عمدًا**: صفحتا الويب بيانات وهمية (mock) بلا API حقيقي (قرار المستخدم 2026-06-13).
3. ~~**My Tasks / My Projects (Employee)**~~ ✅ **أُنجز (2026-06-13):**
   - أُضيفت دوال موظّف للخدمات: `tasks.ts` (`fetchMyTasks` GET `api/employee/tasks`، `updateMyTaskStatus` PUT `.../status-update`)
     و`projects.ts` (`fetchMyProjects` GET `api/employee/projects`).
   - `MyTasksScreen.tsx` (ListScreen: مهامي + عرض + تغيير الحالة عبر Alert) و`MyProjectsScreen.tsx` (ListScreen للعرض + فتح التفاصيل).
   - وُصلتا لـ `menuItems.ts` (Employee فقط) + Sidebar + RootNavigator + DashboardLayout.
   - ملاحظة: نموذج التقييم (EvaluationModal) عند الحالة `done` بالويب لم يُنقل؛ التغيير السريع للحالة على الموبايل يستثني `done`.
4. ⚠️ **Timeline تُخطّى عمدًا**: مكوّن الويب `TimeLine.jsx` بيانات وهمية ثابتة (hardcoded) بلا API — مثل Orders/Companies.

---

## القسم 3 — شاشات موصولة تحتاج رفع جودة / تأكيد تطابق 🟡

| الشاشة | الحالة | ما يلزم |
|--------|--------|---------|
| Analytics الفرعية ([analytics/](src/screens/analytics/)) | ✅ **دُقّقت (2026-06-13)** | تستهلك نفس الـ endpoints الحقيقية (`/api/{admin\|subscriber/organization\|employee}/analytics`) وتغطّي الأقسام الأساسية لكل دور (ملخّص/أداء/تقييم المهام + أداء/آخر المشاريع) عبر DonutChart/BarChart/GaugeChart وقوائم تقدّم. **فرق مقبول:** الويب يستخدم مكتبة رسوم أغنى (~40 مكوّن)؛ الموبايل يبسّطها برسوم مخصّصة مناسبة للهاتف. لا نقص بيانات حرِج — لا إجراء مطلوب. |
| Social Media — Facebook tab | placeholder "قريبًا" (يطابق الويب حاليًا) | لا إجراء حتى يُبنى في الويب |
| باقي شاشات القوائم | مبنية عبر `ListScreen` | تدقيق سريع: نفس الأعمدة والإجراءات (row actions) والفلاتر الموجودة بالويب |

---

## خطة التنفيذ المقترحة (مراحل)

**المرحلة A (إصلاح كسور فورية):** وصل الشاشات الأربع في القسم 1 + بناء واجهاتها الحقيقية.
بهذا تتوقف عناصر قائمة الموظّف عن كونها "ميتة".

**المرحلة B (إشعارات):** NotificationsScreen + ربط الجرس. أعلى أثر على تجربة المستخدم.

**المرحلة C (الصفحات الإدارية الغائبة):** Plans, Roles, Permissions, Orders, Companies.

**المرحلة D (تكميل):** My Tasks/My Projects للموظّف + Timeline + تدقيق Analytics.

**معيار القبول لكل شاشة:** نفس البيانات/الأعمدة/الإجراءات/قيود الأدوار كالويب، تمرّ `npx tsc --noEmit` نظيفة،
وتدعم RTL/الثيم/الترجمة (مع إضافة مفاتيح i18n في `locales/{ar,en}/translation.json`).

---

## القسم 4 — تدقيق المودالز (ويب ↔ موبايل) — 2026-06-13

الويب فيه ~78 مودالًا. التصنيف بعد التدقيق الكامل:

### ✅ مغطّاة (مودال موبايل أو شاشة كاملة مكافئة)
CreateEmployee/Edit/Invite، AssignDepartment، SendNotification، EditProfile، ChangePassword،
CreateRequest، CreateAgenda/AddToAgenda، Create/Edit Department/Position/Salary/Leave/Attendance (inline FormScreen)،
EditTask/EditProject (شاشات)، CreateTicket.

### ✅ أُضيفت في هذه الجولة (2026-06-13)
- **Industries**: `CreateIndustryModal` (إنشاء/تعديل/حذف، `api/admin/industries`) — موصول في IndustriesScreen.
- **System Admins**: `CreateAdminModal` (إنشاء + اختيار أدوار متعدّد، `api/admin/admins`) — موصول في SystemAdminsScreen.

### ⛔ تُخطّى عمدًا — لا backend حقيقي (بيانات وهمية/GET فقط بالويب)
هذه صفحاتها/مودالاتها في الويب mock — بناؤها بالموبايل = اختراع وظائف:
- **HR Meetings** (CreateMeeting/Invite) — صفحة الويب mock.
- **HR Holidays** (AddHoliday/DeleteHoliday) — mock.
- **HR Teams** (CreateTeam/TeamRating/Evaluation) — `teamsFactory` mock.
- **HR Chats** (CreateChatGroup/CreatePoll/ChatDetails) — "// Mock Data" (الدردشة الحقيقية = Conversations موجودة بالموبايل).
- **Money Receiving** (CreateMoneyReceiving) — الـ API فيه GET فقط، لا mutation.
- **Notifications** (CreateNotification/Details) — صفحة الويب mock (بنينا على نظام الإشعارات الحقيقي).

### 🟡 مودالات "إدارة/إنشاء" بـ API حقيقي لكنها لم تُنقل بعد (نطاق مؤجّل)
الشاشات موجودة للعرض؛ هذه إضافات إنشاء/إدارة متقدّمة:
- **Plans**: CreatePlan/EditPlan/TokenPackage (نماذج 400+ سطر).
- **Roles/Permissions**: AddRole/AddSubscriberRole/SyncPermissions/AddPermission (إنشاء أدوار + مزامنة صلاحيات).
- **Social Media**: AddTwitterAccount/Edit/Import/AddCategory/SetQuota (إدارة حسابات تويتر).
- **Subscriptions**: AddNewPayment/ChangeBillingInfo/IncreaseFeatures (الدفع/الفوترة).
- **Projects**: ProjectRating/SaveAsTemplate/CreateTeam.
- **Tasks**: EvaluationModal (تقييم عند `done`).
- **Profile**: AddRequest/AddToDoList/EditOrganization/EditAdminProfile.

### ⛔ مودالات أدوات ويب لا لزوم لها بالموبايل
Modal.jsx (حاوية)، TabModal، LoginAccountsModal، SendAdminNotificationModal، CreateAppointmentFromTaskModal.

---

## مراجع سريعة
- مصدر الحقيقة للقوائم: ويب `src/config/menuItems.js` ↔ موبايل `src/config/menuItems.ts`.
- نمط شاشة قائمة جاهز: [SubscribersScreen.tsx](src/screens/SubscribersScreen.tsx) (يستخدم `generators/ListScreen`).
- نمط تبويبات: AgendaScreen / SocialMediaScreen (MaterialTopTabs).
- التوصيل: `RootNavigator.tsx` (`<Stack.Screen>`) + `Sidebar.tsx` (`routeToScreen`) + `menuItems.ts` (`allowedTo`).
