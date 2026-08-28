import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ChatMessage } from '../types.ts';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Trash2,
  Share2,
  Globe,
  ExternalLink,
  HelpCircle,
  Activity,
  Layers,
  MessageCircle,
  Image as ImageIcon,
  Video,
  Camera,
  UploadCloud,
  FileCheck,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ExtendedChatMessage extends ChatMessage {
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  mediaName?: string;
}

const SOCIAL_LINKS = [
  { name: 'Instagram', url: 'https://www.instagram.com/pasindu5598', icon: '📸', color: 'from-pink-500 to-purple-600' },
  { name: 'Facebook', url: 'https://www.facebook.com/share/18xRGhYVUo/', icon: '📘', color: 'from-blue-600 to-blue-800' },
  { name: 'YouTube', url: 'https://youtube.com/@pasya', icon: '▶️', color: 'from-red-600 to-red-700' },
  { name: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VaPASIAMAX', icon: '💬', color: 'from-emerald-500 to-green-600' },
  { name: 'WhatsApp Group', url: 'https://chat.whatsapp.com/KjhsWakBQoUI4SEEvZXAsO', icon: '👥', color: 'from-emerald-600 to-teal-700' },
  { name: 'Telegram Channel', url: 'https://t.me/goldenbotmdchannel', icon: '📢', color: 'from-sky-500 to-blue-600' },
  { name: 'TikTok', url: 'https://tiktok.com/@pasindudananjaya619', icon: '🎵', color: 'from-slate-700 to-slate-900' },
  { name: 'Blog', url: 'https://mamageblog.blogspot.com', icon: '🌐', color: 'from-amber-500 to-orange-600' },
  { name: 'LinkedIn Profile', url: 'https://linkedin.com/in/pasindu-dananjaya-41044831b', icon: '💼', color: 'from-blue-700 to-indigo-800' },
  { name: 'X / Twitter', url: 'https://x.com/PasinduDan98554', icon: '🐦', color: 'from-slate-800 to-slate-950' },
  { name: 'Viber Channel', url: 'https://invite.viber.com/?g2=AQBWlEwa%2BDKVDFaaTbesR5FqD2IQZhFjhhQdN%2Fvdsaml9xVUCL8RnDHcFy6kno0U', icon: '💜', color: 'from-purple-600 to-indigo-700' },
  { name: 'Imo', url: 'https://s.imoim.net/KNdKwX?ISCI=001102', icon: '📱', color: 'from-cyan-600 to-blue-700' },
];

export const FloatingAiCoach: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'social' | 'guide'>('chat');
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([
    {
      role: 'model',
      content:
        "👋 ආයුබෝවන් / Hello! මම **Pasiya AI (Assistant of Pasiya Max)**.\n\n📸 **Multimodal Vision Active:** ඔබට ඔබගේ දුරකථනයෙන් හෝ පරිගණකයෙන් ඕනෑම ධාවන ඉරියව් (Running Form) ඡායාරූප, පාවහන් (Shoe wear), Smartwatch screenshots, හෝ කෙටි වීඩියෝ මෙතැනට Upload කර ගැඹුරු විද්‍යාත්මක විශ්ලේෂණයක් (Deep Sports Science Analysis) ලබාගත හැක!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Media upload state
  const [selectedMedia, setSelectedMedia] = useState<{
    file: File;
    previewUrl: string;
    base64: string;
    mimeType: string;
    mediaType: 'image' | 'video';
  } | null>(null);

  const [analysisType, setAnalysisType] = useState<
    'running_form' | 'shoe_wear' | 'gps_watch' | 'injury_rehab' | 'nutrition' | 'general'
  >('general');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickChips = [
    { label: '📸 ඡායාරූපයක් / වීඩියෝවක් පරික්ෂා කරන්න', prompt: 'මගේ ධාවන ඉරියව් හෝ පාවහන් වල ඡායාරූපයක් පරික්ෂා කර ගැඹුරු උපදෙස් දෙන්න.' },
    { label: '🇱🇰 මේ වෙබ්සයිට් එක ගැන කියන්න', prompt: 'මෙම StrideClub වෙබ් අඩවියෙන් ලබාගත හැකි සියලුම සේවාවන් සහ විශේෂාංග මොනවාද?' },
    { label: '📲 Pasiya Max Social Media Links', prompt: 'Pasiya Max ගේ සියලුම සමාජ මාධ්‍ය සහ Community Channels ලැයිස්තුව ලබාදෙන්න.' },
    { label: '🏃 5K Sub-25 Training Plan', prompt: 'How do I train to break 25 minutes in a 5K race?' },
    { label: '👟 Shoe Outsole Wear Patterns', prompt: 'Explain what lateral vs medial shoe wear means for pronation and supination.' },
    { label: '⚡ Zone 2 Heart Rate', prompt: 'What is Zone 2 Heart Rate training and why is it important?' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, activeTab]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (< 25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert('File size exceeds 25MB limit. Please upload a smaller photo or short video clip.');
      return;
    }

    const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
    const reader = new FileReader();

    reader.onload = (loadEvt) => {
      const base64Str = loadEvt.target?.result as string;
      const previewUrl = URL.createObjectURL(file);

      setSelectedMedia({
        file,
        previewUrl,
        base64: base64Str,
        mimeType: file.type || (mediaType === 'video' ? 'video/mp4' : 'image/jpeg'),
        mediaType,
      });
    };

    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveSelectedMedia = () => {
    if (selectedMedia?.previewUrl) {
      URL.revokeObjectURL(selectedMedia.previewUrl);
    }
    setSelectedMedia(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && !selectedMedia) || loading) return;

    const currentMedia = selectedMedia;
    const userPrompt = query || (currentMedia ? (currentMedia.mediaType === 'video' ? 'Please analyze this video clip of my athletic activity and provide deep biomechanical coaching.' : 'Please analyze this photo in detail, inspect form/wear/metrics, and provide actionable tips in my language.') : '');

    const userMessage: ExtendedChatMessage = {
      role: 'user',
      content: userPrompt,
      mediaUrl: currentMedia?.previewUrl,
      mediaType: currentMedia?.mediaType,
      mediaName: currentMedia?.file.name,
    };

    const newHistory: ExtendedChatMessage[] = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setSelectedMedia(null);
    setLoading(true);
    setActiveTab('chat');

    try {
      if (currentMedia) {
        // MULTIMODAL API CALL
        const res = await fetch('/api/ai/multimodal-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaBase64: currentMedia.base64,
            mimeType: currentMedia.mimeType,
            userPrompt,
            analysisType,
          }),
        });

        const data = await res.json();
        if (data.analysis) {
          setMessages([...newHistory, { role: 'model', content: data.analysis }]);
        } else {
          throw new Error(data.error || 'Failed to complete media analysis');
        }
      } else {
        // STANDARD TEXT CHATBOT CALL
        const res = await fetch('/api/ai/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: query,
            history: messages.map((m) => ({ role: m.role, content: m.content })).slice(-10),
            userContext: user ? { totalKm: 25, avgPace: '5:15/km' } : undefined,
          }),
        });

        const data = await res.json();
        if (data.answer) {
          setMessages([...newHistory, { role: 'model', content: data.answer }]);
        } else {
          throw new Error(data.error || 'No answer generated');
        }
      }
    } catch (err: any) {
      setMessages([
        ...newHistory,
        {
          role: 'model',
          content:
            "I'm temporarily catching my breath! Remember: 80% easy miles builds 100% of your aerobic engine. Feel free to ask again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    handleRemoveSelectedMedia();
    setMessages([
      {
        role: 'model',
        content: "Chat cleared! ඔබට මෙම වෙබ් අඩවිය හෝ පුහුණු සැලසුම් ගැන දැනගැනීමට අවශ්‍ය කුමක්ද?",
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
          className="group relative flex items-center space-x-2.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 px-4 py-3 rounded-full shadow-2xl shadow-emerald-950/80 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-emerald-300"
          aria-label="Open Pasiya AI Assistant"
        >
          <div className="relative">
            <Bot className="w-5 h-5 stroke-[2.5]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-950 rounded-full border border-emerald-300 animate-ping"></span>
          </div>
          <span className="font-extrabold text-xs tracking-tight">Pasiya AI (Vision & Chat)</span>
          <span className="text-[9px] font-mono bg-slate-950 text-emerald-300 px-1.5 py-0.5 rounded-full uppercase font-bold flex items-center space-x-1">
            <Camera className="w-2.5 h-2.5" />
            <span>Multimodal</span>
          </span>
        </button>
      )}

      {/* Floating Opened Chat Popover Window */}
      {isOpen && (
        <div
          id="floating-ai-coach-popover"
          className="w-[94vw] sm:w-[460px] h-[600px] max-h-[88vh] bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span>Pasiya AI Vision Assistant</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-mono">
                    Photo & Video AI
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Pasiya Max Official • StrideClub Deep Vision</p>
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
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="bg-slate-900/80 px-3 py-1.5 border-b border-slate-800 flex items-center space-x-1 text-xs">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-3 h-3" />
              <span>Chat & Vision</span>
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                activeTab === 'social'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3 h-3" />
              <span>Social Media</span>
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                activeTab === 'guide'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Site Tour</span>
            </button>
          </div>

          {/* TAB 1: Chat Area */}
          {activeTab === 'chat' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-3 scrollbar-thin text-xs">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* If user uploaded media in this message */}
                  {msg.mediaUrl && (
                    <div className="mb-1.5 max-w-[80%] rounded-2xl overflow-hidden border border-emerald-500/40 shadow-lg">
                      {msg.mediaType === 'video' ? (
                        <video
                          src={msg.mediaUrl}
                          controls
                          className="w-full max-h-48 rounded-2xl object-cover bg-black"
                        />
                      ) : (
                        <img
                          src={msg.mediaUrl}
                          alt="Uploaded by runner"
                          className="w-full max-h-48 rounded-2xl object-cover bg-slate-900"
                        />
                      )}
                      <div className="bg-slate-900/90 px-2 py-1 flex items-center justify-between text-[10px] text-emerald-300">
                        <span className="truncate">{msg.mediaName || 'Uploaded File'}</span>
                        <span className="uppercase text-[8px] px-1 py-0.5 bg-emerald-500/20 rounded font-mono">
                          {msg.mediaType}
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
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
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-bl-none px-4 py-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    <span className="text-[10px] text-slate-400 ml-2">
                      Pasiya AI is deeply analyzing...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* TAB 2: Pasiya Max Social Media Hub */}
          {activeTab === 'social' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin">
              <div className="text-center mb-3">
                <h5 className="font-extrabold text-xs text-white">Pasiya Max Official Links</h5>
                <p className="text-[10px] text-slate-400">Follow and support across all platforms!</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SOCIAL_LINKS.map((link, i) => (
                  <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 p-2 rounded-xl transition-all group"
                  >
                    <span className="text-base">{link.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white group-hover:text-emerald-300 truncate">
                        {link.name}
                      </p>
                      <p className="text-[9px] text-slate-500 truncate">Open Link</p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Site Features Guide */}
          {activeTab === 'guide' && (
            <div className="flex-1 p-4 overflow-y-auto space-y-2 scrollbar-thin text-xs">
              <div className="text-center mb-2">
                <h5 className="font-extrabold text-xs text-white">StrideClub Feature Tour</h5>
                <p className="text-[10px] text-slate-400">Click any card to ask Pasiya AI for details</p>
              </div>

              {[
                { title: '📸 Multimodal Photo & Video AI', desc: 'Upload photos or videos directly from phone to analyze running form, shoe wear, and GPS watch', query: 'How does the Multimodal Photo & Video AI feature analyze my running form and shoe tread?' },
                { title: '🔬 Sports Science & Biomechanics Lab', desc: 'VDOT pace zones, Karvonen HR bands, Pete Riegel race predictors & shoe lifespan tracker', query: 'Tell me about the Sports Science Lab tools in StrideClub.' },
                { title: '🏃 AI Training Coach', desc: 'Custom 5K-Marathon pacing, fueling, and recovery', query: 'Tell me everything about the AI Training Coach feature.' },
                { title: '🧠 Autonomous Agent Studio', desc: 'Enterprise-grade multi-agent problem solver & DAG engine natively on Supabase and Vercel', query: 'Explain the Autonomous Multi-Agent Studio and how it automates coaching.' },
                { title: '🐙 GitHub Repository Sync', desc: 'Commit and upload code directly to your GitHub repo in 1 click', query: 'How do I use the GitHub Repository Sync Agent with a GitHub Access Token?' },
                { title: '📲 Social Media Auto-Poster', desc: 'Auto-publish workouts to Telegram, FB, and YT via Make.com', query: 'How does the Make.com Social Media Auto-Poster work?' },
                { title: '🐘 Supabase & Vercel Free Tier', desc: 'Zero-cost deployment with PostgreSQL and serverless crons', query: 'How do I set up Supabase and Vercel without needing paid services?' },
                { title: '🏆 Leaderboards & Badges', desc: 'Weekly rankings, distance milestone badges, and live stats', query: 'How do Leaderboards and milestone badges work?' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(item.query)}
                  className="w-full text-left bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500 p-2.5 rounded-xl transition-all"
                >
                  <p className="font-bold text-white text-[11px]">{item.title}</p>
                  <p className="text-[10px] text-slate-400">{item.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Quick Suggestion Chips (Shown on Chat tab) */}
          {activeTab === 'chat' && !selectedMedia && (
            <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-900 flex overflow-x-auto space-x-1.5 scrollbar-none">
              {quickChips.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="text-[10px] whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-full border border-slate-800 transition-colors shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* STAGED MEDIA PREVIEW CARD */}
          {selectedMedia && (
            <div className="px-3 py-2 bg-emerald-950/40 border-t border-emerald-800/60 flex items-center justify-between">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-emerald-500/50 shrink-0">
                  {selectedMedia.mediaType === 'video' ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-emerald-400">
                      <Video className="w-5 h-5" />
                    </div>
                  ) : (
                    <img
                      src={selectedMedia.previewUrl}
                      alt="Thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-white truncate">{selectedMedia.file.name}</p>
                  <div className="flex items-center space-x-2 text-[9px] text-emerald-300">
                    <span>{(selectedMedia.file.size / 1024 / 1024).toFixed(2)} MB</span>
                    <span>•</span>
                    <select
                      value={analysisType}
                      onChange={(e: any) => setAnalysisType(e.target.value)}
                      className="bg-slate-900 border border-emerald-600/40 rounded px-1.5 py-0.5 text-white text-[9px] focus:outline-none"
                    >
                      <option value="general">🔍 General Inspection</option>
                      <option value="running_form">🏃 Running Form / Gait</option>
                      <option value="shoe_wear">👟 Shoe Outsole Wear</option>
                      <option value="gps_watch">⌚ GPS Watch / Strava</option>
                      <option value="injury_rehab">🩹 Injury / Rehab Area</option>
                      <option value="nutrition">🥗 Meal / Hydration</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleRemoveSelectedMedia}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
                title="Remove Media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Hidden File Picker Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/*"
            className="hidden"
          />

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2"
          >
            {/* Attachment Button for Photo/Video */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-xl transition-all border border-slate-700 hover:border-emerald-500 shrink-0"
              title="Upload Photo or Video from Phone / PC"
            >
              <Camera className="w-4 h-4 stroke-[2]" />
            </button>

            <input
              type="text"
              placeholder={
                selectedMedia
                  ? "Add instructions (e.g. 'Check my foot strike & pronation')..."
                  : "Ask in Sinhala, English, or upload a photo/video..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={(!input.trim() && !selectedMedia) || loading}
              className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-all disabled:opacity-40 shrink-0"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

