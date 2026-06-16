import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs } from '../components/ui/tabs';

export function OwnerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [labStats, setLabStats] = useState({
    totalPatients: 0,
    todayTests: 0,
    pendingTests: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    // جلب إحصائيات المعمل
    fetchLabStats();
  }, []);

  const fetchLabStats = async () => {
    try {
      const response = await fetch('/api/lab/stats');
      if (response.ok) {
        const data = await response.json();
        setLabStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">لوحة التحكم</h1>
          <p className="text-blue-100">إدارة المعمل والمرضى والتحاليل</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">إجمالي المرضى</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">{labStats.totalPatients}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">التحاليل اليوم</p>
                  <p className="text-3xl font-bold text-cyan-600 mt-2">{labStats.todayTests}</p>
                </div>
                <div className="text-4xl">📊</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">قيد المراجعة</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">{labStats.pendingTests}</p>
                </div>
                <div className="text-4xl">⏳</div>
              </div>
            </div>
          </Card>

          <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">الإيرادات</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">{labStats.totalRevenue} ج.م</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>
          </Card>
        </div>

        {/* الأتابات الرئيسية */}
        <Tabs
          tabs={[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'patients', label: 'المرضى' },
            { id: 'tests', label: 'التحاليل' },
            { id: 'staff', label: 'الموظفون' },
            { id: 'settings', label: 'الإعدادات' },
          ]}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* محتوى الأتابات */}
        <div className="mt-6">
          {activeTab === 'overview' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">نظرة عامة على المعمل</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">آخر التحاليل</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• لا توجد بيانات حالياً</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-700">الأنشطة الأخيرة</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• لا توجد أنشطة حالياً</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'patients' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">إدارة المرضى</h2>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  + إضافة مريض جديد
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                لا توجد مرضى حالياً
              </div>
            </Card>
          )}

          {activeTab === 'tests' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">إدارة التحاليل</h2>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  + تحليل جديد
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                لا توجد تحاليل حالياً
              </div>
            </Card>
          )}

          {activeTab === 'staff' && (
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">إدارة الموظفين</h2>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  + إضافة موظف
                </Button>
              </div>
              <div className="text-center py-8 text-gray-500">
                لا توجد موظفون حالياً
              </div>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">إعدادات المعمل</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم المعمل (بالعربية)
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل اسم المعمل"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم الطبيب
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل اسم الطبيب"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اللون الأساسي
                  </label>
                  <input
                    type="color"
                    defaultValue="#0066cc"
                    className="w-full h-10 border border-gray-300 rounded-lg cursor-pointer"
                  />
                </div>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                  حفظ الإعدادات
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
