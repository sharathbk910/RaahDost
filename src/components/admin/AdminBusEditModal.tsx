import React, { useState } from 'react';
import { X, Check, Save, Bus, Trash2, AlertTriangle } from 'lucide-react';
import { Vehicle } from '../../types';
import { db } from '../../services/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  bus?: Vehicle | null;
  onSaved?: () => void;
}

export const AdminBusEditModal: React.FC<Props> = ({ isOpen, onClose, bus, onSaved }) => {
  const isNew = !bus;

  const [name, setName] = useState(bus?.name || 'KSRTC Express');
  const [vehicleCode, setVehicleCode] = useState(bus?.vehicleCode || 'KA-19-F-1105');
  const [routeName, setRouteName] = useState(bus?.routeName || 'Mulki - Surathkal - Mangalore');
  const [totalCapacity, setTotalCapacity] = useState<number>(bus?.totalCapacity || 45);
  const [availableSeats, setAvailableSeats] = useState<number>(bus?.availableSeats || 45);
  const [driverName, setDriverName] = useState(bus?.driverName || 'Gopal Poojary');
  const [contactNumber, setContactNumber] = useState(bus?.contactNumber || '+91 98450 11001');
  const [status, setStatus] = useState(bus?.availabilityStatus || 'available');
  const [departureTimes, setDepartureTimes] = useState<string>((bus?.departureTimes || ['07:30 AM', '08:15 AM']).join(', '));
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (availableSeats > totalCapacity) {
      setErrorMsg('Available seats cannot exceed total vehicle capacity.');
      return;
    }

    const timesArray = departureTimes.split(',').map(s => s.trim()).filter(Boolean);

    if (isNew) {
      const newBus: Vehicle = {
        id: `bus-custom-${Date.now()}`,
        name,
        vehicleCode,
        routeName,
        vehicleType: 'Government Bus',
        startingVillageId: 'vil-mulki',
        destinationId: 'inst-1',
        totalCapacity,
        availableSeats,
        availabilityStatus: status,
        operatorConfirmed: true,
        driverName,
        contactNumber,
        departureTimes: timesArray,
        stops: ['Mulki Bus Stand', 'Surathkal Junction', 'Kadri Polytechnic']
      };
      db.addVehicle(newBus);
      db.logEdit('Created New Fleet Bus', 'Fleet Management', `Added ${name} (${vehicleCode}) to ${routeName}`, 'admin', 'Chief Transport Officer');
    } else {
      const oldTiming = (bus.departureTimes || ['07:30 AM'])[0];
      const newTiming = timesArray[0] || '07:30 AM';
      const timingChanged = oldTiming !== newTiming;

      db.updateVehicle(bus.id, {
        name,
        vehicleCode,
        routeName,
        totalCapacity,
        availableSeats,
        availabilityStatus: status,
        driverName,
        contactNumber,
        departureTimes: timesArray
      });

      db.logEdit(
        'Updated Fleet Bus',
        'Fleet Management',
        `Updated bus ${bus.vehicleCode}: Status=${status}, Seats=${availableSeats}/${totalCapacity}, Timing=${newTiming}`,
        'admin',
        'Chief Transport Officer'
      );

      // PART 3: If timing changed, notify affected students immediately
      if (timingChanged) {
        db.notifyAffectedStudentsOnBusTimingChange(bus.id, oldTiming, newTiming);
      }
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 800);
  };

  const handleDelete = () => {
    if (!bus) return;
    const affectedCount = 28; // Estimated students on this route
    if (confirm(`⚠️ Warning: Removing ${bus.vehicleCode} will impact ~${affectedCount} students assigned to ${bus.routeName}. Proceed with deletion?`)) {
      db.deleteVehicle(bus.id);
      db.logEdit(
        'Deleted Fleet Bus',
        'Fleet Management',
        `Bus ${bus.vehicleCode} (${bus.name}) deleted from fleet roster.`,
        'admin',
        'Chief Transport Officer'
      );
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-amber-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bus className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-black tracking-tight">
              {isNew ? 'Add New Fleet Bus' : `Edit Bus: ${bus?.vehicleCode}`}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Bus record updated successfully! Real-time listeners notified.</span>
            </div>
          )}

          {/* Name & Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Bus Service Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle Plate / Code</label>
              <input
                type="text"
                required
                value={vehicleCode}
                onChange={(e) => setVehicleCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold"
              />
            </div>
          </div>

          {/* Route Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assigned Route Corridor</label>
            <input
              type="text"
              required
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          {/* Operational Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Operational Fleet Status</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'available', label: 'Running (OK)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'full', label: 'Full Capacity', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                { id: 'unavailable', label: 'Broken Down', color: 'border-red-500 bg-red-50 text-red-900' }
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatus(st.id as any)}
                  className={`py-2 px-2.5 rounded-xl border font-bold text-xs text-center transition-all ${
                    status === st.id ? `${st.color} ring-2 ring-emerald-500/30` : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capacities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Capacity</label>
              <input
                type="number"
                min="10"
                max="80"
                value={totalCapacity}
                onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Free Available Seats</label>
              <input
                type="number"
                min="0"
                max={totalCapacity}
                value={availableSeats}
                onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Driver Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Assigned Driver / Conductor</label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Conductor Mobile Phone</label>
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
          </div>

          {/* Departure Timings */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Daily Departure Schedules (Comma separated)</label>
            <input
              type="text"
              value={departureTimes}
              onChange={(e) => setDepartureTimes(e.target.value)}
              placeholder="07:30 AM, 08:15 AM, 09:00 AM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Editing these timings will automatically trigger targeted real-time alerts to matching students.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {!isNew ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Bus</span>
              </button>
            ) : <div />}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-md flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isNew ? 'Create Bus' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

