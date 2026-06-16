import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

export function PatientResults() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const patientPhone = localStorage.getItem('patientPhone');

  useEffect(() => {
    fetchPatientTests();
  }, []);

  const fetchPatientTests = async () => {
    try {
      const response = await fetch(`/api/patients/${patientPhone}/tests`);
      if (response.ok) {
        const data = await response.json();
        setTests(data);
      }
    } catch (err) {
      console.error('Error fetching tests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('patientPhone');
    localStorage.removeItem('patientId');
    window.location.href = '/';
  };

  const downloadPDF = (testId: string) => {
    window.open(`/api/tests/${testId}/download`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">نتائج التحاليل</h1>
            <p className="text-blue-100">عرض وتنزيل نتائج تحاليلك</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white"
          >
            تسجيل الخروج
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">جاري تحميل النتائج...</p>
          </div>
        ) : tests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-600 text-lg">لا توجد نتائج تحاليل حالياً</p>
            <p className="text-gray-500 mt-2">سيتم إضافة نتائجك هنا عند اكتمال التحاليل</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card
                key={test.id}
                className="overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-4">
                  <h3 className="font-bold text-lg">{test.testType}</h3>
                  <p className="text-blue-100 text-sm">
                    {new Date(test.requestDate).toLocaleDateString('ar-EG')}
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">الحالة:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        test.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : test.status === 'IN_PROGRESS'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {test.status === 'COMPLETED'
                        ? 'مكتمل'
                        : test.status === 'IN_PROGRESS'
                        ? 'قيد المعالجة'
                        : 'قيد الانتظار'}
                    </span>
                  </div>

                  {test.qrToken && (
                    <div className="text-center py-4 bg-gray-50 rounded-lg">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${test.qrToken}`}
                        alt="QR Code"
                        className="mx-auto"
                      />
                    </div>
                  )}

                  {test.status === 'COMPLETED' && (
                    <Button
                      onClick={() => downloadPDF(test.id)}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-600 hover:to-cyan-600"
                    >
                      📥 تنزيل النتيجة
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
