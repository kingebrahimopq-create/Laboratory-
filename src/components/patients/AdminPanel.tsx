import { useState } from 'react';
import { Shield, Settings, UserPlus } from 'lucide-react';
interface Props { refreshTrigger?: boolean; onRefresh?: () => void; }
export function AdminPanel({ onRefresh }: Props) {
  const [tab, setTab] = useState<'overview'|'staff'|'settings'>('overview');
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-4"><div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center"><Shield className="w-5 h-5 text-red-600"/></div><div><h3 className="font-bold text-sm text-slate-800">لوحة الإشراف والإدارة</h3><p className="text-[10px] text-slate-500">التحكم الكامل بالنظام</p></div></div>
      <div className="flex gap-1 border-b border-slate-100 mb-4">
        {(['overview','staff','settings'] as const).map(k=>(
          <button key={k} onClick={()=>setTab(k)} className={"px-3 py-2 text-xs font-bold border-b-2 transition-all "+(tab===k?'border-red-500 text-red-600':'border-transparent text-slate-500')}>{k==='overview'?'نظرة عامة':k==='staff'?'الطاقم':'الإعدادات'}</button>
        ))}
      </div>
      {tab==='overview'&&<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['المرضى','0','indigo'],['التحاليل','0','emerald'],['الطاقم','0','red'],['المعلق','0','amber']].map(([l,v,c])=>(<div key={l} className={"bg-"+c+"-50 border border-"+c+"-100 rounded-xl p-3 text-center"}><div className={"text-xl font-black text-"+c+"-700"}>{v}</div><div className={"text-[10px] text-"+c+"-600 font-semibold"}>{l}</div></div>))}</div>}
      {tab==='staff'&&<div className="flex flex-col gap-3"><button onClick={onRefresh} className="self-end flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl"><UserPlus className="w-3.5 h-3.5"/> دعوة موظف جديد</button><div className="text-center text-slate-400 text-xs py-6">لا يوجد كادر طبي مسجل بعد</div></div>}
      {tab==='settings'&&<div className="text-center text-slate-400 text-xs py-6"><Settings className="w-10 h-10 mx-auto mb-2 opacity-30"/>إعدادات النظام (قيد التطوير)</div>}
    </div>
  );
}
