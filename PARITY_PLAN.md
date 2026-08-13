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
| My Tasks | `EvaluationModal` عند إكمال مهمة `done` | ⬜ |
| My Projects | تفاصيل + تقييم + أعمدة (Manager/Start Date/Assignees) | ✅ |

## المرحلة 2 — Work Management

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Projects | تبويبات + Create wizard + Detail كامل (أعضاء/مهام/تعليقات/مرفقات/نشاط/خط زمني/تقييم) + SaveAsTemplate + Edit + CreateTeam | ⬜ |
| Tasks | فلاتر وحالات + Create/Edit + Detail كامل + تعليقات + تقييم | ⬜ |
| Agenda/Appointments | create/[id] detail + modals (EditAppointment, CreateAppointmentFromTask, CreateAgenda, EditDailyTask, EditReminder, AddToAgenda) | ⬜ |

## المرحلة 3 — Team Management (HR)

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Employees | Create/Edit wizard + CompleteProfile + Invite + SendNotification + AssignDepartment + Salary/Leave/Attendance CRUD + ViewRequest + Employee Profile كامل | ⬜ |
| Departments | CRUD + CreateChatGroup + Department Profile | ⬜ |
| Positions | CRUD كامل | ⬜ |
| HR Chats | CreateChatGroup + Poll + ChatDetails | ⬜ |

## المرحلة 4 — التواصل والمحتوى

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Conversations | Threads + Polls + مرفقات + NewConversation + ChatDetails + المكالمات WebRTC بالكامل | ⬜ |
| Social Media | إدارة حسابات Twitter (Add/Edit/Import/Delete) + Categories + أتمتة (نشر/إعجاب/متابعة/رد) + SetQuota | ⬜ |

## المرحلة 5 — Analytics و AI

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Analytics | رفع جودة الرسوم لمطابقة أقسام الويب الثلاثة | ⬜ |
| AI | chat كامل + `/ai/pricing` مع Stripe + AIAnalytics + Escalation | ⬜ |

## المرحلة 6 — System Administration و Subscriptions & Payments

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Roles/Permissions | AddRole + AddSubscriberRole + SyncPermissions + عمود Updated At | ✅ |
| Subscribers | صفحة المشترك التفصيلية + إشعار (SendAdminNotificationModal معمّم) | ✅ |
| Plans | Create/Edit Plan wizard + PlanDetail + TokenPackage | ✅ |
| Money Receiving | معالج الإنشاء | ✅ |
| Translations | مودالات لكل كيان (Plans/TokenPackages/Industries/FeatureType) | ✅ |
| Subscriptions (Subscriber) | Details/Pricing/PaymentMethods/History/BillingHistory + مودالات دفع + Stripe + زر Upgrade + Auto renewal | ✅ |
| Profile | Subscriber/Admin/Employee + بطاقة المنظمة + EditOrganizationModal + شارة Verified | ➡️ (بطاقة المنظمة + EditOrganization + Verified جاهزة؛ AddToDoList/AddRequest معطّلة في الويب) |

## المرحلة 7 — Settings و Support

| الشاشة | الفجوة | الحالة |
|---|---|---|
| Settings | التحقق من عمق التبويبات (+ AddPermission tab) | ⬜ |
| Support Tickets | list + CreateTicket + Delete + أولوية/مشترك + فرز تنازلي | 🟡 (الـ list/create/delete جاهزة؛ detail + thread + تحديث حالة ⬜) |
| Notifications | إنشاء/جدولة (إن وجد بـ API) | ⬜ |

## المرحلة 8 — جودة شاملة

| البند | التفصيل | الحالة |
|---|---|---|
| i18n | مزامنة مفاتيح العربية مع الويب (~500 مفتاح ناقص في `locales/ar`) | ⬜ |
| كود ميت | `AppNavigator.tsx.bak`، `VerificationScreen` غير المسجّل | ⬜ |
| مراجعة | الثيم، RTL، التحميل، معالجة الأخطاء، الأداء | ⬜ |

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
