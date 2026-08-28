import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage } from '../types.ts';
import {
  Bot,
  Sparkles,
  Calculator,
  Flame,
  Heart,
  Send,
  ArrowRight,
  RefreshCw,
  Award,
  Zap,
  Target,
  Clock,
} from 'lucide-react';

export const AiCoachView: React.FC = () => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'calculator' | 'zones'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        "Welcome to the **Pasiya AI Club Coach** center! I can build personalized 8 to 16-week training schedules, calibrate threshold pace, configure carb hydration plans, or provide strength routines for runners.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Pace calculator states
  const [calcDistance, setCalcDistance] = useState('5'); // km
  const [calcHours, setCalcHours] = useState('0');
  const [calcMinutes, setCalcMinutes] = useState('25');
  const [calcSeconds, setCalcSeconds] = useState('00');

  const distNum = parseFloat(calcDistance) || 5;
  const totalSecs =
    (parseInt(calcHours) || 0) * 3600 +
    (parseInt(calcMinutes) || 0) * 60 +
    (parseInt(calcSeconds) || 0);

  const paceMinPerKm = totalSecs > 0 && distNum > 0 ? (totalSecs / 60) / distNum : 5.0;
  const paceMinutes = Math.floor(paceMinPerKm);
  const paceSecs = Math.round((paceMinPerKm - paceMinutes) * 60);
  const formattedPace = `${paceMinutes}:${paceSecs < 10 ? '0' : ''}${paceSecs} /km`;

  const handleSendMessage = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
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
          history: messages.slice(-10),
          userContext: {
            totalKm: 42,
            avgPace: formattedPace,
          },
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setMessages([...newHistory, { role: 'model', content: data.answer }]);
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'model',
          content: 'Coach Tip: Hydrate well, maintain a light forward lean, and run consistently!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetPlans = [
    {
      title: 'Sub-25 Min 5K Plan (8 Weeks)',
      desc: '3 weekly runs: Interval speed session, easy Zone 2 recovery, and progressive long run.',
      prompt: 'Build me an 8-week progressive training plan to break 25 minutes in a 5K race.',
    },
    {
      title: 'First Half Marathon Plan (12 Weeks)',
      desc: 'Build weekly long runs safely from 8 km to 18 km without shin splints.',
      prompt: 'Create a 12-week beginner Half Marathon training schedule with weekly mileage progression.',
    },
    {
      title: 'Marathon Gel & Fueling Strategy',
      desc: 'Calculate grams of carbs per hour and electrolyte targets for 42.2 km.',
      prompt: 'What is the optimal race day fueling, gel intake, and hydration timeline for a full marathon?',
    },
    {
      title: 'Runners Strength & Injury Prevention',
      desc: '15-minute bodyweight routine for glute medius, calf stiffness, and core strength.',
      prompt: 'Give me a 15-minute strength and mobility routine for distance runners to prevent knee and hip injuries.',
    },
  ];

  return (
    <div id="ai-coach-page-container" className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Powered by Gemini AI (Free Tier)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Pasiya AI Running Coach & Lab
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your 24/7 endurance science mentor. Get instant tailored training plans, race day split calculations, cadence drills, and recovery nutrition strategies.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 self-start md:self-center shrink-0">
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              AI Chat
            </button>
            <button
              onClick={() => setActiveSubTab('calculator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'calculator'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Pace Calc
            </button>
            <button
              onClick={() => setActiveSubTab('zones')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'zones'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              HR Zones
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeSubTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Prompts Sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Recommended Training Prompts</span>
            </h3>

            <div className="space-y-3">
              {presetPlans.map((plan, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSendMessage(plan.prompt)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 cursor-pointer transition-all hover:bg-slate-800/60 group"
                >
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center justify-between">
                    <span>{plan.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-transform group-hover:translate-x-1" />
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">{plan.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-[600px]">
            {/* Header */}
            <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Pasiya AI Endurance Mentor</h3>
                  <p className="text-[11px] text-slate-400">Official Assistant of Pasiya Max</p>
                </div>
              </div>

              <button
                onClick={() =>
                  setMessages([
                    {
                      role: 'model',
                      content: 'Session refreshed! What running challenge are we tackling today?',
                    },
                  ])
                }
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                title="Reset conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 text-xs sm:text-sm scrollbar-thin">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl p-4 leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-emerald-500 text-slate-950 font-semibold rounded-br-none shadow-md'
                        : 'bg-slate-950 text-slate-200 border border-slate-800 rounded-bl-none shadow-md'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl rounded-bl-none px-5 py-3.5 flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-4 bg-slate-950 border-t border-slate-800 flex items-center space-x-3"
            >
              <input
                type="text"
                placeholder="Ask about training, intervals, race splits, shoes, or nutrition..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-40"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Pace Calculator Tab */}
      {activeSubTab === 'calculator' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl space-y-8 max-w-3xl mx-auto">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              <span>Target Pace & Split Calculator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Compute required min/km pace and projected finish times for common race distances
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Race Distance</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '5K', val: '5' },
                    { label: '10K', val: '10' },
                    { label: 'Half (21.1)', val: '21.0975' },
                    { label: 'Full (42.2)', val: '42.195' },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => setCalcDistance(preset.val)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        calcDistance === preset.val
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Time (HH:MM:SS)</label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    placeholder="HH"
                    value={calcHours}
                    onChange={(e) => setCalcHours(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="MM"
                    value={calcMinutes}
                    onChange={(e) => setCalcMinutes(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="SS"
                    value={calcSeconds}
                    onChange={(e) => setCalcSeconds(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-center text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Output Result Card */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center space-y-2">
              <span className="text-xs text-slate-400 font-medium">Required Running Pace</span>
              <div className="text-4xl font-black font-mono text-emerald-400">
                {formattedPace}
              </div>
              <p className="text-xs text-slate-400">
                Speed: {(60 / paceMinPerKm).toFixed(2)} km/h • {((60 / paceMinPerKm) * 0.621371).toFixed(2)} mph
              </p>
              <button
                onClick={() => {
                  setActiveSubTab('chat');
                  handleSendMessage(
                    `Give me a detailed pacing guide and strategy to maintain ${formattedPace} for a ${distNum} km race.`
                  );
                }}
                className="mt-3 flex items-center space-x-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all"
              >
                <span>Ask AI Coach Pacing Strategy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Heart Rate Zones Reference Tab */}
      {activeSubTab === 'zones' && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Heart className="w-5 h-5 text-rose-500" />
              <span>5-Zone Endurance Training Matrix</span>
            </h2>
            <p className="text-xs text-slate-400">
              The 80/20 polarized training philosophy: 80% of volume in Zone 2, 20% in Zone 4/5.
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  zone: 'Zone 1: Active Recovery',
                  hr: '< 60% Max HR',
                  purpose: 'Promotes blood flow, flushes lactate, assists recovery between hard days.',
                  feel: 'Effortless, conversational walking/jogging.',
                  color: 'text-sky-400 border-sky-500/30 bg-sky-950/20',
                },
                {
                  zone: 'Zone 2: Aerobic Base (Mitochondrial Building)',
                  hr: '60% – 70% Max HR',
                  purpose: 'Builds capillaries, boosts fat metabolism, increases stroke volume without fatigue.',
                  feel: 'All-day pace, can speak in full unbroken sentences.',
                  color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20',
                },
                {
                  zone: 'Zone 3: Tempo / Aerobic Endurance',
                  hr: '70% – 80% Max HR',
                  purpose: 'Marathon goal pace training; improves glycogen storage.',
                  feel: 'Comfortably hard, 2-3 word sentences.',
                  color: 'text-yellow-400 border-yellow-500/30 bg-yellow-950/20',
                },
                {
                  zone: 'Zone 4: Lactate Threshold (LT2)',
                  hr: '80% – 90% Max HR',
                  purpose: 'Teaches body to clear lactic acid at race speeds; half-marathon & 10K pace.',
                  feel: 'Hard, deep breathing, focused effort.',
                  color: 'text-orange-400 border-orange-500/30 bg-orange-950/20',
                },
                {
                  zone: 'Zone 5: VO2 Max & Neuromuscular Speed',
                  hr: '90% – 100% Max HR',
                  purpose: 'Increases maximum oxygen uptake and sprinting cadence.',
                  feel: 'Maximum effort, sustainable for 1-4 minute reps.',
                  color: 'text-rose-400 border-rose-500/40 bg-rose-950/20',
                },
              ].map((z, idx) => (
                <div key={idx} className={`p-4 rounded-2xl border ${z.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white">{z.zone}</span>
                      <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-300">
                        {z.hr}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{z.purpose}</p>
                    <p className="text-[11px] text-slate-400 italic">Feel: {z.feel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
