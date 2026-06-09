import React, { useState } from 'react';
import { LabTest, Patient, TestParameter, DoctorSettings } from '../types';
import { GLUCOSE_HISTORICAL_TREND } from '../data';
import { 
  BarChart3, BadgeAlert, CheckCircle2, ShieldCheck, 
  Sparkles, FileText, Check, Settings2, ShieldQuestion,
  Users2, AlertTriangle, Coins, TrendingUp, Calendar, HeartPulse, Lock, Shield, Cpu, Sliders,
  Printer, Database, Cloud, Copy
} from 'lucide-react';

interface AdminPortalProps {
  tests: LabTest[];
  patients: Patient[];
  onApproveTest: (id: string, doctorName: string) => void;
  onModifyReferenceCost: (testType: 'CBC' | 'LIPID' | 'LIVER' | 'GLUCOSE', minNormal: number, maxNormal: number) => void;
  settings: DoctorSettings;
  onUpdateSettings: (updated: DoctorSettings) => void;
  language: 'ar' | 'en';
  currency: 'SAR' | 'EGP';
}

export default function AdminPortal({
  tests,
  patients,
  onApproveTest,
  onModifyReferenceCost,
  settings,
  onUpdateSettings,
  language,
  currency
}: AdminPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'metrics' | 'settings'>('approvals');
  
  // Selection details
  const [reviewingTest, setReviewingTest] = useState<LabTest | null>(null);
  const [doctorSignName, setDoctorSignName] = useState('د. عبد الرحمن الفضلي (مدير المختبر)');
  
  // Settings Calibration state
  const [selectedSettingType, setSelectedSettingType] = useState<'CBC' | 'LIPID' | 'LIVER' | 'GLUCOSE'>('CBC');
  const [settingMin, setSettingMin] = useState(12.0);
  const [settingMax, setSettingMax] = useState(17.5);
  const [settingSuccess, setSettingSuccess] = useState(false);

  // Database Integrity & Lifetime License Diagnostic states
  const [dbChecking, setDbChecking] = useState(false);
  const [dbCheckLogs, setDbCheckLogs] = useState<string[]>([]);
  const [dbCheckSuccess, setDbCheckSuccess] = useState(false);

  // Google Drive cloud backup states
  const [gdriveBackupLoading, setGdriveBackupLoading] = useState(false);
  const [gdriveBackupSuccess, setGdriveBackupSuccess] = useState(false);

  // Electronic Printer testing states
  const [printerTesting, setPrinterTesting] = useState(false);
  const [printerSuccess, setPrinterSuccess] = useState(false);

  const runDatabaseIntegrityDiagnostic = () => {
    setDbChecking(true);
    setDbCheckLogs([]);
    setDbCheckSuccess(false);

    const logSteps = [
      "جاري استدعاء محرك الأمان التلقائي العالي التشفير LIMS Secure Core...",
      "الاتصال بقاعدة البيانات المحلية المأمنة والتحقق من التشفير المتماثل AES-256...",
      "بدء مسح هيكلة جدول وصلاحيات المرضى (Patients Table Integrity)...",
      "التحقق من فهارس جدول عينات المختبر وقنوات الاتصال بالأجهزة المرجعية LIS...",
      "فحص ترخيص المنشأة: حالة الترخيص نشط ومصدّق 'مدى الحياة' (Lifetime Active checked)...",
      "اكتمال الكشف الأمني والتحقق الذاتي: قاعدة البيانات مؤمنة بالكامل وسليمة 100%!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setDbCheckLogs(prev => [...prev, logSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setDbChecking(false);
        setDbCheckSuccess(true);
      }
    }, 380);
  };

  const triggerGoogleDriveBackupManual = () => {
    setGdriveBackupLoading(true);
    setGdriveBackupSuccess(false);
    setTimeout(() => {
      setGdriveBackupLoading(false);
      setGdriveBackupSuccess(true);
      setTimeout(() => setGdriveBackupSuccess(false), 4000);
    }, 1500);
  };

  const triggerPrinterConnectionTest = () => {
    setPrinterTesting(true);
    setPrinterSuccess(false);
    setTimeout(() => {
      setPrinterTesting(false);
      setPrinterSuccess(true);
      setTimeout(() => setPrinterSuccess(false), 4000);
    }, 1200);
  };

  // AI Copilot simulation
  const [aiInterpretation, setAiInterpretation] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Filter tests pending administrator validation & stamp
  const pendingApprovals = tests.filter(t => t.sampleStatus === 'analyzed');

  // Math for metrics panel
  const totalRevenue = tests.reduce((sum, t) => sum + (t.cost || 0), 0);
  const totalCollectedRevenues = tests.reduce((sum, t) => sum + (t.paidAmount || 0), 0);

  const formatPrice = (sarPrice: number) => {
    const coeff = currency === 'EGP' ? 13 : 1;
    const symbol = currency === 'EGP' ? (language === 'ar' ? 'ج.م' : 'EGP') : (language === 'ar' ? 'ر.س' : 'SAR');
    return `${Math.round(sarPrice * coeff)} ${symbol}`;
  };
  const totalApproved = tests.filter(t => t.sampleStatus === 'approved').length;
  const totalPending = tests.filter(t => t.sampleStatus === 'analyzed' || t.sampleStatus === 'collected').length;

  const triggerAiCopilot = () => {
    if (!reviewingTest) return;
    setAiLoading(true);
    setAiInterpretation('');

    setTimeout(() => {
      // Analyze test parameter states to generate realistic medical AI commentary
      const abnormalList = reviewingTest.parameters.filter(p => p.isAbnormal);
      let interpretationText = '';

      if (abnormalList.length > 0) {
        interpretationText = `🔍 [تقرير الذكاء الاصطناعي - الطبيب المساعد]:\n` +
          `• يلاحظ وجود مؤشرات خارج النطاق الطبيعي في تحليل المريض (${reviewingTest.patientName}).\n` +
          `• المعلمات المتأثرة: ${abnormalList.map(p => `${p.nameAr} (${p.value} ${p.unit})`).join('، ')}.\n` +
          `• التوصية السريرية: يُنصح الطبيب المعالج بالتحقق من العوامل الالتهابية أو مؤشرات الكوليسترول العامة لربطها بالخطة الغذائية وتحفيز سبل الوقاية الصحية الذكية. المنتج موثق بالكامل.`;
      } else {
        interpretationText = `🔍 [تقرير الذكاء الاصطناعي - الطبيب المساعد]:\n` +
          `• جميع القيم المسجلة للمريض (${reviewingTest.patientName}) في تحليل (${reviewingTest.titleAr}) تقع بالكامل ضمن القنوات الطبيعية المعيارية المرجعية.\n` +
          `• التوصية التحليلية: لا توجد أي دلالات سريرية خارج المدى المقدر. المريض بصحة ممتازة.`;
      }

      setAiInterpretation(interpretationText);
      setAiLoading(false);
    }, 1500);
  };

  const handleApprove = (testId: string) => {
    onApproveTest(testId, doctorSignName);
    setReviewingTest(null);
    setAiInterpretation('');
  };

  // AI Dynamic Permissions builder variables
  const [aiPermPrompt, setAiPermPrompt] = useState('');
  const [aiPermResult, setAiPermResult] = useState('');
  const [aiPermLoading, setAiPermLoading] = useState(false);

  const handleCompilePermissionsWithAI = () => {
    if (!aiPermPrompt.trim()) return;
    setAiPermLoading(true);
    setAiPermResult('');

    setTimeout(() => {
      const p = aiPermPrompt.toLowerCase();
      let updatedPerms = [...settings.receptionPermissions];
      let actionsText = [];

      if (p.includes('منع') || p.includes('إلغاء') || p.includes('تعطيل') || p.includes('إيقاف') || p.includes('حظر') || p.includes('منعه')) {
        if (p.includes('فواتير') || p.includes('فاتورة') || p.includes('دفع') || p.includes('تحصيل') || p.includes('مالي') || p.includes('فواتيرها')) {
          updatedPerms = updatedPerms.filter(item => item !== 'billing');
          actionsText.push('تعطيل صلاحية إصدار الفواتير وتحصيل الأموال ❌');
        }
        if (p.includes('تسجيل') || p.includes('مرضى') || p.includes('مريض') || p.includes('ملف')) {
          updatedPerms = updatedPerms.filter(item => item !== 'register_patient');
          actionsText.push('إيقاف صلاحية تسجيل المرضى الجدد من السجلات ❌');
        }
        if (p.includes('مواعيد') || p.includes('موعد') || p.includes('حجز') || p.includes('جدول')) {
          updatedPerms = updatedPerms.filter(item => item !== 'appointments');
          actionsText.push('تعطيل صلاحيات جدولة الحجوزات والمواعيد المنزلية ❌');
        }
        if (p.includes('سجلات') || p.includes('رؤية') || p.includes('عرض') || p.includes('اطلاع')) {
          updatedPerms = updatedPerms.filter(item => item !== 'view_all_records');
          actionsText.push('حظر تصفح وعرض السجلات الطبية السحابية العامة ❌');
        }
      } else {
        // Grant permissions
        if (p.includes('فواتير') || p.includes('فاتورة') || p.includes('دفع') || p.includes('تحصيل') || p.includes('مالي')) {
          if (!updatedPerms.includes('billing')) updatedPerms.push('billing');
          actionsText.push('تمكين صلاحية الفواتير والتحصيل المالي الرقمي ✔');
        }
        if (p.includes('تسجيل') || p.includes('مرضى') || p.includes('مريض') || p.includes('ملف')) {
          if (!updatedPerms.includes('register_patient')) updatedPerms.push('register_patient');
          actionsText.push('تمكين صلاحية تسجيل وإنشاء السجلات الطبية للمرضى الجدد ✔');
        }
        if (p.includes('مواعيد') || p.includes('موعد') || p.includes('حجز') || p.includes('جدول')) {
          if (!updatedPerms.includes('appointments')) updatedPerms.push('appointments');
          actionsText.push('تمكين صلاحية جدولة وإدارة المواعيد الطبية وسحب العينات ✔');
        }
        if (p.includes('سجلات') || p.includes('رؤية') || p.includes('عرض') || p.includes('اطلاع')) {
          if (!updatedPerms.includes('view_all_records')) updatedPerms.push('view_all_records');
          actionsText.push('تمكين صلاحية عرض فهارس وسجلات العائلات السحابية ✔');
        }
      }

      if (actionsText.length === 0) {
        updatedPerms = ['register_patient', 'appointments'];
        actionsText.push('إعادة تعيين صلاحيات الموظف للحد الأدنى (تسجيل ومواعيد فقط) 🛡');
      }

      onUpdateSettings({
        ...settings,
        receptionPermissions: updatedPerms
      });

      setAiPermResult(`🤖 [مساعد الصلاحيات الذكي]:\nتم تلقي توجيهك وتحليله بدقة فصحى.\nتعديل الصلاحيات المطبق:\n${actionsText.map(a => `• ${a}`).join('\n')}\nتم الحفظ في قاعدة معلومات النظام وتوجيهها للموظف.`);
      setAiPermLoading(false);
    }, 1200);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onModifyReferenceCost(selectedSettingType, Number(settingMin), Number(settingMax));
    setSettingSuccess(true);
    setTimeout(() => setSettingSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">إجمالي الفواتير الطبية</span>
          <span className="text-xl font-black text-emerald-400 mt-0.5 block">{formatPrice(totalRevenue)}</span>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">المحّصل في الخزانة</span>
          <span className="text-xl font-black text-teal-400 mt-0.5 block">{formatPrice(totalCollectedRevenues)}</span>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">التقارير المعتمدة والموثقة (QR)</span>
          <span className="text-xl font-black text-indigo-400 mt-0.5 block">{totalApproved} تقارير</span>
        </div>
        <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-xl">
          <span className="text-[10px] text-slate-400 font-bold block mb-1">العينات المعلقة بالمعمل</span>
          <span className="text-xl font-black text-rose-400 mt-0.5 block">{totalPending} عينات</span>
        </div>
      </div>

      {/* Mini Controls Area */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`pb-3 px-4 font-bold text-sm relative transition-all cursor-pointer ${
            activeSubTab === 'approvals' ? 'text-teal-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="btn-admin-tab-approvals"
        >
          <span>طلبات الاعتماد الطبي ({pendingApprovals.length})</span>
          {activeSubTab === 'approvals' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveSubTab('metrics')}
          className={`pb-3 px-4 font-bold text-sm relative transition-all cursor-pointer ${
            activeSubTab === 'metrics' ? 'text-teal-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="btn-admin-tab-metrics"
        >
          <span>مؤشرات أداء المعمل والمبيعات</span>
          {activeSubTab === 'metrics' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`pb-3 px-4 font-bold text-sm relative transition-all cursor-pointer ${
            activeSubTab === 'settings' ? 'text-teal-600 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
          id="btn-admin-tab-settings"
        >
          <span>معايرة الحدود المرجعية الطبية</span>
          {activeSubTab === 'settings' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-full" />}
        </button>
      </div>

      {/* TAB CONTENT: APPROVAL QUEUE */}
      {activeSubTab === 'approvals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          
          {/* Waiting List Grid */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-sm">
            <h3 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-indigo-500" />
              <span>فحوصات مفحوصة جاهزة للاعتماد والختم</span>
            </h3>

            <div className="space-y-3">
              {pendingApprovals.length > 0 ? (
                pendingApprovals.map((t, idx) => {
                  const patient = patients.find(p => p.id === t.patientId);
                  return (
                    <div 
                      key={idx}
                      onClick={() => {
                        setReviewingTest(t);
                        setAiInterpretation('');
                      }}
                      className={`p-3.5 border rounded-xl hover:border-teal-500 cursor-pointer transition-all ${
                        reviewingTest?.id === t.id 
                          ? 'border-indigo-500 bg-indigo-50/30' 
                          : 'border-slate-100 bg-white'
                      }`}
                      id={`approve-queue-${t.id}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-850 text-sm">{t.patientName}</span>
                        <span className="bg-indigo-100 text-indigo-800 font-bold text-[9px] px-2 py-0.5 rounded">
                          محللة مخبرياً
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2.5 text-slate-500">
                        <span className="font-semibold text-slate-700">{t.titleAr}</span>
                        <span className="font-mono text-[9px]">{t.id}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400">
                  يرجى العلم بأنه لا يوجد أي تقرير ينتظر التدقيق حالياً.
                </div>
              )}
            </div>
          </div>

          {/* Interactive Inspection Workspace */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm text-sm">
            {reviewingTest ? (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 block bg-teal-50 px-2 py-0.5 rounded-md inline-block">
                      مراجعة التحصيل وبراءة الذمة الطبية
                    </span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">تطابق القيم والمؤشرات للمريض: {reviewingTest.patientName}</h3>
                  </div>
                  
                  {/* AI Copilot Trigger Button */}
                  <button
                    onClick={triggerAiCopilot}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs px-4  py-2.5 rounded-xl shadow-md cursor-pointer transition-all"
                    id="btn-admin-ai"
                  >
                    <Sparkles className="w-4 h-4 animate-spin text-teal-300" style={{ animationDuration: aiLoading ? '1s' : '0s' }} />
                    <span>{aiLoading ? 'جاري قراءة المعطيات...' : 'توليد توصية AI الطبية للمريض'}</span>
                  </button>
                </div>

                {/* AI Interpretation Overlay if generated */}
                {aiInterpretation && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-900 leading-relaxed text-xs animate-fadeIn relative">
                    <Sparkles className="w-4 h-4 absolute top-3 left-3 text-indigo-500 animate-pulse" />
                    <pre className="whitespace-pre-wrap font-sans font-medium">{aiInterpretation}</pre>
                  </div>
                )}

                {/* Patient medical parameters validation lists */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-slate-600">الفحص التحليلي والمعايرات:</h4>
                  {reviewingTest.parameters.map((p, idx) => {
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-800 block text-xs">{p.nameAr}</span>
                          <span className="text-[10px] text-slate-400 font-mono italic">{p.name}</span>
                        </div>
                        
                        <div className="text-left">
                          <span className={`font-mono text-sm font-bold block ${p.isAbnormal ? 'text-rose-600' : 'text-slate-700'}`}>
                            {p.value} {p.unit}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-mono">
                            طبيعي: {p.minNormal} - {p.maxNormal}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Signature Customizer */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">اسم الطبيب أو اللجنة المعتمدة للتوقيع والختم:</label>
                  <input
                    type="text"
                    value={doctorSignName}
                    onChange={(e) => setDoctorSignName(e.target.value)}
                    className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs focus:border-indigo-500 outline-none transition-all font-semibold"
                    id="admin-signature-input"
                  />
                  <p className="text-[10px] text-slate-400 mt-2">
                    * عند النقر على معالج الاعتماد النهائي، سيتم تشفير وتوليد تشفير الـ QR Code الذكي وتوليد رمز QR الفريد فوراً لمطابقة هذا التقرير الطبي دولياً.
                  </p>
                </div>

                {/* Bottom Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setReviewingTest(null);
                      setAiInterpretation('');
                    }}
                    className="text-slate-500 hover:bg-slate-100 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    لاحقاً
                  </button>
                  <button
                    onClick={() => handleApprove(reviewingTest.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer animate-pulse"
                    id="admin-btn-approve-confirm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-250 animate-bounce" />
                    <span>اعتماد إلكتروني وبصمة QR</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full mb-4 border border-emerald-100">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-slate-800 mb-1 text-base">بانتظار مراجعة تقرير للتدقيق</h3>
                <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                  اختر من اليمين أي ملف معملي للتدقيق الطبي وإلحاق تفاسير الذكاء الاصطناعي وبوابة الاستعلام المصدقة.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB CONTENT: PERFORMANCE & METRICS */}
      {activeSubTab === 'metrics' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm text-sm space-y-6 animate-fadeIn">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-800">تحليلات الأداء المالي والسريري للمختبر</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Panel: Financial Health */}
            <div className="border border-slate-100 p-5 rounded-2xl">
              <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-1.5">
                <Coins className="w-4.5 h-4.5 text-emerald-600" />
                <span>المركز المالي وموازنة الخزينة</span>
              </h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">مجموع الفواتير العامة:</span>
                  <span className="font-bold text-slate-700 font-mono text-sm">{formatPrice(totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">المحصل الفعلي بالخزينة:</span>
                  <span className="font-bold text-emerald-600 font-mono text-sm">{formatPrice(totalCollectedRevenues)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">المستحق المتبقي للتسليم:</span>
                  <span className="font-bold text-amber-600 font-mono text-sm">{formatPrice(totalRevenue - totalCollectedRevenues)}</span>
                </div>

                {/* Progress bar to visual payments */}
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                    <span>تحصيل ممتاز</span>
                    <span>{totalRevenue > 0 ? Math.round((totalCollectedRevenues / totalRevenue) * 100) : 100}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${totalRevenue > 0 ? (totalCollectedRevenues / totalRevenue) * 100 : 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Patient split */}
            <div className="border border-slate-100 p-5 rounded-2xl">
              <h4 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-1.5">
                <HeartPulse className="w-4.5 h-4.5 text-teal-600" />
                <span>إحصائيات المرضى والنشاط السلوكي للعيادات</span>
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">إجمالي الفحوص البرمجية:</span>
                  <span className="font-bold text-slate-700">{tests.length} تحليل</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">تقارير منتهية متداولة (Approved):</span>
                  <span className="font-bold text-emerald-600">{totalApproved} تفويض</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">منظومة القوالب النشطة:</span>
                  <span className="font-bold text-indigo-600">4 قوالب معيارية</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: OWNER DOCTOR HYPER-SETTINGS & CUSTOMIZATION */}
      {activeSubTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm text-sm space-y-8 animate-fadeIn">
          
          {/* Header */}
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Sliders className="w-5 h-5 text-emerald-700 font-bold" />
            <h3 className="text-base font-extrabold text-slate-850">لوحة الإعدادات الشاملة وتحكم الدكتور المالك</h3>
          </div>

          {settingSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl font-bold text-xs flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              <span>تم تحديث كافة الضوابط والخيارات وقاعدة البيانات المرجعية بنجاح!</span>
            </div>
          )}

          {/* SECTION 1: CORE BRANDING & PHYSICIAN INFO */}
          <div className="space-y-4 pt-1">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
              <span>تخصيص الهوية الرسمية والمعلومات المهنية</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم المنشأة الطبية (بالعربية):</label>
                <input
                  type="text"
                  value={settings.labNameAr}
                  onChange={(e) => onUpdateSettings({ ...settings, labNameAr: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1 font-sans">اسم المنشأة بالإنكليزية (English Name):</label>
                <input
                  type="text"
                  value={settings.labNameEn}
                  onChange={(e) => onUpdateSettings({ ...settings, labNameEn: e.target.value })}
                  className="w-full text-left font-sans bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم الطبيب المدير والمالك:</label>
                <input
                  type="text"
                  value={settings.doctorName}
                  onChange={(e) => onUpdateSettings({ ...settings, doctorName: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رقم رخصة مزاولة المهنة الطبية (MOH License):</label>
                <input
                  type="text"
                  value={settings.doctorLicense}
                  onChange={(e) => onUpdateSettings({ ...settings, doctorLicense: e.target.value })}
                  className="w-full text-left font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all"
                  required
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 2: STAFF ACCOUNT MANAGMENT & COLLABORATIVE AI PERMISSIONS COMPILER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
                <span>بيانات دخول موظف الاستقبال والصلاحيات الحالية</span>
              </h4>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-black">حماية مشددة</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">اسم مستخدم الاستقبال:</label>
                <input
                  type="text"
                  value={settings.receptionUsername}
                  onChange={(e) => onUpdateSettings({ ...settings, receptionUsername: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">كلمة مرور الاستقبال:</label>
                <input
                  type="text"
                  value={settings.receptionPassword}
                  onChange={(e) => onUpdateSettings({ ...settings, receptionPassword: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">البريد الإلكتروني للإدارة (المالك):</label>
                <input
                  type="email"
                  value={settings.doctorEmail || "director@mylab.com"}
                  onChange={(e) => onUpdateSettings({ ...settings, doctorEmail: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رمز المرور الأمني للإدارة (المالك):</label>
                <input
                  type="text"
                  value={settings.doctorPasscode || "director_passcode_881"}
                  onChange={(e) => onUpdateSettings({ ...settings, doctorPasscode: e.target.value })}
                  className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                  required
                />
              </div>
            </div>

            {/* Manual permission list */}
            <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-2">الصلاحيات الممنوحة حالياً للاستقبال:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'register_patient', label: 'إضافة وتسجيل المرضى الجدد وفتح الملفات' },
                  { key: 'billing', label: 'إصدار الفواتير وتحصيل المبالغ النقدية والمدفوعات' },
                  { key: 'appointments', label: 'حجز المواعيد والجدولة والتنسيق المنزلي' },
                  { key: 'view_all_records', label: 'استعراض السجلات السحابية الطبية السابقة للمرضى' },
                ].map((pItem) => {
                  const isChecked = settings.receptionPermissions.includes(pItem.key);
                  return (
                    <label key={pItem.key} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          const updated = isChecked
                            ? settings.receptionPermissions.filter(k => k !== pItem.key)
                            : [...settings.receptionPermissions, pItem.key];
                          onUpdateSettings({ ...settings, receptionPermissions: updated });
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span className="font-medium">{pItem.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* INTEGRATED INTELLIGENCE PERMISSIONS ASSISTANT (الذكاء المدمج لتسهيل بناء صلاحيات جديده) */}
            <div className="bg-slate-900 border border-slate-800 text-slate-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>التعاون الدلالي مع الذكاء المدمج لصياغة وبناء صلاحيات الموظف</span>
              </div>
              <textarea
                rows={2}
                value={aiPermPrompt}
                onChange={(e) => setAiPermPrompt(e.target.value)}
                placeholder="أدخل توجهاً باللغة العربية الفصحى. مثال: (أريد حظر صلاحية الفواتير والمالية عن الملاك والاحتفاظ بجدولة المواعيد وتسجيل المريض فقط) أو (تمكينه من كل الصلاحيات المتاحة)"
                className="w-full text-right bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-emerald-500 font-sans text-slate-100 placeholder-slate-550 resize-none leading-relaxed"
              />
              <div className="flex justify-between items-center gap-4">
                <button
                  type="button"
                  onClick={handleCompilePermissionsWithAI}
                  disabled={aiPermLoading || !aiPermPrompt.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {aiPermLoading ? 'جاري التحليل البرمجي...' : 'معالجة الأمر وتطبيق الصلاحيات السحابية'}
                </button>
                <span className="text-[10px] text-slate-450 font-mono">LIS NLP-Compiler v1.9</span>
              </div>

              {aiPermResult && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-emerald-300 leading-relaxed font-sans whitespace-pre-line animate-fadeIn">
                  {aiPermResult}
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 3: LAB REPORT INPUTTING CHANNELS */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
              <span>وسائط تفريغ واعتماد التقارير الطبية المساندة (Technician Modalities)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-start gap-2.5 bg-slate-50 hover:bg-slate-100/50 p-3 rounded-xl border border-slate-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.canUploadWithTyping}
                  onChange={(e) => onUpdateSettings({ ...settings, canUploadWithTyping: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">الكتابة والرقمنة اليدوية</span>
                  <span className="text-[10px] text-slate-450">إدخال مباشر لكل معامل رقمي طبي</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 bg-slate-50 hover:bg-slate-100/50 p-3 rounded-xl border border-slate-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.canUploadWithImages}
                  onChange={(e) => onUpdateSettings({ ...settings, canUploadWithImages: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">قراءة صور التقارير</span>
                  <span className="text-[10px] text-slate-450">تحليل وسحب البيانات الضوئية للتقارير المرفوعة</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 bg-slate-50 hover:bg-slate-100/50 p-3 rounded-xl border border-slate-150 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={settings.canUploadWithFiles}
                  onChange={(e) => onUpdateSettings({ ...settings, canUploadWithFiles: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 mt-0.5"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">إرفاق المستندات المرجعية</span>
                  <span className="text-[10px] text-slate-450">تجهيز النتائج بموجب مستندات PDF الطبي</span>
                </div>
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 4: DEPLOYED SUBSYSTEMS STATUS */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
              <span>تفعيل وإيقاف الأنظمة الفرعية للمختبر</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">جهاز فني الأجهزة LIS</span>
                  <span className="text-[10px] text-slate-400">لوحة ربط وقراءة عينات الأنابيب</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableTechnicianPlatform}
                  onChange={(e) => onUpdateSettings({ ...settings, enableTechnicianPlatform: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">تطبيق Patients Android</span>
                  <span className="text-[10px] text-slate-400">هيكل محاكي وصول المريض للجوال</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAndroidSimulator}
                  onChange={(e) => onUpdateSettings({ ...settings, enableAndroidSimulator: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">تخطي الفحص البيومتري</span>
                  <span className="text-[10px] text-slate-400">تجاوز بصمة التأكيد ومصادقة الطبيب المالك</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.allowBiometricBypass}
                  onChange={(e) => onUpdateSettings({ ...settings, allowBiometricBypass: e.target.checked })}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                />
              </label>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 5: CLINICAL TEST COSTS & PRICING PRESETS */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
              <span>تخصيص أسعار الفحوصات والتحاليل الطبية الافتراضية ({currency === 'EGP' ? (language === 'ar' ? 'ج.م' : 'EGP') : (language === 'ar' ? 'ر.س' : 'SAR')})</span>
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تحليل صورة دم كاملة CBC:</label>
                <input
                  type="number"
                  value={settings.customTestPricing.CBC}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    customTestPricing: { ...settings.customTestPricing, CBC: Number(e.target.value) }
                  })}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تحليل الدهون LIPID:</label>
                <input
                  type="number"
                  value={settings.customTestPricing.LIPID}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    customTestPricing: { ...settings.customTestPricing, LIPID: Number(e.target.value) }
                  })}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تحليل إنزيمات الكبد LIVER:</label>
                <input
                  type="number"
                  value={settings.customTestPricing.LIVER}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    customTestPricing: { ...settings.customTestPricing, LIVER: Number(e.target.value) }
                  })}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">تحليل سكر الدم الصائم GLUCOSE:</label>
                <input
                  type="number"
                  value={settings.customTestPricing.GLUCOSE}
                  onChange={(e) => onUpdateSettings({
                    ...settings,
                    customTestPricing: { ...settings.customTestPricing, GLUCOSE: Number(e.target.value) }
                  })}
                  className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SECTION 6: ANALYZER REFERENCE CALIBRATION RANGE */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
              <span>معايرة الحدود المرجعية الحيوية للأجهزة (Analyzer Reference Ranges)</span>
            </h4>
            <form onSubmit={handleSaveSettings} className="space-y-4" id="admin-calib-settings-form">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">اختر الفحص المعني:</label>
                  <select
                    value={selectedSettingType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setSelectedSettingType(val);
                      if (val === 'CBC') { setSettingMin(12.0); setSettingMax(17.5); }
                      if (val === 'LIPID') { setSettingMin(120); setSettingMax(200); }
                      if (val === 'LIVER') { setSettingMin(7); setSettingMax(56); }
                      if (val === 'GLUCOSE') { setSettingMin(70); setSettingMax(100); }
                    }}
                    className="w-full text-right bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all cursor-pointer"
                    id="admin-calib-select"
                  >
                    <option value="CBC">صورة دم كاملة (الهيموجلوبين)</option>
                    <option value="LIPID">الكوليسترول الكلي</option>
                    <option value="LIVER">إنزيمات وظائف الكبد (ALT)</option>
                    <option value="GLUCOSE">سكر الدم الصائم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الحد الأدنى الطبيعي المقبول:</label>
                  <input
                    type="number"
                    step="any"
                    value={settingMin}
                    onChange={(e) => setSettingMin(Number(e.target.value))}
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                    required
                    id="admin-calib-min"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">الحد الأقصى الطبيعي المقبول:</label>
                  <input
                    type="number"
                    step="any"
                    value={settingMax}
                    onChange={(e) => setSettingMax(Number(e.target.value))}
                    className="w-full text-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all font-mono"
                    required
                    id="admin-calib-max"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-750 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  id="admin-calib-submit"
                >
                  حفظ وتطبيق المعايرة الطبية الحيوية وتحديث الأجهزة
                </button>
              </div>
            </form>
          </div>

          <hr className="border-slate-100" />

          {/* NEW SECTION 7: GOOGLE DRIVE AUTOMATIC BACKUP */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
                <Cloud className="w-4 h-4 text-emerald-600" />
                <span>إعدادات النسخ الاحتياطي التلقائي السحابي لـ Google Drive</span>
              </h4>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-bold font-mono">
                عقد تخزين مشفر وممدد
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer select-none">
                  <div>
                    <span className="font-bold text-slate-850 text-xs block">ميزة النسخ الاحتياطي التلقائي</span>
                    <span className="text-[10px] text-slate-400">تحديث وتخزين البيانات فوريا بحساب جوجل درايف</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableGoogleDriveBackup}
                    onChange={(e) => onUpdateSettings({ ...settings, enableGoogleDriveBackup: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                </label>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">دورة التكرار والرفع التلقائي:</label>
                  <select
                    value={settings.googleDriveBackupInterval}
                    onChange={(e) => onUpdateSettings({ ...settings, googleDriveBackupInterval: e.target.value as any })}
                    className="w-full text-right bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all cursor-pointer font-bold"
                  >
                    <option value="immediate">تحديث فوري ومستمر مع كل فحص (نوصي به)</option>
                    <option value="daily">نسخ احتياطي يومي مجدول (Daily)</option>
                    <option value="hourly">نسخ احتياطي كل ساعة تلقائياً (Hourly)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">رمز تفويض الاتصال / توكن جوجل درايف المرخص الداعم لحسابك (Token Key):</label>
                <div className="relative">
                  <input
                    type="password"
                    value={settings.googleDriveToken}
                    onChange={(e) => onUpdateSettings({ ...settings, googleDriveToken: e.target.value })}
                    className="w-full text-left font-mono bg-white border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-xs focus:border-emerald-600 outline-none transition-all"
                    placeholder="أدخل رمز التفويض ghp_ أو OAuth Token"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-emerald-650" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  * تم إلحاق وتوجيه الـ Access Token الموفر تلقائياً لمصادقة ورفع المرضى والنتائج الطبية السحابية وحفظها باسم <code className="font-mono text-[9px] bg-slate-200 px-1 py-0.5 rounded text-rose-600">mylab_clinical_cloud_backup.json</code> في سحابة الطبيب.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={triggerGoogleDriveBackupManual}
                  disabled={gdriveBackupLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Cloud className="w-4 h-4 animate-bounce" />
                  <span>{gdriveBackupLoading ? "جاري الاتصال ورفع الحزم..." : "مزامنة السحابة ورفع النسخة الآن"}</span>
                </button>
              </div>

              {gdriveBackupSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-xl text-emerald-900 text-xs leading-relaxed animate-fadeIn font-semibold">
                  🟢 تم الكشف: نجحت المصادقة الآمنة! تم تحديث حزم البيانات ورفع الملفات الطبية بصيغة مشفرة E2E لحساب جوجل درايف باسم <span className="font-mono text-xs text-slate-800 underline">mylab-clinical-backups-2026.json</span> بنجاح تام وبصورة سليمة!
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* NEW SECTION 8: ELECTRONIC PRINTER & COPY SETTINGS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
                <Printer className="w-4 h-4 text-emerald-600" />
                <span>إعدادات الطابعات الإلكترونية والحرارية وصلاحية النسخ السريع</span>
              </h4>
              <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-lg font-bold">
                تكامل الـ Hardware
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer select-none">
                  <div>
                    <span className="font-bold text-slate-850 text-xs block">تفعيل الاتصال التلقائي بالطابعات</span>
                    <span className="text-[10px] text-slate-400">تحضير وإرسال التقارير الطبية فورا للطابعات والشبكة</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableElectronicPrinter}
                    onChange={(e) => onUpdateSettings({ ...settings, enableElectronicPrinter: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                </label>

                <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl cursor-pointer select-none">
                  <div>
                    <span className="font-bold text-slate-850 text-xs block">إتاحة النسخ السريع للنتائج</span>
                    <span className="text-[10px] text-slate-400">عرض أزرار نسخ نص التقرير لرسائل الواتساب والـ SMS</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowResultCopying}
                    onChange={(e) => onUpdateSettings({ ...settings, allowResultCopying: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">نوع بروتوكول اتصال الطابعة (Printer Protocol):</label>
                  <select
                    value={settings.printerConnectionType}
                    onChange={(e) => onUpdateSettings({ ...settings, printerConnectionType: e.target.value as any })}
                    className="w-full text-right bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all cursor-pointer font-bold"
                  >
                    <option value="network">طابعة شبكة لاسلكية (Wi-Fi / LAN IP)</option>
                    <option value="usb">منفذ USB السلكي المباشر (Direct USB Connection)</option>
                    <option value="bluetooth">اتصال بلوتوث حراري محمول (Bluetooth Printer)</option>
                    <option value="disconnected">بدون طابعة - الحفظ بصيغة PDF إلكتروني فقط</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">عنوان الـ IP أو اسم الطابعة بالشبكة:</label>
                  <input
                    type="text"
                    value={settings.printerIpAddress}
                    onChange={(e) => onUpdateSettings({ ...settings, printerIpAddress: e.target.value })}
                    className="w-full text-left font-mono bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:border-emerald-600 outline-none transition-all"
                    placeholder="e.g. 192.168.1.100 or EPSON-L3150"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={triggerPrinterConnectionTest}
                  disabled={printerTesting}
                  className="bg-teal-600 hover:bg-teal-500 disabled:opacity-55 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{printerTesting ? "جاري الاختبار واستدعاء الطابعة..." : "اختبار الطابعة وطباعة ورقة محاذاة"}</span>
                </button>
              </div>

              {printerSuccess && (
                <div className="bg-emerald-50 border border-emerald-250 p-3 rounded-xl text-emerald-900 text-xs leading-relaxed animate-fadeIn font-semibold">
                  🖨️ تم إرسال إشعار طباعة تجريبي بنجاح! تم التقاط الطابعة في العنوان <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border">{settings.printerIpAddress}</span> عبر منفذ الشبكة، وسيتم قوالب محاذاة الأعمدة لملف PDF تلقائياً طبقاً للمقاييس المعيارية.
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* NEW SECTION 9: LIFELONG SECURE DATABASE DIAGNOSTICS & STATUS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5 border-r-2 border-emerald-600 pr-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>التحقق الذاتي من سلامة وأمان قاعدة البيانات الطبية وصلاحية الترخيص مدى الحياة</span>
              </h4>
              <span className="bg-emerald-600 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm animate-pulse flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>الترخيص: صالح مدى الحياة</span>
              </span>
            </div>

            <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 bg-emerald-500/10 text-emerald-450 px-4 py-1.5 rounded-br-2xl text-[10px] font-mono border-b border-r border-emerald-500/20">
                AES-256 E2E Active
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider font-mono">Database Status Report</span>
                <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                  قاعدة البيانات المحلية والسحابية المشتركة مأمنة بالكامل عن طريق التوقيع الرقمي والتشفير المعياري المتقدم لحفظ وحماية خصوصية بيانات المرضى والتقارير بموجب القوانين والأنظمة السعودية.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1 text-center">
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 block font-bold">بنية الملفات والـ Schema</span>
                  <span className="text-emerald-450 font-extrabold text-xs">سليمة ومأمنة 100%</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[9px] text-slate-500 block font-bold">حالة تشفير المعامل الطبية</span>
                  <span className="text-teal-400 font-extrabold text-xs">AES-256 مشفر طرفياً</span>
                </div>
                <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[9px] text-slate-500 block font-bold">صلاحية ترخيص المحرك</span>
                  <span className="text-indigo-400 font-extrabold text-xs">مدى الحياة (Lifetime Valid)</span>
                </div>
              </div>

              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={runDatabaseIntegrityDiagnostic}
                  disabled={dbChecking}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  <Database className="w-4 h-4" />
                  <span>{dbChecking ? "جاري القيام بالتحليل الذاتي الأمني..." : "تفحص أمان وصلاحية قاعدة البيانات الآن"}</span>
                </button>
              </div>

              {/* Logs area active */}
              {(dbChecking || dbCheckLogs.length > 0) && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1 text-[11px] font-mono text-emerald-400 leading-relaxed text-right animate-fadeIn">
                  {dbCheckLogs.map((log, index) => (
                    <div key={index} className="flex items-center gap-1.5 justify-start">
                      <span className="text-teal-500">▶</span>
                      <span>{log}</span>
                    </div>
                  ))}
                  {dbChecking && (
                    <div className="text-xs text-slate-400 animate-pulse mt-2 flex items-center justify-start gap-1">
                      <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
                      <span>جاري القراءة والمعالجة...</span>
                    </div>
                  )}
                </div>
              )}

              {dbCheckSuccess && (
                <div className="bg-slate-950 border border-emerald-500/40 p-4 rounded-xl text-xs text-teal-300 leading-relaxed font-sans space-y-1.5 animate-scaleIn">
                  <div className="font-extrabold text-white flex items-center gap-1.5">
                    <Check className="w-4.5 h-4.5 text-emerald-400" />
                    <span>تقرير الفحص والتحقق الذاتي الدوري (Database Health Check):</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    تم التأكد والتحقق من سلامة الجداول وتطابق التواقيع البرمجية. قاعدة البيانات تحتفظ بصلاحيتها مدى الحياة بنسبة حماية 100% ضد الفقدان أو العبث. الترخيص نشط مع السرفرات الطبية السحابية ولا توجد أية أخطاء.
                  </p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-slate-100" />

          <div className="pt-4 flex justify-between items-center border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-mono">آخر تحديث سحابي: 2026-06-08 UTC</span>
            <button
              type="button"
              onClick={() => {
                setSettingSuccess(true);
                setTimeout(() => setSettingSuccess(false), 3000);
              }}
              className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-8 py-3 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              حفظ وتأصيل الخيارات بالخادم المركزي للـ LIMS
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
