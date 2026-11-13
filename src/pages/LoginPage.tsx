import React, { useState } from 'react';
import { 
  Bus, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  UserCheck
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';

interface Props {
  navigate: (route: string) => void;
}

export const LoginPage: React.FC<Props> = ({ navigate }) => {
  const { signInWithGoogle, signInWithEmail, loginAsDemoRole } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg(null);
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/dashboard');
    }
  };

  const handleQuickDemoRole = (role: UserRole) => {
    loginAsDemoRole(role);
    if (role === 'student') {
      navigate('/student');
    } else if (role === 'operator') {
      navigate('/vehicles');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto py-4 sm:py-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <Bus className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">RaahDost Login</h1>
        <p className="text-xs font-semibold text-slate-500">Your Journey. Our Responsibility.</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* 1. Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center space-x-3 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.36 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.2.01 10.05.01 12s.45 3.8 1.26 5.41l4.01-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.25 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.97 6.72-4.97z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            or sign in with email
          </span>
        </div>

        {/* 2. Email / Password Login Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="name@polytechnic.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
          >
            <span>Sign In to RaahDost</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <button
            onClick={() => navigate('/signup')}
            className="font-bold text-brand-600 hover:text-brand-700 underline"
          >
            Register Student Account
          </button>
        </div>
      </div>

      {/* Quick Role Access for review */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
          Instant Role Profiles:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => handleQuickDemoRole('admin')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand-500 text-left transition-all"
          >
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Admin
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Dr. Srivastava</p>
            <p className="text-[10px] text-slate-400">Chief Officer</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoRole('operator')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand-500 text-left transition-all"
          >
            <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
              Operator
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Rameshwar Y.</p>
            <p className="text-[10px] text-slate-400">Fleet Owner</p>
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoRole('student')}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-brand-500 text-left transition-all"
          >
            <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Student
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">Aarav Sharma</p>
            <p className="text-[10px] text-slate-400">Polytechnic 2nd Yr</p>
          </button>
        </div>
      </div>
    </div>
  );
};
