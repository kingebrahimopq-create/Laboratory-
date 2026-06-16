import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';

type AuthMode = 'owner' | 'patient';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientName, setPatientName] = useState('');

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // التحقق من أن البريد الإلكتروني هو بريد المالك المسموح
      if (email !== 'mhm763517@gmail.com') {
        setError('بريد إلكتروني غير مصرح');
        setLoading(false);
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // تخزين معلومات المالك في localStorage
      if (data.user) {
        localStorage.setItem('userRole', 'OWNER');
        localStorage.setItem('userId', data.user.id);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // البحث عن المريض في قاعدة البيانات
      const response = await fetch('/api/patients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: patientPhone, name: patientName }),
      });

      if (!response.ok) {
        throw new Error('المريض غير موجود');
      }

      const patient = await response.json();
      localStorage.setItem('userRole', 'PATIENT');
      localStorage.setItem('patientId', patient.id);
      localStorage.setItem('patientPhone', patientPhone);
      window.location.href = '/patient-results';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الوصول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* الشعار والعنوان */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">🏥</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">المختبر الطبي</h1>
          <p className="text-gray-600">نظام إدارة التحاليل الطبية</p>
        </div>

        {/* بطاقة التحكم */}
        <Card className="shadow-2xl border-0">
          {/* تبديل الأوضاع */}
          <div className="flex gap-2 p-6 border-b border-gray-200">
            <button
              onClick={() => setMode('patient')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                mode === 'patient'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              المريض
            </button>
            <button
              onClick={() => setMode('owner')}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                mode === 'owner'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              المالك
            </button>
          </div>

          {/* نموذج تسجيل الدخول */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {mode === 'patient' ? (
              <form onSubmit={handlePatientAccess} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المريض
                  </label>
                  <Input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <Input
                    type="tel"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="أدخل رقم هاتفك"
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  {loading ? 'جاري البحث...' : 'الوصول إلى النتائج'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOwnerLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mhm763517@gmail.com"
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-2 rounded-lg transition-all"
                >
                  {loading ? 'جاري تسجيل الدخول...' : 'دخول لوحة التحكم'}
                </Button>
              </form>
            )}
          </div>
        </Card>

        {/* تذكير الأمان */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <p className="text-sm text-blue-700">
            🔒 بيانات آمنة ومشفرة بالكامل
          </p>
        </div>
      </div>
    </div>
  );
}
