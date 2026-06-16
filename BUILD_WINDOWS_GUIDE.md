# دليل بناء تطبيق Windows - My Lab LIMS

## نظرة عامة

هذا الدليل يشرح كيفية بناء تطبيق Windows قابل للتثبيت (Installer) من مشروع My Lab LIMS.

## المتطلبات

### المتطلبات الأساسية:
- **Node.js**: الإصدار 20.0.0 أو أحدث
- **npm**: الإصدار 10.0.0 أو أحدث
- **Windows**: Windows 7 أو أحدث (للبناء والتشغيل)

### التحقق من التثبيت:
```bash
node --version
npm --version
```

## خطوات البناء

### الطريقة 1: استخدام سكريبت Batch (الأسهل للمستخدمين على Windows)

1. افتح Command Prompt أو PowerShell
2. انتقل إلى مجلد المشروع:
```bash
cd path\to\Laboratory
```

3. قم بتشغيل السكريبت:
```bash
build_windows.bat
```

السكريبت سيقوم بـ:
- التحقق من تثبيت Node.js
- تثبيت جميع المكتبات المطلوبة
- بناء مشروع Vite
- بناء تطبيق Windows باستخدام Electron Builder

### الطريقة 2: استخدام سكريبت Bash (للمستخدمين على Linux/Mac)

1. افتح Terminal
2. انتقل إلى مجلد المشروع:
```bash
cd path/to/Laboratory
```

3. اجعل السكريبت قابلاً للتنفيذ:
```bash
chmod +x build_windows.sh
```

4. قم بتشغيل السكريبت:
```bash
./build_windows.sh
```

### الطريقة 3: البناء اليدوي

1. تثبيت المكتبات:
```bash
npm install
```

2. بناء مشروع Vite:
```bash
npm run build
```

3. بناء تطبيق Windows:
```bash
npm run electron:build
```

## ملفات الإخراج

بعد اكتمال البناء بنجاح، ستجد ملفات التطبيق في مجلد `dist-electron/`:

- **MyLab-LIMS-Setup-x.x.x.exe**: برنامج التثبيت (Installer)
- **MyLab-LIMS-Portable-x.x.x.exe**: نسخة محمولة (Portable)

## تثبيت التطبيق

### استخدام برنامج التثبيت:
1. قم بتشغيل `MyLab-LIMS-Setup-x.x.x.exe`
2. اتبع تعليمات المعالج
3. اختر مسار التثبيت
4. انقر على "تثبيت"

### استخدام النسخة المحمولة:
1. قم بتشغيل `MyLab-LIMS-Portable-x.x.x.exe`
2. لا يتطلب تثبيت - يعمل مباشرة

## استكشاف الأخطاء

### المشكلة: "Node.js is not installed"
**الحل**: تأكد من تثبيت Node.js من [nodejs.org](https://nodejs.org/)

### المشكلة: "Failed to install dependencies"
**الحل**: 
```bash
npm cache clean --force
npm install
```

### المشكلة: "Electron build failed"
**الحل**: 
```bash
npm run clean
npm install
npm run build
npm run electron:build
```

### المشكلة: "dist-electron directory not found"
**الحل**: تأكد من أن جميع الخطوات السابقة نجحت بدون أخطاء

## إعدادات البناء

### تعديل إعدادات Electron Builder

يمكنك تعديل إعدادات البناء في ملف `electron-builder.json`:

```json
{
  "appId": "com.mylab.lims",
  "productName": "My Lab LIMS",
  "win": {
    "target": ["nsis", "portable"]
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true
  }
}
```

## الأتمتة باستخدام GitHub Actions

يتم بناء تطبيق Windows تلقائياً عند كل دفع (push) إلى الفروع الرئيسية:

- عند الدفع إلى `main` أو `develop`
- يمكن تشغيل البناء يدويًا من تبويب "Actions"

### تحميل الملفات المبنية:

1. انتقل إلى GitHub Actions
2. اختر أحدث بناء ناجح
3. حمّل ملفات Windows من قسم "Artifacts"

## نصائح مهمة

1. **تحديث المكتبات**: قم بتحديث المكتبات بانتظام:
   ```bash
   npm update
   ```

2. **تنظيف الملفات المؤقتة**: قبل البناء:
   ```bash
   npm run clean
   ```

3. **اختبار التطبيق**: بعد البناء، اختبر التطبيق على آلة Windows نظيفة

4. **إصدار جديد**: عند إصدار نسخة جديدة، حدّث رقم الإصدار في `package.json`

## دعم إضافي

للمزيد من المعلومات:
- [Electron Builder Documentation](https://www.electron.build/)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Vite Documentation](https://vitejs.dev/)

---

**آخر تحديث**: 2026-06-16
**الإصدار**: 2.0.0
