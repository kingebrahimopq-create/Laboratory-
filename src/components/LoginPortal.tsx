import React, { useState } from 'react';
import { DoctorSettings, Patient } from '../types';
import { TRANSLATIONS } from '../lib/translations';
import { 
  ShieldCheck, Fingerprint, KeyRound, User, Lock, 
  ArrowRight, HeartPulse, Sparkles, CheckCircle2, ShieldAlert,
  Clock, AlertCircle, ScanBarcode, UserPlus, Phone, Calendar
} from 'lucide-react';

interface LoginPortalProps {
  settings: DoctorSettings;
  onLogin: (role: 'admin' | 'receptionist', isBiometric: boolean) => void;
  onPublicVerify: () => void;
  patients: Patient[];
  onRegisterPatientBySelf: (pat: Patient) => void;
  onPatientLoginSelect: (patientId: string) => void;
  language: 'ar' | 'en';
}

export default function LoginPortal({ 
  settings, 
  onLogin, 
  onPublicVerify,
  patients,
  onRegisterPatientBySelf,
  onPatientLoginSelect,
  language
}: LoginPortalProps) {
  const [activeTab, setActiveTab] = useState<'doctor' | 'receptionist' | 'patient_login' | 'patient_reg'>('doctor');
  const t = TRANSLATIONS[language];
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  // Input fields for reception
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [doctorEmail, setDoctorEmail] = useState('');
  const [doctorPasscode, setDoctorPasscode] = useState('');
  
  // Patient Login state
  const [patientIdInput, setPatientIdInput] = useState('');
  
  // Patient registration form state
  const [regId, setRegId] = useState('');
  const [regNameAr, setRegNameAr] = useState('');
  const [regNameEn, setRegNameEn] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regGender, setRegGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [regDob, setRegDob] = useState('');
  const [regBlood, setRegBlood] = useState('O+');

  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Biometric scanner state inside login

  const handleReceptionistLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    const configuredUser = settings.receptionUsername.trim().toLowerCase();
    const configuredPass = settings.receptionPassword;
    const inputUser = username.trim().toLowerCase();

    if (inputUser === configuredUser && password === configuredPass) {
      onLogin('receptionist', false);
    } else {
      setErrorMsg(language === 'ar' 
        ? 'الاسم أو رمز المرور الخاص بموظف الاستقبال غير صحيح. يرجى مراجعة الدكتور المالك.'
        : 'Incorrect receptionist username or passcode. Please consult the owner.'
      );
    }
  };

  const handleDoctorPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (doctorEmail.trim().toLowerCase() === 'ebrahimopq@gmail.com' && doctorPasscode === '0e02ddd1') {
      onLogin('admin', false);
    } else {
      setErrorMsg(language === 'ar'
        ? 'بيانات الدخول خاطئة. الحساب الإداري مقتصر على المالك.'
        : 'Incorrect credentials. Admin account is restricted to the owner.'
      );
    }
  };

  const handlePatientLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const idClean = patientIdInput.trim();
    
    // Find patient by national ID or phone number
    const found = patients.find(p => p.id === idClean || p.phone === idClean);
    if (found) {
      setSuccessMsg(language === 'ar' ? 'جاري توجيهك لملفك الطبي...' : 'Accessing your clinical file...');
      setTimeout(() => {
        onPatientLoginSelect(found.id);
      }, 800);
    } else {
      setErrorMsg(t.noPatientFound);
    }
  };

  const handlePatientRegSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regId.trim() || !regNameAr.trim() || !regPhone.trim()) {
      setErrorMsg(language === 'ar' ? 'يرجى ملء جميع البيانات الأساسية المطلوبة!' : 'Please fill all required inputs!');
      return;
    }

    const exists = patients.some(p => p.id === regId.trim());
    if (exists) {
      setErrorMsg(language === 'ar' ? 'رقم الهوية الوطنية هذا برقم ملف مسجل مسبقاً!' : 'National ID already registered!');
      return;
    }

    const newPatient: Patient = {
      id: regId.trim(),
      name: regNameAr.trim(),
      nameEn: regNameEn.trim() || regNameAr.trim(),
      phone: regPhone.trim(),
      gender: regGender,
      birthDate: regDob || "1990-01-01",
      bloodType: regBlood
    };

    onRegisterPatientBySelf(newPatient);
    setSuccessMsg(language === 'ar' ? 'تم إنشاء ملفك الطبي بنجاح! جاري دخولك للخدمات السحابية...' : 'Medical record created successfully! Entering portal...');

    setTimeout(() => {
      onPatientLoginSelect(newPatient.id);
    }, 1500);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 animate-fadeIn" dir={dir}>
      
      {/* Brand card */}
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-emerald-600 animate-pulse" />
        
        {/* Brand logo & title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto border border-emerald-150 shadow-sm">
            <HeartPulse className="w-8 h-8 animate-pulse text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-850">{t.loginTitle}</h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">{t.loginSubtitle}</p>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="bg-slate-100 p-1.5 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab('doctor'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'doctor' 
                ? 'bg-white text-emerald-900 shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.tabOwner}</span>
          </button>
          
          <button
            type="button"
            onClick={() => { setActiveTab('receptionist'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'receptionist' 
                ? 'bg-white text-emerald-900 shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.tabReceptionist}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('patient_login'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'patient_login' 
                ? 'bg-white text-emerald-900 shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.tabPatientLogin}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('patient_reg'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-2 md:col-span-1 ${
              activeTab === 'patient_reg' 
                ? 'bg-white text-emerald-900 shadow-sm font-extrabold' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-600 animate-bounce" />
            <span>{t.tabRegisterPatient}</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span className="font-bold leading-relaxed">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5 animate-bounce" />
            <span className="font-bold leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* RENDER ACTIVE TAB */}
        {activeTab === 'doctor' && (
          <div className="space-y-6">
            {/* Manual Passcode Option */}
            <form onSubmit={handleDoctorPasscodeSubmit} className="space-y-4 pt-1 border-t border-slate-100">
              <div className="relative space-y-3">
                <label className="text-xs font-bold text-slate-700 block text-center mb-1.5">{language === 'ar' ? 'البريد الإلكتروني للإدارة' : 'Admin Email'}</label>
                <input
                  type="email"
                  placeholder="ebrahimopq@gmail.com"
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold font-mono focus:border-emerald-600 outline-none transition-all text-center mb-3"
                  dir="ltr"
                />
                
                <label className="text-xs font-bold text-slate-700 block text-center mb-1.5">{language === 'ar' ? 'كلمة المرور' : 'Password'}</label>
                <input
                  type="password"
                  placeholder="********"
                  value={doctorPasscode}
                  onChange={(e) => setDoctorPasscode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold font-mono focus:border-emerald-600 outline-none transition-all text-center"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{t.btnPasscodeLogin}</span>
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>
            </form>
          </div>
        )}

        {activeTab === 'receptionist' && (
          <form onSubmit={handleReceptionistLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">{t.receptionUsernameLabel}</label>
              <input
                type="text"
                placeholder={language === 'ar' ? 'المعرف المعطى من الدكتور (الافتراضي: receptionist)' : 'Username (Default: receptionist)'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold focus:border-emerald-600 outline-none transition-all text-center"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">{t.receptionPasswordLabel}</label>
              <input
                type="password"
                placeholder={language === 'ar' ? 'كلمة السر المعتمدة (الافتراضي: 123)' : 'Password (Default: 123)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold font-mono focus:border-emerald-600 outline-none transition-all text-center"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t.btnReceptionLogin}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </form>
        )}

        {activeTab === 'patient_login' && (
          <form onSubmit={handlePatientLoginSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">{t.patientLoginLabel}</label>
              <input
                type="text"
                placeholder={t.patientLoginPlaceholder}
                value={patientIdInput}
                onChange={(e) => setPatientIdInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-mono font-bold focus:border-emerald-600 outline-none transition-all text-center"
                required
              />
              <span className="text-[10px] text-slate-400 mt-2 block leading-normal text-center">
                {language === 'ar' 
                  ? '💡 تلميح للاختبار: اكتب الرقم الطبي لمريض مسجل (مثال: 2980512 لأحمد أو سارة: 2940120)' 
                  : '💡 Hint: Write a registered ID (e.g. 2980512 for Ahmed, or 2940120 for Sarah)'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{t.btnPatientLogin}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </form>
        )}

        {activeTab === 'patient_reg' && (
          <form onSubmit={handlePatientRegSubmit} className="space-y-4">
            <div className="bg-teal-50/50 p-4 border border-teal-100 rounded-2xl mb-2 text-center">
              <h4 className="font-extrabold text-teal-900 text-xs">{t.patientRegTitle}</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{t.patientRegDesc}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{t.patientRegNameAr} *</label>
                <input
                  type="text"
                  placeholder="محمد أحمد الجودر"
                  value={regNameAr}
                  onChange={(e) => setRegNameAr(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold focus:border-emerald-650 outline-none text-right"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{t.patientRegNameEn}</label>
                <input
                  type="text"
                  placeholder="Mohammed Ahmed Aljowder"
                  value={regNameEn}
                  onChange={(e) => setRegNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:border-emerald-650 outline-none text-left font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{t.patientRegId} *</label>
                <input
                  type="text"
                  placeholder={t.patientRegIdPlaceholder}
                  value={regId}
                  onChange={(e) => setRegId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:border-emerald-650 outline-none text-center"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">{t.patientRegPhone} *</label>
                <input
                  type="text"
                  placeholder="0599112233"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold focus:border-emerald-650 outline-none text-center"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">{t.patientRegGender}</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-bold focus:border-emerald-650 outline-none cursor-pointer"
                >
                  <option value="ذكـر">{t.male}</option>
                  <option value="أنثى">{t.female}</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">{t.patientRegDob}</label>
                <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-[11px] focus:border-emerald-650 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">{t.patientRegBlood}</label>
                <select
                  value={regBlood}
                  onChange={(e) => setRegBlood(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2.5 text-xs font-mono font-bold focus:border-emerald-650 outline-none cursor-pointer"
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-extrabold py-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t.btnRegisterForm}</span>
            </button>
          </form>
        )}

        {/* Public Bypass link */}
        <div className="pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onPublicVerify}
            className="text-[10px] sm:text-[11px] text-slate-500 hover:text-emerald-700 hover:underline font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <ScanBarcode className="w-3.5 h-3.5" />
            <span>{t.byPassVerify}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
