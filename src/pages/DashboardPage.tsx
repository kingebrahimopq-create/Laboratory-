import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as supabaseAuth } from '../lib/supabase';
import { getUserProfile, createUserProfile, updateUserRole, getStaffInvite, deleteStaffInvite, getOwnerEmail } from '../lib/db';
import { logoutUser } from '../lib/auth';
import { User, UserRole } from '../types';
import { PatientWorkspace } from '../components/patients/PatientWorkspace';
import { TechnicianPanel } from '../components/patients/TechnicianPanel';
import { PhlebotomistPanel } from '../components/patients/PhlebotomistPanel';
import { PatientDashboard } from '../components/patients/PatientDashboard';
import { AdminPanel } from '../components/patients/AdminPanel';
import { InAppUpdate } from '../components/InAppUpdate';
import { 
  LogOut, User as UserIcon, Shield, Layers, HelpCircle, Activity, 
  LayoutDashboard, Database, Bell, Trash2, CheckCircle2, AlertTriangle, Info,
  Droplet, Menu, Settings, Plus, TestTube, CheckCircle, Clock, Users,
  BadgeCheck, Cpu, DollarSign, List
} from 'lucide-react';
import { getNotifications, clearNotifications, LISNotification } from '../lib/notifications';

export function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState('mhm763517@gmail.com');
  
  // Custom Bell states
  const [notifications, setNotifications] = useState<LISNotification[]>([]);
  const [showNotifCard, setShowNotifCard] = useState(false);

  // Emulated role allows changing the view to experience other dashboards for complete validation.
  const [emulatedRole, setEmulatedRole] = useState<UserRole | null>(null);

  // Collapsible sidebar & Tab controls matching user's design style
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [sidebarTab, setSidebarTab] = useState<'dashboard' | 'patient_portal'>('dashboard');
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'verification' | 'qc' | 'staff' | 'audit' | 'pricing' | 'automation' | 'patients_control'>('dashboard');
  
  useEffect(() => {
    loadProfile();
    clearAllNotifs();

    // Listen to live system-wide notifications
    const handleNotifTrigger = () => {
      loadNotifs();
    };
    window.addEventListener('lis_notification_received', handleNotifTrigger);
    return () => {
      window.removeEventListener('lis_notification_received', handleNotifTrigger);
    };
  }, []);

  const loadNotifs = async () => {
    const list = await getNotifications();
    setNotifications(list);
  };

  const clearAllNotifs = () => {
    clearNotifications();
    setNotifications([]);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = supabaseAuth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      const dynamicOwner = await getOwnerEmail();
      setOwnerEmail(dynamicOwner);
      
      let data = await getUserProfile(currentUser.uid);
      const isOwnerEmail = currentUser.email?.toLowerCase() === dynamicOwner || currentUser.email?.toLowerCase() === 'mhm763517@gmail.com';
      
      if (!data) {
        // Find if they have been pre-invited with a specific role by the Owner
        let assignedRole: UserRole = 'patient'; // Dynamic default is patient for security
        let assignedName = currentUser.displayName || currentUser.email || 'Registered User';
        let assignedNameAr = currentUser.displayName || currentUser.email || 'مستخدم مسجل';

        if (isOwnerEmail) {
          assignedRole = 'admin';
        } else if (currentUser.email) {
          const invite = await getStaffInvite(currentUser.email);
          if (invite) {
            assignedRole = invite.role;
            assignedName = invite.name || assignedName;
            assignedNameAr = invite.nameAr || assignedNameAr;
            // Consume the invite
            await deleteStaffInvite(currentUser.email);
          }
        }

        // Create user profile on-the-fly
        const newProfile: User = {
          id: currentUser.uid,
          username: currentUser.email?.split('@')[0] || 'user',
          role: assignedRole,
          name: assignedName,
          nameAr: assignedNameAr,
          email: currentUser.email || undefined,
        };
        await createUserProfile(currentUser.uid, newProfile);
        data = newProfile;
      } else if (isOwnerEmail && data.role !== 'admin') {
        // Automatically elevate profile role to admin if it's the owner email
        data.role = 'admin';
        await updateUserRole(currentUser.uid, 'admin');
      }

      setProfile(data);
      if (data) {
        setEmulatedRole(data.role);
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleRefresh = () => {
    setRefreshTrigger(!refreshTrigger);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold text-slate-500">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isMissingTable = error.includes("42P01") || error.includes("does not exist");
    
    return (
      <div className="min-h-screen flex items-center justify-center font-sans p-4" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 max-w-lg w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 font-extrabold text-xl">!</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2 font-sans">
            {isMissingTable ? "قاعدة البيانات غير مهيأة" : "فشل الاتصال بقاعدة البيانات"}
          </h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
            {isMissingTable 
              ? "لم يتم العثور على الجداول المطلوبة في Supabase. يرجى تهيئة قاعدة البيانات الخاصة بك."
              : "حدث خطأ أثناء محاولة الاتصال بـ Supabase أو استدعاء الملف الشخصي للمستخدم."}
          </p>
          
          {isMissingTable && (
            <div className="bg-slate-100 border border-slate-200 p-4 rounded-xl text-left mb-4 overflow-auto max-h-48 text-xs font-mono" dir="ltr">
              <pre className="text-slate-700 select-all whitespace-pre-wrap">
{`-- To fix this, you must run the SQL script located in:
-- /setup.sql (in your GitHub repository)
--
-- Copy the contents of setup.sql and paste it into the 
-- Supabase SQL Editor, then click "Run".`}
              </pre>
            </div>
          )}

          {(error.includes("offline") || error.includes("Failed")) && !isMissingTable && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 mb-4 leading-normal text-right font-sans">
              <strong>توضيح الاتصال:</strong> يحاول تطبيق الويب الاتصال بخدمات Supabase السحابية المؤمّنة، وإذا كان الاتصال المحلي أو بيئة الاختبار مغلقة فقد تظهر رسالتك كـ (Offline). يرجى التأكد من إضافة المتغيرات البيئية VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في إعدادات Vercel.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => loadProfile()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-md cursor-pointer transition-all font-sans"
            >
              إعادة محاولة الاتصال والتحميل
            </button>
            <button
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] py-2 px-3 rounded-xl transition-all font-sans"
            >
              تسجيل الخروج والعودة لصفحة الدخول
            </button>
          </div>
          <div className="mt-4 text-[9px] text-slate-400 font-mono overflow-auto max-h-24 p-2 bg-slate-50 rounded border border-slate-100 text-left">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const activeRole = emulatedRole || profile?.role || 'receptionist';
  const isOwner = supabaseAuth.currentUser?.email?.toLowerCase() === ownerEmail || supabaseAuth.currentUser?.email?.toLowerCase() === 'mhm763517@gmail.com';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div dir="rtl" className="flex min-h-screen font-sans text-slate-800 overflow-hidden relative">
      {/* Right Sidebar - Collapsible & Designed with iOS premium aesthetic */}
      {/* Mobile backdrop overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}
      <aside className={`
        fixed inset-y-0 right-0 z-50 md:relative md:z-30 md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 w-64' : 'translate-x-full md:translate-x-0 md:w-20 w-0'}
        shrink-0 transition-all duration-300 bg-white/85 backdrop-blur-3xl text-gray-950 flex flex-col border-l border-gray-200/40 shadow-[1px_0_15px_rgba(0,0,0,0.01)] overflow-hidden
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100/50 gap-2 px-4 overflow-hidden shrink-0">
          <Droplet className="text-gray-900 shrink-0" size={24} />
          {isSidebarOpen && <span className="text-sm font-black tracking-tight text-gray-950">لاب ميد</span>}
        </div>

        {/* Sidebar Menu Links - Grouped like iOS List Settings */}
        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {activeRole === 'admin' ? (
            <>
              {isSidebarOpen && (
                <div className="px-3 mb-2">
                  <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">التحكم والإدارة الطبية</p>
                </div>
              )}
              
              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('dashboard');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'dashboard' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="مؤشرات الإدارة والمالية"
              >
                <Activity size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'dashboard' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">مؤشرات الإدارة والمالية</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('verification');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'verification' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="الاعتماد والتعليق الطبي"
              >
                <BadgeCheck size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'verification' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">الاعتماد والتعليق الطبي</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('qc');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'qc' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="جودة ومعايرة الأجهزة (QC)"
              >
                <Cpu size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'qc' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">جودة ومعايرة الأجهزة (QC)</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('staff');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'staff' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="شؤون الكادر والتراخيص"
              >
                <Users size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'staff' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">شؤون الكادر والتراخيص</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('audit');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'audit' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="سجل التدقيق والورديات"
              >
                <List size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'audit' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">سجل التدقيق والورديات</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('pricing');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'pricing' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="تعديل الأسعار والفحوصات"
              >
                <DollarSign size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'pricing' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">تعديل الأسعار والفحوصات</span>}
              </button>

              <button
                onClick={() => {
                  setSidebarTab('dashboard');
                  setActiveAdminTab('patients_control');
                }}
                className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                  isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
                } ${
                  sidebarTab === 'dashboard' && activeAdminTab === 'patients_control' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
                }`}
                title="حسابات وملفات المرضى"
              >
                <Users size={18} className={`shrink-0 ${sidebarTab === 'dashboard' && activeAdminTab === 'patients_control' ? 'text-white' : 'text-gray-500'}`} />
                {isSidebarOpen && <span className="truncate">حسابات وملفات المرضى</span>}
              </button>

              <div className="h-px bg-gray-200/60 my-4 shrink-0" />
              
              {isSidebarOpen && (
                <div className="px-3 mb-2">
                  <p className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">بوابة الخدمة الذاتية</p>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setSidebarTab('dashboard')}
              className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
                isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
              } ${
                sidebarTab === 'dashboard' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
              }`}
              title="لوحة القيادة والمتابعة"
            >
              <Activity size={18} className={`shrink-0 ${sidebarTab === 'dashboard' ? 'text-white' : 'text-gray-500'}`} />
              {isSidebarOpen && <span>لوحة القيادة والمتابعة</span>}
            </button>
          )}

          {/* Patient Portal Option */}
          <button
            onClick={() => setSidebarTab('patient_portal')}
            className={`w-full flex items-center rounded-xl text-xs font-bold transition-all cursor-pointer py-2.5 ${
              isSidebarOpen ? 'justify-start gap-3 px-3' : 'justify-center px-1'
            } ${
              sidebarTab === 'patient_portal' ? 'bg-gray-950 text-white shadow-xs' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-950'
            }`}
            title="بوابة المريض الذكية"
          >
            <Users size={18} className={`shrink-0 ${sidebarTab === 'patient_portal' ? 'text-white' : 'text-gray-500'}`} />
            {isSidebarOpen && <span>بوابة المريض الذكية</span>}
          </button>
        </nav>

        {/* Sidebar Footer Identity & Roles styled as a clean iOS section */}
        {profile && (
          <div className={`p-3 border-t border-gray-100/50 bg-gray-50/40 text-right overflow-hidden shrink-0 mt-auto flex flex-col ${isSidebarOpen ? 'items-stretch' : 'items-center gap-1'}`}>
            <div className="flex items-center gap-2">
              <div className="bg-gray-200/60 p-1.5 rounded-xl shrink-0">
                <UserIcon className="w-4 h-4 text-gray-600" />
              </div>
              {isSidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-950 truncate">{profile.nameAr}</p>
                  <p className="text-[9px] text-gray-400 truncate">@{profile.username}</p>
                </div>
              )}
            </div>
            {isSidebarOpen ? (
              <div className="mt-2.5 flex items-center justify-between gap-1.5">
                <span className="text-[8px] font-bold text-gray-700 px-2.5 py-0.5 rounded-lg bg-gray-200/80 uppercase">
                  {profile.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>خروج</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="mt-1 text-red-600 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Main Container on the left */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Main Content Header */}
        <header className="h-16 bg-white/70 backdrop-blur-3xl border-b border-gray-200/50 flex items-center justify-between px-6 z-20 shadow-xs shrink-0">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100/80 rounded-xl text-gray-500 transition-all cursor-pointer"
              title="عرض/إخفاء القائمة الجانبية"
            >
              <Menu size={18} />
            </button>

            <h1 className="text-xs md:text-sm font-bold text-gray-900 tracking-tight flex items-center gap-2 truncate whitespace-nowrap overflow-hidden max-w-[150px] xs:max-w-[200px] md:max-w-none">
              {sidebarTab === 'dashboard' && (
                <>
                  <span className="md:hidden">لوحة القيادة</span>
                  <span className="hidden md:inline">لوحة القيادة والمتابعة الفورية</span>
                </>
              )}
              {sidebarTab === 'patient_portal' && (
                <>
                  <span className="md:hidden">بوابة المريض</span>
                  <span className="hidden md:inline">بوابة المريض والملف الصحي الإلكتروني</span>
                </>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Role Demo Emulator Dropdown for easy test driving */}
            {profile && profile.role === 'admin' && (
              <div className="flex items-center gap-1 bg-gray-100/80 p-1 px-2 md:px-2.5 rounded-xl border border-gray-200/50 max-w-[120px] xs:max-w-[150px] md:max-w-none">
                <Layers className="w-3.5 h-3.5 text-gray-800 shrink-0" />
                <span className="text-[10px] text-gray-500 font-bold hidden md:inline">محاكي الأدوار:</span>
                <select
                  value={activeRole}
                  onChange={(e) => {
                    setEmulatedRole(e.target.value as UserRole);
                    setSidebarTab('dashboard'); // reset to dashboard on role change
                  }}
                  className="bg-transparent text-gray-900 font-bold text-[10px] md:text-xs focus:outline-none cursor-pointer border-none max-w-[90px] xs:max-w-none truncate"
                >
                  <option value="receptionist">الاستقبال</option>
                  <option value="phlebotomist">أخصائي السحب</option>
                  <option value="technician">فني معمل</option>
                  <option value="patient">المريض</option>
                  <option value="admin">الإدارة</option>
                </select>
              </div>
            )}

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifCard(!showNotifCard)}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 relative transition-all cursor-pointer"
                title="التنبيهات العاجلة"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 text-white font-black text-[8px] w-4.5 h-4.5 rounded-full flex items-center justify-center animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifCard && (
                <div 
                  className="absolute left-0 top-10 w-80 bg-white text-slate-850 shadow-2xl rounded-2xl border border-slate-100 p-4 z-50 flex flex-col gap-3 text-right"
                  onMouseLeave={() => setShowNotifCard(false)}
                >
                  <div className="border-b border-slate-50 pb-2 flex items-center justify-between">
                    <button
                      onClick={clearAllNotifs}
                      className="text-rose-600 hover:text-rose-800 flex items-center gap-1 text-[10px] font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>مسح تلو السجل</span>
                    </button>
                    <span className="text-xs font-black text-slate-800">جرس التنبيهات والأحداث الطبية</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto flex flex-col divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-[10px] italic">
                        لا توجد تنبيهات عاجلة في الوقت الحالي.
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const icon = {
                          success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                          warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
                          error: <AlertTriangle className="w-4 h-4 text-rose-500" />,
                          critical: <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />,
                          info: <Info className="w-4 h-4 text-indigo-500" />
                        }[notif.type];
                        
                        return (
                          <div key={notif.id} className="py-2 flex gap-2.5 items-start">
                            <span className="mt-0.5 shrink-0">{icon}</span>
                            <div className="flex-1">
                              <h5 className="font-bold text-[11px] text-slate-900 leading-tight">{notif.titleAr}</h5>
                              <p className="text-[9px] text-slate-500 leading-normal mt-0.5 font-medium">{notif.messageAr}</p>
                              <span className="text-[8px] text-slate-400 font-mono block mt-1">
                                {new Date(notif.timestamp).toLocaleTimeString('ar-EG')}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Frame */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
            {/* TAB CONTENT 1: DASHBOARD */}
            {sidebarTab === 'dashboard' && (
              <div className="flex flex-col gap-6">
                {activeRole === 'patient' ? (
                  // Direct bypass for patient role
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 justify-end text-slate-850 mb-1">
                      <p className="text-xs text-slate-500">تتبع مؤشرات صحتك وحلل تطورات الفحوصات الطبية المعتمدة واستدلالات المختبر</p>
                    </div>
                    <PatientDashboard />
                  </div>
                ) : (
                  // Role workspaces + Drive synchronization panel
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
                    {/* Main Workspace Area */}
                    <div className="w-full flex flex-col gap-6">
                      {activeRole === 'receptionist' && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                            <p className="text-xs text-slate-500">تم تسجيل الدخول كموظف استقبال وطبيب معتمد لحجز الملفات الطبية للمرضى ومتابعة نقاط الولاء والزيارات</p>
                          </div>
                          <PatientWorkspace refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                        </div>
                      )}

                      {activeRole === 'phlebotomist' && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                            <p className="text-xs text-slate-500">منصة أخصائي سحب العينات؛ يمكنك هنا طباعة ملصقات الباركود والاتصال عبر ASTM وتأكيد سحب عينات الفروع</p>
                          </div>
                          <PhlebotomistPanel refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                        </div>
                      )}

                      {activeRole === 'technician' && (
                        <div className="flex flex-col gap-4">
                           <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                            <p className="text-xs text-slate-500">مرحباً بك الدكتور فني العينات؛ يسعك هنا فحص قيم الذعر والاعتماد التلقائي الذكي بمحرك القواعد الطبية</p>
                          </div>
                          <TechnicianPanel refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
                        </div>
                      )}

                      {activeRole === 'admin' && (
                        <div className="flex flex-col gap-4">
                          <div className="flex items-center gap-2 justify-end text-slate-850 mb-1">
                            <p className="text-xs text-slate-500">لوحة المراقبة الشاملة، الإحصائيات الحيوية، والتحكم بالأدوار وتصاريح دخول الطاقم وطباعة التقارير</p>
                          </div>
                          <AdminPanel 
                            refreshTrigger={refreshTrigger} 
                            onRefresh={handleRefresh} 
                            activeSubTab={activeAdminTab}
                            hideTabsHeader={true}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PATIENT PORTAL */}
            {sidebarTab === 'patient_portal' && (
              <div className="flex flex-col gap-4">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-sm text-center relative overflow-hidden">
                  <h3 className="text-sm font-black mb-1">الملف الصحي الموحد للمرضى</h3>
                  <p className="text-[11px] text-slate-300">ابحث عن نتائج فحوصاتك الطبية وتقارير المختبر الفورية باستخدام رقم هاتفك المسجل.</p>
                </div>
                <PatientDashboard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
