import { Activity } from 'lucide-react';
export function PatientDashboard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-6"><div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-blue-600"/></div><div><h3 className="font-bold text-sm text-slate-800">بوابة المريض</h3><p className="text-[10px] text-slate-500">الملف الصحي الإلكتروني ونتائج التحاليل</p></div></div>
      <div className="text-center text-slate-400 text-xs py-8">لا توجد نتائج تحاليل متاحة حالياً</div>
    </div>
  );
}
