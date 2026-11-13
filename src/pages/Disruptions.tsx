import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  LifeBuoy, 
  Clock, 
  MapPin, 
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { db } from '../services/dataStore';
import { Disruption, DisruptionType } from '../types';

interface Props {
  navigate: (route: string) => void;
}

export const Disruptions: React.FC<Props> = ({ navigate }) => {
  const [disruptions, setDisruptions] = useState<Disruption[]>(db.getDisruptions());
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [affectedRoute, setAffectedRoute] = useState('');
  const [disruptionType, setDisruptionType] = useState<DisruptionType>('breakdown');
  const [description, setDescription] = useState('');
  const [affectedCount, setAffectedCount] = useState(30);

  // Natural Language AI helper input
  const [nlReport, setNlReport] = useState('');

  const refreshList = () => setDisruptions(db.getDisruptions());

  const handleCreateDisruption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!affectedRoute.trim()) return;

    const newDisruption: Disruption = {
      id: `disrupt-${Date.now()}`,
      affectedRoute: affectedRoute.trim(),
      disruptionType,
      description: description.trim() || 'Emergency route disruption reported.',
      affectedStudentCount: Math.max(1, affectedCount),
      status: 'active',
      timestamp: new Date().toISOString(),
      startingVillageId: 'vil-1',
      destinationId: 'inst-1'
    };

    db.addDisruption(newDisruption);
    refreshList();
    setShowForm(false);
    setAffectedRoute('');
    setDescription('');
  };

  // Optional AI Assistant simulation / rule-based parser
  const handleParseNlReport = () => {
    if (!nlReport.trim()) return;
    const text = nlReport.toLowerCase();

    let detectedType: DisruptionType = 'breakdown';
    if (text.includes('closure') || text.includes('blocked') || text.includes('flood')) {
      detectedType = 'route_closure';
    } else if (text.includes('crowd') || text.includes('full') || text.includes('overflow')) {
      detectedType = 'overcrowding';
    } else if (text.includes('late') || text.includes('delay')) {
      detectedType = 'delay';
    }

    // Try finding number
    const matchNumber = nlReport.match(/\d+/);
    const detectedCount = matchNumber ? parseInt(matchNumber[0]) : 25;

    setAffectedRoute('Route R-18 (Kishanpur Cross ➔ District Higher Secondary)');
    setDisruptionType(detectedType);
    setAffectedCount(detectedCount);
    setDescription(nlReport);
    setShowForm(true);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Emergency Disruption Manager
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Log rural bus breakdowns, severe road blockades, and overcrowding to mobilize immediate Route Rescue coordination.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel' : 'Report Emergency'}</span>
        </button>
      </div>

      {/* AI NL Disruption Intake Box */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md border border-slate-700 space-y-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Natural-Language Disruption Intake Assistant
          </h3>
        </div>
        <p className="text-xs text-slate-300">
          Paste operator radio chatter or SMS update to auto-fill emergency incident details:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Bus #42 broke down near Kishanpur canal. 25 students waiting for polytechnic."
            value={nlReport}
            onChange={(e) => setNlReport(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-950/80 border border-slate-600 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            onClick={handleParseNlReport}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center space-x-1"
          >
            <span>Auto Extract</span>
          </button>
        </div>
      </div>

      {/* Manual Disruption Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-lg font-bold text-slate-900">Log Transportation Emergency</h3>
            <p className="text-xs text-slate-500">Provide accurate route details and affected headcount for vehicle matching.</p>
          </div>

          <form onSubmit={handleCreateDisruption} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Affected Route / Corridor *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Route R-14 (Rampur Village ➔ Govt Polytechnic)"
                  value={affectedRoute}
                  onChange={(e) => setAffectedRoute(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Disruption Type *</label>
                <select
                  value={disruptionType}
                  onChange={(e) => setDisruptionType(e.target.value as DisruptionType)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="breakdown">Mechanical Breakdown</option>
                  <option value="route_closure">Route Closure / Blockade</option>
                  <option value="delay">Severe Delay (&gt;45m)</option>
                  <option value="overcrowding">Acute Overcrowding</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">Incident Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Describe vehicle failure location and immediate student needs"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Affected Headcount *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Broadcast Disruption
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disruption Cards */}
      <div className="space-y-4">
        {disruptions.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-red-100 text-red-800 border border-red-200">
                  {d.disruptionType.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {new Date(d.timestamp).toLocaleString()}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900">{d.affectedRoute}</h3>
              <p className="text-sm text-slate-600 max-w-3xl">{d.description}</p>
              <div className="flex items-center space-x-4 pt-1 text-xs">
                <span className="font-bold text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-100">
                  ⚠️ {d.affectedStudentCount} Students Affected
                </span>
                <span className="text-slate-500">Status: <strong className="uppercase">{d.status}</strong></span>
              </div>
            </div>

            <button
              onClick={() => navigate('/rescue')}
              className="flex-shrink-0 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center space-x-2"
            >
              <LifeBuoy className="w-4 h-4" />
              <span>Launch Route Rescue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
