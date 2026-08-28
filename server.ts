import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import * as dotenv from 'dotenv';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { createRun, getUserRuns, deleteRun, getLeaderboard, getClubStats } from './src/db/runs.ts';
import { getUserByUid } from './src/db/users.ts';
import {
  getUserIntegrations,
  saveUserIntegration,
  deleteUserIntegration,
  testIntegrationWebhook,
} from './src/db/integrations.ts';
import {
  getCommunityPosts,
  createCommunityPost,
  likeCommunityPost,
} from './src/db/community.ts';
import { getUserDashboardData, updateUserProfile } from './src/db/dashboard.ts';
import { askAiCoach, fetchRunWeather, analyzeMultimodalMedia } from './src/services/gemini.ts';
import { streamProjectZip } from './src/utils/exportProject.ts';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from './src/db/notifications.ts';
import {
  getAllEvents,
  createClubEvent,
  toggleEventRsvp,
  seedDefaultEventsIfEmpty,
} from './src/db/events.ts';
import { getAgentLogs, getAgentTelemetrySummary } from './src/db/agentLogs.ts';
import {
  isAutonomousModeEnabled,
  setAutonomousModeEnabled,
} from './src/db/systemConfig.ts';
import {
  runAutoAiCoachSystem,
  runAutoCommunityModeratorSystem,
  runAutoEventsAndRemindersSystem,
  runAutoDataSyncSystem,
  runFullAutonomousCycle,
} from './src/services/autonomousEngine.ts';
import {
  DEFAULT_WORKFLOWS,
  executeAutonomousAgentSolver,
  getRecentExecutionTraces,
} from './src/services/multiAgentEngine.ts';
import {
  checkGitHubStatus,
  listGitHubFiles,
  commitFileToGitHub,
  uploadMultipleFilesToGitHub,
} from './src/services/githubAgent.ts';
import {
  PASIYA_MAX_SOCIAL_LINKS,
  generateSocialPost,
  dispatchToMakeWebhook,
} from './src/services/socialPosterAgent.ts';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON and URL-encoded request body parser with 50MB limit for Multimodal Photos/Videos
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Seed default club events if database is empty
  seedDefaultEventsIfEmpty().catch((err) => console.error('Error in seedDefaultEventsIfEmpty:', err));

  // API Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Export full project code zip for GitHub
  app.get('/api/export/project-zip', (req, res) => {
    try {
      streamProjectZip(res);
    } catch (err: any) {
      console.error('Export zip failed:', err);
      res.status(500).json({ error: 'Failed to create project ZIP' });
    }
  });

  // Get current authenticated user profile
  app.get('/api/auth/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getUserByUid(req.user!.uid);
      res.json({ user });
    } catch (error: any) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch user' });
    }
  });

  // User Dashboard & Badges
  app.get('/api/dashboard', requireAuth, async (req: AuthRequest, res) => {
    try {
      const dashboard = await getUserDashboardData(req.user!.uid);
      if (!dashboard) {
        return res.status(404).json({ error: 'User dashboard not found' });
      }
      res.json(dashboard);
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ error: error.message || 'Failed to load dashboard data' });
    }
  });

  // Update User Profile / Settings
  app.put('/api/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { displayName, bio, city, shoeModel, unitPreference, weeklyGoalKm, targetPaceMinPerKm } = req.body;
      const updated = await updateUserProfile(req.user!.uid, {
        displayName,
        bio,
        city,
        shoeModel,
        unitPreference,
        weeklyGoalKm: weeklyGoalKm ? parseFloat(weeklyGoalKm) : undefined,
        targetPaceMinPerKm: targetPaceMinPerKm ? parseFloat(targetPaceMinPerKm) : undefined,
      });
      res.json({ user: updated });
    } catch (error: any) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
  });

  // Get logged-in user's runs
  app.get('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userRuns = await getUserRuns(req.user!.uid);
      res.json({ runs: userRuns });
    } catch (error: any) {
      console.error('Error fetching user runs:', error);
      res.status(500).json({ error: error.message || 'Failed to load runs' });
    }
  });

  // Log a new run
  app.post('/api/runs', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, distanceKm, durationSeconds, runDate, notes, surfaceType } = req.body;

      if (!title || !distanceKm || !durationSeconds || !runDate) {
        return res.status(400).json({
          error: 'Missing required run fields: title, distanceKm, durationSeconds, runDate',
        });
      }

      const dist = parseFloat(distanceKm);
      const dur = parseInt(durationSeconds, 10);

      if (isNaN(dist) || dist <= 0) {
        return res.status(400).json({ error: 'Distance must be a positive number' });
      }
      if (isNaN(dur) || dur <= 0) {
        return res.status(400).json({ error: 'Duration must be greater than 0 seconds' });
      }

      // Calculate pace in minutes per km
      const paceMinPerKm = (dur / 60) / dist;

      const newRun = await createRun({
        userId: req.dbUser!.id,
        userUid: req.user!.uid,
        title: title.trim(),
        distanceKm: dist,
        durationSeconds: dur,
        runDate,
        paceMinPerKm,
        notes: notes ? notes.trim() : '',
        surfaceType: surfaceType || 'Road',
      });

      res.status(201).json({ run: newRun });
    } catch (error: any) {
      console.error('Error creating run:', error);
      res.status(500).json({ error: error.message || 'Failed to record run' });
    }
  });

  // Delete a run
  app.delete('/api/runs/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const runId = parseInt(req.params.id, 10);
      if (isNaN(runId)) {
        return res.status(400).json({ error: 'Invalid run ID' });
      }

      const success = await deleteRun(runId, req.user!.uid);
      if (!success) {
        return res.status(404).json({ error: 'Run not found or not owned by user' });
      }

      res.json({ success: true, message: 'Run deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting run:', error);
      res.status(500).json({ error: error.message || 'Failed to delete run' });
    }
  });

  // Public/Club Leaderboard
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const period = (req.query.period as 'all' | 'month' | 'week') || 'all';
      const leaderboard = await getLeaderboard(period);
      res.json({ leaderboard, period });
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      res.status(500).json({ error: error.message || 'Failed to load leaderboard' });
    }
  });

  // Club aggregated stats
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await getClubStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: error.message || 'Failed to load club statistics' });
    }
  });

  // --- USER NOTIFICATIONS (Pasiya AI Plans, Reminders, Moderation Warnings, Strava Sync) ---
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserNotifications(req.user!.uid);
      res.json({ notifications: list });
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
  });

  app.put('/api/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await markNotificationAsRead(id, req.user!.uid);
      res.json({ notification: updated });
    } catch (error: any) {
      console.error('Error marking notification read:', error);
      res.status(500).json({ error: error.message || 'Failed to update notification' });
    }
  });

  app.put('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
    try {
      await markAllNotificationsAsRead(req.user!.uid);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications read:', error);
      res.status(500).json({ error: error.message || 'Failed to update notifications' });
    }
  });

  // --- CLUB EVENTS & RSVPS (System 3) ---
  app.get('/api/events', async (req, res) => {
    try {
      const userUid = (req.query.userUid as string) || undefined;
      const events = await getAllEvents(userUid);
      res.json({ events });
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: error.message || 'Failed to load club events' });
    }
  });

  app.post('/api/events', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, description, location, eventDate, eventTime, distanceKm, paceCategory } = req.body;
      if (!title || !description || !location || !eventDate || !eventTime) {
        return res.status(400).json({ error: 'Title, description, location, date, and time are required' });
      }

      const newEvent = await createClubEvent({
        title,
        description,
        location,
        eventDate,
        eventTime,
        distanceKm: distanceKm ? parseFloat(distanceKm) : 10,
        paceCategory,
        createdByUid: req.user!.uid,
      });

      res.status(201).json({ event: newEvent });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message || 'Failed to create event' });
    }
  });

  app.post('/api/events/:id/rsvp', requireAuth, async (req: AuthRequest, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      const result = await toggleEventRsvp(
        eventId,
        req.dbUser!.id,
        req.user!.uid,
        req.user!.displayName || req.dbUser?.displayName || 'Club Runner',
        req.user!.photoURL || req.dbUser?.photoUrl
      );
      res.json(result);
    } catch (error: any) {
      console.error('Error toggling RSVP:', error);
      res.status(500).json({ error: error.message || 'Failed to update RSVP' });
    }
  });

  // --- AUTONOMOUS AGENTS TELEMETRY & LOGS (System 5) ---
  app.get('/api/agent/logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 60;
      const systemFilter = (req.query.system as string) || undefined;
      const logs = await getAgentLogs(limit, systemFilter);
      res.json({ logs });
    } catch (error: any) {
      console.error('Error fetching agent logs:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve agent logs' });
    }
  });

  app.get('/api/agent/telemetry', async (req, res) => {
    try {
      const isEnabled = await isAutonomousModeEnabled();
      const summary = await getAgentTelemetrySummary(isEnabled);
      res.json(summary);
    } catch (error: any) {
      console.error('Error fetching agent telemetry:', error);
      res.status(500).json({ error: error.message || 'Failed to retrieve telemetry' });
    }
  });

  app.get('/api/agent/config', async (req, res) => {
    try {
      const enabled = await isAutonomousModeEnabled();
      res.json({ autonomousModeEnabled: enabled });
    } catch (error: any) {
      console.error('Error fetching agent config:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch agent config' });
    }
  });

  app.post('/api/agent/config', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { autonomousModeEnabled } = req.body;
      const updated = await setAutonomousModeEnabled(Boolean(autonomousModeEnabled));
      res.json({ autonomousModeEnabled: updated });
    } catch (error: any) {
      console.error('Error updating agent config:', error);
      res.status(500).json({ error: error.message || 'Failed to update agent config' });
    }
  });

  // --- MANUAL & CRON AUTONOMOUS SYSTEM TRIGGERS ---
  // System 1: Auto AI Coach
  app.post('/api/agent/trigger/ai-coach', async (req, res) => {
    try {
      const result = await runAutoAiCoachSystem();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error triggering AI Coach system:', error);
      res.status(500).json({ error: error.message || 'Failed to run AI Coach system' });
    }
  });

  // System 2: Auto Community Moderator
  app.post('/api/agent/trigger/community-moderator', async (req, res) => {
    try {
      const result = await runAutoCommunityModeratorSystem();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error triggering Community Moderator:', error);
      res.status(500).json({ error: error.message || 'Failed to run Community Moderator' });
    }
  });

  // System 3: Auto Events & Reminders
  app.post('/api/agent/trigger/events-reminders', async (req, res) => {
    try {
      const result = await runAutoEventsAndRemindersSystem();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error triggering Event Reminders:', error);
      res.status(500).json({ error: error.message || 'Failed to run Event Reminders' });
    }
  });

  // System 4: Auto Data Sync (Strava / n8n Webhook runner)
  app.post('/api/agent/trigger/data-sync', async (req, res) => {
    try {
      const result = await runAutoDataSyncSystem();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error triggering Data Sync:', error);
      res.status(500).json({ error: error.message || 'Failed to run Data Sync' });
    }
  });

  // System 5 / Full Cycle Cron
  app.post('/api/agent/trigger/full-cycle', async (req, res) => {
    try {
      const result = await runFullAutonomousCycle();
      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Error running full autonomous cycle:', error);
      res.status(500).json({ error: error.message || 'Failed to run autonomous cycle' });
    }
  });

  // --- REPLIT & N8N MULTI-AGENT ORCHESTRATION ENDPOINTS ---
  // List all DAG Workflows
  app.get('/api/agent/workflows', (req, res) => {
    res.json({ workflows: DEFAULT_WORKFLOWS });
  });

  // Replit-Style Multi-Agent Autonomous Problem Solver
  app.post('/api/agent/solve', async (req, res) => {
    try {
      const { prompt, athleteContext, userId } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const trace = await executeAutonomousAgentSolver({
        userPrompt: prompt.trim(),
        userId,
        athleteContext,
      });

      res.json({ trace });
    } catch (error: any) {
      console.error('Error in multi-agent solver:', error);
      res.status(500).json({ error: error.message || 'Failed to execute multi-agent solver' });
    }
  });

  // Live Multi-Agent Execution Traces
  app.get('/api/agent/traces', (req, res) => {
    const traces = getRecentExecutionTraces();
    res.json({ traces });
  });

  // --- GITHUB AUTONOMOUS AGENT ENDPOINTS ---
  // Check connection status to GitHub Repository
  app.get('/api/agent/github/status', async (req, res) => {
    try {
      const status = await checkGitHubStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ connected: false, error: error.message });
    }
  });

  // List repository directory files
  app.get('/api/agent/github/files', async (req, res) => {
    try {
      const dirPath = (req.query.path as string) || '';
      const files = await listGitHubFiles(dirPath);
      res.json({ files });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to list repository files' });
    }
  });

  // Direct autonomous single file commit/upload to GitHub repo
  app.post('/api/agent/github/commit-file', async (req, res) => {
    try {
      const { filePath, content, commitMessage, branch } = req.body;
      if (!filePath || content === undefined) {
        return res.status(400).json({ error: 'filePath and content are required' });
      }

      const result = await commitFileToGitHub({
        filePath,
        content,
        commitMessage: commitMessage || `Autonomous Agent: Update ${filePath}`,
        branch,
      });

      res.json(result);
    } catch (error: any) {
      console.error('GitHub commit error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Direct autonomous batch file upload to GitHub repo (Upload multiple selected files or whole project)
  app.post('/api/agent/github/upload-files', async (req, res) => {
    try {
      const { files, commitMessage, branch } = req.body;
      if (!files || !Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ error: 'Array of { filePath, content } files is required' });
      }

      const result = await uploadMultipleFilesToGitHub({
        files,
        commitMessage: commitMessage || `Autonomous Agent: Upload ${files.length} project files`,
        branch,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Batch GitHub upload error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // --- SOCIAL MEDIA AUTO-POSTER & MAKE.COM ENDPOINTS ---
  // Get official Pasiya Max social media links
  app.get('/api/agent/social/links', (req, res) => {
    res.json({ links: PASIYA_MAX_SOCIAL_LINKS });
  });

  // Generate viral social media draft with Gemini
  app.post('/api/agent/social/generate-post', async (req, res) => {
    try {
      const { topic, platform, language, workoutMilestone } = req.body;
      const draft = await generateSocialPost({
        topic: topic || 'New 10K Personal Record achieved at StrideClub!',
        platform,
        language,
        workoutMilestone,
      });
      res.json({ draft });
    } catch (error: any) {
      console.error('Error generating social post:', error);
      res.status(500).json({ error: error.message || 'Failed to generate social post' });
    }
  });

  // Dispatch post to Make.com free tier webhook
  app.post('/api/agent/social/dispatch-webhook', async (req, res) => {
    try {
      const { webhookUrl, post, imageUrl } = req.body;
      if (!webhookUrl || !post) {
        return res.status(400).json({ error: 'webhookUrl and post draft are required' });
      }

      const result = await dispatchToMakeWebhook({ webhookUrl, post, imageUrl });
      res.json(result);
    } catch (error: any) {
      console.error('Error dispatching to Make.com webhook:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Download Make.com Scenario Blueprint JSON
  app.get('/api/export/make-blueprint', (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'make', 'make-social-autoposter-blueprint.json');
      res.download(filePath, 'make-social-autoposter-blueprint.json');
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to download Make.com blueprint' });
    }
  });

  // --- VERCEL & SUPABASE CRON ORCHESTRATOR ENDPOINT ---
  // Can be called by Vercel Cron or Supabase pg_cron directly without n8n
  app.all('/api/cron/agent-orchestrator', async (req, res) => {
    try {
      const result = await runFullAutonomousCycle();
      res.json({
        success: true,
        triggeredBy: req.headers['user-agent'] || 'Vercel/Supabase-Cron',
        timestamp: new Date().toISOString(),
        result,
      });
    } catch (error: any) {
      console.error('Vercel/Supabase Cron Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // --- INTEGRATIONS HUB ENDPOINTS ---
  // List connected integrations
  app.get('/api/integrations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const list = await getUserIntegrations(req.user!.uid);
      res.json({ integrations: list });
    } catch (error: any) {
      console.error('Error fetching integrations:', error);
      res.status(500).json({ error: error.message || 'Failed to load integrations' });
    }
  });

  // Save / update an integration (encrypted before DB write)
  app.post('/api/integrations', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { serviceName, serviceLabel, apiKey, apiSecret, endpointUrl, configData } = req.body;
      if (!serviceName || !serviceLabel) {
        return res.status(400).json({ error: 'Service name and label are required' });
      }

      const saved = await saveUserIntegration({
        userId: req.dbUser!.id,
        userUid: req.user!.uid,
        serviceName: serviceName.trim().toLowerCase(),
        serviceLabel: serviceLabel.trim(),
        apiKey: apiKey?.trim(),
        apiSecret: apiSecret?.trim(),
        endpointUrl: endpointUrl?.trim(),
        configData,
      });

      res.status(201).json({ integration: saved });
    } catch (error: any) {
      console.error('Error saving integration:', error);
      res.status(500).json({ error: error.message || 'Failed to save integration' });
    }
  });

  // Delete an integration
  app.delete('/api/integrations/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const deleted = await deleteUserIntegration(id, req.user!.uid);
      if (!deleted) {
        return res.status(404).json({ error: 'Integration not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      res.status(500).json({ error: error.message || 'Failed to delete integration' });
    }
  });

  // Test integration connection / webhook ping
  app.post('/api/integrations/:id/test', requireAuth, async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const testResult = await testIntegrationWebhook(id, req.user!.uid);
      res.json(testResult);
    } catch (error: any) {
      console.error('Error testing integration:', error);
      res.status(500).json({ error: error.message || 'Failed to test integration' });
    }
  });

  // --- COMMUNITY DISCUSSION POSTS ---
  app.get('/api/community/posts', async (req, res) => {
    try {
      const posts = await getCommunityPosts();
      res.json({ posts });
    } catch (error: any) {
      console.error('Error fetching community posts:', error);
      res.status(500).json({ error: error.message || 'Failed to fetch posts' });
    }
  });

  app.post('/api/community/posts', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { title, content, category } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const post = await createCommunityPost({
        userId: req.dbUser!.id,
        userUid: req.user!.uid,
        authorName: req.user!.displayName || req.dbUser?.displayName || 'Club Athlete',
        authorPhoto: req.user!.photoURL || req.dbUser?.photoUrl || null,
        title,
        content,
        category: category || 'Discussion',
      });

      res.status(201).json({ post });
    } catch (error: any) {
      console.error('Error creating post:', error);
      res.status(500).json({ error: error.message || 'Failed to publish post' });
    }
  });

  app.post('/api/community/posts/:id/like', async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await likeCommunityPost(id);
      res.json({ post: updated });
    } catch (error: any) {
      console.error('Error liking post:', error);
      res.status(500).json({ error: error.message || 'Failed to like post' });
    }
  });

  // --- AI CLUB COACH (GEMINI API) ---
  app.post('/api/ai/coach', async (req, res) => {
    try {
      const { prompt, history, userContext } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const answer = await askAiCoach(prompt, history || [], userContext);
      res.json({ answer });
    } catch (error: any) {
      console.error('Error calling AI Coach:', error);
      res.status(500).json({
        error: error.message || 'AI Coach service encountered an issue',
        answer: 'Coach Tip: Take it step-by-step! Warm up with 5 minutes of dynamic stretches before picking up your stride.',
      });
    }
  });

  // --- MULTIMODAL PHOTO & VIDEO DEEP ANALYSIS (GEMINI 2.5 FLASH VISION) ---
  app.post('/api/ai/multimodal-analyze', async (req, res) => {
    try {
      const { mediaBase64, mimeType, userPrompt, analysisType } = req.body;
      if (!mediaBase64) {
        return res.status(400).json({ error: 'mediaBase64 is required for multimodal analysis.' });
      }

      const analysis = await analyzeMultimodalMedia({
        mediaBase64,
        mimeType: mimeType || 'image/jpeg',
        userPrompt,
        analysisType,
      });

      res.json({ success: true, analysis });
    } catch (error: any) {
      console.error('Multimodal Analysis Server Error:', error);
      res.status(500).json({
        error: error.message || 'Failed to analyze media',
        analysis: 'Coach Note: Unable to complete visual inspection right now. Please ensure image/video is clear and in a supported format.',
      });
    }
  });

  // --- GOOGLE SEARCH WEATHER LOOKUP FOR RUNS ---
  app.post('/api/weather/lookup', async (req, res) => {
    try {
      const { location, date } = req.body;
      if (!location || !date) {
        return res.status(400).json({ error: 'Location and date are required for weather search.' });
      }

      const result = await fetchRunWeather(location.trim(), date.trim());
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching weather:', error);
      res.status(500).json({
        error: error.message || 'Failed to fetch weather conditions',
      });
    }
  });

  // Vite development middleware or production static asset server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Running Club Platform server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
