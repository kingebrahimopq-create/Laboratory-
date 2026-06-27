import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Smartphone,
  LogIn,
  Activity,
  User,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { doc, getDoc } from "../../lib/supabase-firestore";
import { db } from "../../lib/db";
import { loginUser, registerUser } from "../../lib/auth";
import { auth } from "../../lib/supabase";

export function LoginForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [labProfile, setLabProfile] = useState<{
    showLabName: boolean;
    labName: string;
  }>({ showLabName: false, labName: "لم يحدد بعد" });
  const [activeTab, setActiveTab] = useState<"patient" | "staff">("patient");
  const [isRegistering, setIsRegistering] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user: any) => {
      if (user) {
        navigate("/dashboard");
      }
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    const fetchLabProfile = async () => {
      try {
        const docRef = doc(db, "settings", "lab_profile");
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setLabProfile({
            showLabName: !!snap.data().showLabName,
            labName: snap.data().labName || "لم يحدد بعد",
          });
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchLabProfile();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await loginUser(email, password);
    } catch (err: any) {
      console.error(err);

      // Special logic: auto-create the owner account if it doesn't exist
      if (
        email === "mhm763517@gmail.com" &&
        (password === "0e02ddd1" || password === "0E02ddd1@11")
      ) {
        try {
          // We might be here because of wrong password, but we'll try registering just in case it doesn't exist
          await registerUser(email, password, {
            name: "Owner",
            nameAr: "المالك",
            username: email,
            role: "admin",
            phone: "",
          });
          await loginUser(email, password);
          return;
        } catch (e: any) {
          console.error("Auto-registration error", e);
          // If user already exists, it means they used the wrong password
          if (e?.message?.includes("already registered") || e?.status === 422) {
            setError("بيانات الدخول غير صحيحة");
          } else {
            setError("خطأ في التسجيل التلقائي للمالك");
          }
        }
      } else {
        setError("بيانات الدخول غير صحيحة");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await registerUser(email, password, {
        name: nameEn || nameAr,
        nameAr: nameAr,
        username: email,
        phone: phone,
        role: "patient",
      });
    } catch (err: any) {
      console.error(err);
      setError(
        "حدث خطأ أثناء إنشاء الحساب، قد يكون البريد الإلكتروني مستخدم بالفعل",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md mx-auto mb-2 relative z-10">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <h1 className="text-xl font-black mb-1 relative z-10 text-white">
          {labProfile.showLabName
            ? labProfile.labName
            : "بوابة الدخول الموحد للتحاليل"}
        </h1>
        <p className="text-[11px] text-slate-300 relative z-10">
          تسجيل الدخول الآمن
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab("patient");
            setIsRegistering(false);
            setError(null);
          }}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "patient" ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/30" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Smartphone className="w-4 h-4" />
          بوابة المرضى
        </button>
        <button
          onClick={() => {
            setActiveTab("staff");
            setIsRegistering(false);
            setError(null);
          }}
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "staff" ? "text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/30" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <User className="w-4 h-4" />
          بوابة الكادر الوظيفي
        </button>
      </div>

      <div className="p-8 flex flex-col gap-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="flex flex-col gap-4"
        >
          {isRegistering && activeTab === "patient" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-slate-900 hover:bg-slate-950 text-white py-4 rounded-xl font-bold text-center shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:translate-y-[-1px] active:translate-y-[1px] disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : isRegistering ? (
              <UserPlus className="w-5 h-5 text-emerald-400" />
            ) : (
              <LogIn className="w-5 h-5 text-emerald-400" />
            )}
            <span>
              {loading
                ? "جاري التحميل..."
                : isRegistering
                  ? "إنشاء حساب"
                  : "تسجيل الدخول"}
            </span>
          </button>
        </form>

        {activeTab === "patient" && (
          <div className="text-center mt-2">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-emerald-600 hover:text-emerald-700 text-sm font-bold"
            >
              {isRegistering
                ? "لديك حساب بالفعل؟ تسجيل الدخول"
                : "ليس لديك حساب؟ إنشاء حساب جديد"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
