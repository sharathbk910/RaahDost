import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  MapPin, 
  Car, 
  Bus, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Phone, 
  Share2, 
  AlertOctagon, 
  X, 
  ArrowRight, 
  Star, 
  Radio, 
  Send,
  Navigation,
  Compass,
  Check
} from 'lucide-react';
import { db } from '../../services/dataStore';
import { DriverProfile, PickupRequest, Vehicle } from '../../types';
import { UserProfile } from '../../context/AuthContext';
import { SupportedLanguage, TRANSLATIONS } from '../common/LanguageToggle';

interface Props {
  user: UserProfile | null;
  language: SupportedLanguage;
  onExitExamMode: () => void;
  onTrackOnMap?: (bus?: Vehicle, driver?: DriverProfile) => void;
}

export const ExamModeView: React.FC<Props> = ({ 
  user, 
  language, 
  onExitExamMode,
  onTrackOnMap 
}) => {
  // Exam Setup state
  const [examTime, setExamTime] = useState(user?.examTime || '10:30 AM');
  const [examCenter, setExamCenter] = useState(user?.institutionName || 'Government Polytechnic College Mangalore (Kadri Hills)');
  const [latestArrivalTime, setLatestArrivalTime] = useState('10:15 AM');
  const [leaveByTime, setLeaveByTime] = useState('08:35 AM');

  // Real-time live data
  const [availableDrivers, setAvailableDrivers] = useState<DriverProfile[]>([]);
  const [buses, setBuses] = useState<Vehicle[]>([]);
  const [activeRequest, setActiveRequest] = useState<PickupRequest | null>(null);

  // Search countdown & widening timer
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [searchRadiusExpanded, setSearchRadiusExpanded] = useState(false);

  // Post-trip rating state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('Arrived 45 mins before exam! Very smooth driving.');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  // Running late AI alert modal
  const [showRunningLateModal, setShowRunningLateModal] = useState(false);
  const [institutionAlertSent, setInstitutionAlertSent] = useState(false);

  const t = TRANSLATIONS[language];
  const studentVillage = user?.villageName || 'Mulki';

  // Real-time subscriber to DB
  useEffect(() => {
    const refresh = () => {
      setAvailableDrivers(db.getAvailableDriversForStudents());
      setBuses(db.getVehicles());

      if (user?.id) {
        const studentRequests = db.getRequestsForStudent(user.id);
        const latest = studentRequests[0];
        if (latest) {
          setActiveRequest(latest);
          if (latest.status === 'reached' || latest.status === 'dropped') {
            setShowRatingModal(true);
          }
        }
      }
    };

    refresh();
    const unsubscribe = db.subscribe(refresh);
    return () => unsubscribe();
  }, [user]);

  // Searching Timer for 3-minute search radius widening fallback
  useEffect(() => {
    let timer: any;
    if (activeRequest?.status === 'searching') {
      timer = setInterval(() => {
        setSearchSeconds(prev => {
          if (prev >= 180 && !searchRadiusExpanded) {
            setSearchRadiusExpanded(true);
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setSearchSeconds(0);
    }
    return () => clearInterval(timer);
  }, [activeRequest?.status, searchRadiusExpanded]);

  // Usual primary bus & breakdown check
  const primaryBus = buses.find(b => b.startingVillageId === 'vil-mulki' || b.name.includes('Mulki')) || buses[0];
  const busIsBroken = primaryBus?.availabilityStatus === 'unavailable';
  const backupBuses = buses.filter(b => b.id !== primaryBus?.id && b.availabilityStatus !== 'unavailable');

  // Broadcast to all nearby drivers
  const handleBroadcastToAll = () => {
    const req = db.broadcastPickupRequest({
      studentId: user?.id || 'demo-student-1',
      studentName: user?.fullName || 'Aarav Sharma',
      studentPhone: user?.phone || '+91 98450 33001',
      pickupLocationName: `${studentVillage} Bus Stand (Pavanje Junction)`,
      destinationName: examCenter,
      hasExamToday: true,
      examTime,
      latestArrivalTime,
      urgency: 'critical',
      guardianPhone: user?.guardianPhone,
      notes: `⚡ EXAM PRIORITY: Exam starts at ${examTime}. Needs pickup immediately.`
    });

    setActiveRequest(req);
    setSearchRadiusExpanded(false);
    setSearchSeconds(0);
  };

  // Direct ride request to specific driver
  const handleRequestDriverDirect = (driver: DriverProfile) => {
    const directReq: PickupRequest = {
      id: `req-direct-${Date.now()}`,
      studentId: user?.id || 'demo-student-1',
      studentName: user?.fullName || 'Aarav Sharma',
      studentPhone: user?.phone || '+91 98450 33001',
      pickupLocationName: `${studentVillage} Bus Stand`,
      destinationName: examCenter,
      hasExamToday: true,
      examTime,
      latestArrivalTime,
      urgency: 'critical',
      isBroadcast: false,
      driverId: driver.id,
      driverName: driver.fullName,
      driverPhone: driver.phone,
      driverPhotoUrl: driver.photoUrl,
      driverRating: driver.rating,
      driverVehiclePlate: driver.vehicleNumberPlate,
      driverVehicleType: driver.vehicleType,
      status: 'searching',
      requestedAt: new Date().toISOString(),
      guardianAlertSent: !!user?.guardianPhone,
      guardianPhone: user?.guardianPhone,
      notes: `Direct ride request for ${examTime} examination.`
    };

    db.createPickupRequest(directReq);
    setActiveRequest(directReq);
  };

  // Student cancel request
  const handleCancelTrip = () => {
    if (activeRequest) {
      db.cancelPickupRequest(activeRequest.id, 'student');
      setActiveRequest(null);
    }
  };

  // Rate driver
  const handleSubmitRating = () => {
    if (activeRequest) {
      db.rateDriver(activeRequest.id, ratingStars, ratingFeedback);
      setRatingSubmitted(true);
      setTimeout(() => {
        setShowRatingModal(false);
        onExitExamMode();
      }, 1500);
    }
  };

  // "I Reached" button
  const handleMarkReached = () => {
    if (activeRequest) {
      db.updatePickupRequestStatus(activeRequest.id, 'reached');
    }
    setShowRatingModal(true);
  };

  // Send message to institution coordinator
  const handleSendInstitutionDelayMessage = () => {
    setInstitutionAlertSent(true);
    setTimeout(() => {
      setShowRunningLateModal(false);
      setInstitutionAlertSent(false);
    }, 2500);
  };

  // Active Progress step computation
  const getProgressStep = () => {
    if (!activeRequest || activeRequest.status === 'searching') return 1;
    if (activeRequest.status === 'accepted' || activeRequest.status === 'on_the_way') return 2;
    if (activeRequest.status === 'picked_up') return 3;
    if (activeRequest.status === 'reached' || activeRequest.status === 'dropped') return 4;
    return 1;
  };

  const progressStep = getProgressStep();

  return (
    <div className="space-y-4 animate-fade-in pb-12">
      {/* 1. HIGH-PRIORITY EXAM HEADER & COUNTDOWN */}
      <div className="bg-gradient-to-br from-amber-950 via-slate-900 to-emerald-950 rounded-3xl p-5 sm:p-6 text-white border-2 border-amber-400/70 shadow-2xl space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
              HIGH PRIORITY • EXAM MODE ON
            </span>
          </div>

          <button
            onClick={onExitExamMode}
            className="text-xs font-bold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl border border-white/10 flex items-center space-x-1"
          >
            <span>Exit Exam Mode</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Big Countdown & Leave-by Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <span className="text-[11px] font-bold text-amber-200/90 uppercase tracking-wider block">
              Exam Hall Countdown
            </span>
            <div className="flex items-baseline space-x-2">
              <h2 className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight">1h 25m</h2>
              <span className="text-xs text-slate-300 font-semibold">until {examTime} exam</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              📍 <strong>{examCenter.split('(')[0]}</strong>
            </p>
          </div>

          <div className="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex flex-col justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
              Optimal Departure Window
            </span>
            <div className="text-lg font-black text-white">
              Leave by <span className="text-emerald-400">{leaveByTime}</span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              Guarantees arrival by {latestArrivalTime} (35-min safety buffer)
            </p>
          </div>
        </div>

        {/* 3-Step High-Priority Progress Strip */}
        <div className="pt-2 border-t border-slate-700/80">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <div className={`p-2 rounded-xl border transition-all ${
              progressStep >= 1 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              <span>1. Plan Ready</span>
            </div>
            <div className={`p-2 rounded-xl border transition-all ${
              progressStep >= 2 ? 'bg-amber-500/20 text-amber-300 border-amber-400' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              <span>2. On The Way</span>
            </div>
            <div className={`p-2 rounded-xl border transition-all ${
              progressStep >= 4 ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}>
              <span>3. Reached Hall</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[11px] font-semibold text-emerald-300">
            ✨ Good luck on your examination! RaahDost prioritizes your journey.
          </p>
        </div>
      </div>

      {/* 2. REAL-TIME TRIP STATUS CARD (If student has requested a ride) */}
      {activeRequest && (
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-400 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${
                activeRequest.status === 'searching' 
                  ? 'bg-amber-500 animate-ping' 
                  : 'bg-emerald-500'
              }`} />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                {activeRequest.status === 'searching' ? 'Searching for Nearest Driver...' : 'Driver Confirmed'}
              </span>
            </div>

            <span className="text-xs font-bold text-slate-500">
              Trip #{activeRequest.id.slice(-5)}
            </span>
          </div>

          {/* If Searching */}
          {activeRequest.status === 'searching' && (
            <div className="text-center py-4 space-y-3 bg-amber-50 rounded-2xl border border-amber-200 p-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-200/80 flex items-center justify-center text-amber-800 animate-pulse">
                <Radio className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-900">
                Broadcasting to Verified Drivers within 1 km...
              </h4>
              <p className="text-xs text-slate-600">
                Elapsed: <strong>{searchSeconds}s</strong> • Instant lock to first driver who accepts.
              </p>
              {searchRadiusExpanded && (
                <div className="p-2 bg-amber-100 rounded-xl text-[11px] font-bold text-amber-900">
                  Search radius automatically widened to 5 km. Notifying backup community pool.
                </div>
              )}
              <button
                onClick={handleCancelTrip}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50"
              >
                Cancel Search
              </button>
            </div>
          )}

          {/* If Driver Accepted / On The Way */}
          {activeRequest.status !== 'searching' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                <img
                  src={activeRequest.driverPhotoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'}
                  alt={activeRequest.driverName}
                  className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-1.5">
                    <strong className="text-xs font-black text-slate-900">{activeRequest.driverName}</strong>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 rounded">
                      ★ {activeRequest.driverRating || 4.9}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {activeRequest.driverVehicleType} • <strong className="font-mono text-emerald-800">{activeRequest.driverVehiclePlate || 'KA-19-ME-402'}</strong>
                  </p>
                  <p className="text-[11px] text-emerald-700 font-bold">
                    ETA: ~{activeRequest.driverEtaMinutes || 6} mins to {activeRequest.pickupLocationName}
                  </p>
                </div>
              </div>

              {/* Trip Controls */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={handleMarkReached}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>I Reached Exam Hall!</span>
                </button>

                <button
                  onClick={handleCancelTrip}
                  className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. BEST WAY TO REACH ON TIME (AI RECOMMENDATION) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Top Recommended Route
          </span>
          <span className="text-xs font-bold text-slate-500">Live AI Routing</span>
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-900">
            {busIsBroken 
              ? 'Community Relief Van (Safe Flood Bypass)' 
              : 'Direct KSRTC Coastal Express'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {busIsBroken 
              ? 'Kuloor Bridge is flooded. Board Rameshwar Yadav’s Bolero Van via the inland Kinnigoli-Kateel-Bajpe detour.' 
              : 'Take regular Bus #1101 from Mulki Stand. Arrives 45 minutes before your exam.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs font-semibold">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Boarding Stop</span>
            <span className="text-slate-900">{studentVillage} Bus Stand</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Exam Buffer</span>
            <span className="text-emerald-700 font-bold">+35 minutes spare</span>
          </div>
        </div>

        {/* Running Late Button */}
        <div className="pt-1 flex items-center justify-between">
          <button
            onClick={() => setShowRunningLateModal(true)}
            className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Running late? Find fastest option</span>
          </button>

          {!activeRequest && (
            <button
              onClick={handleBroadcastToAll}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center space-x-1.5"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Ask All Nearby Drivers</span>
            </button>
          )}
        </div>
      </div>

      {/* 4. LIVE STATUS OF USUAL BUS & BACKUPS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
          Scheduled Buses & Backup Corridor Status
        </h4>

        {/* Primary Bus Card */}
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
          busIsBroken ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
        }`}>
          <div className="space-y-0.5">
            <span className="font-bold text-slate-900 block">{primaryBus?.name || 'Bus #1101'}</span>
            <span className="text-[11px] text-slate-500">Scheduled: 07:30 AM Mulki ➔ Kadri</span>
          </div>
          <span className={`px-2 py-0.5 rounded font-black text-[10px] border ${
            busIsBroken 
              ? 'bg-red-100 text-red-800 border-red-300' 
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}>
            {busIsBroken ? 'Broken Down' : `${primaryBus?.availableSeats || 10} seats`}
          </span>
        </div>

        {/* Backups */}
        <div className="space-y-1.5">
          {backupBuses.slice(0, 2).map((b) => (
            <div key={b.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-700 font-medium">{b.name.split('(')[0]}</span>
              <span className="text-emerald-700 font-bold text-[10px]">
                {b.availableSeats} seats • Leaves 08:15 AM
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 5. NEARBY DRIVERS GOING YOUR WAY */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
            Verified Community Drivers Heading to {examCenter.split('(')[0]}
          </h4>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {availableDrivers.length} Available
          </span>
        </div>

        {availableDrivers.length === 0 ? (
          <div className="p-4 text-center bg-slate-50 rounded-2xl text-xs text-slate-500">
            No community drivers active right now. Please use the backup KSRTC bus or broadcast to the queue.
          </div>
        ) : (
          availableDrivers.map((driver) => (
            <div
              key={driver.id}
              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center space-x-3">
                <img
                  src={driver.photoUrl}
                  alt={driver.fullName}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-300"
                />
                <div>
                  <div className="flex items-center space-x-1.5">
                    <strong className="text-xs font-bold text-slate-900">{driver.fullName}</strong>
                    <span className="text-[10px] text-amber-800 font-bold">★ {driver.rating}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {driver.vehicleType} • {driver.vehicleNumberPlate}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                  {driver.seatsFree} seats free
                </span>
                <button
                  onClick={() => handleRequestDriverDirect(driver)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Request a Ride
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 6. RUNNING LATE MODAL */}
      {showRunningLateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h4 className="text-sm font-black text-slate-900">Running Late Emergency</h4>
              </div>
              <button
                onClick={() => setShowRunningLateModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-900 space-y-1">
              <strong className="block font-bold">Fastest Option:</strong>
              <p>Direct Shared Auto from Pavanje Arch straight to Kadri Exam Hall (ETA: 22 mins).</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600">
                Would you like RaahDost to notify the examination superintendent at <strong>{examCenter.split('(')[0]}</strong> that you are delayed due to road floodings?
              </p>
              {institutionAlertSent && (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Late Arrival Notice dispatched to Examination Cell!</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSendInstitutionDelayMessage}
                disabled={institutionAlertSent}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Send Alert to College
              </button>
              <button
                onClick={() => setShowRunningLateModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. POST-TRIP RATING MODAL */}
      {showRatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">You Reached on Time! 🎉</h3>
            <p className="text-xs text-slate-500">
              Trip completed with <strong>{activeRequest?.driverName || 'Rameshwar Yadav'}</strong>. How was your ride?
            </p>

            {/* Stars */}
            <div className="flex justify-center space-x-2 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingStars(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= ratingStars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>

            <input
              type="text"
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="Leave a safety review..."
              className="w-full px-3 py-2 border rounded-xl text-xs text-center"
            />

            {ratingSubmitted ? (
              <div className="p-2 bg-emerald-50 rounded-xl text-xs font-bold text-emerald-800">
                Thank you! Rating saved to verified driver record.
              </div>
            ) : (
              <button
                onClick={handleSubmitRating}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md"
              >
                Submit Rating & Finish
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
