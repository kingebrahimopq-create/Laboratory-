import { useState } from 'react';
import { Upload, Cloud, CheckCircle2 } from 'lucide-react';
export function DriveUpload() {
  const [status, setStatus] = useState<'idle'|'uploading'|'done'>('idle');
  const go = async () => { setStatus('uploading'); await new Promise(r=>setTimeout(r,1500)); setStatus('done'); setTimeout(()=>setStatus('idle'),3000); };
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center"><Cloud className="w-5 h-5 text-blue-600"/></div>
        <div><h3 className="font-bold text-sm text-slate-800">رفع النسخ الاحتياطية لـ Google Drive</h3><p className="text-[10px] text-slate-500">أرشفة تلقائية آمنة</p></div>
      </div>
      <button onClick={go} disabled={status!=='idle'} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold py-2.5 rounded-xl transition-all">
        {status==='uploading'?<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>جاري الرفع...</>:status==='done'?<><CheckCircle2 className="w-4 h-4"/>تم الرفع</>:<><Upload className="w-4 h-4"/>رفع النسخة الاحتياطية</>}
      </button>
    </div>
  );
}
