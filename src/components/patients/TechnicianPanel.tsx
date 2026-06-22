import { useState, useEffect } from 'react';
import { getAllTests, getAllPatients, updateTestResultsAndStatus, addAuditLog } from '../../lib/db';
import { Test, Patient } from '../../types';
import { Clock, Beaker, CheckCircle2, AlertCircle, Save, XCircle, RefreshCw, Layers, ShieldAlert, Cpu } from 'lucide-react';
import { verifyTestResults, BIOLOGICAL_RULES } from '../../lib/verification';
import { autoDeductConsumables, getInventory } from '../../lib/inventory';
import { pushNotification } from '../../lib/notifications';

export function TechnicianPanel({ refreshTrigger, onRefresh }: { refreshTrigger: boolean; onRefresh: () => void }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  
  // Dynamic form state for test results
  const [resultsForm, setResultsForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('pending');

  // Interactive ASTM Device Fetch sequence simulation
  const [isAnalyzerFetching, setIsAnalyzerFetching] = useState(false);
  const [analyzerLogs, setAnalyzerLogs] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    const [allTests, allPatients] = await Promise.all([
      getAllTests(),
      getAllPatients()
    ]);
    setTests(allTests.sort((a,b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
      return bTime - aTime;
    }));
    setPatients(allPatients);
  };

  const getPatientName = (pId: string) => {
    const p = patients.find(patient => patient.id === pId);
    return p ? `${p.nameAr} (${p.gender === 'male' ? 'ذكر' : 'أنثى'})` : 'مريض مجهول';
  };

  const handleSelectTest = (test: Test) => {
    setSelectedTest(test);
    setAnalyzerLogs([]);
    // Initialize resultsForm with existing values or empty strings
    const initialForm: Record<string, string> = {};
    if (test.parameters) {
      Object.keys(test.parameters).forEach(key => {
        initialForm[key] = test.results?.[key] || '';
      });
    }
    setResultsForm(initialForm);
  };

  const handleInputChange = (key: string, value: string) => {
    setResultsForm(prev => ({ ...prev, [key]: value }));
  };

  // Automated ASTM Device Parser - pulls biometric values from a mock ASTM stream
  const simulateAnalyzerInterfacing = () => {
    if (!selectedTest) return;
    setIsAnalyzerFetching(true);
    setAnalyzerLogs([
      `[${new Date().toLocaleTimeString()}] INGESTION -> Device Query: Requesting results for scan *${selectedTest.id.substring(0, 12).toUpperCase()}* via RS232 Serial COM4`,
      `[${new Date().toLocaleTimeString()}] HANDSHAKE -> ACK received. Serializing ASTM stream...`
    ]);

    setTimeout(() => {
      // Create random matching values within or slightly out of reference ranges
      const simulatedResults: Record<string, string> = {};
      const logLines: string[] = [];

      Object.keys(selectedTest.parameters || {}).forEach(key => {
        const rules = BIOLOGICAL_RULES[key];
        let randomVal = 0;
        
        if (rules) {
          // 80% chance normal, 15% high/low, 5% panic critical
          const roll = Math.random();
          if (roll < 0.75) {
            randomVal = parseFloat((Math.random() * (rules.maxNormal - rules.minNormal) + rules.minNormal).toFixed(1));
          } else if (roll < 0.95) {
            randomVal = parseFloat((Math.random() * (rules.maxNormal + 3 - rules.maxNormal) + rules.maxNormal).toFixed(1));
          } else {
            // Panic value!
            randomVal = parseFloat((rules.maxPanic + Math.random() * 5).toFixed(1));
          }
          simulatedResults[key] = String(randomVal);
          logLines.push(`R|1|^^^${key.toUpperCase()}|${randomVal}|${selectedTest.parameters[key].unit}|${rules.minNormal}-${rules.maxNormal}|N||||||F`);
        } else {
          simulatedResults[key] = '12.5'; // Standard default
        }
      });

      setResultsForm(simulatedResults);
      setAnalyzerLogs(prev => [
        ...prev,
        ...logLines,
        `[${new Date().toLocaleTimeString()}] BIDI STATUS -> SUCCESS: All ${Object.keys(simulatedResults).length} parameters ingested successfully. Displaying form variables.`
      ]);
      setIsAnalyzerFetching(false);

      pushNotification({
        title: 'LIMS Analyzer Fetch Finished',
        titleAr: '🤖 تم سحب النتائج الطبية وحظفها بنجاح',
        message: `Parsed bidirectional values for test ${selectedTest.type}`,
        messageAr: `قام النظام بفك تشفير إرسال جهاز التحليل واستخراج الأرقام للفحص (${selectedTest.type}) ومطابقتها تلقائياً.`,
        type: 'success'
      });

    }, 1500);
  };

  const handleSaveResults = async (status: 'completed' | 'cancelled') => {
    if (!selectedTest) return;
    setSaving(true);
    try {
      // Evaluate Rules Engine
      const verificationReport = verifyTestResults(selectedTest.parameters || {}, resultsForm);
      
      // Update results
      const resultsWithReport = {
        ...resultsForm,
        _verification: {
          isAutoVerified: verificationReport.isAutoVerified,
          needsPhysicianReview: verificationReport.needsPhysicianReview,
          overallStatus: verificationReport.overallStatus,
          overallStatusAr: verificationReport.overallStatusAr,
          verifiedAt: new Date().toISOString()
        }
      };

      await updateTestResultsAndStatus(selectedTest.id, status, resultsWithReport);

      // Save to audit trials
      await addAuditLog({
        userId: 'technician_staff',
        username: 'technician',
        action: 'تصدير واعتماد نتائج التحليل',
        details: `اعتماد (${selectedTest.type}) للمريض ${getPatientName(selectedTest.patientId)}. النتيجة: ${verificationReport.overallStatusAr}`
      });

      // Execute auto-deduction of chemical Reagent vials!
      await autoDeductConsumables(selectedTest.type, selectedTest.id, 'completed');

      // Alert notifications
      await pushNotification({
        title: 'Diagnostic Report Certified',
        titleAr: '📝 تم تدقيق ونشر النتيجة الطبية',
        message: `${selectedTest.type} report generated. Status: ${verificationReport.overallStatus}`,
        messageAr: `تم إصدار ونشر نتيجة فحص (${selectedTest.type}) للمريض ذو رقم الملف بنجاح. حالة التقرير: ${verificationReport.overallStatusAr}`,
        type: verificationReport.overallStatus === 'critical' ? 'critical' : 'success'
      });

      setSelectedTest(null);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('فشل حفظ نتائج التحليل المخبري / Failed to save diagnostic results.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered lists
  const filteredTests = tests.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans" dir="rtl">
      
      {/* Right Column: Tests Feed (Span 5) */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50 bg-opacity-70">
          <div className="flex bg-slate-200 p-0.5 rounded-lg">
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                filterStatus === 'pending' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              المعلقة ({tests.filter(t => t.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                filterStatus === 'completed' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              المكتملة ({tests.filter(t => t.status === 'completed').length})
            </button>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-[10px] font-semibold rounded-md transition-colors ${
                filterStatus === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              الكل
            </button>
          </div>

          <div className="text-right">
            <h3 className="font-bold text-slate-800 text-sm">قائمة طلبات الفحص المخبري</h3>
            <p className="text-[10px] text-slate-400 font-semibold">تابع مسارات التحليل وحصيلة المعمل</p>
          </div>
        </div>

        <div className="flex-1 max-h-[500px] overflow-y-auto divide-y divide-slate-50">
          {filteredTests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              لا توجد طلبات تحليل مخبري معلقة حالياً.
            </div>
          ) : (
            filteredTests.map(test => {
              const isSelected = selectedTest?.id === test.id;
              const statusColors = {
                pending: 'bg-amber-100 text-amber-800 border-amber-200',
                completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                cancelled: 'bg-rose-100 text-rose-800 border-rose-200'
              }[test.status] || 'bg-slate-100 text-slate-800';

              return (
                <button
                  key={test.id}
                  onClick={() => handleSelectTest(test)}
                  className={`w-full p-4 flex flex-col gap-2 hover:bg-slate-50 text-right transition-colors ${
                    isSelected ? 'bg-indigo-50 bg-opacity-40 border-r-4 border-indigo-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColors}`}>
                      {test.status === 'pending' ? 'معلق / قيد الانتظار' : test.status === 'completed' ? 'جاهز ومعتمد' : 'ملغي'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {test.id.substring(0,8).toUpperCase()}</span>
                  </div>

                  <div>
                    <div className="text-sm font-bold text-slate-800">{test.type}</div>
                    <div className="text-xs text-indigo-600 font-semibold mt-0.5">{getPatientName(test.patientId)}</div>
                    
                    {/* Visual indicators for Sample Draw status */}
                    <div className="mt-1 flex items-center gap-1.5 ">
                      <span className={`w-2 h-2 rounded-full ${test.isDrawn ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                      <span className="text-[9px] text-slate-450 font-semibold">
                        {test.isDrawn ? 'تم سحب العينة الطبية وقبولها' : '🚨 بانتظار سحب العينات بالخارج'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 text-left font-mono block">
                    {test.createdAt instanceof Date 
                      ? test.createdAt.toLocaleString('ar-EG')
                      : new Date((test.createdAt as any)?.toDate?.() || test.createdAt).toLocaleString('ar-EG')
                    }
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Left Column: Test Result Editor (Span 7) */}
      <div className="lg:col-span-7">
        {selectedTest ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-6">
            
            {/* Header info */}
            <div className="border-b border-slate-50 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="text-right">
                <span className="text-xs text-indigo-600 font-bold block mb-1">تعبئة وإدخال النتائج المخبرية</span>
                <h2 className="text-lg font-bold text-slate-800">{selectedTest.type}</h2>
                <p className="text-xs text-slate-400 mt-0.5">للمريض: {getPatientName(selectedTest.patientId)}</p>
              </div>

              {/* Advanced Interfacing Trigger */}
              {selectedTest.status === 'pending' && (
                <button
                  onClick={simulateAnalyzerInterfacing}
                  disabled={isAnalyzerFetching}
                  className="bg-indigo-900 hover:bg-slate-900 border border-slate-700 text-slate-100 text-[10px] font-bold p-2 px-3 rounded-xl flex items-center gap-1.5 shadow transition-all"
                  title="سحب القراءة تلقائياً من جهاز التحليل الطبي المتصل بالشبكة المحلية"
                >
                  <Cpu className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  <span>{isAnalyzerFetching ? 'جاري السحب وفك التشفير...' : 'سحب القراءات تلقائياً عبر جهاز المختبر'}</span>
                </button>
              )}
            </div>

            {/* Simulated Analyzer message log */}
            {analyzerLogs.length > 0 && (
              <div className="bg-slate-950 p-3 rounded-xl font-mono text-[9px] text-slate-350 shadow-inner max-h-[140px] overflow-y-auto select-all" dir="ltr">
                <span className="text-indigo-400 font-black block mb-1">=== LAB DEVICE RS232 STREAM PARSER ===</span>
                {analyzerLogs.map((log, i) => (
                  <div key={i} className="whitespace-pre-wrap">{log}</div>
                ))}
              </div>
            )}

            {/* Dynamic fields mapping parameters */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-[10px] text-indigo-600 font-extrabold uppercase">AUTO-VERIFICATION COMPLIANT</span>
                <h3 className="text-xs font-bold text-slate-600">
                  البارامترات الطبية والمؤشرات / Diagnostics parameters
                </h3>
              </div>
              
              <div className="flex flex-col gap-4 max-h-[350px] overflow-y-auto pr-1">
                {Object.entries(selectedTest.parameters || {}).map(([key, value]: [string, any]) => {
                  const val = resultsForm[key] || '';
                  const numericVal = parseFloat(val);
                  const rules = BIOLOGICAL_RULES[key];
                  
                  let cellHighlight = "bg-slate-50 border-slate-100 text-slate-800";
                  let message = "";
                  
                  if (!isNaN(numericVal) && rules) {
                    if (numericVal < rules.minPanic || numericVal > rules.maxPanic) {
                      cellHighlight = "bg-rose-50 border-rose-200 text-rose-800 ring-2 ring-rose-500 animate-pulse";
                      message = "🚨 ذعر طبي (خطر!)";
                    } else if (numericVal < rules.minNormal) {
                      cellHighlight = "bg-blue-50 border-blue-200 text-blue-800 font-bold";
                      message = "📉 منخفض";
                    } else if (numericVal > rules.maxNormal) {
                      cellHighlight = "bg-amber-50 border-amber-200 text-amber-800 font-bold";
                      message = "📈 مرتفع";
                    } else {
                      cellHighlight = "bg-emerald-50 bg-opacity-40 border-emerald-100 text-emerald-800 font-bold";
                      message = "✓ طبيعي";
                    }
                  }

                  return (
                    <div key={key} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-center gap-3 transition-colors ${cellHighlight}`}>
                      <div className="text-right sm:text-left self-stretch sm:self-auto">
                        <span className="text-xs font-bold block" dir="ltr">{value.name}</span>
                        <span className="text-[10px] opacity-75 font-mono block mt-0.5">المدى الطبيعي المبرمج: {value.normal} {value.unit}</span>
                      </div>

                      <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
                        {message && (
                          <span className="text-[10px] font-extrabold tracking-tight shrink-0">{message}</span>
                        )}
                        <span className="text-xs font-bold opacity-60 font-mono leading-none">{value.unit}</span>
                        <input
                          type="text"
                          value={val}
                          disabled={selectedTest.status !== 'pending'}
                          onChange={e => handleInputChange(key, e.target.value)}
                          placeholder="N/A"
                          className="p-2 w-32 text-center text-sm font-extrabold border bg-white border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-800 font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedTest.status === 'pending' ? (
              <div className="flex flex-col gap-3 pt-4 border-t border-slate-50 mt-2">
                
                {/* Rules Engine Pre-check Live view */}
                <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-right">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">التقرير السريري من محرك القواعد (Live Validation Assessment):</span>
                  {(() => {
                    const report = verifyTestResults(selectedTest.parameters || {}, resultsForm);
                    return (
                      <div className="text-xs font-bold leading-normal">
                        <div>الحالة المبدئية: <span className={
                          report.overallStatus === 'critical' ? 'text-rose-600 animate-pulse' :
                          report.overallStatus === 'flagged' ? 'text-amber-600' : 'text-emerald-600'
                        }>{report.overallStatusAr}</span></div>
                        <p className="text-[9px] text-slate-400 font-medium mt-1">
                          * يتم تعبئة العهدة وخصم محاليل التحاليل تلقائياً من مخزن المواد الطبية بمجرد النشر.
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex justify-start gap-3 mt-1">
                  <button
                    onClick={() => handleSaveResults('completed')}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-5 rounded-lg flex items-center gap-1.5 shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد واعتماد القواعد المخبرية تلقائياً</span>
                  </button>
                  <button
                    onClick={() => handleSaveResults('cancelled')}
                    disabled={saving}
                    className="bg-rose-50 hover:bg-rose-105 text-rose-700 border border-rose-100 text-xs font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>إبطال الفحص ميكروبيا</span>
                  </button>
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="bg-slate-100 hover:bg-slate-205 text-slate-700 text-xs font-semibold py-2.5 px-4 rounded-lg"
                  >
                    رجوع
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-indigo-50 bg-opacity-30 text-indigo-900 rounded-xl text-xs leading-relaxed border mt-2 text-right">
                <div className="font-bold flex items-center gap-1.5 mb-1 justify-end">
                  <span>تم اعتماد النتيجة تلقائياً بمقاييس الجودة الدولية</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                {selectedTest.results?._verification && (
                  <div className="text-[10px] text-slate-500 font-semibold pr-4">
                    أكواد الفحص التلقائي: {selectedTest.results._verification.overallStatusAr} <br/>
                    تاريخ النشر الرقمي: {new Date(selectedTest.results._verification.verifiedAt).toLocaleString('ar-EG')}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-400">
            <Beaker className="w-12 h-12 mx-auto text-indigo-100 mb-3" />
            <h3 className="font-bold text-slate-700 mb-1 text-sm">حدد فحصاً للاعتماد والتحليل</h3>
            <p className="text-xs">اختر أحد التحاليل الطبية الطارئة بالجانب الأيمن للبدء بالعملية الحيوية وفحص قيم الذعر.</p>
          </div>
        )}
      </div>
    </div>
  );
}
