import { GoogleGenAI } from '@google/genai';
import { PASIYA_MAX_SOCIAL_LINKS } from './socialPosterAgent.ts';
import { isAdminEmail } from '../lib/admin.ts';

/**
 * 2.0-flash was shut down (2026-06-01).
 * Try lite first (better free-tier quota), then Google's replacement.
 */
const MODEL_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite',
];

let aiClient: GoogleGenAI | null = null;
let resolvedModel: string | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured');
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

function isQuotaError(error: any): boolean {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('429') ||
    msg.includes('resource_exhausted') ||
    msg.includes('quota') ||
    msg.includes('rate limit')
  );
}

function isModelMissingError(error: any): boolean {
  const msg = String(error?.message || error || '').toLowerCase();
  return (
    msg.includes('404') ||
    msg.includes('not found') ||
    msg.includes('no longer available') ||
    msg.includes('not supported')
  );
}

function stripBase64Prefix(raw: string): string {
  return String(raw || '').replace(/^data:[^;]+;base64,/, '');
}

type ChatTurn = {
  role?: string;
  text?: string;
  content?: string;
};

function isFounderContext(ctx?: Record<string, unknown>): boolean {
  if (!ctx) return false;
  if (ctx.isAdmin === true || ctx.isFounder === true || ctx.role === 'founder_admin') {
    return true;
  }
  return isAdminEmail(String(ctx.email || ''));
}

function identityInstruction(ctx?: Record<string, unknown>): string {
  if (isFounderContext(ctx)) {
    const name = String(ctx?.displayName || ctx?.name || 'Pasindu Dananjaya');
    const email = String(ctx?.email || 'Pasindudananjaya92@gmail.com');
    return `
FOUNDER MODE — mandatory:
The person chatting is ${name} <${email}>.
He is Pasiya Max: founder, owner, and administrator of this StrideClub platform.
Address him as the creator (Sinhala: නිර්මාතෘ / හිමිකරු). Never treat him as a random athlete.
On the first reply, greet him by that role, then answer the question.
Do not ask him to sign in. Do not say you cannot verify identity.`;
  }

  const guest = String(ctx?.displayName || 'club athlete');
  return `The user is a club athlete (${guest}). Be helpful. Do not call them the founder.`;
}

function toGeminiContents(history: ChatTurn[] = [], prompt: string): any[] {
  const items: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const h of history) {
    const text = String(h?.text ?? h?.content ?? '').trim();
    if (!text) continue;
    const role: 'user' | 'model' =
      h.role === 'model' || h.role === 'assistant' ? 'model' : 'user';
    items.push({ role, parts: [{ text }] });
  }

  while (items.length && items[0].role === 'model') {
    items.shift();
  }

  const promptText = String(prompt || '').trim();
  if (promptText) {
    items.push({ role: 'user', parts: [{ text: promptText }] });
  }

  if (!items.length) {
    items.push({
      role: 'user',
      parts: [{ text: 'Give a short running coach greeting.' }],
    });
  }

  return items;
}

async function generateWithRetry(
  contents: any,
  config: Record<string, unknown>,
  retries = 1
): Promise<string> {
  const ai = getGenAI();
  const normalized =
    typeof contents === 'string'
      ? [{ role: 'user', parts: [{ text: contents }] }]
      : contents;

  const models = resolvedModel
    ? [resolvedModel, ...MODEL_CANDIDATES.filter((m) => m !== resolvedModel)]
    : [...MODEL_CANDIDATES];

  let lastError: any;

  for (const model of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: normalized,
          config,
        });
        resolvedModel = model;
        return (response.text || '').trim();
      } catch (err: any) {
        lastError = err;
        if (isModelMissingError(err)) {
          break;
        }
        if (isQuotaError(err) && attempt < retries) {
          await new Promise((r) => setTimeout(r, 45000));
          continue;
        }
        throw err;
      }
    }
  }

  throw lastError;
}

export async function askAiCoach(
  prompt: string,
  history: ChatTurn[] = [],
  userContext?: Record<string, unknown>
): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return 'AI Coach is in offline demo mode. Please ensure GEMINI_API_KEY is configured on the server.';
    }

    let finalPrompt = String(prompt || '').trim();
    if (userContext && Object.keys(userContext).length) {
      finalPrompt += `\n\nSession identity (JSON): ${JSON.stringify(userContext)}`;
    }

    const systemInstruction = `You are Pasiya AI, the official endurance running coach of StrideClub and assistant of Pasiya Max.
Be practical, motivating, and science-based (80/20 easy miles, polarized training).
Answer in the user's language (Sinhala or English). Keep answers clear and actionable.
Never reply with a generic canned "Coach Tip" sentence. Always answer the actual question.
${identityInstruction(userContext)}
Official links when relevant:
- YouTube: ${PASIYA_MAX_SOCIAL_LINKS.youtube}
- Instagram: ${PASIYA_MAX_SOCIAL_LINKS.instagram}
- Facebook: ${PASIYA_MAX_SOCIAL_LINKS.facebook}`;

    const text = await generateWithRetry(toGeminiContents(history, finalPrompt), {
      systemInstruction,
      temperature: 0.7,
    });

    return text || 'I could not generate a response. Please try again.';
  } catch (error: any) {
    console.error('AI Coach error:', error);
    if (isQuotaError(error)) {
      return 'AI free-tier quota is resting. Please wait about a minute and try a shorter question, or try again tomorrow if the daily limit is used.';
    }
    const detail = String(error?.message || error || 'unknown error').slice(0, 180);
    return `Pasiya AI could not complete that reply (${detail}). Try again in a moment.`;
  }
}

export async function analyzeMultimodalMedia(params: {
  prompt?: string;
  userPrompt?: string;
  imageBase64?: string;
  mediaBase64?: string;
  mimeType?: string;
  analysisType?: string;
  userContext?: Record<string, unknown>;
}): Promise<string> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return 'Vision AI offline — GEMINI_API_KEY missing.';
    }

    const prompt = String(
      params.userPrompt || params.prompt || 'Analyze this running-related media and coach me.'
    ).trim();
    const raw = params.mediaBase64 || params.imageBase64 || '';
    const mimeType = params.mimeType || 'image/jpeg';
    const analysisType = params.analysisType || 'general';

    const parts: any[] = [
      {
        text: `Analysis type: ${analysisType}\n\n${prompt}`,
      },
    ];
    if (raw) {
      parts.push({
        inlineData: {
          data: stripBase64Prefix(raw),
          mimeType,
        },
      });
    }

    const text = await generateWithRetry([{ role: 'user', parts }], {
      systemInstruction: `You are Pasiya AI Vision for runners. Analyze running form, shoes, watch screens, and training notes. Be specific and practical. Reply in the user language.
${identityInstruction(params.userContext)}`,
      temperature: 0.4,
    });

    return text || 'No vision analysis returned.';
  } catch (error: any) {
    console.error('Vision AI error:', error);
    if (isQuotaError(error)) {
      return 'Vision quota resting — retry in about a minute.';
    }
    const detail = String(error?.message || error || 'unknown error').slice(0, 180);
    return `Vision analysis failed (${detail}). Try a smaller photo.`;
  }
}

export async function fetchRunWeather(location: string, date: string): Promise<{
  summary: string;
  location: string;
  date: string;
  tempC?: number;
  conditions?: string;
  humidity?: string;
  wind?: string;
  runAdvice?: string;
  sources?: Array<{ title: string; url: string }>;
}> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        summary: 'Weather offline (no API key). Check GEMINI_API_KEY on SnapDeploy.',
        location,
        date,
        sources: [],
      };
    }

    const prompt = `Give a short running-focused weather summary for "${location}" on ${date}.
Respond with JSON only (no markdown):
{"location":"...","date":"...","tempC":28,"conditions":"Partly cloudy","humidity":"70%","wind":"12 km/h","runAdvice":"Good for easy run; hydrate."}`;

    const text = await generateWithRetry(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const clean = (text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    let parsed: any = {};
    try {
      parsed = JSON.parse(clean);
    } catch {
      const fallback = (text || '').trim() || 'Weather text unavailable';
      return {
        summary: fallback.slice(0, 800),
        location,
        date,
        sources: [],
      };
    }

    const tempC = parsed.tempC ?? parsed.temp ?? parsed.temperature;
    const conditions = parsed.conditions || parsed.condition || parsed.sky || '';
    const humidity = parsed.humidity || '';
    const wind = parsed.wind || parsed.windSpeed || '';
    const runAdvice = parsed.runAdvice || parsed.advice || '';

    const summary =
      parsed.summary ||
      [
        conditions && `Conditions: ${conditions}`,
        tempC !== undefined && tempC !== null && `Temp: ${tempC}°C`,
        humidity && `Humidity: ${humidity}`,
        wind && `Wind: ${wind}`,
        runAdvice && `Run tip: ${runAdvice}`,
      ]
        .filter(Boolean)
        .join('\n') ||
      `Weather for ${location} on ${date}: details unavailable`;

    return {
      summary,
      location: parsed.location || location,
      date: parsed.date || date,
      tempC: typeof tempC === 'number' ? tempC : undefined,
      conditions,
      humidity: String(humidity || ''),
      wind: String(wind || ''),
      runAdvice: String(runAdvice || ''),
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
    };
  } catch (error: any) {
    console.error('Weather fetch error:', error);
    return {
      location,
      date,
      summary: 'Weather lookup unavailable. Dress for the conditions you see outside.',
      runAdvice: 'Dress for the conditions you see outside.',
      sources: [],
    };
  }
}
 
