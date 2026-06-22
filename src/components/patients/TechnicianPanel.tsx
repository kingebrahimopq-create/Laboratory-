import { Microscope, CheckCircle2, Clock } from 'lucide-react';
interface Props { refreshTrigger?: boolean; onRefresh?: () => void; }
export function TechnicianPanel(_: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-6"><div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center"><Microscope className="w-5 h-5 text-emerald-600"/></div><div><h3 className="font-bold text-sm text-slate-800">لوحة الفني المخبري</h3><p className="text-[10px] text-slate-500">مراجعة واعتماد نتائج التحاليل</p></div></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center"><Clock className="w-6 h-6 text-amber-500 mx-auto mb-1"/><div className="text-xl font-black text-amber-700">0</div><div className="text-[10px] text-amber-600 font-semibold">بانتظار المراجعة</div></div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center"><CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1"/><div className="text-xl font-black text-emerald-700">0</div><div className="text-[10px] text-emerald-600 font-semibold">معتمدة اليوم</div></div>
      </div>
      <div className="text-center text-slate-400 text-xs py-4">لا توجد نتائج بانتظار المراجعة</div>
    </div>
  );
}
