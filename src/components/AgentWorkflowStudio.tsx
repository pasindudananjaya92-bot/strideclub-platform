import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Workflow,
  Sparkles,
  Bot,
  Zap,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Activity,
  ArrowRight,
  Database,
  Search,
  Shield,
  Layers,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Code,
  Share2,
  ExternalLink,
  ChevronRight,
  Flame,
  GitBranch,
  Github,
  Send,
  Upload,
  Globe,
  Radio,
} from 'lucide-react';
import { AgentWorkflowDefinition, WorkflowNode, MultiAgentExecutionTrace } from '../types.ts';

interface AgentWorkflowStudioProps {
  onNotify?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AgentWorkflowStudio: React.FC<AgentWorkflowStudioProps> = ({ onNotify }) => {
  const [workflows, setWorkflows] = useState<AgentWorkflowDefinition[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<AgentWorkflowDefinition | null>(null);
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);
  const [traces, setTraces] = useState<MultiAgentExecutionTrace[]>([]);
  const [activeTab, setActiveTab] = useState<'canvas' | 'playground' | 'github' | 'social' | 'traces' | 'integrations'>('canvas');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Playground state
  const [userPrompt, setUserPrompt] = useState<string>(
    'Create an elite 7-day half-marathon peaking week for a runner targeting 1h:45m pace with Zone 2 aerobic base and a weather-grounded Saturday tempo in Colombo.'
  );
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [latestTrace, setLatestTrace] = useState<MultiAgentExecutionTrace | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // GitHub Agent State
  const [githubStatus, setGithubStatus] = useState<{
    connected: boolean;
    repoName?: string;
    owner?: string;
    defaultBranch?: string;
    lastCommitSha?: string;
    lastCommitMessage?: string;
    error?: string;
  } | null>(null);
  const [isCheckingGithub, setIsCheckingGithub] = useState<boolean>(false);
  const [commitFilePath, setCommitFilePath] = useState<string>('README.md');
  const [commitContent, setCommitContent] = useState<string>('# StrideClub Autonomous Update\n\nAutomated commit by StrideClub Multi-Agent Sync Engine.');
  const [commitMessage, setCommitMessage] = useState<string>('feat: autonomous sync from StrideClub Agent');
  const [isCommitting, setIsCommitting] = useState<boolean>(false);
  const [isBatchUploading, setIsBatchUploading] = useState<boolean>(false);

  // Social Poster Agent State
  const [socialTopic, setSocialTopic] = useState<string>('New 10K Personal Record achieved at 4:30/km pace in Colombo morning run!');
  const [socialPlatform, setSocialPlatform] = useState<'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'telegram' | 'whatsapp' | 'x'>('facebook');
  const [socialLanguage, setSocialLanguage] = useState<'sinhala' | 'english' | 'bilingual'>('bilingual');
  const [isGeneratingSocial, setIsGeneratingSocial] = useState<boolean>(false);
  const [socialDraft, setSocialDraft] = useState<any | null>(null);
  const [makeWebhookUrl, setMakeWebhookUrl] = useState<string>('');
  const [isDispatchingMake, setIsDispatchingMake] = useState<boolean>(false);

  const fetchWorkflowsAndTraces = async () => {
    try {
      setIsLoading(true);
      const [wfRes, traceRes] = await Promise.all([
        fetch('/api/agent/workflows'),
        fetch('/api/agent/traces'),
      ]);

      if (wfRes.ok) {
        const data = await wfRes.json();
        setWorkflows(data.workflows || []);
        if (!selectedWorkflow && data.workflows?.length > 0) {
          setSelectedWorkflow(data.workflows[0]);
          setSelectedNode(data.workflows[0].nodes[0] || null);
        }
      }

      if (traceRes.ok) {
        const traceData = await traceRes.json();
        setTraces(traceData.traces || []);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkGitHub = async () => {
    try {
      setIsCheckingGithub(true);
      const res = await fetch('/api/agent/github/status');
      const data = await res.json();
      setGithubStatus(data);
    } catch (err: any) {
      setGithubStatus({ connected: false, error: err.message });
    } finally {
      setIsCheckingGithub(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsAndTraces();
    checkGitHub();
  }, []);

  const handleRunReplitSolver = async () => {
    if (!userPrompt.trim()) return;
    try {
      setIsSolving(true);
      const res = await fetch('/api/agent/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt,
          athleteContext: {
            weeklyGoal: 35,
            targetPace: 5.0,
            city: 'Colombo',
            experience: 'Advanced Club Runner',
          },
        }),
      });

      if (!res.ok) throw new Error('Autonomous solver failed to execute');
      const data = await res.json();
      setLatestTrace(data.trace);
      setTraces((prev) => [data.trace, ...prev]);
      onNotify?.('Multi-Agent Planner, Tool Runner & Verifier executed successfully!', 'success');
    } catch (err: any) {
      onNotify?.(err.message || 'Execution error in Autonomous Solver', 'error');
    } finally {
      setIsSolving(false);
    }
  };

  const handleCommitToGitHub = async () => {
    if (!commitFilePath.trim() || commitContent === undefined) return;
    try {
      setIsCommitting(true);
      const res = await fetch('/api/agent/github/commit-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: commitFilePath,
          content: commitContent,
          commitMessage: commitMessage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onNotify?.(`Committed successfully to GitHub! Commit SHA: ${data.commitSha?.substring(0, 7)}`, 'success');
        checkGitHub();
      } else {
        throw new Error(data.error || 'Failed to commit file');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'GitHub Commit Error', 'error');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleBatchSyncToGitHub = async () => {
    try {
      setIsBatchUploading(true);
      const res = await fetch('/api/agent/github/upload-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [
            {
              path: 'README.md',
              content: `# StrideClub - Autonomous AI Running Platform\n\nCloud-Native Full-Stack Running Club & Biomechanics Platform.\n- **AI Engine:** Google Gemini 2.5 Flash\n- **Cloud DB:** Supabase PostgreSQL\n- **Host:** Vercel Serverless\n- **Autonomous Agent:** 24/7 GitHub Sync & Multi-Agent Planner.\n\n*Updated autonomously via StrideClub Agent on ${new Date().toUTCString()}*`,
            },
            {
              path: 'vercel.json',
              content: JSON.stringify({
                crons: [
                  {
                    path: '/api/agent/cycle',
                    schedule: '0 0 * * *',
                  },
                ],
              }, null, 2),
            },
          ],
          commitMessage: `chore(strideclub): autonomous batch sync ${new Date().toISOString().split('T')[0]}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onNotify?.(`Successfully synchronized batch files to GitHub repo!`, 'success');
        checkGitHub();
      } else {
        throw new Error(data.error || 'Failed to sync batch files');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'GitHub Batch Sync Error', 'error');
    } finally {
      setIsBatchUploading(false);
    }
  };

  const handleGenerateSocialPost = async () => {
    try {
      setIsGeneratingSocial(true);
      const res = await fetch('/api/agent/social/generate-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: socialTopic,
          platform: socialPlatform,
          language: socialLanguage,
          workoutMilestone: {
            distanceKm: 10,
            pace: '4:30/km',
            athleteName: 'Pasiya Max Runner',
          },
        }),
      });

      const data = await res.json();
      if (data.draft) {
        setSocialDraft(data.draft);
        onNotify?.('Viral social media post generated by Gemini Agent!', 'success');
      } else {
        throw new Error(data.error || 'Failed to generate post draft');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Social Agent Generation Error', 'error');
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const handleDispatchToMake = async () => {
    if (!makeWebhookUrl.trim() || !socialDraft) {
      onNotify?.('Please enter a Make.com webhook URL and generate a post first', 'error');
      return;
    }

    try {
      setIsDispatchingMake(true);
      const res = await fetch('/api/agent/social/dispatch-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: makeWebhookUrl,
          post: socialDraft,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onNotify?.('Dispatched to Make.com free tier webhook successfully!', 'success');
      } else {
        throw new Error(data.message || 'Dispatch failed');
      }
    } catch (err: any) {
      onNotify?.(err.message || 'Webhook Dispatch Error', 'error');
    } finally {
      setIsDispatchingMake(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onNotify?.('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'trigger':
        return 'from-purple-500/20 to-indigo-500/10 border-purple-500/40 text-purple-400';
      case 'agent':
        return 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400';
      case 'tool':
        return 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400';
      case 'condition':
        return 'from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400';
      case 'sink':
        return 'from-rose-500/20 to-pink-500/10 border-rose-500/40 text-rose-400';
      default:
        return 'from-zinc-800 to-zinc-900 border-zinc-700 text-zinc-300';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'trigger':
        return <Zap className="w-4 h-4 text-purple-400" />;
      case 'agent':
        return <Bot className="w-4 h-4 text-amber-400" />;
      case 'tool':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'condition':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'sink':
        return <Database className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-zinc-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Autonomous Multi-Agent Platform (Supabase & Vercel Native)
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-100 flex items-center gap-3">
              <Workflow className="w-8 h-8 text-amber-500" />
              Autonomous Agent Studio & DAG Workflows
            </h1>
            <p className="text-sm md:text-base text-zinc-400 max-w-3xl leading-relaxed">
              Orchestrate multi-agent athletic intelligence with dynamic DAG execution, GitHub repo sync, Make.com social auto-poster,
              and native triggers for Supabase Free Tier and Vercel Serverless.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/export/make-blueprint"
              download="make-social-autoposter-blueprint.json"
              className="px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-medium text-xs flex items-center gap-2 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Make.com Blueprint
            </a>
            <button
              onClick={fetchWorkflowsAndTraces}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 transition-colors"
              title="Refresh Workflows"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 mt-6 pt-6 border-t border-zinc-800/80 overflow-x-auto">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'canvas'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Workflow className="w-3.5 h-3.5" />
            Visual DAG Canvas
          </button>

          <button
            onClick={() => setActiveTab('playground')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'playground'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Multi-Agent Solver
          </button>

          <button
            onClick={() => setActiveTab('github')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'github'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Github className="w-3.5 h-3.5" />
            GitHub Repo Sync
          </button>

          <button
            onClick={() => setActiveTab('social')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'social'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Make.com Social Auto-Poster
          </button>

          <button
            onClick={() => setActiveTab('traces')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'traces'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Traces ({traces.length})
          </button>

          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
              activeTab === 'integrations'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Supabase & Vercel Setup
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL DAG CANVAS (N8N STYLE) */}
      {activeTab === 'canvas' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Workflows List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Active DAG Pipelines ({workflows.length})
            </h3>
            <div className="space-y-2">
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  onClick={() => {
                    setSelectedWorkflow(wf);
                    setSelectedNode(wf.nodes[0] || null);
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedWorkflow?.id === wf.id
                      ? 'bg-zinc-900 border-amber-500/50 shadow-md shadow-amber-500/5'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900/60 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                      {wf.category}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {wf.scheduleCron}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-100 mt-2">{wf.name}</h4>
                  <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{wf.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* DAG Canvas View */}
          <div className="lg:col-span-3 space-y-4">
            {selectedWorkflow && (
              <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <Workflow className="w-5 h-5 text-amber-500" />
                      {selectedWorkflow.name}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">{selectedWorkflow.description}</p>
                  </div>
                </div>

                {/* Nodes Workflow Flow */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {selectedWorkflow.nodes.map((node, index) => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-4 rounded-xl border bg-gradient-to-br transition-all cursor-pointer ${getNodeColor(
                        node.type
                      )} ${selectedNode?.id === node.id ? 'ring-2 ring-amber-400 scale-[1.02]' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-1.5 rounded-lg bg-zinc-950/40 border border-current">
                          {getNodeIcon(node.type)}
                        </span>
                        <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">
                          Step #{index + 1} • {node.type}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-zinc-100 mt-3">{node.name}</h4>
                      <p className="text-xs opacity-80 mt-1 line-clamp-2">{node.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MULTI-AGENT SOLVER (REPLIT STYLE) */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prompt & Solver Input */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-500" />
              Autonomous Lead Planner & Tool Execution
            </h2>
            <p className="text-xs text-zinc-400">
              Provide any custom athletic problem or training requirement. The Lead Planner will decompose it, execute tools, and verify with a Critic model.
            </p>

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={4}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              placeholder="Enter your athletic goal or query..."
            />

            <button
              onClick={handleRunReplitSolver}
              disabled={isSolving || !userPrompt.trim()}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-amber-500/10"
            >
              {isSolving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isSolving ? 'Decomposing & Executing Tools...' : 'Run Autonomous Multi-Agent Solver'}</span>
            </button>
          </div>

          {/* Trace Results */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Real-Time Verification & Plan Output
            </h3>

            {latestTrace ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                  <span className="text-emerald-400 font-bold font-mono">Status: {latestTrace.status.toUpperCase()}</span>
                  <span className="text-zinc-400 font-mono">{latestTrace.durationMs}ms</span>
                </div>
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 whitespace-pre-wrap font-mono text-[11px] text-zinc-300 max-h-72 overflow-y-auto">
                  {latestTrace.synthesizedSolution}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 text-xs">
                Run the solver on the left to see live plan decomposition and verification logs.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: GITHUB REPO SYNC AGENT */}
      {activeTab === 'github' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* GitHub Connection Status */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-zinc-900 text-white border border-zinc-800">
                  <Github className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">GitHub Repository Sync Agent</h3>
                  <p className="text-xs text-zinc-400">Autonomous commit & file sync via GitHub API</p>
                </div>
              </div>

              <button
                onClick={checkGitHub}
                disabled={isCheckingGithub}
                className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
                title="Check Connection"
              >
                <RefreshCw className={`w-4 h-4 ${isCheckingGithub ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {githubStatus?.connected ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs space-y-2 font-mono">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Connected to Repository: {githubStatus.owner}/{githubStatus.repoName}</span>
                </div>
                <div>Default Branch: <strong>{githubStatus.defaultBranch}</strong></div>
                {githubStatus.lastCommitSha && (
                  <div>Latest Commit: <strong>{githubStatus.lastCommitSha}</strong> - "{githubStatus.lastCommitMessage}"</div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>GitHub Token Configuration</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed">
                  To enable autonomous GitHub commits, set the following environment variables in your Vercel Project Settings or <code>.env</code>:
                </p>
                <div className="bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 font-mono text-[10px] text-zinc-200 space-y-1">
                  <div>GITHUB_ACCESS_TOKEN="ghp_yourPersonalAccessToken"</div>
                  <div>GITHUB_REPO="yourUsername/yourRepoName"</div>
                </div>
              </div>
            )}

            <div className="text-xs text-zinc-400 space-y-1.5 leading-relaxed">
              <p><strong>🔒 Security Guarantee:</strong> Your Personal Access Token is stored strictly server-side in Vercel / Supabase environment variables and is never leaked to the client browser.</p>
            </div>
          </div>

          {/* Autonomous Commit Form */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-500" />
              Commit / Push File to GitHub Repository
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 font-mono block mb-1">Target File Path in Repo</label>
                <input
                  type="text"
                  value={commitFilePath}
                  onChange={(e) => setCommitFilePath(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="e.g. README.md or src/config.json"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-mono block mb-1">Commit Message</label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. feat: update agent configurations"
                />
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-mono block mb-1">File Content to Commit</label>
                <textarea
                  value={commitContent}
                  onChange={(e) => setCommitContent(e.target.value)}
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
                  placeholder="Enter file text..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleCommitToGitHub}
                  disabled={isCommitting || !commitFilePath.trim()}
                  className="py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isCommitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
                  <span>{isCommitting ? 'Committing...' : 'Commit Single File'}</span>
                </button>

                <button
                  onClick={handleBatchSyncToGitHub}
                  disabled={isBatchUploading}
                  className="py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700 disabled:opacity-50 transition-all"
                >
                  {isBatchUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-400" />}
                  <span>{isBatchUploading ? 'Syncing Repo...' : 'Batch Sync Project Files'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MAKE.COM SOCIAL MEDIA AUTO-POSTER */}
      {activeTab === 'social' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Generator Input */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                <Share2 className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Make.com Social Auto-Poster Agent</h3>
                <p className="text-xs text-zinc-400">Generates viral posts & auto-publishes via Make.com Free Webhooks</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-zinc-400 font-mono block mb-1">Workout Milestone / Topic</label>
                <textarea
                  value={socialTopic}
                  onChange={(e) => setSocialTopic(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Broke 25 minutes in 5K running!"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-mono block mb-1">Platform</label>
                  <select
                    value={socialPlatform}
                    onChange={(e: any) => setSocialPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="facebook">📘 Facebook</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="youtube">▶️ YouTube Community</option>
                    <option value="telegram">📢 Telegram Channel</option>
                    <option value="whatsapp">💬 WhatsApp Group</option>
                    <option value="tiktok">🎵 TikTok</option>
                    <option value="x">🐦 X / Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-mono block mb-1">Language</label>
                  <select
                    value={socialLanguage}
                    onChange={(e: any) => setSocialLanguage(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200"
                  >
                    <option value="bilingual">🇱🇰 Sinhala + English (Recommended)</option>
                    <option value="sinhala">Sinhala Only</option>
                    <option value="english">English Only</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateSocialPost}
                disabled={isGeneratingSocial || !socialTopic.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/10"
              >
                {isGeneratingSocial ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{isGeneratingSocial ? 'Generating Post with Gemini...' : 'Generate Social Media Post'}</span>
              </button>
            </div>
          </div>

          {/* Post Draft & Make.com Webhook Dispatch */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Make.com Webhook Dispatcher
            </h3>

            {socialDraft ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-2">
                  <div className="font-bold text-zinc-200 whitespace-pre-wrap">{socialDraft.captionText}</div>
                  <div className="text-[11px] text-amber-400 font-mono">{socialDraft.hashtags?.join(' ')}</div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-mono block mb-1">Make.com Webhook URL (Free Tier)</label>
                  <input
                    type="text"
                    value={makeWebhookUrl}
                    onChange={(e) => setMakeWebhookUrl(e.target.value)}
                    placeholder="https://hook.eu1.make.com/your-free-webhook-id"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDispatchToMake}
                    disabled={isDispatchingMake || !makeWebhookUrl.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all"
                  >
                    {isDispatchingMake ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>Dispatch to Make.com Webhook</span>
                  </button>

                  <a
                    href="/api/export/make-blueprint"
                    download="make-social-autoposter-blueprint.json"
                    className="px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-xs flex items-center gap-1.5"
                    title="Download Scenario Blueprint"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Blueprint
                  </a>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-zinc-500 text-xs">
                Generate a social media post on the left to review the caption, hashtags, and dispatch it to Make.com!
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: LIVE EXECUTION TRACES */}
      {activeTab === 'traces' && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" />
              Multi-Agent Telemetry Stream
            </h2>
            <span className="text-xs text-zinc-400 font-mono">{traces.length} Total Traces Captured</span>
          </div>

          {traces.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No live execution traces recorded yet. Run a simulation in the Playground or trigger a workflow!
            </div>
          ) : (
            <div className="space-y-3">
              {traces.map((tr) => (
                <div
                  key={tr.executionId}
                  className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {tr.status.toUpperCase()}
                      </span>
                      <span className="text-sm font-bold text-zinc-200">{tr.workflowName}</span>
                    </div>
                    <div className="text-xs text-zinc-400 font-mono">
                      Trace ID: {tr.executionId} • Executed at: {new Date(tr.startedAt).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                    <div>
                      Tools: <strong className="text-zinc-200">{tr.toolExecutionLogs?.length || 0}</strong>
                    </div>
                    <div>
                      Duration: <strong className="text-amber-400">{tr.durationMs}ms</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: SUPABASE & VERCEL FREE TIER CONNECT */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supabase Free Tier Guide */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Database className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Supabase (PostgreSQL Free Tier)</h3>
                  <p className="text-xs text-zinc-400">100% Free Cloud Database Connection</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              To connect your free Supabase database with StrideClub, copy the database schema and paste it into the 
              <strong> Supabase SQL Editor</strong>.
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>DATABASE_URL format</span>
                <button
                  onClick={() =>
                    handleCopy('postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres', 'supabase-conn')
                  }
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {copiedKey === 'supabase-conn' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <code className="text-[11px] text-zinc-300 block font-mono break-all">
                postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
              </code>
            </div>

            <div className="text-xs text-zinc-400 space-y-1 font-mono">
              <div>✅ Auto Row-Level Security (RLS) configured</div>
              <div>✅ Auto UUID & PGCrypto extensions enabled</div>
              <div>✅ Schema file included in ZIP: `supabase/schema.sql`</div>
            </div>
          </div>

          {/* Vercel Free Tier Guide */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Vercel Serverless (Zero Config)</h3>
                  <p className="text-xs text-zinc-400">Zero-Config Serverless / Static Hosting</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              StrideClub includes a pre-configured <code>vercel.json</code> file with native Cron jobs to trigger autonomous agent cycles hourly without needing any external scheduler!
            </p>

            <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>Vercel Cron Orchestrator</span>
                <button
                  onClick={() =>
                    handleCopy('curl -X POST https://YOUR_APP_URL/api/cron/agent-orchestrator', 'curl-trigger')
                  }
                  className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {copiedKey === 'curl-trigger' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy
                </button>
              </div>
              <code className="text-[11px] text-zinc-300 block font-mono break-all">
                curl -X POST https://YOUR_APP_URL/api/cron/agent-orchestrator
              </code>
            </div>

            <div className="text-xs text-zinc-400 space-y-1 font-mono">
              <div>✅ `vercel.json` with hourly Crons included</div>
              <div>✅ Runs 100% on Vercel & Supabase Free Tiers</div>
              <div>✅ No n8n or paid tools required</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
