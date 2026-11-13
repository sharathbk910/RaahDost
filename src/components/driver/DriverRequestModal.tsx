import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Navigation, 
  CheckCircle2, 
  X, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Share2, 
  MapPin, 
  User, 
  AlertOctagon,
  Volume2
} from 'lucide-react';
import { PickupRequest, DriverProfile } from '../../types';

interface Props {
  request: PickupRequest;
  driver: DriverProfile;
  onAccept: (req: PickupRequest) => void;
  onDecline: (req: PickupRequest) => void;
  onCompleteStep: (reqId: string, status: 'picked_up' | 'dropped') => void;
  onEmergencySOS: () => void;
}

export const DriverRequestModal: React.FC<Props> = ({
  request,
  driver,
  onAccept,
  onDecline,
  onCompleteStep,
  onEmergencySOS
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isAccepted, setIsAccepted] = useState<boolean>(request.status === 'accepted' || request.status === 'picked_up');
  const [currentStatus, setCurrentStatus] = useState<string>(request.status);
  const audioPlayedRef = useRef(false);

  const isPendingStatus = (s: string) => s === 'requested' || s === 'searching';

  // Play audio chime and trigger mobile vibration on mount
  useEffect(() => {
    if (!audioPlayedRef.current && isPendingStatus(request.status)) {
      audioPlayedRef.current = true;
      playAlertChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate([250, 100, 250, 100, 350]);
        } catch (e) {
          // Vibration not supported or blocked
        }
      }
    }
  }, [request.id, request.status]);

  // 60-Second Countdown Timer
  useEffect(() => {
    if (isAccepted || !isPendingStatus(currentStatus)) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline(request);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAccepted, currentStatus, request, onDecline]);

  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      // Audio playback blocked or unpermitted
    }
  };

  const handleAcceptClick = () => {
    setIsAccepted(true);
    setCurrentStatus('accepted');
    onAccept(request);
  };

  const handleStepAdvance = (status: 'picked_up' | 'dropped') => {
    setCurrentStatus(status);
    onCompleteStep(request.id, status);
  };

  const handleShareRide = () => {
    const shareText = `RaahDost Transit: Passenger ${request.studentName} is onboard vehicle ${driver.vehicleNumberPlate} heading to ${request.destinationName}. Live transit active.`;
    if (navigator.share) {
      navigator.share({
        title: 'RaahDost Passenger Transit Live',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      alert('📋 Passenger transit link copied to clipboard to share with college or parents.');
    }
  };

  const openNavigation = () => {
    const destination = encodeURIComponent(request.pickupLocationName);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}`, '_blank');
  };

  const progressPercentage = (timeLeft / 60) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-modal-title"
      >
        {/* Top Countdown Bar (only when pending) */}
        {!isAccepted && isPendingStatus(currentStatus) && (
          <div className="relative h-2 w-full bg-slate-100">
            <div 
              className={`h-full transition-all duration-1000 ${
                timeLeft < 15 ? 'bg-red-500' : timeLeft < 30 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h3 id="request-modal-title" className="text-sm font-black tracking-tight">
              {isAccepted ? 'Active Passenger Onboard' : 'New Student Pickup Request'}
            </h3>
          </div>

          <div className="flex items-center space-x-2">
            {!isAccepted && (
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-mono font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeLeft}s</span>
              </div>
            )}
            <button
              onClick={() => onDecline(request)}
              className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Student Profile Card */}
          <div className="flex items-start justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center space-x-3.5">
              <img
                src={request.studentAvatar || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80'}
                alt={request.studentName}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-black text-slate-900">{request.studentName}</h4>
                  <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-1.5 py-0.5 rounded">
                    Student
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Seats Requested: <strong className="text-slate-800">{request.seatsRequested || 1} Seat</strong>
                </p>
                {request.studentPhone && (
                  <p className="text-xs text-slate-500 font-medium">
                    Phone: <span className="font-mono text-slate-700">{request.studentPhone}</span>
                  </p>
                )}
              </div>
            </div>

            {request.hasExamToday && (
              <div className="text-right">
                <span className="inline-flex items-center space-x-1 text-[10px] font-black uppercase text-amber-900 bg-amber-200/90 border border-amber-300 px-2 py-0.5 rounded shadow-sm animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-800" />
                  <span>Exam Priority</span>
                </span>
                <span className="block text-[11px] font-bold text-amber-800 mt-1">
                  Exam at {request.examTime || '10:30 AM'}
                </span>
              </div>
            )}
          </div>

          {/* Route & Journey Details */}
          <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 flex flex-col items-center">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm mt-0.5" />
                <span className="w-0.5 h-8 bg-slate-200 my-0.5" />
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
              </div>
              <div className="flex-1 space-y-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Boarding Location (Safe Public Shelter)
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {request.pickupLocationName}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Safe verified shelter • Exact student home coordinates protected for privacy
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Destination Educational Institution
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                    {request.destinationName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          {!isAccepted ? (
            /* Pending State: Accept or Decline */
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => onDecline(request)}
                className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Decline
              </button>

              <button
                type="button"
                onClick={handleAcceptClick}
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Pickup</span>
              </button>
            </div>
          ) : (
            /* Accepted State: Navigation & Trip Progression Lifecycle */
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={openNavigation}
                  className="py-2.5 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Start Navigate</span>
                </button>

                {request.studentPhone ? (
                  <a
                    href={`tel:${request.studentPhone}`}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md flex items-center justify-center space-x-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Student</span>
                  </a>
                ) : (
                  <button
                    disabled
                    className="py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs flex items-center justify-center space-x-1.5"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>No Phone</span>
                  </button>
                )}
              </div>

              {/* Trip Stage Progression */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-900 tracking-wider">
                  Passenger Lifecycle Controls
                </span>

                {currentStatus === 'accepted' && (
                  <button
                    type="button"
                    onClick={() => handleStepAdvance('picked_up')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <span>Confirm "Student Picked Up"</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}

                {currentStatus === 'picked_up' && (
                  <button
                    type="button"
                    onClick={() => handleStepAdvance('dropped')}
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-lg shadow-sm flex items-center justify-center space-x-1.5"
                  >
                    <span>Confirm "Dropped at Institution Gate" ✓</span>
                  </button>
                )}
              </div>

              {/* Safety & Share Controls */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleShareRide}
                  className="flex items-center space-x-1.5 text-xs font-bold text-teal-700 hover:text-teal-800"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Guardian Link</span>
                </button>

                <button
                  type="button"
                  onClick={onEmergencySOS}
                  className="flex items-center space-x-1.5 text-xs font-bold text-red-600 hover:text-red-700"
                >
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Emergency SOS</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
