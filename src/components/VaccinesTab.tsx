import React, { useState, useEffect } from "react";
import { PlusCircle, Calendar, ShieldCheck, Trash2, CloudLightning, FileText, ArrowLeft, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Vaccination } from "../types";

interface VaccinesTabProps {
  googleAccessToken: string | null;
}

export function VaccinesTab({ googleAccessToken }: VaccinesTabProps) {
  const [vaccines, setVaccines] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [vaccineType, setVaccineType] = useState("لقاح كورونا (Pfizer)");
  const [vaccineDate, setVaccineDate] = useState("");
  const [doseNumber, setDoseNumber] = useState(1);
  const [status, setStatus] = useState("Completed");
  const [notes, setNotes] = useState("");

  const [formMsg, setFormMsg] = useState("");
  const [driveMsg, setDriveMsg] = useState<{ [key: string]: string }>({});

  const fetchVaccines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vaccinations");
      if (res.ok) {
        setVaccines(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccines();
  }, []);

  const handleAddVaccine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !vaccineDate) {
      setFormMsg("الرجاء ملء جميع الحقول المطلوبة (اسم المريض وتاريخ اللقاح)");
      return;
    }

    setFormMsg("جاري حفظ التلقيح بقاعدة البيانات...");
    try {
      const res = await fetch("/api/vaccinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientId,
          vaccineType,
          vaccineDate,
          doseNumber,
          status,
          notes
        }),
      });

      if (res.ok) {
        const added = await res.json();
        setVaccines([added, ...vaccines]);
        setFormMsg("تم تسجيل لقاح المريض بنجاح بقاعدة البيانات الفعالة!");
        
        // Clear fields
        setPatientName("");
        setPatientId("");
        setNotes("");
        
        setTimeout(() => setFormMsg(""), 3000);
      } else {
        setFormMsg("عذراً، فشل التسجيل بقاعدة البيانات.");
      }
    } catch (err: any) {
      setFormMsg(`فشل الاتصال: ${err.message}`);
    }
  };

  const handleRemoveVaccine = async (id: string, name: string) => {
    const isConfirmed = window.confirm(`هل أنت متأكد من رغبتك في حذف سجل لقاح المريض: "${name}" نهائياً من قاعدة البيانات؟`);
    if (!isConfirmed) return;

    try {
      const res = await fetch(`/api/vaccinations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setVaccines(vaccines.filter(v => v.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportToGoogleDrive = async (v: Vaccination) => {
    if (!googleAccessToken) {
      alert("الرجاء الاتصال بحساب Google أولاً لتفعيل تصدير الملفات لـ Google Drive");
      return;
    }

    const recId = v.id || "unregistered";
    setDriveMsg({ ...driveMsg, [recId]: "جاري إنشاء المستند والرفع السحابي لـ Drive..." });

    const docName = `وثيقة_تطعيم_المريض_${v.patientName.replace(/\s+/g, "_")}.txt`;
    const docContent = `
=============================================
             مختبرات التحاليل واللقاحات الطبية
=============================================
تقرير سجل التلقيحات الرسمي الموثق

اسم المريض: ${v.patientName}
الرقم الطبي للمريض: ${v.patientId}
نوع اللقاح المستعمل: ${v.vaccineType}
تاريخ التلقيح: ${v.vaccineDate}
رقم الجرعة: الجرعة ${v.doseNumber}
حالة اللقاح بالتسجيل: ${v.status === "Completed" ? "مكتملة ومثبتة" : "مجدولة قادماً"}
ملاحظات الرعاية الصحية: ${v.notes || "لا توجد مضاعفات"}

---------------------------------------------
تم توليد وتصدير هذا المستند تلقائياً لتخزين الملفات الطبية السحابية للمريض.
تاريخ التصدير: ${new Date().toLocaleString("ar-EG")}
    `.trim();

    try {
      const res = await fetch("/api/drive/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleAccessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: docName,
          content: docContent,
          mimeType: "text/plain"
        })
      });

      if (res.ok) {
        setDriveMsg(prev => ({ ...prev, [recId]: "✅ تم النسخ لـ Google Drive بنجاح كملف طبي وثائقي!" }));
      } else {
        const errJson = await res.json();
        setDriveMsg(prev => ({ ...prev, [recId]: `❌ فشل الرفع: ${errJson.error || "خطأ مجهول"}` }));
      }
    } catch (err: any) {
      setDriveMsg(prev => ({ ...prev, [recId]: `❌ فشل التوصيل: ${err.message}` }));
    }

    setTimeout(() => {
      setDriveMsg(prev => {
        const copy = { ...prev };
        delete copy[recId];
        return copy;
      });
    }, 5000);
  };

  const vaccinesList = vaccines || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" dir="rtl">
      {/* Add Record Form */}
      <div className="lg:col-span-5 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <PlusCircle className="w-5 h-5 text-teal-600" />
          <h3 className="font-sans font-semibold text-lg text-slate-800">إضافة لقاح طبي جديد</h3>
        </div>

        <form onSubmit={handleAddVaccine} className="space-y-4 font-sans text-sm">
          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">اسم المريض الكامل *</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="مثال: أحمد العتيبي"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">الرقم الوطني / الملف</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="مثال: P14022"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">رقم الجرعة</label>
              <select
                value={doseNumber}
                onChange={(e) => setDoseNumber(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              >
                <option value={1}>الجرعة الأولى</option>
                <option value={2}>الجرعة الثانية</option>
                <option value={3}>الجرعة المنشطة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">نوع اللقاح الطبي</label>
            <select
              value={vaccineType}
              onChange={(e) => setVaccineType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
            >
              <option value="لقاح كورونا (Pfizer)">لقاح كورونا (Pfizer)</option>
              <option value="لقاح الإنفلونزا الموسمية">لقاح الإنفلونزا الموسمية</option>
              <option value="لقاح كبد حاد (Hepatitis B)">لقاح كبد حاد (Hepatitis B)</option>
              <option value="لقاح العنقز (Varicella)">لقاح العنقز (Varicella)</option>
              <option value="لقاح الثلاثي البكتيري (DPT)">لقاح الثلاثي البكتيري (DPT)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">تاريخ اللقاح *</label>
              <input
                type="date"
                value={vaccineDate}
                onChange={(e) => setVaccineDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-850"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">حالة اللقاح</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              >
                <option value="Completed">مكتملة ومحقونة</option>
                <option value="Scheduled">مجدولة وقادمة</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">ملاحظات طبية ووصف الأعراض</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="وصف للأعراض أو موعد الفحص اللاحق..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 font-medium text-white rounded-xl shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-5 h-5" />
            حفظ وإدخال اللقاح للمستودع الطبي
          </button>

          {formMsg && (
            <div className="mt-2 p-2.5 text-center text-teal-800 bg-teal-50 border border-teal-100 rounded-lg text-xs leading-relaxed animate-pulse">
              {formMsg}
            </div>
          )}
        </form>
      </div>

      {/* Record List */}
      <div className="lg:col-span-12 xl:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-sans font-semibold text-lg text-slate-800">بيانات التلقيح وشهادات الحصانة</h3>
          </div>
          <button 
            onClick={fetchVaccines}
            className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1.5 transition-colors font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث السجلات
          </button>
        </div>

        {loading ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-sm font-sans text-slate-500 flex flex-col items-center justify-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
            <span>جاري استعلام السجلات الحصية من خادم Firestore...</span>
          </div>
        ) : vaccinesList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-sm font-sans text-slate-400">
            لا توجد سجلات تطعيم في الأرشيف الطبي حالياً. قم بإضافة سجل جديد عن طريق النموذج الجانبي.
          </div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {vaccinesList.map((v) => {
                const recId = v.id || "unregistered";
                return (
                  <motion.div
                    key={recId}
                    layoutId={recId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs hover:border-teal-200 hover:shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-teal-50 border border-teal-100 p-2.5 rounded-xl text-teal-600 mt-1 flex-shrink-0">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 font-sans">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-slate-800 text-sm">{v.patientName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({v.patientId})</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans ${v.status === "Completed" ? "bg-teal-50 text-teal-600 border border-teal-150" : "bg-amber-50 text-amber-500 border border-amber-150"}`}>
                            {v.status === "Completed" ? "جرعة مكتملة" : "مجدولة"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>اللقاح: <strong className="text-slate-600">{v.vaccineType}</strong></span>
                          <span>الجرعة: <strong className="text-slate-600">{v.doseNumber}</strong></span>
                          <span>التاريخ: <strong className="text-slate-600 font-mono">{v.vaccineDate}</strong></span>
                        </div>
                        {v.notes && (
                          <div className="text-xs text-slate-400 leading-relaxed bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 mt-1.5">
                            {v.notes}
                          </div>
                        )}
                        
                        {driveMsg[recId] && (
                          <div className="text-[11px] text-teal-600/90 font-sans mt-2 animate-pulse">
                            {driveMsg[recId]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => handleExportToGoogleDrive(v)}
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 flex items-center gap-1 text-xs font-sans"
                        title="تنزيل الشهادة ورفعها سحابياً لـ Google Drive"
                      >
                        <FileText className="w-4 h-4 text-emerald-600" />
                        الرفع لـ Drive
                      </button>

                      <button
                        onClick={() => handleRemoveVaccine(recId, v.patientName)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-100"
                        title="حذف هذا السجل الطبي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
