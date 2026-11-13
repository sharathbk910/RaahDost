import React, { useState, useEffect } from 'react';
import { X, Check, Save, AlertOctagon, ShieldCheck, Route } from 'lucide-react';
import { RoadSegment } from '../../types';
import { db } from '../../services/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const AdminRoadEditModal: React.FC<Props> = ({ isOpen, onClose, onSaved }) => {
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [selectedRoadId, setSelectedRoadId] = useState<string>('road-nh66-mulki-poly-direct');
  const [isBlocked, setIsBlocked] = useState(false);
  const [reason, setReason] = useState('Coastal rain storm surge flooding Gurupura estuary bridge');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const list = db.getRoads();
    setRoads(list);
    const selected = list.find(r => r.id === selectedRoadId) || list[0];
    if (selected) {
      setSelectedRoadId(selected.id);
      setIsBlocked(selected.isBlocked);
      if (selected.blockageReason) setReason(selected.blockageReason);
    }
  }, [isOpen, selectedRoadId]);

  if (!isOpen) return null;

  const handleSelectRoad = (id: string) => {
    setSelectedRoadId(id);
    const found = roads.find(r => r.id === id);
    if (found) {
      setIsBlocked(found.isBlocked);
      setReason(found.blockageReason || 'Flooding & waterlogging');
    }
  };

  const handleToggle = (e: React.FormEvent) => {
    e.preventDefault();
    db.toggleRoadBlocked(selectedRoadId, isBlocked, reason);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      if (onSaved) onSaved();
      onClose();
    }, 800);
  };

  const currentRoad = roads.find(r => r.id === selectedRoadId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-700 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-red-300" />
            <h3 className="text-base font-black tracking-tight">Road Network & Flood Control</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleToggle} className="p-6 overflow-y-auto space-y-4 text-xs">
          {savedSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Road status updated! All Leaflet maps rerouted via inland Dijkstra bypass.</span>
            </div>
          )}

          {/* Road Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Corridor / Bridge</label>
            <select
              value={selectedRoadId}
              onChange={(e) => handleSelectRoad(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
            >
              {roads.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.distanceKm} km, {r.normalTravelMinutes}m) {r.isBlocked ? '⛔ BLOCKED' : '✅ OPEN'}
                </option>
              ))}
            </select>
          </div>

          {/* Block Status Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-black text-slate-900 block text-xs">Hazard Status</span>
                <span className="text-[11px] text-slate-500">
                  {isBlocked ? 'Traffic blocked; Dijkstra detour active' : 'Normal traffic flowing'}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBlocked(false)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    !isBlocked
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Mark OPEN
                </button>
                <button
                  type="button"
                  onClick={() => setIsBlocked(true)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    isBlocked
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'bg-white border border-slate-300 text-slate-700'
                  }`}
                >
                  Mark BLOCKED
                </button>
              </div>
            </div>

            {isBlocked && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Blockage Reason / Flood Details</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Flooded by river overflow, bridge impassable"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-red-900 bg-red-50/50"
                />
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            <strong>Dijkstra Integration:</strong> Marking this road as blocked immediately causes the system to eliminate this edge from the graph and compute the fastest alternative route (via Kateel & Bajpe Airport corridor) across all student and driver portals.
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
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-black shadow-md flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Update Road Network</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

