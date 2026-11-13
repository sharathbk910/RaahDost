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
  Compass
} from 'lucide-react';
import { getStudentGuideResponse, ChatMessage } from '../../agents/studentGuideService';
import { db } from '../../services/dataStore';

export const StudentGuideChatModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text: "Namaskara! 🙏 I'm your **RaahDost Student Guide** for Mangalore & Dakshina Kannada. Ask me which bus to catch, check flood road closures, or get emergency transport if you have an exam today!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const crisisState = db.getCrisisSimulation();
  const isCrisisActive = Boolean(crisisState?.isActive);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

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
      const reply = await getStudentGuideResponse(text, messages);
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
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 px-4 py-3.5 rounded-full shadow-2xl font-black text-xs transition-all transform hover:scale-105 active:scale-95 ${
            isCrisisActive
              ? 'bg-gradient-to-r from-red-600 via-orange-600 to-amber-500 text-white shadow-red-600/40 animate-pulse'
              : 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white shadow-brand-600/40'
          }`}
          aria-label="Open AI Student Guide"
        >
          <Bot className="w-5 h-5 text-white" />
          <span className="hidden sm:inline">AI Student Guide</span>
          {isCrisisActive && (
            <span className="bg-white text-red-700 text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase">
              Crisis Active
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-fade-in font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-brand-950 p-4 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-black tracking-tight">RaahDost Student Guide</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-brand-500/30 text-emerald-300">
                    AI Assistant
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">Dakshina Kannada • Mangaluru Corridor</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-slate-50 border-b border-slate-200 p-2 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickPrompts.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.prompt)}
                className="flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-brand-500 hover:text-brand-700 text-slate-700 shadow-xs transition-colors"
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
                  className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-brand-600 text-white rounded-br-none'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {/* Render basic bold formatting */}
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
                </div>
                <span className="text-[9px] text-slate-400 px-1 mt-0.5">{m.timestamp}</span>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center space-x-1.5 p-2 bg-white border border-slate-200 rounded-xl text-slate-500 text-[11px] w-28">
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-[10px] ml-1">Checking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex gap-2 items-center"
          >
            <input
              type="text"
              placeholder="Ask about buses, exams, or road floods..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-40 shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
