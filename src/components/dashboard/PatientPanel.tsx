import { UserProfile } from "@workspace/api-client-react";
import { useGetTests, getGetTestsQueryKey, useGetPatient, getGetPatientQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PatientPanel({ profile }: { profile: UserProfile }) {
  const { data: tests, isLoading } = useGetTests({ patientId: profile.id }, {
    query: { queryKey: getGetTestsQueryKey({ patientId: profile.id }) as unknown as unknown[] }
  });

  const { data: patient } = useGetPatient(profile.id, {
    query: { queryKey: getGetPatientQueryKey(profile.id), enabled: !!profile.id }
  });

  return (
    <div className="space-y-6">
      {patient && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-1">النقاط / Loyalty Points</h2>
                <p className="text-sm text-muted-foreground" dir="ltr">Your current loyalty tier</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-primary">{patient.spentLoyaltyPoints || 0}</div>
                <div className="text-sm font-semibold uppercase px-3 py-1 bg-primary text-primary-foreground rounded-full mt-2">
                  {(patient.spentLoyaltyPoints || 0) < 100 ? 'Silver' : (patient.spentLoyaltyPoints || 0) < 300 ? 'Gold' : 'Platinum'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>النتائج الخاصة بك</span>
            <span dir="ltr">Your Test Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">جاري التحميل / Loading...</div>
          ) : (
            <div className="space-y-3">
              {tests?.map(test => (
                <div key={test.id} className="flex flex-col sm:flex-row justify-between p-4 border rounded-md gap-4">
                  <div>
                    <p className="font-bold text-lg">{test.type}</p>
                    <p className="text-sm text-muted-foreground">{new Date(test.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded text-sm ${test.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {test.status === 'completed' ? 'جاهزة / Ready' : 'قيد الفحص / Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {tests?.length === 0 && <p className="text-center py-8 text-muted-foreground">لا يوجد فحوصات سابقة / No previous tests</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
