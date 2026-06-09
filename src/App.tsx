import React, { useState, useEffect } from 'react';
import { Patient, LabTest, Appointment, UserRole, DoctorSettings } from './types';
import { INITIAL_PATIENTS, INITIAL_APPOINTMENTS, INITIAL_TESTS } from './data';
import { ClinicalDatabase } from './db/storage';
import { 
  Building2, Laptop, Network, Clock, ShieldCheck, Smartphone, Cpu, Activity,
  UserPlus, User, ClipboardList, Database, Receipt,
  ArrowRightLeft, AlertCircle, Info, HeartPulse, CheckSquare, ScanBarcode, LogOut
} from 'lucide-react';

// Import child views
import PatientPortal from './components/PatientPortal';
import ReceptionPortal from './components/ReceptionPortal';
import TechnicianPortal from './components/TechnicianPortal';
import AdminPortal from './components/AdminPortal';
import PublicVerification from './components/PublicVerification';
import PrintableReport from './components/PrintableReport';
import LoginPortal from './components/LoginPortal';
import { Fingerprint } from 'lucide-react';

export default function App() {
  // Master database state (backed by robust persistent clinical database)
  const [patients, setPatients] = useState<Patient[]>(() => ClinicalDatabase.getPatients());
  const [appointments, setAppointments] = useState<Appointment[]>(() => ClinicalDatabase.getAppointments());
  const [tests, setTests] = useState<LabTest[]>(() => ClinicalDatabase.getTests());

  // Doctor settings and authentication session states
  const [settings, setSettings] = useState<DoctorSettings>(() => ClinicalDatabase.getSettings());
  const [loginSession, setLoginSession] = useState<{ role: 'admin' | 'receptionist' } | null>(null);

  // App-wide language and currency context
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const currency = settings.currency || 'SAR';

  // Interface view states
  const [currentRole, setCurrentRole] = useState<UserRole | 'public_verify'>('public_verify');
  const [selectedPatientId, setSelectedPatientId] = useState<string>(() => {
    const list = ClinicalDatabase.getPatients();
    return list[0]?.id || '';
  }); // Seeded to first patient by default to avoid blank screen or crash
  
  // Biometric session verification status
  const [isBiometricVerified, setIsBiometricVerified] = useState<boolean>(false);
  const [showBiometricScreen, setShowBiometricScreen] = useState<boolean>(false);

  // Navigation / Detail view status
  const [viewingTestReport, setViewingTestReport] = useState<LabTest | null>(null);
  const [directVerifyToken, setDirectVerifyToken] = useState<string>('');

  // Auto URL deep check for scanned QR Code verification links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify') || params.get('token');
    if (verifyToken) {
      setDirectVerifyToken(verifyToken);
      setViewingTestReport(null);
      setCurrentRole('public_verify');
    }
  }, []);

  // SGL state handlers mapped to database
  const handleRegisterPatient = (newPat: Patient) => {
    const updated = ClinicalDatabase.savePatient(newPat);
    setPatients(updated);
  };

  const handleConfirmAppointment = (aptId: string) => {
    const updatedApts = appointments.map(a => a.id === aptId ? { ...a, status: 'confirmed' as const } : a);
    const target = updatedApts.find(a => a.id === aptId);
    if (target) {
      ClinicalDatabase.saveAppointment(target);
    }
    setAppointments(updatedApts);
  };

  const handleCancelAppointment = (aptId: string) => {
    const updatedApts = appointments.map(a => a.id === aptId ? { ...a, status: 'cancelled' as const } : a);
    const target = updatedApts.find(a => a.id === aptId);
    if (target) {
      ClinicalDatabase.saveAppointment(target);
    }
    setAppointments(updatedApts);
  };

  const handleBookAppointment = (newApt: Omit<Appointment, 'id'>) => {
    const apt: Appointment = {
      id: `APT-00${appointments.length + 1}`,
      ...newApt
    };
    const updated = ClinicalDatabase.saveAppointment(apt);
    setAppointments(updated);
  };

  const handleLogTestRequest = (newTest: Omit<LabTest, 'id' | 'qrToken' | 'barcode' | 'sampleStatus'>) => {
    const randomBarcode = Math.floor(10000000 + Math.random() * 90000000).toString();
    const cleanId = `LAB-2026-00${tests.length + 1}`;
    
    const labTest: LabTest = {
      ...newTest,
      id: cleanId,
      barcode: randomBarcode,
      qrToken: `VERIFIED-${newTest.testType}-${randomBarcode}-2026`,
      sampleStatus: 'collected' // Tube is logged and collected in the lab right away
    };

    const updated = ClinicalDatabase.saveTest(labTest);
    setTests(updated);
  };

  const handleUploadResults = (testId: string, parameters: any[]) => {
    const updatedTests = tests.map(t => 
      t.id === testId 
        ? { ...t, parameters, sampleStatus: 'analyzed' as const } // Analysed, pending medical manager sign
        : t
    );
    const target = updatedTests.find(t => t.id === testId);
    if (target) {
      ClinicalDatabase.saveTest(target);
    }
    setTests(updatedTests);
  };

  const handleApproveTest = (testId: string, doctorName: string) => {
    const updatedTests = tests.map(t => 
      t.id === testId 
        ? { 
            ...t, 
            sampleStatus: 'approved' as const, 
            approvedBy: doctorName, 
            approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 19) 
          } 
        : t
    );
    const target = updatedTests.find(t => t.id === testId);
    if (target) {
      ClinicalDatabase.saveTest(target);
    }
    setTests(updatedTests);
  };

  const handleModifyReference = (type: 'CBC' | 'LIPID' | 'LIVER' | 'GLUCOSE', minNormal: number, maxNormal: number) => {
    // Dynamically adjust parameters inside un-approved tests or calibration standard
    const updatedTests = tests.map(t => {
      if (t.testType === type && t.sampleStatus !== 'approved') {
        const parameters = t.parameters.map(p => ({
          ...p,
          minNormal,
          maxNormal
        }));
        return { ...t, parameters };
      }
      return t;
    });
    ClinicalDatabase.saveAllTests(updatedTests);
    setTests(updatedTests);
  };

  const handleUpdateSettings = (newSettings: DoctorSettings) => {
    const updated = ClinicalDatabase.saveSettings(newSettings);
    setSettings(updated);
  };

  // Switch helper to quickly jump to verification
  const handleVerifyReportSelf = (token: string) => {
    setDirectVerifyToken(token);
    setViewingTestReport(null);
    setCurrentRole('public_verify');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col antialiased text-slate-800" dir="rtl">
      
      {/* Main Container Wrapper */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        
        {/* If viewing a printable PDF report, render only that view */}
        {viewingTestReport ? (
          <div className="animate-fadeIn">
            <PrintableReport
              test={viewingTestReport}
              patient={patients.find(p => p.id === viewingTestReport.patientId) || patients[0]}
              onBack={() => setViewingTestReport(null)}
              onVerifySelf={() => handleVerifyReportSelf(viewingTestReport.qrToken)}
              settings={settings}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            
            {/* Left Column (Main App / Portals) */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Application Branding Header */}
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 no-print`}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-600 text-white shadow-lg">
                    <HeartPulse className="w-8 h-8 animate-pulse text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full uppercase">
                        LIMS & EHR CLOUD
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-slate-400 text-[10px] font-bold">بوابة الإدارة السحابية عن بعد</span>
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">نظام معلومات مختبرات MY LAB</h1>
                  </div>
                </div>

                {/* Account/Role Fast Switcher tabs (No-print) */}
                <div className="w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <div className="bg-slate-100 p-1 rounded-xl flex items-center min-w-max">
                    
                    {/* Public QR Check Tab */}
                    <button
                      onClick={() => {
                        setDirectVerifyToken('');
                        setCurrentRole('public_verify');
                      }}
                      className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentRole === 'public_verify' 
                          ? 'bg-slate-900 text-white' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id="role-public-verify"
                    >
                      <ScanBarcode className="w-3.5 h-3.5" />
                      <span>المصادقة السحابية (تحقق QR)</span>
                    </button>

                    {/* Patient role */}
                    <button
                      onClick={() => setCurrentRole('patient')}
                      className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentRole === 'patient' 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id="role-patient"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>بوابة المريض أحمد</span>
                    </button>

                    {/* Reception role */}
                    <button
                      onClick={() => setCurrentRole('receptionist')}
                      className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentRole === 'receptionist' 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id="role-receptionist"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>الاستقبال والفواتير</span>
                    </button>

                    {/* Lab Tech role */}
                    <button
                      onClick={() => setCurrentRole('technician')}
                      className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                        currentRole === 'technician' 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id="role-technician"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      <span>فني الأجهزة المخبرية</span>
                    </button>

                    {/* Admin Doctor role with Biometric lock status */}
                    <button
                      onClick={() => setCurrentRole('admin')}
                      className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 relative ${
                        currentRole === 'admin' 
                          ? 'bg-teal-600 text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      id="role-admin"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>الإدارة والمدير الطبي</span>
                      {isBiometricVerified ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white inline-block animate-pulse shrink-0" title="تم التحقق بالبصمة" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-amber-500 border border-white inline-block shrink-0" title="يتطلب بصمة الطبيب" />
                      )}
                    </button>

                    {/* Logout button */}
                    {loginSession && (
                      <button
                        onClick={() => {
                          setLoginSession(null);
                          setIsBiometricVerified(false);
                          setCurrentRole('public_verify');
                        }}
                        className="px-3 py-2 text-rose-600 hover:text-rose-700 font-extrabold text-[11px] flex items-center gap-1 ml-1 cursor-pointer bg-rose-50/70 border border-rose-100 rounded-lg transition-all"
                        title="إغلاق حماية LIMS"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>خروج</span>
                      </button>
                    )}

                  </div>
                </div>
              </div>

              {/* System Overview Dashboard Hint */}
              <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-500 shadow-sm no-print">
                <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">نظام إدارة المختبرات الطبية السحابي (LIMS & EHR)</span>
                  <p className="mt-1 leading-relaxed text-[11px]">
                    منصة متكاملة لتسجيل المرضى، إدارة سحب العينات، والربط المباشر مع أجهزة التحليل. تتيح المنصة اعتماد النتائج طبياً باستخدام التوقيع الرقمي والباركود لضمان سلامة وموثوقية التقارير للمرضى.
                  </p>
                </div>
              </div>

              {/* RENDER CURRENT ROLE SELECTION VIEW OR EMULATED CLIENTS */}
                <div className="space-y-6">
                  
                  {/* Visual guidelines */}
                  <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-500 shadow-sm no-print">
                    <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">💡 بوابة التحكم الطبية السحابية المتكاملة (الويب):</span>
                      <p className="mt-1 leading-relaxed text-[11px]">
                        هذه الواجهة تمثل الوصول الإداري متعدد الأدوار عن بعد عبر متصفحات الويب للتحقق والتحكم في البيانات. انتقل بين علامات دور المستخدم لمعاينة تجربة كل مستخدم على نظام "MY LAB".
                      </p>
                    </div>
                  </div>

                  {/* Switch view portals */}
                  <div className="bg-white rounded-2xl p-4 sm:px-6 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4 no-print select-none">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 ml-1">بوابات تبديل الأدوار:</span>
                      
                      <div className="flex bg-slate-100 p-1 rounded-xl flex-wrap gap-1.5">
                        {/* Patient role */}
                        <button
                          onClick={() => setCurrentRole('patient')}
                          className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentRole === 'patient' 
                              ? 'bg-teal-600 text-white shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          id="role-patient"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>بوابة المريض أحمد</span>
                        </button>

                        {/* Reception role */}
                        <button
                          onClick={() => setCurrentRole('receptionist')}
                          className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentRole === 'receptionist' 
                              ? 'bg-teal-600 text-white shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          id="role-receptionist"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>الاستقبال والفواتير</span>
                        </button>

                        {/* Lab Tech role */}
                        <button
                          onClick={() => setCurrentRole('technician')}
                          className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentRole === 'technician' 
                              ? 'bg-teal-600 text-white shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          id="role-technician"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>فني الأجهزة المخبرية</span>
                        </button>

                        {/* Admin Doctor role */}
                        <button
                          onClick={() => setCurrentRole('admin')}
                          className={`px-3 py-2 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5 ${
                            currentRole === 'admin' 
                              ? 'bg-teal-600 text-white shadow-sm' 
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                          id="role-admin"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>الإدارة والمدير الطبي</span>
                          {isBiometricVerified && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse border border-white" />}
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* Live rendering */}
                  <div className="transition-all duration-200">
                    {currentRole === 'patient' && (
                      <PatientPortal
                        currentPatient={patients.find(p => p.id === selectedPatientId) || patients[0]}
                        tests={tests}
                        appointments={appointments}
                        language={language}
                        currency={currency}
                        onLogout={() => setCurrentRole('public_verify')}
                        onSelectTest={(t) => setViewingTestReport(t)}
                        onBookAppointment={handleBookAppointment}
                      />
                    )}

                     {currentRole === 'receptionist' && (
                       (loginSession?.role === 'receptionist' || loginSession?.role === 'admin') ? (
                         <ReceptionPortal
                           patients={patients}
                           tests={tests}
                           appointments={appointments}
                           language={language}
                           currency={currency}
                           onRegisterPatient={handleRegisterPatient}
                           onConfirmAppointment={handleConfirmAppointment}
                           onCancelAppointment={handleCancelAppointment}
                           onLogTestRequest={handleLogTestRequest}
                         />
                       ) : (
                         <LoginPortal
                           settings={settings}
                            patients={patients}
                            onRegisterPatientBySelf={handleRegisterPatient}
                            onPatientLoginSelect={(id) => {
                              setSelectedPatientId(id);
                              setCurrentRole('patient');
                            }}
                            language={language}
                           onLogin={(role, isBiometric) => {
                             setLoginSession({ role });
                             if (role === 'admin') {
                               setIsBiometricVerified(true);
                             }
                           }}
                           onPublicVerify={() => {
                             setLoginSession({ role: 'admin' });
                             setCurrentRole('public_verify');
                           }}
                         />
                       )
                     )}

                     {currentRole === 'technician' && (
                       settings.enableTechnicianPlatform ? (
                         <TechnicianPortal
                           tests={tests}
                           onUploadResults={handleUploadResults}
                           settings={settings}
                         />
                       ) : (
                         <div className="bg-amber-50 border border-amber-250 p-6 rounded-2xl text-center text-amber-900 font-extrabold text-xs">
                           تم إيقاف صلاحية فني الأجهزة المختبرية بالكامل بقرار إداري من الطبيب المالك.
                         </div>
                       )
                     )}

                     {currentRole === 'admin' && (
                       loginSession?.role === 'admin' ? (
                           <AdminPortal
                             tests={tests}
                             patients={patients}
                             language={language}
                             currency={currency}
                             onApproveTest={handleApproveTest}
                             onModifyReferenceCost={handleModifyReference}
                             settings={settings}
                             onUpdateSettings={handleUpdateSettings}
                           />
                       ) : (
                         <LoginPortal
                           settings={settings}
                            patients={patients}
                            onRegisterPatientBySelf={handleRegisterPatient}
                            onPatientLoginSelect={(id) => {
                              setSelectedPatientId(id);
                              setCurrentRole('patient');
                            }}
                            language={language}
                           onLogin={(role, isBiometric) => {
                             setLoginSession({ role });
                             if (role === 'admin') {
                               setIsBiometricVerified(true);
                             }
                           }}
                           onPublicVerify={() => {
                             setLoginSession({ role: 'admin' });
                             setCurrentRole('public_verify');
                           }}
                         />
                       )
                     )}

                    {currentRole === 'public_verify' && (
                      <PublicVerification
                        tests={tests}
                        patients={patients}
                        initialToken={directVerifyToken}
                        onClose={() => {
                          setCurrentRole('admin');
                          setDirectVerifyToken('');
                        }}
                      />
                    )}
                  </div>

                </div>
            </div>

            {/* Right Column (Clinical AI Assistant Panel Sidebar) */}
            <div className="lg:col-span-1 no-print h-full lg:sticky lg:top-4 space-y-4">
              
              

              {/* Biometric Controller & Reset Fast Box */}
              <div className="bg-white border border-slate-200.5 p-4 rounded-3xl shadow-sm text-xs text-slate-650 space-y-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  <Fingerprint className="w-4.5 h-4.5 text-emerald-600 animate-pulse" />
                  <span>لوحة أدوات التأمين البيومتري:</span>
                </div>
                <p className="text-[10.5px] leading-relaxed text-slate-500">
                  حالة هويتك الحالية: {isBiometricVerified ? (
                    <span className="text-emerald-600 font-black">✓ مصادق ومصرح (المستشفيات)</span>
                  ) : (
                    <span className="text-amber-500 font-bold">غير مصادق (بوابة التوقيع مغلقة)</span>
                  )}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsBiometricVerified(!isBiometricVerified)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-2 rounded-xl text-[10px] transition-all cursor-pointer text-center border border-slate-150"
                  >
                    {isBiometricVerified ? 'إبطال البصمة (قفل) 🔒' : 'تفعيل إقرار بصمة الطبيب ✓'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Footer copyright (Hidden during printing) */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 no-print mt-12 bg-slate-50/20">
        <p className="font-sans leading-relaxed">
          جميع الحقوق محفوظة © معمل "MY LAB" لـ معلومات المختبرات وإدارة النظم السحابية الطبية 2026.
        </p>
        <p className="font-semibold text-slate-400 mt-1">
          مُدمج بنطام تفويض البصمات الإلكتروني والأكواد الذكية لمنع تزييف نتائج الرعاية الصحية الطبية.
        </p>
      </footer>
    </div>
  );
}
