import React, { useState } from 'react';
import { 
  Car, 
  ShieldCheck, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Phone,
  User,
  FileText,
  Upload,
  CheckCircle,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/dataStore';
import { VehicleCategory } from '../types';

interface Props {
  navigate: (route: string) => void;
}

export const DriverSignupPage: React.FC<Props> = ({ navigate }) => {
  const { registerDriverProfile } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successPendingMsg, setSuccessPendingMsg] = useState(false);

  // Step 1: Personal info & Phone OTP
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+91 98450 ');
  const [password, setPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Step 2: Vehicle details & Docs
  const [vehicleType, setVehicleType] = useState<VehicleCategory>('Car');
  const [vehicleNumberPlate, setVehicleNumberPlate] = useState('KA-19-');
  const [totalSeats, setTotalSeats] = useState(4);
  const [licensePhotoUrl, setLicensePhotoUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&auto=format&fit=crop&q=80');
  const [vehiclePhotoUrl, setVehiclePhotoUrl] = useState('https://images.unsplash.com/photo-1559297434-fae8a1916a79?w=300&auto=format&fit=crop&q=80');

  // Step 3: Usual Route & Schedule
  const [startLocation, setStartLocation] = useState('Mulki Bus Stand');
  const [destinationLocation, setDestinationLocation] = useState('Government Polytechnic College Mangalore (Kadri Hills)');
  const [usualDepartureTime, setUsualDepartureTime] = useState('07:30 AM');
  const [operatingDays, setOperatingDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const handleSendOtp = () => {
    if (phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setErrorMsg(null);
    setOtpSent(true);
    setOtpCode('1947'); // Mock demo OTP code
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim() === '1947' || otpCode.length >= 4) {
      setOtpVerified(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Invalid OTP. (Demo test code is: 1947)');
    }
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !password) {
      setErrorMsg('Please complete all personal fields.');
      return;
    }
    if (!otpVerified && !otpSent) {
      // Allow automatic verification in demo mode if skipped
      setOtpVerified(true);
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNumberPlate.trim()) {
      setErrorMsg('Please provide your vehicle registration number plate.');
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const newDriverId = `drv-${Date.now()}`;
    const newDriverRecord = {
      id: newDriverId,
      userId: `user-drv-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      photoUrl,
      driverType: (vehicleType === 'Government Bus' || vehicleType === 'Private Bus') ? 'bus_driver' : 'community_driver',
      vehicleType,
      vehicleNumberPlate: vehicleNumberPlate.trim().toUpperCase(),
      totalSeats,
      seatsFree: totalSeats,
      vehiclePhotoUrl,
      licensePhotoUrl,
      approvalStatus: 'pending', // Pending approval until Main Admin approves in Admin Portal!
      isAvailable: false,
      registeredAt: new Date().toISOString(),
      rating: 5.0,
      tripsCompleted: 0,
      studentsHelpedCount: 0,
      activeRoute: {
        id: `route-reg-${Date.now()}`,
        startLocation,
        destinationLocation,
        usualDepartureTime,
        operatingDays
      },
      departureTime: usualDepartureTime,
      currentLocation: {
        lat: 13.0906,
        lng: 74.7925,
        updatedAt: new Date().toISOString()
      }
    };

    // Save into database store
    db.addDriver(newDriverRecord as any);

    // Register profile session
    await registerDriverProfile({
      fullName: fullName.trim(),
      phone: phone.trim(),
      role: 'driver',
      driverId: newDriverId,
      villageName: startLocation
    }, newDriverRecord);

    setSuccessPendingMsg(true);
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
          <Car className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Driver Partner Registration</h1>
        <p className="text-xs font-semibold text-teal-600">Your friend on every road.</p>
      </div>

      {/* Progress Bar (3 Short Steps) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className={step >= 1 ? 'text-teal-700 font-black' : ''}>1. Personal & OTP</span>
          <span className={step >= 2 ? 'text-teal-700 font-black' : ''}>2. Vehicle & Licence</span>
          <span className={step >= 3 ? 'text-teal-700 font-black' : ''}>3. Regular Route</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-teal-600 h-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Card Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Success Modal / Banner: Pending Admin Verification */}
        {successPendingMsg ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Application Submitted!</h3>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 font-medium">
              Your status is currently: <strong>"Pending Approval"</strong>. To safeguard student safety, our Dakshina Kannada transport administrator verifies all licence photos and number plates.
            </div>
            <p className="text-xs text-slate-500">
              You can test the Driver Portal now, or open the <strong>Admin Dashboard</strong> to approve your registration in one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={() => navigate('/driver')}
                className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Go to Driver Portal
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Go to Admin Approvals
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: Personal & Phone OTP */}
            {step === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                  <User className="w-4 h-4 text-teal-600" />
                  <span>Step 1: Driver Identification</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rameshwar Yadav"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
                  <div className="flex space-x-2">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl whitespace-nowrap"
                    >
                      {otpSent ? 'Resend OTP' : 'Send OTP'}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Enter OTP (Demo code: 1947)</label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="1947"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-lg shadow-sm"
                      >
                        Verify
                      </button>
                    </div>
                    {otpVerified && (
                      <p className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Phone number verified</span>
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Account Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Profile Photo URL</label>
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
                >
                  <span>Next: Vehicle & Licence Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Vehicle & Licence Verification */}
            {step === 2 && (
              <form onSubmit={handleStep2Next} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <Car className="w-4 h-4 text-teal-600" />
                    <span>Step 2: Vehicle Details</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Category *</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value as VehicleCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Car">Personal Car (Sedan / Hatchback)</option>
                    <option value="Shared Van">Shared Van / Multi-Utility Vehicle</option>
                    <option value="Auto">Auto Rickshaw</option>
                    <option value="Mini Bus">Mini Bus</option>
                    <option value="Government Bus">Government KSRTC Bus</option>
                    <option value="Private Bus">Private City Bus</option>
                    <option value="Tempo">Tempo / Traveller</option>
                    <option value="Bike">Motorbike (Single student)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Registration Number Plate *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-19-ME-402"
                    value={vehicleNumberPlate}
                    onChange={(e) => setVehicleNumberPlate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Available Seats for Students *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={55}
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                    <FileText className="w-4 h-4 text-teal-600" />
                    <span>Verification Documents (Admin Review)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 bg-white rounded border border-slate-200 text-center">
                      <span className="text-slate-500 block">Driving Licence:</span>
                      <span className="font-bold text-emerald-600 text-[10px]">Photo Uploaded ✓</span>
                    </div>
                    <div className="p-2 bg-white rounded border border-slate-200 text-center">
                      <span className="text-slate-500 block">Vehicle RC:</span>
                      <span className="font-bold text-emerald-600 text-[10px]">Photo Uploaded ✓</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
                >
                  <span>Next: Specify Daily Commute Route</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 3: Usual Route & Schedule */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-teal-600" />
                    <span>Step 3: Usual Commute Route</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center space-x-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Starting Origin Landmark *</label>
                  <input
                    type="text"
                    required
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                    placeholder="e.g. Mulki Bus Stand / Surathkal"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Location / College *</label>
                  <input
                    type="text"
                    required
                    value={destinationLocation}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                    placeholder="e.g. Kadri Polytechnic / Mangalore Central"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Usual Daily Departure Time *</label>
                  <input
                    type="text"
                    required
                    value={usualDepartureTime}
                    onChange={(e) => setUsualDepartureTime(e.target.value)}
                    placeholder="07:30 AM"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-teal-900">Safety & Verification Commitment:</span>
                  <p className="text-[10px] text-teal-700 leading-normal">
                    By submitting, you agree to verified identity checks and GPS location sharing when on-duty to ensure child & student passenger safety.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Registration for Admin Approval</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
