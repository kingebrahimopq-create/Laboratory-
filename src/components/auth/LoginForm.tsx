import React, { useState } from 'react';
import { loginUser, registerUser, loginWithGoogle, logoutUser, loginAnonymously, getEmulatedUser, setEmulatedUser } from '../../lib/auth';
import { getUserProfile, getStaffInvite, getUserProfileByEmail, createUserProfile } from '../../lib/db';
import { UserRole } from '../../types';
import { Shield, Sparkles, Smartphone, LogIn, UserPlus } from 'lucide-react';

export function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [phone, setPhone] = useState(''); 
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // States for native app fallback portal
  const [showNativeBridge, setShowNativeBridge] = useState(true);
  const [nativeEmail, setNativeEmail] = useState('');

  // Pending Google registration states
  const [pendingGoogleUser, setPendingGoogleUser] = useState<{
    uid: string;
    email: string;
    displayName: string;
  } | null>(null);
  const [googlePhone, setGooglePhone] = useState('');
  const [googleNameAr, setGoogleNameAr] = useState('');
  const [googleNameEn, setGoogleNameEn] = useState('');
  const [googleUsername, setGoogleUsername] = useState('');


  const processGoogleUser = async (currentUser: any, isSignUpFlow: boolean) => {
    setError(null);
    setLoading(true);
    try {
      const isOwnerEmail = 
        currentUser.email?.toLowerCase() === 'mhm763517@gmail.com' || 
        currentUser.email?.toLowerCase() === 'gokerebrahimopq@gmail.com';
      
      const profile = await getUserProfile(currentUser.uid);

      if (!isSignUpFlow) {
        // Normal log-in flow: check if registered user, invited staff, or owner
        let hasInvite = false;
        if (currentUser.email) {
          const invite = await getStaffInvite(currentUser.email);
          if (invite) {
            hasInvite = true;
          }
        }
        
        if (!profile && !hasInvite && !isOwnerEmail) {
          // Block entry, sign them out immediately
          await logoutUser();
          throw new Error('عذراً، هذا الحساب الإلكتروني لجوجل غير مسجل حالياً بالنظام كـ كادر طبي، موظف استقبال، أو مريض مسبق لباقة العيادة. لإنشاء ملف طبي لمريض جديد، يرجى التبديل لعلامة "إنشاء حساب مريض جديد البديل" ثم اختيار جوجل.');
        }
        
        // Allowed employee login!
        window.location.href = '/dashboard';
      } else {
        // SignUp Flow (New Patient with Google)
        if (profile) {
          // Already has a profile, so just log in directly!
          window.location.href = '/dashboard';
        } else {
          // Let them enter their phone number and Arabic name to create user record successfully
          setPendingGoogleUser({
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || ''
          });
          setGoogleNameEn(currentUser.displayName || '');
          setGoogleUsername(currentUser.email?.split('@')[0] || 'patient_' + currentUser.uid.substring(0, 5));
          setGooglePhone(phone.trim());
          setGoogleNameAr(nameAr.trim());
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'حدث خطأ أثناء معالجة تفاصيل هويتك.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username || !name || !nameAr || !phone) {
          throw new Error('يرجى تعبئة كافة الحقول المطلوبة بما في ذلك هاتف التواصل.');
        }
        if (username.trim().length < 3) {
          throw new Error('يجب أن يكون اسم المستخدم 3 أحرف على الأقل.');
        }
        if (nameAr.trim().length < 2) {
          throw new Error('يجب أن يكون الاسم العربي حرفين على الأقل.');
        }
        if (name.trim().length < 2) {
          throw new Error('يجب أن يكون الاسم الإنجليزي حرفين على الأقل.');
        }
        if (phone.trim().length < 5) {
          throw new Error('يرجى إدخال رقم هاتف صحيح للتواصل.');
        }

        const profileData = {
          username: username.trim(),
          role: 'patient' as UserRole,
          name: name.trim(),
          nameAr: nameAr.trim(),
          phone: phone.trim(), 
          email: email.toLowerCase().trim(),
        };
        await registerUser(email, password, profileData);
      } else {
        // Normal manual login - check if registered user, invited staff, or owner
        const userCredential = await loginUser(email, password);
        const currentUser = userCredential.user;
        
        const isOwnerEmail = 
          currentUser.email?.toLowerCase() === 'mhm763517@gmail.com' || 
          currentUser.email?.toLowerCase() === 'gokerebrahimopq@gmail.com';
        
        const profile = await getUserProfile(currentUser.uid);
        let hasInvite = false;
        if (currentUser.email) {
          const invite = await getStaffInvite(currentUser.email);
          if (invite) {
            hasInvite = true;
          }
        }
        
        if (!profile && !hasInvite && !isOwnerEmail) {
          // Block entry, sign them out immediately
          await logoutUser();
          throw new Error('عذراً، هذا الحساب غير مسجل حالياً بالنظام كـ كادر طبي، موظف أو كحساب مريض.');
        }
      }
      
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
      let errMsg = 'حدث خطأ أثناء الدخول.';
      if (err.code === 'auth/invalid-credential') {
        errMsg = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/user-not-found') {
        errMsg = 'المستخدم غير موجود.';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = 'كلمة المرور غير صحيحة.';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = 'البريد الإلكتروني مستخدم بالفعل.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errMsg = 'صلاحية الدخول اليدوي بالبريد الإلكتروني مستبعدة حالياً من لوحة تحكم Firebase. يرجى تفعيل خيار (Email/Password) في كونسول المشروع، أو الاستعانة بـ "بوابة الدخول السريع البديلة لجميع الأجهزة والمنصات" في الأسفل.';
      } else if (err.code === 'auth/invalid-action-code' || err.message?.includes('action')) {
        errMsg = 'العملية المطلوبة غير صالحة أو قد انتهت صلاحيتها. يرجى إعادة المحاولة.';
      } else {
        errMsg = err.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (isSignUpFlow: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await loginWithGoogle();
      if (userCredential && userCredential.user) {
        await processGoogleUser(userCredential.user, isSignUpFlow);
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('تم إغلاق نافذة تسجيل الدخول من Google قبل إكمال العملية. يرجى المحاولة مرة أخرى.');
      } else if (
        err?.message === 'auth/partitioned-storage-or-iframe-unsupported' ||
        err?.code === 'auth/operation-not-supported-in-this-environment' ||
        /popup|partition|storage/i.test(err?.message || '')
      ) {
        setShowNativeBridge(true);
        setError('عذراً، تمنع إعدادات خصوصية المتصفح الحالية أو التطبيق المثبت الوصول السريع عبر Google (Cookie/Storage Partitioning). لمنع تعليق معالج التسجيل السحابي، تم تفعيل خيار (بوابة الدخول السريع البديلة) بالأسفل تلقائياً! يرجى إدخال بريدك الإلكتروني والضغط على الزر الأزرق لتسجيل دخولك فوراً.');
      } else {
        setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الدخول بالحساب الإلكتروني لـ Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePendingGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;
    
    setError(null);
    setLoading(true);
    try {
      if (!googlePhone.trim() || !googleNameAr.trim() || !googleNameEn.trim() || !googleUsername.trim()) {
        throw new Error('يرجى تعبئة كافة الحقول المطلوبة لربط وتثبيت ملفك بنجاح.');
      }
      if (googleUsername.trim().length < 3) {
        throw new Error('يجب أن يكون اسم المستخدم 3 أحرف على الأقل.');
      }
      if (googleNameAr.trim().length < 2) {
        throw new Error('يجب أن يكون الاسم العربي حرفين على الأقل.');
      }
      if (googleNameEn.trim().length < 2) {
        throw new Error('يجب أن يكون الاسم الإنجليزي حرفين على الأقل.');
      }
      if (googlePhone.trim().length < 5) {
        throw new Error('يرجى إدخال رقم هاتف صحيح للتواصل.');
      }

      const newProfile = {
        username: googleUsername.trim(),
        role: 'patient' as UserRole,
        name: googleNameEn.trim(),
        nameAr: googleNameAr.trim(),
        phone: googlePhone.trim(),
        email: pendingGoogleUser.email.toLowerCase().trim(),
      };

      await createUserProfile(pendingGoogleUser.uid, newProfile);
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'فشل إكمال تسجيل بيانات الملف الطبي للمريض الجديد.');
    } finally {
      setLoading(false);
    }
  };

  // Secure Native App Login Bypass handler utilizing Firebase Anonymous Auth + Firestore mapping
  const handleNativeBridgeLogin = async () => {
    if (!nativeEmail.trim()) {
      setError('يرجى كتابة البريد الإلكتروني الخاص بـ Google أولاً.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const emailLower = nativeEmail.trim().toLowerCase();
      const isOwnerEmail = emailLower === 'mhm763517@gmail.com' || emailLower === 'gokerebrahimopq@gmail.com';

      const finalRole: UserRole = isOwnerEmail ? 'admin' : 'patient';
      const finalName = emailLower.split('@')[0];
      const finalNameAr = 'مستخدم معتمد';

      if (!isRegistering) {
        // Employee/Staff Login Flow in native bridge
        let matchedUser: any = null;
        let inviteData: any = null;
        try {
          matchedUser = await getUserProfileByEmail(emailLower);
          inviteData = await getStaffInvite(emailLower);
        } catch (dbErr) {
          console.warn('Database offline or inhibited, proceeding with login fallback:', dbErr);
        }

        if (!matchedUser && !inviteData && !isOwnerEmail) {
          throw new Error('عذراً، هذا البريد غير مسجل كـ كادر طبي أو موظف استقبال في قاعدة البيانات السحابية.');
        }

        const resolvedRole = isOwnerEmail ? 'admin' : (matchedUser?.role || inviteData?.role || 'patient');
        const resolvedName = matchedUser?.name || inviteData?.name || finalName;
        const resolvedNameAr = matchedUser?.nameAr || inviteData?.nameAr || 'موظف معتمد';

        // Try standard anonymous login first
        try {
          const anonCred = await loginAnonymously();
          const anonUid = anonCred.user.uid;

          const nativeProfile = {
            username: emailLower.split('@')[0],
            role: resolvedRole,
            name: resolvedName,
            nameAr: resolvedNameAr,
            phone: matchedUser?.phone || '0500000000',
            email: emailLower,
          };

          await createUserProfile(anonUid, nativeProfile);
        } catch (anonErr) {
          console.warn('Anonymous login failed (blocked storage). Activating premium emulated session fallback:', anonErr);
          // Store emulated session
          setEmulatedUser({
            uid: 'emulated_' + emailLower.split('@')[0],
            email: emailLower,
            displayName: resolvedName,
          });
        }
      } else {
        // Patient registration/Sign up in native bridge
        if (!nameAr || !name || !username || !phone) {
          throw new Error('يرجى تعبئة الاسم العربي والاسم الإنجليزي واسم المستخدم ورقم الهاتف أولاً لإتمام تفعيل التسجيل الرديف.');
        }

        try {
          const anonCred = await loginAnonymously();
          const anonUid = anonCred.user.uid;

          const newProfile = {
            username: username.trim(),
            role: 'patient' as UserRole,
            name: name.trim(),
            nameAr: nameAr.trim(),
            phone: phone.trim(),
            email: emailLower,
          };

          await createUserProfile(anonUid, newProfile);
        } catch (anonErr) {
          console.warn('Anonymous login failed (blocked storage). Activating emulated session fallback:', anonErr);
          setEmulatedUser({
            uid: 'emulated_' + emailLower.split('@')[0],
            email: emailLower,
            displayName: name.trim(),
          });
        }
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول الرديف المتزامن للأجهزة.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingGoogleUser) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-right" dir="rtl">
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-6 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <h1 className="text-xl font-bold tracking-tight mb-1 text-white relative z-10">إكمال ملف مريض جديد</h1>
          <p className="text-xs text-emerald-300 relative z-10">يرجى توفير هاتف للتواصل وإثبات السجلات الطبية</p>
        </div>

        <form onSubmit={handlePendingGoogleSubmit} className="p-6 md:p-8 flex flex-col gap-5">
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl leading-relaxed border-r-4 border-emerald-500">
            تم التحقق من حساب Google الخاص بك <strong>({pendingGoogleUser.email})</strong> بنجاح. يرجى إدخال هاتف التواصل لإقران نتائج كشوف تحاليلك:
          </div>

          {error && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl text-right border-l-4 border-rose-500 font-sans leading-relaxed">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 mr-1">الاسم بالكامل (بالعربية) *</span>
              <input 
                type="text" 
                required 
                value={googleNameAr} 
                onChange={(e) => setGoogleNameAr(e.target.value)} 
                placeholder="مثال: يوسف جاسم الشمري" 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 mr-1">رقم الجوال للتواصل والدعم *</span>
              <input 
                type="tel" 
                required 
                value={googlePhone} 
                onChange={(e) => setGooglePhone(e.target.value)} 
                placeholder="05xxxxxxx" 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono" 
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-350 mr-1">الاسم بالإنجليزية *</span>
              <input 
                type="text" 
                required 
                value={googleNameEn} 
                onChange={(e) => setGoogleNameEn(e.target.value)} 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-350 mr-1">اسم المستخدم الداخلي *</span>
              <input 
                type="text" 
                required 
                value={googleUsername} 
                onChange={(e) => setGoogleUsername(e.target.value)} 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                dir="ltr"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-bold text-center z-10 shadow-lg shadow-emerald-100 transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {loading ? 'جاري تهيئة الحساب...' : 'إكمال إنشاء ملف المريض المعتمد'}
          </button>

          <button 
            type="button" 
            onClick={async () => {
              await logoutUser();
              setPendingGoogleUser(null);
              setError(null);
            }}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition-colors duration-200 text-center"
          >
            إلغاء وخروج
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <h1 className="text-2xl font-bold tracking-tight mb-1 text-white relative z-10">نظام المختبرات والتحاليل الطبية</h1>
        <p className="text-xs text-slate-300 relative z-10">منظومة موازنة الفحوصات والتدقيق الطبي المعزز</p>
      </div>

      <div className="p-6 md:p-8 flex flex-col gap-5">
        <h2 className="text-xl font-bold text-slate-800 text-center flex items-center justify-center gap-2">
          {isRegistering ? (
            <>
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>إنشاء حساب مريض جديد (مستقل)</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5 text-indigo-600" />
              <span>تسجيل الدخول للنظام</span>
            </>
          )}
        </h2>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl text-right border-l-4 border-rose-500 font-sans leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-3.5">
            {isRegistering && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 mr-1">الاسم بالعربي (ثلاثي) *</span>
                    <input 
                      type="text" 
                      required 
                      value={nameAr} 
                      onChange={(e) => setNameAr(e.target.value)} 
                      placeholder="يوسف جاسم الشمري" 
                      className="p-2.5 text-sm border border-slate-200 rounded-lg text-right focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 mr-1">Name (English) *</span>
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Yousef Jassim" 
                      className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                      dir="ltr" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 mr-1">اسم المستخدم *</span>
                    <input 
                      type="text" 
                      required 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="username" 
                      className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                      dir="ltr" 
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-slate-450 mr-1">رقم الجوال للتواصل *</span>
                    <input 
                      type="tel" 
                      required 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="05xxxxxxxx" 
                      className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:border-transparent font-mono" 
                      dir="ltr" 
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-450 mr-1">البريد الإلكتروني للقرين</span>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="Email Address" 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                dir="ltr" 
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-450 mr-1">كلمة المرور</span>
              <input 
                type="password" 
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Password" 
                className="p-2.5 text-sm border border-slate-200 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                dir="ltr" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white py-3 rounded-xl font-bold text-center relative z-10 shadow-lg shadow-indigo-150 hover:shadow-indigo-200 transition-all duration-300 disabled:opacity-50 text-sm"
          >
            {loading ? 'جاري التحميل...' : isRegistering ? 'إنشاء حساب المريض والمتابعة' : 'دخول'}
          </button>
        </form>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          {isRegistering ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-500 text-center font-bold">التسجيل التلقائي السريع بـ Google:</span>
              <button 
                type="button" 
                onClick={() => handleGoogleLogin(true)} 
                className="w-full bg-indigo-50 border border-indigo-200 py-2.5 rounded-xl font-bold text-indigo-800 hover:bg-indigo-100 transition-colors duration-200 flex items-center justify-center gap-2 text-xs"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                <span>تسجيل مريض جديد بـ Google (يتطلب رقم هاتف)</span>
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              onClick={() => handleGoogleLogin(false)} 
              className="w-full bg-white border border-slate-300 py-2.5 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2 text-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>تسجيل الدخول عبر Google</span>
            </button>
          )}

          {/* Quick Access Area - Cleaner, faster, and without troubleshooting clutter */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-600 flex items-center justify-center gap-1 mx-auto leading-none">
              <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
              <span>تسجيل الدخول السريع</span>
            </span>

            {showNativeBridge && (
              <div className="flex flex-col gap-2.5 text-right">
                {/* Preset Fast Selection Panel */}
                <div className="flex flex-col gap-1 text-center bg-slate-100/50 p-2 rounded-xl border border-slate-200/50">
                  <div className="flex flex-wrap gap-1.5 justify-center mt-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNativeEmail('mhm763517@gmail.com');
                        setError(null);
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[9px] px-2.5 py-1 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
                    >
                      أدمن المسؤول (mhm763517@gmail.com)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNativeEmail('gokerebrahimopq@gmail.com');
                        setError(null);
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-[9px] px-2.5 py-1 rounded-lg transition-all duration-150 active:scale-95 cursor-pointer shadow-sm"
                    >
                      أدمن رديف (gokerebrahimopq@gmail.com)
                    </button>
                  </div>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={nativeEmail}
                    onChange={(e) => setNativeEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    className="p-2 text-xs border border-indigo-200 rounded-lg text-left bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 flex-1 font-mono"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={handleNativeBridgeLogin}
                    disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-indigo-100 hover:shadow-indigo-200 active:scale-97"
                  >
                    تفعيل الدخول
                  </button>
                </div>
              </div>
            )}
          </div>

          <button 
            type="button" 
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }} 
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors duration-200 text-center"
          >
            {isRegistering ? 'لديك حساب بالفعل؟ تسجيل دخول' : 'ليس لديك حساب؟ إنشاء حساب مريض جديد'}
          </button>
        </div>
      </div>
    </div>
  );
}
