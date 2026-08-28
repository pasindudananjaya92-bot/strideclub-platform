import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage } from '../types.ts';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Activity,
  Flame,
  Zap,
  HelpCircle,
} from 'lucide-react';

export const FloatingAiCoach: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        "👋 Hi! I'm **Pasiya AI Club Coach**. Ask me anything about race pacing, personalized 5K/10K/marathon plans, nutrition, shoe recommendations, or injury recovery!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    'How do I break 25 mins in a 5K?',
    'What is Zone 2 Heart Rate training?',
    'Best carb-loading meals before a long run',
    'How to prevent shin splints and knee pain?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const newHistory: ChatMessage[] = [...messages, { role: 'user', content: query }];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          history: messages.slice(-8), // send last 8 messages for context
          userContext: user ? { totalKm: 25, avgPace: '5:15/km' } : undefined,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setMessages([...newHistory, { role: 'model', content: data.answer }]);
      } else {
        throw new Error(data.error || 'No answer generated');
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'model',
          content:
            "I'm temporarily catching my breath! Remember: 80% easy miles builds 100% of your engine. Feel free to ask again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'model',
        content: "Chat cleared! How can I help with your training today?",
      },
    ]);
  };

  return (
    <div id="floating-ai-coach-wrapper" className="fixed bottom-5 right-5 z-50">
      {/* Floating Closed Trigger Bubble */}
      {!isOpen && (
        <button
          id="btn-open-floating-ai-coach"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-4 py-3 rounded-full shadow-2xl shadow-emerald-950/80 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-emerald-300"
          aria-label="Open AI Club Coach"
        >
          <div className="relative">
            <Bot className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-950 rounded-full border border-emerald-300 animate-ping"></span>
          </div>
          <span className="font-extrabold text-xs tracking-tight">AI Club Coach</span>
          <span className="text-[9px] font-mono bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded-full uppercase font-bold">
            Gemini
          </span>
        </button>
      )}

      {/* Floating Opened Chat Popover Window (n8n / Replit style) */}
      {isOpen && (
        <div
          id="floating-ai-coach-popover"
          className="w-[90vw] sm:w-[400px] h-[520px] max-h-[85vh] bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span>Pasiya AI Coach</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                    Free Gemini
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Pacing • Fueling • Training Plans</p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClear}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                title="Clear Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Minimize"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin text-xs">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-500 text-slate-950 font-medium rounded-br-none shadow-sm'
                      : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip)}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-800 transition-colors text-left"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask your running question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
