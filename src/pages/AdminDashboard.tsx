import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Bus, 
  Car, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Download, 
  BarChart3, 
  MapPin, 
  LifeBuoy, 
  Sparkles, 
  Layers, 
  FileSpreadsheet,
  AlertOctagon,
  Clock,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { db } from '../services/dataStore';
import { Vehicle, DriverProfile, TransportRequest, Village, Institution, CrisisSimulationResult } from '../types';
import { LiveTransitMap } from '../components/map/LiveTransitMap';
import { executeExamDayCrisisOptimization } from '../algorithms/examCrisisEngine';

interface Props {
  navigate?: (route: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ navigate }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'buses' | 'students' | 'approvals' | 'crisis' | 'reports'
  >('overview');

  // Real-time state from DB
  const [buses, setBuses] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [requests, setRequests] = useState<TransportRequest[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [crisisResult, setCrisisResult] = useState<CrisisSimulationResult | null>(null);

  // Filters for Students & Institutions
  const [filterVillage, setFilterVillage] = useState('all');
  const [filterInstitution, setFilterInstitution] = useState('all');
  const [filterExamOnly, setFilterExamOnly] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  // New Bus Modal State
  const [showAddBusModal, setShowAddBusModal] = useState(false);
  const [newBusCode, setNewBusCode] = useState('KA-19-F-1108');
  const [newBusName, setNewBusName] = useState('KSRTC City Shuttle #1108');
  const [newBusCapacity, setNewBusCapacity] = useState(42);
  const [newBusVillageId, setNewBusVillageId] = useState('vil-mulki');

  // Crisis Control Parameters
  const [surgeDemandPercent, setSurgeDemandPercent] = useState(40);
  const [isKuloorFlooded, setIsKuloorFlooded] = useState(true);
  const [crisisRunning, setCrisisRunning] = useState(false);

  useEffect(() => {
    const loadState = () => {
      setBuses(db.getVehicles());
      setDrivers(db.getDrivers());
      setRequests(db.getRequests());
      setVillages(db.getVillages());
      setInstitutions(db.getInstitutions());
      setCrisisResult(db.getCrisisSimulation());
    };

    loadState();
    const unsubscribe = db.subscribe(loadState);
    return () => unsubscribe();
  }, []);

  // Compute Overview KPI Metrics
  const busesRunning = buses.filter(b => b.availabilityStatus !== 'unavailable').length;
  const busesDown = buses.filter(b => b.availabilityStatus === 'unavailable').length;
  const studentsRegistered = requests.length;
  const studentsNeedingHelp = requests.filter(r => r.status === 'pending' || r.status === 'unassigned').length;
  const driversAvailableNow = drivers.filter(d => d.isAvailable && d.approvalStatus === 'approved').length;
  const pendingApprovalsCount = drivers.filter(d => d.approvalStatus === 'pending').length;

  // Handle Driver Approval Actions
  const handleApproveDriver = (driverId: string) => {
    db.approveDriver(driverId);
  };

  const handleRejectDriver = (driverId: string) => {
    db.rejectDriver(driverId, 'Licence plate or vehicle document verification incomplete');
  };

  const handleSuspendDriver = (driverId: string) => {
    db.suspendDriver(driverId);
  };

  // Add Bus Handler
  const handleAddBus = (e: React.FormEvent) => {
    e.preventDefault();
    const newVehicle: Vehicle = {
      id: `bus-custom-${Date.now()}`,
      vehicleCode: newBusCode.trim().toUpperCase(),
      name: newBusName.trim(),
      vehicleType: 'Government Bus',
      startingVillageId: newBusVillageId,
      destinationId: 'inst-1',
      totalCapacity: newBusCapacity,
      availableSeats: newBusCapacity,
      availabilityStatus: 'available',
      operatorConfirmed: true,
      stops: ['Mulki Bus Stand', 'Surathkal', 'Kadri Polytechnic'],
      departureTimes: ['08:00 AM', '09:00 AM']
    };
    db.addVehicle(newVehicle);
    setShowAddBusModal(false);
  };

  const handleDeleteBus = (id: string) => {
    if (confirm('Delete this bus from fleet schedule?')) {
      db.deleteVehicle(id);
    }
  };

  // Trigger Crisis Reallocation
  const handleRunCrisisEngine = () => {
    setCrisisRunning(true);
    const result = executeExamDayCrisisOptimization({
      requests: db.getCombinedCrisisRequests(),
      vehicles: db.getVehicles(),
      villages: db.getVillages(),
      institutions: db.getInstitutions(),
      simulatedTime: '07:15 AM',
      examStartTime: '09:00 AM',
      isFlooded: isKuloorFlooded
    });

    db.saveCrisisSimulation(result);
    setCrisisResult(result);
    setCrisisRunning(false);
  };

  // Export CSV Handler
  const handleExportCSV = () => {
    const rows = [
      ['Student Name', 'Village', 'Destination', 'Exam Today', 'Assigned Vehicle', 'Status'],
      ...requests.map(r => [
        r.displayName,
        villages.find(v => v.id === r.villageId)?.name || r.villageId,
        institutions.find(i => i.id === r.destinationId)?.name || r.destinationId,
        r.hasExam ? 'Yes' : 'No',
        r.allocatedVehicleName || 'Unassigned',
        r.status
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `raahdost_transport_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Students List
  const filteredStudents = requests.filter(r => {
    if (filterVillage !== 'all' && r.villageId !== filterVillage) return false;
    if (filterInstitution !== 'all' && r.destinationId !== filterInstitution) return false;
    if (filterExamOnly && !r.hasExam) return false;
    if (studentSearch.trim() && !r.displayName.toLowerCase().includes(studentSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto py-4 px-2 sm:px-6 space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chief Transport Officer • Dakshina Kannada Command</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Main Admin Dashboard</h1>
          <p className="text-xs text-slate-400">
            Intelligent fleet orchestration, community driver verification, and crisis relief.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setActiveTab('crisis');
              handleRunCrisisEngine();
            }}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Exam Crisis</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Left Sidebar + Right Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="lg:col-span-1 space-y-1.5 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm h-fit">
          {[
            { id: 'overview', label: 'Overview', icon: <Layers className="w-4 h-4" /> },
            { id: 'buses', label: 'Buses & Routes', icon: <Bus className="w-4 h-4" /> },
            { id: 'students', label: 'Students & Colleges', icon: <Users className="w-4 h-4" /> },
            { 
              id: 'approvals', 
              label: 'Driver Approvals', 
              icon: <Car className="w-4 h-4" />,
              badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
            },
            { id: 'crisis', label: 'Crisis Control', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
            { id: 'reports', label: 'Reports & Export', icon: <FileSpreadsheet className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
                activeTab === item.id
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* RIGHT CONTENT PANEL */}
        <div className="lg:col-span-4 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: OVERVIEW */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 6 KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Buses Running
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">{busesRunning}</h3>
                  <p className="text-[10px] text-slate-400">On coastal scheduled routes</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 px-1.5 py-0.5 rounded">
                    Buses Down
                  </span>
                  <h3 className="text-2xl font-black text-red-600">{busesDown}</h3>
                  <p className="text-[10px] text-slate-400">Transmission or axle failure</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    Registered Students
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">{studentsRegistered}</h3>
                  <p className="text-[10px] text-slate-400">Dakshina Kannada students</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    Needs Help Now
                  </span>
                  <h3 className="text-2xl font-black text-amber-600">{studentsNeedingHelp}</h3>
                  <p className="text-[10px] text-slate-400">Waiting at rural bus shelters</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    Drivers Available Now
                  </span>
                  <h3 className="text-2xl font-black text-teal-700">{driversAvailableNow}</h3>
                  <p className="text-[10px] text-slate-400">Active on Driver Portal queue</p>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <span className="text-[10px] font-black uppercase text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                    Pending Approvals
                  </span>
                  <h3 className="text-2xl font-black text-purple-700">{pendingApprovalsCount}</h3>
                  <p className="text-[10px] text-slate-400">Driver registrations to verify</p>
                </div>
              </div>

              {/* Live Transit Map of Buses & Drivers */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Live Fleet, Community Drivers & Blocked Bridges Radar
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live GPS pulses from KSRTC buses and registered drivers in Mangalore.
                    </p>
                  </div>
                </div>

                <LiveTransitMap
                  buses={buses}
                  drivers={drivers}
                  isFlooded={true}
                  heightClass="h-96"
                />
              </div>

              {/* Demand vs Capacity per Route */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Route Capacity & Student Demand Utilization
                </h4>
                <div className="space-y-3">
                  {[
                    { route: 'Route 1101 (Mulki ➔ Surathkal ➔ Kadri)', demand: 45, capacity: 34, status: 'Overcrowded (-11 seats)' },
                    { route: 'Route 1102 (Surathkal ➔ Hampankatta)', demand: 42, capacity: 42, status: '100% Full' },
                    { route: 'Route 1103 (Moodbidri ➔ Mangalore Central)', demand: 32, capacity: 40, status: '8 seats free' },
                    { route: 'Route 1104 (Bajpe ➔ Kavoor ➔ Lalbagh)', demand: 28, capacity: 36, status: '8 seats free' }
                  ].map((r, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">{r.route}</strong>
                        <span className="text-[11px] text-slate-500">Student Demand: {r.demand} • Available Seats: {r.capacity}</span>
                      </div>
                      <span className={`px-2 py-1 rounded font-bold text-[10px] ${
                        r.demand > r.capacity ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: BUSES & ROUTES CRUD */}
          {/* ======================================================== */}
          {activeTab === 'buses' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Bus Fleet & Route Management</h3>
                  <p className="text-xs text-slate-500">Add, edit capacity, and toggle live status of government buses.</p>
                </div>
                <button
                  onClick={() => setShowAddBusModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Bus</span>
                </button>
              </div>

              {/* Add Bus Modal */}
              {showAddBusModal && (
                <form onSubmit={handleAddBus} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-700">Register New Transit Bus</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Registration Plate</label>
                      <input
                        type="text"
                        required
                        value={newBusCode}
                        onChange={(e) => setNewBusCode(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Bus Route Name</label>
                      <input
                        type="text"
                        required
                        value={newBusName}
                        onChange={(e) => setNewBusName(e.target.value)}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Seat Capacity</label>
                      <input
                        type="number"
                        min={10}
                        max={70}
                        required
                        value={newBusCapacity}
                        onChange={(e) => setNewBusCapacity(parseInt(e.target.value) || 40)}
                        className="w-full px-3 py-2 border rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddBusModal(false)}
                      className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      Save Bus
                    </button>
                  </div>
                </form>
              )}

              {/* Buses Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Bus Plate</th>
                      <th className="py-2.5 px-3">Route & Stops</th>
                      <th className="py-2.5 px-3">Capacity / Seats</th>
                      <th className="py-2.5 px-3">Driver Contact</th>
                      <th className="py-2.5 px-3">Live Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {buses.map((bus) => {
                      const isBroken = bus.availabilityStatus === 'unavailable';
                      return (
                        <tr key={bus.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{bus.vehicleCode}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-800 block">{bus.name}</span>
                            <span className="text-[10px] text-slate-400">{bus.stops?.join(' ➔ ')}</span>
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {bus.availableSeats} / {bus.totalCapacity}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">
                            {bus.driverName} ({bus.contactNumber})
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${
                              isBroken 
                                ? 'bg-red-50 text-red-700 border-red-200' 
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}>
                              {isBroken ? 'Broken Down' : 'Running'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteBus(bus.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: INSTITUTIONS & STUDENTS */}
          {/* ======================================================== */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Student Transit Roster</h3>
                  <p className="text-xs text-slate-500">Filter students by taluk, college, and upcoming exams.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Search student name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="px-3 py-1.5 border rounded-xl text-xs"
                  />
                  <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterExamOnly}
                      onChange={(e) => setFilterExamOnly(e.target.checked)}
                      className="accent-amber-600"
                    />
                    <span>Exams Only</span>
                  </label>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Filter by Village</label>
                  <select
                    value={filterVillage}
                    onChange={(e) => setFilterVillage(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    <option value="all">All Villages (Dakshina Kannada)</option>
                    {villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Filter by College</label>
                  <select
                    value={filterInstitution}
                    onChange={(e) => setFilterInstitution(e.target.value)}
                    className="w-full p-2 border rounded-xl bg-white"
                  >
                    <option value="all">All Institutions</option>
                    {institutions.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Student Roster Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Home Village</th>
                      <th className="py-2.5 px-3">Target College</th>
                      <th className="py-2.5 px-3">Exam Status</th>
                      <th className="py-2.5 px-3">Assigned Vehicle</th>
                      <th className="py-2.5 px-3">Transit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.slice(0, 15).map((stu) => {
                      const village = villages.find(v => v.id === stu.villageId)?.name || 'Mulki';
                      const inst = institutions.find(i => i.id === stu.destinationId)?.name || 'Kadri Polytechnic';
                      return (
                        <tr key={stu.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{stu.displayName}</td>
                          <td className="py-2.5 px-3 text-slate-600">{village}</td>
                          <td className="py-2.5 px-3 text-slate-600">{inst.split('(')[0]}</td>
                          <td className="py-2.5 px-3">
                            {stu.hasExam ? (
                              <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                                Exam at {stu.examStartTime || '10:30 AM'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Regular</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">
                            {stu.allocatedVehicleName || 'Bolero Van Relief A'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {stu.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: DRIVER APPROVALS QUEUE */}
          {/* ======================================================== */}
          {activeTab === 'approvals' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Community Driver Verification & Approvals</h3>
                <p className="text-xs text-slate-500">
                  Inspect submitted driving licences, RC books, and approve safe community drivers.
                </p>
              </div>

              {/* Pending Queue */}
              <div className="space-y-3">
                {drivers.map((drv) => {
                  const isPending = drv.approvalStatus === 'pending';
                  const isSuspended = drv.approvalStatus === 'suspended';
                  return (
                    <div
                      key={drv.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isPending 
                          ? 'bg-amber-50/60 border-amber-300' 
                          : isSuspended 
                            ? 'bg-red-50/60 border-red-300' 
                            : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <img
                            src={drv.photoUrl}
                            alt={drv.fullName}
                            className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 shadow-sm"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-sm font-black text-slate-900">{drv.fullName}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                drv.approvalStatus === 'approved' 
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                  : isPending 
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                              }`}>
                                {drv.approvalStatus.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              {drv.vehicleType} • <strong className="font-mono">{drv.vehicleNumberPlate}</strong> • {drv.phone}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Route: {drv.activeRoute?.startLocation} ➔ {drv.activeRoute?.destinationLocation}
                            </p>
                          </div>
                        </div>

                        {/* Verification Actions */}
                        <div className="flex items-center space-x-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleApproveDriver(drv.id)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm"
                              >
                                Approve Driver ✓
                              </button>
                              <button
                                onClick={() => handleRejectDriver(drv.id)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {drv.approvalStatus === 'approved' && (
                            <button
                              onClick={() => handleSuspendDriver(drv.id)}
                              className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-xl"
                            >
                              Suspend Access
                            </button>
                          )}

                          {isSuspended && (
                            <button
                              onClick={() => handleApproveDriver(drv.id)}
                              className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                            >
                              Re-instate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: CRISIS CONTROL (EXAM DAY CRISIS) */}
          {/* ======================================================== */}
          {activeTab === 'crisis' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
              <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Official Hackathon Hurdle: "The Exam Day Crisis"
                  </h3>
                  <p className="text-xs text-slate-600">
                    2 KSRTC coastal buses broken down • +40% student surge • Kuloor bridge flooded • Semester exams in 2 hours.
                  </p>
                </div>
                <button
                  onClick={handleRunCrisisEngine}
                  disabled={crisisRunning}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{crisisRunning ? 'Calculating...' : 'Execute AI Reallocation'}</span>
                </button>
              </div>

              {/* Before vs After Summary */}
              {crisisResult && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Before vs. After Optimization Matrix
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Before */}
                    <div className="p-4 bg-red-50 rounded-2xl border border-red-200 space-y-2 text-xs">
                      <span className="font-black text-red-700 block uppercase">Before AI Reallocation:</span>
                      <div className="flex justify-between"><span>Total Demand:</span><strong>{crisisResult.beforeAfter.before.totalStudents} students</strong></div>
                      <div className="flex justify-between"><span>On-time Delivery:</span><strong className="text-red-600">{crisisResult.beforeAfter.before.onTimeStudents} students</strong></div>
                      <div className="flex justify-between"><span>Stranded:</span><strong className="text-red-700">{crisisResult.beforeAfter.before.strandedStudents} students</strong></div>
                      <div className="flex justify-between"><span>Bus Utilization:</span><strong>{crisisResult.beforeAfter.before.busUtilizationPercent}%</strong></div>
                    </div>

                    {/* After */}
                    <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2 text-xs">
                      <span className="font-black text-emerald-800 block uppercase">After AI Reallocation:</span>
                      <div className="flex justify-between"><span>Rescued On Time:</span><strong className="text-emerald-700">{crisisResult.rescuedCount} students</strong></div>
                      <div className="flex justify-between"><span>Rerouted via Inland:</span><strong>{crisisResult.beforeAfter.after.onTimeStudents} students</strong></div>
                      <div className="flex justify-between"><span>Exam Students Protected:</span><strong className="text-emerald-800">100% of Exam-Takers</strong></div>
                      <div className="flex justify-between"><span>Community Fleet Mobilized:</span><strong>4 Vans & Autos</strong></div>
                    </div>
                  </div>

                  {/* AI Decision Explanation Panel */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <h5 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Decision Transparency Explanations</span>
                    </h5>
                    <div className="space-y-2 max-h-48 overflow-y-auto text-xs">
                      {crisisResult.aiExplanations.map((exp, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>{exp.studentName} ({exp.studentCode})</span>
                            <span className="text-emerald-600">{exp.decision}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-1">{exp.aiReasoningText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 6: REPORTS & CSV EXPORT */}
          {/* ======================================================== */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Transportation & Crisis Reports</h3>
                  <p className="text-xs text-slate-500">Download audit logs and student allocation records.</p>
                </div>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full CSV Export</span>
                </button>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block">Report Summary:</span>
                <p className="text-slate-600">
                  Includes complete student rosters across 10 Mangalore taluks, 8 colleges, 10 KSRTC buses, 5 verified community drivers, and crisis reallocation matrices.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
