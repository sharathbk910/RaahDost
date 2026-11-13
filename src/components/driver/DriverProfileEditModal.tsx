import React, { useState } from 'react';
import { X, Check, Save, Car, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DriverProfile, VehicleCategory } from '../../types';
import { db } from '../../services/dataStore';
import { NominatimAddressInput } from '../map/NominatimAddressInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  driver: DriverProfile;
  onSaved?: () => void;
}

export const DriverProfileEditModal: React.FC<Props> = ({ isOpen, onClose, driver, onSaved }) => {
  const [vehicleType, setVehicleType] = useState<VehicleCategory>(driver.vehicleType || 'Car');
  const [plate, setPlate] = useState(driver.vehicleNumberPlate || '');
  const [totalSeats, setTotalSeats] = useState<number>(driver.totalSeats || 4);
  const [startLocation, setStartLocation] = useState(driver.activeRoute?.startLocation || 'Mulki Bus Stand');
  const [destinationLocation, setDestinationLocation] = useState(driver.activeRoute?.destinationLocation || 'Government Polytechnic College Mangalore (Kadri Hills)');
  const [departureTime, setDepartureTime] = useState(driver.departureTime || '07:30 AM');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [reApprovalNotice, setReApprovalNotice] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const plateChanged = plate.trim().toUpperCase() !== driver.vehicleNumberPlate.trim().toUpperCase();
    const typeChanged = vehicleType !== driver.vehicleType;
    const requiresReApproval = plateChanged || typeChanged;

    const updates: Partial<DriverProfile> = {
      vehicleType,
      vehicleNumberPlate: plate.trim().toUpperCase(),
      totalSeats,
      departureTime,
      activeRoute: {
        id: driver.activeRoute?.id || `route-${driver.id}`,
        startLocation,
        destinationLocation,
        usualDepartureTime: departureTime,
        operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      },
      // If critical security details (plate/type) changed, reset approval status
      ...(requiresReApproval ? { approvalStatus: 'pending' as const } : {})
    };

    db.updateDriver(driver.id, updates);

    db.logEdit(
      requiresReApproval ? 'Edited Vehicle - Re-Approval Required' : 'Edited Driver Vehicle & Commute',
      'Driver Profile',
      `Driver ${driver.fullName} updated vehicle to ${vehicleType} (${plate}). Status: ${requiresReApproval ? 'Pending Approval' : 'Approved'}`,
      'driver',
      driver.fullName
    );

    if (requiresReApproval) {
      setReApprovalNotice(true);
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setReApprovalNotice(false);
      if (onSaved) onSaved();
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Car className="w-5 h-5 text-teal-300" />
            <h3 className="text-base font-black tracking-tight">Edit Vehicle & Route Details</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-teal-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                {reApprovalNotice
                  ? 'Plate/Vehicle changed! Reset to "Pending Approval" for transport safety verification.'
                  : 'Vehicle & commute route saved!'}
              </span>
            </div>
          )}

          {/* Vehicle Category & Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
              >
                <option value="Car">Private Car (Swift/Dzire)</option>
                <option value="Shared Van">Shared Bolero / Cruiser Van</option>
                <option value="Auto">Auto Rickshaw</option>
                <option value="Mini Bus">Mini Bus (Kudla Shuttle)</option>
                <option value="Bike">Two Wheeler / Bike</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Vehicle License Plate</label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="KA-19-AB-1234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-bold uppercase text-slate-900 focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">
              <strong>Notice:</strong> Changing the license plate or vehicle type automatically returns your driver profile to <strong>"Pending Approval"</strong> until re-verified by the Chief Transport Officer.
            </p>
          </div>

          {/* Total Seats */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Total Passenger Capacity</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 6, 8, 12].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setTotalSeats(num)}
                  className={`flex-1 py-2 rounded-xl font-bold border text-xs transition-colors ${
                    totalSeats === num
                      ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          {/* Start & Destination Locations */}
          <div className="space-y-3">
            <NominatimAddressInput
              label="Starting Pickup Point (Daily Commute)"
              value={startLocation}
              onChange={(addr) => setStartLocation(addr.split(',')[0])}
              placeholder="e.g. Mulki Bus Stand..."
            />

            <NominatimAddressInput
              label="Destination College / Town (Daily Commute)"
              value={destinationLocation}
              onChange={(addr) => setDestinationLocation(addr.split(',')[0])}
              placeholder="e.g. Government Polytechnic Kadri Hills, Mangalore..."
            />
          </div>

          {/* Departure Time */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Today's Usual Departure Time</label>
            <input
              type="text"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              placeholder="07:30 AM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-black shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Vehicle'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

