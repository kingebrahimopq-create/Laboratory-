import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X, CheckCircle } from 'lucide-react';
import versionData from '../../public/version.json';

const CURRENT_APP_VERSION = versionData.version; // Local packaged assets version
const LIVE_SERVER_URL = "https://ais-dev-z7rplyyo3zns5mj2pca2sa-921433797673.europe-west2.run.app";

export function InAppUpdate() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checking, setChecking] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const [remoteDesc, setRemoteDesc] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check on startup if we have a persisted live URL redirect
  useEffect(() => {
    const savedLiveUrl = localStorage.getItem('capacitor_live_url');
    const isLocalHost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // If we have a saved live URL and we are currently on localhost, redirect immediately on load!
    if (savedLiveUrl && isLocalHost) {
      console.log('Redirecting to saved live URL:', savedLiveUrl);
      window.location.href = savedLiveUrl;
    }
  }, []);

  // Check for updates
  const checkForUpdate = async () => {
    const isLiveServer = window.location.origin.includes("run.app") || window.location.origin === LIVE_SERVER_URL;
    if (isLiveServer) {
      console.log('App is running directly on the live server. Skipping local cache update check.');
      return;
    }

    try {
      setChecking(true);
      // Fetch version.json from the live server to bypass local caching
      const response = await fetch(`${LIVE_SERVER_URL}/version.json?t=${Date.now()}`);
      if (!response.ok) throw new Error('Failed to fetch remote version');
      
      const data = await response.json();
      console.log('Local version:', CURRENT_APP_VERSION, 'Remote version:', data.version);
      
      // Check if remote version is different
      const savedVersion = localStorage.getItem('current_applied_version') || CURRENT_APP_VERSION;
      
      if (data.version !== CURRENT_APP_VERSION || data.version !== savedVersion) {
        setRemoteVersion(data.version);
        setRemoteDesc(data.description || 'تحديث عام للأداء والميزات الجديدة.');
        setUpdateAvailable(true);
      } else {
        console.log('App is completely up to date.');
      }
    } catch (error) {
      console.warn('Silent update check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Run update check on mount
    checkForUpdate();
    
    // Periodically check every 5 minutes
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = async () => {
    setUpdating(true);
    setToastMessage('جاري تنزيل وتثبيت حزمة التحديث الذكية...');

    setTimeout(() => {
      try {
        // Save remote version as the active applied version
        localStorage.setItem('current_applied_version', remoteVersion);
        
        // Save the live URL so next app launches load directly from Cloud Run
        localStorage.setItem('capacitor_live_url', LIVE_SERVER_URL);
        
        setToastMessage('اكتمل التحديث بنجاح! جاري تشغيل النسخة الجديدة...');
        
        // Stagger load for nice user experience
        setTimeout(() => {
          // Force reload/redirect to the live server URL, or reload of current page if already running there
          if (window.location.href.startsWith(LIVE_SERVER_URL)) {
            // Unregister service workers if any, clear caches, and reload
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.getRegistrations().then((registrations) => {
                for (const registration of registrations) {
                  registration.unregister();
                }
              });
            }
            window.location.reload();
          } else {
            window.location.href = LIVE_SERVER_URL;
          }
        }, 1500);
      } catch (err) {
        console.error('Update apply error:', err);
        setToastMessage('حدث خطأ أثناء تثبيت التحديث. يرجى المحاولة لاحقاً.');
        setUpdating(false);
      }
    }, 2000);
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-lg animate-bounce-slow">
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gray-900/95 p-5 shadow-[0_10px_40px_rgba(16,185,129,0.2)] backdrop-blur-md">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl" />
        <div className="absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-teal-500/10 blur-xl" />

        <div className="relative flex flex-col gap-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </div>
              <div className="dir-rtl text-right">
                <h4 className="text-sm font-semibold text-emerald-400">يتوفر تحديث جديد للتطبيق!</h4>
                <p className="text-xs text-gray-400 font-mono">الإصدار: v{remoteVersion}</p>
              </div>
            </div>
            <button 
              onClick={() => setUpdateAvailable(false)}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-800 hover:text-gray-300 transition-colors"
              disabled={updating}
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Description */}
          <p className="text-right text-xs leading-relaxed text-gray-300 dir-rtl">
            {remoteDesc}
          </p>

          {/* Action Button */}
          <div className="mt-1 flex items-center justify-between gap-3">
            <button
              onClick={handleApplyUpdate}
              disabled={updating}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-xs font-medium text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 transition-all cursor-pointer"
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

        {/* Floating Toast Notification inside banner */}
        {toastMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/98 px-4 text-center select-none transition-opacity duration-300 animate-fade-in">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400 animate-scale-up" />
              <p className="text-xs font-semibold text-white dir-rtl">{toastMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Add a super slick helper button somewhere in settings if needed, or trigger reset via logo
export const clearLiveUpdateCache = () => {
  localStorage.removeItem('capacitor_live_url');
  localStorage.removeItem('current_applied_version');
  window.location.reload();
};
