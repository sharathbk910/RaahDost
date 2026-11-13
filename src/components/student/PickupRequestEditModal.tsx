import React, { useState } from 'react';
import { X, Check, Save, AlertCircle, MapPin, Users, Clock } from 'lucide-react';
import { PickupRequest } from '../../types';
import { db } from '../../services/dataStore';
import { NominatimAddressInput } from '../map/NominatimAddressInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  request: PickupRequest;
  onSaved?: () => void;
}

export const PickupRequestEditModal: React.FC<Props> = ({ isOpen, onClose, request, onSaved }) => {
  const [pickupPoint, setPickupPoint] = useState(request.pickupLocationName);
  const [seats, setSeats] = useState<number>(request.seatsRequested || 1);
  const [examTime, setExamTime] = useState(request.examTime || '10:30 AM');
  const [notes, setNotes] = useState(request.notes || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Rule: If already accepted by driver, student cannot edit details—only cancel!
  const isAccepted = request.status === 'accepted' || request.status === 'picked_up' || request.status === 'on_the_way';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (isAccepted) {
      setErrorMsg('This ride has already been accepted by a driver. You can only cancel the ride if plans changed.');
      return;
    }

    const res = db.updatePickupRequest(request.id, {
      pickupLocationName: pickupPoint,
      seatsRequested: seats,
      examTime,
      notes
    });

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update request.');
      return;
    }

    db.logEdit(
      'Edited Open Pickup Request',
      'Pickup Request',
      `Request #${request.id} updated to ${seats} seats at ${pickupPoint}`,
      'student',
      request.studentName
    );

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 800);
  };

  const handleCancelTrip = () => {
    if (confirm('Are you sure you want to cancel this ride request?')) {
      db.cancelPickupRequest(request.id, 'student');
      db.logEdit(
        'Cancelled Pickup Request',
        'Pickup Request',
        `Student cancelled request #${request.id}`,
        'student',
        request.studentName
      );
      if (onSaved) onSaved();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-teal-700 to-emerald-800 text-white flex items-center justify-between">
          <h3 className="text-base font-black tracking-tight">Edit Ride Request</h3>
          <button onClick={onClose} className="p-1 rounded-full text-teal-100 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Ride request updated! Matching nearby drivers notified.</span>
            </div>
          )}

          {isAccepted ? (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 space-y-2">
              <span className="font-bold text-amber-900 block text-xs">
                ⚠️ Ride Already Accepted by {request.driverName}
              </span>
              <p className="text-[11px] text-amber-800">
                Driver is on the way with vehicle <strong className="font-mono">{request.driverVehiclePlate}</strong>.
                Details cannot be edited once accepted. If you cannot make it, please cancel to free up the driver's seat.
              </p>
              <button
                type="button"
                onClick={handleCancelTrip}
                className="w-full mt-2 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
              >
                Cancel Ride Request
              </button>
            </div>
          ) : (
            <>
              {/* Pickup Point with Nominatim Search */}
              <div>
                <NominatimAddressInput
                  label="Pickup Location (Sheltered public stop)"
                  value={pickupPoint}
                  onChange={(addr) => setPickupPoint(addr.split(',')[0])}
                  placeholder="Search village or junction..."
                />
              </div>

              {/* Seats Requested */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Seats Required</label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setSeats(num)}
                      className={`flex-1 py-2 rounded-xl font-bold border text-xs transition-colors ${
                        seats === num
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {num} {num === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Arrival / Exam Time */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Arrival / Exam Time</label>
                <input
                  type="text"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              {/* Notes for Driver */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pickup Notes for Driver (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Waiting at bus stop shelter near post office"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCancelTrip}
                  className="px-3 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl"
                >
                  Cancel Request
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center space-x-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

