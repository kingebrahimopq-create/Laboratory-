import { useState } from 'react';
import { Users, Search, PlusCircle, ClipboardList } from 'lucide-react';
interface Props { refreshTrigger?: boolean; onRefresh?: () => void; }
export function PatientWorkspace({ onRefresh }: Props) {
  const [s, setS] = useState('');
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center justify-between mb-4">
        <button onClick={onRefresh} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl"><PlusCircle className="w-3.5 h-3.5"/> تسجيل مريض جديد</button>
        <div className="flex items-center gap-2"><ClipboardList className="w-5 h-5 text-indigo-600"/><h3 className="font-bold text-sm text-slate-800">مساحة عمل الاستقبال</h3></div>
      </div>
      <div className="relative mb-4"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/><input type="text" value={s} onChange={e=>setS(e.target.value)} placeholder="بحث عن مريض..." className="w-full pr-9 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 text-right"/></div>
      <div className="flex flex-col items-center justify-center py-12 text-slate-400"><Users className="w-12 h-12 mb-3 opacity-30"/><p className="text-sm font-medium">لا توجد ملفات مرضى بعد</p></div>
    </div>
  );
}
