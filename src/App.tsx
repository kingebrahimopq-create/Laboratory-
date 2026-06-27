import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InAppUpdate } from './components/InAppUpdate';

export default function App() {
  return (
    <BrowserRouter>
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-slate-950">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-pink-600/10 via-purple-600/10 to-transparent blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="relative z-10 min-h-screen">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>

      {/* Global In-App Update Banner */}
      <InAppUpdate />
    </BrowserRouter>
  );
}
