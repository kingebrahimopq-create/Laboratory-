import { useState } from "react";
import {
  UserProfile, useGetDashboardSummary, getGetDashboardSummaryQueryKey, useGetPatients, getGetPatientsQueryKey, useCreatePatient, useDeletePatient,
  useGetTests, getGetTestsQueryKey, useUpdateTest, useDeleteTest,
  useGetUsers, getGetUsersQueryKey, useDeleteUser,
  useGetInventory, getGetInventoryQueryKey, useCreateInventoryItem,
  useGetExpenses, getGetExpensesQueryKey, useCreateExpense,
  useGetShifts, getGetShiftsQueryKey, useCreateShift,
  useGetQcChecks, getGetQcChecksQueryKey, useCreateQcCheck,
  useGetAuditLogs, getGetAuditLogsQueryKey,
  useGetLabSettings, useUpdateLabSettings,
  useGetNotifications, getGetNotificationsQueryKey, useClearNotifications,
  useGetRecentActivity, getGetRecentActivityQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function AdminPanel({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() as unknown as unknown[] } });
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() as unknown as unknown[] } });
  const { data: patients, isLoading: patientsLoading } = useGetPatients(undefined, { query: { queryKey: getGetPatientsQueryKey() as unknown as unknown[] } });
  const { data: tests, isLoading: testsLoading } = useGetTests(undefined, { query: { queryKey: getGetTestsQueryKey() as unknown as unknown[] } });
  const { data: users, isLoading: usersLoading } = useGetUsers({ query: { queryKey: getGetUsersQueryKey() as unknown as unknown[] } });
  const { data: inventory, isLoading: inventoryLoading } = useGetInventory({ query: { queryKey: getGetInventoryQueryKey() as unknown as unknown[] } });
  const { data: expenses, isLoading: expensesLoading } = useGetExpenses({ query: { queryKey: getGetExpensesQueryKey() as unknown as unknown[] } });
  const { data: shifts, isLoading: shiftsLoading } = useGetShifts({ query: { queryKey: getGetShiftsQueryKey() as unknown as unknown[] } });
  const { data: qcChecks, isLoading: qcLoading } = useGetQcChecks({ query: { queryKey: getGetQcChecksQueryKey() as unknown as unknown[] } });
  const { data: auditLogs, isLoading: auditLoading } = useGetAuditLogs({ query: { queryKey: getGetAuditLogsQueryKey() as unknown as unknown[] } });
  const { data: settings } = useGetLabSettings();
  const { data: notifications } = useGetNotifications({ query: { queryKey: getGetNotificationsQueryKey() as unknown as unknown[] } });

  const createPatient = useCreatePatient();
  const deletePatient = useDeletePatient();
  const updateTest = useUpdateTest();
  const deleteTest = useDeleteTest();
  const deleteUser = useDeleteUser();
  const createInventory = useCreateInventoryItem();
  const createExpense = useCreateExpense();
  const createShift = useCreateShift();
  const createQc = useCreateQcCheck();
  const clearNotifications = useClearNotifications();
  const updateSettings = useUpdateLabSettings();

  const [newPatient, setNewPatient] = useState({ name: "", nameAr: "", phone: "", gender: "male", email: "" });
  const [newInventoryItem, setNewInventoryItem] = useState({ name: "", nameAr: "", category: "reagents" as "tubes" | "reagents" | "consumables", categoryAr: "", quantity: 0, minTarget: 10, unit: "", unitAr: "" });
  const [newExpense, setNewExpense] = useState({ amount: 0, category: "", description: "", recordedBy: profile.name });
  const [newShift, setNewShift] = useState({ date: new Date().toISOString().split("T")[0], recordedBy: profile.name, initialCash: 0, totalCollected: 0, totalExpenses: 0, netAmount: 0, notes: "" });
  const [newQc, setNewQc] = useState({ deviceName: "", status: "passed" as "passed" | "failed", checkedBy: profile.name, findings: "" });
  const [settingsForm, setSettingsForm] = useState({ labName: settings?.labName ?? "", labNameAr: settings?.labNameAr ?? "", currency: settings?.currency ?? "SAR", phone: settings?.phone ?? "", address: settings?.address ?? "", addressAr: settings?.addressAr ?? "" });

  const inv = (key: unknown[]) => queryClient.invalidateQueries({ queryKey: key });

  const statCards = [
    { labelAr: "إجمالي المرضى", labelEn: "Total Patients", value: summary?.totalPatients, color: "text-primary" },
    { labelAr: "الفحوصات اليوم", labelEn: "Today's Tests", value: summary?.todayTests, color: "text-primary" },
    { labelAr: "الفحوصات المعلقة", labelEn: "Pending Tests", value: summary?.pendingTests, color: "text-amber-600" },
    { labelAr: "الدخل اليومي", labelEn: "Today Revenue", value: summary?.todayRevenue ? `${summary.todayRevenue} ${settings?.currency ?? "SAR"}` : "0", color: "text-emerald-600" },
    { labelAr: "فحوصات مكتملة", labelEn: "Completed Tests", value: summary?.completedTests, color: "text-emerald-600" },
    { labelAr: "نقص المخزون", labelEn: "Low Stock", value: summary?.lowStockItems, color: "text-destructive" },
    { labelAr: "الإشعارات", labelEn: "Unread Notifs", value: summary?.unreadNotifications, color: "text-amber-600" },
    { labelAr: "إجمالي الإيرادات", labelEn: "Total Revenue", value: summary?.totalRevenue ? `${summary.totalRevenue} ${settings?.currency ?? "SAR"}` : "0", color: "text-emerald-700" },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto pb-1">
          <TabsList className="inline-flex min-w-max gap-1 mb-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="patients">المرضى</TabsTrigger>
            <TabsTrigger value="tests">الفحوصات</TabsTrigger>
            <TabsTrigger value="staff">الموظفون</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="expenses">المصروفات</TabsTrigger>
            <TabsTrigger value="shifts">إغلاق الوردية</TabsTrigger>
            <TabsTrigger value="qc">ضبط الجودة</TabsTrigger>
            <TabsTrigger value="audit">سجل التدقيق</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
          </TabsList>
        </div>

        {/* OVERVIEW */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map((s, i) => (
              <Card key={i}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-xs text-muted-foreground">
                    <span>{s.labelAr}</span>
                    <span className="block text-[10px]" dir="ltr">{s.labelEn}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {summaryLoading ? <Skeleton className="h-8 w-16" /> : (
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value ?? 0}</div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader><CardTitle>آخر النشاطات / Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {activityLoading ? <Skeleton className="h-32 w-full" /> : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(activity as any[])?.map((a: any) => (
                    <div key={a.id} className="flex justify-between p-2 border rounded text-sm">
                      <span>{a.descriptionAr ?? a.description}</span>
                      <span className="text-muted-foreground text-xs" dir="ltr">{new Date(a.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                  {!(activity as any[])?.length && <p className="text-center text-muted-foreground py-4">لا يوجد نشاط حديث</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PATIENTS */}
        <TabsContent value="patients" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">إدارة المرضى / Patients</h2>
            <Dialog>
              <DialogTrigger asChild><Button>إضافة مريض جديد</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة مريض / Add Patient</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>الاسم / Name</Label><Input value={newPatient.name} onChange={e => setNewPatient(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>الاسم بالعربي</Label><Input value={newPatient.nameAr} onChange={e => setNewPatient(p => ({ ...p, nameAr: e.target.value }))} /></div>
                  <div><Label>الهاتف / Phone</Label><Input value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} dir="ltr" /></div>
                  <div><Label>البريد / Email</Label><Input value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} dir="ltr" /></div>
                  <div>
                    <Label>الجنس / Gender</Label>
                    <Select value={newPatient.gender} onValueChange={v => setNewPatient(p => ({ ...p, gender: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر / Male</SelectItem>
                        <SelectItem value="female">أنثى / Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => {
                    createPatient.mutate({ data: newPatient }, {
                      onSuccess: () => { inv(getGetPatientsQueryKey() as unknown as unknown[]); toast({ title: "تم إضافة المريض" }); setNewPatient({ name: "", nameAr: "", phone: "", gender: "male", email: "" }); },
                      onError: () => toast({ title: "خطأ", variant: "destructive" }),
                    });
                  }}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {patientsLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الاسم</th>
                        <th className="p-3 text-right">Name</th>
                        <th className="p-3 text-right">الهاتف</th>
                        <th className="p-3 text-right">الجنس</th>
                        <th className="p-3 text-right">تاريخ التسجيل</th>
                        <th className="p-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patients?.map(p => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{p.nameAr}</td>
                          <td className="p-3" dir="ltr">{p.name}</td>
                          <td className="p-3" dir="ltr">{p.phone}</td>
                          <td className="p-3">{p.gender === "male" ? "ذكر" : "أنثى"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(p.createdAt).toLocaleDateString("ar-SA")}</td>
                          <td className="p-3">
                            <Button variant="destructive" size="sm" onClick={() => deletePatient.mutate({ id: p.id }, { onSuccess: () => inv(getGetPatientsQueryKey() as unknown as unknown[]) })}>حذف</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!patients?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد مرضى</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TESTS */}
        <TabsContent value="tests" className="space-y-4">
          <h2 className="text-xl font-bold">إدارة الفحوصات / Tests</h2>
          <Card>
            <CardContent className="p-0">
              {testsLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">نوع الفحص</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-right">سحب الدم</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">التاريخ</th>
                        <th className="p-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tests?.map(t => (
                        <tr key={t.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{t.type}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs ${t.status === "completed" ? "bg-emerald-100 text-emerald-800" : t.status === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                              {t.status === "completed" ? "مكتمل" : t.status === "cancelled" ? "ملغى" : "معلق"}
                            </span>
                          </td>
                          <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${t.isDrawn ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}`}>{t.isDrawn ? "تم السحب" : "لم يسحب"}</span></td>
                          <td className="p-3 text-sm">{t.amountCollected ? `${t.amountCollected} ${settings?.currency ?? "SAR"}` : "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(t.createdAt).toLocaleDateString("ar-SA")}</td>
                          <td className="p-3 flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => updateTest.mutate({ id: t.id, data: { status: "completed" } }, { onSuccess: () => inv(getGetTestsQueryKey() as unknown as unknown[]) })}>إكمال</Button>
                            <Button size="sm" variant="destructive" onClick={() => deleteTest.mutate({ id: t.id }, { onSuccess: () => inv(getGetTestsQueryKey() as unknown as unknown[]) })}>حذف</Button>
                          </td>
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

        {/* STAFF */}
        <TabsContent value="staff" className="space-y-4">
          <h2 className="text-xl font-bold">إدارة الموظفين / Staff</h2>
          <Card>
            <CardContent className="p-0">
              {usersLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الاسم</th>
                        <th className="p-3 text-right">الدور</th>
                        <th className="p-3 text-right">البريد الإلكتروني</th>
                        <th className="p-3 text-right">الهاتف</th>
                        <th className="p-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users?.map(u => (
                        <tr key={u.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{u.nameAr} / {u.name}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">{u.role}</span></td>
                          <td className="p-3 text-muted-foreground text-xs" dir="ltr">{u.email ?? "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs" dir="ltr">{u.phone ?? "—"}</td>
                          <td className="p-3">
                            <Button size="sm" variant="destructive" onClick={() => deleteUser.mutate({ id: u.id }, { onSuccess: () => inv(getGetUsersQueryKey() as unknown as unknown[]) })}>حذف</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!users?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد موظفون</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INVENTORY */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">المخزون / Inventory</h2>
            <Dialog>
              <DialogTrigger asChild><Button>إضافة صنف</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة صنف / Add Item</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>الاسم</Label><Input value={newInventoryItem.name} onChange={e => setNewInventoryItem(p => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>الاسم بالعربي</Label><Input value={newInventoryItem.nameAr} onChange={e => setNewInventoryItem(p => ({ ...p, nameAr: e.target.value }))} /></div>
                  <div>
                    <Label>الفئة / Category</Label>
                    <Select value={newInventoryItem.category} onValueChange={v => setNewInventoryItem(p => ({ ...p, category: v as "tubes" | "reagents" | "consumables" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tubes">أنابيب / Tubes</SelectItem>
                        <SelectItem value="reagents">كواشف / Reagents</SelectItem>
                        <SelectItem value="consumables">مستهلكات / Consumables</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>الفئة بالعربي</Label><Input value={newInventoryItem.categoryAr} onChange={e => setNewInventoryItem(p => ({ ...p, categoryAr: e.target.value }))} /></div>
                  <div><Label>الكمية / Quantity</Label><Input type="number" value={newInventoryItem.quantity} onChange={e => setNewInventoryItem(p => ({ ...p, quantity: Number(e.target.value) }))} /></div>
                  <div><Label>الحد الأدنى / Min Target</Label><Input type="number" value={newInventoryItem.minTarget} onChange={e => setNewInventoryItem(p => ({ ...p, minTarget: Number(e.target.value) }))} /></div>
                  <div><Label>الوحدة / Unit</Label><Input value={newInventoryItem.unit} onChange={e => setNewInventoryItem(p => ({ ...p, unit: e.target.value }))} /></div>
                  <div><Label>الوحدة بالعربي</Label><Input value={newInventoryItem.unitAr} onChange={e => setNewInventoryItem(p => ({ ...p, unitAr: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => {
                    createInventory.mutate({ data: newInventoryItem }, {
                      onSuccess: () => { inv(getGetInventoryQueryKey() as unknown as unknown[]); toast({ title: "تم الإضافة" }); },
                      onError: () => toast({ title: "خطأ", variant: "destructive" }),
                    });
                  }}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {inventoryLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الصنف</th>
                        <th className="p-3 text-right">الفئة</th>
                        <th className="p-3 text-right">الكمية</th>
                        <th className="p-3 text-right">الحد الأدنى</th>
                        <th className="p-3 text-right">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory?.map(item => (
                        <tr key={item.id} className={`border-b hover:bg-muted/50 ${item.quantity <= item.minTarget ? "bg-red-50" : ""}`}>
                          <td className="p-3 font-medium">{item.nameAr} / {item.name}</td>
                          <td className="p-3 text-muted-foreground">{item.categoryAr}</td>
                          <td className="p-3 font-bold">{item.quantity} {item.unitAr}</td>
                          <td className="p-3 text-muted-foreground">{item.minTarget}</td>
                          <td className="p-3">
                            {item.quantity <= item.minTarget
                              ? <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">نقص / Low</span>
                              : <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">متوفر / OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!inventory?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد مخزون</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* EXPENSES */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">المصروفات / Expenses</h2>
            <Dialog>
              <DialogTrigger asChild><Button>إضافة مصروف</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إضافة مصروف / Add Expense</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>المبلغ / Amount</Label><Input type="number" value={newExpense.amount} onChange={e => setNewExpense(p => ({ ...p, amount: Number(e.target.value) }))} /></div>
                  <div><Label>الفئة / Category</Label><Input value={newExpense.category} onChange={e => setNewExpense(p => ({ ...p, category: e.target.value }))} /></div>
                  <div><Label>الوصف / Description</Label><Input value={newExpense.description} onChange={e => setNewExpense(p => ({ ...p, description: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => {
                    createExpense.mutate({ data: newExpense }, {
                      onSuccess: () => { inv(getGetExpensesQueryKey() as unknown as unknown[]); toast({ title: "تم تسجيل المصروف" }); },
                      onError: () => toast({ title: "خطأ", variant: "destructive" }),
                    });
                  }}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {expensesLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الفئة</th>
                        <th className="p-3 text-right">الوصف</th>
                        <th className="p-3 text-right">المبلغ</th>
                        <th className="p-3 text-right">المسجل</th>
                        <th className="p-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses?.map(e => (
                        <tr key={e.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{e.category}</td>
                          <td className="p-3 text-muted-foreground">{e.description}</td>
                          <td className="p-3 font-bold text-destructive">{e.amount} {settings?.currency ?? "SAR"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{e.recordedBy}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(e.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!expenses?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد مصروفات</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SHIFTS */}
        <TabsContent value="shifts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">إغلاق الوردية / Shift Closing</h2>
            <Dialog>
              <DialogTrigger asChild><Button>إغلاق وردية</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>إغلاق وردية / Close Shift</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>التاريخ</Label><Input type="date" value={newShift.date} onChange={e => setNewShift(p => ({ ...p, date: e.target.value }))} /></div>
                  <div><Label>النقد الأولي</Label><Input type="number" value={newShift.initialCash} onChange={e => setNewShift(p => ({ ...p, initialCash: Number(e.target.value) }))} /></div>
                  <div><Label>إجمالي المحصل</Label><Input type="number" value={newShift.totalCollected} onChange={e => setNewShift(p => ({ ...p, totalCollected: Number(e.target.value) }))} /></div>
                  <div><Label>إجمالي المصروفات</Label><Input type="number" value={newShift.totalExpenses} onChange={e => setNewShift(p => ({ ...p, totalExpenses: Number(e.target.value) }))} /></div>
                  <div><Label>الصافي</Label><Input type="number" value={newShift.netAmount} onChange={e => setNewShift(p => ({ ...p, netAmount: Number(e.target.value) }))} /></div>
                  <div><Label>ملاحظات</Label><Input value={newShift.notes} onChange={e => setNewShift(p => ({ ...p, notes: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => {
                    createShift.mutate({ data: newShift }, {
                      onSuccess: () => { inv(getGetShiftsQueryKey() as unknown as unknown[]); toast({ title: "تم إغلاق الوردية" }); },
                      onError: () => toast({ title: "خطأ", variant: "destructive" }),
                    });
                  }}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {shiftsLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">التاريخ</th>
                        <th className="p-3 text-right">المحصل</th>
                        <th className="p-3 text-right">المصروفات</th>
                        <th className="p-3 text-right">الصافي</th>
                        <th className="p-3 text-right">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shifts?.map(s => (
                        <tr key={s.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">{s.date}</td>
                          <td className="p-3 text-emerald-600 font-bold">{s.totalCollected}</td>
                          <td className="p-3 text-destructive font-bold">{s.totalExpenses}</td>
                          <td className="p-3 font-bold">{s.netAmount}</td>
                          <td className="p-3 text-muted-foreground">{s.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!shifts?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد ورديات مغلقة</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* QC */}
        <TabsContent value="qc" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">ضبط الجودة / QC Checks</h2>
            <Dialog>
              <DialogTrigger asChild><Button>إضافة فحص جودة</Button></DialogTrigger>
              <DialogContent dir="rtl">
                <DialogHeader><DialogTitle>فحص جودة / QC Check</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>اسم الجهاز</Label><Input value={newQc.deviceName} onChange={e => setNewQc(p => ({ ...p, deviceName: e.target.value }))} /></div>
                  <div>
                    <Label>النتيجة / Status</Label>
                    <Select value={newQc.status} onValueChange={v => setNewQc(p => ({ ...p, status: v as "passed" | "failed" }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passed">ناجح / Passed</SelectItem>
                        <SelectItem value="failed">راسب / Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>الملاحظات</Label><Input value={newQc.findings} onChange={e => setNewQc(p => ({ ...p, findings: e.target.value }))} /></div>
                  <Button className="w-full" onClick={() => {
                    createQc.mutate({ data: newQc }, {
                      onSuccess: () => { inv(getGetQcChecksQueryKey() as unknown as unknown[]); toast({ title: "تم تسجيل فحص الجودة" }); },
                      onError: () => toast({ title: "خطأ", variant: "destructive" }),
                    });
                  }}>حفظ</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              {qcLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">الجهاز</th>
                        <th className="p-3 text-right">الحالة</th>
                        <th className="p-3 text-right">الفاحص</th>
                        <th className="p-3 text-right">الملاحظات</th>
                        <th className="p-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {qcChecks?.map(q => (
                        <tr key={q.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{q.deviceName}</td>
                          <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${q.status === "passed" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{q.status === "passed" ? "ناجح" : "راسب"}</span></td>
                          <td className="p-3 text-muted-foreground">{q.checkedBy}</td>
                          <td className="p-3 text-muted-foreground">{q.findings}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(q.createdAt).toLocaleDateString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!qcChecks?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد فحوصات جودة</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT */}
        <TabsContent value="audit" className="space-y-4">
          <h2 className="text-xl font-bold">سجل التدقيق / Audit Logs</h2>
          <Card>
            <CardContent className="p-0">
              {auditLoading ? <Skeleton className="h-48 m-4" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">المستخدم</th>
                        <th className="p-3 text-right">الإجراء</th>
                        <th className="p-3 text-right">التفاصيل</th>
                        <th className="p-3 text-right">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs?.map(log => (
                        <tr key={log.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{log.username}</td>
                          <td className="p-3"><span className="px-2 py-0.5 bg-muted rounded text-xs">{log.action}</span></td>
                          <td className="p-3 text-muted-foreground text-xs">{log.details}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(log.createdAt).toLocaleString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!auditLogs?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد سجلات تدقيق</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SETTINGS */}
        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-bold">إعدادات المختبر / Lab Settings</h2>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>اسم المختبر / Lab Name</Label><Input value={settingsForm.labName} onChange={e => setSettingsForm(p => ({ ...p, labName: e.target.value }))} /></div>
                <div><Label>اسم المختبر بالعربي</Label><Input value={settingsForm.labNameAr} onChange={e => setSettingsForm(p => ({ ...p, labNameAr: e.target.value }))} /></div>
                <div><Label>العملة / Currency</Label><Input value={settingsForm.currency} onChange={e => setSettingsForm(p => ({ ...p, currency: e.target.value }))} dir="ltr" /></div>
                <div><Label>الهاتف / Phone</Label><Input value={settingsForm.phone} onChange={e => setSettingsForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" /></div>
                <div><Label>العنوان / Address</Label><Input value={settingsForm.address} onChange={e => setSettingsForm(p => ({ ...p, address: e.target.value }))} /></div>
                <div><Label>العنوان بالعربي</Label><Input value={settingsForm.addressAr} onChange={e => setSettingsForm(p => ({ ...p, addressAr: e.target.value }))} /></div>
              </div>
              <Button onClick={() => updateSettings.mutate({ data: settingsForm }, { onSuccess: () => toast({ title: "تم حفظ الإعدادات" }), onError: () => toast({ title: "خطأ", variant: "destructive" }) })}>
                حفظ الإعدادات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NOTIFICATIONS */}
        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">الإشعارات / Notifications</h2>
            <Button variant="destructive" size="sm" onClick={() => clearNotifications.mutate(undefined, { onSuccess: () => inv(getGetNotificationsQueryKey() as unknown as unknown[]) })}>
              مسح الكل / Clear All
            </Button>
          </div>
          <Card>
            <CardContent className="p-4 space-y-3">
              {notifications?.map(n => (
                <div key={n.id} className={`p-3 border rounded-md ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{n.titleAr}</p>
                      <p className="text-sm text-muted-foreground">{n.messageAr}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${n.type === "warning" ? "bg-amber-100 text-amber-800" : n.type === "error" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>{n.type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.timestamp).toLocaleString("ar-SA")}</p>
                </div>
              ))}
              {!notifications?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد إشعارات</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
