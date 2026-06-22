import React, { useState, useEffect } from 'react';
import { 
  getAllPatients, 
  getAllTests, 
  getAllUsers, 
  updateUserRole, 
  createStaffInvite, 
  getAllStaffInvites, 
  deleteStaffInvite, 
  StaffInvite,
  getAllAppointments,
  updateAppointmentStatus,
  Appointment,
  getAllExpenses,
  getAllShiftClosings,
  addQCCheck,
  getAllQCChecks,
  addAuditLog,
  getAllAuditLogs,
  getCustomTestsCatalog,
  updateCustomTestCatalogItem,
  addCustomTestCatalogItem,
  updateTestResultsAndStatus,
  doc,
  db,
  updateDoc,
  getOwnerEmail,
  updateOwnerEmail
} from '../../lib/db';
import { auth } from '../../lib/firebase';
import { getDoc, setDoc } from 'firebase/firestore';
import { Patient, Test, User, UserRole } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Users, 
  ShieldAlert, 
  BadgeCheck, 
  ClipboardList, 
  Plus, 
  Trash2, 
  Mail, 
  UserPlus, 
  Calendar, 
  Clock, 
  Check, 
  X,
  CalendarCheck,
  DollarSign,
  TrendingUp,
  FileCheck,
  Cpu,
  Eye,
  Edit3,
  List,
  Activity,
  Heart,
  FileText
} from 'lucide-react';

const DEVICE_OPTIONS = [
  'جهاز كيمياء Mindray BS-240',
  'جهاز هرمونات Roche Cobas e411',
  'جهاز وظائف غدد Abbott Alinity',
  'جهاز صورة دم كاملة Sysmex XN-350',
  'مجهر فحص مخبري وخلوي Olympus',
];

export function AdminPanel({ refreshTrigger, onRefresh }: { refreshTrigger: boolean; onRefresh: () => void }) {
  // Tabs definition
  const [activeTab, setActiveTab] = useState<'dashboard' | 'verification' | 'qc' | 'staff' | 'audit' | 'pricing'>('dashboard');

  // Laboratory settings states
  const [labName, setLabName] = useState('لم يحدد بعد');
  const [showLabName, setShowLabName] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'lab_profile');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setLabName(snap.data().labName || 'لم يحدد بعد');
          setShowLabName(!!snap.data().showLabName);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const docRef = doc(db, 'settings', 'lab_profile');
      await setDoc(docRef, { labName, showLabName }, { merge: true });
      alert('تم حفظ إعدادات همر وهوية المختبر بنجاح في السجلات السحابية!');
    } catch (e) {
      console.error(e);
      alert('فشل حفظ التعديلات.');
    } finally {
      setSettingsLoading(false);
    }
  };

  // Load state variables
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [qcLogs, setQcLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [testsCatalog, setTestsCatalog] = useState<any[]>([]);

  // Editing state vars
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite member form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteNameAr, setInviteNameAr] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('receptionist');
  const [submittingInvite, setSubmittingInvite] = useState(false);

  // Ownership delegation form state
  const [ownerEmail, setOwnerEmail] = useState('mhm763517@gmail.com');
  const [delegationEmail, setDelegationEmail] = useState('');
  const [updatingOwner, setUpdatingOwner] = useState(false);
  const [delegationSuccess, setDelegationSuccess] = useState<string | null>(null);
  const [delegationError, setDelegationError] = useState<string | null>(null);

  // Verification actions
  const [selectedVerificationTest, setSelectedVerificationTest] = useState<Test | null>(null);
  const [medComments, setMedComments] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // Quality control form state
  const [selectedDevice, setSelectedDevice] = useState(DEVICE_OPTIONS[0]);
  const [qcStatus, setQcStatus] = useState<'passed' | 'failed'>('passed');
  const [qcFindings, setQcFindings] = useState('');
  const [submittingQC, setSubmittingQC] = useState(false);

  // Custom tests catalog states
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<any | null>(null);
  const [newPrice, setNewPrice] = useState('');
  const [newDescAr, setNewDescAr] = useState('');
  const [submittingCatalog, setSubmittingCatalog] = useState(false);

  useEffect(() => {
    loadAllAdminData();
    fetchOwnerEmail();
  }, [refreshTrigger]);

  const fetchOwnerEmail = async () => {
    try {
      const email = await getOwnerEmail();
      setOwnerEmail(email);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelegateOwnership = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegationEmail) {
      setDelegationError("فضلاً أدخل بريد إلكتروني صالح للتفويض.");
      return;
    }
    
    const currentLoggedEmail = auth.currentUser?.email;
    const isOwner = currentLoggedEmail === ownerEmail || currentLoggedEmail === 'mhm763517@gmail.com';
    
    if (!isOwner) {
      setDelegationError("خطأ: أنت لا تملك صلاحية تفويض أو نقل ملكية المعمل.");
      return;
    }

    if (delegationEmail.trim().toLowerCase() === currentLoggedEmail?.toLowerCase()) {
      setDelegationError("البريد المدخل هو بريدك الفعلي بالفعل كمالك الحالي.");
      return;
    }

    setUpdatingOwner(true);
    setDelegationError(null);
    setDelegationSuccess(null);
    try {
      await updateOwnerEmail(delegationEmail.trim().toLowerCase());
      setDelegationSuccess(`تم تفويض الملكية بالكامل وجعل البريد الإلكتروني: ${delegationEmail.trim()} مالكاً رئيساً للمعمل بنجاح!`);
      setOwnerEmail(delegationEmail.trim().toLowerCase());
      setDelegationEmail('');
      await addAuditLog({
        userId: auth.currentUser?.uid || 'unknown',
        username: auth.currentUser?.email || 'unknown',
        action: 'DELEGATE_OWNERSHIP',
        details: `Delegated owner rights from ${currentLoggedEmail} to ${delegationEmail.trim().toLowerCase()}`
      });
    } catch (err: any) {
      console.error(err);
      setDelegationError(`فشل التفويض: ${err.message || 'يرجى مراجعة الصلاحيات والاتصال بالمخدم'}`);
    } finally {
      setUpdatingOwner(false);
    }
  };

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [
        allUsers, 
        allPatients, 
        allTests, 
        allInvites, 
        allAppointments,
        allExpenses,
        allShifts,
        allQC,
        allAudits,
        catalog
      ] = await Promise.all([
        getAllUsers(),
        getAllPatients(),
        getAllTests(),
        getAllStaffInvites(),
        getAllAppointments(),
        getAllExpenses(),
        getAllShiftClosings(),
        getAllQCChecks(),
        getAllAuditLogs(),
        getCustomTestsCatalog()
      ]);

      setUsers(allUsers);
      setPatients(allPatients);
      setTests(allTests);
      setInvites(allInvites);
      setExpenses(allExpenses);
      setShifts(allShifts);
      setQcLogs(allQC.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)));
      setAuditLogs(allAudits.sort((a,b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0)));
      setTestsCatalog(catalog);
      
      const sortedAppointments = allAppointments.sort((a, b) => {
        const aT = a.createdAt?.toDate?.()?.getTime() || 0;
        const bT = b.createdAt?.toDate?.()?.getTime() || 0;
        return bT - aT;
      });
      setAppointments(sortedAppointments);

    } catch (err) {
      console.error('Error loading admin data: ', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      // Create Audit Log
      await addAuditLog({
        userId: 'admin_panel',
        username: 'admin',
        action: 'تحديث صلاحية عضو طاقم',
        details: `تحديث عضو ذو معرف ${userId} إلى الصلاحية (${newRole})`
      });
      loadAllAdminData();
    } catch (err) {
      console.error(err);
      alert('فشل تعديل الصلاحيات / Failed to update user permission.');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateAptStatus = async (id: string, status: 'approved' | 'cancelled') => {
    try {
      await updateAppointmentStatus(id, status);
      await addAuditLog({
        userId: 'admin_panel',
        username: 'admin',
        action: 'تعديل حجز موعد',
        details: `تعديل حالة موعد ذو المعرف ${id} إلى الحالة (${status})`
      });
      loadAllAdminData();
    } catch (err) {
      console.error(err);
      alert('فشل تحديث حالة الموعد / Failed to update appointment status.');
    }
  };

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !inviteNameAr) {
      alert('الرجاء تعبئة كافة الحقول المطلوبة');
      return;
    }
    setSubmittingInvite(true);
    try {
      await createStaffInvite(inviteEmail, inviteNameAr, inviteName, inviteRole);
      setInviteEmail('');
      setInviteName('');
      setInviteNameAr('');
      setInviteRole('receptionist');
      
      await addAuditLog({
        userId: 'admin_panel',
        username: 'admin',
        action: 'توليد ترخيص دعوة طاقم',
        details: `دعوة البريد (${inviteEmail}) برتبة مرتقبة (${inviteRole})`
      });

      loadAllAdminData();
      alert('تمت إضافة موافقة العضو بنجاح سحابياً.');
    } catch (err) {
      console.error(err);
      alert('فشل إضافة صلاحية العضو.');
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleCancelInvite = async (email: string) => {
    if (!confirm('هل متأكد من إلغاء دعوة هذا البريد؟')) return;
    try {
      await deleteStaffInvite(email);
      loadAllAdminData();
    } catch (err) {
      console.error(err);
      alert('فشل إلغاء التخويل.');
    }
  };

  // Verification & add comment by Admin/Doctor on technician result
  const handleVerifyMedicalResult = async () => {
    if (!selectedVerificationTest) return;
    setSubmittingVerification(true);
    try {
      // Update clinical fields in Firestore document
      const testRef = doc(db, 'tests', selectedVerificationTest.id);
      await updateDoc(testRef, {
        status: 'completed',
        medicalComments: medComments,
        verifiedBy: 'د. ابراهيم - الاستشاري الطبي العام',
        verifiedAt: new Date().toISOString()
      } as any);

      // Log in audit
      await addAuditLog({
        userId: 'admin_doctor',
        username: 'admin',
        action: 'اعتماد نتائج مخبرية نهائية',
        details: `مراجعة وتصديق استشاري للتقرير الفني للفحص الخاص بالملف ${selectedVerificationTest.patientId}`
      });

      setSelectedVerificationTest(null);
      setMedComments('');
      loadAllAdminData();
      onRefresh();
      alert('✓ تم اعتماد وتنشيط التقرير الطبي بصيغته النهائية للعميل ماليًا وطبّيًا.');
    } catch (err) {
      console.error(err);
      alert('فشل تصديق واشهار التقرير النهائي.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Quality check entry save
  const handleSaveQC = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qcFindings) {
      alert('الرجاء إدخال نتائج فحص معايرة الأجهزة.');
      return;
    }
    setSubmittingQC(true);
    try {
      await addQCCheck({
        deviceName: selectedDevice,
        status: qcStatus,
        findings: qcFindings,
        checkedBy: 'استشاري جودة المعايير',
      });
      setQcFindings('');
      loadAllAdminData();
      alert('✓ تم تسجيل عهدة ومحاضر معايرة جودة أجهزة المعمل بنجاح.');
    } catch (err) {
      console.error(err);
      alert('فشل تسجيل فحص جودة الأجهزة.');
    } finally {
      setSubmittingQC(false);
    }
  };

  // Save modified prices in custom test catalog
  const handleUpdateTestCatalog = async () => {
    if (!selectedCatalogItem) return;
    setSubmittingCatalog(true);
    try {
      await updateCustomTestCatalogItem(selectedCatalogItem.id, {
        price: Number(newPrice),
        descriptionAr: newDescAr
      });
      setSelectedCatalogItem(null);
      loadAllAdminData();
      alert('✓ تم حفظ التسعيرة ونطاقات المعايير المحدثة بنجاح.');
    } catch (err) {
      console.error(err);
      alert('فشل حفظ التحديث لمخزن التسعير.');
    } finally {
      setSubmittingCatalog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  // Statistics Metrics
  const totalPatients = patients.length;
  const totalTests = tests.length;
  const pendingVerificationCount = tests.filter(t => t.status === 'pending' || (t.results && !t.status)).length;
  const completedCount = tests.filter(t => t.status === 'completed').length;
  
  // High-fidelity Financial aggregations
  const totalExpensesSum = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalIncomeSum = tests.reduce((sum, item) => sum + (Number(item.amountCollected) || (item.results ? 100 : 0)), 0);
  const netEarnings = totalIncomeSum - totalExpensesSum;

  return (
    <div className="flex flex-col gap-6 font-sans text-right" dir="rtl">
      
      {/* PROFESSIONAL MULTI-TAB ADMIN CONTROLLER WRAPPER */}
      <div className="flex flex-wrap bg-white p-1 rounded-2xl border border-slate-100 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>مؤشرات الإدارة والمالية</span>
        </button>
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'verification' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>الاعتماد والتعليق الطبي النهائي ({pendingVerificationCount})</span>
        </button>
        <button
          onClick={() => setActiveTab('qc')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'qc' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>جودة ومعايرة الأجهزة (QC)</span>
        </button>
        <button
          onClick={() => setActiveTab('staff')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'staff' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>شؤون الكادر والتراخيص</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4" />
          <span>سجل التدقيق والورديات (Audit Trail)</span>
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'pricing' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>تعديل لستة الأسعار والفحوصات</span>
        </button>
      </div>

      {/* TAB SUB-PAGES */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-6">
          {/* Integrated Financial & Clinical Bento Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Income Display */}
            <div className="p-5 bg-white rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between">
              <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">إجمالي الدخل المالي المقبوض</span>
                <span className="text-xl font-extrabold text-emerald-700 font-mono leading-none mt-1 block">
                  {totalIncomeSum} ج.م
                </span>
              </div>
            </div>

            {/* Total Cash Expenses daily */}
            <div className="p-5 bg-white rounded-2xl border border-rose-105 shadow-sm flex items-center justify-between">
              <div className="bg-rose-50 p-3 rounded-xl text-rose-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">المنصرف والمصروفات اليومية</span>
                <span className="text-xl font-extrabold text-rose-700 font-mono leading-none mt-1 block">
                  {totalExpensesSum} ج.م
                </span>
              </div>
            </div>

            {/* Net Profits */}
            <div className="p-5 bg-white rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between">
              <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                <FileCheck className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">صافي أرباح المحاسبة والعهدة</span>
                <span className="text-xl font-extrabold text-indigo-700 font-mono leading-none mt-1 block">
                  {netEarnings}  ج.م
                </span>
              </div>
            </div>

            {/* Medical Pending verification count */}
            <div className="p-5 bg-white rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">عينات تنتظر الاعتماد الاستشاري</span>
                <span className="text-xl font-extrabold text-amber-700 font-mono leading-none mt-1 block">
                  {pendingVerificationCount} عينة
                </span>
              </div>
            </div>
          </div>

          {/* Graphical Analytics and summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4">إنتاجية العينات والاعتماد اليومي</h3>
              <div className="w-full h-80 text-xs font-mono">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'السبت', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 6;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 6;
                    })()).length },
                    { name: 'الأحد', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 0;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 0;
                    })()).length },
                    { name: 'الإثنين', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 1;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 1;
                    })()).length },
                    { name: 'الثلاثاء', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 2;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 2;
                    })()).length },
                    { name: 'الأربعاء', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 3;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 3;
                    })()).length },
                    { name: 'الخميس', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 4;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 4;
                    })()).length },
                    { name: 'الجمعة', 'طلب جديد': tests.filter(t => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 5;
                    }).length, 'معتمد': tests.filter(t => t.status === 'completed' && (() => {
                      const d = t.createdAt instanceof Date ? t.createdAt : new Date((t.createdAt as any)?.toDate?.() || t.createdAt);
                      return d.getDay() === 5;
                    })()).length },
                  ]} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="طلب جديد" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="معتمد" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">أبرز مؤشرات الجودة الطبيّة</h3>
                <div className="flex flex-col gap-3 text-xs leading-relaxed">
                  <div className="bg-rose-50 border border-rose-150 p-3 rounded-xl text-rose-800">
                    ⚠️ <strong>العينات المرفوضة:</strong> {qcLogs.filter(q => q.status === 'failed').length} عينة - يتم تتبع حالة الجودة تلقائياً.
                  </div>
                  <div className="bg-indigo-50 border border-indigo-150 p-3 rounded-xl text-indigo-800">
                    💡 <strong>أجهزة معطلة أو تنبيهات:</strong> {qcLogs.length > 0 ? `${qcLogs.length} سجل معايرة مسجل.` : 'لا توجد تنبيهات حالية - النظام يعمل بكفاءة.'}
                  </div>
                </div>
              </div>

              {/* Laboratory Profile Settings */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col gap-4">
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 text-right">إعدادات ملف وهوية المختبر</h3>
                <div className="flex flex-col gap-3 text-xs text-right">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">اسم المعمل / المختبر النشط</label>
                    <input
                      type="text"
                      value={labName}
                      onChange={(e) => setLabName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs text-right font-medium"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <label className="text-slate-700 font-bold text-[11px]">تفعيل وإظهار اسم المعمل على شاشة الدخول وبوابة المرضى</label>
                    <input
                      type="checkbox"
                      checked={showLabName}
                      onChange={(e) => setShowLabName(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={settingsLoading}
                    onClick={handleSaveSettings}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors cursor-pointer mt-2 w-max mr-auto disabled:opacity-50"
                  >
                    {settingsLoading ? 'جاري الحفظ...' : 'حفظ الهوية والتعديلات 💾'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: MEDICAL RESULTS VERIFICATION & COMMENTS --- */}
      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Waiting verifications list */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-850 text-sm mb-4">قائمة التحاليل المنتهية من الفني وقيد المراجعة</h3>
            
            {tests.filter(t => t.status === 'pending').length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا توجد نتائج تنتظر المراجعة الطبية أو الفنية حالياً.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {tests.filter(t => t.status === 'pending').map(test => (
                  <div
                    key={test.id}
                    className="p-4 rounded-xl border border-slate-100 text-right text-xs bg-slate-50 hover:border-slate-300 transition-all cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedVerificationTest(test);
                      setMedComments(test.results?.medicalComments || '');
                    }}
                  >
                    <div>
                      <button className="bg-indigo-600 text-white rounded-lg px-3 py-1 font-bold text-[10px]">
                        مراجعة واعتماد
                      </button>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-slate-800">{test.type}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {test.id.substring(0,8).toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Workspace for verifying medical result */}
          <div className="lg:col-span-6">
            {selectedVerificationTest ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="font-extrabold text-slate-850 text-sm mb-4 flex items-center gap-1.5 justify-end text-right">
                  <strong>تدقيق فني قبل الاعتماد الطبي</strong>
                </h3>

                {/* Patient data overview */}
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-right text-slate-705 mb-4 border border-slate-100">
                  <p>نوع التحليل: <strong>{selectedVerificationTest.type}</strong></p>
                  <p className="mt-1">رقم تتبع العينة المالي: <span className="font-mono">{selectedVerificationTest.id}</span></p>
                </div>

                {/* Values entered by technician */}
                <h4 className="font-bold text-xs text-slate-700 label mb-2 block text-right">النتائج المدخلة بواسطة فني المعمل (Parameters):</h4>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mb-4 text-xs font-mono flex flex-col gap-1.5">
                  {Object.entries(selectedVerificationTest.parameters || {}).map(([key, value]: [string, any]) => {
                    const resVal = selectedVerificationTest.results?.[key] || 'لم تدرج';
                    return (
                      <div key={key} className="flex justify-between border-b border-slate-100 pb-1">
                        <span>المدى الطبيعي: {value.normal} {value.unit}</span>
                        <strong className="text-indigo-950 font-bold">{resVal} {value.unit}  --- {value.name}</strong>
                      </div>
                    );
                  })}
                </div>

                {/* Comment box */}
                <div className="mb-4 text-right">
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">إضافة توصيات أو تعليق طبي استشاري لتقرير المريض (اختياري):</label>
                  <textarea
                    placeholder="مثال: يرجى مراجعة طبيب غدد صماء مختص للاطمئنان على مستويات الهرمون وإعادة الفحص في غضون 3 أسابيع."
                    value={medComments}
                    onChange={(e) => setMedComments(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-24 placeholder-slate-400"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleVerifyMedicalResult}
                    disabled={submittingVerification}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow transition-all"
                  >
                    {submittingVerification ? 'جاري الاعتماد...' : '✓ اعتماد ونشر النتيجة للمريض والموظفين'}
                  </button>
                  <button
                    onClick={() => setSelectedVerificationTest(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2 px-4 rounded-xl transition-all"
                  >
                    إلغاء لخلية أخرى
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <BadgeCheck className="w-10 h-10 text-slate-350" />
                <div>
                  <p className="text-xs font-bold text-slate-500">محطة اعتماد التقارير الاستشارية</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    حدد أحد طلبات التحليل من اللوحة اليمنى لمراجعة الأرقام المكتوبة وتأكيد دقتها مع إضافة نص التشخيص المعتمد والنهائي.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 3: DEVICE QUALITY CONTROL (QC) --- */}
      {activeTab === 'qc' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Quality check input */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-805 text-sm mb-4">تسجيل محاضر فحص ومعايرة جودة الأجهزة</h3>
            
            <form onSubmit={handleSaveQC} className="flex flex-col gap-4 text-right">
              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1.5">العينة وتصميم الجهاز المستهدف:</label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold text-slate-800"
                >
                  {DEVICE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1.5">حالة وتصديق المعايرة الجارية:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setQcStatus('passed')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${
                      qcStatus === 'passed' ? 'bg-emerald-50 border-emerald-550 text-emerald-800 font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✓ المعايرة مطابقة لمعايير المصنع (Passed)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQcStatus('failed')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all border ${
                      qcStatus === 'failed' ? 'bg-rose-50 border-rose-550 text-rose-800 font-bold' : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    ✗ انحراف بالمعايير / قيد الصيانة (Failed)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-705 mb-1.5">النتائج والبارامترات التفصيلية للمعايرة والقرارات:</label>
                <textarea
                  placeholder="مثال: قياس نطاق عينات ضبط المعايير اليومي (L1, L2, L3)؛ الانحراف المعياري SD أقل من 2.0 ويقع بالحدود المعتمدة."
                  required
                  value={qcFindings}
                  onChange={(e) => setQcFindings(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-28 placeholder-slate-400"
                />
              </div>

              <button
                type="submit"
                disabled={submittingQC}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow transition-all"
              >
                {submittingQC ? 'جاري الحفظ للتاريخ...' : 'تسجيل محضر ضبط ومعايرة الجهاز'}
              </button>
            </form>
          </div>

          {/* Historical Quality checks log */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="font-extrabold text-slate-805 text-sm mb-4 border-b border-slate-50 pb-2">سجلات معايرة الأجهزة الموثقة (Automated QC Trail)</h3>
            
            {qcLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                لا توجد سجلات معايرة مدخلة حالياً.
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {qcLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-right text-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                        log.status === 'passed' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 animate-pulse'
                      }`}>
                        {log.status === 'passed' ? 'معايرة ناجحة / مطابقة' : 'تنح وبحاجة لتعديل الحساس'}
                      </span>
                      <strong className="text-slate-800 font-bold">{log.deviceName}</strong>
                    </div>

                    <p className="text-slate-650 leading-relaxed mt-1 font-semibold">{log.findings}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 font-mono">
                      <span>المدقق: {log.checkedBy}</span>
                      <span>
                        {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 4: STAFF & GENERAL MEMBERS INVITES --- */}
      {activeTab === 'staff' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Owners Delegation Block */}
          <div className="lg:col-span-12 flex flex-col gap-6">
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-center border-b border-indigo-850 pb-3 mb-4">
                <span className="text-[10px] bg-indigo-500 bg-opacity-20 text-indigo-200 px-2.5 py-0.5 rounded-lg border border-indigo-500 border-opacity-30 font-bold">رتبة المالك الفائقة</span>
                <h3 className="font-bold text-sm text-right text-indigo-100">بوابة تفويض ونقل ملكية النظام</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4 text-right">
                بصفتك المالك العام للنظام في هذا المعمل الطبي <strong className="text-indigo-400 font-mono">({ownerEmail})</strong>، يتيح لك هذا المحرك نقل وتفويض كامل رخص التحكم والمصادقة للبريد الجديد المفوّض إليه فوراً وبشكل تزامني آمن.
              </p>

              {delegationSuccess && (
                <div className="mb-4 p-3 bg-emerald-500 bg-opacity-20 border border-emerald-500 border-opacity-30 rounded-xl text-xs font-semibold text-emerald-300 text-right">
                  {delegationSuccess}
                </div>
              )}

              {delegationError && (
                <div className="mb-4 p-3 bg-rose-500 bg-opacity-20 border border-rose-500 border-opacity-30 rounded-xl text-xs font-semibold text-rose-300 text-right">
                  {delegationError}
                </div>
              )}

              <form onSubmit={handleDelegateOwnership} className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-right items-end">
                <div className="sm:col-span-8">
                  <label className="block text-xs font-bold text-indigo-300 mb-1">البريد الإلكتروني للجهة الطبية البديلة</label>
                  <input
                    type="email"
                    required
                    value={delegationEmail}
                    onChange={(e) => setDelegationEmail(e.target.value)}
                    placeholder="owner@medlab.com"
                    className="w-full p-2.5 bg-slate-800 bg-opacity-50 border border-indigo-900 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none text-xs text-left text-white font-mono"
                    dir="ltr"
                  />
                </div>
                <div className="sm:col-span-4">
                  <button
                    type="submit"
                    disabled={updatingOwner}
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 bg-indigo-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors disabled:bg-slate-800"
                  >
                    <span>{updatingOwner ? "جاري ترحيل الترخيص..." : "تأكيد ترحيل الملكية 🔒"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Member invite creator */}
          <div className="lg:col-span-12 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="font-bold text-slate-800 text-sm mb-4">إضافة وتخويل مستخدم جديد (طاقم/أطباء استقبال)</h3>
              
              <form onSubmit={handleAddInvite} className="grid grid-cols-1 md:grid-cols-12 gap-4 text-right">
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-705 mb-1">البريد الإلكتروني للعضو</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="example@mail.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs text-left"
                    dir="ltr"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-705 mb-1">الاسم بالكامل (عربي)</label>
                  <input
                    type="text"
                    required
                    value={inviteNameAr}
                    onChange={(e) => setInviteNameAr(e.target.value)}
                    placeholder="د. أحمد علي"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-705 mb-1">نوع الرتبة والصلاحية</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-600 focus:outline-none text-xs"
                  >
                    <option value="receptionist">موظف استقبال</option>
                    <option value="technician">فني معمل</option>
                    <option value="phlebotomist">أخصائي سحب عينات</option>
                    <option value="admin">مدير معمل</option>
                  </select>
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="submit"
                    disabled={submittingInvite}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>دعوة العضو</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Active user accounts database query */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <h3 className="font-bold text-slate-800 text-sm">الكادر والمستخدمين النشطين في الخادم</h3>
              </div>

              <div className="overflow-x-auto text-xs">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-100">
                      <th className="py-3 px-4 font-bold text-right">الاسم والملف</th>
                      <th className="py-3 px-4 font-bold text-center">نوع الترخيص</th>
                      <th className="py-3 px-4 font-bold text-left">تعديل التصاريح</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-all border-b border-slate-50">
                        <td className="py-3 px-4">
                          <strong className="text-slate-800 font-bold">{u.nameAr}</strong>
                          <div className="text-[10px] text-slate-400 font-mono">@{u.username} • {u.email}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            u.role === 'admin' ? 'bg-red-50 text-red-800 border border-red-200' :
                            u.role === 'receptionist' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                            u.role === 'technician' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            u.role === 'phlebotomist' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            'bg-slate-550 text-slate-800'
                          }`}>
                            {u.role === 'admin' ? 'المدير الطبي الاستشاري' : 
                             u.role === 'receptionist' ? 'موظف استقبال وتأمين' : 
                             u.role === 'technician' ? 'فني معمل كيميائي' : 
                             u.role === 'phlebotomist' ? 'أخصائي سحب العينات' : 'مريض مسجل'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left">
                          <select
                            value={u.role}
                            disabled={updatingUserId === u.id}
                            onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                            className="p-1 px-2 border rounded-lg focus:outline-none text-xs bg-white text-slate-700"
                          >
                            <option value="receptionist">موظف استقبال</option>
                            <option value="technician">فني معمل</option>
                            <option value="phlebotomist">أخصائي سحب</option>
                            <option value="patient">مريض</option>
                            <option value="admin">مدير معمل</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invited email list */}
            {invites.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">دعوات بانتظار استكمال التسجيل</h3>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 border-b border-indigo-100">
                        <th className="py-3 px-4 font-bold text-right">البريد المعتمد بالخادم</th>
                        <th className="py-3 px-4 font-bold text-right font-semibold">الصلاحية المؤقتة</th>
                        <th className="py-3 px-4 font-bold text-left">إلغاء الترخيص</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invites.map(inv => (
                        <tr key={inv.email} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-700">{inv.email}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-100">
                              {inv.role === 'admin' ? 'مشرف عام' : inv.role === 'receptionist' ? 'استقبال' : 'فني معمل'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-left">
                            <button
                              onClick={() => handleCancelInvite(inv.email)}
                              className="text-red-600 hover:bg-rose-50 p-1 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 5: AUDIT LOGS & SHIFT CLOSINGS --- */}
      {activeTab === 'audit' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Shifts closures table */}
          <div className="lg:col-span-12 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-2">محاضر تسليم الخزائن وإغلاق الورديات المالية</h3>
              
              {shifts.length === 0 ? (
                <div className="p-8 text-center text-slate-450 italic">لا توجد أي تقارير إقفال واردة من موظفي الاستقبال لليوم.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shifts.map((shift, idx) => (
                    <div key={shift.id || idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-right text-xs leading-relaxed">
                      <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-2">
                        <span className="bg-indigo-100 text-indigo-800 text-[9px] px-2 py-0.5 rounded-full font-bold font-mono">#{shift.id?.substring(0,8).toUpperCase()}</span>
                        <strong>التاريخ: {shift.date}</strong>
                      </div>
                      <div className="flex flex-col gap-1 text-slate-650 font-semibold mb-2">
                        <p>رأس المال الافتتاحي: <strong>{shift.initialCash} ج.م</strong></p>
                        <p>مقبوضات الفحوصات: <strong className="text-emerald-700">+{shift.totalCollected} ج.م</strong></p>
                        <p>المصاريف النثرية المخصومة: <strong className="text-rose-700">-{shift.totalExpenses} ج.م</strong></p>
                        <p className="border-t border-slate-200 pt-1.5 mt-1 font-extrabold text-slate-850">المسلم الصافي للعهدة: <span className="text-indigo-700 font-mono text-sm bg-white px-2 py-0.5 rounded border border-slate-200">{shift.netAmount} ج.م</span></p>
                      </div>
                      <p className="text-[10px] text-slate-400 bg-white p-2 rounded-lg border border-slate-200">💬 {shift.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit log logs list */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-50 pb-2">سجلات تدقيق أمن وحركة النظام (Audit Trail Log)</h3>
              
              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">لا توجد عمليات مراجعة مسجلة في الوقت الراهن بمحاضر الخادم.</div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
                  {auditLogs.map((log, idx) => (
                    <div key={log.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-right text-xs">
                      <div className="flex justify-between items-center text-[10px] text-slate-450 mb-1.5 font-mono">
                        <span>المدقق: @{log.username}</span>
                        <span>{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString('ar-EG') : new Date().toLocaleString('ar-EG')}</span>
                      </div>
                      <div className="font-bold text-slate-850">{log.action}</div>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-semibold leading-relaxed">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 6: PRICE INDEX AND PARAMETERS CONFIG --- */}
      {activeTab === 'pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Catalog Listing */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-50 pb-2">لائحة تسعير الخدمات الطبية الكيميائية</h3>
            
            <div className="divide-y divide-slate-100">
              {testsCatalog.map(item => (
                <div key={item.id} className="py-3 flex justify-between items-center text-right text-xs gap-4">
                  <div>
                    <button
                      onClick={() => {
                        setSelectedCatalogItem(item);
                        setNewPrice(String(item.price));
                        setNewDescAr(item.descriptionAr || '');
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg p-1 px-3 font-bold text-[10px]"
                    >
                      تعديل النطاق ومراجعة السعر
                    </button>
                  </div>

                  <div>
                    <div className="font-extrabold text-slate-800">{item.nameAr}</div>
                    <p className="text-[10px] text-slate-400 font-mono" dir="ltr">{item.nameEn}</p>
                    <p className="text-[10px] text-slate-500 font-semibold block mt-1">سعر الفحص بالخارج: <span className="font-mono text-emerald-700 font-bold">{item.price} ج.م</span></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Action form workspace */}
          <div className="lg:col-span-5">
            {selectedCatalogItem ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-right">
                <h3 className="font-extrabold text-slate-805 text-sm mb-4">تعديل تسعيرة الفحص والمدى الطبيعي</h3>
                
                <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs">
                  <p>الفحص النشط: <strong>{selectedCatalogItem.nameAr}</strong></p>
                  <p className="mt-1" dir="ltr"><span className="font-mono text-slate-400">{selectedCatalogItem.nameEn}</span></p>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">السعر المعياري بعد التعديل (EGP) *</label>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-bold text-slate-705 mb-1.5">التوصيف والإرشادات الطبية للفحص (لصالح المريض بالبوابة) *</label>
                  <textarea
                    value={newDescAr}
                    onChange={(e) => setNewDescAr(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl p-2.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-500 h-28 placeholder-slate-400 font-medium"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleUpdateTestCatalog}
                    disabled={submittingCatalog}
                    className="flex-1 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow"
                  >
                    {submittingCatalog ? 'جاري التحفيظ...' : 'حفظ تعديل الفحص بالمخزن'}
                  </button>
                  <button
                    onClick={() => setSelectedCatalogItem(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-2.5 px-4 rounded-xl"
                  >
                    إلغاء لغير خدمة
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <DollarSign className="w-10 h-10 text-slate-350" />
                <div>
                  <p className="text-xs font-bold text-slate-500">منظومة التسعير ونطاقات النتائج (Catalog Engine)</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                    اضغط على أي خدمة طبية في القائمة الجانبية لتعديل السعر وإرفاق الإرشادات التمهيدية للفحص لإصدار الفواتير بدقة.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
