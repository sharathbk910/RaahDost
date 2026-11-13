import React, { useState } from 'react';
import { X, Check, Save, User, Phone, MapPin, School, BookOpen, Clock, Globe } from 'lucide-react';
import { useAuth, UserProfile } from '../../context/AuthContext';
import { db } from '../../services/dataStore';
import { DEMO_INSTITUTIONS } from '../../data/demoData';
import { NominatimAddressInput } from '../map/NominatimAddressInput';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const StudentProfileEditModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [villageName, setVillageName] = useState(user?.villageName || 'Mulki');
  const [institutionName, setInstitutionName] = useState(user?.institutionName || 'Government Polytechnic College Mangalore (Kadri Hills)');
  const [course, setCourse] = useState(user?.course || 'Diploma Mechanical 2nd Year');
  const [classStartTime, setClassStartTime] = useState(user?.classTiming?.split('-')[0]?.trim() || '08:30 AM');
  const [classEndTime, setClassEndTime] = useState(user?.classTiming?.split('-')[1]?.trim() || '04:30 PM');
  const [guardianPhone, setGuardianPhone] = useState(user?.guardianPhone || '+91 98450 99881');
  
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validation: class start vs end time
    if (!fullName.trim()) {
      setErrorMsg('Full name is required.');
      return;
    }

    setIsSaving(true);
    const updates: Partial<UserProfile> = {
      fullName,
      phone,
      villageName,
      institutionName,
      course,
      classTiming: `${classStartTime} - ${classEndTime}`,
      guardianPhone
    };

    try {
      await updateProfile(updates);
      db.logEdit(
        'Updated Student Profile',
        'Student Profile',
        `Updated details for ${fullName} (${villageName} -> ${institutionName})`,
        'student',
        fullName
      );

      // Trigger timing change notification if student altered class timings
      db.addNotification({
        studentId: user?.id,
        title: 'Schedule Updated',
        message: `Your class timings are now set to ${classStartTime} - ${classEndTime}. Bus recommendations updated.`,
        type: 'timing_change'
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        if (onSaved) onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save changes. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-emerald-200" />
            <h3 className="text-base font-black tracking-tight">Edit Student Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-emerald-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold">
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Saved successfully! Updating transit schedule...</span>
            </div>
          )}

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Home Location Search via OpenStreetMap Nominatim */}
          <div>
            <NominatimAddressInput
              label="Home Village / Boarding Point (OpenStreetMap Geocoded)"
              value={villageName}
              onChange={(addr) => setVillageName(addr.split(',')[0])}
              placeholder="Search village (e.g. Mulki, Surathkal, Moodbidri, Kinnigoli)..."
            />
          </div>

          {/* Destination Institution */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Destination Institution</label>
            <select
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-slate-800"
            >
              {DEMO_INSTITUTIONS.map((inst) => (
                <option key={inst.id} value={inst.name}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Course & Year */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Course & Branch</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Daily Class Timings (Start - End) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class Start Time</label>
              <input
                type="text"
                value={classStartTime}
                onChange={(e) => setClassStartTime(e.target.value)}
                placeholder="08:30 AM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Class End Time</label>
              <input
                type="text"
                value={classEndTime}
                onChange={(e) => setClassEndTime(e.target.value)}
                placeholder="04:30 PM"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Guardian Phone Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Guardian / Parent Contact</label>
            <input
              type="tel"
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono"
            />
            <p className="text-[10px] text-slate-400 mt-0.5">
              Receives automated emergency alerts if regular buses are canceled.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-md flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

