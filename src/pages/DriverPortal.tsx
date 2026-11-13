import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Bus, 
  MapPin, 
  Power, 
  Plus, 
  Minus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Navigation, 
  Users, 
  Star, 
  AlertCircle,
  Radio,
  Share2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dataStore';
import { DriverProfile, PickupRequest, Vehicle } from '../types';
import { FirstTimeTourModal } from '../components/common/FirstTimeTourModal';
import { DriverRequestModal } from '../components/driver/DriverRequestModal';

interface Props {
  navigate?: (route: string) => void;
}

export const DriverPortal: React.FC<Props> = ({ navigate }) => {
  const { user } = useAuth();
  const [showTour, setShowTour] = useState(false);

  // Active driver profile
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [incomingRequests, setIncomingRequests] = useState<PickupRequest[]>([]);
  const [buses, setBuses] = useState<Vehicle[]>([]);

  // Driver Mode & Controls
  const [isBusDriver, setIsBusDriver] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState('bus-ksrtc-01');
  const [busTripStarted, setBusTripStarted] = useState(false);
  const [busLiveStatus, setBusLiveStatus] = useState<'Running' | 'Delayed' | 'Full' | 'Broken Down'>('Running');

  // Daily Availability State
  const [isAvailable, setIsAvailable] = useState(false);
  const [seatsFree, setSeatsFree] = useState(4);
  const [startPlace, setStartPlace] = useState('Mulki Bus Stand');
  const [destinationPlace, setDestinationPlace] = useState('Government Polytechnic College Mangalore (Kadri Hills)');
  const [departureTime, setDepartureTime] = useState('07:30 AM');
  const [gpsActive, setGpsActive] = useState(false);
  const [acceptedRequest, setAcceptedRequest] = useState<PickupRequest | null>(null);
  const [activeModalRequest, setActiveModalRequest] = useState<PickupRequest | null>(null);
  const [ignoreCount, setIgnoreCount] = useState<number>(0);
  const [pausedUntil, setPausedUntil] = useState<number | null>(null);

  // Subscribe to real-time database store updates
  useEffect(() => {
    const loadState = () => {
      const allDrivers = db.getDrivers();
      // Match active driver by userId or default to first approved driver (Rameshwar Yadav)
      const matched = allDrivers.find(d => d.userId === user?.id || d.id === user?.driverId) || allDrivers[0];
      if (matched) {
        setDriver(matched);
        setIsAvailable(matched.isAvailable);
        setSeatsFree(matched.seatsFree);
        if (matched.activeRoute) {
          setStartPlace(matched.activeRoute.startLocation);
          setDestinationPlace(matched.activeRoute.destinationLocation);
        }
        if (matched.departureTime) {
          setDepartureTime(matched.departureTime);
        }
        setIsBusDriver(matched.driverType === 'bus_driver');
        setIncomingRequests(db.getRequestsForDriver(matched.id));
      }
      setBuses(db.getVehicles());
    };

    loadState();
    const unsubscribe = db.subscribe(loadState);
    return () => unsubscribe();
  }, [user]);

  // Live GPS simulation / Geolocation loop every 5 seconds when available
  useEffect(() => {
    if (!isAvailable || !driver) {
      setGpsActive(false);
      return;
    }

    setGpsActive(true);
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      // Smoothly advance latitude southwards along coastal corridor (Mulki 13.09 -> Mangalore 12.88)
      const currentLat = 13.0906 - (stepCount * 0.003) % 0.20;
      const currentLng = 74.7925 + (stepCount * 0.001) % 0.05;

      db.updateDriverLocation(driver.id, currentLat, currentLng);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAvailable, driver]);

  // Toggle "I'm available today" switch
  const handleToggleAvailability = () => {
    if (!driver) return;
    const nextState = !isAvailable;
    setIsAvailable(nextState);

    db.setDriverAvailability(
      driver.id, 
      nextState, 
      seatsFree, 
      {
        id: `route-${driver.id}`,
        startLocation: startPlace,
        destinationLocation: destinationPlace,
        usualDepartureTime: departureTime,
        operatingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
      },
      departureTime
    );
  };

  // Adjust seats free with + and - buttons
  const handleAdjustSeats = (delta: number) => {
    if (!driver) return;
    db.adjustDriverSeats(driver.id, delta);
    setSeatsFree(prev => Math.max(0, Math.min((driver.totalSeats || 6), prev + delta)));
  };

  // Check for new incoming request to show pop-up modal
  useEffect(() => {
    if (!isAvailable || !driver) return;
    if (pausedUntil && Date.now() < pausedUntil) return;

    if (!activeModalRequest && !acceptedRequest) {
      const pendingReq = incomingRequests.find(r => r.status === 'requested' || r.status === 'searching');
      if (pendingReq) {
        setActiveModalRequest(pendingReq);
      }
    }
  }, [incomingRequests, isAvailable, driver, activeModalRequest, acceptedRequest, pausedUntil]);

  // Accept Pickup Request atomically (transaction-safe)
  const handleAcceptRequest = (req: PickupRequest) => {
    if (!driver) return;
    setIgnoreCount(0);
    const res = db.atomicAcceptPickupRequest(req.id, driver);
    if (!res.success) {
      alert(res.error || 'This ride was already accepted by another driver.');
      setActiveModalRequest(null);
      return;
    }
    const acc = res.request || { ...req, status: 'accepted' };
    setAcceptedRequest(acc);
    setActiveModalRequest(acc);
  };

  // Decline or Cancel Pickup Request
  const handleDeclineRequest = (req: PickupRequest) => {
    const nextIgnore = ignoreCount + 1;
    setIgnoreCount(nextIgnore);
    if (nextIgnore >= 3) {
      setPausedUntil(Date.now() + 10 * 60 * 1000); // 10 minutes anti-spam pause
    }
    db.cancelPickupRequest(req.id, 'driver');
    if (activeModalRequest?.id === req.id) {
      setActiveModalRequest(null);
    }
    if (acceptedRequest?.id === req.id) {
      setAcceptedRequest(null);
    }
  };

  // Mark Picked up / Dropped
  const handleCompleteTripStep = (status: 'picked_up' | 'dropped', reqId?: string) => {
    const targetId = reqId || acceptedRequest?.id || activeModalRequest?.id;
    if (!targetId) return;
    db.updatePickupRequestStatus(targetId, status);
    if (status === 'dropped') {
      setAcceptedRequest(null);
      setActiveModalRequest(null);
      if (driver) {
        db.adjustDriverSeats(driver.id, 1); // restore seat for next passenger
      }
    } else {
      if (acceptedRequest) {
        setAcceptedRequest({ ...acceptedRequest, status });
      }
      if (activeModalRequest) {
        setActiveModalRequest({ ...activeModalRequest, status });
      }
    }
  };

  const handleEmergencySOS = () => {
    alert('🚨 Emergency SOS dispatched! Mangalore District Police & Student Transport Control notified.');
  };

  // Bus Driver Status Controls
  const handleUpdateBusStatus = (status: 'Running' | 'Delayed' | 'Full' | 'Broken Down') => {
    setBusLiveStatus(status);
    db.updateVehicle(selectedBusId, {
      availabilityStatus: status === 'Broken Down' ? 'unavailable' : status === 'Full' ? 'full' : 'available',
      operatorConfirmed: true
    });
  };

  return (
    <div className="max-w-xl mx-auto py-4 px-2 sm:px-4 space-y-5">
      {/* Tour Modal */}
      {showTour && (
        <FirstTimeTourModal role="driver" onClose={() => setShowTour(false)} />
      )}

      {/* Driver Request Pop-Up Modal */}
      {activeModalRequest && driver && (
        <DriverRequestModal
          request={activeModalRequest}
          driver={driver}
          onAccept={handleAcceptRequest}
          onDecline={handleDeclineRequest}
          onCompleteStep={(reqId, status) => handleCompleteTripStep(status, reqId)}
          onEmergencySOS={handleEmergencySOS}
        />
      )}

      {/* Anti-Spam Pause Notification */}
      {pausedUntil && Date.now() < pausedUntil && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs font-semibold text-amber-900 shadow-sm">
          <span>⚠️ 3 requests were ignored. Pop-up alerts paused for 10 min.</span>
          <button
            onClick={() => {
              setPausedUntil(null);
              setIgnoreCount(0);
            }}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold"
          >
            Resume Alerts
          </button>
        </div>
      )}

      {/* Driver Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img
            src={driver?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'}
            alt="Driver"
            className="w-12 h-12 rounded-2xl object-cover border-2 border-teal-500 shadow-md"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-base font-black text-slate-900">{driver?.fullName || 'Driver Partner'}</h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                ★ {driver?.rating || 4.9}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {driver?.vehicleType} • <span className="font-mono font-bold text-slate-700">{driver?.vehicleNumberPlate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
            driver?.approvalStatus === 'approved'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-amber-50 text-amber-800 border-amber-300'
          }`}>
            {driver?.approvalStatus || 'Approved'}
          </span>
          <button
            onClick={() => setShowTour(true)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold"
          >
            ?
          </button>
        </div>
      </div>

      {/* Switch between Community Driver and Bus Driver mode */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300 text-xs font-bold">
        <button
          onClick={() => setIsBusDriver(false)}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            !isBusDriver ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Community Car / Van Driver</span>
        </button>
        <button
          onClick={() => setIsBusDriver(true)}
          className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
            isBusDriver ? 'bg-white text-orange-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bus className="w-4 h-4" />
          <span>KSRTC Bus Driver</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* MODE A: COMMUNITY DRIVER DASHBOARD */}
      {/* ============================================================ */}
      {!isBusDriver && (
        <div className="space-y-4">
          {/* 1. BIG "I'M AVAILABLE TODAY" SWITCH */}
          <div className={`p-6 rounded-3xl border-2 shadow-lg transition-all ${
            isAvailable 
              ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400' 
              : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Daily Driver Availability
                </span>
                <h3 className="text-xl font-black text-slate-900">
                  {isAvailable ? "You are Available Today! 🎉" : "I'm Available Today"}
                </h3>
                <p className="text-xs text-slate-600 max-w-xs">
                  {isAvailable 
                    ? "Your vehicle is live on students' radar. GPS is streaming every 5 seconds."
                    : "Turn ON to offer spare seats to students along your usual route."}
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAvailability}
                className={`p-4 rounded-3xl transition-all transform active:scale-95 shadow-md flex items-center justify-center ${
                  isAvailable 
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-200' 
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                <Power className="w-8 h-8" />
              </button>
            </div>

            {/* GPS Live Indicator */}
            {isAvailable && (
              <div className="mt-4 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-xs font-semibold text-emerald-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Sharing live GPS location with matching students</span>
                </div>
                <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  5s pulse
                </span>
              </div>
            )}
          </div>

          {/* 2. ROUTE & SEATS CONFIGURATION */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Today's Commute Route & Free Seats
            </h4>

            {/* Free Seats Stepper (+ / - Buttons) */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Available Student Seats</span>
                <span className="text-[11px] text-slate-500">
                  Automatically hides from radar when seats reach 0
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => handleAdjustSeats(-1)}
                  disabled={seatsFree <= 0}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 shadow-sm disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <span className={`text-xl font-black min-w-[28px] text-center ${
                  seatsFree === 0 ? 'text-red-600' : 'text-emerald-700'
                }`}>
                  {seatsFree}
                </span>

                <button
                  type="button"
                  onClick={() => handleAdjustSeats(1)}
                  disabled={seatsFree >= (driver?.totalSeats || 6)}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center font-black text-slate-700 shadow-sm disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Route Fields */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Starting Pickup Point</label>
                <input
                  type="text"
                  value={startPlace}
                  onChange={(e) => setStartPlace(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination College / Area</label>
                <input
                  type="text"
                  value={destinationPlace}
                  onChange={(e) => setDestinationPlace(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Departure Time</label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>
            </div>
          </div>

          {/* 3. ACTIVE ACCEPTED TRIP TRACKER */}
          {acceptedRequest && (
            <div className="p-5 bg-teal-50 border-2 border-teal-300 rounded-3xl shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-teal-900 bg-teal-200/80 px-2 py-0.5 rounded">
                  Active Passenger Trip
                </span>
                <span className="text-xs font-bold text-teal-800">
                  Status: <strong>{acceptedRequest.status}</strong>
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-900">{acceptedRequest.studentName}</h4>
                <p className="text-xs text-slate-600">
                  Pickup: <strong>{acceptedRequest.pickupLocationName}</strong>
                </p>
                <p className="text-xs text-slate-600">
                  Drop: <strong>{acceptedRequest.destinationName}</strong>
                </p>
                {acceptedRequest.hasExamToday && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded mt-1 inline-block">
                    ⚡ Semester Exam at {acceptedRequest.examTime || '10:30 AM'}
                  </span>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                {acceptedRequest.status === 'accepted' && (
                  <button
                    onClick={() => handleCompleteTripStep('picked_up')}
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Mark "Picked Up"
                  </button>
                )}

                {acceptedRequest.status === 'picked_up' && (
                  <button
                    onClick={() => handleCompleteTripStep('dropped')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                  >
                    Mark "Dropped at College" ✓
                  </button>
                )}

                <button
                  onClick={() => handleDeclineRequest(acceptedRequest)}
                  className="px-3 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* 4. INCOMING PICKUP REQUESTS IN REAL TIME */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center justify-between">
              <span>Incoming Student Requests ({incomingRequests.length})</span>
              <span className="text-[10px] text-teal-600 font-bold">Real-time</span>
            </h4>

            {incomingRequests.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                No pending pickup requests right now. As soon as students on your route request a seat, they will appear here.
              </div>
            ) : (
              incomingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h5 className="text-sm font-black text-slate-900">{req.studentName}</h5>
                        {req.isBroadcast && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 font-extrabold px-1.5 py-0.5 rounded">
                            BROADCAST
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Boarding at: <strong>{req.pickupLocationName}</strong> ➔ {req.destinationName.split('(')[0]}
                      </p>
                    </div>

                    {req.hasExamToday && (
                      <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 animate-pulse">
                        ⚡ EXAM: {req.examTime || '10:30 AM'}
                      </span>
                    )}
                  </div>

                  {(req.status === 'requested' || req.status === 'searching') ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Pickup ({req.hasExamToday ? 'Exam Priority' : 'Regular'})</span>
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-emerald-700 flex items-center justify-between pt-1">
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Accepted by you ({req.status})</span>
                      </div>
                      <button
                        onClick={() => handleDeclineRequest(req)}
                        className="text-red-500 hover:underline text-[11px]"
                      >
                        Cancel Ride
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODE B: GOVERNMENT BUS DRIVER SCREEN */}
      {/* ============================================================ */}
      {isBusDriver && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              Assigned KSRTC Bus Control
            </h4>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Assigned Bus</label>
              <select
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold bg-white"
              >
                {buses.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.vehicleCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Trip Start Button */}
            <button
              onClick={() => setBusTripStarted(!busTripStarted)}
              className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-md transition-all flex items-center justify-center space-x-2 ${
                busTripStarted 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Radio className={`w-4 h-4 ${busTripStarted ? 'animate-pulse' : ''}`} />
              <span>{busTripStarted ? 'Trip Active — Broadcasting Status' : 'Start Scheduled Bus Trip'}</span>
            </button>

            {/* Bus Live Status Selector */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700">Set Live Bus Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Running', 'Delayed', 'Full', 'Broken Down'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleUpdateBusStatus(status)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all text-left ${
                      busLiveStatus === status
                        ? status === 'Broken Down' 
                          ? 'bg-red-600 text-white border-red-700 shadow-md'
                          : status === 'Full'
                            ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">
                This status immediately updates on students' and the main administrator's live map.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Driver Stats Footer */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-3 gap-2 text-center">
        <div>
          <span className="text-lg font-black text-slate-900 block">{driver?.tripsCompleted || 184}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Trips Completed</span>
        </div>
        <div>
          <span className="text-lg font-black text-emerald-700 block">{driver?.studentsHelpedCount || 412}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Students Helped</span>
        </div>
        <div>
          <span className="text-lg font-black text-amber-600 block">★ {driver?.rating || 4.9}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">Safety Rating</span>
        </div>
      </div>
    </div>
  );
};
