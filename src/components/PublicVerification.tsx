import React, { useState } from 'react';
import { LabTest, Patient } from '../types';
import { ShieldCheck, Search, FileCheck2, AlertCircle, Building2, UserCircle2, ArrowLeft } from 'lucide-react';

interface PublicVerificationProps {
  tests: LabTest[];
  patients: Patient[];
  initialToken?: string;
  onClose: () => void;
}

export default function PublicVerification({ tests, patients, initialToken = '', onClose }: PublicVerificationProps) {
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [typedToken, setTypedToken] = useState(initialToken);
  const [searched, setSearched] = useState(!!initialToken);

  const matchedTest = tests.find(t => 
    t.qrToken.toLowerCase().trim() === typedToken.toLowerCase().trim() ||
    t.id.toLowerCase().trim() === typedToken.toLowerCase().trim()
  );

  const matchedPatient = matchedTest 
    ? patients.find(p => p.id === matchedTest.patientId) 
    : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setTypedToken(tokenInput);
    setSearched(true);
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 transition-all">
      {/* Verification Logo Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">بوابة التحقق السحابية</h1>
            <p className="text-xs text-slate-400 font-medium">التحقق اللامتناهي من أصالة التقارير الطبية</p>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          id="btn-verify-back"
        >
          العودة لوحدة التحكّم
        </button>
      </div>

      {/* Description text */}
      <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-800 mb-6 text-sm">
        <p className="text-slate-300 leading-relaxed text-right text-xs">
          خدمة التحقق الرقمية تتيح للجهات الطبية، شركات التأمين، والجهات الحكومية التأكد من موثوقية نتائج الفحص الصادرة من 
          <strong className="text-teal-400"> مختبرات MY LAB </strong> مباشرة لتجنب التزوير والتقارير المفبركة.
        </p>
      </div>

      {/* Lookup Form */}
      <form onSubmit={handleSearch} className="mb-8" id="verify-lookup-form">
        <label className="block text-xs font-semibold text-slate-300 mb-2">
          أدخل رمز التحقق (QR Token) أو رقم الفحص المطبوع على التقرير:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="مثال: VERIFY-GLU-9820-2026 أو LAB-2026-001"
              className="w-full text-right bg-slate-950/80 border border-slate-800 text-white placeholder-slate-500 rounded-xl px-4 py-3 pl-10 text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono tracking-wide"
              required
              id="verify-token-input"
            />
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
          </div>
          <button 
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-3 rounded-xl text-sm shadow-lg shadow-emerald-950/20 duration-150 cursor-pointer"
            id="btn-verify-submit"
          >
            تأكيد الأصالة
          </button>
        </div>
      </form>

      {/* Lookup Results */}
      {searched && (
        <div className="transition-all animate-fadeIn">
          {matchedTest && matchedPatient ? (
            <div className="bg-slate-950/60 border border-emerald-500/20 rounded-2xl p-5 sm:p-6 overflow-hidden relative">
              
              {/* Green glow highlight */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                <FileCheck2 className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-xs font-extrabold text-emerald-400 block tracking-wider uppercase">
                    تحقق آمن ومصدق بنجاح ✔
                  </span>
                  <span className="text-sm font-bold text-slate-200">
                    النسخة الرقمية المعيارية مطابقة للتقرير الورقي تماماً
                  </span>
                </div>
              </div>

              {/* Patient and verification data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6 border-b border-slate-800/80 pb-6">
                <div>
                  <span className="text-slate-400 block mb-1">اسم المريض المعتمد:</span>
                  <span className="font-bold text-slate-100 text-sm block">{matchedPatient.name}</span>
                  <span className="text-slate-400 font-mono scale-95 origin-right">{matchedPatient.nameEn}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">رقم الهوية الوطنية / الملف:</span>
                  <span className="font-mono font-medium text-slate-100 block text-sm">{matchedPatient.id}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">تاريخ ووقت الفحص:</span>
                  <span className="text-slate-100 font-semibold block">{matchedTest.requestDate}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">رمز التحقق المعتمد:</span>
                  <span className="text-emerald-400 font-mono font-bold block">{matchedTest.qrToken}</span>
                </div>
              </div>

              {/* Verified range results */}
              <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">
                النتائج المرفوعة على خادم المختبر | ORIGINAL REPORT RECORDS
              </h3>
              
              <div className="space-y-3">
                {matchedTest.parameters.map((param, i) => {
                  const outOfRange = param.value !== undefined && (param.value < param.minNormal || param.value > param.maxNormal);
                  return (
                    <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <span className="font-bold text-slate-200 block text-xs">{param.nameAr}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{param.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-left font-mono">
                          <span className={`text-sm font-bold block ${outOfRange ? 'text-rose-400 font-extrabold' : 'text-slate-200'}`}>
                            {param.value !== undefined ? param.value : '—'} <span className="text-[10px] text-slate-500 font-normal">{param.unit}</span>
                          </span>
                          <span className="text-[8px] text-slate-500 block">
                            المدى الطبيعي: {param.minNormal} - {param.maxNormal}
                          </span>
                        </div>

                        <div>
                          {outOfRange ? (
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 border border-rose-900/40 px-2 py-0.5 rounded-full">
                              خارج المعدل
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-900/40 px-2 py-0.5 rounded-full">
                              طبيعي
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Digital signature assurance */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>مختبرات MY LAB المركزية</span>
                </div>
                <div>
                  <span>توقيع الطبيب المعتمد: </span>
                  <span className="font-serif italic text-slate-300 font-bold ml-1">{matchedTest.approvedBy || "د. عبد الرحمن الفضلي"}</span>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-950/60 border border-rose-500/20 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-rose-500/15 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200 mb-1">لم يتم العثور على سجل مالي أو طبي مطابق</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed mb-4">
                تأكد من كتابة الرقم بدقة أو مسح الرمز الإلكتروني بشكل صحيح. في حال استمرار المشكلة، يرجى التواصل فوراً مع إدارة المعمل لمكافحة التزوير.
              </p>
              <button
                type="button"
                onClick={() => setTokenInput('VERIFY-GLU-9820-2026')}
                className="text-xs text-teal-400 hover:text-teal-300 font-bold underline transition-colors"
                id="btn-verify-demo-fill"
              >
                انقر لتعبئة كود تجريبي صحيح (السكر)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
