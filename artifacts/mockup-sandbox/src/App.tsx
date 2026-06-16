import { useEffect, useState } from "react";
import { Router, Route } from "wouter";
import { AuthPage } from "./pages/AuthPage";
import { OwnerDashboard } from "./pages/OwnerDashboard";
import { PatientResults } from "./pages/PatientResults";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // التحقق من حالة المستخدم
    const role = localStorage.getItem("userRole");
    setUserRole(role);
    setIsAuthenticated(!!role);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-4 animate-pulse">
            <span className="text-2xl">🏥</span>
          </div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <Router>
      <Route path="/dashboard" component={OwnerDashboard} />
      <Route path="/patient-results" component={PatientResults} />
      <Route path="*" component={() => {
        if (userRole === "OWNER") {
          return <OwnerDashboard />;
        } else if (userRole === "PATIENT") {
          return <PatientResults />;
        }
        return <AuthPage />;
      }} />
    </Router>
  );
}

export default App;
