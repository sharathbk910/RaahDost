import React from 'react';
import { 
  Bus, 
  Car, 
  ShieldCheck, 
  ArrowRight, 
  LifeBuoy, 
  GraduationCap, 
  Users, 
  CheckCircle2, 
  Sparkles,
  MapPin,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<Props> = ({ navigate }) => {
  const { user, loginAsDemoRole } = useAuth();

  const handleStudentEntry = () => {
    if (user?.role === 'student') {
      navigate('/student');
    } else {
      loginAsDemoRole('student');
      navigate('/student');
    }
  };

  const handleDriverEntry = () => {
    if (user?.role === 'driver') {
      navigate('/driver');
    } else {
      loginAsDemoRole('driver');
      navigate('/driver');
    }
  };

  const handleAdminEntry = () => {
    if (user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      loginAsDemoRole('admin');
      navigate('/dashboard');
    }
  };

  return (
    <div className="space-y-10 py-2 sm:py-6 max-w-5xl mx-auto">
      {/* Brand Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-12 text-white shadow-2xl border border-slate-700/60">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Rural Student Mobility Network • Mangalore</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
            RaahDost. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">
              Your friend on every road.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            In rural coastal Karnataka, students depend on limited government buses. When buses are overcrowded, break down, or coastal rains flood bridges, students get stranded. 
            <strong> RaahDost</strong> connects students with live buses, verified community drivers, and AI-powered crisis rerouting so no student misses an exam or class.
          </p>

          {/* THREE BIG PORTAL BUTTONS (Requirement 2) */}
          <div className="pt-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Select Your Portal:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* 1. Student Portal */}
              <button
                type="button"
                onClick={handleStudentEntry}
                className="group p-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 text-left transition-all hover:-translate-y-1 active:translate-y-0 border border-emerald-400/40"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black tracking-tight">I'm a Student</h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Find live buses, request verified driver pickups, and get AI help on exam days.
                </p>
                <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Enter Student Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* 2. Driver Portal */}
              <button
                type="button"
                onClick={handleDriverEntry}
                className="group p-5 rounded-2xl bg-teal-700 hover:bg-teal-600 text-white shadow-lg shadow-teal-700/30 text-left transition-all hover:-translate-y-1 active:translate-y-0 border border-teal-500/40"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black tracking-tight">I'm a Driver</h3>
                <p className="text-xs text-teal-100 mt-1">
                  Toggle "Available", offer spare seats, accept student pickups, and share live GPS.
                </p>
                <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                  <span>Enter Driver Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>

              {/* 3. Main Admin Dashboard */}
              <button
                type="button"
                onClick={handleAdminEntry}
                className="group p-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white shadow-lg shadow-slate-900/50 text-left transition-all hover:-translate-y-1 active:translate-y-0 border border-slate-600"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3">
                  <ShieldCheck className="w-6 h-6 text-amber-300" />
                </div>
                <h3 className="text-lg font-black tracking-tight">Admin</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Fleet control, driver approvals, student tracking, and Exam Day Crisis management.
                </p>
                <div className="mt-4 flex items-center space-x-1.5 text-xs font-bold text-amber-300 group-hover:translate-x-1 transition-transform">
                  <span>Enter Admin Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Badges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Register Cards */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              New Student Registration
            </span>
            <h4 className="text-sm font-bold text-slate-900">Sign Up in 3 Short Steps</h4>
            <p className="text-xs text-slate-500">Add your village, college, and class timings for automatic bus matching.</p>
          </div>
          <button
            onClick={() => navigate('/signup-student')}
            className="flex-shrink-0 ml-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Register Student
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Community Driver Partner
            </span>
            <h4 className="text-sm font-bold text-slate-900">Register Your Vehicle</h4>
            <p className="text-xs text-slate-500">Bike, Car, Van, Auto, or Bus. Help rural students and earn verified ratings.</p>
          </div>
          <button
            onClick={() => navigate('/signup-driver')}
            className="flex-shrink-0 ml-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm"
          >
            Register Driver
          </button>
        </div>
      </div>

      {/* Problem Statement & Crisis Highlight */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
              Challenge Simulation: "ROUTELESS — The Exam Day Crisis"
            </span>
          </div>
          <button
            onClick={() => navigate('/crisis')}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
          >
            <span>Run Exam Crisis Engine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
          Simulates 2 KSRTC coastal buses broken down, a 40% passenger demand surge, Kuloor bridge flooded, and students with semester exams within 2 hours. 
          RaahDost's AI algorithm reroutes students via inland roads, mobilizes available community drivers, and prioritizes exam-takers first.
        </p>
      </div>
    </div>
  );
};
