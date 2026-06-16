import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  const [labName, setLabName] = useState('مختبرنا الطبي');
  const [doctorName, setDoctorName] = useState('د. إبراهيم');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <div className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-xl">🏥</div>
          <span className="font-bold text-xl truncate">{labName}</span>
        </div>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'الرئيسية', icon: '🏠' },
            { id: 'patients', label: 'المرضى', icon: '👥' },
            { id: 'tests', label: 'التحاليل', icon: '🧪' },
            { id: 'finance', label: 'المالية', icon: '💰' },
            { id: 'staff', label: 'الموظفين', icon: '👔' },
            { id: 'settings', label: 'الإعدادات', icon: '⚙️' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">👨‍⚕️</div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{doctorName}</p>
              <p className="text-xs text-slate-500">المالك</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-red-400 hover:text-red-300 hover:bg-red-400/10 justify-start px-4"
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            🚪 تسجيل الخروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">أهلاً بك، {doctorName}</h2>
            <p className="text-slate-500">إليك ما يحدث في مختبرك اليوم</p>
          </div>
          <div className="flex gap-3">
            <Button className="bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50">
              📅 {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">
              + تسجيل تحليل جديد
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'إجمالي المرضى', value: '1,284', color: 'blue', icon: '👥' },
                { label: 'تحاليل اليوم', value: '42', color: 'cyan', icon: '📊' },
                { label: 'نتائج جاهزة', value: '15', color: 'emerald', icon: '✅' },
                { label: 'إيرادات الشهر', value: '24,500 ج.م', color: 'indigo', icon: '💰' },
              ].map((stat, i) => (
                <Card key={i} className="p-6 border-none shadow-sm card-hover overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-2 h-full bg-${stat.color}-500`}></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <h3 className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</h3>
                    </div>
                    <span className="text-2xl opacity-80">{stat.icon}</span>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Patients */}
              <Card className="lg:col-span-2 p-6 border-none shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-slate-800">أحدث التحاليل</h3>
                  <Button variant="link" className="text-blue-600">عرض الكل</Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right">
                    <thead>
                      <tr className="text-slate-400 text-sm border-b border-slate-100">
                        <th className="pb-4 font-medium">المريض</th>
                        <th className="pb-4 font-medium">نوع التحليل</th>
                        <th className="pb-4 font-medium">الحالة</th>
                        <th className="pb-4 font-medium">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[
                        { name: 'أحمد محمد علي', type: 'CBC', status: 'مكتمل', date: '10:30 ص' },
                        { name: 'سارة إبراهيم', type: 'HbA1c', status: 'قيد المعالجة', date: '09:45 ص' },
                        { name: 'محمود حسن', type: 'Lipid Profile', status: 'انتظار', date: '09:15 ص' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 font-medium text-slate-700">{row.name}</td>
                          <td className="py-4 text-slate-600">{row.type}</td>
                          <td className="py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              row.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' : 
                              row.status === 'قيد المعالجة' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-4 text-slate-400 text-sm">{row.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Lab Info / Video */}
              <Card className="p-6 border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <h3 className="font-bold mb-4">دليل الاستخدام السريع</h3>
                <div className="aspect-video bg-white/10 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                  <span className="text-4xl group-hover:scale-110 transition-transform">▶️</span>
                  <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-1 rounded">2:45</div>
                </div>
                <p className="text-sm text-blue-100 leading-relaxed">
                  تعلم كيفية إضافة تحاليل جديدة وتخصيص الأسعار والخصومات في أقل من دقيقتين.
                </p>
                <Button className="w-full mt-6 bg-white text-blue-700 hover:bg-blue-50">
                  مشاهدة كافة الفيديوهات
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 mt-0">
            <Card className="p-8 border-none shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">إعدادات المعمل العامة</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم المعمل</label>
                    <input 
                      value={labName} 
                      onChange={(e) => setLabName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">اسم الطبيب المسؤول</label>
                    <input 
                      value={doctorName} 
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">اللون الأساسي للعلامة التجارية</label>
                  <div className="flex gap-3">
                    {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'].map((color) => (
                      <button 
                        key={color} 
                        className="w-10 h-10 rounded-full border-4 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      ></button>
                    ))}
                    <input type="color" className="w-10 h-10 rounded-full overflow-hidden border-none p-0 cursor-pointer" />
                  </div>
                </div>
                <div className="pt-6">
                  <Button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700">حفظ التغييرات</Button>
                </div>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">إدارة الصلاحيات</h3>
              <div className="space-y-4">
                {[
                  { role: 'طبيب مختبر', access: 'كامل الصلاحيات' },
                  { role: 'مساعد', access: 'إدخال بيانات + عرض نتائج' },
                  { role: 'موظف استقبال', access: 'تسجيل مرضى + تحصيل مالي' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                    <div>
                      <p className="font-bold text-slate-700">{item.role}</p>
                      <p className="text-xs text-slate-500">{item.access}</p>
                    </div>
                    <Button variant="outline" className="text-xs">تعديل الصلاحيات</Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full border-2 border-dashed border-slate-200 text-slate-500 hover:bg-slate-50">
                  + إضافة دور وظيفي جديد
                </Button>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="patients" className="p-12 text-center text-slate-500">جاري تطوير وحدة إدارة المرضى...</TabsContent>
          <TabsContent value="tests" className="p-12 text-center text-slate-500">جاري تطوير وحدة إدارة التحاليل...</TabsContent>
          <TabsContent value="finance" className="p-12 text-center text-slate-500">جاري تطوير الوحدة المالية...</TabsContent>
          <TabsContent value="staff" className="p-12 text-center text-slate-500">جاري تطوير وحدة الموظفين...</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
