import React, { useState, useEffect } from 'react';
import { 
  getAllPatients, 
  getAllTests, 
  addTest, 
  getAllExpenses, 
  addExpense, 
  getAllShiftClosings, 
  createShiftClosing, 
  addAuditLog, 
  updateDoc, 
  doc, 
  db,
  Expense,
  ShiftClosing
} from '../../lib/db';
import { Patient, Test } from '../../types';
import { 
  User, Search, Plus, Calendar, FileText, Activity, CreditCard, 
  UserPlus, Heart, Hash, Printer, Sparkles, DollarSign, FileCheck, 
  BadgeAlert, Home, MapPin, Phone, Award, ShieldCheck, Ticket
} from 'lucide-react';
import { AddPatientForm } from './AddPatientForm';
import { computeLoyaltyStatus, calculateRedemptionDiscount } from '../../lib/loyalty';
import { scheduleHomeVisit, getAllHomeVisits } from '../../lib/homevisits';
import { pushNotification } from '../../lib/notifications';

// Available tests list presets
const TEST_PRESETS = [
  { type: 'صورة دم كاملة / CBC Complete Blood Count', price: 150, params: {
    hemoglobin: { name: 'Hemoglobin (HGB)', normal: '13.8 - 17.2', unit: 'g/dL' },
    wbc: { name: 'White Blood Cells (WBC)', normal: '4.5 - 11.0', unit: '10^3/uL' },
    platelets: { name: 'Platelets', normal: '150 - 450', unit: '10^3/uL' }
  }},
  { type: 'وظائف كلى كاملة / Urea & Creatinine / Renal Panel', price: 200, params: {
    creatinine: { name: 'Creatinine', normal: '0.6 - 1.2', unit: 'mg/dL' },
    urea: { name: 'Blood Urea Nitrogen', normal: '7 - 20', unit: 'mg/dL' }
  }},
  { type: 'تحليل سكر تراكمي / HbA1c Glycated Hemoglobin', price: 180, params: {
    hba1c: { name: 'HbA1c', normal: '4.0 - 5.7', unit: '%' }
  }},
  { type: 'تحليل سكر صائم / Fasting Blood Sugar (FBS)', price: 80, params: {
    fbs: { name: 'Fasting Blood Sugar (FBS)', normal: '70 - 100', unit: 'mg/dL' }
  }},
  { type: 'الملف الكامل للدهون / Lipid Profile', price: 250, params: {
    cholesterol: { name: 'Total Cholesterol', normal: '100 - 200', unit: 'mg/dL' },
    triglycerides: { name: 'Triglycerides', normal: '50 - 150', unit: 'mg/dL' },
    ldl: { name: 'LDL Cholesterol', normal: '50 - 100', unit: 'mg/dL' },
    hdl: { name: 'HDL Cholesterol', normal: '40 - 70', unit: 'mg/dL' }
  }},
  { type: 'فحص هرمون الغدة الدرقية / Thyroid Panel (TSH / FT4)', price: 300, params: {
    tsh: { name: 'TSH (Thyroid Stimulating Hormone)', normal: '0.4 - 4.1', unit: 'uIU/mL' },
    ft4: { name: 'Free T4', normal: '0.9 - 1.7', unit: 'ng/dL' }
  }}
];

// Insurance partners configuration
const INSURANCE_PARTNERS = [
  { id: 'none', name: ' دفع شخصي / Cash Payment (No Insurance)', discount: 0 },
  { id: 'bupa', name: 'بوبا العربية للتأمين / Bupa Insurance', discount: 30 },
  { id: 'medgulf', name: 'ميدغلف الطبية / Medgulf', discount: 25 },
  { id: 'tauniya', name: 'التعاونية للتأمين / Tawuniya Union', discount: 45 },
  { id: 'custom', name: 'نقابة حيوية تابعة / Syndicate Contract', discount: 15 }
];

export function PatientWorkspace({ refreshTrigger, onRefresh }: { refreshTrigger: boolean; onRefresh: () => void }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shiftClosings, setShiftClosings] = useState<ShiftClosing[]>([]);
  const [homeVisits, setHomeVisits] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  
  // New Booking Modal state
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [selectedInsuranceId, setSelectedInsuranceId] = useState('none');
  const [approvalNumber, setApprovalNumber] = useState('');
  const [assigningTest, setAssigningTest] = useState(false);

  // Loyalty Program Redemption state
  const [redeemPointsChecked, setRedeemPointsChecked] = useState(false);
  const [pointsToRedeemInput, setPointsToRedeemInput] = useState(0);

  // Tabs
  const [activeTab, setActiveTab] = useState<'workspace' | 'expenses' | 'shift' | 'visits'>('workspace');

  // Daily Expenses Form state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('نثريات الاستقبال');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [recordingExpense, setRecordingExpense] = useState(false);

  // Safe and Shift Closing state
  const [initialCash, setInitialCash] = useState('1000');
  const [shiftNotes, setShiftNotes] = useState('');
  const [savingShift, setSavingShift] = useState(false);

  // Home Visit Scheduler state
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('10:00 AM');
  const [visitAddress, setVisitAddress] = useState('');
  const [visitPhone, setVisitPhone] = useState('');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitTestsSelected, setVisitTestsSelected] = useState<string[]>([]);
  const [schedulingVisit, setSchedulingVisit] = useState(false);

  // Active printable receipt invoice data
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  useEffect(() => {
    loadAllData();
  }, [refreshTrigger]);

  const loadAllData = async () => {
    try {
      const [allPatients, allTests, allExpenses, allClosings, allVisits] = await Promise.all([
        getAllPatients(),
        getAllTests(),
        getAllExpenses(),
        getAllShiftClosings(),
        getAllHomeVisits()
      ]);
      setPatients(allPatients);
      setTests(allTests);
      setExpenses(allExpenses);
      setShiftClosings(allClosings);
      setHomeVisits(allVisits);
    } catch (err) {
      console.error('Failed to load patient workspace stats:', err);
    }
  };

  const filteredPatients = patients.filter(p => {
    const text = (p.nameAr + ' ' + p.name + ' ' + p.phone + ' ' + p.phone).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  const getPatientTests = (patientId: string) => {
    return tests.filter(test => test.patientId === patientId);
  };

  // Compute stats of selected patient
  const patientLoyalty = selectedPatient 
    ? computeLoyaltyStatus(selectedPatient, getPatientTests(selectedPatient.id)) 
    : null;

  // Pricing calculations
  const chosenPreset = TEST_PRESETS[selectedPresetIndex];
  const chosenInsurance = INSURANCE_PARTNERS.find(item => item.id === selectedInsuranceId) || INSURANCE_PARTNERS[0];
  const originalPrice = chosenPreset ? chosenPreset.price : 0;
  
  // Calculate discount percentage
  const discountVal = Math.round((originalPrice * chosenInsurance.discount) / 100);
  
  // Calculate Loyalty deduction discount
  const loyaltyPointsRedeemable = redeemPointsChecked && patientLoyalty ? Math.min(patientLoyalty.currentPoints, 200) : 0;
  const loyaltyDiscount = calculateRedemptionDiscount(loyaltyPointsRedeemable);
  
  const finalPrice = Math.max(0, originalPrice - discountVal - loyaltyDiscount);

  // Booking the test with database loyalty offset!
  const handleAssignTest = async () => {
    if (!selectedPatient || !chosenPreset) return;
    setAssigningTest(true);
    try {
      const dbTestPayload = {
        patientId: selectedPatient.id,
        type: chosenPreset.type,
        parameters: chosenPreset.params,
        price: originalPrice,
        discountApplied: discountVal + loyaltyDiscount,
        amountCollected: finalPrice,
        insuranceProvider: chosenInsurance.name,
        insuranceApprovalNumber: approvalNumber || undefined,
        status: 'pending' as const,
        isDrawn: false,
        results: null,
        createdAt: new Date()
      };

      const generatedId = await addTest(dbTestPayload as any);

      // Decrement the redeemed points from Patient record
      if (loyaltyPointsRedeemable > 0) {
        const spentHistoryPoints = (selectedPatient as any).spentLoyaltyPoints || 0;
        const patientRef = doc(db, 'patients', selectedPatient.id);
        await updateDoc(patientRef, {
          spentLoyaltyPoints: spentHistoryPoints + loyaltyPointsRedeemable
        });
      }

      await addAuditLog({
        userId: 'reception_staff',
        username: 'معقب الاستقبال',
        action: 'حجز فحص مالي وتأمين',
        details: `تسجيل باقة (${chosenPreset.type}) للمريض ${selectedPatient.nameAr} بقيمة مقبوضة ${finalPrice} ج.م`
      });

      // Show printable thermal invoice block
      setActiveInvoice({
        id: generatedId,
        patientNameAr: selectedPatient.nameAr,
        patientPhone: selectedPatient.phone,
        testType: chosenPreset.type,
        originalPrice,
        discountVal: discountVal + loyaltyDiscount,
        finalPrice,
        paymentType: chosenInsurance.name,
        appNum: approvalNumber || 'N/A',
        timestamp: new Date().toLocaleString('ar-EG')
      });

      pushNotification({
        title: 'Diagnostic Test Issued',
        titleAr: '💳 تم حجز الفحص وإصدار سند القبض',
        message: `Registered test ${chosenPreset.type} with price ${finalPrice}`,
        messageAr: `تم حجز الفحص (${chosenPreset.type}) للمريض ذو الملف بنجاح. قيمة سند القبض المعتمد هى (${finalPrice} ج.م)`,
        type: 'success'
      });

      setShowAddTestModal(false);
      setRedeemPointsChecked(false);
      setApprovalNumber('');
      onRefresh();
      loadAllData();
    } catch (err) {
      console.error(err);
      alert('فشل حجز الفحص مخبرياً / Failed to book lab test.');
    } finally {
      setAssigningTest(false);
    }
  };

  // Submit Home Visit directly
  const handleScheduleHomeVisitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) {
      alert('يرجى تحديد مريض لجدولة الزيارة!');
      return;
    }
    if (visitTestsSelected.length === 0) {
      alert('يرجى اختيار فحص طبي واحد على الأقل للزيارة!');
      return;
    }
    if (!visitAddress) {
      alert('يرجى توفير وتحديد عنوان السحب المنزلي!');
      return;
    }

    setSchedulingVisit(true);
    try {
      await scheduleHomeVisit({
        patientId: selectedPatient.id,
        patientNameAr: selectedPatient.nameAr,
        phone: visitPhone || selectedPatient.phone,
        address: visitAddress,
        visitDate,
        visitTime,
        testsReq: visitTestsSelected,
        notes: visitNotes || undefined
      });

      setVisitAddress('');
      setVisitNotes('');
      setVisitTestsSelected([]);
      onRefresh();
      loadAllData();
      setActiveTab('visits');
    } catch (e) {
      console.error(e);
    } finally {
      setSchedulingVisit(false);
    }
  };

  // Daily Expenses Calculation
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecordingExpense(true);
    try {
      if (!expenseAmount || !expenseDescription) {
        throw new Error('الرجاء تعبئة بيانات المصروف اليومي');
      }

      await addExpense({
        amount: Number(expenseAmount),
        category: expenseCategory,
        description: expenseDescription,
        recordedBy: 'reception_staff'
      });

      await addAuditLog({
        userId: 'reception_staff',
        username: 'أمين الخزينة',
        action: 'تسجيل مصروف نثري',
        details: `خصم (${expenseAmount} ج.م) تحت بند ${expenseCategory} - ${expenseDescription}`
      });

      pushNotification({
        title: 'Petty Expense Recorded',
        titleAr: '💸 تم خصم وتسجيل مصروف نثري',
        message: `Amount ${expenseAmount} deducted for ${expenseCategory}`,
        messageAr: `تم تسجيل الصرف المالي بقيمة (${expenseAmount} ج.م) لدرج الاستقبال تحت البند المالي المختار.`,
        type: 'warning'
      });

      setExpenseAmount('');
      setExpenseDescription('');
      onRefresh();
      loadAllData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRecordingExpense(false);
    }
  };

  // Shift calculation helpers
  const shiftIncome = tests.reduce((sum, test) => sum + (Number(test.amountCollected) || 0), 0);
  const totalExpenseSum = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const calculatedNetSafe = Number(initialCash) + shiftIncome - totalExpenseSum;

  const handleCloseShift = async () => {
    setSavingShift(true);
    try {
      const shiftPayload = {
        date: new Date().toLocaleDateString('ar-EG'),
        recordedBy: 'reception_staff',
        initialCash: Number(initialCash),
        totalCollected: shiftIncome,
        totalExpenses: totalExpenseSum,
        netAmount: calculatedNetSafe,
        notes: shiftNotes || 'لا توجد ملاحظات على العهدة اليومية'
      };

      await createShiftClosing(shiftPayload);

      await addAuditLog({
        userId: 'reception_manager',
        username: 'مدير الصندوق والوردية',
        action: 'إغلاق الوردية وتسليم النقدية',
        details: `تقفيل الوردية بإجمالي عهدة صافية ${calculatedNetSafe} ج.م`
      });

      pushNotification({
        title: 'Safe Handover Completed',
        titleAr: '🔒 تم إغلاق الوردية والدرج المالي',
        message: `Safe net amount ${calculatedNetSafe} passed to supervisor`,
        messageAr: `تم إغلاق الوردية بنجاح وتسوية الأرصدة النقدية وتصدير عهدة قيمتها (${calculatedNetSafe} ج.م) للمشرف المالي.`,
        type: 'success'
      });

      setShiftNotes('');
      onRefresh();
      loadAllData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingShift(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right font-sans" dir="rtl">
      
      {/* 4 Multi-tab layout */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm max-w-xl self-start w-full gap-1">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'workspace' ? 'bg-indigo-600 text-white shadow font-extrabold' : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-500" />
          <span>المرضى والمالية ({filteredPatients.length})</span>
        </button>
        
        <button
          onClick={() => { setActiveTab('visits'); if(selectedPatient) { setVisitPhone(selectedPatient.phone); } }}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'visits' ? 'bg-indigo-600 text-white shadow font-extrabold' : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <Home className="w-4 h-4 text-amber-500" />
          <span>حجز منزلي 🏠 ({homeVisits.filter(v=>v.status !== 'completed').length})</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'expenses' ? 'bg-indigo-600 text-white shadow font-extrabold' : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <DollarSign className="w-4 h-4 text-rose-500" />
          <span>المنصرف اليومي</span>
        </button>

        <button
          onClick={() => setActiveTab('shift')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'shift' ? 'bg-indigo-600 text-white shadow font-extrabold' : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <FileCheck className="w-4 h-4 text-indigo-500" />
          <span>تقفيل الصندوق</span>
        </button>
      </div>

      {/* PRINTABLE THERMAL INVOICE OVERLAY POPUP */}
      {activeInvoice && (
        <div className="bg-slate-50 border-2 border-indigo-200 rounded-2xl p-5 mb-4 shadow text-slate-800 flex flex-col gap-3 font-mono text-xs w-full max-w-md mx-auto text-center border-dashed">
          <div className="border-b border-dashed border-slate-300 pb-3">
            <h4 className="font-extrabold text-slate-900 text-sm">سند قبض مخبري معتمد (thermal print ready)</h4>
            <span className="text-[10px] text-slate-500">ID: {activeInvoice.id.toUpperCase()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-right">
            <div><strong>المريض:</strong> {activeInvoice.patientNameAr}</div>
            <div><strong>رقم الجوال:</strong> {activeInvoice.patientPhone}</div>
            <div className="col-span-2"><strong>الفحص المبرم:</strong> {activeInvoice.testType}</div>
            <div><strong>طريقة السداد:</strong> {activeInvoice.paymentType}</div>
            <div><strong>التاريخ والوقت:</strong> {activeInvoice.timestamp}</div>
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 flex justify-between font-bold text-slate-900 text-sm">
            <span>{activeInvoice.finalPrice} ج.م</span>
            <span>الصافي المقبوض:</span>
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={() => {
                window.print();
              }}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-bold"
            >
              طباعة الإيصال ⎙
            </button>
            <button
              onClick={() => setActiveInvoice(null)}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 py-1.5 rounded-lg text-xs font-semibold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* --- TAB 1: WORKSPACE --- */}
      {activeTab === 'workspace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Patients Directory (Span 4) */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex flex-col gap-4">
            
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <button
                onClick={() => setShowAddPatientForm(!showAddPatientForm)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-xl transition-colors"
                title="تسجيل مريض جديد"
              >
                {showAddPatientForm ? <Plus className="w-4 h-4 transform rotate-45 transition-transform" /> : <UserPlus className="w-4 h-4" />}
              </button>
              
              <div className="text-right">
                <h3 className="font-bold text-slate-800 text-sm">سجل المرضى</h3>
                <p className="text-[10px] text-slate-400">ابحث أو أضف مستفيض لإنشاء الفاتورة</p>
              </div>
            </div>

            {showAddPatientForm ? (
              <AddPatientForm 
                onAdded={setShowAddFormAndNotify}
                onCancel={() => setShowAddPatientForm(false)}
              />
            ) : (
              <>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم المريض أو رقم الهاتف..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 pl-9 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto divide-y divide-slate-100">
                  {filteredPatients.length === 0 ? (
                    <div className="p-8 text-center text-slate-450 text-xs">
                      لا يوجد أي مريض مطابق. انقر الزر العلوي لتسجيل مريض جديد.
                    </div>
                  ) : (
                    filteredPatients.map(patient => {
                      const isSelected = selectedPatient?.id === patient.id;
                      return (
                        <button
                          key={patient.id}
                          onClick={() => setSelectedPatient(patient)}
                          className={`w-full p-3 flex justify-between items-center hover:bg-slate-50 rounded-xl text-right transition-colors ${
                            isSelected ? 'bg-indigo-50 border-r-4 border-indigo-600 bg-opacity-40' : ''
                          }`}
                        >
                          <div className="text-left">
                            <span className="text-[10px] font-mono text-slate-400">{patient.phone}</span>
                          </div>

                          <div>
                            <span className="font-bold text-slate-800 text-xs block">{patient.nameAr}</span>
                            <span className="text-[10px] text-slate-450">{patient.gender === 'male' ? 'ذكر' : 'أنثى'} | {new Date(patient.dob).toLocaleDateString()}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Selected Patient Workspace billing (Span 8) */}
          <div className="lg:col-span-8">
            {selectedPatient ? (
              <div className="flex flex-col gap-6">
                
                {/* Patient Profile Card & LOYALTY STATUS */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
                  
                  {/* Membership Tier badge absolute */}
                  {patientLoyalty && (
                    <div className={`absolute left-4 top-4 px-3 py-1 rounded-xl text-[10px] font-black border bg-gradient-to-r shadow-sm ${patientLoyalty.tierColor}`}>
                      {patientLoyalty.tierAr}
                    </div>
                  )}

                  <h3 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2 justify-end">
                    <span>الملف الطبي والمالي الموحد</span>
                    <User className="w-5 h-5 text-indigo-600" />
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">الاسم بالعربي:</span>
                      <span className="text-xs font-bold text-slate-700">{selectedPatient.nameAr}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">Patient Name:</span>
                      <span className="text-xs font-semibold text-slate-500 font-mono" dir="ltr">{selectedPatient.name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">رقم الجوال:</span>
                      <span className="text-xs font-bold text-slate-705 font-mono">{selectedPatient.phone}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">الملف التعريفي:</span>
                      <span className="text-[10px] text-slate-400 font-mono">{selectedPatient.id}</span>
                    </div>
                  </div>

                  {/* Loyalty Points Panel inside Reception */}
                  {patientLoyalty && (
                    <div className="border border-indigo-100 bg-indigo-50 bg-opacity-35 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="text-right flex-1">
                        <div className="flex items-center gap-1.5 justify-end sm:justify-start">
                          <span className="bg-indigo-600 text-white rounded-full p-0.5"><Award className="w-3.5 h-3.5" /></span>
                          <span className="text-xs font-extrabold text-indigo-950">نظام نقاط ولاء المرضى (Accumulated Rewards)</span>
                        </div>
                        <p className="text-[10px] text-indigo-750 font-semibold mt-1">
                          مستوى العيادة: {patientLoyalty.benefitsAr}
                        </p>
                      </div>

                      <div className="flex gap-4 items-center">
                        <div className="text-center bg-white p-2 px-3.5 rounded-lg border border-indigo-105 shadow-sm">
                          <span className="text-[9px] text-slate-400 font-bold block">النقاط الحالية</span>
                          <span className="text-sm font-black text-indigo-700 font-mono">{patientLoyalty.currentPoints} pt</span>
                        </div>
                        <div className="text-center bg-white p-2 px-3.5 rounded-lg border border-indigo-105 shadow-sm">
                          <span className="text-[9px] text-slate-400 font-bold block">إجمالي التعامل المالي</span>
                          <span className="text-sm font-black text-slate-800 font-mono">{patientLoyalty.totalSpent} ج.م</span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Patient Active and past tests */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50">
                    <button
                      onClick={() => setShowAddTestModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>حجز فحص مخبري وطبي</span>
                    </button>

                    <h3 className="font-extrabold text-slate-800 text-sm">الفحوصات الطبية المدرجة لملف المريض Selected Tests</h3>
                  </div>

                  {getPatientTests(selectedPatient.id).length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-xs">
                      لا يوجد أي تحاليل مسجلة لهذا الملف حالياً.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {getPatientTests(selectedPatient.id).map(test => {
                        const isVerified = test.status === 'completed';
                        
                        return (
                          <div key={test.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-all">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                                test.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 
                                test.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-100 animate-pulse' : 
                                'bg-rose-50 text-rose-800 border-rose-100'
                              }`}>
                                {test.status === 'completed' ? 'معتمد ومثبت طِبّياً ✓' : test.status === 'pending' ? 'جاري التحليل بالمعمل...' : 'ملغي / تالف'}
                              </span>

                              <div className="text-right">
                                <h4 className="font-extrabold text-slate-800 text-xs leading-normal">{test.type}</h4>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  رقم التتبع: ID-{test.id.substring(0,8).toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Ticket Details summary */}
                            <div className="bg-slate-50 rounded-lg p-2.5 mt-2 text-[10px] text-slate-500 grid grid-cols-2 gap-2 text-right">
                              <div><strong>الجهة الضامنة:</strong> {test.insuranceProvider || 'دفع شخصي (كاش)'}</div>
                              {test.insuranceApprovalNumber && (
                                <div><strong>كود الموافقة:</strong> <span className="font-mono">{test.insuranceApprovalNumber}</span></div>
                              )}
                              <div><strong>السعر المقبوض:</strong> {test.amountCollected !== undefined ? `${test.amountCollected} ج.م` : 'غير محدد'}</div>
                              <div><strong>حالة استلام العينة:</strong> {test.isDrawn ? '✓ سُحبت العينة معملياً' : '✗ في انتظار أخصائي السحب'}</div>
                            </div>

                            {/* Print certified result only if medically verified */}
                            {isVerified ? (
                              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-[10px] text-emerald-700 font-semibold">✓ النتيجة معتمدة وجاهزة للتسليم للعميل</span>
                                <button
                                  onClick={() => {
                                    alert(`--- طباعة تقرير مالي وطبي معتمد ---\nالمريض: ${selectedPatient.nameAr}\nالفحص: ${test.type}\nمصدق ومثبت من المشرف الاستشاري للمختبر.`);
                                  }}
                                  className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-[10px] py-1 px-3 rounded-lg transition-all flex items-center gap-1"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>طباعة وتصدير النتيجة للاستلام</span>
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2.5 text-[9px] text-amber-700 italic font-semibold">
                                * لا يمكن طباعة التقرير الفني للعميل؛ العينة تحت مطابقة المعايير الطبية والتحليل الفني الآن.
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 shadow-sm text-center text-slate-400">
                <Heart className="w-12 h-12 mx-auto text-indigo-150 mb-3 animate-pulse" />
                <h3 className="font-bold text-slate-700 mb-1 text-sm">حدد ملف مريض للبدء والمحاسبة</h3>
                <p className="text-xs">يرجى الضغط على ملف أحد المرضى باليمين لتسجيل الحجوزات ونظام نقاط الولاء الفورية.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 2: DAILY EXPENSES & PETTY CASH --- */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Form to record Expense */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4">تسجيل مصروف مالي يومي (Petty Cash)</h3>
            
            <form onSubmit={handleRecordExpense} className="flex flex-col gap-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">المبلغ المصروف بالجنيه المصري (EGP) *</label>
                <input
                  type="number"
                  placeholder="مثال: 50"
                  required
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">تصنيف وبند المصروف *</label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  <option value="نثريات الاستقبال">نثريات الاستقبال والضيافة</option>
                  <option value="شراء مستلزمات طبية عاجلة">شراء مستلزمات طبية عاجلة</option>
                  <option value="فاتورة (كهرباء/إنترنت/مياه)">فاتورة (كهرباء / إنترنت / مياه)</option>
                  <option value="صيانة أجهزة أو سباكة">صيانة أجهزة أو مرافق</option>
                  <option value="أخرى / مصاريف تشغيل">مصاريف عامة أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1">وصف وتفاصيل المصروف المعينة *</label>
                <textarea
                  placeholder="اكتب الغرض التفصيلي للمصروف المالي لخصمه من القاصة..."
                  required
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={recordingExpense}
                className="bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <DollarSign className="w-4 h-4" />
                <span>{recordingExpense ? 'جاري التقييد والخصم...' : 'تقييد وخصم المصروف من درج النقدية'}</span>
              </button>
            </form>
          </div>

          {/* List of expenses */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-50 pb-2">سجل حركة الخروج والعهدة المالية (Petty Cash Book)</h3>
            
            {expenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا توجد مصروفات نثرية تالفة أو مسجلة لليوم.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {expenses.map((exp, idx) => (
                  <div key={exp.id || idx} className="py-3 flex justify-between items-center text-right">
                    <div className="text-left">
                      <span className="text-xs font-extrabold text-rose-600">-{exp.amount} ج.م</span>
                      <span className="text-[9px] text-slate-400 block mt-1 font-mono">
                        {exp.createdAt?.toDate ? exp.createdAt.toDate().toLocaleTimeString('ar-EG') : new Date().toLocaleTimeString('ar-EG')}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-800">{exp.description}</div>
                      <div className="text-[10px] text-indigo-600 font-semibold">{exp.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 3: SHIFT CLOSING & SAFE HANDOVER --- */}
      {activeTab === 'shift' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Shift Closing Action panel */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-105 shadow-sm p-6">
            <h3 className="font-extrabold text-indigo-900 text-sm mb-4 flex items-center gap-1.5 justify-end">
              <span>تجميع وتقفيل تداولات الوردية الحالية</span>
              <FileCheck className="w-5 h-5" />
            </h3>

            {/* Calculations widget */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-right text-xs mb-6 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="font-bold text-slate-800 font-mono">{initialCash} ج.م</span>
                <span className="text-slate-500">مبلغ العهدة الافتتاحي في درج النقدية:</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="font-bold text-emerald-600 font-mono">+{shiftIncome} ج.م</span>
                <span className="text-slate-500">إجمالي مقبوضات مبيعات الفحوصات الطبية:</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
                <span className="font-bold text-rose-600 font-mono">-{totalExpenseSum} ج.م</span>
                <span className="text-slate-500 border-rose-100">إجمالي المصروفات النثرية المخصومة:</span>
              </div>
              <div className="flex justify-between items-center pt-2 text-sm font-extrabold text-indigo-950">
                <span className="font-mono bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                  {calculatedNetSafe} ج.م
                </span>
                <span>الصافي الفعلي المطلوب تسليمه للخزنة:</span>
              </div>
            </div>

            <div className="mb-4 text-right">
              <label className="block text-xs font-bold text-slate-705 mb-1">رأس مال الدرج الافتتاحي (للوردية التالية):</label>
              <input
                type="number"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>

            <div className="mb-4 text-right">
              <label className="block text-xs font-bold text-slate-705 mb-1">ملاحظات تسليم القاصة والوردية:</label>
              <textarea
                placeholder="اكتب أي ملاحظات تخص وجود عجز، زيادة، أو تفاصيل تسليم عهدة والنظارات والتحاليل للمشرف..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 placeholder-slate-400"
              />
            </div>

            <button
              onClick={handleCloseShift}
              disabled={savingShift}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>{savingShift ? 'جاري قيد إقفال الصندوق...' : '✓ تأكيد تقفيل الوردية مالياً وإرسال العهدة'}</span>
            </button>
          </div>

          {/* Historical Shifts log */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-50 pb-2">سجلات إقفال الصناديق السابقة (Historic Safe Closures)</h3>
            
            {shiftClosings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا توجد تقفيلات وردية سابقة في النظام السحابي.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {shiftClosings.map((shift, idx) => (
                  <div key={shift.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right text-xs">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                      <span className="font-bold text-indigo-600">{shift.date}</span>
                      <strong className="text-slate-800">قيد رقم: #{shift.id?.substring(0,6).toUpperCase()}</strong>
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 mt-1 gap-2 text-slate-500">
                      <div>إجمالي المقبوضات: <strong>{shift.totalCollected} ج.م</strong></div>
                      <div>المنصرف اليومي: <strong>{shift.totalExpenses} ج.م</strong></div>
                      <div className="col-span-2 pt-1 font-bold text-slate-850">المسلم المطابق: {shift.netAmount} ج.م</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 4: HOME VISIT SCHEDULER (بوابة ومسارات الزيارات الطبية) --- */}
      {activeTab === 'visits' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Scheduling Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-1 flex items-center gap-1.5 justify-end">
              <span>جدولة طلب زيارة منزلية جديدة</span>
              <Home className="w-5 h-5 text-indigo-600" />
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">احجز موعد سحب عينات منزلي لملف المريض النشط</p>

            {selectedPatient ? (
              <form onSubmit={handleScheduleHomeVisitSubmit} className="flex flex-col gap-4 text-right text-xs font-semibold">
                
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">اسم المستفيد:</span>
                  <span className="font-extrabold text-slate-800">{selectedPatient.nameAr}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5">تاريخ الزيارة المطلوبة *</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={e => setVisitDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-1.5">وقت وتوقيت الزيارة *</label>
                    <select
                      value={visitTime}
                      onChange={e => setVisitTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="08:00 AM">08:00 AM - الصباح الباكر</option>
                      <option value="10:00 AM">10:00 AM - الضحى</option>
                      <option value="12:00 PM">12:00 PM - الظهر</option>
                      <option value="03:00 PM">03:00 PM - العصر</option>
                      <option value="06:00 PM">06:00 PM - المساء</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5">العنوان الجغرافي والتفصيلي التام *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: الرياض - الملقا - شارع خالد بن الوليد - شقة 5"
                    value={visitAddress}
                    onChange={e => setVisitAddress(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-right"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5">رقم الاتصال الميداني (اختياري)</label>
                  <input
                    type="tel"
                    placeholder={selectedPatient.phone}
                    value={visitPhone}
                    onChange={e => setVisitPhone(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>

                {/* Multiselect tests */}
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5">حدد الفحوصات الطبية المطلوبة للزيارة *</label>
                  <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto bg-slate-50 p-2 rounded-xl border border-slate-100">
                    {TEST_PRESETS.map((t, idx) => {
                      const isChecked = visitTestsSelected.includes(t.type);
                      return (
                        <label key={idx} className="flex items-center gap-2 justify-start cursor-pointer hover:bg-slate-100 p-1 rounded font-semibold text-[11px]">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setVisitTestsSelected(prev => [...prev, t.type]);
                              } else {
                                setVisitTestsSelected(prev => prev.filter(x => x !== t.type));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{t.type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1.5">تعليمات أو ملاحظات خاصة على المريض</label>
                  <textarea
                    placeholder="مثال: المريض كبير السن، كفيف، يرجى التمهل عند الطرق..."
                    value={visitNotes}
                    onChange={e => setVisitNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 h-16"
                  />
                </div>

                <button
                  type="submit"
                  disabled={schedulingVisit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{schedulingVisit ? 'جاري التسجيل...' : '✓ جدولة وتسجيل طلب الزيارة الطبية'}</span>
                </button>

              </form>
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-450 text-xs">
                يرجى اختيار مريض من "سجل المرضى" أولاً لجدولة الزيارة السريرية الميدانية.
              </div>
            )}
          </div>

          {/* Home visits overview list */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-50 pb-2">جدول الرحلات والزيارات الميدانية النشطة (Visits Pipeline)</h3>
            
            {homeVisits.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا توجد هناك أي زيارات برعاية منزلية مجدولة حالياً.
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto">
                {homeVisits.map((v, i) => {
                  const statusColors = {
                    pending: 'bg-amber-50 text-amber-800 border-amber-200',
                    dispatched: 'bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse',
                    collected: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                    completed: 'bg-emerald-50 text-emerald-850 border-emerald-200',
                    cancelled: 'bg-rose-50 text-rose-800 border-rose-200'
                  }[v.status as string] || 'bg-slate-50 text-slate-800';

                  return (
                    <div key={v.id || i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 bg-opacity-70 text-right flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${statusColors}`}>
                          {v.status === 'pending' ? 'مجدول تحت الانتظار' : v.status === 'dispatched' ? 'جاري الانتقال 🏃‍♂️' : v.status === 'collected' ? 'تم الفصد والسحب عيناً' : v.status === 'completed' ? 'تم التسليم للمختبر' : 'ملغي'}
                        </span>
                        <span className="text-[10px] text-indigo-705 font-semibold font-mono">📅 {v.visitDate} | {v.visitTime}</span>
                      </div>

                      <div>
                        <strong className="text-slate-850 text-xs text-indigo-800">{v.patientNameAr}</strong>
                        <div className="text-[10px] text-slate-400 mt-0.5">العنوان: {v.address}</div>
                        
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {v.testsReq?.map((t: string, j: number) => (
                            <span key={j} className="bg-white text-slate-650 text-[9px] px-1.5 py-0.5 rounded font-extrabold border">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- BOOKING NEW TEST MODAL WITH INSURANCE AND LOYALTY --- */}
      {showAddTestModal && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden text-right" dir="rtl">
            <div className="bg-indigo-950 text-white p-5">
              <h3 className="font-extrabold text-base">تسجيل وحجز فحص مخبري ومحاسبة</h3>
              <p className="text-xs text-slate-300 mt-1">المريض ذو الملف: {selectedPatient.nameAr} | هاتف: {selectedPatient.phone}</p>
            </div>

            <div className="p-6 flex flex-col gap-4 max-h-[500px] overflow-y-auto">
              
              {/* Select preset */}
              <div>
                <label className="text-xs font-bold text-slate-705 block mb-1.5">اختر نوع الفحص المطلوب:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TEST_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPresetIndex(idx)}
                      className={`p-3 rounded-lg border text-right text-xs transition-all flex flex-col gap-1 ${
                        selectedPresetIndex === idx 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-sm' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="font-bold">{preset.type}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold font-mono">السعر: {preset.price} ج.م</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Loyalty Discount Option */}
              {patientLoyalty && patientLoyalty.currentPoints > 0 && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between gap-3 text-xs text-amber-900 font-extrabold transition-all">
                  <div className="text-right">
                    <span>استعمال رصيد النقاط مالي؟ ({patientLoyalty.currentPoints} نقطة متاحة)</span>
                    <p className="text-[10px] text-amber-705 font-medium">كل 10 نقاط تمنح 5 ج.م خصم إضافي للملف</p>
                  </div>

                  <input
                    type="checkbox"
                    checked={redeemPointsChecked}
                    onChange={(e) => setRedeemPointsChecked(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Select insurance / union */}
              <div>
                <label className="text-xs font-bold text-slate-705 block mb-1.5">الجهة الضامنة / الجهات المتعاقدة والممثلة:</label>
                <select
                  value={selectedInsuranceId}
                  onChange={(e) => {
                    setSelectedInsuranceId(e.target.value);
                    if (e.target.value === 'none') setApprovalNumber('');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                >
                  {INSURANCE_PARTNERS.map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>

              {/* If insurance has discount or is not personal, show clinical approval number prompt */}
              {selectedInsuranceId !== 'none' && (
                <div className="transition-all duration-300">
                  <label className="block text-xs font-bold text-slate-705 mb-1">رقم الموافقة الطبية الرسمية (Medical Approval No.) *</label>
                  <input
                    type="text"
                    required
                    placeholder="امثلة: APP-90432-XYZ"
                    value={approvalNumber}
                    onChange={(e) => setApprovalNumber(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold text-slate-800"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">يجب إدخال كود موافقة شركة التأمين ومراجعته للمطالبة الشهرية بالفاتورة.</p>
                </div>
              )}

              {/* Pricing breakdown summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-right flex flex-col gap-2 mt-2">
                <div className="flex justify-between">
                  <strong>{originalPrice} ج.م</strong>
                  <span className="text-slate-500">السعر الأصلي للفحص:</span>
                </div>
                
                {chosenInsurance.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <strong>-{discountVal} ج.م (%{chosenInsurance.discount})</strong>
                    <span>خصم الجهة الضامنة:</span>
                  </div>
                )}

                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between text-amber-600 font-extrabold animate-pulse">
                    <strong>-{loyaltyDiscount} ج.م (خصم {loyaltyPointsRedeemable} نقطة)</strong>
                    <span>خصم الولاء والمكافآت المطبق:</span>
                  </div>
                )}

                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-indigo-950 text-sm">
                  <strong>{finalPrice} ج.م</strong>
                  <span>السعر الإجمالي الصافي المطلوب دفعه:</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-start gap-2 mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  disabled={assigningTest}
                  onClick={handleAssignTest}
                  className="bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl shadow disabled:bg-slate-300 cursor-pointer"
                >
                  {assigningTest ? 'جاري حجز الفحص مالي مستندي...' : 'تأكيد وحفظ الطلب وطباعة الإيصال'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl"
                >
                  إلغاء الحجز
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );

  function setShowAddFormAndNotify() {
    setShowAddPatientForm(false);
    onRefresh();
    loadAllData();
  }
}
