import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DailyLogs from './pages/DailyLogs';
import Appointments from './pages/Appointments';
import Education from './pages/Education';
import Export from './pages/Export';

// Loading spinner component
function LoadingScreen() {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse-soft">🤰</div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Route that requires both auth AND an active pregnancy
function RequiresPregnancyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, pregnancy } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated but no pregnancy, redirect to onboarding
  if (!pregnancy) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}

// Onboarding route - redirects to dashboard if user already has pregnancy
function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, pregnancy } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If already has pregnancy, go to dashboard instead
  if (pregnancy) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Public route wrapper (redirects to dashboard if logged in with pregnancy)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, pregnancy } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // If has pregnancy, go to dashboard; otherwise go to onboarding
    return <Navigate to={pregnancy ? "/dashboard" : "/onboarding"} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Onboarding - only for authenticated users without pregnancy */}
      <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />

      {/* Protected routes that require pregnancy */}
      <Route path="/dashboard" element={<RequiresPregnancyRoute><Dashboard /></RequiresPregnancyRoute>} />
      <Route path="/logs" element={<RequiresPregnancyRoute><DailyLogs /></RequiresPregnancyRoute>} />
      <Route path="/appointments" element={<RequiresPregnancyRoute><Appointments /></RequiresPregnancyRoute>} />
      <Route path="/education" element={<RequiresPregnancyRoute><Education /></RequiresPregnancyRoute>} />
      <Route path="/export" element={<RequiresPregnancyRoute><Export /></RequiresPregnancyRoute>} />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
