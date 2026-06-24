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

export function TechnicianPanel({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: pendingTests, isLoading: pendingLoading } = useGetTests({ status: "pending" }, { query: { queryKey: getGetTestsQueryKey({ status: "pending" }) as unknown as unknown[] } });
  const { data: completedTests, isLoading: completedLoading } = useGetTests({ status: "completed" }, { query: { queryKey: getGetTestsQueryKey({ status: "completed" }) as unknown as unknown[] } });
  const updateTest = useUpdateTest();

  const [resultsForm, setResultsForm] = useState<Record<string, { results: string }>>({});
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const handleComplete = (testId: string) => {
    const results = resultsForm[testId]?.results ?? "";
    updateTest.mutate({ id: testId, data: { status: "completed", results: results ? { text: results } : undefined } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTestsQueryKey({ status: "pending" }) as unknown as unknown[] });
        queryClient.invalidateQueries({ queryKey: getGetTestsQueryKey({ status: "completed" }) as unknown as unknown[] });
        toast({ title: "تم إكمال الفحص بنجاح" });
        setSelectedTest(null);
      },
      onError: () => toast({ title: "خطأ", variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="text-3xl font-black text-amber-700">{pendingTests?.length ?? 0}</div>
            <div className="text-sm text-amber-600 mt-1">فحوصات معلقة / Pending</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-3xl font-black text-emerald-700">{completedTests?.length ?? 0}</div>
            <div className="text-sm text-emerald-600 mt-1">مكتملة / Completed</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">الفحوصات المعلقة ({pendingTests?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="completed">المكتملة ({completedTests?.length ?? 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader><CardTitle>الفحوصات المعلقة / Pending Tests</CardTitle></CardHeader>
            <CardContent>
              {pendingLoading ? <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div> : (
                <div className="space-y-3">
                  {pendingTests?.map(test => (
                    <div key={test.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row justify-between gap-3">
                        <div>
                          <p className="font-bold text-lg">{test.type}</p>
                          <p className="text-sm text-muted-foreground">رقم الفحص: {test.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(test.createdAt).toLocaleString("ar-SA")}</p>
                          {test.isDrawn && <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">تم سحب الدم</span>}
                        </div>
                        <div className="flex items-start gap-2">
                          <Dialog open={selectedTest === test.id} onOpenChange={open => setSelectedTest(open ? test.id : null)}>
                            <DialogTrigger asChild>
                              <Button size="sm">إدخال النتائج</Button>
                            </DialogTrigger>
                            <DialogContent dir="rtl">
                              <DialogHeader><DialogTitle>إدخال نتائج الفحص / Enter Results</DialogTitle></DialogHeader>
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">نوع الفحص: <strong>{test.type}</strong></p>
                                <div>
                                  <Label>النتائج / Results</Label>
                                  <Input
                                    value={resultsForm[test.id]?.results ?? ""}
                                    onChange={e => setResultsForm(prev => ({...prev, [test.id]: { results: e.target.value }}))}
                                    placeholder="أدخل نتائج الفحص..."
                                  />
                                </div>
                                <Button className="w-full" onClick={() => handleComplete(test.id)} disabled={updateTest.isPending}>
                                  {updateTest.isPending ? "جاري الحفظ..." : "إكمال الفحص"}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!pendingTests?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد فحوصات معلقة</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader><CardTitle>الفحوصات المكتملة / Completed Tests</CardTitle></CardHeader>
            <CardContent className="p-0">
              {completedLoading ? <div className="text-center py-4 text-muted-foreground">جاري التحميل...</div> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-right">نوع الفحص</th>
                        <th className="p-3 text-right">النتائج</th>
                        <th className="p-3 text-right">تاريخ الإكمال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedTests?.map(t => (
                        <tr key={t.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{t.type}</td>
                          <td className="p-3 text-muted-foreground">{t.results ? JSON.stringify(t.results) : "—"}</td>
                          <td className="p-3 text-muted-foreground text-xs">{new Date(t.updatedAt).toLocaleString("ar-SA")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!completedTests?.length && <p className="text-center py-8 text-muted-foreground">لا يوجد فحوصات مكتملة</p>}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
