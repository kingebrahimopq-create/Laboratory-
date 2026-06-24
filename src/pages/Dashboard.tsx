import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";
import { AdminPanel } from "@/components/dashboard/AdminPanel";
import { ReceptionistPanel } from "@/components/dashboard/ReceptionistPanel";
import { TechnicianPanel } from "@/components/dashboard/TechnicianPanel";
import { PhlebotomistPanel } from "@/components/dashboard/PhlebotomistPanel";
import { PatientPanel } from "@/components/dashboard/PatientPanel";
import { LogOut } from "lucide-react";

export function Dashboard() {
  const { profile, loading } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background" dir="rtl">
        <p className="text-muted-foreground mb-4">لم يتم العثور على الملف الشخصي / Profile not found</p>
        <Button onClick={() => supabase.auth.signOut().then(() => setLocation('/login'))}>
          العودة لتسجيل الدخول / Return to login
        </Button>
      </div>
    );
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setLocation("/login");
  };

  const renderPanel = () => {
    switch (profile.role) {
      case 'admin':
        return <AdminPanel profile={profile} />;
      case 'receptionist':
        return <ReceptionistPanel profile={profile} />;
      case 'technician':
        return <TechnicianPanel profile={profile} />;
      case 'phlebotomist':
        return <PhlebotomistPanel profile={profile} />;
      case 'patient':
        return <PatientPanel profile={profile} />;
      default:
        return <div>دور غير معروف / Unknown Role</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" dir="rtl">
      <header className="bg-card border-b p-4 px-6 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-primary">نظام إدارة المختبرات / LIS</h1>
          <p className="text-sm text-muted-foreground">{profile.nameAr} / {profile.name}</p>
        </div>
        <div className="flex gap-4 items-center">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-semibold capitalize">
            {profile.role}
          </span>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {renderPanel()}
      </main>
    </div>
  );
}
