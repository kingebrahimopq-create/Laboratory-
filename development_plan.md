# خطة التطوير الشاملة لمشروع المختبر الطبي (Clinical Laboratory)

## 1. ملخص تنفيذي
تم تحليل مستودع المشروع `Laboratory-` بدقة. المشروع عبارة عن تطبيق ويب وموبايل وسطح مكتب متكامل لإدارة المختبرات الطبية، مبني باستخدام تقنيات حديثة تشمل React, Vite, TailwindCSS, و Capacitor. بناءً على توجيهاتك، تم استبعاد الاعتماد على Firebase تماماً، وسيتم الاعتماد بشكل كامل على **Supabase** كبديل شامل لإدارة قواعد البيانات (PostgreSQL)، المصادقة (Auth)، والتخزين السحابي (Storage).

## 2. البنية المعمارية الحالية والمستهدفة

### البنية المعمارية المستهدفة (بدون Firebase)
- **الواجهة الأمامية (Frontend):** React + Vite + TailwindCSS
- **تطبيقات الموبايل:** Capacitor (Android/iOS)
- **تطبيق سطح المكتب:** Electron
- **الواجهة الخلفية (Backend) وقاعدة البيانات:** Supabase (PostgreSQL, Auth, Storage)
- **إدارة الحالة (State Management):** React Hooks / Context API
- **التوجيه (Routing):** React Router DOM

### مخطط الهندسة المعمارية (نصي)
```text
[المستخدمون: مرضى، أطباء، فنيون، إداريون]
       |
       v
[واجهة المستخدم: ويب / موبايل (Capacitor) / سطح مكتب (Electron)]
       |
       +---> [Supabase Auth] (إدارة المصادقة والصلاحيات)
       |
       +---> [Supabase PostgreSQL] (قاعدة البيانات المركزية: المرضى، الفحوصات، المواعيد، المخزون)
       |
       +---> [Supabase Storage] (تخزين الملفات، التقارير، الصور)
       |
       +---> [خادم Node.js / Edge Functions] (معالجة العمليات المعقدة، محرك الأتمتة، الإشعارات)
```

## 3. خطة التطوير والانتقال الكامل إلى Supabase

### المرحلة الأولى: إزالة Firebase وإعداد Supabase
1. **إزالة تبعيات Firebase:**
   - إزالة حزم `firebase` و `firebase-admin` من `package.json`.
   - حذف ملفات تكوين Firebase (`src/lib/firebase.ts`، `firebase-applet-config.json`، `firebase-blueprint.json`، `firestore.rules`).
2. **إعداد Supabase Client:**
   - التأكد من تثبيت `@supabase/supabase-js` و `@supabase/ssr`.
   - إنشاء ملف `src/lib/supabase.ts` لتهيئة عميل Supabase باستخدام المتغيرات البيئية:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. **تحديث نظام المصادقة (Auth):**
   - استبدال جميع استدعاءات `firebaseAuth` في `src/lib/auth.ts` و `src/App.tsx` و `src/pages/DashboardPage.tsx` بواجهات برمجة تطبيقات Supabase Auth.
   - تحديث مكونات تسجيل الدخول (`LoginForm.tsx`) للتعامل مع Supabase.

### المرحلة الثانية: ترحيل قاعدة البيانات (Database Migration)
1. **تصميم مخطط قاعدة البيانات (Database Schema):**
   - استخدام Prisma (المثبت مسبقاً) أو Supabase SQL لإنشاء الجداول اللازمة في PostgreSQL:
     - `users` (المستخدمون والصلاحيات)
     - `patients` (المرضى)
     - `tests` (الفحوصات والنتائج)
     - `appointments` (المواعيد)
     - `inventory` (المخزون والمستهلكات)
     - `expenses` (المصروفات)
2. **تحديث طبقة الوصول للبيانات (Data Access Layer):**
   - إعادة كتابة الدوال في `src/lib/db.ts` (مثل `getUserProfile`, `addPatient`, `addTest`) لتستخدم Supabase Client بدلاً من `supabase-firestore.ts` (الذي كان يحاكي واجهة Firestore).
   - حذف ملف `src/lib/supabase-firestore.ts` لتنظيف الكود.

### المرحلة الثالثة: تطوير الميزات الأساسية وتحسينها
1. **لوحة تحكم ديناميكية (Dynamic Dashboard):**
   - تحسين `DashboardPage.tsx` ليعتمد على بيانات Supabase الحية (Realtime) لتحديث الإشعارات وحالة الفحوصات فورياً.
2. **إدارة المخزون والأتمتة (Inventory & Automation):**
   - نقل منطق الخصم التلقائي للمخزون (الموجود في `src/lib/inventory.ts`) ليعمل كـ Supabase Edge Function أو عبر خادم Node.js المرفق (`server.ts`) لضمان الأمان والموثوقية.
3. **نظام الولاء (Loyalty System):**
   - ربط منطق حساب النقاط في `src/lib/loyalty.ts` بقاعدة بيانات PostgreSQL مباشرة.

### المرحلة الرابعة: التجهيز للإنتاج (Production Readiness)
1. **تأمين قاعدة البيانات (Row Level Security - RLS):**
   - إعداد سياسات RLS في Supabase لضمان أن كل مستخدم (مريض، فني، مدير) يصل فقط إلى البيانات المصرح له بها.
2. **تحسين الأداء (Performance Optimization):**
   - تفعيل التخزين المؤقت (Caching) وتقليل استدعاءات قاعدة البيانات.
3. **بناء التطبيقات (Build & Deployment):**
   - **الويب:** إعداد Vercel أو GitHub Pages للنشر المستمر (CI/CD) باستخدام `run_publish.js`.
   - **سطح المكتب:** بناء تطبيق Electron باستخدام `npm run build:electron`.
   - **الموبايل:** بناء تطبيقات Android/iOS باستخدام Capacitor.

## 4. توصيات تقنية إضافية
- **إدارة الأسرار (Secrets Management):** التأكد من عدم رفع مفاتيح Supabase السرية (`SUPABASE_SECRET_KEY`) إلى مستودع GitHub، واستخدام متغيرات البيئة (`.env.local`) بشكل صارم.
- **مراقبة الأخطاء (Error Monitoring):** دمج أداة مثل Sentry لمراقبة الأخطاء في بيئة الإنتاج.
- **النسخ الاحتياطي (Backups):** تفعيل النسخ الاحتياطي التلقائي في إعدادات مشروع Supabase.

---
*تم إعداد هذه الخطة بناءً على تحليل الكود المصدري الحالي ومتطلبات الانتقال الكامل إلى بيئة Supabase.*
