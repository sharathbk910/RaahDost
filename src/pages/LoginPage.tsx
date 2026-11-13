import React, { useState } from 'react';
import { 
  Bus, 
  Car, 
  ShieldCheck, 
  GraduationCap, 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  CheckCircle2
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

  const handleQuickRole = (role: UserRole) => {
    loginAsDemoRole(role);
    if (role === 'student') {
      navigate('/student');
    } else if (role === 'driver' || role === 'operator') {
      navigate('/driver');
    } else {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/student');
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
      if (email.includes('admin')) {
        navigate('/dashboard');
      } else if (email.includes('driver')) {
        navigate('/driver');
      } else {
        navigate('/student');
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto py-4 sm:py-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Bus className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">RaahDost Login</h1>
        <p className="text-xs sm:text-sm font-semibold text-emerald-600">Your friend on every road.</p>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          AI-Assisted Rural Student Mobility Network • Dakshina Kannada, Mangalore
        </p>
      </div>

      {/* 3 PRIMARY PORTAL BUTTONS (Phase 1 Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-5 sm:p-7 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Instant 1-Click Access
            </span>
            <h2 className="text-sm sm:text-base font-black text-slate-900 mt-1">Select Your Portal Role</h2>
          </div>
          <Sparkles className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Student Portal */}
          <button
            type="button"
            onClick={() => handleQuickRole('student')}
            className="group p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20 text-left transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2.5">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] uppercase font-black bg-white/20 px-1.5 py-0.5 rounded text-emerald-100">
              Student
            </span>
            <h3 className="text-sm font-black mt-1">Student Portal</h3>
            <p className="text-[11px] text-emerald-100 mt-0.5 leading-snug">
              Find live buses, ride requests, Exam Mode & AI guide.
            </p>
            <div className="mt-3 flex items-center space-x-1 text-[11px] font-bold group-hover:translate-x-1 transition-transform">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 2. Driver Portal */}
          <button
            type="button"
            onClick={() => handleQuickRole('driver')}
            className="group p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white shadow-md shadow-teal-600/20 text-left transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2.5">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] uppercase font-black bg-white/20 px-1.5 py-0.5 rounded text-teal-100">
              Driver
            </span>
            <h3 className="text-sm font-black mt-1">Driver Portal</h3>
            <p className="text-[11px] text-teal-100 mt-0.5 leading-snug">
              Go Available, live 5s GPS, accept student pickups.
            </p>
            <div className="mt-3 flex items-center space-x-1 text-[11px] font-bold group-hover:translate-x-1 transition-transform">
              <span>Enter Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* 3. Admin Dashboard */}
          <button
            type="button"
            onClick={() => handleQuickRole('admin')}
            className="group p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white shadow-md shadow-slate-900/30 text-left transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-[10px] uppercase font-black bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded">
              Admin
            </span>
            <h3 className="text-sm font-black mt-1">Admin Dashboard</h3>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
              Fleet CRUD, driver approvals, crisis control simulation.
            </p>
            <div className="mt-3 flex items-center space-x-1 text-[11px] font-bold text-amber-400 group-hover:translate-x-1 transition-transform">
              <span>Enter Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>

      {/* ALTERNATIVE LOGIN (Google OAuth / Email) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Or Sign In with Account</span>
          <span className="text-[10px] text-slate-400 font-medium">Supabase Auth Enabled</span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* Google OAuth Button */}
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

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
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
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
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
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors flex items-center justify-center space-x-2"
          >
            <span>Sign In to RaahDost</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-center space-x-4 pt-2 text-xs text-slate-500">
          <span>Need an account?</span>
          <button
            onClick={() => navigate('/signup-student')}
            className="font-bold text-emerald-600 hover:underline"
          >
            Student Sign Up
          </button>
          <span>•</span>
          <button
            onClick={() => navigate('/signup-driver')}
            className="font-bold text-teal-600 hover:underline"
          >
            Driver Sign Up
          </button>
        </div>
      </div>
    </div>
  );
};
