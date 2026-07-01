import { useState, useEffect } from 'react';
import { RefreshCw, X, CheckCircle, Sparkles } from 'lucide-react';
import versionData from '../../public/version.json';

const CURRENT_APP_VERSION = versionData.version; // Local packaged assets version

const LIVE_SERVER_URL = (typeof window !== 'undefined' && window.location && !['localhost', '127.0.0.1'].includes(window.location.hostname) && window.location.protocol.startsWith('http')) 
  ? window.location.origin 
  : "https://ais-pre-mjlwmtw3ijcfapmaundkrn-408983991079.europe-west2.run.app";

function isNewerVersion(remote: string, local: string): boolean {
  const rParts = remote.split('.').map(Number);
  const lParts = local.split('.').map(Number);
  for (let i = 0; i < Math.max(rParts.length, lParts.length); i++) {
    const r = rParts[i] || 0;
    const l = lParts[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

interface InAppUpdateProps {
  inline?: boolean;
}

export function InAppUpdate({ inline }: InAppUpdateProps) {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [remoteDesc, setRemoteDesc] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check for updates
  const checkForUpdate = async () => {
    try {
      setChecking(true);
      const GITHUB_RAW_VERSION_URL = "https://raw.githubusercontent.com/kingebrahimopq-create/Laboratory-/main/public/version.json";
      const response = await fetch(`${GITHUB_RAW_VERSION_URL}?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch remote version from GitHub');
      
      const data = await response.json();
      
      if (isNewerVersion(data.version, CURRENT_APP_VERSION)) {
        setRemoteVersion(data.version);
        setRemoteDesc(data.description || 'تحديث عام للأداء والميزات الجديدة.');
        setUpdateAvailable(true);
      } else {
        setUpdateAvailable(false);
      }
    } catch (error) {
      try {
        const response = await fetch(`${LIVE_SERVER_URL}/version.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Failed to fetch remote version from Live Server');
        
        const data = await response.json();
        
        if (isNewerVersion(data.version, CURRENT_APP_VERSION)) {
          setRemoteVersion(data.version);
          setRemoteDesc(data.description || 'تحديث عام للأداء والميزات الجديدة.');
          setUpdateAvailable(true);
        } else {
          setUpdateAvailable(false);
        }
      } catch (fallbackError) {
        console.warn('Update check failed:', fallbackError);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = async () => {
    setUpdating(true);
    setToastMessage('جاري تنزيل وتثبيت حزمة التحديث الذكية...');

    setTimeout(() => {
      try {
        localStorage.setItem('current_applied_version', remoteVersion);
        localStorage.setItem('capacitor_live_url', LIVE_SERVER_URL);
        setToastMessage('اكتمل التحديث بنجاح! جاري تشغيل النسخة الجديدة...');
        
        setTimeout(() => {
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              for (const registration of registrations) {
                registration.unregister();
              }
            });
          }
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Update apply error:', err);
        setToastMessage('حدث خطأ أثناء تثبيت التحديث. يرجى المحاولة لاحقاً.');
        setUpdating(false);
      }
    }, 2000);
  };

  // If we are inline (sidebar)
  if (inline) {
    return (
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-right relative overflow-hidden">
        {updateAvailable ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="bg-amber-100 text-amber-800 text-[9px] px-2 py-0.5 rounded-md font-bold">تحديث متاح</span>
              <h4 className="text-xs font-bold text-slate-800">تحديث جديد متوفر: v{remoteVersion}</h4>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {remoteDesc}
            </p>
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold py-2 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${updating ? 'animate-spin' : ''}`} />
              <span>بدء تحديث النظام الفوري</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center text-center py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-1">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h4 className="text-xs font-bold text-slate-800">النظام محدث ومؤرشف بالكامل</h4>
            <p className="text-[10px] text-slate-400">الإصدار النشط حالياً: v{CURRENT_APP_VERSION}</p>
            
            <button
              onClick={checkForUpdate}
              disabled={checking}
              className="mt-2 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer bg-white border border-slate-100 px-3 py-1 rounded-md shadow-sm"
            >
              <RefreshCw className={`w-3 h-3 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'جاري التحقق...' : 'فحص التحديثات النشطة'}</span>
            </button>
          </div>
        )}

        {toastMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 p-3 text-center select-none z-10">
            <p className="text-[11px] font-bold text-white leading-normal">{toastMessage}</p>
          </div>
        )}
      </div>
    );
  }

  // Fallback / default floating mode (for other non-dashboard pages)
  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg">
      <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gray-900/95 p-5 shadow-[0_10px_40px_rgba(99,102,241,0.2)] backdrop-blur-md">
        <div className="relative flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-teal-400 text-white shadow-md">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-semibold text-indigo-400">يتوفر تحديث جديد للتطبيق!</h4>
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

          <p className="text-right text-xs leading-relaxed text-gray-300">
            {remoteDesc}
          </p>

          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 px-4 py-2.5 text-xs font-medium text-white shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${updating ? 'animate-spin' : ''}`} />
              <span>اضغط للتحديث الفوري</span>
            </button>
            
            <button
              onClick={() => setUpdateAvailable(false)}
              disabled={updating}
              className="rounded-xl border border-gray-700 bg-gray-800/50 px-3.5 py-2.5 text-xs font-medium text-gray-400 hover:bg-gray-850 hover:text-gray-300 transition-colors cursor-pointer"
            >
              لاحقاً
            </button>
          </div>
        </div>

        {toastMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/98 px-4 text-center select-none">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <p className="text-xs font-semibold text-white">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const clearLiveUpdateCache = () => {
  localStorage.removeItem('capacitor_live_url');
  localStorage.removeItem('current_applied_version');
  window.location.reload();
};
