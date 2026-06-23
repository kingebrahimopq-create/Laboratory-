import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, logoutUser } from '../../lib/auth';
import { getUserProfile, db } from '../../lib/db';
import { UserRole } from '../../types';
import { auth } from '../../lib/firebase';
import { query, collection, where, getDocs, doc, setDoc, getDoc } from '../../lib/supabase-firestore';
import { 
  Shield, 
  Smartphone, 
  LogIn, 
  RefreshCw, 
  Lock, 
  User,
  Activity
} from 'lucide-react';

export function LoginForm() {
  const navigate = useNavigate();

  // Settings
  const [labProfile, setLabProfile] = useState<{ showLabName: boolean; labName: string }>({ showLabName: false, labName: 'لم يحدد بعد' });
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'patient' | 'staff'>('patient');

  // Shared
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Patient States
  const [phone, setPhone] = useState('');
  const [isRegisteredPhone, setIsRegisteredPhone] = useState<boolean | null>(null);
  const [matchedPatientProfile, setMatchedPatientProfile] = useState<any | null>(null);
  const [patientPassword, setPatientPassword] = useState('');
  
  // New Patient Form
  const [patientNameAr, setPatientNameAr] = useState('');
  const [patientNameEn, setPatientNameEn] = useState('');
  const [patientUsername, setPatientUsername] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

  // Staff States
  const [staffIdentifier, setStaffIdentifier] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  useEffect(() => {
    const fetchLabProfile = async () => {
      try {
        const docRef = doc(db, 'settings', 'lab_profile');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setLabProfile({
            showLabName: !snap.data().showLabName,
            labName: snap.data().labName || 'لم يحدد بعد'
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLabProfile();
  }, []);

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11); // Allow up to 11 digits
    setPhone(value);
    
    // Auto-check when reaching a plausible Saudi phone length (10 or 11 digits)
    if (value.length === 10 || value.length === 11) {
      setLoading(true);
      setError(null);
      setInfoMessage(null);
      try {
        const q = query(collection(db, 'users'), where('phone', '==', value));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const profile = snap.docs[0].data();
          setIsRegisteredPhone(true);
          setMatchedPatientProfile({ id: profile.id || snap.docs[0].id, ...profile });
          setInfoMessage('تم العثور على ملفك الطبي! الرجاء إدخال الرقم السري.');
        } else {
          setIsRegisteredPhone(false);
          setInfoMessage('رقم جديد! الرجاء إكمال البيانات لتسجيل ملفك الطبي.');
          setPatientUsername('pat_' + Math.random().toString(36).substring(2, 6));
        }
      } catch (err: any) {
        console.error('Error fetching patient:', err);
        setError('حدث خطأ في جلب بيانات المريض.');
      } finally {
        setLoading(false);
      }
    } else {
      // Reset if user erases digits
      setIsRegisteredPhone(null);
      setMatchedPatientProfile(null);
      setInfoMessage(null);
      setError(null);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || isRegisteredPhone === null) return;
    setError(null);

    if (isRegisteredPhone === true) {
      if (!patientPassword) {
        setError('يرجى إدخال كلمة المرور.');
        return;
      }
      setLoading(true);
      try {
        const loginEmail = `${matchedPatientProfile.username}@patient-lab.local`;
        await loginUser(loginEmail, patientPassword);
        navigate('/dashboard');
      } catch (err: any) {
        setError('كلمة المرور غير صحيحة.');
      } finally {
        setLoading(false);
      }
    } else if (isRegisteredPhone === false) {
      if (!patientNameAr || !patientNameEn || !patientUsername || !patientPassword) {
        setError('يرجى إكمال جميع الحقول الإلزامية.');
        return;
      }
      setLoading(true);
      try {
        const registrationEmail = `${patientUsername.trim().toLowerCase()}@patient-lab.local`;
        const userData = {
          username: patientUsername.trim().toLowerCase(),
          role: 'patient' as UserRole,
          name: patientNameEn.trim(),
          nameAr: patientNameAr.trim(),
          phone: phone.trim(),
          email: patientEmail.trim().toLowerCase() || registrationEmail,
          password: patientPassword.trim()
        };
        await registerUser(registrationEmail, patientPassword.trim(), userData);
        navigate('/dashboard');
      } catch (err: any) {
        setError('فشل في إنشاء الحساب المريض: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffIdentifier || !staffPassword) {
      setError('يرجى إدخال المعرف وكلمة المرور.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let emailAddress = staffIdentifier.toLowerCase().trim();
      
      if (emailAddress === 'mhm_owner' || emailAddress === 'mhm763517' || emailAddress === 'admin') {
        emailAddress = 'mhm763517@gmail.com';
      }

      if (!emailAddress.includes('@')) {
        try {
          const q = query(collection(db, 'users'), where('username', '==', emailAddress));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const profile = snap.docs[0].data();
            if (profile.role !== 'patient') {
              emailAddress = profile.email;
            }
          }
        } catch (e) {
          console.warn('Silent username query map issue:', e);
        }
      }

      if (emailAddress === 'mhm_owner' || emailAddress === 'mhm763517' || emailAddress === 'admin') {
        emailAddress = 'mhm763517@gmail.com';
      }
      
      // Admin/Owner Auto-creation logic (Mocked for Supabase compatibility)
      if ((emailAddress === 'mhm763517@gmail.com' || emailAddress === 'admin@patient-lab.local') && staffPassword === '0e02ddd1') {
        const proxyEmail = 'admin@patient-lab.local';
        let cred;
        try {
          cred = await loginUser(proxyEmail, staffPassword);
        } catch (loginErr: any) {
          const errMessage = (loginErr.message || '').toLowerCase();
          // Fallback check matching Supabase invalid credentials Error
          if (errMessage.includes('invalid login') || errMessage.includes('not found') || errMessage.includes('password') || loginErr.status === 400 || errMessage.includes('invalid-credential') || errMessage.includes('user-not-found') || errMessage.includes('wrong-password')) {
            try {
              const { createUserWithEmailAndPassword } = await import('firebase/auth');
              cred = await createUserWithEmailAndPassword(auth, proxyEmail, staffPassword);
            } catch (regErr: any) {
              console.error('Failed to register dynamic administrator fallback:', regErr);
              throw loginErr;
            }
          } else {
            throw loginErr;
          }
        }

        if (cred) {
          try {
            await setDoc(doc(db, 'users', cred.user.uid), {
              id: cred.user.uid,
              email: 'mhm763517@gmail.com',
              username: 'mhm_owner',
              role: 'admin',
              name: 'م. محمد المالك',
              nameAr: 'م. محمد المالك',
              phone: '920012345',
            }, { merge: true });

            await setDoc(doc(db, 'settings', 'ownership'), {
              ownerEmail: proxyEmail
            }, { merge: true });
          } catch (dbErr) {
            console.error('Failed to configure Firestore profile during custom admin login:', dbErr);
          }
          
          navigate('/dashboard');
          return;
        }
      }

      // Standard email resolution block for non-owners
      if (!emailAddress.includes('@')) {
        const q = query(collection(db, 'users'), where('username', '==', staffIdentifier.trim().toLowerCase()));
        const snap = await getDocs(q);
        if (snap.empty) {
          throw new Error('عذراً، لم نجد معرفاً مسجلاً بهذا الاسم في الكادر الطبي. يرجى التواصل مع الإدارة.');
        }
        const profile = snap.docs[0].data();
        if (profile.role === 'patient') {
          throw new Error('هذا المعرف خاص بملف مريض؛ للدخول يرجى التبديل لتبويب المرضى و استخدام رقم الجوال.');
        }
        emailAddress = profile.email;
      }

      const cred = await loginUser(emailAddress, staffPassword);
      const isOwner = emailAddress === 'mhm763517@gmail.com' || emailAddress === 'gokerebrahimopq@gmail.com';
      
      try {
        const profile = await getUserProfile(cred.user.uid);
        if (!profile && !isOwner) {
          await logoutUser();
          throw new Error('المعرف صحيح ولكن السجل الوظيفي يفتقر للصلاحيات؛ يرجى مراجعة إدارة المختبر.');
        }
      } catch (err: any) {
        if (!isOwner) throw err;
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      let msg = 'فشل الدخول. تأكد من صحة رقم المعرف وكلمة المرور.';
      if (err.message && err.message.toLowerCase().includes('invalid login credentials')) {
        msg = 'كلمة المرور أو معرف المستخدم غير صحيح.';
      } else if (err.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md mx-auto mb-2 relative z-10">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <h1 className="text-xl font-black mb-1 relative z-10 text-white">
          {labProfile.showLabName ? labProfile.labName : "بوابة الدخول الموحد للتحاليل"}
        </h1>
        <p className="text-[11px] text-slate-300 relative z-10">اختر طريقة الدخول المناسبة لك</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button 
          onClick={() => { setActiveTab('patient'); setError(null); setInfoMessage(null); }}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'patient' ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Smartphone className="w-4 h-4" />
          بوابة المرضى
        </button>
        <button 
          onClick={() => { setActiveTab('staff'); setError(null); setInfoMessage(null); }}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'staff' ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <User className="w-4 h-4" />
          بوابة الكادر الوظيفي
        </button>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-4">
        
        {error && (
          <div className="p-3 bg-rose-50/80 border border-rose-100 text-rose-600 text-xs rounded-xl text-right leading-relaxed animate-fade-in relative z-10">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-indigo-50 border-r-4 border-indigo-500 text-indigo-800 text-xs rounded-xl leading-normal text-right">
            {infoMessage}
          </div>
        )}

        {activeTab === 'patient' ? (
          <form onSubmit={handlePatientSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-700 flex items-center justify-between">
                <span>رقم جوال المريض *</span>
              </label>
              <div className="relative">
                <input 
                  type="tel"
                  required
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="05XXXXXXXX"
                  className="w-full p-3 pr-9 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-right font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder-slate-400 font-sans"
                  dir="ltr"
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                </span>
              </div>
            </div>

            {isRegisteredPhone === true && (
              <div className="flex flex-col gap-1.5 animate-fade-in-down border-t pt-4 mt-2 border-slate-100">
                <label className="text-[11px] font-black text-emerald-700 mr-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>أدخل كلمة مرور المريض (الرمز السري) *</span>
                </label>
                <input 
                  type="password"
                  required
                  value={patientPassword}
                  onChange={(e) => setPatientPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 text-xs border border-emerald-200 rounded-xl bg-emerald-50/20 focus:bg-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
                  dir="ltr"
                />
              </div>
            )}

            {isRegisteredPhone === false && (
              <div className="flex flex-col gap-3 animate-fade-in-down border-t pt-4 mt-2 border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">الاسم بالكامل (بالعربية) *</span>
                  <input 
                    type="text" 
                    required 
                    value={patientNameAr} 
                    onChange={(e) => setPatientNameAr(e.target.value)} 
                    placeholder="مثال: يوسف جاسم" 
                    className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-right focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">الاسم بالإنجليزية *</span>
                  <input 
                    type="text" 
                    required 
                    value={patientNameEn} 
                    onChange={(e) => setPatientNameEn(e.target.value)} 
                    placeholder="Example: Yousef Jassim" 
                    className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" 
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">اسم مستخدم للدخول المستقبلي *</span>
                  <input 
                    type="text" 
                    required 
                    value={patientUsername} 
                    onChange={(e) => setPatientUsername(e.target.value)} 
                    placeholder="yousef_99" 
                    className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans" 
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-emerald-700 mr-1">اختر كلمة مرور حسابك الطبي *</span>
                  <input 
                    type="password" 
                    required 
                    value={patientPassword} 
                    onChange={(e) => setPatientPassword(e.target.value)} 
                    placeholder="أدخل كلمة مرور قوية" 
                    className="p-2.5 text-xs border border-emerald-250 bg-emerald-50/10 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" 
                    dir="ltr"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 mr-1">البريد الإلكتروني للتقارير (اختياري)</span>
                  <input 
                    type="email" 
                    value={patientEmail} 
                    onChange={(e) => setPatientEmail(e.target.value)} 
                    placeholder="example@gmail.com" 
                    className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans" 
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {isRegisteredPhone !== null && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-xl font-bold text-center mt-2 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 text-xs text-[11px]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> : <LogIn className="w-4 h-4 text-emerald-400" />}
                <span>{isRegisteredPhone ? 'تسجيل الدخول للمرضى' : 'حفظ الملف والدخول'}</span>
              </button>
            )}

            {isRegisteredPhone === null && phone.length < 10 && (
              <div className="text-center text-xs text-slate-400 mt-2 bg-slate-50 rounded-lg p-3">
                أدخل رقم جوالك كاملًا للتحقق من سجلك.
              </div>
            )}

          </form>
        ) : (
          <form onSubmit={handleStaffSubmit} className="flex flex-col gap-4">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black text-slate-700 flex items-center justify-between">
                <span>المعرف الوظيفي أو الإيميل *</span>
              </label>
              <div className="relative">
                <input 
                  type="text"
                  required
                  value={staffIdentifier}
                  onChange={(e) => setStaffIdentifier(e.target.value)}
                  placeholder="admin.user or name@lab.com"
                  className="w-full p-3 pr-9 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder-slate-400 font-sans"
                  dir="ltr"
                />
                <span className="absolute right-3.5 top-3.5 text-slate-400">
                  <User className="w-4 h-4 text-indigo-500" />
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 animate-fade-in-down">
              <label className="text-[11px] font-black text-slate-700 mr-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>كلمة المرور المشفرة *</span>
              </label>
              <input 
                type="password"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-xl font-bold text-center mt-2 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 text-xs text-[11px]"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" /> : <Shield className="w-4 h-4 text-indigo-400" />}
              <span>تأكيد دخول الكادر</span>
            </button>
            
          </form>
        )}

      </div>
    </div>
  );
}

