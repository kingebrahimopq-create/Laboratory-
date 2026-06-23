import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth as firebaseAuth } from '../lib/firebase';
import { getUserProfile, createUserProfile, updateUserRole, getStaffInvite, deleteStaffInvite, getOwnerEmail } from '../lib/db';
import { logoutUser } from '../lib/auth';
import { DriveUpload } from '../components/drive/DriveUpload';
import { User, UserRole } from '../types';
import { PatientWorkspace } from '../components/patients/PatientWorkspace';
import { TechnicianPanel } from '../components/patients/TechnicianPanel';
import { PhlebotomistPanel } from '../components/patients/PhlebotomistPanel';
import { PatientDashboard } from '../components/patients/PatientDashboard';
import { AdminPanel } from '../components/patients/AdminPanel';
import { 
  LogOut, User as UserIcon, Shield, Layers, HelpCircle, Activity, 
  LayoutDashboard, Database, Bell, Trash2, CheckCircle2, AlertTriangle, Info 
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
  
  useEffect(() => {
    loadProfile();
    loadNotifs();

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
      const currentUser = firebaseAuth.currentUser;
      if (!currentUser) {
        navigate('/login');
        return;
      }
      
      const dynamicOwner = await getOwnerEmail();
      setOwnerEmail(dynamicOwner);
      
      let data = await getUserProfile(currentUser.uid);
      const isOwnerEmail = currentUser.email?.toLowerCase() === dynamicOwner || 
                           currentUser.email?.toLowerCase() === 'mhm763517@gmail.com' ||
                           currentUser.email?.toLowerCase() === 'gokerebrahimopq@gmail.com';
      
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold text-slate-500">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-4" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 font-extrabold text-xl">!</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-2 font-sans">فشل الاتصال بقاعدة البيانات الآمنة</h2>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed font-sans">
            حدث خطأ أثناء محاولة الاتصال بـ Firestore أو استدعاء الملف الشخصي للمستخدم. قد يكون ذلك بسبب تأخر التهيئة السحابية أو انقطاع غير متوقع للشبكة.
          </p>
          {(error.includes("offline") || error.includes("Failed")) && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[11px] text-amber-800 mb-4 leading-normal text-right font-sans">
              💡 <strong>توضيح الاتصال:</strong> يحاول تطبيق الويب الاتصال بخدمات Firebase السحابية المؤمّنة، وإذا كان الاتصال المحلي أو بيئة الاختبار مغلقة فقد تظهر رسالتك كـ (Offline). يرجى الضغط على زر إعادة المحاولة الآن لتنشيط الاتصال المتزامن.
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
  const isOwner = firebaseAuth.currentUser?.email?.toLowerCase() === ownerEmail || firebaseAuth.currentUser?.email?.toLowerCase() === 'mhm763517@gmail.com';
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans flex flex-col pb-12" dir="rtl">
      
      {/* Top Professional Navigation Header with Blue-Indigo Medical Gradient */}
      <header className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 border-b border-indigo-900 text-white sticky top-0 z-40 shadow-xl select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Logout trigger button */}
            <button
              onClick={handleLogout}
              className="bg-slate-800 hover:bg-slate-755 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>

            {/* Role Demo Emulator Dropdown (Only shown to authentic Admins like the Owner/Director) */}
            {profile && profile.role === 'admin' && (
              <div className="flex items-center gap-1.5 bg-slate-800 bg-opacity-65 p-1 px-2.5 rounded-xl border border-slate-700">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] text-slate-350 hidden md:inline font-semibold">تغيير واجهة الاختبار:</span>
                <select
                  value={activeRole}
                  onChange={(e) => setEmulatedRole(e.target.value as UserRole)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer border-none text-right"
                >
                  <option value="receptionist" className="text-slate-900">واجهة الاستقبال (Receptionist)</option>
                  <option value="phlebotomist" className="text-slate-900">واجهة أخصائي السحب (Phlebotomist)</option>
                  <option value="technician" className="text-slate-900">واجهة فني معمل (Technician)</option>
                  <option value="patient" className="text-slate-900">واجهة المريض (Patient Portal)</option>
                  <option value="admin" className="text-slate-900">واجهة Directeur (Admin Panel)</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            
            {/* INTERACTIVE PUSH NOTIFICATION BELL DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setShowNotifCard(!showNotifCard)}
                className="bg-slate-850 p-2 rounded-xl border border-slate-700 relative hover:bg-slate-800 transition-all cursor-pointer"
                title="تنبيهات وأحداث المعمل الفورية"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifCard && (
                <div 
                  className="absolute left-0 top-11 w-80 bg-white text-slate-800 shadow-2xl rounded-2xl border border-slate-100 p-4 z-50 flex flex-col gap-3 text-right"
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
                    <span className="text-xs font-extrabold text-slate-800">جرس التنبيهات والأحداث الطبية</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto flex flex-col divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-[10px]">
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
                          <div key={notif.id} className="py-2.5 flex gap-2.5 items-start">
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

            {/* Logged in User Identity Details */}
            {profile && (
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 justify-end">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold font-mono uppercase ${
                      profile.role === 'admin' ? 'bg-red-500 text-white' :
                      profile.role === 'receptionist' ? 'bg-indigo-500 text-white' :
                      profile.role === 'technician' ? 'bg-emerald-500 text-white' :
                      profile.role === 'phlebotomist' ? 'bg-amber-500 text-white' :
                      'bg-slate-600 text-slate-100'
                  }`}>
                    {profile.role === 'admin' ? 'ADMIN' : 
                     profile.role === 'receptionist' ? 'STAFF' : 
                     profile.role === 'technician' ? 'TECH' : 
                     profile.role === 'phlebotomist' ? 'PHLEB' : 'PATIENT'}
                  </span>
                  <span>{profile.nameAr}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">@{profile.username}</span>
              </div>
            )}

            <div className="bg-slate-850 p-2 rounded-xl border border-slate-700">
              <UserIcon className="w-5 h-5 text-slate-300" />
            </div>

            {/* Brand Logo & Slogan */}
            <div className="border-r border-slate-800 pr-3 flex items-center gap-2">
              <div className="text-right">
                <div className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1">
                  <span>المختبر الطبي المتكامل</span>
                  <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <p className="text-[9px] text-slate-400 font-medium tracking-wider" dir="ltr">DIAGNOSTIC WORKSTATION</p>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Main Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 flex-1 w-full flex flex-col gap-6">
        
        {/* Dynamic emulated dashboard rendering based on chosen role */}
        <div className="flex-1">
          <div className="flex flex-col gap-6">
            {isOwner && <DriveUpload />}
            {activeRole === 'receptionist' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                  <p className="text-xs text-slate-500">تم تسجيل الدخول كموظف استقبال وطبيب معتمد لحجز الملفات الطبية للمرضى ومتابعة نقاط الولاء والزيارات</p>
                  <h2 className="text-base font-extrabold">لوحة عمل الاستقبال والطلبات</h2>
                </div>
                <PatientWorkspace refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
              </div>
            )}

            {activeRole === 'phlebotomist' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                  <p className="text-xs text-slate-500">منصة أخصائي سحب العينات؛ يمكنك هنا طباعة ملصقات الباركود والاتصال عبر ASTM وتأكيد سحب عينات الفروع</p>
                  <h2 className="text-base font-extrabold">منصة سحب وتوجيه العينات المخبرية</h2>
                </div>
                <PhlebotomistPanel refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
              </div>
            )}

            {activeRole === 'technician' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                  <p className="text-xs text-slate-500">مرحباً بك الدكتور فني العينات؛ يسعك هنا فحص قيم الذعر والاعتماد التلقائي الذكي بمحرك القواعد الطبية</p>
                  <h2 className="text-base font-extrabold">منصة تدقيق واعتماد نتائج التحاليل</h2>
                </div>
                <TechnicianPanel refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
              </div>
            )}

            {activeRole === 'patient' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-end text-slate-850 mb-1">
                  <p className="text-xs text-slate-505">تتبع مؤشرات صحتك وحلل تطورات الفحوصات الطبية المعتمدة واستدلالات المختبر</p>
                  <h2 className="text-base font-extrabold">بوابة المريض والملف الصحي الإلكتروني</h2>
                </div>
                <PatientDashboard />
              </div>
            )}

            {activeRole === 'admin' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 justify-end text-slate-800 mb-1">
                  <p className="text-xs text-slate-500">لوحة المراقبة الشاملة، الإحصائيات الحيوية، والتحكم بالأدوار وتصاريح دخول الطاقم وطباعة التقارير</p>
                  <h2 className="text-base font-extrabold">لوحة الإشراف وإدارة النظام</h2>
                </div>
                <AdminPanel refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
