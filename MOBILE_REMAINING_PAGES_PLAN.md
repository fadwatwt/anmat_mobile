# خطة استكمال صفحات نسخة الموبايل

> الهدف: استكمال الشاشات المتبقية في `anmat_mobile` لتطابق صفحات نسخة الويب (`anmat_front-main`) من حيث البيانات والمنطق والحالات، مع تكييف التخطيط لشاشة الهاتف **بنفس نسق الشاشات الجاهزة في الموبايل** (تبويبات MaterialTopTabs، تمرير عمودي، مولّدات ListScreen/FormScreen/DetailScreen، نظام الثيم/الـ RTL/الترجمة).

## الوضع الحالي

نسخة الموبايل مكتملة تقريبًا. تبقّت **4 شاشات** ما زالت `PlaceholderScreen` في
[src/navigation/RootNavigator.tsx](src/navigation/RootNavigator.tsx):

| الشاشة | route الحالي | صفحة الويب المقابلة | الأدوار |
|--------|--------------|----------------------|---------|
| Agenda (الأجندة) | `Agenda` | `(dashboard)/appointments/` | Subscriber, Employee |
| Analytics (التحليلات) | `Analytics` | `(dashboard)/analytics/` | Admin, Subscriber, Employee |
| Social Media | `SocialMedia` | `(dashboard)/social-media/` | Subscriber, Employee |
| Profile (الملف الشخصي) | `Profile` | `(dashboard)/profile/` | الجميع |

### بنية تحتية جاهزة لإعادة الاستخدام
- **المولّدات:** `src/generators/ListScreen.tsx` · `FormScreen.tsx` · `DetailScreen.tsx`
- **الرسوم:** `src/charts/BarChart.tsx` · `DonutChart.tsx` · `GroupedBarChart.tsx`
- **المكونات:** `Badge`, `Button`, `Header`, `Modal`, `Screen`, `StatusActions`, `Table`, `FilterBar`, `EmptyState`, `AccountDetails`, `StarRating`
- **السياقات:** `ThemeContext` (colors)، `LanguageContext` (isRTL)، `AuthContext` (user.type)
- **HTTP:** `src/lib/http.ts`
- **خدمة dashboard.ts** فيها بالفعل كل نقاط نهاية التحليلات (analytics overview / task stats / departments) للأدوار الثلاثة.
- **نمط التبويبات المرجعي:** `src/screens/HREmployeesScreen.tsx` (MaterialTopTabs بأيقونات lucide).
- **DashboardScreen.tsx** (553 سطر) يستخدم نفس الرسوم والبيانات التي تحتاجها Analytics — مصدر إعادة استخدام أساسي.

## ترتيب التنفيذ الموصى به (القيمة مقابل الجهد)

1. **Analytics** — الأسهل: خدمة الـ API جاهزة، والرسوم موجودة، وDashboardScreen يغطي معظم المنطق.
2. **Profile** — متوسط: 3 نسخ حسب الدور + خدمة `profile.ts` + نموذج تعديل.
3. **Agenda** — الأكبر: 3 تبويبات (اليوم/التقويم/القائمة) + خط زمني + تقويم شهري + خدمة جديدة.
4. **Social Media** — تبويبات Twitter/Facebook + بطاقات الحصة + ربط الحسابات + خدمة جديدة.

---

## 1) Analytics — `AnalyticsScreen.tsx`

**صفحة الويب:** `analytics/page.jsx` تختار مكونًا حسب `userType`:
- `_components/AdminAnalytics.jsx` (97 سطر)
- `_components/CompanyManagerAnalytics.jsx` (239 سطر) — للـ Subscriber
- `_components/EmployeeAnalytics.jsx` (106 سطر)

**خطة الموبايل:**
- شاشة `AnalyticsScreen.tsx` تفرّع حسب `user.type` (Admin / Subscriber / Employee) داخل `ScrollView`.
- ثلاثة مكونات فرعية: `AdminAnalytics`, `SubscriberAnalytics`, `EmployeeAnalytics` تحت `src/screens/analytics/` أو `src/components/analytics/`.
- مكون `AnalyticsCard` (بطاقة إحصائية) مطابق لـ `_components/AnalyticsCard.jsx`.
- إعادة استخدام `BarChart` / `DonutChart` / `GroupedBarChart` + بيانات `fetch*AnalyticsOverview` / `fetch*TaskStats` / `fetchSubscriberDepartments` من `services/dashboard.ts`.
- حالات: تحميل (`ActivityIndicator`)، فارغ (`EmptyState`)، خطأ.

**الخدمة:** لا حاجة لخدمة جديدة — `dashboard.ts` كافية. تحقق من أي مفاتيح بيانات إضافية تخص Analytics دون Dashboard.

**المخرجات:** `AnalyticsScreen.tsx` + 3 مكونات + `AnalyticsCard` + مفاتيح ترجمة + استبدال placeholder في RootNavigator.

---

## 2) Profile — `ProfileScreen.tsx`

**صفحة الويب:** `profile/page.jsx` تفرّع حسب الدور:
- `_components/AdminProfile.jsx` (150 سطر)
- `_components/CompanyManagerProfile.jsx` (200 سطر)
- `_components/EmployeeProfile.jsx` (432 سطر)
- مجلدات فرعية: `company_manager/`, `components/`, `modals/`

**خطة الموبايل:**
- `ProfileScreen.tsx` يفرّع حسب `user.type`.
- إعادة استخدام `AccountDetails` لعرض الحقول، و`FormScreen` لشاشة التعديل.
- وظائف: عرض الملف، تعديل البيانات، تغيير كلمة المرور، رفع صورة (إن وُجد في الويب).
- مودالات عبر `components/Modal.tsx`.

**الخدمة:** إنشاء `src/services/profile.ts` (جلب/تحديث الملف، تغيير كلمة المرور) — راجع redux APIs المقابلة في الويب لتحديد endpoints لكل دور.

**المخرجات:** `ProfileScreen.tsx` + مكونات فرعية حسب الدور + `profile.ts` + أنواع + ترجمة + استبدال placeholder.

> ملاحظة: حاليًا الـ route `Profile` في RootNavigator يستخدم PlaceholderScreen ولا يظهر في الـ Sidebar — يُربط من Header/قائمة الحساب.

---

## 3) Agenda — `AgendaScreen.tsx`

**صفحة الويب:** `appointments/page.jsx` (299 سطر) بثلاثة عروض عبر `AgendaHeader`:
- **today** → `TodayView` (HourlyTimeline + TodayRightPanel) + `YesterdayTasksNotice`
- **calendar** → `MonthlyCalendar` + `DayDetailSidebar`
- **list** → قائمة المواعيد (upcoming/completed) + Daily Tasks

مكونات الويب في `src/components/Agenda/`: `AgendaHeader`, `TodayView`, `HourlyTimeline` (272 سطر), `TodayRightPanel` (408 سطر), `MonthlyCalendar` (185 سطر), `DayDetailSidebar`, `DailyTaskCard`, `AppointmentNotes`, `CreateAgendaModal`, `AddToAgendaModal`, `YesterdayTasksNotice`, `AgendaSummaryBar`, `AgendaSearch`.

**خطة الموبايل:**
- `AgendaScreen.tsx` عبر `createMaterialTopTabNavigator` بثلاثة تبويبات (اليوم/التقويم/القائمة) على نمط `HREmployeesScreen`.
- مكونات جديدة مكيّفة للهاتف تحت `src/components/agenda/`:
  - `HourlyTimeline` (خط زمني 7ص–8م بكتل ملوّنة + خط الوقت الحالي).
  - `MonthlyCalendar` (شبكة شهرية، نقاط على الأيام التي بها مواعيد).
  - `TodayRightPanel` (الأولويات + مهام اليوم + ملاحظات) — يصبح قسمًا عموديًا أسفل الخط الزمني في الموبايل.
  - `DailyTaskCard`, `AppointmentCard`, `YesterdayTasksNotice`, `CreateAgendaModal`.
- العرض في الموبايل عمودي (لا أعمدة جنبًا إلى جنب).

**الخدمة:** إنشاء `src/services/appointments.ts` يغطي endpoints الـ Subscriber و Employee:
- المواعيد: `today`, `week`, `month/:year/:month`, `search`, CRUD، `complete`, `cancel`, `notes`.
- المهام اليومية: `daily-tasks` CRUD + `complete` + `notes` + `month` + `search`.
- المسارات تختلف بين `api/subscriber/organization/...` و `api/employee/...` حسب الدور.

**المخرجات:** `AgendaScreen.tsx` + مكونات agenda + `appointments.ts` + أنواع + ترجمة + استبدال placeholder.

---

## 4) Social Media — `SocialMediaScreen.tsx`

**صفحة الويب:** `social-media/page.jsx` (60 سطر) بتبويبات:
- `_Tabs/Tweeter.tab.jsx` (363 سطر)
- `_Tabs/Facebook.tab.jsx` (151 سطر)
- `_Tabs/_components/AccountQuotaCard.jsx`
- صفحة فرعية `categories/`
- redux: `socialMediaQuotaApi.js`, `twitterAccountsApi.js`, مجلد `socialMedia`

**خطة الموبايل:**
- `SocialMediaScreen.tsx` بتبويبات MaterialTopTabs (Twitter / Facebook).
- مكون `AccountQuotaCard` لعرض الحصة.
- ربط/إدارة حسابات Twitter (قائمة الحسابات، إضافة، حذف، حالة).
- تبويب Facebook حسب ما يوفّره الويب.

**الخدمة:** إنشاء `src/services/socialMedia.ts` (الحصة + حسابات Twitter + Facebook).

**المخرجات:** `SocialMediaScreen.tsx` + تبويبات + `AccountQuotaCard` + `socialMedia.ts` + أنواع + ترجمة + استبدال placeholder.

---

## معايير عامة لكل شاشة (Definition of Done)

1. استبدال `PlaceholderScreen` المقابل في `RootNavigator.tsx` بالشاشة الحقيقية.
2. التفرّع حسب الدور حيث يفعل الويب ذلك (Analytics, Profile).
3. دعم RTL (`isRTL`) وألوان الثيم (`useTheme().colors`) في كل النصوص والتخطيطات.
4. مفاتيح ترجمة في `src/locales/ar` و `src/locales/en` (إعادة استخدام مفاتيح الويب نفسها قدر الإمكان).
5. حالات التحميل/الفارغ/الخطأ مغطّاة.
6. الالتزام بنفس بيانات/منطق/حالات الويب، مع تخطيط مكيّف للهاتف (عمودي/تبويبات).
7. خدمات API تحترم اختلاف مسارات Subscriber/Employee/Admin.

## ملف مرجعي للويب لكل شاشة
- Analytics: `anmat_front-main/src/app/(dashboard)/analytics/`
- Profile: `anmat_front-main/src/app/(dashboard)/profile/`
- Agenda: `anmat_front-main/src/app/(dashboard)/appointments/` + `src/components/Agenda/`
- Social Media: `anmat_front-main/src/app/(dashboard)/social-media/` + `src/redux/` (socialMediaQuotaApi, twitterAccountsApi)
