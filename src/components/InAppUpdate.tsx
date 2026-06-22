import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle } from 'lucide-react';

const LOCAL_VERSION_KEY = 'lis_app_installed_version';

export function InAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [remoteDesc, setRemoteDesc] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const checkForUpdate = async () => {
    try {
      const response = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      let installed: string | null = null;
      try {
        installed = localStorage.getItem(LOCAL_VERSION_KEY);
      } catch (e) {
        console.warn('localStorage is not accessible:', e);
      }
      if (installed === null) {
        // First-time user — silently register current version, no banner
        try {
          localStorage.setItem(LOCAL_VERSION_KEY, data.version);
        } catch {}
        return;
      }
      if (installed !== data.version) {
        setRemoteVersion(data.version);
        setRemoteDesc(data.description || 'تحديث عام للأداء والميزات.');
        setUpdateAvailable(true);
      }
    } catch {
    }
  };

  useEffect(() => {
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = async () => {
    setUpdating(true);
    setToastMessage('جاري تثبيت التحديث...');
    try {
      try {
        localStorage.setItem(LOCAL_VERSION_KEY, remoteVersion);
      } catch {}
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      setToastMessage('اكتمل التحديث! جاري إعادة تشغيل النسخة الجديدة...');
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setToastMessage('حدث خطأ، جاري إعادة التحميل...');
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gray-900/95 p-5 shadow-2xl backdrop-blur-md">
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-teal-500/10 blur-xl" />

        <div className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-semibold text-emerald-400">تحديث جديد متاح!</h4>
                <p className="text-xs text-gray-400 font-mono">الإصدار: v{remoteVersion}</p>
              </div>
            </div>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              disabled={updating}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <p className="text-right text-xs leading-relaxed text-gray-300" dir="rtl">
            {remoteDesc}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-medium text-white shadow-lg disabled:opacity-50 transition-all cursor-pointer hover:from-emerald-400 hover:to-teal-400"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              <span>تحديث فوري (بدون حذف التطبيق)</span>
            </button>
            <button
              onClick={() => setUpdateAvailable(false)}
              disabled={updating}
              className="rounded-xl border border-gray-700 bg-gray-800/50 px-3.5 py-2.5 text-xs font-medium text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/98 px-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <p className="text-xs font-semibold text-white" dir="rtl">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const clearLiveUpdateCache = () => {
  try {
    localStorage.removeItem(LOCAL_VERSION_KEY);
  } catch {}
  window.location.reload();
};
