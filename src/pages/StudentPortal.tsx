import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  Clock, 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Phone, 
  Car, 
  LifeBuoy, 
  Home, 
  Map as MapIcon, 
  HelpCircle, 
  User, 
  Sparkles,
  ArrowRight,
  Send,
  Share2,
  AlertOctagon,
  Volume2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dataStore';
import { Vehicle, DriverProfile, PickupRequest } from '../types';
import { LiveTransitMap } from '../components/map/LiveTransitMap';
import { LanguageToggle, SupportedLanguage, TRANSLATIONS } from '../components/common/LanguageToggle';
import { FirstTimeTourModal } from '../components/common/FirstTimeTourModal';
import { ExamModeView } from '../components/student/ExamModeView';

interface Props {
  navigate?: (route: string) => void;
}

export const StudentPortal: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'help' | 'profile'>('home');
  const [language, setLanguage] = useState<SupportedLanguage>('en');
  const [showTour, setShowTour] = useState(false);
  const [isExamModeActive, setIsExamModeActive] = useState<boolean>(true); // Default focused high-priority exam mode

  // Real-time reactive data from dataStore
  const [buses, setBuses] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverProfile[]>([]);
  const [myPickupRequests, setMyPickupRequests] = useState<PickupRequest[]>([]);
  
  // Student State
  const [hasExamToday, setHasExamToday] = useState<boolean>(user?.hasExamToday !== undefined ? user.hasExamToday : true);
  const [examTime, setExamTime] = useState(user?.examTime || '10:30 AM');
  const [pickupRequestedDriverId, setPickupRequestedDriverId] = useState<string | null>(null);
  const [selectedTrackedBus, setSelectedTrackedBus] = useState<Vehicle | null>(null);

  // Help Issue Picker State
  const [selectedIssue, setSelectedIssue] = useState<string | null>('Bus broke down');
  const [customHelpQuestion, setCustomHelpQuestion] = useState('');
  const [helpResponse, setHelpResponse] = useState<any | null>(null);
  const [guardianAlertSent, setGuardianAlertSent] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  const t = TRANSLATIONS[language];

  // Subscribe to real-time updates from database store
  useEffect(() => {
    const refreshData = () => {
      setBuses(db.getVehicles());
      setAvailableDrivers(db.getAvailableDriversForStudents());
      if (user?.id) {
        setMyPickupRequests(db.getRequestsForStudent(user.id));
      }
    };

    refreshData();
    const unsubscribe = db.subscribe(refreshData);
    return () => unsubscribe();
  }, [user]);

  // Determine student's location & closest bus stop
  const studentVillage = user?.villageName || 'Mulki';
  const studentCollege = user?.institutionName || 'Government Polytechnic College Mangalore (Kadri Hills)';
  const studentCoords = { lat: 13.0906, lng: 74.7925, name: `${studentVillage} Bus Stand` };

  // Check if student's primary bus has a disruption
  const myPrimaryBus = buses.find(b => b.startingVillageId === 'vil-mulki' || b.name.includes('Mulki')) || buses[0];
  const busHasProblem = myPrimaryBus?.availabilityStatus === 'unavailable';

  // Quick Pickup Request action
  const handleRequestPickup = (driver: DriverProfile) => {
    setPickupRequestedDriverId(driver.id);
    const newReq: PickupRequest = {
      id: `req-${Date.now()}`,
      studentId: user?.id || 'demo-student-1',
      studentName: user?.fullName || 'Aarav Sharma',
      studentPhone: user?.phone || '+91 98450 33001',
      pickupLocationName: `${studentVillage} Bus Stand`,
      pickupCoordinates: studentCoords,
      destinationName: studentCollege,
      hasExamToday,
      examTime: hasExamToday ? examTime : undefined,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverVehiclePlate: driver.vehicleNumberPlate,
      driverVehicleType: driver.vehicleType,
      status: 'requested',
      requestedAt: new Date().toISOString(),
      guardianPhone: user?.guardianPhone,
      guardianAlertSent: true,
      notes: hasExamToday ? `Exam at ${examTime}. Need immediate transport.` : 'Regular student commute.'
    };

    db.createPickupRequest(newReq);
    db.adjustDriverSeats(driver.id, -1);

    if (user?.guardianPhone) {
      setGuardianAlertSent(true);
      setTimeout(() => setGuardianAlertSent(false), 5000);
    }
  };

  // Generate AI / Algorithmic Help Response
  const handleGenerateHelp = (issue: string) => {
    setSelectedIssue(issue);
    const freeDriver = availableDrivers.find(d => d.seatsFree > 0);
    const altBus = buses.find(b => b.availableSeats > 5 && b.availabilityStatus !== 'unavailable');

    const options = [];

    // Option 1: Available community driver going to Kadri
    if (freeDriver) {
      options.push({
        type: 'driver',
        title: `Community Relief: Board ${freeDriver.fullName} (${freeDriver.vehicleType})`,
        eta: '7 mins',
        examBuffer: hasExamToday ? 'Arrives 1 hr 15 mins before your exam' : 'On-time arrival',
        reason: `${freeDriver.vehicleType} (${freeDriver.vehicleNumberPlate}) has ${freeDriver.seatsFree} verified seats travelling to ${freeDriver.activeRoute?.destinationLocation || studentCollege}.`,
        actionLabel: 'Request Pickup Now',
        driver: freeDriver
      });
    }

    // Option 2: Alternate inland route bus
    if (altBus) {
      options.push({
        type: 'bus',
        title: `Alternate Route Bus: ${altBus.name}`,
        eta: '18 mins',
        examBuffer: hasExamToday ? 'Arrives 45 mins before your exam' : 'On-time arrival',
        reason: `Reroutes inland via Kinnigoli & Kateel to safely bypass flooded Kuloor bridge.`,
        actionLabel: 'Track Alternative Bus',
        bus: altBus
      });
    }

    // Option 3: Shared auto pool fallback
    options.push({
      type: 'fallback',
      title: 'Shared Auto Pool / Institution Late Pass',
      eta: '12 mins',
      examBuffer: 'Auto dispatched to your boarding arch',
      reason: 'If buses are delayed, local auto dispatch is available and institutional coordinator has been alerted.',
      actionLabel: 'Alert College Coordinator'
    });

    setHelpResponse({
      issue,
      options
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-24 pt-2 px-2 sm:px-4 space-y-4">
      {/* First Time Tour Modal */}
      {showTour && (
        <FirstTimeTourModal role="student" onClose={() => setShowTour(false)} />
      )}

      {/* Top Header Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
            RD
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 leading-tight">
              {t.greeting}, {user?.fullName?.split(' ')[0] || 'Student'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              📍 {studentVillage} ➔ {studentCollege.split('(')[0]}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <LanguageToggle language={language} onToggle={setLanguage} />
          <button
            onClick={() => setShowTour(true)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold"
            title="App Tour"
          >
            ?
          </button>
        </div>
      </div>

      {/* SOS Banner if Triggered */}
      {sosActive && (
        <div className="p-3.5 bg-red-600 text-white rounded-2xl shadow-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-white" />
            <span className="text-xs font-bold">EMERGENCY SOS BROADCAST ACTIVE — College authorities and police alerted.</span>
          </div>
          <button
            onClick={() => setSosActive(false)}
            className="px-2.5 py-1 bg-white text-red-700 text-xs font-bold rounded-lg"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Guardian Notification Toast */}
      {guardianAlertSent && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center space-x-2">
          <Share2 className="w-4 h-4 text-emerald-600" />
          <span>Trip details and driver plate shared with guardian at {user?.guardianPhone}.</span>
        </div>
      )}

      {/* TAB 1: HOME SCREEN */}
      {activeTab === 'home' && (
        isExamModeActive ? (
          <ExamModeView
            user={user}
            language={language}
            onExitExamMode={() => setIsExamModeActive(false)}
            onTrackOnMap={(bus) => {
              if (bus) setSelectedTrackedBus(bus);
              setActiveTab('map');
            }}
          />
        ) : (
          <div className="space-y-4">
            {/* Prominent Exam Mode Activation Card (Requirement A.1) */}
            <div className="bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-emerald-500/15 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-black shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Exam today? Turn on Exam Mode</h4>
                    <p className="text-xs text-slate-600">
                      Switches to high-priority countdown, safe leave-by times, and priority driver matching.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExamModeActive(true)}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md whitespace-nowrap"
                >
                  Turn On Exam Mode
                </button>
              </div>
            </div>
          {/* Automatic Bus Disruption Alert Banner */}
          {busHasProblem && (
            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-red-900 shadow-sm flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase text-red-700 tracking-wide">
                    {t.busProblemAlert}
                  </h4>
                  <p className="text-xs text-red-800 font-medium">
                    Bus #1101 ({studentVillage}) broke down near Pavanje Bridge.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('help');
                  handleGenerateHelp('Bus broke down');
                }}
                className="flex-shrink-0 ml-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Find Solution
              </button>
            </div>
          )}

          {/* Exam Day Priority Switch */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center space-x-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="text-xs font-black text-slate-900 block">{t.examToday}</span>
                <span className="text-[11px] text-amber-900">
                  Prioritizes your seat during disruptions and alerts dispatchers.
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {hasExamToday && (
                <input
                  type="text"
                  value={examTime}
                  onChange={(e) => setExamTime(e.target.value)}
                  className="w-20 px-2 py-1 text-xs font-bold border border-amber-300 rounded-lg text-center bg-white"
                  title="Exam Start Time"
                />
              )}
              <input
                type="checkbox"
                checked={hasExamToday}
                onChange={(e) => setHasExamToday(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                Next Coastal Transit
              </span>
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Scheduled
              </span>
            </div>

            <div className="flex items-baseline space-x-2">
              <h3 className="text-2xl font-black text-slate-900">12 min</h3>
              <span className="text-xs font-bold text-slate-500">estimated wait at Mulki Stop</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">KSRTC City Shuttle #KA-19-F-1103</span>
              <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                8 {t.seatsLeft}
              </span>
            </div>
          </div>

          {/* Big Red "Need help reaching on time?" Button */}
          <button
            onClick={() => {
              setActiveTab('help');
              handleGenerateHelp(hasExamToday ? "I'll miss my exam" : "Bus is full");
            }}
            className="w-full py-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-600/30 flex items-center justify-center space-x-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <LifeBuoy className="w-5 h-5" />
            <span>{t.needHelpBtn}</span>
          </button>

          {/* Section 1: Buses Near Me (5 km radius) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
              <span>{t.busesNearMe}</span>
              <span className="text-[10px] text-slate-400">Live GPS</span>
            </h3>

            {buses.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                {t.noBuses}
              </div>
            ) : (
              buses.slice(0, 4).map((bus) => {
                const isDown = bus.availabilityStatus === 'unavailable';
                return (
                  <div
                    key={bus.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-500 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Bus className={`w-4 h-4 ${isDown ? 'text-red-500' : 'text-emerald-600'}`} />
                        <span className="text-xs font-black text-slate-900">{bus.name.split('(')[0]}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{bus.vehicleCode}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Stop: <strong>{bus.stops?.[0] || 'Bus Stand'}</strong> • Dep: {bus.departureTimes?.[0] || '07:30 AM'}
                      </p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border block ${
                        isDown 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : bus.availableSeats > 10 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isDown ? 'Broken Down' : `${bus.availableSeats} ${t.seatsLeft}`}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedTrackedBus(bus);
                          setActiveTab('map');
                        }}
                        className="text-[11px] font-bold text-emerald-700 hover:underline block ml-auto"
                      >
                        {t.trackBus} ➔
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Section 2: Drivers Available to Your College (From Driver Portal Queue) */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
              <span>{t.driversToCollege}</span>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Live Driver Portal Queue
              </span>
            </h3>

            {availableDrivers.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                {t.noDrivers}
              </div>
            ) : (
              availableDrivers.map((driver) => {
                const requested = pickupRequestedDriverId === driver.id;
                return (
                  <div
                    key={driver.id}
                    className="p-4 bg-white rounded-2xl border border-teal-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-teal-500 transition-all"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={driver.photoUrl}
                        alt={driver.fullName}
                        className="w-11 h-11 rounded-xl object-cover border border-teal-300"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-xs font-black text-slate-900">{driver.fullName}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                            ★ {driver.rating}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          {driver.vehicleType} • <strong className="font-mono text-slate-800">{driver.vehicleNumberPlate}</strong>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Route: {driver.activeRoute?.startLocation} ➔ {driver.activeRoute?.destinationLocation}
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2">
                      <span className="text-[11px] font-black text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {driver.seatsFree} seats free
                      </span>
                      <button
                        onClick={() => handleRequestPickup(driver)}
                        disabled={requested}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                          requested
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-teal-600 hover:bg-teal-700 text-white'
                        }`}
                      >
                        {requested ? 'Pickup Requested ✓' : t.requestPickup}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}

      {/* TAB 2: FULL MAP VIEW */}
      {activeTab === 'map' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Mangalore Rural Transit Radar
            </h3>
            <span className="text-[10px] font-bold text-slate-500">
              {availableDrivers.length} Live Drivers • {buses.length} Buses
            </span>
          </div>

          <LiveTransitMap
            studentLocation={studentCoords}
            buses={buses}
            drivers={availableDrivers}
            heightClass="h-[420px]"
          />

          <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
            <strong className="text-slate-900 block">Map Legend:</strong>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
                <span>You (Student)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span>Available Driver</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span>KSRTC Bus</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span>Flooded Hazard</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HELP & AI RAAHDOST ASSISTANT */}
      {activeTab === 'help' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <h3 className="text-base font-black tracking-tight">RaahDost Assistant</h3>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Tell me your problem. I analyze live bus breakdowns, road floodings, and verified community drivers to give you top-ranked options.
            </p>
          </div>

          {/* Issue Quick Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">What happened?</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Bus is full',
                'Bus broke down',
                'Road blocked',
                "I'll miss my exam"
              ].map((issue) => (
                <button
                  key={issue}
                  type="button"
                  onClick={() => handleGenerateHelp(issue)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                    selectedIssue === issue
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {issue}
                </button>
              ))}
            </div>
          </div>

          {/* AI / Algorithmic Options Card */}
          {helpResponse && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Ranked Options for: "{helpResponse.issue}"
              </h4>

              {helpResponse.options.map((opt: any, idx: number) => (
                <div
                  key={idx}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5 hover:border-emerald-500 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Option {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      ETA: {opt.eta}
                    </span>
                  </div>

                  <h5 className="text-sm font-black text-slate-900">{opt.title}</h5>
                  <p className="text-xs text-slate-600 leading-relaxed">{opt.reason}</p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-semibold text-emerald-800">
                      ⏱ {opt.examBuffer}
                    </span>
                    <button
                      onClick={() => {
                        if (opt.driver) {
                          handleRequestPickup(opt.driver);
                          setActiveTab('home');
                        } else if (opt.bus) {
                          setSelectedTrackedBus(opt.bus);
                          setActiveTab('map');
                        } else {
                          alert('Alert dispatched to institutional transport coordinator.');
                        }
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      {opt.actionLabel}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PROFILE & SAFETY */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">{user?.fullName || 'Student'}</h3>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1 inline-block">
                  Verified Student
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Home Village:</span>
                <span className="font-bold text-slate-900">{studentVillage}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">College:</span>
                <span className="font-bold text-slate-900 text-right">{studentCollege}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Guardian Phone:</span>
                <span className="font-bold text-slate-900">{user?.guardianPhone || '+91 98450 99881'}</span>
              </div>
            </div>

            {/* Emergency SOS Trigger */}
            <div className="pt-2">
              <button
                onClick={() => setSosActive(true)}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-2"
              >
                <AlertOctagon className="w-4 h-4" />
                <span>{t.sosButton}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE-FIRST BOTTOM NAVIGATION BAR (4 TABS) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 shadow-2xl">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'home' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.homeTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'map' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <MapIcon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.mapTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('help')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'help' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.helpTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center py-1 rounded-xl transition-all ${
              activeTab === 'profile' ? 'text-emerald-600 font-black' : 'text-slate-500 hover:text-slate-900 font-semibold'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t.profileTab}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
