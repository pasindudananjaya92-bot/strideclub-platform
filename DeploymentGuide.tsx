import React, { useState } from 'react';
import { Cloud, Check, Copy, Terminal, Database, Shield, Server, ArrowRight, ExternalLink, Cpu } from 'lucide-react';

export const DeploymentGuide: React.FC = () => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const steps = [
    {
      title: '1. Prerequisites & GCP Project Setup',
      desc: 'Install the Google Cloud CLI and set your target active project.',
      command: `# Login to Google Cloud
gcloud auth login

# Set your active GCP Project ID
gcloud config set project YOUR_PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable run.googleapis.com \\
  sqladmin.googleapis.com \\
  cloudbuild.googleapis.com \\
  secretmanager.googleapis.com`,
    },
    {
      title: '2. Prepare Cloud SQL PostgreSQL Connection',
      desc: 'Note down your Cloud SQL instance connection name (Format: PROJECT_ID:REGION:INSTANCE_NAME).',
      command: `# List your Cloud SQL instances in the region
gcloud sql instances list

# Create a dedicated database user if needed
gcloud sql users create app_user \\
  --instance=ai-studio-76afe49b \\
  --password=YOUR_SECURE_PASSWORD`,
    },
    {
      title: '3. Dockerfile Configuration',
      desc: 'This multi-stage Dockerfile builds both the Vite frontend bundle and compiles the Node.js/Express server.',
      command: `# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json
EXPOSE 3000
CMD ["node", "dist/server.cjs"]`,
    },
    {
      title: '4. Build & Deploy directly to Cloud Run',
      desc: 'Deploy the application container with Cloud SQL connection attached using Cloud Run native unix socket.',
      command: `# Build and deploy from source directly to Cloud Run
gcloud run deploy running-club-app \\
  --source . \\
  --region asia-southeast1 \\
  --platform managed \\
  --allow-unauthenticated \\
  --add-cloudsql-instances YOUR_PROJECT_ID:asia-southeast1:ai-studio-76afe49b \\
  --set-env-vars SQL_HOST=/cloudsql/YOUR_PROJECT_ID:asia-southeast1:ai-studio-76afe49b,\\
SQL_DB_NAME=postgres,\\
SQL_USER=app_user,\\
SQL_PASSWORD=YOUR_SECURE_PASSWORD`,
    },
    {
      title: '5. Automatic Schema Sync & Verification',
      desc: 'Verify the deployment health check and enjoy instant scale-to-zero serverless hosting.',
      command: `# Check Cloud Run service URL and live logs
gcloud run services describe running-club-app --region asia-southeast1 --format='value(status.url)'

# View live container stream logs
gcloud run services logs tail running-club-app --region asia-southeast1`,
    },
  ];

  return (
    <div id="deployment-guide-container" className="space-y-8 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="flex items-center space-x-3 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Cloud className="w-4 h-4" />
          <span>Production Architecture Guide</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Deploying Running Club to Cloud Run
        </h1>
        <p className="text-sm text-slate-300 mt-2 leading-relaxed">
          Follow this complete production deployment guide to containerize the full-stack Running Club app (React 19 + Express API + Drizzle ORM) and deploy to Google Cloud Run connected to your Cloud SQL PostgreSQL instance in <span className="font-mono text-emerald-400 font-bold">asia-southeast1</span>.
        </p>

        {/* Stack badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center space-x-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">React 19 + Vite</span>
              <span className="text-[10px] text-slate-400">Frontend Client</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <Server className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Express & Node 22</span>
              <span className="text-[10px] text-slate-400">Backend Server</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Cloud SQL Postgres</span>
              <span className="text-[10px] text-slate-400">Drizzle ORM</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Firebase Auth</span>
              <span className="text-[10px] text-slate-400">Google OAuth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Step by Step list */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-6 sm:p-7 hover:border-slate-700 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-base font-bold text-white">{step.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
              </div>

              <button
                onClick={() => copyCode(step.command, idx)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors shrink-0"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Terminal Box */}
            <div className="relative mt-3">
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                <code>{step.command}</code>
              </pre>
            </div>
          </div>
        ))}
      </div>

      {/* Cloud SQL Connection Details Info Box */}
      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-3xl p-6 text-emerald-100 shadow-lg">
        <h3 className="text-sm font-bold flex items-center space-x-2 text-emerald-300 mb-2">
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Cloud SQL Developer Free-Tier Benefits</span>
        </h3>
        <ul className="text-xs text-emerald-200/90 space-y-1.5 list-disc list-inside">
          <li><strong>Instant Provisioning:</strong> Created in ~2 seconds with Developer edition tier.</li>
          <li><strong>Scale-to-Zero:</strong> Automatically sleeps when inactive to minimize cloud costs.</li>
          <li><strong>Zero-config Connection:</strong> Cloud Run connects via native Unix domain socket <code className="bg-emerald-900/60 px-1 py-0.5 rounded font-mono text-emerald-300">/cloudsql/INSTANCE_CONNECTION_NAME</code> with zero public IP exposure.</li>
        </ul>
      </div>
    </div>
  );
};
