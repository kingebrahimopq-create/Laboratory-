import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { supabase } from '../lib/supabase';

export function AuthPage() {
  const [mode, setMode] = useState<'PATIENT' | 'OWNER'>('PATIENT');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      localStorage.setItem('userRole', 'OWNER');
      window.location.reload();
    } catch (err: any) {
      alert('خطأ في تسجيل الدخول: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // منطق الدخول للمريض برقم الهاتف والاسم
      localStorage.setItem('userRole', 'PATIENT');
      localStorage.setItem('patientPhone', phone);
      localStorage.setItem('patientName', name);
      window.location.reload();
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-gradient overflow-hidden">
      <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
      
      <Card className="w-full max-w-md glass-morphism shadow-2xl relative z-10 border-none">
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-4xl">🏥</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">مختبرنا الطبي</h1>
            <p className="text-gray-600 mt-2">نعتني بصحتك بدقة واحترافية</p>
          </div>

          <div className="flex p-1 bg-gray-100/50 rounded-xl mb-8">
            <button
              onClick={() => setMode('PATIENT')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'PATIENT' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              دخول مريض
            </button>
            <button
              onClick={() => setMode('OWNER')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'OWNER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              دخول الإدارة
            </button>
          </div>

          {mode === 'PATIENT' ? (
            <form onSubmit={handlePatientAccess} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                  placeholder="أدخل اسمك كما هو مسجل"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                  placeholder="01xxxxxxxxx"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transform active:scale-[0.98] transition-all"
              >
                {loading ? 'جاري التحقق...' : 'عرض النتائج'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOwnerLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                  placeholder="admin@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white/50"
                  placeholder="••••••••"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-6 bg-gradient-to-r from-blue-800 to-blue-900 text-white rounded-xl font-bold text-lg hover:shadow-lg transform active:scale-[0.98] transition-all"
              >
                {loading ? 'جاري تسجيل الدخول...' : 'دخول النظام'}
              </Button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">جميع الحقوق محفوظة © مختبرنا الطبي 2026</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
