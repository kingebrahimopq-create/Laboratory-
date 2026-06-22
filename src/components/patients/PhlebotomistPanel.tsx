import React, { useState, useEffect } from 'react';
import { getAllTests, getAllPatients, updateDoc, doc, db, addAuditLog } from '../../lib/db';
import { Test, Patient } from '../../types';
import { auth as firebaseAuth } from '../../lib/firebase';
import { Beaker, Search, Check, AlertCircle, Printer, FileText, CheckCircle, Smartphone, Home, ShieldAlert, Cpu, Layers } from 'lucide-react';
import { getAllHomeVisits, updateHomeVisitStatus, HomeVisit } from '../../lib/homevisits';
import { getInventory, InventoryItem, autoDeductConsumables } from '../../lib/inventory';
import { pushNotification } from '../../lib/notifications';

export function PhlebotomistPanel({ refreshTrigger, onRefresh }: { refreshTrigger: boolean; onRefresh: () => void }) {
  const [tests, setTests] = useState<Test[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [homeVisits, setHomeVisits] = useState<HomeVisit[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  const [activeTab, setActiveTab] = useState<'clinic' | 'home'>('clinic');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<HomeVisit | null>(null);
  const [drawNotes, setDrawNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [barcodePrinted, setBarcodePrinted] = useState<string | null>(null);

  // ASTM/HL7 Interactive Interfacing Log state
  const [deviceLogs, setDeviceLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] LIS Broker: Listening on Port 3000 for analyzer handshakes...`,
    `[${new Date().toLocaleTimeString()}] LIS Broker: TCP Socket established successfully.`
  ]);

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allTests, allPatients, visits, stock] = await Promise.all([
        getAllTests(),
        getAllPatients(),
        getAllHomeVisits(),
        getInventory()
      ]);
      setTests(allTests);
      setPatients(allPatients);
      setHomeVisits(visits);
      setInventory(stock);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPatientByTest = (test: Test) => {
    return patients.find(p => p.id === test.patientId);
  };

  const filteredTests = tests.filter(t => {
    const p = getPatientByTest(t);
    const pName = p ? (p.nameAr + ' ' + p.phone) : '';
    const matchSearch = pName.toLowerCase().includes(searchTerm.toLowerCase()) || t.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const handlePrintBarcode = (testId: string, testType: string) => {
    setBarcodePrinted(testId);
    
    // Push analyzer ASTM log on barcode print (Advanced Bidirectional Interfacing description)
    const timestamp = new Date().toLocaleTimeString();
    const barcodeText = `*${testId.substring(0, 12).toUpperCase()}*`;
    const astmMsg = `H|\\^&|||Sysmex_XN_1000|||||||P|1|20260619\nO|1|${testId.substring(0,12)}||^^^${testType.substring(0,5).toUpperCase()}|||||||||||||||||||||`;
    
    setDeviceLogs(prev => [
      `[${timestamp}] ⎙ Barcode sticker printed for ${testType} with sequence ${barcodeText}`,
      `[${timestamp}] LIS -> Device Broadcast: Sending ASTM Specimen Order details...\n${astmMsg}`,
      ...prev
    ]);

    pushNotification({
      title: 'Barcode Label Generated',
      titleAr: '⎙ تم طباعة باركود العينة بنجاح',
      message: `Barcode for ${testType} label sequence ${testId}`,
      messageAr: `تم توليد تتابع الرموز الشريطي (Barcode) للفحص (${testType}) بالمعرف ${testId.substring(0, 10)}. يتم إلصاقه بالأنابيب.`,
      type: 'info'
    });

    setTimeout(() => {
      setBarcodePrinted(null);
    }, 3000);
  };

  const handleConfirmDraw = async () => {
    if (!selectedTest) return;
    setSaving(true);
    try {
      const currentUser = firebaseAuth.currentUser;
      const phlebName = currentUser?.displayName || currentUser?.email || 'أخصائي السحب';
      
      // Update the Firestore test document
      const testRef = doc(db, 'tests', selectedTest.id);
      await updateDoc(testRef, {
        isDrawn: true,
        drawnAt: new Date().toISOString(),
        drawnBy: phlebName,
        drawNotes: drawNotes,
        updatedAt: new Date().toISOString()
      } as any);

      // Create Audit Log
      await addAuditLog({
        userId: currentUser?.uid || 'unknown',
        username: currentUser?.email || 'unknown',
        action: 'سحب עينة مريض',
        details: `تم سحب عينة بنجاح للفحص (${selectedTest.type}) للمريض ذو الرقم المعرف ${selectedTest.patientId}`
      });

      // Execute auto-deduction of medical tubes and syringes! 
      await autoDeductConsumables(selectedTest.type, selectedTest.id, 'sampled');

      // Add to interfacing log
      const timestamp = new Date().toLocaleTimeString();
      setDeviceLogs(prev => [
        `[${timestamp}] LIS Specimen Event: Tube registered as drawn for ${selectedTest.type}`,
        `[${timestamp}] Stock Room: Decremented blood collection utensils automatically.`,
        ...prev
      ]);

      pushNotification({
        title: 'Specimen Collection Success',
        titleAr: '🧪 تم تأكيد سحب العينة والاستهلاك',
        message: `Sample drawn for ${selectedTest.type}`,
        messageAr: `تم تسجيل سحب العينة الطبية للفحص (${selectedTest.type}) وخصم مستلزمات الأنابيب والسرنجات من المخزون تلقائياً.`,
        type: 'success'
      });

      setSelectedTest(null);
      setDrawNotes('');
      onRefresh();
      loadData();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء حفظ حالة سحب العينة.');
    } finally {
      setSaving(false);
    }
  };

  const handleHomeVisitStatus = async (visit: HomeVisit, status: 'dispatched' | 'collected' | 'completed') => {
    try {
      const currentUser = firebaseAuth.currentUser;
      const phlebName = currentUser?.displayName || currentUser?.email || 'أخصائي السحب الميداني';
      await updateHomeVisitStatus(visit.id!, status, phlebName);
      
      if (status === 'completed') {
        // Upon home visit completion, also create the tests in patient records (if not generated)
        for (const testType of visit.testsReq) {
          await addAuditLog({
            userId: currentUser?.uid || 'unknown',
            username: currentUser?.email || 'unknown',
            action: 'إدراج عينة سحب منزلي',
            details: `تسلم عينات السحب المنزلي للمريض ${visit.patientNameAr} فحص ${testType}`
          });
        }
      }

      onRefresh();
      loadData();
      setSelectedVisit(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans" dir="rtl">
      
      {/* Tab Switcher */}
      <div className="lg:col-span-12 flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm max-w-md w-full">
        <button
          onClick={() => setActiveTab('clinic')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'clinic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Beaker className="w-4 h-4" />
          <span>طابور سحب المركز ({tests.filter(t => !t.isDrawn).length})</span>
        </button>
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'home' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>الزيارات المنزلية ({homeVisits.filter(v => v.status !== 'completed' && v.status !== 'cancelled').length})</span>
        </button>
      </div>

      {/* Right Column: Active queue list depending on tab (Span 6) */}
      <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {activeTab === 'clinic' ? (
          <>
            <div className="p-4 border-b border-slate-100 bg-slate-50 bg-opacity-70 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-right">
                <h3 className="font-extrabold text-slate-800 text-sm">قائمة انتظار سحب العينات (Clinic Queue)</h3>
                <p className="text-[10px] text-slate-400">فرز وتأكيد سحب عينات الفروع بالتزامن مع البارامترات</p>
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث مريض أو فحص..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full sm:w-48 placeholder-slate-400 font-semibold"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">جاري جلب الفحوصات وتحميل قائمة السحب...</div>
            ) : filteredTests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">لا توجد فحوصات مطابقة لخيارات البحث.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredTests.map(test => {
                  const p = getPatientByTest(test);
                  const isSelected = selectedTest?.id === test.id;
                  const isDrawn = test.isDrawn;

                  return (
                    <div
                      key={test.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50 ${
                        isSelected ? 'bg-indigo-50 bg-opacity-40 border-r-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-extrabold text-sm text-slate-800">{test.type}</span>
                          {isDrawn ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-0.5 rounded-full font-bold">
                              تم سحب العينة
                            </span>
                          ) : (
                            <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                              قيد الانتظار
                            </span>
                          )}
                        </div>
                        {p && (
                          <div className="text-xs text-slate-600 font-semibold flex flex-col gap-0.5">
                            <span>الاسم: {p.nameAr}</span>
                            <span className="text-[10px] text-slate-400 font-mono">الهاتف: {p.phone} | {p.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                          </div>
                        )}
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">ID: {test.id}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handlePrintBarcode(test.id, test.type)}
                          className="p-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                          title="طباعة الباركود للملصق"
                        >
                          <Printer className="w-4 h-4 text-indigo-600" />
                          {barcodePrinted === test.id ? 'تم الإرسال ⎙' : 'طباعة ملصق الباركود (Barcode)'}
                        </button>

                        {!isDrawn && (
                          <button
                            onClick={() => {
                              setSelectedTest(test);
                              setSelectedVisit(null);
                              setDrawNotes(test.drawNotes || '');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            سحب العينة
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Home visits panel */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 bg-opacity-70 font-sans">
              <h3 className="font-extrabold text-slate-800 text-sm">بوابة وجدولة الزيارات المنزلية (Home Visits)</h3>
              <p className="text-[10px] text-slate-400">تابع المرضى الغير قادرين على الحضور والتنسيق الميداني المباشر</p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">جاري تحميل الزيارات المنزلية...</div>
            ) : homeVisits.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">لا توجد مواعيد زيارة منزلية مجدولة حالياً.</div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {homeVisits.map(visit => {
                  const isSelected = selectedVisit?.id === visit.id;
                  const statusLabel = {
                    pending: { text: 'بانتظار الانطلاق', color: 'bg-amber-100 text-amber-800' },
                    dispatched: { text: 'بالطريق للمنزل 🏃‍♂️', color: 'bg-indigo-150 bg-indigo-50 text-indigo-700 animate-pulse' },
                    collected: { text: 'تم سحب العينات', color: 'bg-cyan-100 text-cyan-850' },
                    completed: { text: 'وصل وتأكد بالمعمل', color: 'bg-emerald-100 text-emerald-800' },
                    cancelled: { text: 'ملغية من الاستقبال', color: 'bg-rose-100 text-rose-800' }
                  }[visit.status];

                  return (
                    <div
                      key={visit.id}
                      className={`p-4 flex flex-col gap-3 transition-all hover:bg-slate-50 ${
                        isSelected ? 'bg-indigo-50 bg-opacity-40 border-r-4 border-indigo-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${statusLabel.color}`}>
                          {statusLabel.text}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">🏠 {visit.visitDate} | {visit.visitTime}</span>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold text-slate-800 text-xs">{visit.patientNameAr}</div>
                        <div className="text-[10px] text-slate-500 font-semibold">الهاتف: {visit.phone}</div>
                        <div className="text-[10px] text-slate-405 text-indigo-600 mt-1">📍 العنوان: {visit.address}</div>
                        
                        <div className="mt-2 flex flex-wrap gap-1">
                          {visit.testsReq.map((t, i) => (
                            <span key={i} className="bg-slate-100 text-slate-700 text-[9px] px-1.5 py-0.5 rounded font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end mt-1">
                        <button
                          onClick={() => {
                            setSelectedVisit(visit);
                            setSelectedTest(null);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3 py-1 rounded-lg"
                        >
                          إدارة المهمة بالخريطة
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Left Column: Diagnostics Workspace and Logs (Span 6) */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        
        {/* Workspace panel for selected test or visit */}
        {selectedTest ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-right">
            <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2 justify-end">
              <span>محطة سحب وتدقيق العينات</span>
              <Beaker className="w-5 h-5 text-indigo-600" />
            </h3>

            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">نوع الفحص:</span>
                  <span className="text-xs font-bold text-indigo-700">{selectedTest.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">اسم المريض:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {getPatientByTest(selectedTest)?.nameAr || 'غير متوفر'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">الرقم التعريفي الفريد:</span>
                  <span className="text-[10px] font-mono text-slate-500 block">{selectedTest.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">مطلوب الصيام:</span>
                  <span className="text-[10px] text-slate-800 font-semibold">
                    {selectedTest.type.includes('سكر') || selectedTest.type.includes('دهون') ? '✓ نعم صائم' : '✗ لا يشترط الصيام'}
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated barcode */}
            <div className="border border-dashed border-slate-200 rounded-xl p-4 mb-4 text-center bg-slate-50 bg-opacity-30">
              <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">معرف عينة الباركود الرقمي (Barcode Line-ID)</span>
              <div className="bg-white py-2.5 px-3 rounded-lg inline-flex flex-col items-center border border-slate-100 shadow-sm">
                <div className="w-48 h-10 flex gap-[2px] items-stretch mb-1">
                  {[1,3,1,2,3,1,2,1,4,1,3,2,1,2,1,3,1,4,2,1,2,1,3,1,2,3,1].map((w, idx) => (
                    <span key={idx} className="bg-slate-900" style={{ flexGrow: w }} />
                  ))}
                </div>
                <span className="font-mono text-[9px] font-bold text-slate-600">*{selectedTest.id.substring(0, 12).toUpperCase()}*</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-2">
                يتم استهلاك سرنجة سحب وأنبوبة دم EDTA أو Serum مخصصة وتخصم من الأرصدة تلقائياً بمجرد الاعتماد.
              </p>
            </div>

            <div className="mb-4 text-right">
              <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات حيوية عند عملية السحب:</label>
              <textarea
                value={drawNotes}
                onChange={(e) => setDrawNotes(e.target.value)}
                placeholder="مثال: تم سحب عينة دم وريدي، صيام المريض غير مطبق بشكل تام، إلخ."
                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-20 placeholder-slate-400"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmDraw}
                disabled={saving}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{saving ? 'جاري الحفظ...' : 'تأكيد عملية السحب بنجاح'}</span>
              </button>
              <button
                onClick={() => setSelectedTest(null)}
                className="bg-slate-100 hover:bg-slate-250 text-slate-755 font-semibold text-xs py-2.5 px-4 rounded-xl transition-all"
              >
                تراجع
              </button>
            </div>
          </div>
        ) : selectedVisit ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-right">
            <h3 className="font-extrabold text-slate-800 text-base mb-2 flex items-center gap-2 justify-end">
              <span>إدارة مهمة الزيارة الميدانية</span>
              <Home className="w-5 h-5 text-indigo-600" />
            </h3>
            <p className="text-xs text-slate-450 mb-4">📍 {selectedVisit.address}</p>

            <div className="p-4 bg-indigo-50 bg-opacity-35 border border-indigo-100 rounded-xl mb-4 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-indigo-800">بيانات التنسيق والتأمين الميداني:</span>
              <ul className="text-xs text-indigo-750 font-semibold list-disc list-inside flex flex-col gap-1 pr-1">
                <li>المستفيد: {selectedVisit.patientNameAr}</li>
                <li>رقم الجوال: {selectedVisit.phone}</li>
                <li>تاريخ الحجز المبرم: {selectedVisit.visitDate} في تمام {selectedVisit.visitTime}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-slate-700">تحديث مسار الزيارة بالخيار الفوري:</span>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleHomeVisitStatus(selectedVisit, 'dispatched')}
                  className="bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-800 text-[10px] font-bold py-2 px-1 rounded-xl transition-all"
                >
                  انطلاق 🚚
                </button>
                <button
                  onClick={() => handleHomeVisitStatus(selectedVisit, 'collected')}
                  className="bg-cyan-50 border border-cyan-200 hover:bg-cyan-100 text-cyan-800 text-[10px] font-bold py-2 px-1 rounded-xl transition-all"
                >
                  تم السحب حركياً 🧪
                </button>
                <button
                  onClick={() => handleHomeVisitStatus(selectedVisit, 'completed')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 px-1 rounded-xl transition-all shadow"
                >
                  تسليم المختبر ✓
                </button>
              </div>

              <button
                onClick={() => setSelectedVisit(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs font-semibold py-2 rounded-xl mt-2 transition-all"
              >
                إغلاق نافذة الزيارة
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center text-slate-400">
            <Smartphone className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-650">لوحة المتابعة الطبية</p>
            <p className="text-[10px]">حدد مريضاً أو زيارة لتسجيل الملاحظات وطباعة الباركود.</p>
          </div>
        )}

        {/* Live Lab Tube stock indicator */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-3">
            <span className="text-[10px] text-slate-400 font-mono">EDTA, Gel Serum, Syringes</span>
            <h4 className="font-extrabold text-slate-800 text-xs">مستلزمات السحب المتوفرة حالياً (Tube Room Status)</h4>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-right font-sans">
            {inventory.filter(item => item.category === 'tubes' || item.id === 'sterile_syringes').map(item => (
              <div key={item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl relative overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5 truncate">{item.nameAr}</span>
                <span className={`text-base font-black font-mono ${item.quantity <= item.minTarget ? 'text-rose-600' : 'text-slate-800'}`}>
                  {item.quantity} <span className="text-[10px] font-bold text-slate-400">{item.unitAr}</span>
                </span>
                
                {item.quantity <= item.minTarget && (
                  <span className="absolute left-1 bottom-1 bg-rose-100 text-rose-800 text-[8px] font-bold px-1 rounded animate-pulse">شحيح!</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* LIMS Broker Interfacing stream logs (ASTM/HL7 Protocol viewer) */}
        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-inner border border-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black">ASTM / HL7 LIMS BROKER LIVE</span>
            </div>
            <h4 className="font-bold text-xs text-slate-300">مراقب واجهة ربط أجهزة التحليل الطبية</h4>
          </div>

          <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1.5 text-left font-mono text-[9px] text-slate-350 pr-1 select-all" dir="ltr">
            {deviceLogs.map((log, i) => (
              <div key={i} className={`p-1.5 rounded transition-all whitespace-pre-wrap ${
                log.includes('Sysmex') ? 'bg-indigo-950 text-indigo-300' :
                log.includes('critical') ? 'bg-rose-950 text-rose-300 border-l-2 border-rose-500' :
                'bg-slate-850 hover:bg-slate-800'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
