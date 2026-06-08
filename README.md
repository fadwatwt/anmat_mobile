# Anmat Mobile

تطبيق هاتف مستقل لنظام Anmat مبني بـ Expo و React Native.

## التشغيل

```bash
npm install
npm start
```

افتح التطبيق عبر Expo Go أو Android Emulator.

## الإعدادات

أنشئ ملف `.env` عند الحاجة وغير رابط الـ API:

```bash
EXPO_PUBLIC_API_URL=https://anmat-backend-system.onrender.com
```

## النسخة الحالية

- تسجيل دخول مستخدمين `Subscriber` و `Employee`.
- حفظ جلسة الدخول في `expo-secure-store`.
- تبويبات رئيسية للهاتف: الرئيسية، المهام، الحضور، حسابي.
- ربط أولي مع endpoints الموجودة في NestJS.
