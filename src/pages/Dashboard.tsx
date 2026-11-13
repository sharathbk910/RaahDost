import React from 'react';
import { 
  Users, 
  Car, 
  LifeBuoy, 
  AlertTriangle, 
  CheckCircle, 
  UserX, 
  ArrowRight,
  TrendingUp,
  MapPin,
  Clock
} from 'lucide-react';
import { db } from '../services/dataStore';
import { Disruption, Vehicle, TransportRequest } from '../types';

interface Props {
  navigate: (route: string) => void;
}

export const Dashboard: React.FC<Props> = ({ navigate }) => {
  const requests = db.getRequests();
  const vehicles = db.getVehicles();
  const disruptions = db.getDisruptions();
  const activeDisruptions = disruptions.filter(d => d.status === 'active');
  const activeRescue = db.getActiveRescue();

  const totalStudents = requests.length;
  const activeVehicles = vehicles.filter(v => v.availabilityStatus === 'available');
  const totalAvailableSeats = activeVehicles.reduce((acc, v) => acc + v.availableSeats, 0);
  
  // Calculate affected count
  const affectedStudentsCount = activeDisruptions.reduce((acc, d) => acc + d.affectedStudentCount, 0);

  // Status breakdown
  const confirmedCount = requests.filter(r => r.status === 'confirmed').length;
  const proposedCount = requests.filter(r => r.status === 'proposed').length;
  const unassignedCount = requests.filter(r => r.status === 'unassigned').length;
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Institutional Transport Command Center
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Real-time monitoring of rural student travel corridors, emergency disruptions, and coordinated relief fleets.
          </p>
        </div>
        <button
          onClick={() => navigate('/rescue')}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-transform active:scale-95"
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Launch Route Rescue</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Stranded/Active</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{totalStudents}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center">
            <span className="text-red-600 font-bold mr-1">{affectedStudentsCount}</span> in active disruption
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Alternative Seats</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{totalAvailableSeats}</p>
          <div className="mt-2 text-xs text-slate-500 flex items-center">
            Across <span className="font-bold text-slate-700 mx-1">{activeVehicles.length}</span> active vehicles
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Allocated / Confirmed</span>
            <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-brand-700 mt-2">{confirmedCount + proposedCount}</p>
          <div className="mt-2 text-xs text-slate-500">
            {confirmedCount} confirmed, {proposedCount} proposed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Capacity Shortfall / Unassigned</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-3xl font-black mt-2 ${unassignedCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {unassignedCount}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            {pendingCount} still pending matching
          </div>
        </div>
      </div>

      {/* Active Disruptions Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">Active Transportation Emergencies</h2>
          </div>
          <button
            onClick={() => navigate('/disruptions')}
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
          >
            <span>Manage All Disruptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeDisruptions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No active disruptions reported. All corridors running normally.
            </div>
          ) : (
            activeDisruptions.map(d => (
              <div key={d.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-amber-50/40">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase bg-red-100 text-red-700 border border-red-200">
                      {d.disruptionType.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      Reported {new Date(d.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{d.affectedRoute}</h3>
                  <p className="text-sm text-slate-600 max-w-2xl">{d.description}</p>
                  <p className="text-xs font-semibold text-amber-800">
                    Affected Students: <span className="font-extrabold text-sm">{d.affectedStudentCount}</span>
                  </p>
                </div>
                <button
                  onClick={() => navigate('/rescue')}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 flex-shrink-0"
                >
                  <LifeBuoy className="w-4 h-4" />
                  <span>Execute Rescue Engine</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Fleet Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Car className="w-5 h-5 text-slate-600" />
              <span>Registered Alternative Fleet ({vehicles.length})</span>
            </h3>
            <button
              onClick={() => navigate('/vehicles')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              Manage Fleet
            </button>
          </div>
          <div className="space-y-3">
            {vehicles.slice(0, 4).map(v => (
              <div key={v.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-slate-900">{v.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 font-semibold text-slate-700">
                      {v.vehicleType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{v.vehicleCode} • Driver: {v.driverName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-black text-emerald-600">{v.availableSeats} / {v.totalCapacity} Seats</div>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    v.availabilityStatus === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {v.availabilityStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Allocation Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <span>Matching Engine Status</span>
            </h3>
            <span className="text-xs font-medium text-slate-400">
              {activeRescue ? `Rescue Version #${activeRescue.version}` : 'Idle'}
            </span>
          </div>

          {activeRescue ? (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-brand-50 border border-brand-200 text-xs text-brand-900 space-y-1">
                <div className="font-bold text-sm">
                  {activeRescue.isConfirmed ? '✅ Confirmed Emergency Allocation' : '⚠️ Proposed Allocation (Pending Review)'}
                </div>
                <p>
                  Allocated: <strong>{activeRescue.allocatedStudents}</strong> of <strong>{activeRescue.affectedStudents}</strong> students 
                  {activeRescue.unassignedStudents > 0 && ` (${activeRescue.unassignedStudents} unassigned)`}.
                </p>
              </div>

              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-2">
                Alternative Vehicle Load Distribution:
              </div>

              <div className="space-y-2">
                {activeRescue.vehicleUsage.map(u => (
                  <div key={u.vehicleId} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{u.vehicleName}</span>
                      <span>{u.assignedSeats} assigned ({u.remainingSeats} left)</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-brand-600 h-full rounded-full transition-all"
                        style={{ width: `${(u.assignedSeats / (u.initialAvailableSeats || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center space-y-3">
              <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">
                Route Rescue has not been executed for the current session.
              </p>
              <button
                onClick={() => navigate('/rescue')}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Go to Route Rescue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
