# خطة التطابق الكامل — نسخة الموبايل ↔ نسخة الويب

> **الهدف:** جعل `anmat_mobile` طبق الأصل من `anmat_front-main` (الويب) من حيث الصفحات والبيانات
> والمنطق والأدوار والمودالات، مع تكييف التخطيط لشاشة الهاتف بنفس نسق الموبايل الجاهز
> (MaterialTopTabs، ListScreen/FormScreen/DetailScreen، الثيم/RTL/الترجمة).
> تاريخ الإصدار: **2026-08-13**.

## قواعد ثابتة

1. **المصدر المرجعي:** `anmat_front-main` (الويب).
2. **تخطّي الصفحات الوهمية (لا API حقيقي):**
   - `/orders` و`/companies` و`/time-line` (بيانات hardcoded).
   - مودالات HR Meetings/Holidays/Teams (mock في الويب).
   - تبويب Facebook في Social Media (placeholder في الويب).
3. **تضمين بالكامل:** مكالمات WebRTC، دفع Stripe، أتمتة وسائل التواصل.
4. **معيار القبول لكل شاشة:** نفس البيانات/الأعمدة/الإجراءات/قيود الأدوار كالويب +
   `npx tsc --noEmit` نظيفة + دعم RTL/الثيم/الترجمة + إضافة مفاتيح i18n المفقودة.
5. **أسلوب التنفيذ:** إكمال كل صفحة بتفاصيلها كاملًا قبل الانتقال للتالية.
6. **تحذير:** قراءة توثيق Expo v56 (`https://docs.expo.dev/versions/v56.0.0/`) قبل أي كود.

---

## المرحلة 0 — أساسيات مشتركة

| البند | التفصيل | الحالة |
|---|---|---|
| منيو الويب على الموبايل | بحث (`SearchInput`) + طيّ الأقسام في `Sidebar.tsx` لمطابقة `DashboardSideMenu.jsx` | ✅ |
| تدفقات المصادقة | ربط `VerificationScreen` (حاليًا ميت) + نسيان كلمة المرور (sent + reset) + تسجيل Subscriber متعدد الخطوات + تفعيل Employee + OTP | ✅ |
| الـ Header | قائمة المستخدم (Avatar → Profile مثل `HeaderUserMenu`) + قوائم Messages/Notifications المنسدلة | ✅ |

## المرحلة 1 — My Work (الموظف)

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Attendance | فحص/خروج + جدول (Date/Check In/Check Out) + صلاحيات create/update | ✅ |
| Salary | بطاقات مكافئة (amount/bonus/discount/comment/date) | ✅ |
| Leaves | جدول كامل + modals (Add/Edit/Delete) + FAB | ✅ |
| Requests | 4 تبويبات (Day Off/Financial/Delay/Short Leave) + إنشاء + إلغاء | ✅ |
| My Tasks | `EvaluationModal` عند إكمال مهمة `done` | ✅ (موجود في MyTasks/Tasks/TaskDetail/Projects/ProjectDetail) |
| My Projects | تفاصيل + تقييم + أعمدة (Manager/Start Date/Assignees) | ✅ |

## المرحلة 2 — Work Management

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Projects | تبويبات + Create wizard + Detail كامل (أعضاء/مهام/تعليقات/مرفقات/نشاط/خط زمني/تقييم) + SaveAsTemplate + Edit + CreateTeam | ✅ (Detail كامل مع Project Members card (إضافة/إزالة أعضاء وفِرق + إنشاء/حذف فريق مرتبط) + Tasks card بأساليب الويب (تغيير حالة + أولوية + مراحل قابلة للفتح) + Create wizard بمرحلتين: إنشاء/نشر المشروع ثم إضافة المهام واحدة تلو الأخرى؛ الخط الزمني الحقيقي في الويب هو Activity Logs (TimeLine الافتراضي mock معطّل) والموجود هنا في قسم Activity) |
| Tasks | فلاتر وحالات + Create/Edit + Detail كامل + تعليقات + تقييم | ✅ |
| Agenda/Appointments | create/[id] detail + modals (EditAppointment, CreateAppointmentFromTask, CreateAgenda, EditDailyTask, EditReminder, AddToAgenda) | ✅ (CreateAgenda بثلاثة تبويبات + Today/Calendar/List + إكمال/إلغاء + EditAppointment + EditDailyTask + EditReminder + AddToAgenda + CreateAppointmentFromTask + AppointmentDetailScreen مع Notes/Attendees/LinkedTask + إدارة Reminders في Today + ربط في المهام) |

## المرحلة 3 — Team Management (HR)

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Employees | Create/Edit wizard + CompleteProfile + Invite + SendNotification + AssignDepartment + Salary/Leave/Attendance CRUD + ViewRequest + Employee Profile كامل | ✅ (إجراء Chat في `EmployeeListScreen` يعمل: يفتح/ينشئ محادثة مباشرة مع الموظف ثم يتنقّل إلى Conversations) |
| Departments | CRUD + CreateChatGroup + Department Profile | ✅ (حذف + CreateChatGroup + Department Profile أُضيفت في شاشة القطاعات `HRDepartmentsScreen` / `DepartmentProfileScreen` / `CreateChatGroupModal`) |
| Positions | CRUD كامل | ✅ (زر حذف أُضيف في `HRPositionsScreen`) |
| HR Chats | CreateChatGroup + Poll + ChatDetails | ✅ (HRChatsScreen tabs Chats/Chat Permissions + CreateChatModal/ChatDetailsModal/AddChatParticipantsModal + الاستطلاعات في Conversations) |

## المرحلة 4 — التواصل والمحتوى

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Conversations | Threads + Polls + مرفقات + NewConversation + ChatDetails + المكالمات WebRTC بالكامل | ✅ (قائمة بحث + Active/Archived + NewConversationModal + مرفقات (رفع/عرض صورة وملف) + استطلاعات + ChatDetails (أرشفة/تصدير/إضافة/إزالة أعضاء) + تعديل/حذف/رد (ThreadModal) + Reactions + Typing + بحث داخل المحادثة + مكالمات WebRTC صوت/فيديو 1:1 وجماعية عبر `src/calls` (CallProvider/GroupCallProvider + Overlays) — يتطلب إعادة بناء Native (`expo run:android`) لأن react-native-webrtc لا يعمل في Expo Go) |
| Social Media | إدارة حسابات Twitter (Add/Edit/Import/Delete) + Categories + أتمتة (نشر/إعجاب/متابعة/رد) + SetQuota | ✅ (Add/Edit/Delete + Categories + Quota + Import CSV عبر `ImportAccountsModal` (DocumentPicker + فئة) + Login/2FA عبر `LoginAccountsModal` (فحص الحسابات مع User Agent) + أتمتة: `PostTweetModal` (نشر يدوي مع صور) + `FollowModal` (متابعة/إلغاء) + `LikeModal` (إعجاب/إلغاء) + `ReplyModal` (رد عبر ملف txt مؤقت بـ expo-file-system) — كلها مطابقة لعقود tweetAPI في الويب مع نفس الأذونات `social_media_actions.*` و`social_media_accounts.*`؛ الأزرار مدمجة في TwitterTab) |

## المرحلة 5 — Analytics و AI

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Analytics | رفع جودة الرسوم لمطابقة أقسام الويب الثلاثة | ✅ (رسوم SVG حقيقية: Bar/Donut/Gauge/GroupedBar لكل الأدوار؛ تحسينات تجميلية مكتملة: A4 — legend عمودي (قيمة굵تحت التسمية) + A5 — subtitle فوق الإجمالي في مركز Donut + A6 — ترجمة تسميات legend عبر t() + A7 — GroupedBarChart footer legend نقطة+تسمية + A8 — زوايا Bar مدوّرة للأعلى فقط (topRoundedRect SVG Path) + A9 — تسميات الأشهر مترجمة (Jan→يناير) في الشاشات الثلاث + A10 — تسمية Gauge فوق النسبة؛ 26 مفتاح i18n أشهر/حالات أُضيف؛ tsc EXIT:0) |
| AI | chat كامل + `/ai/pricing` مع Stripe + AIAnalytics + Escalation | ✅ |

## المرحلة 6 — System Administration و Subscriptions & Payments

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Roles/Permissions | AddRole + AddSubscriberRole + SyncPermissions + عمود Updated At | ✅ |
| Subscribers | صفحة المشترك التفصيلية + إشعار (SendAdminNotificationModal معمّم) | ✅ |
| Plans | Create/Edit Plan wizard + PlanDetail + TokenPackage | ✅ |
| Money Receiving | معالج الإنشاء | ✅ |
| Translations | مودالات لكل كيان (Plans/TokenPackages/Industries/FeatureType) | ✅ |
| Subscriptions (Subscriber) | Details/Pricing/PaymentMethods/History/BillingHistory + مودالات دفع + Stripe + زر Upgrade + Auto renewal | ✅ |
| Profile | Subscriber/Admin/Employee + بطاقة المنظمة + EditOrganizationModal + شارة Verified | ✅ (بطاقة المنظمة + EditOrganization + Verified جاهزة؛ AddToDoList/AddRequest معطّلة في الويب) |

## المرحلة 7 — Settings و Support

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Settings | التحقق من عمق التبويبات + تبويب AddPermission (مجلد معطّل في الويب) + System Mode + تأكيد تغيير الثيم + رفع الصورة + قيود الأذونات (organizations/attendances/chats.manage_settings) | ✅ |
| Support Tickets | list + CreateTicket + Delete + أولوية/مشترك + فرز تنازلي | ✅ (تتضمن detail + thread + مرفقات + تحديث حالة + حذف + Created At + توقيت + صلاحيات) |
| Notifications | إنشاء/جدولة (إن وجد بـ API) | ✅ (الإنشاء عبر SendAdminNotificationModal + SendNotificationModal؛ جدولة غير موجودة بـ API؛ الوارد رُقّي: فلاتر + حالة + أيقونة نموذج + توقيت نسبي + تفاصيل + ترقيم) |

## المرحلة 8 — جودة شاملة

| البند | التفصيل | الحالة |
|---|---|---|
| i18n | مزامنة مفاتيح العربية مع الويب (~500 مفتاح ناقص في `locales/ar`) | ✅ (en/ar متزامنان بالكامل — 0 ناقص؛ المفاتيح المتبقية تعود لشاشات ويب لم تُنقل بعد وتُضاف مع نقلها) |
| كود ميت | `AppNavigator.tsx.bak`، `VerificationScreen` غير المسجّل | ✅ (حُذف `AppNavigator.tsx.bak` و`PlaceholderScreen.tsx`؛ `VerificationScreen` مسجّل بالفعل في `RootNavigator.tsx` سطر 120؛ إجراء Chat في `EmployeeListScreen` يعمل الآن: يفتح/ينشئ محادثة مباشرة مع الموظف ثم يتنقّل إلى Conversations) |
| مراجعة | الثيم، RTL، التحميل، معالجة الأخطاء، الأداء | ✅ (مراجعة ثابتة: كل المودالات الجديدة في Social Media تستخدم الثيم/RTL وتعالج أخطاء الشبكة عبر `extractErrorMessage` مع حالات تحميل/تعطيل أزرار؛ أزرار الإجراءات تلفّ على الشاشات الضيقة (flexWrap)؛ `npx tsc --noEmit` نظيفة 0 أخطاء) |

---

## مخاطر ونقاط قرار

- **WebRTC على React Native:** `react-native-webrtc` + إعدادات Native + Push Call — أكبر بند.
- **Stripe:** `@stripe/stripe-react-native` + إعداد `eas.json`/`app.json` للـ Native.
- **أتمتة وسائل التواصل:** تعتمد على وجود الـ API الحقيقي في backend — يُتحقق قبل البناء.

## مراجع سريعة

- مصدر الحقيقة للقوائم: ويب `src/config/menuItems.js` ↔ موبايل `src/config/menuItems.ts`.
- نمط شاشة قائمة جاهز: `SubscribersScreen.tsx` (يستخدم `generators/ListScreen`).
- نمط تبويبات: `AgendaScreen` / `SocialMediaScreen` (MaterialTopTabs).
- التوصيل: `RootNavigator.tsx` (`<Stack.Screen>`) + `Sidebar.tsx` (`routeToScreen`) + `menuItems.ts`.
