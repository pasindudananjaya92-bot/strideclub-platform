/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { LeaderboardView } from './components/LeaderboardView.tsx';
import { LogbookView } from './components/LogbookView.tsx';
import { AiCoachView } from './components/AiCoachView.tsx';
import { EventsView } from './components/EventsView.tsx';
import { AgentLogsView } from './components/AgentLogsView.tsx';
import { AgentWorkflowStudio } from './components/AgentWorkflowStudio.tsx';
import { CommunityView } from './components/CommunityView.tsx';
import { IntegrationsView } from './components/IntegrationsView.tsx';
import { SportsScienceLab } from './components/SportsScienceLab.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { DeploymentGuide } from './components/DeploymentGuide.tsx';
import { FloatingAiCoach } from './components/FloatingAiCoach.tsx';
import { RunLogModal } from './components/RunLogModal.tsx';
import { AppTab, TrainingDayPlan } from './types.ts';
import { Activity, Cloud, HeartHandshake, Shield, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

function MainApp() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [presetRunData, setPresetRunData] = useState<{
    title: string;
    distanceKm: number;
    targetPace: string;
    notes: string;
  } | null>(null);

  // Global toast notification banner
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const handleRunLogged = () => {
    setRefreshTrigger((prev) => prev + 1);
    setPresetRunData(null);
    setActiveTab('logbook');
    showNotification('Run logged successfully into Cloud SQL!', 'success');
  };

  const handleLogPresetWorkout = (dayPlan: TrainingDayPlan) => {
    setPresetRunData({
      title: `${dayPlan.day} - ${dayPlan.workoutType} (${dayPlan.focus})`,
      distanceKm: dayPlan.distanceKm,
      targetPace: dayPlan.targetPace,
      notes: `Planned workout from Pasiya AI: ${dayPlan.instructions}`,
    });
    setIsLogModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 animate-in slide-in-from-top-3 fade-in duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold border backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-300 border-rose-500/40 shadow-rose-950/50'
                : 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40 shadow-indigo-950/50'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Multi-Page Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLogModal={() => {
          setPresetRunData(null);
          setIsLogModalOpen(true);
        }}
      />

      {/* Main Multi-Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {activeTab === 'dashboard' && (
          <DashboardView
            key={`dashboard-${refreshTrigger}`}
            setActiveTab={setActiveTab}
            onOpenLogModal={() => {
              setPresetRunData(null);
              setIsLogModalOpen(true);
            }}
            onLogPresetWorkout={handleLogPresetWorkout}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            key={`leaderboard-${refreshTrigger}`}
            onOpenLogModal={() => {
              setPresetRunData(null);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {activeTab === 'logbook' && (
          <LogbookView
            key={`logbook-${refreshTrigger}`}
            onOpenLogModal={() => {
              setPresetRunData(null);
              setIsLogModalOpen(true);
            }}
          />
        )}

        {activeTab === 'sports-science' && <SportsScienceLab />}

        {activeTab === 'events' && (
          <EventsView
            currentUser={user}
            onNotify={showNotification}
          />
        )}

        {activeTab === 'ai-coach' && <AiCoachView />}

        {activeTab === 'agent-workflows' && (
          <AgentWorkflowStudio onNotify={showNotification} />
        )}

        {activeTab === 'agent-logs' && (
          <AgentLogsView onNotify={showNotification} />
        )}

        {activeTab === 'community' && <CommunityView />}

        {activeTab === 'integrations' && <IntegrationsView />}

        {activeTab === 'settings' && (
          <SettingsView
            onNavigateToAgentLogs={() => setActiveTab('agent-logs')}
          />
        )}

        {activeTab === 'deploy-guide' && <DeploymentGuide />}
      </main>

      {/* Floating AI Club Coach Chat Bubble (Bottom-Right) */}
      <FloatingAiCoach />

      {/* Log a Run Modal */}
      <RunLogModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setPresetRunData(null);
        }}
        onRunLogged={handleRunLogged}
        initialData={presetRunData}
      />

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-8 px-4 sm:px-6 text-xs mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-black text-xs">
              S
            </div>
            <span className="font-bold text-white font-mono">STRIDE<span className="text-emerald-400">CLUB</span></span>
            <span className="text-slate-500">— 24/7 Autonomous AI Running Platform (Free Tier)</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <button
              onClick={() => setActiveTab('agent-logs')}
              className="flex items-center space-x-1 text-emerald-400 hover:underline"
            >
              <Sparkles className="w-3 h-3" />
              <span>5 Autonomous Agents Active</span>
            </button>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <Cloud className="w-3 h-3 text-emerald-400" />
              <span>Cloud SQL: <strong className="text-slate-400 font-mono">asia-southeast1</strong></span>
            </span>
            <span>•</span>
            <button
              onClick={() => setActiveTab('deploy-guide')}
              className="text-emerald-400 hover:underline"
            >
              Cloud Run Deployment Guide
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
} 
