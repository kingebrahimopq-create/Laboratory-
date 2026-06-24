import { useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { useUpsertUserProfile, useGetPatients } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const upsertProfile = useUpsertUserProfile();

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast({ title: "خطأ / Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data.user) {
      // In a real app we'd get role/name from somewhere or wait for trigger.
      // Here we'll just redirect since profile creation is handled in useAuth / backend triggers
      setLocation("/dashboard");
    }
    setLoading(false);
  };

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Patient login via phone not fully implemented without SMS OTP
    // For now just simulate an error
    toast({ title: "غير متاح / Not Available", description: "Patient login via phone is not available yet.", variant: "destructive" });
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md border-t-4 border-t-primary shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-primary">نظام إدارة المختبرات</CardTitle>
          <p className="text-sm text-muted-foreground" dir="ltr">Clinical Laboratory Information System</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="staff">الموظفين / Staff</TabsTrigger>
              <TabsTrigger value="patient">المرضى / Patient</TabsTrigger>
            </TabsList>
            <TabsContent value="staff">
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>البريد الإلكتروني / Email</Label>
                  <Input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    dir="ltr"
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>كلمة المرور / Password</Label>
                  <Input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    dir="ltr"
                    className="bg-muted/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري الدخول... / Loading..." : "تسجيل الدخول / Login"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="patient">
              <form onSubmit={handlePatientLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label>رقم الهاتف / Phone Number</Label>
                  <Input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    required 
                    dir="ltr"
                    className="bg-muted/50"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  دخول المريض / Patient Login
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
