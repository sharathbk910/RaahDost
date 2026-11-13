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
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  MapPin,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { db } from '../services/dataStore';
import { executeExamDayCrisisOptimization } from '../algorithms/examCrisisEngine';
import { CrisisSimulationResult } from '../types';
import { LiveTransitMap } from '../components/map/LiveTransitMap';

interface Props {
  navigate: (route: string) => void;
}

export const ExamDayCrisisPage: React.FC<Props> = ({ navigate }) => {
  const [crisisState, setCrisisState] = useState<CrisisSimulationResult | null>(db.getCrisisSimulation());
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'exam' | 'unassigned' | 'late'>('all');
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  // Trigger Crisis Mode Activation (Runs all 4 events simultaneously)
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
      setConfirmationNotice('🚨 THE EXAM DAY CRISIS ACTIVATED: 2 Buses failed, 40% demand surge (+12 students), Canal road blocked, Dijkstra detour computed, and Exam priorities assigned!');
    }, 400);
  };

  const handleConfirmPlan = () => {
    if (!crisisState) return;

    const confirmed: CrisisSimulationResult = {
      ...crisisState,
      isConfirmed: true,
      confirmedAt: new Date().toLocaleTimeString(),
      assignments: crisisState.assignments.map(a => ({
        ...a,
        status: a.status === 'Successfully Reassigned' || a.status === 'Examination Priority'
          ? 'Successfully Reassigned'
          : a.status
      }))
    };

    setCrisisState(confirmed);
    db.saveCrisisSimulation(confirmed);
    setConfirmationNotice('✅ Emergency Crisis Transport Plan Officially Approved by Chief Institutional Administrator.');
  };

  const handleResetScenario = () => {
    db.saveCrisisSimulation(null);
    setCrisisState(null);
    setConfirmationNotice('Scenario reset: Normal operational baseline restored.');
  };

  const filteredAssignments = crisisState?.assignments.filter(a => {
    if (activeTab === 'exam') return a.hasExam;
    if (activeTab === 'unassigned') return a.status === 'No Vehicle Available' || a.status === 'No Feasible Route';
    if (activeTab === 'late') return a.status === 'Expected to Arrive Late';
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hero Header */}
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
                <span>{isProcessing ? 'Optimizing Crisis...' : 'Trigger Exam Day Crisis (All 4 Events)'}</span>
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

      {/* 4 Crisis Events Breakdown Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Event 1 Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-red-600">
            <AlertOctagon className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 1: Bus Breakdowns</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            2 Government buses failed (UPSRTC #1001 & #1002). 60 total capacity eliminated.
          </p>
          <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2 py-0.5 rounded ${
            crisisState ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {crisisState ? '2 Buses Unavailable' : 'Standby'}
          </span>
        </div>

        {/* Event 2 Card */}
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

        {/* Event 3 Card */}
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

        {/* Event 4 Card */}
        <div className={`p-4 rounded-2xl border transition-all ${
          crisisState ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center space-x-2 text-purple-600">
            <Clock className="w-5 h-5 flex-shrink-0" />
            <h3 className="text-xs font-black uppercase tracking-wider">Event 4: 2-Hour Exams</h3>
          </div>
          <p className="text-xs text-slate-600 mt-2 font-medium">
            24 students have 09:00 AM semester exams. Prioritized to ensure on-time arrival.
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
          {/* Real-time Crisis KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Student Demand</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{crisisState.totalDemand}</p>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                30 Baseline + 12 Surge
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Usable Fleet Capacity</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{crisisState.totalAvailableSeats}</p>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                4 Vans / Mini-Buses Active
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Exam Priority Rescued</span>
              <p className="text-2xl font-black text-purple-600 mt-1">{crisisState.rescuedCount}</p>
              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                On-time Board Examination
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Late Risk (Detour Delay)</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{crisisState.lateArrivalCount}</p>
              <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                Flooding Delay Impact
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Capacity Shortfall</span>
              <p className="text-2xl font-black text-red-600 mt-1">{crisisState.unassignedCount}</p>
              <span className="text-[10px] text-red-700 font-bold bg-red-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                Unassigned (Exceeded Capacity)
              </span>
            </div>
          </div>

          {/* Live OpenStreetMap Interactive Route Map */}
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

          {/* Flooded Road Dijkstra Routing Comparison Box */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Dijkstra Alternative Route Computation (Canal Flooding)
                </h3>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                Canal Bridge Submerged
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 space-y-1.5">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  <span>⛔ Blocked Primary Route:</span>
                  <span className="line-through text-red-500 font-mono">20 Minutes (8.5 km)</span>
                </div>
                <p className="text-slate-600 font-mono">{crisisState.alternativeRouteSummary.originalPath}</p>
                <p className="text-[11px] text-red-700">Reason: Flash flooding over Rampur canal spillway. Road blocked by authorities.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1.5">
                <div className="font-bold text-emerald-900 flex items-center justify-between">
                  <span>✅ Activated Dijkstra Detour:</span>
                  <span className="text-emerald-700 font-mono font-bold">45 Minutes (21.5 km)</span>
                </div>
                <p className="text-slate-700 font-mono">{crisisState.alternativeRouteSummary.alternativePath}</p>
                <p className="text-[11px] text-emerald-800">
                  Delay Factor: <strong>+{crisisState.alternativeRouteSummary.delayMinutes} mins</strong> detour. Calculated for late-arrival exam risk.
                </p>
              </div>
            </div>
          </div>

          {/* Usable Alternative Fleet Capacity Tracker */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Alternative Emergency Fleet Load & Exam Prioritization
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {crisisState.vehicleUsage.map(v => (
                <div key={v.vehicleId} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-900">{v.vehicleName}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{v.vehicleType}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-emerald-700">{v.assignedSeats} / {v.totalCapacity} Seats</span>
                    <span className="text-purple-700">{v.examStudentsCount} Exam Students</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${(v.assignedSeats / v.totalCapacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filter Tabs & Student Manifest Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-black text-slate-900">
                  Crisis Manifest & Student Arrival Schedule ({crisisState.assignments.length} Records)
                </h3>
              </div>

              {/* Tabs */}
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
                  Exam Candidates ({crisisState.assignments.filter(a => a.hasExam).length})
                </button>
                <button
                  onClick={() => setActiveTab('unassigned')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'unassigned' ? 'bg-red-600 text-white' : 'bg-white text-red-700 hover:bg-red-50'
                  }`}
                >
                  Unassigned ({crisisState.unassignedCount})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-100/80 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student & Code</th>
                    <th className="px-4 py-3">Exam Status</th>
                    <th className="px-4 py-3">Assigned Vehicle</th>
                    <th className="px-4 py-3">Est. Arrival Time</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Allocation Reason & Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssignments.map((a) => (
                    <tr key={a.requestId} className={
                      a.status === 'No Vehicle Available' 
                        ? 'bg-red-50/50' 
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
                        ) : (
                          <span className="text-red-600 font-bold italic">No seats available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {a.expectedArrivalTime ? (
                          <span className={a.isLateForExam ? 'text-red-600 font-bold' : 'text-emerald-700 font-bold'}>
                            {a.expectedArrivalTime}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          a.status === 'Examination Priority'
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : a.status === 'Successfully Reassigned'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : a.status === 'Expected to Arrive Late'
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
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
            Click <strong>Trigger Exam Day Crisis</strong> to load the multi-disruption event (2 Government Bus failures, +40% surge demand, flooded canal road detour, and semester exam deadlines).
          </p>
          <button
            onClick={handleActivateCrisis}
            className="px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-lg shadow-red-600/20"
          >
            Activate Crisis Scenario
          </button>
        </div>
      )}
    </div>
  );
};

