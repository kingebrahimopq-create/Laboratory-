import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getEmulatedUser } from '../../lib/auth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emulated = getEmulatedUser();
    if (emulated) {
      setUser(emulated);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-500 opacity-25" />
          <span className="relative inline-flex h-10 w-10 rounded-full bg-indigo-600" />
        </div>
        <p className="text-sm text-gray-400 tracking-wide" dir="rtl">جاري التحقق من الهوية...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  return children;
}
