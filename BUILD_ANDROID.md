# دليل بناء تطبيق MyLab LIMS للأندرويد 📱

لقد قمت بإعداد المشروع ليعمل بنظام **Hybrid APK**، حيث يقوم التطبيق بفتح النسخة المباشرة (Live) من موقعك المنشور على Vercel، مما يضمن عمل الباك-إند (Supabase/Firebase) فوراً دون مشاكل في المفاتيح.

## الخطوات لتوليد ملف APK:

1. **إضافة الأسرار (Secrets) في GitHub:**
   اذهب إلى مستودعك على GitHub ثم:
   `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`
   أضف المفاتيح التالية:
   - `VITE_SUPABASE_URL`: `https://iavbecvuohuukraoehle.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `sb_publishable_JAr1oEzmqCITi8CETia4AA__RI2IBrL`
   - `VITE_FIREBASE_API_KEY`: `AIzaSyD9PPc_uK0EGyK1p1yTPGXxs4AkxaBxhwc`
   - `VITE_FIREBASE_PROJECT_ID`: `skilled-petal-6txfk`
   - `VITE_FIREBASE_APP_ID`: `1:641180354319:web:6b589ffc0ae4945db8207a`

2. **تشغيل البناء التلقائي:**
   - اذهب إلى تبويب **Actions** في مستودع GitHub.
   - اختر **Build Android APK** من القائمة اليسرى.
   - اضغط على **Run workflow**.

3. **تحميل التطبيق:**
   - انتظر حوالي 5-10 دقائق حتى يكتمل البناء.
   - ستجد ملف باسم `MyLabLIMS-debug-apk` في أسفل الصفحة تحت قسم **Artifacts**.
   - قم بتحميله وتثبيته على هاتفك.

## ملاحظات تقنية:
- تم ضبط `appId` ليكون `app.mylab.lims`.
- التطبيق يستخدم `server.url` ليشير إلى رابط Vercel الخاص بك، مما يعني أن أي تحديث تنشره على Vercel سيظهر فوراً في التطبيق دون الحاجة لبناء APK جديد.
- تم تفعيل `cleartext: true` للسماح بالاتصال بخوادم التطوير إذا لزم الأمر.
