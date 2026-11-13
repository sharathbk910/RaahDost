import React, { useState } from 'react';
import { Bus, Car, Shield, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';

interface Props {
  role: 'student' | 'driver';
  onClose: () => void;
}

export const FirstTimeTourModal: React.FC<Props> = ({ role, onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const studentSlides = [
    {
      title: 'Real-Time Bus Tracking Near You',
      desc: 'See live government and private buses within 5 km of your village or current location with exact available seats and departure ETAs.',
      icon: <Bus className="w-12 h-12 text-emerald-500" />,
      highlight: 'Never wait in the dark when buses are delayed or overcrowded.'
    },
    {
      title: 'Verified Community Drivers Going Your Way',
      desc: 'Local commuters, professors, and van owners share their daily route. If your bus is full, request a free seat in one tap.',
      icon: <Car className="w-12 h-12 text-blue-500" />,
      highlight: 'Every driver is verified by administration for strict safety.'
    },
    {
      title: 'Exam Day Crisis Protection',
      desc: 'Turn ON "I have an exam today". When roadblocks, breakdowns, or floods strike, RaahDost AI automatically re-routes you with top priority.',
      icon: <Sparkles className="w-12 h-12 text-amber-500" />,
      highlight: 'Reach your exam hall on time, guaranteed.'
    }
  ];

  const driverSlides = [
    {
      title: 'Daily "I\'m Available" Switch',
      desc: 'Simply toggle your availability when you start your commute. Pick your route, departure time, and how many seats you can offer.',
      icon: <Car className="w-12 h-12 text-emerald-500" />,
      highlight: 'Help rural students reach schools and colleges without going out of your way.'
    },
    {
      title: 'Real-Time GPS & Automatic Matching',
      desc: 'Students along your route see your vehicle live. When your seats fill up, you are automatically hidden from the queue.',
      icon: <Shield className="w-12 h-12 text-blue-500" />,
      highlight: 'Full control: Accept or decline pickup requests with one tap.'
    },
    {
      title: 'Verified Safety & Recognition',
      desc: 'Earn verified student mobility badges, high safety ratings, and help solve the rural last-mile transit crisis.',
      icon: <CheckCircle2 className="w-12 h-12 text-amber-500" />,
      highlight: 'Direct contact with students and optional guardian notification.'
    }
  ];

  const slides = role === 'student' ? studentSlides : driverSlides;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Slide Indicator */}
        <div className="flex items-center justify-center space-x-2 pt-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? 'w-8 bg-brand-600' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Slide Body */}
        <div className="text-center space-y-4 py-2 min-h-[220px] flex flex-col items-center justify-center">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
            {slides[currentSlide].icon}
          </div>
          <h3 className="text-xl font-black text-slate-900 leading-tight">
            {slides[currentSlide].title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm">
            {slides[currentSlide].desc}
          </p>
          <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-800">
            {slides[currentSlide].highlight}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-2"
          >
            Skip Tour
          </button>

          {currentSlide < slides.length - 1 ? (
            <button
              onClick={() => setCurrentSlide(prev => prev + 1)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-brand-500/20"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20"
            >
              <span>Get Started</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

