import React, { useEffect, useState } from 'react';
import { RefreshCw, ArrowDownToLine, X, CheckCircle2 } from 'lucide-react';

interface VersionInfo {
  version: string;
  buildTime: number;
  description: string;
}

const LOCAL_VERSION_KEY = 'lis_app_installed_version';

export function UpdateBanner() {
  const [available, setAvailable] = useState(false);
  const [remoteInfo, setRemoteInfo] = useState<VersionInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const res = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const remote: VersionInfo = await res.json();
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(LOCAL_VERSION_KEY);
      } catch (e) {
        console.warn('localStorage is not accessible:', e);
      }
      if (stored === null) {
        // First-time user — silently register current version, no banner
        try {
          localStorage.setItem(LOCAL_VERSION_KEY, remote.version);
        } catch {}
        return;
      }
      if (stored !== remote.version) {
        setRemoteInfo(remote);
        setAvailable(true);
      }
    } catch {
    }
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      if (remoteInfo) {
        try {
          localStorage.setItem(LOCAL_VERSION_KEY, remoteInfo.version);
        } catch {}
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  if (!available || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center" dir="rtl">
      <div className="bg-indigo-950 text-white rounded-2xl shadow-2xl border border-indigo-800 p-4 max-w-md w-full flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={() => setDismissed(true)}
            className="text-indigo-400 hover:text-white transition-colors shrink-0 mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1 text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="text-sm font-extrabold text-white">تحديث جديد متاح</span>
              <ArrowDownToLine className="w-4 h-4 text-indigo-300" />
            </div>
            {remoteInfo && (
              <p className="text-[11px] text-indigo-300 leading-relaxed">
                الإصدار <span className="font-mono font-bold text-indigo-200">{remoteInfo.version}</span> — {remoteInfo.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => setDismissed(true)}
            className="text-[11px] text-indigo-400 hover:text-indigo-200 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            لاحقاً
          </button>
          <button
            onClick={handleUpdate}
            disabled={updating}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-[11px] font-bold px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-lg"
          >
            {updating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{updating ? 'جاري التحديث...' : 'تحديث الآن (بدون حذف)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
