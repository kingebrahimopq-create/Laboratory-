import { useState } from "react";
import { UserProfile, useGetTests, getGetTestsQueryKey, useUpdateTest } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export function PhlebotomistPanel({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tests, isLoading } = useGetTests(undefined, { query: { queryKey: getGetTestsQueryKey() as unknown as unknown[] } });
  const updateTest = useUpdateTest();

  const undrawnTests = tests?.filter(t => !t.isDrawn && t.status !== "cancelled") ?? [];
  const drawnTests = tests?.filter(t => t.isDrawn) ?? [];

  const [drawForm, setDrawForm] = useState<Record<string, { notes: string }>>({});
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const handleMarkDrawn = (testId: string) => {
    updateTest.mutate({
      id: testId,
      data: {
        isDrawn: true,
        drawnAt: new Date().toISOString(),
        drawnBy: profile.name,
        drawNotes: drawForm[testId]?.notes ?? "",
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTestsQueryKey() as unknown as unknown[] });
        toast({ title: "تم تسجيل سحب الدم بنجاح" });
        setSelectedTest(null);
      },
      onError: () => toast({ title: "خطأ في التسجيل", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="text-3xl font-black text-red-700">{undrawnTests.length}</div>
            <div className="text-sm text-red-600 mt-1">بانتظار سحب الدم / Pending Draws</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-3xl font-black text-emerald-700">{drawnTests.length}</div>
            <div className="text-sm text-emerald-600 mt-1">تم سحبها / Drawn</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">بانتظار السحب ({undrawnTests.length})</TabsTrigger>
          <TabsTrigger value="done">تم السحب ({drawnTests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                <span>عينات تحتاج سحب دم</span>
                <span dir="ltr" className="text-sm text-muted-foreground font-normal">Pending Blood Draws</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div> : (
                <div className="space-y-3">
                  {undrawnTests.map(test => (
                    <div key={test.id} className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between gap-3">
                      <div>
                        <p className="font-bold text-lg">{test.type}</p>
                        <p className="text-sm text-muted-foreground">رقم العينة: {test.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(test.createdAt).toLocaleString("ar-SA")}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${test.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {test.status === "completed" ? "مكتمل" : "معلق"}
                        </span>
                      </div>
                      <Dialog open={selectedTest === test.id} onOpenChange={open => setSelectedTest(open ? test.id : null)}>
                        <DialogTrigger asChild>
                          <Button className="self-start">تأكيد السحب</Button>
                        </DialogTrigger>
                        <DialogContent dir="rtl">
                          <DialogHeader><DialogTitle>تأكيد سحب الدم / Confirm Blood Draw</DialogTitle></DialogHeader>
                          <div className="space-y-3">
                            <p className="text-sm">نوع الفحص: <strong>{test.type}</strong></p>
                            <div>
                              <Label>ملاحظات السحب / Draw Notes</Label>
                              <Input
                                value={drawForm[test.id]?.notes ?? ""}
                                onChange={e => setDrawForm(prev => ({...prev, [test.id]: { notes: e.target.value }}))}
                                placeholder="أي ملاحظات على عملية السحب..."
                              />
                            </div>
                            <Button className="w-full" onClick={() => handleMarkDrawn(test.id)} disabled={updateTest.isPending}>
                              {updateTest.isPending ? "جاري التسجيل..." : "تأكيد السحب"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  ))}
                  {!undrawnTests.length && (
                    <div className="text-center py-12">
                      <p className="text-emerald-600 font-bold text-lg">جميع العينات مسحوبة</p>
                      <p className="text-muted-foreground text-sm" dir="ltr">All blood draws completed</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="done">
          <Card>
            <CardHeader><CardTitle>العينات المسحوبة / Drawn Samples</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-right">نوع الفحص</th>
                      <th className="p-3 text-right">وقت السحب</th>
                      <th className="p-3 text-right">المسحوب بواسطة</th>
                      <th className="p-3 text-right">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drawnTests.map(t => (
                      <tr key={t.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{t.type}</td>
                        <td className="p-3 text-muted-foreground text-xs">{t.drawnAt ? new Date(t.drawnAt).toLocaleString("ar-SA") : "—"}</td>
                        <td className="p-3 text-muted-foreground">{t.drawnBy ?? "—"}</td>
                        <td className="p-3 text-muted-foreground">{t.drawNotes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!drawnTests.length && <p className="text-center py-8 text-muted-foreground">لا يوجد عينات مسحوبة</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
