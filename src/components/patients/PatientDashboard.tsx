import React, { useState, useEffect } from 'react';
import { 
  getPatientsByPhone, 
  getTestsByPatient, 
  getUserProfile,
  createAppointment,
  getAppointmentsByPatient,
  getAppointmentsByPhone,
  updateAppointmentStatus,
  LAB_TESTS_CATALOG,
  Appointment,
  TestCatalogItem,
  getCustomTestsCatalog
} from '../../lib/db';
import { Patient, Test } from '../../types';
import { auth } from '../../lib/firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { computeLoyaltyStatus } from '../../lib/loyalty';
import { getAllHomeVisits } from '../../lib/homevisits';
import { 
  User, 
  Activity, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Clock, 
  DollarSign, 
  HelpCircle, 
  ChevronLeft, 
  Plus, 
  Phone, 
  MapPin, 
  CalendarDays, 
  CheckCircle,
  XCircle,
  Stethoscope
} from 'lucide-react';

const OFFERS_AND_DISCOUNTS = [
  { title: "خصم الفحص الشامل للأسرة والشركاء", rate: "خصم 15%", code: "FAM15", descAr: "يطبق على الفحوصات الشاملة وصورة الدم الكاملة ووظائف الكبد عند حضور فردين أو أكثر." },
  { title: "باقة كبار السن والمتقاعدين", rate: "خصم 20%", code: "SENIOR20", descAr: "تقديرًا لآبائنا وأمهاتنا، نوفر خصماً فورياً على كافة تحاليل الهرمونات والسكري والدهنيات الثلاثية." },
  { title: "المسح الكيميائي الدوري للطلاب والرياضيين", rate: "خصم 10%", code: "STUDENT10", descAr: "يشمل تحاليل فقر الدم، فيتامين د، الكالسيوم، ومؤشرات البنية الرياضية." },
  { title: "العرض الفضي لمتابعي الموقع الإلكتروني", rate: "فحص مجاني للسكر الصائم", code: "WEBGLU", descAr: "احصل على تحليل مجاني لمستوى الجلوكوز بالدم عند حجز فحص كيميائي متكامل عبر البوابة." }
];

const LABORATORY_CONTACTS = {
  phone: "920012345",
  whatsapp: "0554321098",
  receptionDesk: "0554321099",
  address: "شارع التخصصي، حي السليمانية، الرياض 12223، المملكة العربية السعودية",
  workHours: "السبت - الخميس: 7:00 ص - 11:00 م | الجمعة: 1:00 م - 9:00 م"
};

export function PatientDashboard() {
  const [patientRecords, setPatientRecords] = useState<Patient[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<Patient | null>(null);
  const [patientTests, setPatientTests] = useState<Test[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Home Visits state
  const [myHomeVisits, setMyHomeVisits] = useState<any[]>([]);
  
  // Custom Tabs state
  const [activeTab, setActiveTab] = useState<'results' | 'appointments'>('results');
  
  // Appointments states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bookingTest, setBookingTest] = useState<string>('');
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('09:00');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Guest-specific status and inputs
  const [guestTab, setGuestTab] = useState<'lookup' | 'booking' | 'contacts'>('lookup');
  const [customCatalog, setCustomCatalog] = useState<TestCatalogItem[]>([]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestTest, setGuestTest] = useState('');
  const [guestDate, setGuestDate] = useState('');
  const [guestTime, setGuestTime] = useState('09:00');

  useEffect(() => {
    loadPatientFiles();
    fetchCustomCatalog();
  }, []);

  const fetchCustomCatalog = async () => {
    try {
      const items = await getCustomTestsCatalog();
      setCustomCatalog(items);
    } catch (err) {
      console.error("Error loading custom test catalog:", err);
    }
  };

  const mergedCatalog = [
    ...customCatalog,
    ...LAB_TESTS_CATALOG.filter(c => !customCatalog.some(cc => cc.id === c.id))
  ];

  const handleGuestBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !guestTest || !guestDate || !guestTime) {
      setErrorMsg('فضلاً أكمل جميع الحقول لتسجيل طلب الموعد السريع.');
      return;
    }
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await createAppointment({
        patientId: 'guest',
        patientNameAr: guestName.trim(),
        phone: guestPhone.trim(),
        testType: guestTest,
        date: guestDate,
        time: guestTime,
        status: 'pending'
      });
      setSuccessMsg('تم إرسال طلب حجز الموعد السريع للمدير بنجاح! يسعد كادر الاستقبال بخدمتك فور حضورك.');
      setGuestName('');
      setGuestPhone('');
      setGuestTest('');
      setGuestDate('');
    } catch (err) {
      console.error(err);
      setErrorMsg('فضلاً تحقق من جودة الاتصال بالإنترنت والمحاولة مجدداً.');
    } finally {
      setActionLoading(false);
    }
  };

  const loadPatientFiles = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // Look up our profile doc mapping phone
      const userDoc = await getUserProfile(currentUser.uid);
      
      const phoneToMatch = userDoc?.phone || '';

      let matchedPatients: Patient[] = [];
      if (phoneToMatch) {
        matchedPatients = await getPatientsByPhone(phoneToMatch);
      }

      if (matchedPatients.length > 0) {
        setPatientRecords(matchedPatients);
        const active = matchedPatients[0];
        setSelectedRecord(active);
        await loadTestsAndAppointments(active);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTestsAndAppointments = async (patient: Patient) => {
    await loadTests(patient.id);
    await loadAppointments(patient.id, patient.phone);
    try {
      const allVisits = await getAllHomeVisits();
      const filtered = allVisits.filter((v: any) => v.patientId === patient.id || v.phone === patient.phone);
      setMyHomeVisits(filtered);
    } catch (e) {
      console.error("Error loading home visits in patient view:", e);
    }
  };

  const loadTests = async (pId: string) => {
    const tests = await getTestsByPatient(pId);
    const sorted = tests.sort((a,b) => {
      const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt as any)?.toDate?.()?.getTime() || 0;
      const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt as any)?.toDate?.()?.getTime() || 0;
      return aTime - bTime; // oldest to newest for chart plotting!
    });
    setPatientTests(sorted);

    // Build chart data specifically tracking Hemoglobin or Glucose results over time!
    const chartPoints: any[] = [];
    sorted.forEach(t => {
      if (t.status === 'completed' && t.results) {
        const dateStr = t.createdAt instanceof Date 
          ? t.createdAt.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })
          : new Date((t.createdAt as any)?.toDate?.() || t.createdAt).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
        
        // Extract any numeric parameters like hemoglobin, fasting sugar, or total cholesterol
        let trackValue = 0;
        let metricLabel = 'مؤشر حيوي';
        if (t.results.hemoglobin) {
          trackValue = parseFloat(t.results.hemoglobin);
          metricLabel = 'الهيموجلوبين (Hemoglobin)';
        } else if (t.results.fbs) {
          trackValue = parseFloat(t.results.fbs);
          metricLabel = 'السكر الصائم (FBS)';
        } else if (t.results.cholesterol) {
          trackValue = parseFloat(t.results.cholesterol);
          metricLabel = 'الكوليسترول (Cholesterol)';
        } else {
          // Fallback first numeric parameter
          const firstNum = Object.entries(t.results).find(([_, val]: any) => !isNaN(parseFloat(val)));
          if (firstNum) {
            trackValue = parseFloat(firstNum[1] as string);
            metricLabel = t.parameters?.[firstNum[0]]?.name || firstNum[0];
          }
        }

        if (trackValue > 0) {
          chartPoints.push({
            name: dateStr,
            'القيمة المسجلة': trackValue,
            label: metricLabel
          });
        }
      }
    });
    setChartData(chartPoints);
  };

  const loadAppointments = async (pId: string, phone: string) => {
    try {
      // Load appointments by patientId first, fallback phone
      let list = await getAppointmentsByPatient(pId);
      if (list.length === 0 && phone) {
        list = await getAppointmentsByPhone(phone);
      }
      // Sort oldest to newest or newest to oldest
      list.sort((a,b) => {
        const aT = a.createdAt?.toDate?.()?.getTime() || 0;
        const bT = b.createdAt?.toDate?.()?.getTime() || 0;
        return bT - aT; // Show latest reservations first
      });
      setAppointments(list);
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualSearch = async (phone: string) => {
    if (!phone) return;
    setLoading(true);
    try {
      const records = await getPatientsByPhone(phone);
      setPatientRecords(records);
      if (records.length > 0) {
        const active = records[0];
        setSelectedRecord(active);
        await loadTestsAndAppointments(active);
      } else {
        setSelectedRecord(null);
        setPatientTests([]);
        setChartData([]);
        setAppointments([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if (!bookingTest || !bookingDate || !bookingTime) {
      setErrorMsg('فضلاً حدد نوع التحليل، والتاريخ والوقت المطلوبة لحجز الفحص.');
      return;
    }

    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createAppointment({
        patientId: selectedRecord.id,
        patientNameAr: selectedRecord.nameAr,
        phone: selectedRecord.phone,
        testType: bookingTest,
        date: bookingDate,
        time: bookingTime,
        status: 'pending'
      });

      setSuccessMsg('تم إرسال طلب حجز الموعد بنجاح! سيقوم فريق الاستقبال بمراجعته واعتماده قريباً.');
      setBookingTest('');
      setBookingDate('');
      setBookingTime('09:00');
      
      // Reload lists
      await loadAppointments(selectedRecord.id, selectedRecord.phone);
    } catch (err: any) {
      setErrorMsg('فشل تسجيل الموعد. يرجى مراجعة الاتصال بالشبكة والمحاولة مرة أخرى.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!selectedRecord || !window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الموعد؟')) return;
    try {
      await updateAppointmentStatus(appointmentId, 'cancelled');
      await loadAppointments(selectedRecord.id, selectedRecord.phone);
    } catch (e) {
      console.error(e);
    }
  };

  const formatDob = (dobValue: any) => {
    if (!dobValue) return 'غير محدد';
    try {
      const d = dobValue instanceof Date ? dobValue : (dobValue?.toDate ? dobValue.toDate() : new Date(dobValue));
      return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return String(dobValue);
    }
  };

  const calculateAge = (dobValue: any) => {
    if (!dobValue) return '';
    try {
      const d = dobValue instanceof Date ? dobValue : (dobValue?.toDate ? dobValue.toDate() : new Date(dobValue));
      const ageDifMs = Date.now() - d.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      return `${age} سنة`;
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-sans text-right" dir="rtl">
      {/* Search fallback panel if account is not bound to a record yet */}
      {!selectedRecord ? (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
          {/* GUEST BANNER / GREETINGS */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
            <h2 className="text-xl font-bold mb-2">مرحباً بك في البوابة الإلكترونية للمختبر الطبي</h2>
            <p className="text-xs text-slate-300">نلتزم بتقديم أعلى مستويات الدقة الطبية السريعة والتقارير المعتمدة لسلامتكم</p>
          </div>

          {/* GUEST INTERACTIVE NAVIGATION TABS */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-150 flex flex-wrap gap-2 shadow-sm">
            <button
              type="button"
              onClick={() => setGuestTab('booking')}
              className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                guestTab === 'booking' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>حجز موعد فحص سريع</span>
            </button>

            <button
              type="button"
              onClick={() => setGuestTab('contacts')}
              className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                guestTab === 'contacts' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>أرقام التواصل والمركز</span>
            </button>

            <button
              type="button"
              onClick={() => setGuestTab('lookup')}
              className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                guestTab === 'lookup' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <User className="w-4 h-4" />
              <span>الاستعلام طبي وبوابة التقارير</span>
            </button>
          </div>

          {/* GUEST SUB-PANELS */}
          {guestTab === 'lookup' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 shadow-sm text-center max-w-lg mx-auto w-full transition-all">
              <User className="w-12 h-12 text-slate-300 mx-auto mb-3 animate-pulse" />
              <h3 className="font-bold text-slate-800 text-base mb-1">الاستعلام عن تقارير ونتائج الملف الطبي</h3>
              <p className="text-xs text-slate-400 mb-6">يرجى إدخال رقم هاتفك المسجل مسبقاً لدى العيادة لعرض نتائج تحاليلك والمخطط البياني فور صدورها.</p>
              
              <form onSubmit={(e) => {
                e.preventDefault();
                const phone = (e.currentTarget.elements.namedItem('patientPhone') as HTMLInputElement).value;
                handleManualSearch(phone);
              }} className="flex flex-col gap-3">
                <input
                  type="tel"
                  name="patientPhone"
                  required
                  placeholder="أدخل رقم الهاتف المسجل بالعيادة (مثال: 05xxxx...)"
                  className="p-3 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-mono"
                />
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-md transition-colors">
                  تحقق وتحميل الملف الطبي الكامل
                </button>
              </form>
            </div>
          )}

          {guestTab === 'booking' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm transition-all max-w-2xl mx-auto w-full">
              <div className="text-right border-b pb-3 mb-6">
                <h3 className="font-bold text-slate-800 text-base">تسجيل حجز موعد جديد سريع</h3>
                <p className="text-xs text-slate-400 mt-1">احجز موعداً للفحص دون امتلاك ملف مسبق. سيتولى موظف الاستقبال إنهاء إجراءاتك فور وصولك.</p>
              </div>

              {successMsg && (
                <div className="mb-4 p-3 bg-emerald-55 text-emerald-800 border border-emerald-105 rounded-xl text-xs font-semibold bg-emerald-50 text-right">
                  {successMsg}
                </div>
              )}

              {errorMsg && (
                <div className="mb-4 p-3 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs font-semibold text-right">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleGuestBookAppointment} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المريض بالكامل</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="مثال: محمد عبد الرحمن السبيعي"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الجوال للاتصال</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="مثل: 0554321098"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs font-mono"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نوع التحليل / الفحص المطلوب</label>
                  <input
                    type="text"
                    required
                    value={guestTest}
                    onChange={(e) => setGuestTest(e.target.value)}
                    placeholder="مثال: تحليل سكر تراكمي، صورة دم..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الموعد المفضل</label>
                  <input
                    type="date"
                    required
                    value={guestDate}
                    onChange={(e) => setGuestDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs font-mono text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">وقت الزيارة المناسب</label>
                  <select
                    required
                    value={guestTime}
                    onChange={(e) => setGuestTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs"
                  >
                    <option value="08:00">08:00 صباحاً</option>
                    <option value="09:00">09:00 صباحاً</option>
                    <option value="10:00">10:00 صباحاً</option>
                    <option value="11:00">11:00 صباحاً</option>
                    <option value="13:00">01:00 مساءً</option>
                    <option value="14:00">02:00 مساءً</option>
                    <option value="15:00">03:00 مساءً</option>
                    <option value="16:00">04:00 مساءً</option>
                    <option value="17:00">05:00 مساءً</option>
                  </select>
                </div>

                <div className="md:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs rounded-xl shadow-md transition-colors disabled:bg-slate-300"
                  >
                    {actionLoading ? 'جاري إرسال الموعد...' : 'تأكيد وحجز موعد الفحص'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {guestTab === 'contacts' && (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm transition-all max-w-2xl mx-auto w-full text-right flex flex-col gap-6">
              <div className="border-b pb-3">
                <h3 className="font-bold text-slate-800 text-base">قنوات الاتصال والتواصل الهاتفي</h3>
                <p className="text-xs text-slate-400 mt-1">نحن هنا للإجابة على استفساراتك وتوجيهك لأفضل رعاية طبية طوال اليوم.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-indigo-600 block">{LABORATORY_CONTACTS.phone}</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">الرقم الموحد المعتمد</span>
                    <strong className="text-slate-800 text-xs font-bold">الاتصال الهاتفي 📞</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-teal-600 block">{LABORATORY_CONTACTS.whatsapp}</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">محادثة واتساب الفورية</span>
                    <strong className="text-slate-8 /0 text-xs font-bold">خدمات الواتساب 💬</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-xs font-extrabold text-slate-600 block">{LABORATORY_CONTACTS.receptionDesk}</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">مكتب استقبال التحاليل</span>
                    <strong className="text-slate-800 text-xs font-bold">حجز الزيارات المنزلية 🏡</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="font-sans text-[10px] text-slate-500 block text-left">متاح طوال اليوم</span>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">ساعات وفترات العمل بالمختبر</span>
                    <strong className="text-slate-800 text-xs font-bold">فترات العمل المباشر ⏱️</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 border border-indigo-100/40 rounded-xl">
                <span className="text-[10px] text-indigo-700 block mb-1 font-bold">عنوان وموقع المختبر الرئيسي:</span>
                <p className="text-xs text-slate-700 leading-relaxed font-semibold">{LABORATORY_CONTACTS.address}</p>
                <div className="text-[10.5px] text-slate-450 mt-1 flex justify-end gap-1.5 font-medium">
                  <span>{LABORATORY_CONTACTS.workHours}</span>
                  <strong>أوقات العمل:</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Right Area: Sidebar for patient health card details (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Detailed Patient Identity Information Card */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm overflow-hidden relative">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-25"></div>
              
              <div className="flex justify-between items-start border-b border-indigo-800 pb-4 mb-4 relative z-10">
                <div className="text-left">
                  <span className="text-[10px] bg-indigo-500 bg-opacity-30 text-indigo-200 px-2 py-0.5 rounded-lg border border-indigo-500 border-opacity-30 font-bold block mb-1">رقم الملف الطبي</span>
                  <span className="font-mono text-indigo-300 font-bold tracking-wider text-xs">{selectedRecord.id.substring(0,8).toUpperCase()}</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedRecord.nameAr}</h3>
                  <p className="text-xs text-slate-300 font-mono" dir="ltr">{selectedRecord.name}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-xs leading-relaxed text-indigo-100 relative z-10">
                <div className="flex justify-between items-center bg-slate-800 bg-opacity-40 p-2.5 rounded-xl">
                  <span className="font-mono font-medium">{formatDob(selectedRecord.dob)} {calculateAge(selectedRecord.dob) && <span className="text-emerald-400">{calculateAge(selectedRecord.dob)}</span>}</span>
                  <span className="text-slate-300 flex items-center gap-1.5 justify-end">
                    <span>تاريخ الميلاد والسن</span>
                    <CalendarDays className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800 bg-opacity-40 p-2.5 rounded-xl">
                  <span className="font-mono font-medium">{selectedRecord.phone}</span>
                  <span className="text-slate-300 flex items-center gap-1.5 justify-end">
                    <span>رقم الجوال</span>
                    <Phone className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800 bg-opacity-40 p-2.5 rounded-xl">
                  <span className="font-mono font-medium text-right overflow-hidden text-ellipsis max-w-[180px] block">{selectedRecord.email || 'غير متاح'}</span>
                  <span className="text-slate-300 flex items-center gap-1.5 justify-end">
                    <span>البريد الإلكتروني</span>
                    <FileText className="w-3.5 h-3.5" />
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-800 bg-opacity-40 p-2.5 rounded-xl">
                  <span className="font-medium">{selectedRecord.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                  <span className="text-slate-300 flex items-center gap-1.5 justify-end">
                    <span>الجنس</span>
                    <User className="w-3.5 h-3.5" />
                  </span>
                </div>

                {selectedRecord.address && (
                  <div className="flex justify-between items-center bg-slate-800 bg-opacity-40 p-2.5 rounded-xl">
                    <span className="font-medium text-left truncate max-w-[180px]">{selectedRecord.address}</span>
                    <span className="text-slate-300 flex items-center gap-1.5 justify-end">
                      <span>العنوان الرئيسي</span>
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedRecord(null);
                  setPatientTests([]);
                  setChartData([]);
                  setAppointments([]);
                }}
                className="w-full mt-5 bg-indigo-800 hover:bg-indigo-700 hover:text-white text-indigo-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all border border-indigo-700/50"
              >
                تبديل الملف الطبي النشط
              </button>
            </div>

            {/* Core Statistics Mini Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <h3 className="font-bold text-slate-800 text-xs mb-3">ملخص الأنشطة الطبية والزيارات</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[22px] font-extrabold text-indigo-600 block leading-none">{patientTests.length}</span>
                  <span className="text-[10px] text-slate-450 block mt-1">إجمالي التحاليل</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[22px] font-extrabold text-emerald-600 block leading-none">
                    {appointments.filter(a => a.status === 'approved').length}
                  </span>
                  <span className="text-[10px] text-slate-450 block mt-1">مواعيد معتمدة</span>
                </div>
              </div>
            </div>



            {/* DYNAMIC HOME VISITS SCHEDULE DISPLAY */}
            {myHomeVisits.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col gap-3">
                <h4 className="font-bold text-slate-800 text-xs border-b pb-2">📦 زيارات سحب العينات المنزلية (ميدانية)</h4>
                <div className="flex flex-col gap-3.5">
                  {myHomeVisits.map((visit: any) => {
                    const statusConfig = {
                      'scheduled': { badge: 'bg-indigo-50 text-indigo-700', text: 'مجدولة وفي الانتظار' },
                      'dispatched': { badge: 'bg-amber-50 text-amber-800 border-amber-100 animate-pulse', text: 'الممرض/ة في الطريق إليك 🚲' },
                      'collected': { badge: 'bg-teal-50 text-teal-800', text: 'تم سحب العينات بنجاح' },
                      'completed': { badge: 'bg-emerald-50 text-emerald-800', text: 'تم إنهاء الزيارة وتسجيلها' }
                    }[visit.status as string] || { badge: 'bg-slate-100 text-slate-600', text: String(visit.status) };

                    return (
                      <div key={visit.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100/80 flex flex-col gap-1.5 text-right text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${statusConfig.badge}`}>{statusConfig.text}</span>
                          <span className="font-bold text-slate-700">موعد: {visit.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 font-medium">ساعة الزيارة: {visit.timeSlot}</p>
                        <p className="text-[9.5px] text-slate-400 truncate">الموقع: {visit.address}</p>
                        {visit.assignedNurse && (
                          <div className="mt-1 border-t border-slate-100 pt-1.5 flex justify-between items-center text-[9px] text-slate-500 font-medium">
                            <span className="font-bold text-indigo-600">{visit.assignedNurse}</span>
                            <span>أخصائي السحب المنتدب:</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medical Notification */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="flex gap-2 justify-end">
                <div className="text-right">
                  <h4 className="font-bold text-emerald-900 text-xs mb-1">دليل المريض الفني</h4>
                  <p className="text-[10px] text-emerald-750 leading-relaxed font-semibold">
                    جميع تقارير الفحوصات والخدمات مصدقة معملياً وتستوفي معايير الجودة الدولية.
                  </p>
                </div>
                <Stethoscope className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>
            </div>

          </div>

          {/* Left Area: Navigation tabs & main workspace (Span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Tab Swapping Header */}
            <div className="bg-white p-1.5 rounded-2xl border border-slate-150 flex gap-2">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'appointments' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>حجز موعد فحص معملي</span>
              </button>

              <button
                onClick={() => setActiveTab('results')}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'results' 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>النتائج والمخططات البيانية</span>
              </button>
            </div>

            {/* TAB CONTENT: 1) Results & Graphs */}
            {activeTab === 'results' && (
              <div className="flex flex-col gap-6">
                
                {/* Header welcome badge */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -ml-10 -mt-10"></div>
                  
                  <div className="flex items-center gap-3 justify-end mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 animate-pulse">
                      <Sparkles className="w-3 h-3" />
                      <span>الملف الطبي معتمد ونشط</span>
                    </span>
                    <h2 className="text-lg font-bold">بوابة النتائج والتقارير</h2>
                  </div>
                  <p className="text-xs text-slate-300">متابعة دقيقة لمؤشراتك الحيوية ومستوى التحاليل ونتائج المختبر المسجلة للملف الحالي.</p>
                </div>

                {/* Recharts Graphical Trends */}
                {chartData.length > 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between border-b pb-3 mb-4">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium">خط التغير الزمني</span>
                      <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 justify-end">
                        <span>سجل نتائج ومعدلات مصل {chartData[0].label}</span>
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </h3>
                    </div>

                    <div className="w-full h-64 text-xs font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" />
                          <YAxis stroke="#94a3b8" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#1e293b', 
                              border: 'none', 
                              borderRadius: '8px', 
                              color: '#fff',
                              textAlign: 'right'
                            }} 
                          />
                          <Line type="monotone" dataKey="القيمة المسجلة" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-xs text-slate-400">
                    يلزم توفر نتيجتين معتمدتين بحد أدنى لعرض المخطط البياني لتتبع المؤشرات الحيوية.
                  </div>
                )}

                {/* Patients Detailed Laboratory Tests Reports Sheet List */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-3 mb-4 flex items-center gap-1.5 justify-end">
                    <span>التقارير الطبية المخبرية الموثقة</span>
                    <FileText className="w-4 h-4 text-slate-500" />
                  </h3>

                  {patientTests.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 border border-dashed rounded-xl text-xs">
                      لا توجد فحوصات أو تحاليل طبية مسجلة باسمك بعد.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {patientTests.map(test => {
                        const isCompleted = test.status === 'completed';
                        return (
                          <div key={test.id} className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors bg-slate-50/50">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 ${
                                isCompleted ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-amber-50 text-amber-800 border border-amber-100'
                              }`}>
                                {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <Activity className="w-3 h-3 animate-spin" />}
                                <span>{isCompleted ? 'النتيجة منشورة وصالحة' : 'قيد المعالجة والتحليل'}</span>
                              </span>

                              <div className="text-right">
                                <h4 className="font-bold text-slate-800 text-sm">{test.type}</h4>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  تاريخ تسجيل العينة:{' '}
                                  {test.createdAt instanceof Date 
                                    ? test.createdAt.toLocaleDateString('ar-EG')
                                    : new Date((test.createdAt as any)?.toDate?.() || test.createdAt).toLocaleDateString('ar-EG')
                                  }
                                </span>
                              </div>
                            </div>

                            {isCompleted && test.results ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                {Object.entries(test.parameters || {}).map(([key, value]: [string, any]) => {
                                  return (
                                    <div key={key} className="p-3 bg-white rounded-xl border border-slate-100">
                                      <span className="text-[10px] text-slate-400 font-bold block" dir="ltr">{value.name}</span>
                                      <div className="flex justify-between items-baseline mt-1.5">
                                        <span className="text-[9px] text-slate-450 font-mono">المعدل: {value.normal}</span>
                                        <span className="font-extrabold text-[#111827] text-xs font-mono">
                                          {test.results?.[key]} <span className="text-[9px] font-normal text-slate-500">{value.unit}</span>
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-amber-700 italic text-right">
                                * هذا التحليل يخضع للفحص المعملي الدقيق حالياً بمختبر الرياض، ستظهر النتائج هنا فور تدقيقها واعتمادها من رئيس المختبر.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2) Appointments Center */}
            {activeTab === 'appointments' && (
              <div className="flex flex-col gap-6">
                
                {/* Appointment booking card form */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <div className="border-b pb-3 mb-5 text-right">
                    <h3 className="font-bold text-slate-800 text-base flex items-center justify-end gap-2">
                      <span>حجز موعد فحص طبي جديد</span>
                      <Calendar className="w-5 h-5 text-indigo-600" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">اختر نوع التحليل المطلوب وحدد الوقت التاريخ المناسب لحضورك للمعمل لسحب العينات.</p>
                  </div>

                  {successMsg && (
                    <div className="mb-4 p-4 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs flex items-center gap-2 font-medium">
                      <CheckCircle className="w-4 h-4 text-emerald-600 self-start" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="mb-4 p-4 bg-rose-50 text-rose-800 border border-rose-100 rounded-xl text-xs flex items-center gap-2 font-medium">
                      <XCircle className="w-4 h-4 text-rose-600 self-start" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleBookAppointment} className="flex flex-col gap-4">
                    
                    {/* Test Selection */}
                    <div>
                      <label className="block text-slate-700 font-bold text-xs mb-2 text-right">نوع الفحص / التحليل المطلوب</label>
                      <input
                        type="text"
                        value={bookingTest}
                        onChange={(e) => setBookingTest(e.target.value)}
                        required
                        placeholder="مثال: تحليل سكر تراكمي، صورة دم..."
                        className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-right"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date */}
                      <div>
                        <label className="block text-slate-700 font-bold text-xs mb-2 text-right">تاريخ الزيارة</label>
                        <input
                          type="date"
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          required
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-center"
                        />
                      </div>
                      
                      {/* Time */}
                      <div>
                        <label className="block text-slate-700 font-bold text-xs mb-2 text-right">الوقت المفضل للزيارة</label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          required
                          className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-center font-mono"
                        >
                          <option value="08:00">08:00 صباحاً</option>
                          <option value="09:00">09:00 صباحاً</option>
                          <option value="10:00">10:00 صباحاً</option>
                          <option value="11:00">11:00 صباحاً</option>
                          <option value="13:00">01:00 مساءً</option>
                          <option value="14:00">02:00 مساءً</option>
                          <option value="15:00">03:00 مساءً</option>
                          <option value="16:00">04:00 مساءً</option>
                          <option value="17:00">05:00 مساءً</option>
                          <option value="18:00">06:00 مساءً</option>
                          <option value="19:00">07:00 مساءً</option>
                          <option value="20:00">08:00 مساءً</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:bg-slate-300"
                    >
                      {actionLoading ? 'جاري تسجيل الموعد...' : 'متابعة لتأكيد وحجز الموعد'}
                    </button>
                  </form>
                </div>

                {/* Appointments Log list */}
                <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 text-sm border-b pb-3 mb-4 text-right">سجل وطلبات حجز المواعيد الخاصة بك</h3>
                  
                  {appointments.length === 0 ? (
                    <div className="text-center py-8 text-slate-450 text-xs border border-dashed rounded-xl">
                      لا يوجد لديك مواعيد مسجلة سابقة أو معلقة بعد. استخدم النموذج أعلاه لطلب موعد.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {appointments.map(apt => {
                        let statusColor = 'bg-amber-55 text-amber-800 border-amber-100';
                        let statusAr = 'قيد الترشيح والمراجعة';
                        if (apt.status === 'approved') {
                          statusColor = 'bg-emerald-50 text-emerald-800 border border-emerald-100';
                          statusAr = 'موعد مؤكد ومقاوم';
                        } else if (apt.status === 'cancelled') {
                          statusColor = 'bg-slate-100 text-slate-500 border border-slate-200';
                          statusAr = 'ملغي';
                        }

                        return (
                          <div key={apt.id} className="border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                            <div>
                              {apt.status === 'pending' && (
                                <button
                                  onClick={() => handleCancelAppointment(apt.id)}
                                  className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                                >
                                  إلغاء الموعد المعلق
                                </button>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center sm:text-right">
                              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold ${statusColor}`}>
                                {statusAr}
                              </span>

                              <div className="text-right">
                                <h4 className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{apt.testType}</h4>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 justify-end font-mono">
                                  <span>{apt.time} - {apt.date}</span>
                                  <Clock className="w-3 h-3 text-slate-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
