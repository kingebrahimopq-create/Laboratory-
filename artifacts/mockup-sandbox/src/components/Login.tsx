import { supabase } from '../lib/supabase';
import { Button } from './ui/button';

export function Login() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) console.error('Error logging in with Google:', error.message);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold">تسجيل الدخول</h2>
      <Button onClick={handleGoogleLogin} className="w-full max-w-xs">
        تسجيل الدخول بواسطة Google
      </Button>
    </div>
  );
}
