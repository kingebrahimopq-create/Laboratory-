import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, logoutUser } from '../../lib/auth';
import { getUserProfile, createUserProfile, db } from '../../lib/db';
import { UserRole } from '../../types';
import { auth } from '../../lib/firebase';
import { query, collection, where, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Shield,
  Sparkles,
  Smartphone,
  LogIn,
  RefreshCw,
  Lock,
  CheckCircle,
  User,
  Activity,
  UserCheck
} from 'lucide-react';

  // Owner credentials - embedded for direct authentication
  const OWNER_EMAIL = 'mhm763517@gmail.com';
  const OWNER_PASSWORD = '0e02ddd1';
  const OWNER_USERNAME = 'mhm763517';

export function LoginForm() {
  const navigate = useNavigate();

  // Lab profile state
  const [labProfile, setLabProfile] = useState<{ showLabName: boolean; labName: string }>({ showLabName: false, labName: 'لم يحدد بعد' });

  // Unified input value (handles either Phone or ID/Email)
  const [inputValue, setInputValue] = useState('');

  // Login flow states
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // New unified patient authentication states
  const [isRegisteredPhone, setIsRegisteredPhone] = useState<boolean | null>(null);
  const [matchedPatientProfile, setMatchedPatientProfile] = useState<any | null>(null);
  const [patientPassword, setPatientPassword] = useState('');

  // First-time Patient Registration states
  const [patientNameAr, setPatientNameAr] = useState('');
  const [patientNameEn, setPatientNameEn] = useState('');
  const [patientUsername, setPatientUsername] = useState('');
  const [patientEmail, setPatientEmail] = useState('');

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

  // Detector to verify if the typed string represents a phone format
  const isPhoneFormat = (val: string): boolean => {
    const cleaned = val.trim();
    if (!cleaned) return false;
    return cleaned.startsWith('+') || cleaned.startsWith('05') || cleaned.startsWith('5') || cleaned.startsWith('966') || /^\d+$/.test(cleaned);
  };

  // Dynamic router submission
  const handleProceed = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    const target = inputValue.trim();
    if (!target) {
      setError('يرجى كتابة رقم الجوال أو معرف الدخول أولاً.');
      return;
    }

    if (isPhoneFormat(target)) {
      // Patient Flow
      if (isRegisteredPhone === null) {
        setLoading(true);
        try {
          const q = query(collection(db, 'users'), where('phone', '==', target));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const profile = snap.docs[0].data();
            setIsRegisteredPhone(true);
            setMatchedPatientProfile({ id: snap.docs[0].id, ...profile });
            setInfoMessage('أهلاً بك مجدداً! تم العثور على ملف طبي مسبق. يرجى إدخال كلمة المرور لدخول بوابة التقارير.');
          } else {
            setIsRegisteredPhone(false);
            setInfoMessage('رقم الجوال هذا غير مسجل لدينا. يرجى ملء البيانات لتأسيس ملفك الطبي وتفعيل سجل الفحوصات:');
            setPatientUsername('patient_' + Math.random().toString(36).substring(2, 7));
          }
        } catch (err: any) {
          setError('حدث خطأ أثناء فحص السجلات السحابية: ' + err.message);
        } finally {
          setLoading(false);
        }
      } else if (isRegisteredPhone === true) {
        // Log in patient
        if (!patientPassword.trim()) {
          setError('يرجى كتابة كلمة مرور الدخول لملفك الطبي.');
          return;
        }
        setLoading(true);
        try {
          const loginEmail = `${matchedPatientProfile.username}@patient-lab.local`;
          await loginUser(loginEmail, patientPassword.trim());
          navigate('/dashboard');
        } catch (err: any) {
          console.error(err);
          setError('عذراً، كلمة المرور المدخلة لملف المريض غير صحيحة.');
        } finally {
          setLoading(false);
        }
      } else if (isRegisteredPhone === false) {
        // Register patient
        if (!patientNameAr.trim() || !patientNameEn.trim() || !patientUsername.trim() || !patientPassword.trim()) {
          setError('الرجاء تعبئة كافة الحقول المميزة بنجمة لتثبيت ملفك الطبي.');
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
            phone: inputValue.trim(),
            email: patientEmail.trim().toLowerCase() || registrationEmail,
          };
          await registerUser(registrationEmail, patientPassword.trim(), userData);
          navigate('/dashboard');
        } catch (err: any) {
          console.error(err);
          setError('أخفق تنشيط السجل الطبي الجديد: ' + (err.message || 'يرجى التحقق من المدخلات.'));
        } finally {
          setLoading(false);
        }
      }
    } else {
      // Staff / Owner authentication
      if (!password.trim()) {
        setError('يرجى تحديد كلمة المرور الخاصة بمعرف المالك لدخول الكادر العملي.');
        return;
      }
      await performStaffLogin(target, password.trim());
    }
  };

  // Owner direct login function
  const performOwnerLogin = async (email: string, pass: string): Promise<boolean> => {
    try {
      // Try to login directly with owner credentials
      const { createUserWithEmailAndPassword, signInWithEmailAndPassword } = await import('firebase/auth');

      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, pass);
      } catch (loginErr: any) {
        // If login fails, try creating the account first
        if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
          try {
            cred = await createUserWithEmailAndPassword(auth, email, pass);
          } catch (regErr: any) {
            console.error('Failed to register owner account:', regErr);
            return false;
          }
        } else {
          throw loginErr;
        }
      }

      if (cred) {
        // Create/update owner profile in Firestore
        const { setDoc, getFirestore } = await import('firebase/firestore');
        const dbInstance = getFirestore();
        await setDoc(doc(dbInstance, 'users', cred.user.uid), {
          id: cred.user.uid,
          email: OWNER_EMAIL,
          username: OWNER_USERNAME,
          role: 'admin',
          name: 'مدير المختبر',
          nameAr: 'مدير المختبر',
          phone: '',
        }, { merge: true });

        // Set ownership
        await setDoc(doc(dbInstance, 'settings', 'ownership'), {
          ownerEmail: OWNER_EMAIL
        }, { merge: true });

        return true;
      }
      return false;
    } catch (err) {
      console.error('Owner login failed:', err);
      return false;
    }
  };

  // Stafford login resolver
  const performStaffLogin = async (identifier: string, pass: string) => {
    setLoading(true);
    try {
      let emailAddress = identifier.toLowerCase().trim();

      // Check if owner credentials are used (by email or username)
      const isOwnerByEmail = emailAddress === OWNER_EMAIL.toLowerCase();
      const isOwnerByUsername = emailAddress === OWNER_USERNAME || emailAddress === 'mhm763517' || emailAddress === 'admin' || emailAddress === 'owner';

      if ((isOwnerByEmail || isOwnerByUsername) && pass === OWNER_PASSWORD) {
        const success = await performOwnerLogin(OWNER_EMAIL, OWNER_PASSWORD);
        if (success) {
          navigate('/dashboard');
          return;
        }
      }

      // If it's a known admin username, resolve to email
      if (emailAddress === 'mhm763517' || emailAddress === 'admin' || emailAddress === 'owner') {
        emailAddress = OWNER_EMAIL;
      }

      // If it is a username (not email), query Firestore to map to email
      if (!emailAddress.includes('@')) {
        try {
          const q = query(collection(db, 'users'), where('username', '==', identifier.trim().toLowerCase()));
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

      // Try standard email/password authentication
      try {
        const cred = await loginUser(emailAddress, pass);
        const profile = await getUserProfile(cred.user.uid);

        if (!profile) {
          await logoutUser();
          throw new Error('المعرف صحيح ولكن لم يتم تفعيل السجل الوظيفي؛ يرجى مراجعة إدارة المختبر المعتمد.');
        }

        navigate('/dashboard');
      } catch (authErr: any) {
        // If auth fails and it's the owner email, try owner login with proxy
        if (emailAddress === OWNER_EMAIL && pass === OWNER_PASSWORD) {
          const success = await performOwnerLogin(OWNER_EMAIL, OWNER_PASSWORD);
          if (success) {
            navigate('/dashboard');
            return;
          }
        }
        throw authErr;
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'فشل الدخول بالمعرف؛ يرجى التأكد من الرمز وكلمة المرور.';
      if (err.code === 'auth/invalid-credential') {
        msg = 'كلمة المرور أو معرف المستخدم غير صحيح.';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'الحساب المرتبط غير موجود في النظام.';
      } else if (err.code === 'auth/wrong-password') {
        msg = 'كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'صيغة البريد الإلكتروني غير صحيحة.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'تم تجاوز عدد المحاولات المسموح. يرجى المحاولة لاحقاً.';
      } else {
        msg = err.message || msg;
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
        <p className="text-[11px] text-slate-300 relative z-10">للمرضى والكادر الطبي المعتمد</p>
      </div>

      {/* Unified Input Form Area */}
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

        <form onSubmit={handleProceed} className="flex flex-col gap-4">

          {/* Unified Phone/ID Input Box */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black text-slate-700 flex items-center justify-between">
              <span>رقم الجوال أو معرف الدخول الخاص بك *</span>

              {inputValue.trim() && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 ${
                  isPhoneFormat(inputValue)
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-150'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-150'
                }`}>
                  {isPhoneFormat(inputValue) ? (
                    <>
                      <Smartphone className="w-2.5 h-2.5" />
                      <span>حساب مريض</span>
                    </>
                  ) : (
                    <>
                      <User className="w-2.5 h-2.5" />
                      <span>كادر طبي ومعتمد</span>
                    </>
                  )}
                </span>
              )}
            </label>

            <div className="relative">
              <input
                type="text"
                required
                disabled={isRegisteredPhone !== null}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setIsRegisteredPhone(null);
                  setMatchedPatientProfile(null);
                  setError(null);
                  setInfoMessage(null);
                }}
                placeholder="مثال: 0500000000 أو mhm763517"
                className="w-full p-3 pr-9 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-right font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder-slate-400 font-sans disabled:opacity-70"
              />
              <span className="absolute right-3.5 top-3.5 text-slate-400">
                {isPhoneFormat(inputValue) ? (
                  <Smartphone className="w-4 h-4 text-emerald-500 animate-pulse" />
                ) : (
                  <User className="w-4 h-4 text-slate-400" />
                )}
              </span>
            </div>
          </div>

          {/* If STAFF Login: Display regular password field */}
          {inputValue.trim() && !isPhoneFormat(inputValue) && (
            <div className="flex flex-col gap-1.5 animate-fade-in-down">
              <label className="text-[11px] font-black text-slate-700 mr-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>كلمة المرور *</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-mono"
                dir="ltr"
              />

            </div>
          )}

          {/* If PATIENT already registered, show Password Prompt */}
          {isRegisteredPhone === true && (
            <div className="flex flex-col gap-1.5 animate-fade-in-down border-t pt-4 mt-2">
              <label className="text-[11px] font-black text-slate-700 mr-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>أدخل كلمة مرور المريض *</span>
              </label>
              <input
                type="password"
                required
                value={patientPassword}
                onChange={(e) => setPatientPassword(e.target.value)}
                placeholder="أدخل كلمة مرور ملفك الطبي"
                className="w-full p-3 text-xs border border-emerald-200 rounded-xl bg-emerald-50/20 focus:bg-white text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-mono"
                dir="ltr"
              />
              <div className="flex justify-between items-center mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteredPhone(null);
                    setMatchedPatientProfile(null);
                    setPatientPassword('');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[10px] text-rose-500 font-bold hover:underline"
                >
                  تغيير رقم الجوال المختار
                </button>
              </div>
            </div>
          )}

          {/* If PATIENT is not registered, show the dynamic fields */}
          {isRegisteredPhone === false && (
            <div className="flex flex-col gap-3 animate-fade-in-down border-t pt-4 mt-2">

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">الاسم بالكامل (بالعربية) *</span>
                <input
                  type="text"
                  required
                  value={patientNameAr}
                  onChange={(e) => setPatientNameAr(e.target.value)}
                  placeholder="مثال: محمد أحمد"
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
                  placeholder="Example: Mohamed Ahmed"
                  className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">اسم مستخدم فريد للدخول المستقبلي *</span>
                <input
                  type="text"
                  required
                  value={patientUsername}
                  onChange={(e) => setPatientUsername(e.target.value)}
                  placeholder="mohamed_ahmed"
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
                <span className="text-[10px] font-bold text-slate-500 mr-1">البريد الإلكتروني (اختياري)</span>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="p-2.5 text-xs border border-slate-200 bg-slate-50 rounded-lg text-left focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-sans"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisteredPhone(null);
                    setPatientPassword('');
                    setError(null);
                    setInfoMessage(null);
                  }}
                  className="text-[10px] text-rose-500 font-bold hover:underline"
                >
                  إلغاء وإعادة المحاولة
                </button>
              </div>

            </div>
          )}

          {/* Submission button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-xl font-bold text-center mt-1.5 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50 text-xs text-[11px]"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : isPhoneFormat(inputValue) ? (
              <Smartphone className="w-4 h-4 text-emerald-400" />
            ) : (
              <LogIn className="w-4 h-4 text-emerald-400" />
            )}
            <span>
              {loading
                ? 'جاري المتابعة والتحقق...'
                : isPhoneFormat(inputValue)
                  ? (isRegisteredPhone === null
                      ? 'التحقق ومتابعة رقم الجوال'
                      : (isRegisteredPhone === true ? 'تأكيد كلمة المرور ودخول' : 'تأسيس وحفظ الملف الطبي الجديد'))
                  : 'دخول الكادر الوظيفي'}
            </span>
          </button>
        </form>

      </div>

    </div>
  );
}
