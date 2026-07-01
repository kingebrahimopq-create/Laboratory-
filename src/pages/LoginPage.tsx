import { LoginForm } from '../components/auth/LoginForm';
import { Activity, ShieldCheck, FileCheck } from 'lucide-react';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans text-right bg-gray-50/50" dir="rtl">
      <div className="relative z-10 w-full max-w-md flex justify-center">
        <LoginForm />
      </div>
    </div>
  );
}

