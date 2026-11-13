import React from 'react';
import { 
  Bus, 
  ShieldCheck, 
  LifeBuoy, 
  ArrowRight, 
  Users, 
  Car, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles
} from 'lucide-react';

interface Props {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<Props> = ({ navigate }) => {
  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 p-8 sm:p-12 text-white shadow-2xl border border-slate-700">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI-Assisted Rural Student Mobility Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            Your Journey. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-amber-300">
              Our Responsibility.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-normal leading-relaxed">
            When rural public transport breaks down, students miss crucial exams and classes. 
            <strong className="text-white font-semibold"> RaahDost</strong> doesn't just broadcast delay alerts—it dynamically coordinates available private vans, autos, and mini-buses to get students to their institutions safely.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => navigate('/rescue')}
              className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center space-x-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <LifeBuoy className="w-5 h-5" />
              <span>Launch Route Rescue Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 flex items-center space-x-2 transition-all"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Enter Admin Dashboard</span>
            </button>

            <button
              onClick={() => navigate('/student')}
              className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur border border-white/10 flex items-center space-x-2 transition-all"
            >
              <Users className="w-5 h-5 text-amber-300" />
              <span>Student Portal</span>
            </button>
          </div>
        </div>
      </div>

      {/* The 15-Minute Hackathon Demo Scenario Card */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded">
                Active Test Scenario Available
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              Emergency Bus Axle Breakdown on Route R-14 (30 Students Stranded)
            </h3>
            <p className="text-sm text-slate-700 max-w-2xl">
              A regular Government Bus broke down at Rampur Canal Bridge. 4 alternative local vehicles (Vans, Auto, Mini-Bus) with 34 total available seats have been registered. 
              Click <strong>Launch Route Rescue</strong> to execute the deterministic matching engine.
            </p>
          </div>
          <button
            onClick={() => navigate('/rescue')}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md flex items-center space-x-2"
          >
            <span>Resolve Disruption</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">1. Instant Incident Intake</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Institutions and drivers report breakdowns, route closures, or acute overcrowding in seconds with student headcount tracking.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <LifeBuoy className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">2. Deterministic Matching</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Greedy capacity algorithm guarantees zero seat overselling, destination compatibility, and highlights unassigned students transparently.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">3. Coordinated Alternatives</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Administrators review proposed vehicle assignments and officially confirm them, giving students clear boarding passes on their mobile devices.
          </p>
        </div>
      </div>
    </div>
  );
};

