import React, { useState } from 'react';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck,
  Phone,
  UserCheck
} from 'lucide-react';
import { db } from '../services/dataStore';
import { Vehicle, VehicleType, VehicleStatus } from '../types';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(db.getVehicles());
  const villages = db.getVillages();
  const institutions = db.getInstitutions();

  // Registration modal / form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleCode, setVehicleCode] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Shared Van');
  const [startingVillageId, setStartingVillageId] = useState(villages[0]?.id || '');
  const [destinationId, setDestinationId] = useState(institutions[0]?.id || '');
  const [totalCapacity, setTotalCapacity] = useState(12);
  const [availableSeats, setAvailableSeats] = useState(10);
  const [driverName, setDriverName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const refreshVehicles = () => setVehicles(db.getVehicles());

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (availableSeats > totalCapacity) {
      setErrorMsg('Available seats cannot exceed total vehicle capacity.');
      return;
    }

    if (availableSeats < 0) {
      setErrorMsg('Available seats cannot be negative.');
      return;
    }

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      name: vehicleName.trim(),
      vehicleCode: vehicleCode.trim().toUpperCase(),
      vehicleType,
      startingVillageId,
      destinationId,
      totalCapacity,
      availableSeats,
      availabilityStatus: availableSeats === 0 ? 'full' : 'available',
      operatorConfirmed: true,
      driverName: driverName.trim() || 'Verified Operator',
      contactNumber: contactNumber.trim() || '+91 98000 00000'
    };

    db.addVehicle(newVehicle);
    refreshVehicles();
    setShowAddForm(false);
    // Reset form
    setVehicleName('');
    setVehicleCode('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this vehicle from the alternative fleet?')) {
      db.deleteVehicle(id);
      refreshVehicles();
    }
  };

  const handleStatusToggle = (vehicle: Vehicle) => {
    const nextStatus: VehicleStatus = 
      vehicle.availabilityStatus === 'available' ? 'unavailable' : 'available';
    db.updateVehicle(vehicle.id, { availabilityStatus: nextStatus });
    refreshVehicles();
  };

  const villageMap = new Map(villages.map(v => [v.id, v.name]));
  const instMap = new Map(institutions.map(i => [i.id, i.name]));

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Alternative Vehicle Fleet Network
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Register, configure capacity constraints, and manage verified private and shared vehicles for emergency coordination.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'Cancel' : 'Register Vehicle'}</span>
        </button>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Add Alternative Transport Vehicle</h3>
            <p className="text-xs text-slate-500">Enforce capacity limits: available seats must strictly be &le; total capacity.</p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shared Bolero Van C"
                  value={vehicleName}
                  onChange={(e) => setVehicleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration / Number Plate *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UP-32-AB-1234"
                  value={vehicleCode}
                  onChange={(e) => setVehicleCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Type *</label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="Shared Van">Shared Van</option>
                  <option value="Auto Rickshaw">Auto Rickshaw</option>
                  <option value="Mini Bus">Mini Bus</option>
                  <option value="Private Bus">Private Bus</option>
                  <option value="Government Bus">Government Bus</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Starting Village *</label>
                <select
                  value={startingVillageId}
                  onChange={(e) => setStartingVillageId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  {villages.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Destination Institution *</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  {institutions.map(i => (
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Total Capacity *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currently Available Seats *</label>
                <input
                  type="number"
                  min={0}
                  max={totalCapacity}
                  required
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Driver / Operator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Santosh Tiwari"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Operator Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md"
              >
                Register & Verify Vehicle
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => (
          <div key={v.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {v.vehicleCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {v.vehicleType}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleStatusToggle(v)}
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border transition-colors ${
                    v.availabilityStatus === 'available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  {v.availabilityStatus}
                </button>
              </div>

              {/* Route */}
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 border border-slate-100">
                <div className="text-slate-500">
                  From: <strong className="text-slate-800">{villageMap.get(v.startingVillageId)}</strong>
                </div>
                <div className="text-slate-500">
                  To: <strong className="text-slate-800">{instMap.get(v.destinationId)}</strong>
                </div>
              </div>

              {/* Capacity Indicator */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Available Seats:</span>
                  <span className="text-slate-900">{v.availableSeats} / {v.totalCapacity}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      v.availableSeats > 0 ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(v.availableSeats / v.totalCapacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center justify-between pt-1">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{v.driverName}</span>
                </span>
                <span className="font-mono text-[11px]">{v.contactNumber}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified by Admin</span>
              </span>
              <button
                onClick={() => handleDelete(v.id)}
                className="text-slate-400 hover:text-red-600 p-1 rounded transition-colors"
                title="Remove Vehicle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

