import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // حساب المالك الثابت
  const OWNER_EMAIL = "mhm763517@gmail.com";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // إذا كان البريد هو بريد المالك، نستخدم تسجيل الدخول العادي أو Google
      if (email === OWNER_EMAIL) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        localStorage.setItem('userRole', 'OWNER');
        localStorage.setItem('userEmail', email);
        window.location.reload();
      } else if (email && password) {
        // تسجيل دخول الموظفين (سيتم التحقق من الصلاحيات لاحقاً)
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
        
        localStorage.setItem('userRole', 'STAFF');
        localStorage.setItem('userEmail', email);
        window.location.reload();
      } else if (name && phone) {
        // دخول المريض أو تسجيل جديد
        localStorage.setItem('userRole', 'PATIENT');
        localStorage.setItem('patientPhone', phone);
        localStorage.setItem('patientName', name);
        window.location.reload();
      } else {
        setError("يرجى إدخال البيانات المطلوبة بشكل صحيح");
      }
    } catch (err: any) {
      setError(err.message === "Invalid login credentials" ? "بيانات الدخول غير صحيحة" : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>
      </div>

      <Card className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 overflow-hidden rounded-3xl">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-6 transform hover:scale-110 transition-transform duration-500">
              <span className="text-4xl">🏥</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">مختبرنا الطبي</h1>
            <p className="text-blue-200/60 mt-2 font-medium">بيئة طبية حقيقية وآمنة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* قسم دخول المريض / تسجيل جديد */}
            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest px-1">دخول المرضى</h3>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="الاسم الكامل للمريض"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="رقم الهاتف"
              />
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-transparent px-2 text-white/30">أو دخول الإدارة</span></div>
            </div>

            {/* قسم دخول الإدارة / الطبيب */}
            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="البريد الإلكتروني (المالك/الموظف)"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="كلمة المرور"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-shake">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-7 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transform active:scale-[0.98] transition-all duration-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>جاري التحقق...</span>
                </div>
              ) : 'دخول النظام'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em]">نظام إدارة المختبرات الطبية الموحد • 2026</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
