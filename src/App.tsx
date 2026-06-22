import React, { useState, useEffect } from "react";
import { 
  PlusCircle, 
  RefreshCw, 
  ShieldCheck, 
  LogOut, 
  Database, 
  MapPin, 
  FileCheck, 
  Server, 
  GitBranch, 
  User, 
  FolderLock, 
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Search,
  BookOpen,
  LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile } from "./types";
import { UpdatePanel } from "./components/UpdatePanel";
import { VaccinesTab } from "./components/VaccinesTab";
import { LabResultsTab } from "./components/LabResultsTab";

// Import our beautiful custom generated laboratory logo
// @ts-ignore
import logoImg from "./assets/images/laboratory_logo_1782021776205.jpg";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<"vaccines" | "lab-results">("vaccines");
  const [authLoading, setAuthLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState("");

  // Handle messages from the Google auth popup window
  useEffect(() => {
    const handleAuthMessage = (event: MessageEvent) => {
      // Basic origin validations for Cloud Run or localhost context
      const origin = event.origin;
      if (!origin.endsWith(".run.app") && !origin.includes("localhost") && !origin.includes("127.0.0.1")) {
        return;
      }

      if (event.data?.type === "GOOGLE_AUTH_SUCCESS") {
        const { token, profile } = event.data;
        setGoogleToken(token);
        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          picture: profile.picture
        });
        setAlertMsg(`مرحباً بك مجدداً ${profile.name}! تم تسجيل الدخول بنجاح.`);
        setTimeout(() => setAlertMsg(""), 4000);
      }
    };

    window.addEventListener("message", handleAuthMessage);
    return () => window.removeEventListener("message", handleAuthMessage);
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      // Request authentication URL from our full-stack Express server
      const currentOrigin = window.location.origin;
      const res = await fetch(`/api/auth/google-url?origin=${encodeURIComponent(currentOrigin)}`);
      if (!res.ok) {
        throw new Error("فشلت عملية تهيئة جلسة الدخول وتلقي عنوان Google.");
      }
      
      const { url } = await res.json();
      
      // Open the Google Consent page direkt in a popup
      const authWindow = window.open(
        url,
        "google_auth_popup",
        "width=600,height=700,top=100,left=200"
      );

      if (!authWindow) {
        alert("الرجاء تمكين النوافذ المنبثقة (Popups) في متصفحك لإكمال عملية تسجيل الدخول.");
      }
    } catch (err: any) {
      alert(`عذراً، فشل تسجيل الدخول: ${err.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setGoogleToken(null);
    setAlertMsg("تم تسجيل خروجك من النظام الطبي بنجاح.");
    setTimeout(() => setAlertMsg(""), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden selection:bg-teal-500 selection:text-white" dir="rtl">
      {/* Universal Alerts */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-teal-600 text-white px-5 py-3 rounded-2xl shadow-xl border border-teal-500/30 flex items-center gap-2.5 font-sans text-sm font-medium"
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <span>{alertMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER BAR */}
      <header className="bg-white border-b border-slate-150 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={logoImg} 
              alt="شعار مختبر الحصانة" 
              className="w-10 h-10 rounded-2xl object-cover ring-2 ring-teal-500/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="font-sans font-bold text-base md:text-lg text-slate-800 tracking-tight flex items-center gap-1.5">
                نظام مُختبر الحصانة الطبي
                <span className="hidden sm:inline-block bg-teal-50 text-teal-600 border border-teal-150 text-[10px] px-2 py-0.5 rounded-full font-semibold">تطعيمات وتحاليل</span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-sans">البوابة الرقمية لإدارة اللقاحات الحصينية والتقارير المخبرية</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-50 pl-3 py-1 pr-1.5 rounded-2xl border border-slate-150">
                <img 
                  src={user.picture || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150"} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div className="hidden md:flex flex-col text-right font-sans">
                  <span className="text-xs font-bold text-slate-700 leading-none">{user.name}</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="تسجيل الخروج"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 font-medium text-white rounded-xl text-xs flex items-center gap-2 border border-slate-800 transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                {authLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <User className="w-3.5 h-3.5 text-teal-400" />
                )}
                تسجيل الدخول الآمن
              </button>
            )}
          </div>
        </div>
      </header>

      {/* RENDER BODY CONTAINER */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!user ? (
          /* LOGIN OR AUTH REQUIRED LANDING CONTAINER */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto py-4 md:py-8">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow text-teal-500" />
                <span>إصدار التطوير 2026 - نظام أرشيف سحابي رسمي مُؤمّن</span>
              </div>
              <h2 className="font-sans font-extrabold text-3xl md:text-4xl text-slate-900 leading-tight">
                إدارة ملفات المرضى وتحديثاتها البرمجية بشكل تلقائي وآلي
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
                مرحباً بك في نظام مختبر الحصانة السحابي. يتيح لك النظام تسجيل معلومات التطعيمات وجدول اللقاحات الحيوية (صفحة تطعيم) بالإضافة إلى نتائج وإفادات الفحص المخبري، مع ميزة النسخ الأرشفي التلقائي لـ Google Drive بكفاءة تامة.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={handleGoogleLogin}
                  disabled={authLoading}
                  className="px-6 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-2xl shadow-lg shadow-teal-600/10 hover:shadow-teal-600/20 active:scale-[0.98] font-bold text-sm flex items-center justify-center gap-2.5 transition-all w-full sm:w-auto"
                >
                  <User className="w-5 h-5 text-teal-200" />
                  ابدأ تسجيل الدخول عبر Google
                </button>
                <div className="text-xs text-slate-400 font-sans">
                  * يُمكّنك تسجيل الدخول من استعراض وتأمين ملفاتك السحابية.
                </div>
              </div>
            </div>

            {/* SIDE PANEL: REPOSITORY SYNCHRONIZATION CARD */}
            <div className="lg:col-span-5 w-full flex justify-center">
              <UpdatePanel />
            </div>
          </div>
        ) : (
          /* ACTIVE USER DASHBOARD LAYOUT */
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

              <div className="space-y-2">
                <div className="text-xs text-teal-400 font-sans flex items-center gap-1.5 font-bold">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  لوحة التحكم الطبية الموحدة
                </div>
                <h2 className="font-sans font-bold text-xl md:text-2xl text-slate-100 flex items-center gap-2">
                  أهلاً بك، {user.name} 👋
                </h2>
                <span className="text-xs text-slate-400 block max-w-xl font-sans">
                  حسابك مرتبط الآن بنظام Google Drive. يمكنك إدخال بيانات التلقيحات الجديدة لمرضاك أدناه وتخزين تقاريرهم الرسمية سحابياً بضغطة زر واحدة مجاناً.
                </span>
              </div>

              {/* Status information */}
              <div className="flex flex-wrap gap-2.5 items-center bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs text-slate-300 font-sans">
                  <span className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-ping"></span>
                  <span>الاتصال مع Google Drive:</span>
                  <strong className="text-teal-400">نشط ومتوفر</strong>
                </div>
              </div>
            </div>

            {/* NAVIGATION TABS SECTION */}
            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab("vaccines")}
                className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 rounded-t-xl shrink-0 flex items-center gap-2 ${
                  activeTab === "vaccines"
                    ? "border-teal-600 text-teal-600 bg-teal-50/20"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                صفحة تطعيم (جدول اللقاحات الطبية)
              </button>
              <button
                onClick={() => setActiveTab("lab-results")}
                className={`py-3 px-6 font-semibold text-sm transition-all border-b-2 rounded-t-xl shrink-0 flex items-center gap-2 ${
                  activeTab === "lab-results"
                    ? "border-teal-600 text-teal-600 bg-teal-50/20"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
              >
                <Database className="w-4 h-4" />
                نتائج التحاليل بالمختبر
              </button>
            </div>

            {/* RENDER CURRENT TAB VIEW WITH TRANSITIONS */}
            <div className="bg-slate-50 rounded-2xl">
              <div className="py-4">
                {activeTab === "vaccines" ? (
                  <VaccinesTab googleAccessToken={googleToken} />
                ) : (
                  <LabResultsTab googleAccessToken={googleToken} />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* HEALTHCARE FOOTER */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 font-sans text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-teal-400 font-bold">مختبر الحصانة السحابي</span>
            <span className="text-slate-600">|</span>
            <span>جميع الحقوق محفوظة © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Server className="w-3.5 h-3.5 text-teal-500" />
              أحدث نسخة مستقرة للموقع متصلة برمجياً
            </span>
            <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              SHA: 7D087AF7
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
