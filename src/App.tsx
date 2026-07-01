import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { InAppUpdate } from './components/InAppUpdate';

export default function App() {
  return (
    <BrowserRouter>
      {/* Dynamic Grayscale Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gray-50">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br from-gray-300 to-gray-200 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-gray-400 via-gray-300 to-transparent blur-[120px] rounded-full mix-blend-multiply opacity-50 animate-pulse duration-[6000ms]" />
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
