import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  School, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Bus,
  Search,
  Sparkles
} from 'lucide-react';
import { db } from '../services/dataStore';
import { TransportRequest } from '../types';

export const StudentPortal: React.FC = () => {
  const villages = db.getVillages();
  const institutions = db.getInstitutions();
  const requests = db.getRequests();

  // Student Form
  const [studentName, setStudentName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [villageId, setVillageId] = useState(villages[0]?.id || '');
  const [destinationId, setDestinationId] = useState(institutions[0]?.id || '');
  const [passengerCount, setPassengerCount] = useState(1);
  const [submittedRequest, setSubmittedRequest] = useState<TransportRequest | null>(null);

  // Search status
  const [searchCode, setSearchCode] = useState('');
  const [foundRequest, setFoundRequest] = useState<TransportRequest | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !studentCode.trim()) return;

    const newReq: TransportRequest = {
      id: `req-${Date.now()}`,
      studentId: `stu-${Date.now()}`,
      studentCode: studentCode.trim().toUpperCase(),
      displayName: studentName.trim(),
      villageId,
      destinationId,
      passengerCount: Math.max(1, passengerCount),
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    db.addRequest(newReq);
    setSubmittedRequest(newReq);
    setStudentName('');
    setStudentCode('');
    setPassengerCount(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase();
    if (!query) return;

    const allRequests = db.getRequests();
    const match = allRequests.find(r => r.studentCode.toUpperCase() === query || r.displayName.toLowerCase().includes(query.toLowerCase()));
    setFoundRequest(match || null);
    setSearchPerformed(true);
  };

  const villageMap = new Map(villages.map(v => [v.id, v.name]));
  const instMap = new Map(institutions.map(i => [i.id, i.name]));

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Student Mobility Portal
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Submit rural transportation requests, verify institutional boarding status, and view allocated rescue vehicles.
        </p>
      </div>

      {/* Quick Lookup Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Search className="w-4 h-4 text-brand-600" />
          <span>Check My Transportation Status</span>
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Student ID (e.g. RD-2026-001) or Name"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl"
          >
            Track Status
          </button>
        </form>

        {searchPerformed && (
          foundRequest ? (
            <div className={`p-4 rounded-xl border text-sm space-y-2 ${
              foundRequest.status === 'confirmed' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : foundRequest.status === 'proposed'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : foundRequest.status === 'unassigned'
                    ? 'bg-red-50 border-red-200 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-black text-base">{foundRequest.displayName} ({foundRequest.studentCode})</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase bg-white/80 border">
                  Status: {foundRequest.status}
                </span>
              </div>
              <p className="text-xs">
                Route: <strong>{villageMap.get(foundRequest.villageId)}</strong> ➔ <strong>{instMap.get(foundRequest.destinationId)}</strong>
              </p>
              {foundRequest.allocatedVehicleName && (
                <div className="p-3 bg-white rounded-lg border border-current/20 text-xs font-semibold">
                  🚌 Assigned Alternative Vehicle: <span className="font-black text-sm">{foundRequest.allocatedVehicleName}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-center text-xs">
              No matching student request found for "{searchCode}".
            </div>
          )
        )}
      </div>

      {/* Submission Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">Submit New Transportation Request</h3>
          <p className="text-xs text-slate-500">Need emergency transportation due to bus cancellation or remote stop?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Student ID / Roll No *</label>
              <input
                type="text"
                required
                placeholder="e.g. RD-2026-099"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Village / Area *</label>
              <select
                value={villageId}
                onChange={(e) => setVillageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {institutions.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Passenger Count (Group/Individual)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={passengerCount}
              onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
              className="w-full sm:w-36 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-sm shadow-md transition-colors"
          >
            Submit Travel Request
          </button>
        </form>

        {submittedRequest && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Request Successfully Registered!</span>
            </div>
            <p className="text-xs">
              Request ID: <span className="font-mono">{submittedRequest.id}</span> | Status: <strong>{submittedRequest.status}</strong>
            </p>
            <p className="text-xs text-emerald-700">
              Your request is now visible on the Institutional Dashboard and included in the Route Rescue coordination engine.
            </p>
          </div>
        )}
      </div>

      {/* Demonstration Students Quick Lookup */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Try Searching Active Demo Students:
        </h4>
        <div className="flex flex-wrap gap-2">
          {['RD-2026-001 (Aarav Sharma)', 'RD-2026-012 (Priyanka Pal)', 'RD-2026-025 (Gaurav Mishra)', 'RD-2026-030 (Anita Rathore)'].map(s => {
            const code = s.split(' ')[0];
            return (
              <button
                key={code}
                onClick={() => {
                  setSearchCode(code);
                  const match = db.getRequests().find(r => r.studentCode === code);
                  setFoundRequest(match || null);
                  setSearchPerformed(true);
                }}
                className="text-xs px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-500 text-slate-700 font-mono"
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
