import React, { useState } from 'react';
import { X, Check, Save, AlertTriangle, Clock, School, Power } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/dataStore';
import { DEMO_INSTITUTIONS } from '../../data/demoData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  examTime: string;
  examCenter: string;
  latestArrival: string;
  isExamModeActive: boolean;
  onSaveExamMode: (data: { examTime: string; examCenter: string; latestArrival: string; isActive: boolean }) => void;
}

export const ExamModeEditModal: React.FC<Props> = ({
  isOpen,
  onClose,
  examTime,
  examCenter,
  latestArrival,
  isExamModeActive,
  onSaveExamMode
}) => {
  const { user, updateProfile } = useAuth();

  const [time, setTime] = useState(examTime || '10:30 AM');
  const [center, setCenter] = useState(examCenter || 'Government Polytechnic College Mangalore (Kadri Hills)');
  const [arrival, setArrival] = useState(latestArrival || '10:15 AM');
  const [isActive, setIsActive] = useState(isExamModeActive);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Persist to central single source of truth in dataStore
    db.saveExamModeSettings({
      examTime: time,
      examCenter: center,
      latestArrival: arrival,
      isActive
    });

    onSaveExamMode({
      examTime: time,
      examCenter: center,
      latestArrival: arrival,
      isActive
    });

    // Update user profile hasExamToday state
    updateProfile({
      hasExamToday: isActive,
      examTime: time
    });

    db.logEdit(
      isActive ? 'Updated Exam Mode Details' : 'Turned Off Exam Mode',
      'Student Exam Mode',
      `Exam: ${time} at ${center} (Status: ${isActive ? 'ACTIVE' : 'INACTIVE'})`,
      'student',
      user?.fullName || 'Aarav Sharma'
    );

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-200" />
            <h3 className="text-base font-black tracking-tight">Edit Exam Mode Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-amber-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Exam Mode preferences updated! Recalculating route buffer...</span>
            </div>
          )}

          {/* Exam Mode Toggle Switch */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 block text-xs">Exam Mode Status</span>
              <span className="text-[11px] text-slate-500">
                {isActive ? 'High priority queuing active' : 'Regular commute mode'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors flex items-center space-x-1.5 ${
                isActive
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isActive ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Exam Start Time */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Semester Exam Start Time</label>
            <input
              type="text"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="10:30 AM"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Latest Arrival Time */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Latest Permitted Hall Entry Time</label>
            <input
              type="text"
              required
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              placeholder="10:15 AM (15 min buffer)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Examination Centre */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Official Examination Centre</label>
            <select
              value={center}
              onChange={(e) => setCenter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              {DEMO_INSTITUTIONS.map((inst) => (
                <option key={inst.id} value={inst.name}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black shadow-md flex items-center space-x-1.5 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save & Update</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

