import React, { useState } from 'react';
import { 
  Bus, 
  AlertTriangle, 
  Users, 
  Car, 
  ShieldCheck, 
  LifeBuoy, 
  Home, 
  RefreshCw,
  LogOut,
  User as UserIcon,
  LogIn,
  Menu,
  X,
  AlertOctagon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onResetDemo: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const TopNavbar: React.FC<NavbarProps> = ({ 
  currentRoute, 
  navigate, 
  onResetDemo,
  isMobileMenuOpen,
  setIsMobileMenuOpen
}) => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div 
            onClick={() => navigate('/')} 
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Bus className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-white">RaahDost</span>
              </div>
              <p className="text-[11px] text-emerald-400 font-semibold tracking-tight hidden sm:block">Your friend on every road.</p>
            </div>
          </div>
        </div>

        {/* User Auth Info & Quick Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {user ? (
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-2.5 py-1.5 transition-colors"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                  alt="avatar"
                  className="w-6 h-6 rounded-lg object-cover"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-none text-white truncate max-w-[110px]">
                    {user.fullName}
                  </div>
                  <span className={`text-[9px] uppercase font-black leading-none ${
                    user.role === 'admin' ? 'text-amber-400' : user.role === 'operator' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
                title="Sign Out"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 text-slate-400 hover:text-red-400 border border-slate-700 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onResetDemo}
            title="Reset to default 30-student emergency state"
            className="flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Sidebar: React.FC<{ 
  currentRoute: string; 
  navigate: (route: string) => void;
  isMobileOpen?: boolean;
  closeMobileMenu?: () => void;
}> = ({ currentRoute, navigate, isMobileOpen = false, closeMobileMenu }) => {
  const { user } = useAuth();

  const navItems = [
    { id: '/', label: 'Overview', icon: Home },
    { id: '/crisis', label: 'EXAM CRISIS MODE', icon: AlertOctagon, highlight: true, badge: 'SURPRISE' },
    { id: '/dashboard', label: 'Admin Dashboard', icon: ShieldCheck },
    { id: '/rescue', label: 'Route Rescue', icon: LifeBuoy },
    { id: '/disruptions', label: 'Disruption Manager', icon: AlertTriangle },
    { id: '/vehicles', label: 'Vehicle Network', icon: Car },
    { id: '/student', label: 'Student Portal', icon: Users },
    { id: '/profile', label: 'My Profile', icon: UserIcon },
  ];

  const handleNavClick = (id: string) => {
    navigate(id);
    if (closeMobileMenu) {
      closeMobileMenu();
    }
  };

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          onClick={closeMobileMenu}
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 
        flex flex-col justify-between p-4 transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="space-y-1.5">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? item.highlight 
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                      : 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : item.highlight
                      ? 'bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-amber-600' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && !isActive && (
                  <span className="bg-amber-500 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">
                    RESCUE
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Current user session pill */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between font-bold text-slate-800">
            <span className="text-[11px]">Logged in as:</span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-brand-100 text-brand-800">
              {user?.role || 'Guest'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {user?.fullName || 'Not Signed In'}
          </p>
        </div>
      </aside>
    </>
  );
};
