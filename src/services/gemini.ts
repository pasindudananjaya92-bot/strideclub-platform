import { GoogleGenAI } from '@google/genai';
import { PASIYA_MAX_SOCIAL_LINKS } from './socialPosterAgent.ts';

/** Free-tier model — good daily quota & widely available on free keys. */
const FREE_MODEL = 'gemini-2.0-flash';

let aiClient: GoogleGenAI | null = null;

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

function stripBase64Prefix(raw: string): string {
  return String(raw || '').replace(/^data:[^;]+;base64,/, '');
}

type ChatTurn = {
  role?: string;
  text?: string;
  content?: string;
};

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

  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: FREE_MODEL,
        contents: normalized,
        config,
      });
      return (response.text || '').trim();
    } catch (err: any) {
      lastError = err;
      if (isQuotaError(err) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 45000));
        continue;
      }
      throw err;
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
      finalPrompt += `\n\nAthlete context (JSON): ${JSON.stringify(userContext)}`;
    }

    const systemInstruction = `You are Pasiya AI, the official endurance running coach of StrideClub and assistant of Pasiya Max.
Be practical, motivating, and science-based (80/20 easy miles, polarized training).
Answer in the user's language (Sinhala or English). Keep answers clear and actionable.
Never reply with a generic canned "Coach Tip" sentence. Always answer the actual question.
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
      systemInstruction:
        'You are Pasiya AI Vision for runners. Analyze running form, shoes, watch screens, and training notes. Be specific and practical. Reply in the user language.',
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

export async function fetchRunWeather(location: string, date: string): Promise<any> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { summary: 'Weather offline (no API key)', location, date };
    }

    const prompt = `Give a short running-focused weather summary for "${location}" on ${date}.
Respond JSON only:
{"location":"...","date":"...","tempC":number,"conditions":"...","humidity":"...","wind":"...","runAdvice":"..."}`;

    const text = await generateWithRetry(prompt, {
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const clean = (text || '{}').replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch (error: any) {
    console.error('Weather fetch error:', error);
    return {
      location,
      date,
      summary: 'Weather lookup unavailable',
      runAdvice: 'Dress for the conditions you see outside.',
    };
  }
} 
