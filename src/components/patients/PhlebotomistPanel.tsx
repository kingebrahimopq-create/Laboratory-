import { Droplets, QrCode, CheckCircle2 } from 'lucide-react';
interface Props { refreshTrigger?: boolean; onRefresh?: () => void; }
export function PhlebotomistPanel({ onRefresh }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-6"><div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center"><Droplets className="w-5 h-5 text-rose-600"/></div><div><h3 className="font-bold text-sm text-slate-800">منصة أخصائي سحب العينات</h3><p className="text-[10px] text-slate-500">إدارة وتوجيه العينات</p></div></div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button onClick={onRefresh} className="flex flex-col items-center gap-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-700 rounded-xl p-4 text-xs font-bold transition-all"><QrCode className="w-6 h-6"/> طباعة ملصق باركود</button>
        <div className="flex flex-col items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-4 text-center"><CheckCircle2 className="w-6 h-6"/><span className="text-xs font-bold">0 عينة مؤكدة</span></div>
      </div>
      <div className="text-center text-slate-400 text-xs py-4">لا توجد طلبات سحب عينات</div>
    </div>
  );
}
