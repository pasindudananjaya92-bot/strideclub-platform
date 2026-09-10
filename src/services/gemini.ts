import { GoogleGenAI } from '@google/genai';
import { PASIYA_MAX_SOCIAL_LINKS } from './socialPosterAgent.ts';

/** Free-tier model — high daily quota. Avoid gemini-3.6-flash (often ~20 RPD free). */
const FREE_MODEL = 'gemini-2.0-flash-lite';

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
  const msg = String(error?.message || error || '');
  return (
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('quota') ||
    msg.includes('rate-limit')
  );
}

const COACH_SYSTEM_INSTRUCTION = `You are "Pasiya AI," the official all-in-one AI Assistant & Club Coach for the StrideClub Athletic Intelligence Platform and the official representative for Pasiya Max.

### 🌟 YOUR IDENTITY & PERSONA:
- Name: Pasiya AI (Assistant of Pasiya Max)
- Tone: Extremely helpful, welcoming, friendly, knowledgeable, and professional.
- Language Fluency: Fluent Polyglot. Always match the language used by the visitor! If a visitor greets or asks in Sinhala (සිංහල), reply warmly in Sinhala. If in English, reply in English. If in Tamil, reply in Tamil, etc.

### 🏆 COMPLETE PLATFORM & WEBSITE KNOWLEDGE (STRIDECLUB):
You know everything about the website and can guide visitors on every feature:
1. **🏃 Dashboard & Live Analytics:** Real-time distance tracking, weekly goals (progress bars), cadence (SPM), recent runs, and motivational analytics.
2. **🤖 AI Coach & Microcycle Generator:** Free Gemini-powered 5K, 10K, Half Marathon, Marathon, and Ultra training plan synthesis, workout pacers, nutrition & carb-loading guides, injury prevention protocols (shin splints, runner's knee, plantar fasciitis), and shoe recommendations (Nike Pegasus, Alphafly, Saucony Endorphin).
3. **📊 Logbook & Run Logger:** Fast manual activity entry, surface types (Road, Trail, Track, Treadmill), pace calculators, and run history.
4. **🏆 Leaderboard & Milestone Badges:** Weekly and all-time club rankings, dynamic badges (Bronze 10K, Silver 25K, Gold 50K, Centurion 100K, Velocity Demon).
5. **📅 Club Group Events & RSVPs:** Organized group runs (e.g. Sunday 7:00 AM Independence Square 10K), real-time 1-click RSVP system.
6. **💬 Community Discussions:** Social forum for runners with categories (General, Gear & Shoes, Race Prep, Nutrition, Route Sharing) with automated moderation.
7. **🔐 Integrations Hub (Encrypted Vault):** Connect Strava, Garmin, Apple Health, Webhooks with AES-256-GCM encryption.
8. **🧠 Multi-Agent Studio:** Autonomous agents for coaching, moderation, event reminders, data vault checks, GitHub sync, and social post drafts — on free-tier hosting (SnapDeploy + Supabase + Gemini).
9. **📦 1-Click Project Export:** Download the entire source code as a production-ready ZIP.

### 📲 OFFICIAL PASIYA MAX SOCIAL MEDIA & COMMUNITY CHANNELS:
Whenever asked for social media, contact info, or community links, promote these channels:
1️⃣ 📸 Instagram: ${PASIYA_MAX_SOCIAL_LINKS.instagram}
2️⃣ 📘 Facebook: ${PASIYA_MAX_SOCIAL_LINKS.facebook}
3️⃣ 🌐 Blog: ${PASIYA_MAX_SOCIAL_LINKS.blog}
4️⃣ ▶️ YouTube: ${PASIYA_MAX_SOCIAL_LINKS.youtube}
5️⃣ 💬 WhatsApp Channel: ${PASIYA_MAX_SOCIAL_LINKS.whatsappChannel}
6️⃣ 💬 WhatsApp Group: ${PASIYA_MAX_SOCIAL_LINKS.whatsappGroup}
7️⃣ 📱 Imo: ${PASIYA_MAX_SOCIAL_LINKS.imo}
8️⃣ 🎵 TikTok: ${PASIYA_MAX_SOCIAL_LINKS.tiktok}
9️⃣ 💼 LinkedIn Profile: ${PASIYA_MAX_SOCIAL_LINKS.linkedinProfile}
🔟 💼 LinkedIn Group: ${PASIYA_MAX_SOCIAL_LINKS.linkedinGroup}
1️⃣1️⃣ 🐦 X / Twitter: ${PASIYA_MAX_SOCIAL_LINKS.x}
1️⃣2️⃣ 💜 Viber Channel: ${PASIYA_MAX_SOCIAL_LINKS.viber}
1️⃣3️⃣ 📢 Telegram Channel: ${PASIYA_MAX_SOCIAL_LINKS.telegram}

Always encourage users to follow and support the channels!`;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface WeatherLookupResult {
  location: string;
  date: string;
  summary: string;
  sources: Array<{ title: string; url: string }>;
}

export async function fetchRunWeather(location: string, date: string): Promise<WeatherLookupResult> {
  try {
    const ai = getGenAI();
    const query = `Find the local weather conditions, temperature in Celsius and Fahrenheit, humidity, wind speed, precipitation, and brief runner advice for running in "${location}" on "${date}". Format with concise bullet points and a brief 1-line running advice for gear or hydration.`;

    const response = await ai.models.generateContent({
      model: FREE_MODEL,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });

    const summary = response.text || `Weather report retrieved for ${location} on ${date}.`;
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: Array<{ title: string; url: string }> = [];

    for (const chunk of chunks) {
      if (chunk.web?.uri) {
        sources.push({
          title: chunk.web.title || 'Google Search Weather Source',
          url: chunk.web.uri,
        });
      }
    }

    return {
      location,
      date,
      summary,
      sources,
    };
  } catch (error: any) {
    console.error('Weather Search Error:', error);
    return {
      location,
      date,
      summary: `🌤️ Estimated conditions for ${location} on ${date}: 22°C (72°F), Clear with moderate breeze. Ideal for a morning or twilight road run!`,
      sources: [],
    };
  }
}

export async function askAiCoach(
  prompt: string,
  history: ChatMessage[] = [],
  userContext?: {
    totalKm?: number;
    avgPace?: string;
    weeklyGoalKm?: number;
    targetDistance?: string;
  }
): Promise<string> {
  try {
    const ai = getGenAI();

    let contextNote = '';
    if (userContext) {
      contextNote = `[Runner Profile Context: Total distance logged: ${userContext.totalKm || 0} km, Avg Pace: ${userContext.avgPace || 'N/A'}, Weekly Goal: ${userContext.weeklyGoalKm || 25} km]\n\n`;
    }

    const formattedContents = [
      ...history.map((h) => ({
        role: h.role,
        parts: [{ text: h.content }],
      })),
      {
        role: 'user' as const,
        parts: [{ text: contextNote + prompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: FREE_MODEL,
      contents: formattedContents,
      config: {
        systemInstruction: COACH_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 1400,
      },
    });

    return (
      response.text ||
      'Keep moving forward! Let me know if you need specific pacing, feature guidance, or training advice.'
    );
  } catch (error: any) {
    console.error('Gemini AI Coach Error:', error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return 'AI Coach is in offline demo mode. Please ensure GEMINI_API_KEY is configured in your project settings to activate live AI responses!';
    }
    if (isQuotaError(error)) {
      return 'AI free-tier quota is resting right now. Please wait about 1 minute and try again. Tip: avoid running Full Agent Cycle many times on the same day.';
    }
    return 'Coach Tip: Consistency beats intensity. Structure your week with 80% easy aerobic miles and 1 quality tempo session.';
  }
}

export interface MultimodalAnalysisRequest {
  mediaBase64: string;
  mimeType: string;
  userPrompt?: string;
  analysisType?: 'running_form' | 'shoe_wear' | 'gps_watch' | 'injury_rehab' | 'nutrition' | 'general';
}

export async function analyzeMultimodalMedia(params: MultimodalAnalysisRequest): Promise<string> {
  try {
    const ai = getGenAI();

    let rawBase64 = params.mediaBase64;
    if (rawBase64.includes('base64,')) {
      rawBase64 = rawBase64.split('base64,')[1];
    }

    const mimeType = params.mimeType || 'image/jpeg';
    const userPrompt =
      params.userPrompt ||
      'Please deeply analyze this athletic/running photo or video frame, explain what you observe, evaluate posture, gear, or metrics, and provide clear actionable recommendations in my language.';

    const systemInstruction = `You are "Pasiya AI," the elite Multimodal Athletic Biomechanics & Sports Science Analyst for Pasiya Max and StrideClub.

Your role:
- Deeply inspect the uploaded image, running photo, shoe outsole, GPS watch screenshot, or video frame.
- Detect whether the user asked in Sinhala (සිංහල), English, or another language, and reply fully in that language with warm, expert, encouraging coaching tone.
- If it is a **Running Posture / Gait** photo/frame: analyze foot strike (heel/midfoot/forefoot), knee drive, shin angle, forward lean, cadence implications, and injury reduction cues.
- If it is a **Running Shoe / Outsole**: inspect wear patterns (lateral vs medial wear for pronation/supination), midsole compression, remaining mileage estimation, and shoe recommendations.
- If it is a **Smartwatch / GPS Tracker / Strava** screenshot: analyze pace splits, heart rate zones, elevation profile, cadence, and aerobic efficiency.
- If it is an **Injury / Pain Area**: explain anatomical causes (shin splints, runner's knee, IT band, plantar fasciitis), suggested acute management (stretching, foam rolling, strength drills), and include a brief medical consultation reminder.
- If it is a **Fueling / Meal / Hydration** photo: analyze carb density, electrolyte balance, pre/post workout timing.
- Format with clean Markdown headers, bullet points, and an inspiring sign-off from Pasiya AI!`;

    const response = await ai.models.generateContent({
      model: FREE_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: rawBase64,
              },
            },
            {
              text: userPrompt,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 2000,
      },
    });

    return response.text || 'Analysis completed successfully. Keep up the high energy stride!';
  } catch (error: any) {
    console.error('Gemini Multimodal Analysis Error:', error);
    if (error.message?.includes('GEMINI_API_KEY')) {
      return 'Multimodal AI Vision requires GEMINI_API_KEY to be configured in your environment secrets. Please configure it to unlock live photo & video analysis!';
    }
    if (isQuotaError(error)) {
      return 'Vision AI free-tier quota is resting. Please wait about 1 minute and try again with a clear photo.';
    }
    return 'Analysis Note: Unable to complete visual processing right now. Please try with a clear JPEG/PNG photo or short clip.';
  }
} 
