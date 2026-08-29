import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { CommunityPostItem } from '../types.ts';
import { formatDate } from '../utils/formatters.ts';
import {
  Users,
  MessageSquare,
  Heart,
  Plus,
  Compass,
  Award,
  Sparkles,
  Share2,
  ExternalLink,
  MapPin,
  Flame,
  Send,
} from 'lucide-react';

export const CommunityView: React.FC = () => {
  const { user, signIn, getAuthHeaders } = useAuth();
  const [posts, setPosts] = useState<CommunityPostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [publishing, setPublishing] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/community/posts');
      if (res.ok) {
        const json = await res.json();
        setPosts(json.posts || []);
      }
    } catch (err) {
      console.error('Error fetching community posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setPublishing(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, category }),
      });

      if (res.ok) {
        const json = await res.json();
        setPosts([json.post, ...posts]);
        setIsModalOpen(false);
        setTitle('');
        setContent('');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setPublishing(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      // Optimistic update
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p))
      );

      await fetch(`/api/community/posts/${postId}/like`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to like post:', err);
    }
  };

  const categories = ['All', 'Route', 'Training Tip', 'Race Report', 'Discussion'];

  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter((p) => p.category.toLowerCase() === selectedCategory.toLowerCase());

  const socialLinks = [
    { label: 'YouTube', url: 'https://youtube.com/@pasya', color: 'text-red-400' },
    { label: 'Instagram', url: 'https://www.instagram.com/pasindu5598', color: 'text-pink-400' },
    { label: 'Facebook', url: 'https://www.facebook.com/share/18xRGhYVUo/', color: 'text-blue-400' },
    { label: 'WhatsApp Channel', url: 'https://whatsapp.com/channel/0029VaPASIAMAX', color: 'text-emerald-400' },
    { label: 'WhatsApp Group', url: 'https://chat.whatsapp.com/KjhsWakBQoUI4SEEvZXAsO', color: 'text-teal-400' },
    { label: 'Telegram Channel', url: 'https://t.me/goldenbotmdchannel', color: 'text-sky-400' },
    { label: 'TikTok', url: 'https://tiktok.com/@pasindudananjaya619', color: 'text-purple-400' },
    { label: 'LinkedIn Profile', url: 'https://linkedin.com/in/pasindu-dananjaya-41044831b', color: 'text-indigo-400' },
    { label: 'X / Twitter', url: 'https://x.com/PasinduDan98554', color: 'text-slate-300' },
    { label: 'Viber Channel', url: 'https://invite.viber.com/?g2=AQBWlEwa%2BDKVDFaaTbesR5FqD2IQZhFjhhQdN%2Fvdsaml9xVUCL8RnDHcFy6kno0U', color: 'text-violet-400' },
    { label: 'Official Blog', url: 'https://mamageblog.blogspot.com', color: 'text-amber-400' },
  ];

  return (
    <div id="community-view-container" className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <Users className="w-3.5 h-3.5" />
              <span>Athletic Community Feed</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Club Hub & Discussion Board
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect with fellow club athletes. Share scenic route recommendations, review weekend long runs, ask fueling advice, and cheer on personal bests!
            </p>
          </div>

          <div className="shrink-0">
            {user ? (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>New Club Post</span>
              </button>
            ) : (
              <button
                onClick={signIn}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-5 py-3 rounded-2xl text-xs sm:text-sm border border-slate-700"
              >
                <span>Sign in to Post</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Feed + Official Links Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Posts Stream */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading club conversations...</div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-900 rounded-2xl border border-slate-800">
              No discussions in this category yet. Be the first to start a conversation!
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 sm:p-6 shadow-sm transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      {post.authorPhoto ? (
                        <img
                          src={post.authorPhoto}
                          alt={post.authorName}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex items-center justify-center font-bold text-sm">
                          {post.authorName?.[0] || 'A'}
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-white">{post.authorName}</h4>
                        <p className="text-[10px] text-slate-400">{formatDate(post.createdAt)}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 border border-slate-800">
                      {post.category}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {post.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-1.5 text-slate-400 hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                    >
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                      <span className="font-mono font-semibold">{post.likesCount} Kudos</span>
                    </button>

                    <div className="flex items-center space-x-1 text-slate-500 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Club Board</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Social Channels & Official Links */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pasiya Max Official Links</h3>
                <p className="text-[11px] text-slate-400">Join our connected community</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Stay tuned for live running streams, weekly coaching updates, open group runs, and bot updates across our official social channels:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
              {socialLinks.map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-semibold transition-colors group"
                >
                  <span className={`${link.color}`}>{link.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create a Community Post</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Discussion">Discussion</option>
                  <option value="Route">Scenic Route Recommendation</option>
                  <option value="Training Tip">Training Tip</option>
                  <option value="Race Report">Race Report</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Topic Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Saturday 15km Bay Trail Group Run"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Details & Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Share details, meeting point, elevation, shoe recommendations, or pacing..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish to Club Feed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}; 
