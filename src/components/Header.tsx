import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { AppTab } from '../types.ts';
import {
  Activity,
  Trophy,
  LogIn,
  LogOut,
  Plus,
  User,
  Bot,
  PlugZap,
  Users,
  Settings,
  Download,
  LayoutDashboard,
  Menu,
  X,
  Calendar,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenLogModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenLogModal }) => {
  const { user, signIn, signOut, loading, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadCode = async () => {
    try {
      setIsExporting(true);
      window.location.href = '/api/export/project-zip';
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const navItems: Array<{ id: AppTab; label: string; icon: React.FC<{ className?: string }>; badge?: string }> = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agent-workflows', label: 'AI Studio', icon: Workflow, badge: 'Agent DAG' },
    { id: 'sports-science', label: 'Sports Lab', icon: Zap, badge: 'VDOT' },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'logbook', label: 'Logbook', icon: Activity },
    { id: 'events', label: 'Events', icon: Calendar, badge: 'Sunday 7am' },
    { id: 'ai-coach', label: 'AI Coach', icon: Bot, badge: 'On-Demand AI' },
    { id: 'agent-logs', label: 'Agent Logs', icon: Terminal, badge: 'Autonomous' },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: PlugZap, badge: 'Vault' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header
      id="main-header"
      className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md text-white border-b border-slate-800 shadow-xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <div className="flex items-center space-x-3">
            <button
              id="brand-logo-btn"
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className="flex items-center space-x-3 cursor-pointer group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-900/40 group-hover:scale-105 transition-transform">
                <Activity className="w-6 h-6 text-slate-950 stroke-[2.5]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xl font-black tracking-tight text-white font-mono">
                  STRIDE<span className="text-emerald-400">CLUB</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Autonomous AI
                </span>
              </div>
            </button>
            <p className="text-[11px] text-slate-400 hidden sm:block">Free-Tier · Autonomous On-Demand</p>
          </div>

          <nav
            id="header-nav-tabs"
            className="hidden xl:flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-400'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[8px] px-1.5 py-0.5 rounded-full font-mono uppercase tracking-wider ${
                        isActive
                          ? 'bg-slate-950 text-emerald-400 font-bold'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/60'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-2.5">
            <button
              id="btn-github-export"
              type="button"
              onClick={handleDownloadCode}
              disabled={isExporting}
              title="Download full project code as ZIP"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-medium transition-all duration-200 active:scale-95 rounded-xl"
            >
              <Download className={`w-3.5 h-3.5 text-emerald-400 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Packaging...' : 'Export Code'}</span>
            </button>

            {user && (
              <button
                id="btn-quick-log-run"
                type="button"
                onClick={onOpenLogModal}
                className="hidden sm:inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 font-bold px-3 py-1.5 rounded-xl text-xs text-slate-950 shadow-lg shadow-emerald-900/40 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Log Run</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className="flex items-center space-x-2 p-1 rounded-xl hover:bg-slate-800 transition-colors"
                  title="Profile & Settings"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Runner'}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full border-2 border-emerald-400/60 object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </button>
                {isAdmin && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Admin
                  </span>
                )}
                <button
                  id="btn-sign-out"
                  type="button"
                  onClick={signOut}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-xl transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-google-sign-in"
                type="button"
                onClick={signIn}
                disabled={loading}
                className="flex items-center space-x-2 bg-white hover:bg-slate-100 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-950" />
                <span>{loading ? 'Signing in...' : 'Sign In with Google'}</span>
              </button>
            )}

            <button
              id="btn-mobile-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="hidden md:flex xl:hidden items-center space-x-1 py-2 border-t border-slate-800/80 overflow-x-auto scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5 inline mr-1.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-slate-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleDownloadCode();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 text-emerald-400"
              >
                <Download className="w-4 h-4" />
                <span>Download Project ZIP (GitHub)</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenLogModal();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 p-3 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 shadow-lg"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Log a New Run</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}; 
