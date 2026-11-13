import React, { useState } from 'react';
import { TopNavbar, Sidebar } from './components/layout/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { RouteRescue } from './pages/RouteRescue';
import { StudentPortal } from './pages/StudentPortal';
import { Vehicles } from './pages/Vehicles';
import { Disruptions } from './pages/Disruptions';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ProfilePage } from './pages/ProfilePage';
import { db } from './services/dataStore';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const { user } = useAuth();

  const handleResetDemo = () => {
    db.resetToDefaults();
    setRefreshKey(prev => prev + 1);
    alert('✅ Demo environment reset to initial state: 30 stranded students & 34 alternative vehicle seats ready for Route Rescue.');
  };

  // Protected Route Logic
  const renderPage = () => {
    // If accessing protected routes without user session, prompt login
    const protectedRoutes = ['/dashboard', '/rescue', '/vehicles', '/disruptions', '/profile'];
    if (protectedRoutes.includes(currentRoute) && !user) {
      return <LoginPage navigate={setCurrentRoute} />;
    }

    switch (currentRoute) {
      case '/':
        return <LandingPage navigate={setCurrentRoute} />;
      case '/dashboard':
        return <Dashboard navigate={setCurrentRoute} />;
      case '/rescue':
        return <RouteRescue navigate={setCurrentRoute} />;
      case '/student':
        return <StudentPortal />;
      case '/vehicles':
        return <Vehicles />;
      case '/disruptions':
        return <Disruptions navigate={setCurrentRoute} />;
      case '/login':
        return <LoginPage navigate={setCurrentRoute} />;
      case '/signup':
        return <SignupPage navigate={setCurrentRoute} />;
      case '/profile':
        return <ProfilePage navigate={setCurrentRoute} />;
      case '/forgot-password':
        return (
          <div className="max-w-md mx-auto py-12 text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-xl font-black text-slate-900">Password Recovery</h2>
            <p className="text-xs text-slate-500">
              Enter your student or institutional email to receive a password reset link from Supabase Auth.
            </p>
            <input
              type="email"
              placeholder="name@institution.ac.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
            />
            <button
              onClick={() => {
                alert('Password reset instructions dispatched to your email address.');
                setCurrentRoute('/login');
              }}
              className="w-full py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold"
            >
              Send Recovery Email
            </button>
            <button
              onClick={() => setCurrentRoute('/login')}
              className="text-xs text-slate-500 underline block mx-auto"
            >
              Back to Login
            </button>
          </div>
        );
      default:
        return <LandingPage navigate={setCurrentRoute} />;
    }
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-slate-100 flex flex-col text-slate-900 font-sans">
      <TopNavbar 
        currentRoute={currentRoute} 
        navigate={setCurrentRoute} 
        onResetDemo={handleResetDemo} 
      />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar currentRoute={currentRoute} navigate={setCurrentRoute} />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span><strong>RaahDost</strong> — AI-Assisted Rural Student Mobility Network</span>
          <span>Supabase Auth & Google OAuth Ready • Your Journey. Our Responsibility.</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
