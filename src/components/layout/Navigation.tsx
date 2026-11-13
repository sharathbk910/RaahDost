import React from 'react';
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
  LogIn
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
  onResetDemo: () => void;
}

export const TopNavbar: React.FC<NavbarProps> = ({ currentRoute, navigate, onResetDemo }) => {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Bus className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-tight text-white">RaahDost</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Live Prototype
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Your Journey. Our Responsibility.</p>
          </div>
        </div>

        {/* User Auth Info & Quick Controls */}
        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <div 
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors"
              >
                <img
                  src={user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80'}
                  alt="avatar"
                  className="w-6 h-6 rounded-lg object-cover"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold leading-none text-white truncate max-w-[120px]">
                    {user.fullName}
                  </div>
                  <span className={`text-[9px] uppercase font-black leading-none ${
                    user.role === 'admin' ? 'text-amber-400' : user.role === 'operator' ? 'text-blue-400' : 'text-emerald-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>

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
              className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          <button
            onClick={onResetDemo}
            title="Reset sandbox data to initial 30-student emergency state"
            className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Sandbox</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Sidebar: React.FC<{ currentRoute: string; navigate: (route: string) => void }> = ({ currentRoute, navigate }) => {
  const { user } = useAuth();

  const navItems = [
    { id: '/', label: 'Overview & Mission', icon: Home },
    { id: '/dashboard', label: 'Admin Dashboard', icon: ShieldCheck, badge: 'Live', minRole: 'admin' },
    { id: '/rescue', label: 'ROUTE RESCUE', icon: LifeBuoy, highlight: true, minRole: 'admin' },
    { id: '/disruptions', label: 'Disruption Manager', icon: AlertTriangle, minRole: 'operator' },
    { id: '/vehicles', label: 'Vehicle Network', icon: Car, minRole: 'operator' },
    { id: '/student', label: 'Student Portal', icon: Users },
    { id: '/profile', label: 'User Profile', icon: UserIcon },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col justify-between p-4">
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
              onClick={() => navigate(item.id)}
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
                  CORE
                </span>
              )}
              {item.badge && !isActive && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role Indicator footer */}
      <div className="mt-8 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center justify-between font-bold text-slate-800">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-500"></span>
            <span>Current Session:</span>
          </span>
          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-brand-100 text-brand-800">
            {user?.role || 'Guest'}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {user?.fullName} ({user?.email})
        </p>
      </div>
    </aside>
  );
};
