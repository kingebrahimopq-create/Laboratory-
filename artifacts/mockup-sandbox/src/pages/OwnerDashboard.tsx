import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [labName, setLabName] = useState('مختبر النخبة الطبي');
  const [doctorName, setDoctorName] = useState('د. إبراهيم');
  const [labEmail, setLabEmail] = useState('mhm763517@gmail.com');
  
  // بيانات تجريبية حقيقية للهيكل
  const [testTypes, setTestTypes] = useState([
    { id: '1', name: 'CBC', price: 150, category: 'Hematology' },
    { id: '2', name: 'HbA1c', price: 200, category: 'Biochemistry' },
    { id: '3', name: 'Lipid Profile', price: 350, category: 'Biochemistry' },
  ]);

  const [discounts, setDiscounts] = useState([
    { id: '1', name: 'خصم نقابة الأطباء', value: 20, type: 'PERCENT' },
    { id: '2', name: 'عرض العائلة', value: 50, type: 'FIXED' },
  ]);

  const [staff, setStaff] = useState([
    { id: '1', name: 'أحمد محمود', role: 'ASSISTANT', permissions: ['ADD_PATIENT', 'VIEW_RESULTS'] },
    { id: '2', name: 'سارة حسن', role: 'RECEPTION', permissions: ['ADD_PATIENT', 'FINANCE'] },
  ]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col md:flex-row font-sans text-right" dir="rtl">
      {/* Sidebar */}
      <div className="w-full md:w-72 bg-white border-l border-slate-200 p-6 flex flex-col shadow-sm relative z-20">
        <div className="flex items-center gap-4 mb-12 px-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-blue-200">🏥</div>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight">{labName}</h1>
            <p className="text-xs text-blue-600 font-bold mt-0.5">لوحة التحكم المركزية</p>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          {[
            { id: 'overview', label: 'الرئيسية', icon: '📊' },
            { id: 'patients', label: 'المرضى و QR', icon: '👥' },
            { id: 'tests_mgmt', label: 'أنواع التحاليل', icon: '🧪' },
            { id: 'discounts', label: 'الخصومات والعروض', icon: '🏷️' },
            { id: 'staff', label: 'إدارة الموظفين', icon: '👔' },
            { id: 'settings', label: 'الإعدادات المتقدمة', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                activeTab === item.id 
                ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm">👨‍⚕️</div>
              <p className="text-sm font-black text-slate-800 truncate">{doctorName}</p>
            </div>
            <p className="text-[10px] text-slate-400 mr-11">{labEmail}</p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 justify-start px-4 rounded-xl font-bold"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            🚪 تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-[#f8fafc]">
        <header className="sticky top-0 z-10 bg-[#f8fafc]/80 backdrop-blur-md px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-800">أهلاً دكتور إبراهيم</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">نظام المختبر يعمل بكامل طاقته</p>
          </div>
          <div className="flex gap-4">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">التاريخ اليوم</span>
              <span className="text-sm font-black text-slate-700">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-2xl px-6 font-bold">
              + تسجيل مريض جديد
            </Button>
          </div>
        </header>

        <div className="px-8 pb-12">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="overview" className="space-y-8 mt-0 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'إجمالي المرضى', value: '1,284', change: '+12%', icon: '👥', color: 'blue' },
                  { label: 'تحاليل اليوم', value: '42', change: '+5', icon: '📊', color: 'cyan' },
                  { label: 'بانتظار التوثيق', value: '08', change: 'هام', icon: '📝', color: 'amber' },
                  { label: 'إيرادات الشهر', value: '24,500 ج.م', change: '+18%', icon: '💰', color: 'emerald' },
                ].map((stat, i) => (
                  <Card key={i} className="p-6 border-none shadow-sm rounded-3xl bg-white group hover:shadow-xl hover:shadow-slate-200 transition-all duration-500">
                    <div className="flex justify-between items-start">
                      <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                        {stat.icon}
                      </div>
                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg bg-${stat.color}-50 text-${stat.color}-600`}>{stat.change}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400 mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-8 border-none shadow-sm rounded-3xl bg-white">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-slate-800 text-lg">التحاليل الأخيرة والتوثيق</h3>
                    <Button variant="outline" className="rounded-xl text-xs font-bold border-slate-200">تصدير التقارير</Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { name: 'أحمد محمد علي', type: 'CBC', status: 'مكتمل', price: '150 ج.م' },
                      { name: 'سارة إبراهيم', type: 'HbA1c', status: 'قيد المراجعة', price: '200 ج.م' },
                      { name: 'محمود حسن', type: 'Lipid Profile', status: 'انتظار', price: '350 ج.م' },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">{row.name[0]}</div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{row.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{row.type} • {row.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black ${
                            row.status === 'مكتمل' ? 'bg-emerald-50 text-emerald-600' : 
                            row.status === 'قيد المراجعة' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            {row.status}
                          </span>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">👁️</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-8 border-none shadow-lg rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                  <h3 className="font-black text-lg mb-6 relative z-10">إعدادات الطباعة المباشرة</h3>
                  <div className="space-y-6 relative z-10">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                      <p className="text-xs font-bold text-slate-400 mb-2">الطابعة النشطة</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">HP Laserjet Pro 400</span>
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs py-5 font-bold">اختبار الطابعة</Button>
                      <Button className="bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs py-5 font-bold">تغيير الإعدادات</Button>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                      * النظام يدعم الطابعات الحرارية (80mm) وطابعات A4 التقليدية مع توافق كامل مع صلاحيات المتصفح.
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="max-w-4xl mt-0 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-8 border-none shadow-sm rounded-3xl bg-white">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="text-blue-600">🏢</span> هوية المختبر
                  </h3>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-1">اسم المعمل (يظهر للمريض)</label>
                      <input value={labName} onChange={(e) => setLabName(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-500 mr-1">اسم الطبيب المسؤول</label>
                      <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border-none focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm" />
                    </div>
                    <div className="pt-4">
                      <Button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-lg shadow-slate-200">حفظ الإعدادات العامة</Button>
                    </div>
                  </div>
                </Card>

                <Card className="p-8 border-none shadow-sm rounded-3xl bg-white">
                  <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                    <span className="text-blue-600">👔</span> الموظفين والصلاحيات
                  </h3>
                  <div className="space-y-4">
                    {staff.map((member) => (
                      <div key={member.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-black text-slate-800 text-sm">{member.name}</p>
                          <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{member.role}</p>
                        </div>
                        <Button variant="ghost" className="text-[10px] font-black h-8 rounded-lg bg-white border border-slate-200">تعديل</Button>
                      </div>
                    ))}
                    <Button variant="ghost" className="w-full border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 rounded-2xl py-6 text-xs font-bold">
                      + إضافة موظف جديد وتحديد صلاحياته
                    </Button>
                  </div>
                </Card>

                <Card className="p-8 border-none shadow-sm rounded-3xl bg-white md:col-span-2">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="text-blue-600">🧪</span> تسعير التحاليل والخصومات
                    </h3>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-black">إضافة تحليل جديد</Button>
                      <Button size="sm" variant="outline" className="rounded-xl text-[10px] font-black">إضافة عرض خصم</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 mb-2 px-1">قائمة الأسعار الحالية</p>
                      {testTypes.map(t => (
                        <div key={t.id} className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm font-bold">
                          <span className="text-slate-700">{t.name}</span>
                          <span className="text-blue-600">{t.price} ج.م</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-black text-slate-400 mb-2 px-1">الخصومات المتاحة</p>
                      {discounts.map(d => (
                        <div key={d.id} className="flex justify-between p-3 bg-emerald-50 rounded-xl text-sm font-bold border border-emerald-100">
                          <span className="text-emerald-800">{d.name}</span>
                          <span className="text-emerald-600">{d.type === 'PERCENT' ? `${d.value}%` : `${d.value} ج.م`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="patients" className="p-20 text-center animate-in fade-in duration-500">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">👥</div>
                <h3 className="text-xl font-black text-slate-800 mb-2">إدارة المرضى و QR Code</h3>
                <p className="text-slate-500 text-sm mb-8">يتم هنا عرض كافة المرضى، مع إمكانية طباعة بطاقات التعريف QR Code والإرسال التلقائي للنتائج عبر Gmail.</p>
                <Button className="bg-blue-600 text-white rounded-2xl px-8 py-4 font-bold shadow-lg shadow-blue-100">فتح السجل الكامل</Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
