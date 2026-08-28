import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserIntegrationItem } from '../types.ts';
import {
  PlugZap,
  Shield,
  Lock,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  Key,
  Globe,
  Radio,
  Check,
} from 'lucide-react';

interface PredefinedService {
  name: string;
  label: string;
  category: 'Athletics' | 'Automation' | 'Cloud Database' | 'Deployment' | 'Messaging';
  iconUrl?: string;
  description: string;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url';
    placeholder: string;
    helpText: string;
    required: boolean;
  }>;
}

const PREDEFINED_SERVICES: PredefinedService[] = [
  {
    name: 'strava',
    label: 'Strava API Access',
    category: 'Athletics',
    description: 'Auto-sync GPS running activities, segments, and kudos directly from your Strava account.',
    fields: [
      {
        key: 'apiKey',
        label: 'Strava Personal Access Token / API Key',
        type: 'password',
        placeholder: 'e.g. 7f9a8b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        helpText: 'Generated in Strava Settings -> My API Application.',
        required: true,
      },
    ],
  },
  {
    name: 'n8n',
    label: 'n8n Workflow Webhook',
    category: 'Automation',
    description: 'Trigger autonomous club notification workflows, email weekly digests, and send pace alerts.',
    fields: [
      {
        key: 'endpointUrl',
        label: 'n8n Production Webhook URL',
        type: 'url',
        placeholder: 'https://n8n.your-domain.com/webhook/running-club-event',
        helpText: 'Target webhook node in your self-hosted or cloud n8n instance.',
        required: true,
      },
      {
        key: 'apiKey',
        label: 'Header Auth Token (Optional)',
        type: 'password',
        placeholder: 'Bearer token or API Secret',
        helpText: 'Sent in Authorization header to authenticate requests.',
        required: false,
      },
    ],
  },
  {
    name: 'vercel',
    label: 'Vercel Deployment Token',
    category: 'Deployment',
    description: 'Trigger instant frontend redeployments and access preview builds across staging environments.',
    fields: [
      {
        key: 'apiKey',
        label: 'Vercel Personal Access Token',
        type: 'password',
        placeholder: 'e.g. vercel_pat_abcdef1234567890',
        helpText: 'Created under Vercel Account Settings -> Tokens.',
        required: true,
      },
    ],
  },
  {
    name: 'supabase',
    label: 'Supabase Database & Storage',
    category: 'Cloud Database',
    description: 'Mirror club running datasets, GPX telemetry, and export telemetry to personal Postgres tables.',
    fields: [
      {
        key: 'endpointUrl',
        label: 'Supabase Project URL',
        type: 'url',
        placeholder: 'https://xyzcompany.supabase.co',
        helpText: 'Found in your Supabase project API settings.',
        required: true,
      },
      {
        key: 'apiKey',
        label: 'Supabase Anon / Service Key',
        type: 'password',
        placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        helpText: 'Encrypted with AES-256-GCM before DB persistence.',
        required: true,
      },
    ],
  },
  {
    name: 'garmin',
    label: 'Garmin Connect / Smartwatch',
    category: 'Athletics',
    description: 'Stream heart rate zones, VO2 max metrics, and cadence data directly from Garmin wearables.',
    fields: [
      {
        key: 'endpointUrl',
        label: 'Garmin Webhook Endpoint / API URL',
        type: 'url',
        placeholder: 'https://connect.garmin.com/oauth-service',
        helpText: 'Garmin Developer health API endpoint.',
        required: true,
      },
      {
        key: 'apiKey',
        label: 'Consumer Key / Bearer Token',
        type: 'password',
        placeholder: 'garmin_consumer_key_xyz',
        helpText: 'Provided in Garmin developer portal.',
        required: true,
      },
    ],
  },
  {
    name: 'discord',
    label: 'Discord / Slack Webhook',
    category: 'Messaging',
    description: 'Broadcast personal milestones, weekly mileage goals, and club podium wins to your channel.',
    fields: [
      {
        key: 'endpointUrl',
        label: 'Discord / Slack Incoming Webhook URL',
        type: 'url',
        placeholder: 'https://discord.com/api/webhooks/1234567890/abcdefg...',
        helpText: 'Webhook URL generated from channel integration settings.',
        required: true,
      },
    ],
  },
];

export const IntegrationsView: React.FC = () => {
  const { user, signIn, getAuthHeaders } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<PredefinedService | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<number, { loading: boolean; message: string; success?: boolean }>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchIntegrations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const res = await fetch('/api/integrations', { headers });
      if (res.ok) {
        const json = await res.json();
        setIntegrations(json.integrations || []);
      }
    } catch (err) {
      console.error('Error fetching integrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [user]);

  const handleOpenForm = (svc: PredefinedService) => {
    setSelectedService(svc);
    setFormData({});
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSaveIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;

    try {
      setSaving(true);
      setErrorMessage('');
      const headers = await getAuthHeaders();

      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName: selectedService.name,
          serviceLabel: selectedService.label,
          apiKey: formData.apiKey || undefined,
          apiSecret: formData.apiSecret || undefined,
          endpointUrl: formData.endpointUrl || undefined,
          configData: { category: selectedService.category },
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save integration');
      }

      setSuccessMessage(`${selectedService.label} connected and encrypted in Cloud SQL!`);
      setSelectedService(null);
      await fetchIntegrations();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving integration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/integrations/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setIntegrations((prev) => prev.filter((i) => i.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete integration:', err);
    }
  };

  const handleTestConnection = async (id: number) => {
    setTestStatus((prev) => ({ ...prev, [id]: { loading: true, message: 'Testing connection...' } }));

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/integrations/${id}/test`, {
        method: 'POST',
        headers,
      });

      const data = await res.json();
      setTestStatus((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          message: data.message || 'Test completed',
          success: data.success,
        },
      }));
    } catch (err: any) {
      setTestStatus((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          message: err.message || 'Connection test failed',
          success: false,
        },
      }));
    }
  };

  return (
    <div id="integrations-hub-container" className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>Encrypted Developer & Athlete Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Integrations & Webhook Vault
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Connect your own developer tokens, automation webhooks, and athletic accounts. All secrets are encrypted using <strong className="text-emerald-400 font-mono">AES-256-GCM</strong> and saved directly into Google Cloud SQL PostgreSQL linked to your Google ID.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700 text-xs font-mono text-emerald-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Plaintext Storage</span>
            </div>
            <span className="text-[11px] text-slate-400">Database: asia-southeast1</span>
          </div>
        </div>
      </div>

      {/* Auth state check */}
      {!user ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
            <PlugZap className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Sign In to Manage Your Integrations</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Visitors can log in with Google to securely store external API keys and dispatch automated club webhook events to personal workflows.
          </p>
          <button
            onClick={signIn}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-lg active:scale-95"
          >
            Sign In with Google
          </button>
        </div>
      ) : (
        <>
          {/* Active Connected Services Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span>Your Connected Services ({integrations.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Live webhooks and encrypted credentials in Cloud SQL</p>
              </div>

              <button
                onClick={fetchIntegrations}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Refresh Integrations"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400 text-xs">Loading encrypted keys...</div>
            ) : integrations.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs bg-slate-950/40 rounded-xl border border-slate-800/80">
                No integrations connected yet. Select a service below to add your API Key or Webhook URL!
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {integrations.map((item) => {
                  const status = testStatus[item.id];
                  return (
                    <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-bold text-white">{item.serviceLabel}</h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                          {item.maskedKey && (
                            <span className="flex items-center space-x-1">
                              <Key className="w-3 h-3 text-emerald-400" />
                              <span>{item.maskedKey}</span>
                            </span>
                          )}
                          {item.endpointUrl && (
                            <span className="flex items-center space-x-1 text-slate-300 truncate max-w-xs">
                              <Globe className="w-3 h-3 text-emerald-400" />
                              <span className="truncate">{item.endpointUrl}</span>
                            </span>
                          )}
                        </div>
                        {status && (
                          <div
                            className={`text-xs mt-1 font-medium ${
                              status.success ? 'text-emerald-400' : 'text-amber-400'
                            }`}
                          >
                            {status.message}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleTestConnection(item.id)}
                          disabled={status?.loading}
                          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{status?.loading ? 'Testing...' : 'Test Ping'}</span>
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Disconnect"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Available Services Catalog */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <PlugZap className="w-5 h-5 text-emerald-400" />
                <span>Available Services & APIs</span>
              </h2>
              <p className="text-xs text-slate-400">Choose a service to configure your credentials or webhooks</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PREDEFINED_SERVICES.map((svc) => {
                const isAlreadyConnected = integrations.some(
                  (i) => i.serviceName.toLowerCase() === svc.name.toLowerCase()
                );

                return (
                  <div
                    key={svc.name}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                          {svc.category}
                        </span>

                        {isAlreadyConnected && (
                          <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Connected</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-white">{svc.label}</h3>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{svc.description}</p>
                    </div>

                    <button
                      onClick={() => handleOpenForm(svc)}
                      className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs border border-slate-700 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{isAlreadyConnected ? 'Update Keys' : 'Connect Service'}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Modal / Slide-over Form to add/update Integration */}
          {selectedService && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      <PlugZap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">Connect {selectedService.label}</h3>
                      <p className="text-xs text-slate-400">{selectedService.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedService(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300">
                    {errorMessage}
                  </div>
                )}

                <form onSubmit={handleSaveIntegration} className="space-y-4">
                  {selectedService.fields.map((field) => (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        {field.label} {field.required && <span className="text-emerald-400">*</span>}
                      </label>
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formData[field.key] || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, [field.key]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-500">{field.helpText}</p>
                    </div>
                  ))}

                  <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 flex items-start space-x-2 text-[11px] text-slate-400">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Tokens are encrypted with AES-256-GCM prior to Cloud SQL insertion. Only automated background runners can access them.
                    </span>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                      {saving ? 'Encrypting & Saving...' : 'Save Integration'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
