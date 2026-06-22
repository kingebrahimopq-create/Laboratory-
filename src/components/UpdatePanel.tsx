import React, { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertTriangle, GitPullRequest, Settings, Terminal, ShieldAlert } from "lucide-react";
import { GithubStatus } from "../types";

export function UpdatePanel() {
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [isAutoSync, setIsAutoSync] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/github/status");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setIsAutoSync(data.syncEnabled);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualPull = async () => {
    setLoading(true);
    setMsg("جاري تحميل أحدث الملفات والتحديثات من مستودع GitHub...");
    try {
      const res = await fetch("/api/github/pull", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setMsg("تم تثبيت التحديث وتحديث جميع ملفات التطبيق بنجاح! جاري التحديث...");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const errData = await res.json();
        setMsg(`خطأ أثناء تطبيق التحديث: ${errData.error || "خطأ مجهول"}`);
      }
    } catch (err: any) {
      setMsg(`فشل الاتصال ميكانيكياً: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSync = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/github/toggle-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
      if (res.ok) {
        setIsAutoSync(enabled);
        if (status) {
          setStatus({ ...status, syncEnabled: enabled });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const hasUpdate = status && status.currentSha !== status.latestSha;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl text-slate-100 max-w-md w-full mx-auto" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-5 h-5 text-teal-400 animate-pulse" />
          <h3 className="font-sans font-semibold text-sm text-slate-200">مركز تحديثات المستودع (GitHub Auto-Sync)</h3>
        </div>
        <button 
          onClick={fetchStatus} 
          disabled={loading}
          className="text-xs text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          تحديث الحالة
        </button>
      </div>

      <div className="space-y-3.5 font-mono text-xs text-slate-400">
        <div className="flex justify-between items-center bg-slate-980/50 p-2.5 rounded-lg border border-slate-850">
          <span className="text-slate-400">حالة الربط بالمستودع:</span>
          {status?.configured ? (
            <span className="flex items-center gap-1.5 text-teal-400 font-sans font-medium bg-teal-900/20 px-2 py-0.5 rounded-full border border-teal-800/40">
              <CheckCircle className="w-3.5 h-3.5" />
              متصل ونشط
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-500 font-sans font-medium bg-amber-900/20 px-2 py-0.5 rounded-full border border-amber-800/40">
              <AlertTriangle className="w-3.5 h-3.5" />
              محدود الاتصال
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="text-[10px] text-slate-500 mb-0.5">الإصدار الحالي بالتطبيق</div>
            <div className="text-[#38bdf8] font-bold text-sm">{status?.currentSha || "7D087AF7"}</div>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="text-[10px] text-slate-500 mb-0.5">الإصدار الأخير بالمستودع</div>
            <div className={`font-bold text-sm ${hasUpdate ? "text-amber-400" : "text-teal-400"}`}>
              {status?.latestSha || "7D087AF7"}
            </div>
          </div>
        </div>

        {status?.commitMessage && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
            <div className="text-[10px] text-slate-500 mb-1 font-sans">عنوان أحدث تحديث متاح:</div>
            <div className="text-slate-300 text-xs font-sans truncate">{status.commitMessage}</div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 font-sans">
          <span className="text-slate-300 text-xs">ميزة التحديث السحابي التلقائي بالخلفية:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isAutoSync} 
              onChange={(e) => handleToggleSync(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
        </div>

        {hasUpdate ? (
          <div className="bg-amber-950/20 border border-amber-800/40 p-3 rounded-lg flex flex-col gap-2.5 mt-2 font-sans">
            <div className="flex gap-2 items-start text-amber-300 text-xs leading-relaxed">
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-400" />
              <span>هناك إصدار برمجى أحدث متوفر في مستودع GitHub! يمكنك تطبيقه الآن فورياً دون الحاجة إلى حذف البرنامج أو إعادة رفعه.</span>
            </div>
            <button
              onClick={handleManualPull}
              disabled={loading}
              className="w-full py-2 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 active:from-teal-700 font-medium text-white rounded-lg shadow-lg hover:shadow-teal-500/20 transition-all text-xs flex items-center justify-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              تثبيت التحديث الجديد الآن
            </button>
          </div>
        ) : (
          <div className="bg-teal-950/20 border border-teal-800/40 p-3 rounded-lg flex items-center gap-2 mt-2 font-sans text-teal-300 text-xs">
            <CheckCircle className="w-4 h-4 text-teal-400 flex-shrink-0" />
            <span>نظامك متطابق ومستقر بالكامل مع أحدث تغييرات في المستودع!</span>
          </div>
        )}

        {msg && (
          <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-teal-300 font-sans text-center text-xs animate-fade-in mt-1">
            {msg}
          </div>
        )}
      </div>
    </div>
  );
}
