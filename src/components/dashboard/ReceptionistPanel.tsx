import { useState } from "react";
import { UserProfile, useGetTests, getGetTestsQueryKey, useCreatePatient, useCreateTest, useGetPatients, getGetPatientsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function ReceptionistPanel({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tests, isLoading: testsLoading } = useGetTests(undefined, { query: { queryKey: getGetTestsQueryKey() as unknown as unknown[] } });
  const { data: patients, isLoading: patientsLoading } = useGetPatients(undefined, { query: { queryKey: getGetPatientsQueryKey() as unknown as unknown[] } });

  const createPatient = useCreatePatient();
  const createTest = useCreateTest();

  const [newPatient, setNewPatient] = useState({ name: "", nameAr: "", phone: "", gender: "male", email: "" });
  const [newTest, setNewTest] = useState({ patientId: "", type: "", parameters: {}, amountCollected: 0, insuranceProvider: "", discountPercentage: 0 });

  const invalidate = (key: unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  return (
    <div className="space-y-6" dir="rtl">
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="register">تسجيل مريض</TabsTrigger>
          <TabsTrigger value="order">طلب فحص</TabsTrigger>
          <TabsTrigger value="tests">الفحوصات</TabsTrigger>
          <TabsTrigger value="patients">المرضى</TabsTrigger>
        </TabsList>

        {/* REGISTER PATIENT */}
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>تسجيل مريض جديد</span>
                <span dir="ltr" className="text-muted-foreground text-sm font-normal">Register New Patient</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>الاسم / Name</Label><Input value={newPatient.name} onChange={e => setNewPatient(p => ({...p, name: e.target.value}))} /></div>
                <div><Label>الاسم بالعربي</Label><Input value={newPatient.nameAr} onChange={e => setNewPatient(p => ({...p, nameAr: e.target.value}))} /></div>
                <div><Label>رقم الهاتف / Phone</Label><Input dir="ltr" value={newPatient.phone} onChange={e => setNewPatient(p => ({...p, phone: e.target.value}))} /></div>
                <div><Label>البريد الإلكتروني / Email</Label><Input dir="ltr" value={newPatient.email} onChange={e => setNewPatient(p => ({...p, email: e.target.value}))} /></div>
                <div>
                  <Label>الجنس / Gender</Label>
                  <Select value={newPatient.gender} onValueChange={v => setNewPatient(p => ({...p, gender: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">ذكر / Male</SelectItem>
                      <SelectItem value="female">أنثى / Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full md:w-auto" onClick={() => {
                if (!newPatient.name || !newPatient.phone) { toast({ title: "يرجى ملء الاسم ورقم الهاتف", variant: "destructive" }); return; }
                createPatient.mutate({ data: newPatient }, {
                  onSuccess: () => {
                    invalidate(getGetPatientsQueryKey() as unknown as unknown[]);
                    toast({ title: "تم تسجيل المريض بنجاح" });
                    setNewPatient({ name: "", nameAr: "", phone: "", gender: "male", email: "" });
                  },
                  onError: () => toast({ title: "خطأ في التسجيل", variant: "destructive" }),
                });
              }} disabled={createPatient.isPending}>
                {createPatient.isPending ? "جاري الحفظ..." : "تسجيل المريض"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ORDER TEST */}
        <TabsContent value="order">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>طلب فحص جديد</span>
                <span dir="ltr" className="text-muted-foreground text-sm font-normal">Order New Test</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>المريض / Patient</Label>
                  <Select value={newTest.patientId} onValueChange={v => setNewTest(p => ({...p, patientId: v}))}>
                    <SelectTrigger><SelectValue placeholder="اختر مريضاً..." /></SelectTrigger>
                    <SelectContent>
                      {patients?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nameAr} — {p.phone}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>نوع الفحص / Test Type</Label><Input value={newTest.type} onChange={e => setNewTest(p => ({...p, type: e.target.value}))} placeholder="مثال: CBC, HbA1c" /></div>
                <div><Label>المبلغ / Amount (SAR)</Label><Input type="number" value={newTest.amountCollected} onChange={e => setNewTest(p => ({...p, amountCollected: Number(e.target.value)}))} /></div>
                <div><Label>التأمين / Insurance</Label><Input value={newTest.insuranceProvider} onChange={e => setNewTest(p => ({...p, insuranceProvider: e.target.value}))} /></div>
                <div><Label>نسبة الخصم % / Discount</Label><Input type="number" value={newTest.discountPercentage} onChange={e => setNewTest(p => ({...p, discountPercentage: Number(e.target.value)}))} /></div>
              </div>
              <Button className="w-full md:w-auto" onClick={() => {
                if (!newTest.patientId || !newTest.type) { toast({ title: "يرجى اختيار المريض ونوع الفحص", variant: "destructive" }); return; }
                createTest.mutate({ data: { ...newTest } }, {
                  onSuccess: () => {
                    invalidate(getGetTestsQueryKey() as unknown as unknown[]);
                    toast({ title: "تم إنشاء طلب الفحص بنجاح" });
                    setNewTest({ patientId: "", type: "", parameters: {}, amountCollected: 0, insuranceProvider: "", discountPercentage: 0 });
                  },
                  onError: () => toast({ title: "خطأ في إنشاء الطلب", variant: "destructive" }),
                });
              }} disabled={createTest.isPending}>
                {createTest.isPending ? "جاري الإنشاء..." : "إنشاء طلب الفحص"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTS LIST */}
        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>سجل الفحوصات / Tests Record</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {testsLoading ? <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">نوع الفحص</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-right">سحب الدم</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests?.slice(0, 20).map(t => (
                        <tr key={t.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{t.type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${t.status === "completed" ? "bg-emerald-100 text-emerald-800" : t.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                              {t.status === "completed" ? "مكتمل" : t.status === "cancelled" ? "ملغى" : "معلق"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${t.isDrawn ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>
                              {t.isDrawn ? "تم" : "لم يتم"}
                            </span>
                          </td>
                          <td className="p-3">{t.amountCollected ?? "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!tests?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد فحوصات</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PATIENTS LIST */}
        <TabsContent value="patients">
          <Card>
            <CardHeader><CardTitle>قائمة المرضى / Patients List</CardTitle></CardHeader>
            <CardContent className="p-0">
              {patientsLoading ? <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الاسم</th>
                        <th className="p-3 text-right">الجنس</th>
                        <th className="p-3 text-right">الهاتف</th>
                        <th className="p-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients?.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{p.nameAr} / {p.name}</td>
                          <td className="p-3">{p.gender === "male" ? "ذكر" : "أنثى"}</td>
                          <td className="p-3" dir="ltr">{p.phone}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!patients?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد مرضى مسجلون</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
