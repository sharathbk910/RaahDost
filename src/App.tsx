import React, { useState } from 'react';
import { TopNavbar, Sidebar } from './components/layout/Navigation';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { RouteRescue } from './pages/RouteRescue';
import { StudentPortal } from './pages/StudentPortal';
import { Vehicles } from './pages/Vehicles';
import { Disruptions } from './pages/Disruptions';
import { db } from './services/dataStore';

export function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('/');
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const handleResetDemo = () => {
    db.resetToDefaults();
    setRefreshKey(prev => prev + 1);
    alert('✅ Demo environment reset to initial state: 30 stranded students & 34 alternative vehicle seats ready for Route Rescue.');
  };

  const renderPage = () => {
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
          <span>Your Journey. Our Responsibility.</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
