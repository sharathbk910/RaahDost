import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  HelpCircle, 
  Bus, 
  AlertTriangle, 
  MapPin, 
  Clock,
  Compass,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Globe
} from 'lucide-react';
import { askGeminiAgent, PortalPersona } from '../../services/geminiAgentService';
import { db } from '../../services/dataStore';
import { useAuth } from '../../context/AuthContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const StudentGuideChatModal: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en-IN' | 'kn-IN' | 'hi-IN'>('en-IN');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Namaste! 🙏 I'm **RaahDost Assistant**, your travel buddy (\"Your friend on every road\"). Tell me your village, your college and your exam time, and I'll find the best bus for you!\n\nಕನ್ನಡ: ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ರಾಹ್ದೋಸ್ತ್. ನಿಮ್ಮ ಊರು ಮತ್ತು ಪರೀಕ್ಷೆಯ ಸಮಯ ಹೇಳಿ, ನಾನು ಸೂಕ್ತ ಬಸ್ಸು ಮಾಹಿತಿ ನೀಡುತ್ತೇನೆ.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const crisisState = db.getCrisisSimulation();
  const isCrisisActive = Boolean(crisisState?.isActive);

  // Determine Persona
  const currentPersona: PortalPersona = user?.role === 'admin' 
    ? 'admin' 
    : user?.role === 'driver' || user?.role === 'operator'
    ? 'driver' 
    : 'student';

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Web Speech API: Voice-to-Text Recognition
  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Speech Recognition is not supported by your browser. Please type your message.');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = language;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Speech Recognition init error:', err);
      setIsListening(false);
    }
  };

  // Web Speech API: Text-to-Speech Output
  const speakMessage = (text: string, msgId: string) => {
    if (!window.speechSynthesis) return;

    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown formatting characters for clean speech
    const cleanText = text.replace(/[*#_`]/g, '').replace(/https?:\/\/\S+/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const reply = await askGeminiAgent(text, currentPersona, messages);
      const assistantMsg: ChatMessage = {
        id: `msg-resp-${Date.now()}`,
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  const quickPrompts = [
    { label: "Find my bus", prompt: "I live in Mulki and I have an exam at 10:30 at the college in Mangalore. Which bus should I take?" },
    { label: "Exam today", prompt: "I have a semester board exam today in Mangalore. Which bus will get me there on time?" },
    { label: "Bus broke down", prompt: "My regular bus broke down, what should I do now?" },
    { label: "Road status", prompt: "Is the road to Moodbidri open or blocked by flood?" },
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-4 py-3.5 rounded-full shadow-2xl font-black text-xs transition-all transform hover:scale-105 active:scale-95 ${
            isCrisisActive
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-red-600/40 animate-pulse'
              : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-emerald-600/40'
          }`}
          aria-label="Open AI Student Guide"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="hidden sm:inline">RaahDost Assistant</span>
          {isCrisisActive && (
            <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Crisis Active
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[440px] h-[550px] max-h-[82vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black tracking-tight">RaahDost Assistant</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                    {currentPersona}
                  </span>
                </div>
                <p className="text-[10px] text-emerald-400 font-semibold">Your friend on every road.</p>
              </div>
            </div>

            {/* Language Selector + Close */}
            <div className="flex items-center space-x-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="bg-slate-800 text-[10px] font-bold text-slate-200 py-1 px-1.5 rounded-lg border border-slate-700 focus:outline-none"
                title="Voice Language"
              >
                <option value="en-IN">English (IN)</option>
                <option value="kn-IN">ಕನ್ನಡ (KN)</option>
                <option value="hi-IN">हिन्दी (HI)</option>
              </select>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.prompt)}
                className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 shadow-xs transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/60 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs relative ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {m.text.split('\n').map((line, i) => (
                      <span key={i} className="block mb-1 last:mb-0">
                        {line.split(/(\*\*.*?\*\*)/).map((chunk, j) => {
                          if (chunk.startsWith('**') && chunk.endsWith('**')) {
                            return <strong key={j} className="font-black text-slate-900">{chunk.slice(2, -2)}</strong>;
                          }
                          return chunk;
                        })}
                      </span>
                    ))}
                  </p>

                  {/* Speak button for assistant responses */}
                  {m.sender === 'assistant' && (
                    <button
                      onClick={() => speakMessage(m.text, m.id)}
                      title="Speak response"
                      className="mt-2 text-[10px] text-slate-500 hover:text-emerald-700 flex items-center space-x-1"
                    >
                      {speakingId === m.id ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5 text-red-500" />
                          <span className="text-red-500 font-bold">Stop Speaking</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Listen (Speak)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.timestamp}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-1.5 p-2 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] w-28">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] ml-1">Thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer with Microphone Button */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
          >
            {/* Microphone Toggle Button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Stop listening' : 'Speak your question'}
              className={`p-2.5 rounded-xl border transition-all ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              placeholder={isListening ? 'Listening... Speak now' : 'Ask about buses, exams, or road floods...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
