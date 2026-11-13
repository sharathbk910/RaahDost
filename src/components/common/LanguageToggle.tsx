import React from 'react';
import { Globe } from 'lucide-react';

export type SupportedLanguage = 'en' | 'kn';

interface Props {
  language: SupportedLanguage;
  onToggle: (lang: SupportedLanguage) => void;
}

export const LanguageToggle: React.FC<Props> = ({ language, onToggle }) => {
  return (
    <div className="inline-flex items-center p-1 bg-slate-200/80 rounded-xl border border-slate-300 shadow-inner">
      <button
        type="button"
        onClick={() => onToggle('en')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
          language === 'en'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span>English</span>
      </button>
      <button
        type="button"
        onClick={() => onToggle('kn')}
        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1 ${
          language === 'kn'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        <span>ಕನ್ನಡ (Kannada)</span>
      </button>
    </div>
  );
};

// Helpful translation dictionary for student mobility terms
export const TRANSLATIONS = {
  en: {
    portalName: 'Student Mobility Portal',
    greeting: 'Namaste',
    tagline: 'Your friend on every road',
    nextBusAlert: 'Your next bus leaves in',
    seatsLeft: 'seats left',
    busesNearMe: 'Buses near me (5 km radius)',
    driversToCollege: 'Drivers available to your college',
    requestPickup: 'Request pickup',
    needHelpBtn: 'Need help reaching on time?',
    examToday: 'I have an exam today',
    examTime: 'Exam Time',
    busProblemAlert: 'Your bus has a problem. Want help?',
    trackBus: 'Track',
    homeTab: 'Home',
    mapTab: 'Map',
    helpTab: 'Help',
    profileTab: 'Profile',
    sosButton: 'Emergency SOS',
    reportProblem: 'Report a problem',
    noDrivers: 'No drivers available on your route right now',
    noBuses: 'No buses detected within 5 km right now',
  },
  kn: {
    portalName: 'ವಿದ್ಯಾರ್ಥಿ ಸಾರಿಗೆ ಪೋರ್ಟಲ್',
    greeting: 'ನಮಸ್ಕಾರ',
    tagline: 'ಪ್ರತಿಯೊಂದು ರಸ್ತೆಯಲ್ಲೂ ನಿಮ್ಮ ಮಿತ್ರ',
    nextBusAlert: 'ನಿಮ್ಮ ಮುಂದಿನ ಬಸ್ ಹೊರಡಲು ಸಮಯ:',
    seatsLeft: 'ಸೀಟುಗಳು ಲಭ್ಯವಿವೆ',
    busesNearMe: 'ನನ್ನ ಹತ್ತಿರದ ಬಸ್‌ಗಳು (೫ ಕಿ.ಮೀ)',
    driversToCollege: 'ನಿಮ್ಮ ಕಾಲೇಜಿಗೆ ಲಭ್ಯವಿರುವ ಚಾಲಕರು',
    requestPickup: 'ಪಿಕಪ್ ವಿನಂತಿಸಿ',
    needHelpBtn: 'ಸಮಯಕ್ಕೆ ತಲುಪಲು ಸಹಾಯ ಬೇಕೇ?',
    examToday: 'ನನಗೆ ಇಂದು ಪರೀಕ್ಷೆ ಇದೆ',
    examTime: 'ಪರೀಕ್ಷೆಯ ಸಮಯ',
    busProblemAlert: 'ನಿಮ್ಮ ಬಸ್‌ನಲ್ಲಿ ತೊಂದರೆ ಉಂಟಾಗಿದೆ. ಸಹಾಯ ಬೇಕೇ?',
    trackBus: 'ಟ್ರಾಕ್ ಮಾಡಿ',
    homeTab: 'ಮುಖಪುಟ',
    mapTab: 'ನಕ್ಷೆ',
    helpTab: 'ಸಹಾಯ',
    profileTab: 'ಪ್ರೊಫೈಲ್',
    sosButton: 'ತುರ್ತು SOS',
    reportProblem: 'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    noDrivers: 'ಈ ಮಾರ್ಗದಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಚಾಲಕರು ಲಭ್ಯವಿಲ್ಲ',
    noBuses: '೫ ಕಿ.ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಬಸ್ ಲಭ್ಯವಿಲ್ಲ',
  }
};
