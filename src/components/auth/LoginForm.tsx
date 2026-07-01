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
  const activeTab = "patient";
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
      className="w-full max-w-md bg-white/75 backdrop-blur-xl rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.06)] border border-white/60 overflow-hidden font-sans"
      dir="rtl"
    >
      {/* Header Banner */}
      <div className="p-8 text-center border-b border-gray-100/40 relative">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-md mx-auto mb-3">
          <Activity className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold mb-1.5 text-gray-900">
          {labProfile.showLabName
            ? labProfile.labName
            : "بوابة المريض الإلكترونية"}
        </h1>
      </div>

      <div className="p-8 flex flex-col gap-5">
        {error && (
          <div className="bg-red-500/10 text-red-700 text-xs p-3 rounded-xl text-center font-bold border border-red-500/20">
            {error}
          </div>
        )}

        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="flex flex-col gap-4"
        >
          {isRegistering && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mr-1 mb-1">
                  الاسم بالعربية
                </label>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-sm text-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all text-right"
                  placeholder="مثال: محمد أحمد"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mr-1 mb-1">
                  الاسم بالإنجليزية (اختياري)
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-sm text-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all text-right"
                  placeholder="Example: Mohamed Ahmed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mr-1 mb-1">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-sm text-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all text-right"
                  placeholder="مثال: 0500000000"
                  required
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mr-1 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-sm text-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all text-right"
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-500 mr-1 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50/50 border border-gray-200/80 rounded-xl p-3 text-sm text-gray-950 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all text-right"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-xl font-bold text-sm text-center shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : isRegistering ? (
              <UserPlus className="w-4 h-4" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {loading
                ? "جاري التحميل..."
                : isRegistering
                  ? "إنشاء حساب صحي جديد"
                  : "تسجيل الدخول"}
            </span>
          </button>
        </form>

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-gray-600 hover:text-black text-xs font-semibold underline underline-offset-4"
          >
            {isRegistering
              ? "لديك حساب بالفعل؟ تسجيل الدخول"
              : "ليس لديك حساب؟ إنشاء حساب جديد"}
          </button>
        </div>
      </div>
    </div>
  );
}
