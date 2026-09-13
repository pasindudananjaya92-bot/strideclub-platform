# STRIDECLUB

Autonomous AI running-club platform for logging runs, club events, coaching tips, and multi-agent workflows.

**Live (SnapDeploy):** [strideclub-platform-6b71a.containers.snapdeploy.app](https://strideclub-platform-6b71a.containers.snapdeploy.app)

---

## What it does

- **Dashboard & Logbook** — log runs to PostgreSQL (Supabase)
- **Club Events** — schedule group runs, RSVP, reminder agent path
- **Pasiya AI Coach** — chat + multimodal vision (Gemini free tier)
- **Agent Logs** — telemetry for coach, moderator, events, data-sync, orchestrator
- **AI Studio** — multi-agent playground + GitHub repo sync agent
- **Integrations vault** — encrypted credentials store (honest sync; no fake Strava runs)
- **Auth** — Firebase Google Sign-In (optional); demo user fallback when logged out

---

## Stack (actual)

| Layer | Technology |
|--------|------------|
| Frontend | React 19, Vite, Tailwind CSS |
| Backend | Node.js, Express (TypeScript) |
| Database | Supabase PostgreSQL + Drizzle ORM |
| Auth | Firebase Auth (Google) |
| AI | Google Gemini (`gemini-2.0-flash-lite` free tier) |
| Hosting | SnapDeploy (free tier; may sleep) |
| Optional | Make.com webhooks for social dispatch |

> Not a Next.js / Vercel-only app. Older Vercel deployment badges on GitHub may show failed history and can be ignored if you run on SnapDeploy.

---

## Local development

```bash
git clone https://github.com/pasindudananjaya92-bot/strideclub-platform.git
cd strideclub-platform
npm install
cp .env.example .env   # if present — or set env vars manually
npm run dev 
