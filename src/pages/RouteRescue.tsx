import React, { useState } from 'react';
import { 
  LifeBuoy, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  ShieldAlert, 
  Users, 
  Car, 
  Sliders, 
  ArrowRight,
  Info,
  Clock,
  Sparkles
} from 'lucide-react';
import { db } from '../services/dataStore';
import { calculateAllocations } from '../algorithms/matchingEngine';
import { AllocationResult } from '../types';
import { LiveTransitMap } from '../components/map/LiveTransitMap';

interface Props {
  navigate: (route: string) => void;
}

export const RouteRescue: React.FC<Props> = ({ navigate }) => {
  const [disruptions] = useState(db.getDisruptions());
  const [selectedDisruptionId, setSelectedDisruptionId] = useState(disruptions[0]?.id || '');
  const [vehicles, setVehicles] = useState(db.getVehicles());
  const [requests, setRequests] = useState(db.getRequests());
  const [allocation, setAllocation] = useState<AllocationResult | null>(db.getActiveRescue());
  const [notification, setNotification] = useState<string | null>(null);

  const selectedDisruption = disruptions.find(d => d.id === selectedDisruptionId);
  const villages = db.getVillages();
  const institutions = db.getInstitutions();

  // Run the matching engine
  const handleRunRescue = () => {
    if (!selectedDisruption) return;

    // Filter student requests related to this route/destination
    // In demo scenario, the 30 students at Rampur going to Polytechnic
    const affectedRequests = requests.filter(r => 
      !selectedDisruption.destinationId || r.destinationId === selectedDisruption.destinationId
    );

    const newVersion = allocation ? allocation.version + 1 : 1;
    const result = calculateAllocations(
      selectedDisruption.id,
      affectedRequests,
      vehicles,
      villages,
      institutions,
      newVersion
    );

    setAllocation(result);
    db.saveActiveRescue(result);

    // Update requests in storage with proposed status
    result.assignments.forEach(a => {
      db.updateRequestStatus(
        a.requestId,
        a.status === 'proposed' ? 'proposed' : 'unassigned',
        a.vehicleId,
        a.vehicleName
      );
    });
    setRequests(db.getRequests());

    setNotification(`⚡ Matching engine executed: ${result.allocatedStudents} allocated, ${result.unassignedStudents} unassigned.`);
    setTimeout(() => setNotification(null), 5000);
  };

  // Confirm proposed allocations
  const handleConfirmAllocation = () => {
    if (!allocation) return;

    const confirmedResult = {
      ...allocation,
      isConfirmed: true,
      assignments: allocation.assignments.map(a => ({
        ...a,
        status: (a.status === 'proposed' ? 'confirmed' : a.status) as 'proposed' | 'confirmed' | 'unassigned'
      }))
    };

    setAllocation(confirmedResult);
    db.saveActiveRescue(confirmedResult);

    // Commit to student requests
    confirmedResult.assignments.forEach(a => {
      db.updateRequestStatus(
        a.requestId,
        a.status === 'confirmed' ? 'confirmed' : 'unassigned',
        a.vehicleId,
        a.vehicleName
      );
    });
    setRequests(db.getRequests());

    setNotification('✅ Allocations officially confirmed by Administrator. Student portal updated.');
    setTimeout(() => setNotification(null), 5000);
  };

  // Dynamic reallocation simulation: adjust capacity of a vehicle
  const handleSeatChange = (vehicleId: string, delta: number) => {
    const updated = vehicles.map(v => {
      if (v.id === vehicleId) {
        const newSeats = Math.max(0, Math.min(v.totalCapacity, v.availableSeats + delta));
        return { ...v, availableSeats: newSeats };
      }
      return v;
    });
    setVehicles(updated);
    db.saveVehicles(updated);

    // If an allocation was active, mark it as invalid/stale requiring recalculation
    if (allocation) {
      setNotification('⚠️ Vehicle capacity modified. Re-run or click Recalculate to update student allocations.');
    }
  };

  const totalCapacityAvailable = vehicles
    .filter(v => v.availabilityStatus === 'available')
    .reduce((sum, v) => sum + v.availableSeats, 0);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 rounded-3xl p-6 sm:p-8 text-slate-950 shadow-xl shadow-amber-500/10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-slate-950 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
              <LifeBuoy className="w-3.5 h-3.5 text-amber-400" />
              <span>Core Emergency Coordination Engine</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              ROUTE RESCUE
            </h1>
            <p className="text-sm sm:text-base font-semibold text-slate-900/90 leading-relaxed">
              One disruption. Multiple coordinated alternatives. Instant deterministic matching ensuring students don't miss examinations or classes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunRescue}
              className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-black text-sm shadow-xl flex items-center space-x-2 transition-transform active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>{allocation ? 'Recalculate Allocations' : 'Calculate Rescue Plan'}</span>
            </button>

            {allocation && !allocation.isConfirmed && (
              <button
                onClick={handleConfirmAllocation}
                className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-emerald-800 font-black text-sm shadow-xl border-2 border-emerald-600 flex items-center space-x-2 transition-transform active:scale-95"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Confirm Allocations</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 rounded-xl bg-slate-900 text-amber-300 border border-amber-500/40 text-sm font-semibold flex items-center justify-between shadow-lg animate-fade-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-xs text-slate-400 hover:text-white">Dismiss</button>
        </div>
      )}

      {/* Disruption Context Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Incident</span>
              <h2 className="text-lg font-bold text-slate-900">{selectedDisruption?.affectedRoute}</h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-sm">
            <div className="px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 font-bold">
              {selectedDisruption?.affectedStudentCount} Stranded Students
            </div>
            <div className={`px-3 py-1 rounded-lg font-bold border ${
              totalCapacityAvailable >= (selectedDisruption?.affectedStudentCount || 0)
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {totalCapacityAvailable} Alternative Seats Available
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <strong className="text-slate-800">Situation Brief:</strong> {selectedDisruption?.description}
        </p>

        {/* Live Geographic Map Integration */}
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center space-x-1.5">
            <span>🗺️ Corridor Map (Pickup Hubs & Polytechnic Destination)</span>
          </div>
          <LiveTransitMap isFlooded={false} />
        </div>
      </div>

      {/* Dynamic Vehicle Capacity Controls (Demonstrates Reallocation) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-brand-600" />
              <span>Alternative Fleet Capacity & Reallocation Controls</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust available seats up or down in real-time, then recalculate to test capacity exhaustion edge cases.
            </p>
          </div>
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-200">
            {totalCapacityAvailable} Total Seats Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">{v.name}</h4>
                  <span className="text-[10px] text-slate-500 font-mono">{v.vehicleCode}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-slate-200 text-slate-700">
                  {v.vehicleType}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-600">Available Seats:</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSeatChange(v.id, -1)}
                    disabled={v.availableSeats <= 0}
                    className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-black text-xs disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="font-black text-sm text-slate-900 w-6 text-center">{v.availableSeats}</span>
                  <button
                    onClick={() => handleSeatChange(v.id, 1)}
                    disabled={v.availableSeats >= v.totalCapacity}
                    className="w-6 h-6 rounded bg-slate-200 hover:bg-slate-300 font-black text-xs disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Total capacity limit: {v.totalCapacity}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Allocation Execution Results */}
      {allocation ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-black text-slate-900">
                  Allocation Plan (Version #{allocation.version})
                </h3>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
                  allocation.isConfirmed 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {allocation.isConfirmed ? 'Confirmed by Admin' : 'Proposed (Requires Review)'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Calculated deterministically at {new Date(allocation.timestamp).toLocaleTimeString()}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-slate-500">Accommodation Rate</span>
                <p className="text-lg font-black text-slate-900">
                  {allocation.allocatedStudents} / {allocation.affectedStudents}
                </p>
              </div>
              {allocation.unassignedStudents > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-red-100 border border-red-300 text-red-800 text-xs font-bold">
                  ⚠️ {allocation.unassignedStudents} Stranded
                </div>
              )}
            </div>
          </div>

          {/* Load Summary per Vehicle */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vehicle Capacity Utilization Breakdown
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {allocation.vehicleUsage.map(u => (
                <div key={u.vehicleId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-800">{u.vehicleName}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{u.vehicleType}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-brand-700">{u.assignedSeats} Allocated</span>
                    <span className="text-slate-500">{u.remainingSeats} Seats Free</span>
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

          {/* Student Assignments Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Detailed Passenger-to-Vehicle Manifest ({allocation.assignments.length} Records)
              </h4>
              <span className="text-xs text-slate-500">Enforcing strict seat capacity constraints</span>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs divide-y divide-slate-200">
                <thead className="bg-slate-50 font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Student Name & ID</th>
                    <th className="px-4 py-3">Pickup Location</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Assigned Vehicle</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Reason / Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {allocation.assignments.map((item, idx) => (
                    <tr key={item.requestId} className={item.status === 'unassigned' ? 'bg-red-50/60' : ''}>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {item.studentName}
                        <div className="text-[10px] font-mono text-slate-500">{item.studentCode}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.pickupVillage}</td>
                      <td className="px-4 py-3 text-slate-600">{item.destination}</td>
                      <td className="px-4 py-3 font-medium">
                        {item.vehicleName ? (
                          <div className="text-slate-900 font-bold">
                            {item.vehicleName}
                            <div className="text-[10px] text-slate-500">{item.vehicleType}</div>
                          </div>
                        ) : (
                          <span className="text-red-600 font-bold italic">No vehicle assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          item.status === 'confirmed' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : item.status === 'proposed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {item.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4">
          <LifeBuoy className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">Ready to Initiate Route Rescue</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Click the button below to run the deterministic matching engine on the 30 stranded students and evaluate fleet capacity.
          </p>
          <button
            onClick={handleRunRescue}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20"
          >
            Run Route Rescue Now
          </button>
        </div>
      )}
    </div>
  );
};

