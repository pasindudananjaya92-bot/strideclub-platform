# 🏃‍♂️ STRIDECLUB — Enterprise-Grade Autonomous AI Platform (Supabase & Vercel Native)

An all-in-one athletic intelligence platform powered by **React 19**, **Tailwind CSS v4**, **Express Backend**, **Supabase / PostgreSQL Free Tier**, **Vercel Serverless**, **Firebase Auth**, and **Google Gemini 2.5 Flash Autonomous Multi-Agent Workflows**.

---

## 🌟 Autonomous Multi-Agent Capabilities (100% Free Tier Ready)

1. 🧠 **Multi-Agent Dynamic Orchestration (Replit & n8n Style)**:
   - **Lead Planner Agent**: Deconstructs user athletic goals into discrete multi-step sub-tasks.
   - **Dynamic Tool Execution Agent**: Runs Google Search Weather Grounding, Physiological VO2 Max Calculators, Strava Vault Decryptors, and Cloud Database Queries.
   - **Self-Correction & Critic Verifier**: Validates outputs against physiological constraints and automatically repairs discrepancies before committing state.

2. 🐙 **GitHub Repository Autonomous Sync Agent**:
   - Inspect files in your GitHub repository directly.
   - Perform autonomous code updates and commit changes directly to your GitHub repo using your `GITHUB_ACCESS_TOKEN`.
   - Token is stored strictly server-side in Vercel / `.env` variables for maximum security.

3. 📲 **Make.com Social Media Auto-Poster Agent**:
   - Uses Gemini to draft viral fitness content for Facebook, Instagram, TikTok, YouTube Community, Telegram, and WhatsApp.
   - Dispatches formatted posts and graphics via Make.com Free Webhooks.
   - Download the pre-built Make.com Blueprint (`make/make-social-autoposter-blueprint.json`) for 1-click import into Make.com!

4. 🤖 **Pasiya AI Polyglot Chatbot Bubble**:
   - Embedded interactive AI Assistant with **100% comprehensive knowledge** of all StrideClub features (AI Coach, Logbook, Leaderboard, Events, Integrations, GitHub Sync, Make.com Auto-Poster).
   - **Polyglot Multi-Lingual Engine**: Automatically detects and responds in **Sinhala (සිංහල)**, **English**, **Tamil**, or any language the visitor uses!
   - Built-in Social Media Hub promoting all 13 official Pasiya Max community channels.

5. 🐘 **Supabase Free Tier & Vercel Native Execution (No n8n Required)**:
   - Runs autonomously on **Supabase Free Tier (PostgreSQL)** + **Vercel Serverless Crons** (`vercel.json`) with zero hosting cost.

---

## 🚀 Local Quickstart (1-Click Run)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in your root folder:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
ENCRYPTION_SECRET="running-club-secure-vault-key-2026"

# Optional Supabase Database Connection (Free Tier):
# DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# Optional GitHub Repository Sync Token:
# GITHUB_ACCESS_TOKEN="ghp_yourPersonalAccessToken"
# GITHUB_REPO="yourUsername/yourRepoName"
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🐘 Supabase Free Tier Setup (Zero Cost)

1. Create a free project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` from this project, paste the content into Supabase SQL Editor, and click **Run**.
4. In your `.env` or Vercel Environment Variables, set:
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"
   ```

---

## ▲ Vercel Deployment (Free Tier with Native Crons)

This repository includes a native `vercel.json` file configured with hourly crons. To deploy to Vercel:
```bash
npx vercel
```
In your Vercel Project Settings > Environment Variables, add:
- `GEMINI_API_KEY`
- `ENCRYPTION_SECRET`
- `DATABASE_URL` (Supabase connection string)
- `GITHUB_ACCESS_TOKEN` (optional for GitHub sync)
- `GITHUB_REPO` (optional for GitHub sync)

---

## 🐙 GitHub Repository Sync Setup

1. Generate a GitHub Personal Access Token (Classic or Fine-grained) with `repo` read/write permissions at [github.com/settings/tokens](https://github.com/settings/tokens).
2. Add `GITHUB_ACCESS_TOKEN="ghp_..."` and `GITHUB_REPO="yourUsername/yourRepo"` in your Vercel Environment Variables.
3. In the **AI Studio > GitHub Repo Sync** tab, you can now view repo status and commit files autonomously!

---

## 📲 Make.com Social Media Auto-Poster Setup

1. Create a free account at [make.com](https://make.com).
2. Create a new Scenario and click **Import Blueprint**.
3. Select `make/make-social-autoposter-blueprint.json` from this project.
4. Copy your Make.com Webhook URL and paste it into the **AI Studio > Make.com Social Auto-Poster** tab.

---

## 📲 Official Pasiya Max Social Media & Community Links

1️⃣ 📸 **Instagram:** https://www.instagram.com/pasindu5598  
2️⃣ 📘 **Facebook:** https://www.facebook.com/share/18xRGhYVUo/  
3️⃣ 🌐 **Blog:** https://mamageblog.blogspot.com  
4️⃣ ▶️ **YouTube:** https://youtube.com/@pasya  
5️⃣ 💬 **WhatsApp Channel:** https://whatsapp.com/channel/0029VaPASIAMAX  
6️⃣ 💬 **WhatsApp Group:** https://chat.whatsapp.com/KjhsWakBQoUI4SEEvZXAsO  
7️⃣ 📱 **Imo:** https://s.imoim.net/KNdKwX?ISCI=001102  
8️⃣ 🎵 **TikTok:** https://tiktok.com/@pasindudananjaya619  
9️⃣ 💼 **LinkedIn Profile:** https://linkedin.com/in/pasindu-dananjaya-41044831b  
🔟 💼 **LinkedIn Group:** https://www.linkedin.com/groups/22101008  
1️⃣1️⃣ 🐦 **X / Twitter:** https://x.com/PasinduDan98554  
1️⃣2️⃣ 💜 **Viber Channel:** https://invite.viber.com/?g2=AQBWlEwa%2BDKVDFaaTbesR5FqD2IQZhFjhhQdN%2Fvdsaml9xVUCL8RnDHcFy6kno0U  
1️⃣3️⃣ 📢 **Telegram Channel:** https://t.me/goldenbotmdchannel  

---
❤️ *Please support and follow us on all platforms!*
