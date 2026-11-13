import React, { useState } from 'react';
import { 
  GraduationCap, 
  MapPin, 
  School, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Lock,
  User,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_VILLAGES, DEMO_INSTITUTIONS } from '../data/demoData';
import { db } from '../services/dataStore';

interface Props {
  navigate: (route: string) => void;
}

export const StudentSignupPage: React.FC<Props> = ({ navigate }) => {
  const { registerStudentProfile, signInWithGoogle } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Step 1: Basic Credentials
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');

  // Step 2: Home Village / Area
  const [selectedVillageId, setSelectedVillageId] = useState(DEMO_VILLAGES[0]?.id || 'vil-mulki');
  const [customVillageName, setCustomVillageName] = useState('');
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Step 3: Institution & Timing
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(DEMO_INSTITUTIONS[0]?.id || 'inst-1');
  const [isAddingCustomInst, setIsAddingCustomInst] = useState(false);
  const [customInstitutionName, setCustomInstitutionName] = useState('');
  const [course, setCourse] = useState('Diploma 2nd Year');
  const [classStartTime, setClassStartTime] = useState('08:30 AM');
  const [classEndTime, setClassEndTime] = useState('04:30 PM');
  const [guardianPhone, setGuardianPhone] = useState('');

  // Browser Geolocation for "Use my current location"
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        // Find closest village
        let closest = DEMO_VILLAGES[0];
        let minDist = 9999;
        DEMO_VILLAGES.forEach((v) => {
          if (v.coordinates) {
            const d = Math.hypot(v.coordinates.lat - pos.coords.latitude, v.coordinates.lng - pos.coords.longitude);
            if (d < minDist) {
              minDist = d;
              closest = v;
            }
          }
        });
        setSelectedVillageId(closest.id);
      },
      () => {
        setIsLocating(false);
        // Fallback default
        setSelectedVillageId('vil-mulki');
      },
      { timeout: 8000 }
    );
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !emailOrPhone.trim() || !password) {
      setErrorMsg('Please fill in your name, contact, and password.');
      return;
    }
    setErrorMsg(null);
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStep(3);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    let finalInstName = '';
    let finalInstId = selectedInstitutionId;

    if (isAddingCustomInst && customInstitutionName.trim()) {
      const created = db.addInstitution(customInstitutionName.trim());
      finalInstId = created.id;
      finalInstName = created.name;
    } else {
      const match = DEMO_INSTITUTIONS.find(i => i.id === selectedInstitutionId);
      finalInstName = match?.name || 'Mangalore College';
    }

    const village = DEMO_VILLAGES.find(v => v.id === selectedVillageId);
    const finalVillageName = customVillageName.trim() || village?.name || 'Mulki';

    const { error } = await registerStudentProfile({
      fullName: fullName.trim(),
      email: emailOrPhone.includes('@') ? emailOrPhone.trim() : `${emailOrPhone.replace(/\D/g, '')}@student.raahdost.in`,
      phone: emailOrPhone.includes('@') ? '+91 98450 33001' : emailOrPhone.trim(),
      villageId: selectedVillageId,
      villageName: finalVillageName,
      institutionId: finalInstId,
      institutionName: finalInstName,
      course,
      classTiming: `${classStartTime} - ${classEndTime}`,
      guardianPhone: guardianPhone.trim() || undefined,
      hasExamToday: false
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      navigate('/student');
    }
  };

  const handleGoogleQuickAuth = async () => {
    await signInWithGoogle();
    setStep(2);
  };

  return (
    <div className="max-w-lg mx-auto py-6 sm:py-10 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Registration</h1>
        <p className="text-xs font-semibold text-emerald-600">Your friend on every road.</p>
      </div>

      {/* Progress Bar (3 Short Steps) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <span className={step >= 1 ? 'text-emerald-700 font-black' : ''}>1. Account</span>
          <span className={step >= 2 ? 'text-emerald-700 font-black' : ''}>2. Home Area</span>
          <span className={step >= 3 ? 'text-emerald-700 font-black' : ''}>3. College & Timings</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-600 h-full transition-all duration-300"
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

        {/* STEP 1: Basic Info & Password / Google Sign-in */}
        {step === 1 && (
          <form onSubmit={handleStep1Next} className="space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Step 1: Your Details</span>
            </h3>

            {/* Google Quick Sign-In Option */}
            <button
              type="button"
              onClick={handleGoogleQuickAuth}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white font-bold text-xs text-slate-700 flex items-center justify-center space-x-2.5 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.94H1.27v3.15C3.25 21.36 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.26c-.25-.72-.38-1.49-.38-2.26s.13-1.54.38-2.26V6.59H1.27C.46 8.2.01 10.05.01 12s.45 3.8 1.26 5.41l4.01-3.15z" />
                <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.94 1.19 15.23 0 12 0 7.31 0 3.25 2.64 1.27 6.59l4.01 3.15c.95-2.84 3.6-4.97 6.72-4.97z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold uppercase text-slate-400">or manual info</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Aarav Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number or Email *</label>
              <input
                type="text"
                required
                placeholder="+91 98450 XXXXX or student@polytechnic.ac.in"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <span>Next: Select Home Area</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 2: Home Village / Area + GPS */}
        {step === 2 && (
          <form onSubmit={handleStep2Next} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>Step 2: Home Village / Area</span>
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

            {/* Use My Current Location Button */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">Live GPS Location:</span>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-sm"
                >
                  <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Use my current location'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-700">
                Automatically detects nearest Dakshina Kannada transit pickup stop.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Select Your Village / Taluk *
              </label>
              <select
                value={selectedVillageId}
                onChange={(e) => setSelectedVillageId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                {DEMO_VILLAGES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} (Dakshina Kannada)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Specific Boarding Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Pavanje Temple arch / Bus stand"
                value={customVillageName}
                onChange={(e) => setCustomVillageName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <span>Next: Institution & Timings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* STEP 3: Institution, Class Timings & Guardian */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <School className="w-4 h-4 text-emerald-600" />
                <span>Step 3: Institution & Timing</span>
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

            {/* Institution Searchable / Select */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Educational Institution *</label>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomInst(!isAddingCustomInst)}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  {isAddingCustomInst ? 'Choose from list' : '+ Add my institution'}
                </button>
              </div>

              {isAddingCustomInst ? (
                <input
                  type="text"
                  required
                  placeholder="Enter college / school name in Mangalore area"
                  value={customInstitutionName}
                  onChange={(e) => setCustomInstitutionName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              ) : (
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  {DEMO_INSTITUTIONS.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Class / Course *</label>
              <input
                type="text"
                required
                placeholder="e.g. Diploma Mechanical 2nd Year / B.Sc Physics"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usual Start Time</label>
                <input
                  type="text"
                  value={classStartTime}
                  onChange={(e) => setClassStartTime(e.target.value)}
                  placeholder="08:30 AM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Usual End Time</label>
                <input
                  type="text"
                  value={classEndTime}
                  onChange={(e) => setClassEndTime(e.target.value)}
                  placeholder="04:30 PM"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Parent / Guardian Phone (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  placeholder="+91 98450 XXXXX (receives safety trip alerts)"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Trips taken with community drivers will share live vehicle updates with this number.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center space-x-2 mt-4"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Complete Registration & Go to Student Portal</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
