import React, { useState, useEffect } from "react";
import { PlusCircle, Search, Trash2, FileText, CheckCircle, Database, AlertCircle, RefreshCw, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LabResult } from "../types";

interface LabResultsTabProps {
  googleAccessToken: string | null;
}

export function LabResultsTab({ googleAccessToken }: LabResultsTabProps) {
  const [results, setResults] = useState<LabResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Form Fields
  const [patientName, setPatientName] = useState("");
  const [testType, setTestType] = useState("تحليل الدم الكامل (CBC)");
  const [testValue, setTestValue] = useState("");
  const [testDate, setTestDate] = useState("");
  const [status, setStatus] = useState("Released");
  const [notes, setNotes] = useState("");

  const [formMsg, setFormMsg] = useState("");
  const [driveMsg, setDriveMsg] = useState<{ [key: string]: string }>({});

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lab-results");
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleAddResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !testValue || !testDate) {
      setFormMsg("الرجاء ملء جميع الحقول المطلوبة (اسم المريض، قيمة نتيجة التحليل والتاريخ)");
      return;
    }

    setFormMsg("جاري الحفظ والتدقيق بقاعدة البيانات...");
    try {
      const res = await fetch("/api/lab-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          testType,
          testValue,
          status,
          testDate,
          notes
        })
      });

      if (res.ok) {
        const added = await res.json();
        setResults([added, ...results]);
        setFormMsg("تم تسجيل وحفظ النتيجة الطبية بقاعدة بيانات المختبر الفعالة!");
        
        setPatientName("");
        setTestValue("");
        setNotes("");
        setTimeout(() => setFormMsg(""), 3000);
      } else {
        setFormMsg("عذراً، فشلت عملية الحفظ.");
      }
    } catch (err: any) {
      setFormMsg(`فشل التوصيل بالخادم: ${err.message}`);
    }
  };

  const handleExportToGoogleDrive = async (r: LabResult) => {
    if (!googleAccessToken) {
      alert("الرجاء الاتصال بحساب Google أولاً لتصدير الملفات الطبية لـ Google Drive");
      return;
    }

    const recId = r.id || "unregistered";
    setDriveMsg({ ...driveMsg, [recId]: "جاري رفع التقرير المخبري لـ Google Drive..." });

    const docName = `تقرير_مخبري_للمريض_${r.patientName.replace(/\s+/g, "_")}.txt`;
    const docContent = `
=============================================
             مختبرات التحاليل واللقاحات الطبية
=============================================
تقرير تخريج تحليل مخبري موثق

اسم المريض: ${r.patientName}
نوع الفحص المخبري: ${r.testType}
تاريخ إجراء الفحص: ${r.testDate}
تفاصيل وقيمة النتيجة: ${r.testValue}
حالة التقرير: ${r.status === "Released" ? "تم الإعتماد والتخريج" : "قيد المراجعة الفنية"}
ملاحظات وإرشادات الطبيب: ${r.notes || "لا توجد توصيات خاصة"}

---------------------------------------------
تم توليد وتأمين هذا المستند تلقائياً لحفظ الملفات الطبية السحابية للمريض.
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
        setDriveMsg(prev => ({ ...prev, [recId]: "✅ تم رفع التقرير لـ Google Drive بنجاح كشاهد ملف طبي!" }));
      } else {
        const errJson = await res.json();
        setDriveMsg(prev => ({ ...prev, [recId]: `❌ فشل الرفع: ${errJson.error || "خطأ مجهول"}` }));
      }
    } catch (err: any) {
      setDriveMsg(prev => ({ ...prev, [recId]: `❌ فشل الاتصال: ${err.message}` }));
    }

    setTimeout(() => {
      setDriveMsg(prev => {
        const copy = { ...prev };
        delete copy[recId];
        return copy;
      });
    }, 5000);
  };

  const resultsList = results || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" dir="rtl">
      {/* Search & Add New Result Form */}
      <div className="lg:col-span-12 xl:col-span-5 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-teal-600" />
          <h3 className="font-sans font-semibold text-lg text-slate-800">إدخال نتيجة فحص مخبري جديد</h3>
        </div>

        <form onSubmit={handleAddResult} className="space-y-4 font-sans text-sm">
          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">اسم المريض الكامل *</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="شاهد: فاطمة محمد"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              required
            />
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">نوع الفحص والتحليل المخبري</label>
            <select
              value={testType}
              onChange={(e) => setTestType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
            >
              <option value="تحليل الدم الكامل (CBC)">تحليل الدم الكامل (CBC)</option>
              <option value="فحص السكري الصيامي (Glucose)">فحص السكري الصيامي (Glucose)</option>
              <option value="تحليل الكوليسترول والدهون (Lipid Profile)">تحليل الكوليسترول والدهون (Lipid Profile)</option>
              <option value="وظائف الكلى السريرية (Kidney Function)">وظائف الكلى السريرية (Kidney Function)</option>
              <option value="فحص الغدة الدرقية (TSH Test)">فحص الغدة الدرقية (TSH Test)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">قيم ونتيجة التحليل الطبية *</label>
            <input
              type="text"
              value={testValue}
              onChange={(e) => setTestValue(e.target.value)}
              placeholder="مثال: Hgb: 12.5 g/dL, Glucose: 92 mg/dL"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">تاريخ الفحص والمخبر *</label>
              <input
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 text-xs font-semibold mb-1">حالة التقرير الفنية</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800"
              >
                <option value="Released">معتمد وتخريج النتيجة</option>
                <option value="Pending">تحت المراجعة والفحص</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-xs font-semibold mb-1">توصيات الطبيب وتحليلات الأعراض</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تعليمات المتابعة الطبية وغذائية..."
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 transition-colors text-slate-800 resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 font-medium text-white rounded-xl shadow-md shadow-teal-600/10 hover:shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            حفظ وإعتماد نتيجة التحليل المخبري
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
            <CheckCircle className="w-5 h-5 text-teal-600" />
            <h3 className="font-sans font-semibold text-lg text-slate-800">أرشيف تحاليل الدم والمختبر الطبية</h3>
          </div>
          <button 
            onClick={fetchResults}
            className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1.5 transition-colors font-sans"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            تحديث القائمة
          </button>
        </div>

        {loading ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-sm font-sans text-slate-500 flex flex-col items-center justify-center gap-2.5">
            <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
            <span>جاري قراءة تقارير الفحص الفنية من مخدم السحابي الفعال Firestore...</span>
          </div>
        ) : resultsList.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center text-sm font-sans text-slate-400">
            لا توجد سجلات فحص في الأرشيف الطبي حالياً. قم بإضافتها باستخدام النموذج الجانبي.
          </div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {resultsList.map((r) => {
                const recId = r.id || "unregistered";
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
                      <div className="bg-cyan-50 border border-cyan-100 p-2.5 rounded-xl text-cyan-600 mt-1 flex-shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1 font-sans">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-slate-800 text-sm">{r.patientName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans ${r.status === "Released" ? "bg-teal-50 text-teal-600 border border-teal-150" : "bg-amber-50 text-amber-500 border border-amber-150"}`}>
                            {r.status === "Released" ? "تم تخريج النتيجة" : "قيد المراجعة"}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                          <span>التحليل: <strong className="text-slate-700">{r.testType}</strong></span>
                          <span>التاريخ: <strong className="text-slate-600 font-mono">{r.testDate}</strong></span>
                        </div>
                        <div className="text-xs text-teal-700 font-semibold bg-teal-50//5 border border-teal-100/50 p-2 rounded-lg mt-1 font-mono">
                          النتيجة المخبرية: {r.testValue}
                        </div>
                        {r.notes && (
                          <div className="text-xs text-slate-400 leading-relaxed bg-slate-50 px-2.5 py-2 rounded-lg border border-slate-100 mt-1.5 font-sans">
                            {r.notes}
                          </div>
                        )}
                        
                        {driveMsg[recId] && (
                          <div className="text-[11px] text-teal-600/95 font-sans mt-2 animate-pulse">
                            {driveMsg[recId]}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                      <button
                        onClick={() => handleExportToGoogleDrive(r)}
                        className="p-2 text-slate-500 hover:text-teal-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-100 flex items-center gap-1 text-xs font-sans"
                        title="حفظ التقرير الطبي لـ Google Drive"
                      >
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        الرفع لـ Drive
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
