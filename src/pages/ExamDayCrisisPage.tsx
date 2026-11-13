import React, { useState } from 'react';
import { 
  Flame, 
  AlertOctagon, 
  Clock, 
  Droplets, 
  TrendingUp, 
  Car, 
  Users, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  MapPin, 
  ChevronRight,
  HelpCircle,
  BrainCircuit,
  Compass
} from 'lucide-react';
import { db } from '../services/dataStore';
import { executeExamDayCrisisOptimization } from '../algorithms/examCrisisEngine';
import { CrisisSimulationResult, CrisisStudentStatus } from '../types';
import { LiveTransitMap } from '../components/map/LiveTransitMap';

interface Props {
  navigate: (route: string) => void;
}

export const ExamDayCrisisPage: React.FC<Props> = ({ navigate }) => {
  const [crisisState, setCrisisState] = useState<CrisisSimulationResult | null>(db.getCrisisSimulation());
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'exam' | 'rerouted' | 'atRisk' | 'alternatives' | 'stranded'>('all');
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);
  const [selectedStudentExplanation, setSelectedStudentExplanation] = useState<string | null>(null);

  // One-Click "Trigger Exam Day Crisis" action
  const handleActivateCrisis = () => {
    setIsProcessing(true);

    setTimeout(() => {
      const villages = db.getVillages();
      const institutions = db.getInstitutions();
      const vehicles = db.getVehicles();
      const crisisRequests = db.getCombinedCrisisRequests(); // 30 baseline + 12 surge = 42 students

      const result = executeExamDayCrisisOptimization({
        requests: crisisRequests,
        vehicles,
        villages,
        institutions,
        simulatedTime: '07:15 AM',
        examStartTime: '09:00 AM',
        isFlooded: true
      });

      setCrisisState(result);
      db.saveCrisisSimulation(result);
      setIsProcessing(false);
      setConfirmationNotice('🚨 THE EXAM DAY CRISIS ACTIVATED: 2 Government Buses failed, +40% surge demand (+12 students), Canal Road flood rerouting computed via Dijkstra, and 2-Hour Exam Prioritization executed!');
    }, 350);
  };

  const handleConfirmPlan = () => {
    if (!crisisState) return;

    const confirmed: CrisisSimulationResult = {
      ...crisisState,
      isConfirmed: true,
      confirmedAt: new Date().toLocaleTimeString()
    };

    setCrisisState(confirmed);
    db.saveCrisisSimulation(confirmed);
    setConfirmationNotice('✅ Emergency Transport Plan Officially Approved by Chief Institutional Administrator.');
  };

  const handleResetScenario = () => {
    db.saveCrisisSimulation(null);
    setCrisisState(null);
    setConfirmationNotice('Normal baseline restored. Crisis simulation reset.');
  };

  const filteredAssignments = crisisState?.assignments.filter(a => {
    if (activeTab === 'exam') return a.hasExam;
    if (activeTab === 'rerouted') return a.status === 'Rerouted';
    if (activeTab === 'atRisk') return a.status === 'At risk';
    if (activeTab === 'alternatives') return a.status === 'Alternative Arranged';
    if (activeTab === 'stranded') return a.status === 'Stranded';
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Banner with One-Click Trigger Button */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-amber-950 p-6 sm:p-8 text-white shadow-2xl border border-red-800/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/40 text-xs font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>Surprise Hurdle Response Engine</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              THE EXAM DAY CRISIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Simultaneous handling of <strong>2 Government Bus Failures</strong>, a <strong>40% Student Demand Surge (+12)</strong>, 
              <strong> Canal Bridge Flash Flooding</strong> (requiring Dijkstra rerouting), and <strong>2-Hour Semester Board Exam Deadlines</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!crisisState ? (
              <button
                onClick={handleActivateCrisis}
                disabled={isProcessing}
                className="px-6 py-4 rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-sm shadow-xl shadow-red-600/30 flex items-center space-x-2.5 transition-transform active:scale-95 disabled:opacity-50"
              >
                <AlertOctagon className="w-5 h-5 text-white animate-spin" />
                <span>{isProcessing ? 'Optimizing Crisis...' : 'Trigger Exam Day Crisis'}</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                {!crisisState.isConfirmed ? (
                  <button
                    onClick={handleConfirmPlan}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center space-x-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve Emergency Plan</span>
                  </button>
                ) : (
                  <div className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Plan Approved at {crisisState.confirmedAt}</span>
                  </div>
                )}
                <button
                  onClick={handleActivateCrisis}
                  title="Recalculate Crisis Simulation"
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleResetScenario}
                  className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-300 hover:text-red-300 border border-slate-700 text-xs font-bold"
                >
                  Reset
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmationNotice && (
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-between shadow-lg">
          <span>{confirmationNotice}</span>
          <button onClick={() => setConfirmationNotice(null)} className="text-slate-400 hover:text-white text-xs">Dismiss</button>
        </div>
      )}

      {/* 2. Before vs After Crisis Dashboard */}
      {crisisState && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                <Layers className="w-5 h-5 text-brand-600" />
                <span>Before vs After Crisis Impact Matrix</span>
              </h2>
              <p className="text-xs text-slate-500">Live operational comparison of baseline vs post-crisis reallocation.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              Post-Crisis Optimization Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Before Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Before Crisis (Normal Baseline)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">Standard Morning</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">STUDENT DEMAND</span>
                  <span className="text-xl font-black text-slate-800">{crisisState.beforeAfter.before.totalStudents}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">REACHING ON TIME</span>
                  <span className="text-xl font-black text-emerald-600">{crisisState.beforeAfter.before.onTimeStudents}</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">STRANDED</span>
                  <span className="text-xl font-black text-slate-400">0</span>
                </div>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Active Buses / Fleet:</span>
                  <span className="font-bold">{crisisState.beforeAfter.before.availableBuses} Buses (94 Total Seats)</span>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Utilization:</span>
                  <span className="font-bold text-slate-700">{crisisState.beforeAfter.before.busUtilizationPercent}% (Normal Load)</span>
                </div>
              </div>
            </div>

            {/* After Card */}
            <div className="p-5 rounded-2xl bg-red-50/70 border-2 border-red-200 space-y-3">
              <div className="flex justify-between items-center border-b border-red-200 pb-2">
                <span className="font-bold text-red-900 text-xs uppercase tracking-wider">After Crisis (Exam Day Crisis Response)</span>
                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold">4 Simultaneous Events</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-white p-2 rounded-xl border border-red-200">
                  <span className="text-[9px] text-slate-500 font-bold block">TOTAL SURGE</span>
                  <span className="text-lg font-black text-slate-900">{crisisState.totalDemand}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-200">
                  <span className="text-[9px] text-emerald-700 font-bold block">RESCUED</span>
                  <span className="text-lg font-black text-emerald-600">{crisisState.rescuedCount}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-amber-200">
                  <span className="text-[9px] text-amber-700 font-bold block">AT RISK</span>
                  <span className="text-lg font-black text-amber-600">{crisisState.atRiskCount}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-red-200">
                  <span className="text-[9px] text-red-700 font-bold block">STRANDED</span>
                  <span className="text-lg font-black text-red-600">{crisisState.strandedCount}</span>
                </div>
              </div>
              <div className="text-xs text-red-900 space-y-1">
                <div className="flex justify-between">
                  <span>Remaining Usable Fleet:</span>
                  <span className="font-bold">{crisisState.availableVehicles.length} Vehicles ({crisisState.totalAvailableSeats} Seats)</span>
                </div>
                <div className="flex justify-between">
                  <span>Fleet Utilization:</span>
                  <span className="font-bold text-red-700">100% Maximum Certified Capacity</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. The 4 Events Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-red-600">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 1: 2 Bus Breakdowns</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            UPSRTC Buses #1001 & #1002 failed. 60 government passenger seats removed.
          </p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            crisisState ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {crisisState ? '2 Buses Disabled' : 'Standby'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-amber-600">
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 2: +40% Surge</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Demand escalated from 30 baseline to 42 students (+12 surge riders).
          </p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            crisisState ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {crisisState ? '42 Total Students' : 'Standby'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-blue-600">
            <Droplets className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 3: Flash Flooding</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            Canal Road Bridge underwater. Traffic rerouted via Balarampur (+25m detour).
          </p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            crisisState ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {crisisState ? 'Detour Active (45m)' : 'Standby'}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-purple-600">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 4: 2-Hour Exams</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            24 students have 09:00 AM exams. Prioritized by soonest remaining time.
          </p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            crisisState ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {crisisState ? '24 Exam Candidates' : 'Standby'}
          </span>
        </div>
      </div>

      {crisisState ? (
        <>
          {/* 4. Live Map Integration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>Geographic Map: Flooded Bridge Hazard & Active Detour Line</span>
              </h3>
              <span className="text-[11px] text-slate-500">Live OpenStreetMap Leaflet Engine</span>
            </div>
            <LiveTransitMap isFlooded={true} />
          </div>

          {/* 5. Overflow Alternative Options Mobilization Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-amber-600" />
                  <span>Activated Secondary Alternative Transport Options</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Leftover students beyond primary 34 vehicle seats are routed into specialized local arrangements.
                </p>
              </div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {crisisState.alternativeAssignedCount} Students Accommodated via Alternatives
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {crisisState.alternativeOptions.map((alt, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-black text-slate-900">{alt.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      {alt.capacityAllocated} Slots
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{alt.description}</p>
                  <div className="pt-2 border-t border-amber-200/60 flex justify-between text-[11px] font-mono">
                    <span>Departs: <strong>{alt.estimatedDeparture}</strong></span>
                    <span>ETA: <strong>{alt.estimatedArrival}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 6. AI Decision Explanation Panel */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl space-y-4 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <BrainCircuit className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  AI Decision Explanation & Transparent Reasoning Panel
                </h3>
              </div>
              <span className="text-xs text-slate-400">Plain Language Audit Log</span>
            </div>

            <p className="text-xs text-slate-300">
              The AI optimization engine provides verifiable reasons for each allocation decision based on exam urgency, route access, and seat capacity:
            </p>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2">
              {crisisState.aiExplanations.slice(0, 6).map((exp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-amber-300">{exp.studentName} ({exp.studentCode})</span>
                    <span className="text-[10px] font-mono text-slate-400">{exp.decision}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    <strong>AI Rationale:</strong> {exp.aiReasoningText}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 pt-1">
                    <span>Urgency: <strong className="text-slate-300">{exp.factorUrgency}</strong></span>
                    <span>•</span>
                    <span>Route: <strong className="text-slate-300">{exp.factorRoute}</strong></span>
                    <span>•</span>
                    <span>Capacity: <strong className="text-slate-300">{exp.factorCapacity}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. Student Crisis Allocation Manifest Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Student Manifest: Status, ETAs & Examination Deadlines ({crisisState.assignments.length} Records)
                </h3>
                <p className="text-xs text-slate-500">Includes baseline and 40% demand surge students.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({crisisState.assignments.length})
                </button>
                <button
                  onClick={() => setActiveTab('exam')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'exam' ? 'bg-purple-600 text-white' : 'bg-white text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  Exam ({crisisState.assignments.filter(a => a.hasExam).length})
                </button>
                <button
                  onClick={() => setActiveTab('rerouted')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'rerouted' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Rerouted ({crisisState.assignments.filter(a => a.status === 'Rerouted').length})
                </button>
                <button
                  onClick={() => setActiveTab('atRisk')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'atRisk' ? 'bg-amber-600 text-white' : 'bg-white text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  At Risk ({crisisState.atRiskCount})
                </button>
                <button
                  onClick={() => setActiveTab('alternatives')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'alternatives' ? 'bg-blue-600 text-white' : 'bg-white text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  Alternatives ({crisisState.alternativeAssignedCount})
                </button>
                <button
                  onClick={() => setActiveTab('stranded')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'stranded' ? 'bg-red-600 text-white' : 'bg-white text-red-700 hover:bg-red-50'
                  }`}
                >
                  Stranded ({crisisState.strandedCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-100/80 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student & Code</th>
                    <th className="px-4 py-3">Exam Deadline</th>
                    <th className="px-4 py-3">Assigned Vehicle / Option</th>
                    <th className="px-4 py-3">ETA vs Exam Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">AI Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssignments.map((a) => (
                    <tr key={a.requestId} className={
                      a.status === 'Stranded'
                        ? 'bg-red-50/50' 
                        : a.status === 'At risk'
                          ? 'bg-amber-50/50'
                          : a.hasExam ? 'bg-purple-50/30' : ''
                    }>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {a.studentName}
                        <div className="text-[10px] font-mono text-slate-500">{a.studentCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        {a.hasExam ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
                            09:00 AM Exam
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Regular Travel</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.vehicleName ? (
                          <div className="font-bold text-slate-800">
                            {a.vehicleName}
                            <div className="text-[10px] text-slate-500">{a.vehicleType}</div>
                          </div>
                        ) : a.alternativeOption ? (
                          <span className="text-amber-800 font-bold">{a.alternativeOption}</span>
                        ) : (
                          <span className="text-red-600 font-bold italic">No vehicle capacity</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {a.expectedArrivalTime ? (
                          <div>
                            <span className={a.isLateForExam ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                              ETA: {a.expectedArrivalTime}
                            </span>
                            {a.hasExam && (
                              <div className="text-[10px] text-slate-500">
                                {a.isLateForExam ? '⚠️ Late for 09:00 AM' : '✅ On-time (<09:00 AM)'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          a.status === 'Rerouted'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : a.status === 'Assigned'
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : a.status === 'Alternative Arranged'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : a.status === 'At risk'
                                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                  : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-sm">
                        {a.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <Flame className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Exam Day Crisis Mode Standby</h2>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            Click <strong>Trigger Exam Day Crisis</strong> to execute the full multi-disruption optimization (2 Government Bus failures, +40% surge demand, flooded canal road detour, and semester exam deadlines).
          </p>
          <button
            onClick={handleActivateCrisis}
            className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/20"
          >
            Trigger Exam Day Crisis
          </button>
        </div>
      )}
    </div>
  );
};
