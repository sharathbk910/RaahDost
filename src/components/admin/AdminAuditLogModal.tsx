import React, { useState, useEffect } from 'react';
import { X, History, User, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { AuditLogEntry } from '../../types';
import { db } from '../../services/dataStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuditLogModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const loadLogs = () => {
      setLogs(db.getAuditLogs());
    };
    loadLogs();
    const unsub = db.subscribe(loadLogs);
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-black tracking-tight">System Audit & Edit History</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List Body */}
        <div className="p-6 overflow-y-auto space-y-3 text-xs flex-1">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-slate-500">
            <span>Recorded Operations ({logs.length})</span>
            <span className="text-[10px] text-slate-400">Strictly Admin Accessible</span>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              No audit records yet. All edits to buses, routes, timings, and requests will be logged here.
            </div>
          ) : (
            logs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                      log.userRole === 'admin'
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : log.userRole === 'driver'
                        ? 'bg-teal-100 text-teal-900 border-teal-300'
                        : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    }`}>
                      {log.userRole}
                    </span>
                    <strong className="text-slate-900 text-xs">{log.action}</strong>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-slate-600 font-medium pl-1">{log.details}</p>

                <div className="text-[10px] text-slate-400 flex items-center space-x-2 pl-1 pt-0.5">
                  <span>Target: <strong>{log.targetEntity}</strong></span>
                  <span>•</span>
                  <span>By: <strong>{log.performedBy}</strong></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
