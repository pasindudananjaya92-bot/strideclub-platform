export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  displayName: string;
  photoUrl: string | null;
  bio?: string | null;
  city?: string | null;
  shoeModel?: string | null;
  unitPreference?: string;
  weeklyGoalKm?: number;
  targetPaceMinPerKm?: number;
  createdAt?: string;
}

export interface RunItem {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  distanceKm: number;
  durationSeconds: number;
  runDate: string; // YYYY-MM-DD
  paceMinPerKm: number;
  notes?: string | null;
  surfaceType?: string | null;
  createdAt?: string;
}

export interface LeaderboardUser {
  userId: number;
  uid: string;
  displayName: string;
  email: string;
  photoUrl: string | null;
  totalDistanceKm: number;
  totalRuns: number;
  totalDurationSeconds: number;
  avgPaceMinPerKm: number;
  longestRunKm: number;
  fastestPaceMinPerKm: number;
}

export interface ClubStatsData {
  totalKm: number;
  totalRuns: number;
  totalSeconds: number;
  avgPace: number;
  totalMembers: number;
  recentActivity: Array<{
    id: number;
    title: string;
    distanceKm: number;
    durationSeconds: number;
    runDate: string;
    paceMinPerKm: number;
    surfaceType: string;
    runnerName: string;
    runnerPhoto: string | null;
    userUid: string;
    createdAt: string;
  }>;
}

export interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progressPercent: number;
  unlockedAt?: string;
}

export interface WeeklyTrendPoint {
  weekLabel: string;
  startDate: string;
  distanceKm: number;
  avgPace: number;
  runsCount: number;
  targetKm: number;
}

export interface TrainingDayPlan {
  day: string; // 'Monday', 'Tuesday', etc.
  workoutType: 'Easy Run' | 'Intervals' | 'Tempo Run' | 'Long Run' | 'Recovery' | 'Rest / Mobility' | 'Strides';
  distanceKm: number;
  targetPace: string;
  focus: string;
  instructions: string;
}

export interface TrainingPlanData {
  weekStarting: string;
  coachSummary: string;
  weeklyTargetKm: number;
  keyWorkouts: string[];
  days: TrainingDayPlan[];
  recoveryTip: string;
  generatedAt: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  userUid: string;
  title: string;
  message: string;
  type: 'ai_coach_plan' | 'moderation_warning' | 'event_reminder' | 'data_sync' | 'system';
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface ClubEventItem {
  id: number;
  title: string;
  description: string;
  location: string;
  eventDate: string; // YYYY-MM-DD
  eventTime: string; // e.g. "07:00 AM"
  distanceKm: number;
  paceCategory: string;
  reminderSent: boolean;
  createdByUid: string;
  createdAt: string;
  rsvpsCount: number;
  isRsvpCurrentUser?: boolean;
}

export interface AgentLogItem {
  id: number;
  systemName: string;
  actionType: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'skipped';
  metrics?: any;
  executedAt: string;
}

export interface AgentTelemetrySummary {
  autonomousModeEnabled: boolean;
  totalAgentExecutions: number;
  plansGeneratedTotal: number;
  postsScannedTotal: number;
  spamPostsDeletedTotal: number;
  eventRemindersSentTotal: number;
  stravaRunsSyncedTotal: number;
  lastRunTimestamp: string | null;
}

export interface DashboardData {
  user: UserProfile;
  stats: {
    totalKm: number;
    totalRuns: number;
    totalSeconds: number;
    avgPace: number;
    longestRunKm: number;
    currentWeeklyKm: number;
    weeklyGoalPercent: number;
    streakWeeks: number;
  };
  weeklyTrend: WeeklyTrendPoint[];
  notifications: NotificationItem[];
  badges: UserBadge[];
  connectedIntegrationsCount: number;
  recentRuns: Array<{
    id: number;
    title: string;
    distanceKm: number;
    durationSeconds: number;
    paceMinPerKm: number;
    runDate: string;
    surfaceType: string | null;
  }>;
}

export interface UserIntegrationItem {
  id: number;
  userId: number;
  userUid: string;
  serviceName: string;
  serviceLabel: string;
  maskedKey: string;
  endpointUrl: string | null;
  configData: any;
  isEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CommunityPostItem {
  id: number;
  userId: number;
  userUid: string;
  authorName: string;
  authorPhoto: string | null;
  title: string;
  content: string;
  category: string;
  likesCount: number;
  createdAt: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp?: string;
}

export type TimeFilterPeriod = 'all' | 'month' | 'week';

export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'agent' | 'tool' | 'condition' | 'sink';
  label: string;
  service: string;
  status: 'idle' | 'running' | 'success' | 'warning' | 'error';
  executionTimeMs?: number;
  inputPayload?: any;
  outputPayload?: any;
  error?: string;
}

export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface AgentWorkflowDefinition {
  id: string;
  name: string;
  category: 'coaching' | 'moderation' | 'sync' | 'events' | 'custom';
  description: string;
  scheduleCron?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  isEnabled: boolean;
  lastExecutionAt?: string;
  lastStatus?: 'success' | 'error' | 'idle';
}

export interface MultiAgentExecutionTrace {
  executionId: string;
  workflowId: string;
  workflowName: string;
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  status: 'success' | 'error' | 'in_progress';
  plannerOutput?: {
    goal: string;
    subTasks: Array<{ step: number; tool: string; reason: string }>;
  };
  toolExecutionLogs: Array<{
    step: number;
    toolName: string;
    input: any;
    output: any;
    durationMs: number;
    status: 'success' | 'error';
  }>;
  verifierOutput?: {
    passed: boolean;
    confidenceScore: number;
    correctionsApplied: boolean;
    critique: string;
  };
  finalOutput: any;
}

export type AppTab =
  | 'dashboard'
  | 'leaderboard'
  | 'logbook'
  | 'sports-science'
  | 'ai-coach'
  | 'events'
  | 'community'
  | 'integrations'
  | 'agent-logs'
  | 'agent-workflows'
  | 'settings'
  | 'deploy-guide';
