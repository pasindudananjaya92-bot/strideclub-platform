import { GoogleGenAI } from '@google/genai';
import { logAgentAction } from '../db/agentLogs.ts';

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }
  return new GoogleGenAI({ apiKey });
}

export const PASIYA_MAX_SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/pasindu5598',
  facebook: 'https://www.facebook.com/share/18xRGhYVUo/',
  blog: 'https://mamageblog.blogspot.com',
  youtube: 'https://youtube.com/@pasya',
  whatsappChannel: 'https://whatsapp.com/channel/0029VaPASIAMAX',
  whatsappGroup: 'https://chat.whatsapp.com/KjhsWakBQoUI4SEEvZXAsO',
  imo: 'https://s.imoim.net/KNdKwX?ISCI=001102',
  tiktok: 'https://tiktok.com/@pasindudananjaya619',
  linkedinProfile: 'https://linkedin.com/in/pasindu-dananjaya-41044831b',
  linkedinGroup: 'https://www.linkedin.com/groups/22101008',
  x: 'https://x.com/PasinduDan98554',
  viber: 'https://invite.viber.com/?g2=AQBWlEwa%2BDKVDFaaTbesR5FqD2IQZhFjhhQdN%2Fvdsaml9xVUCL8RnDHcFy6kno0U',
  telegram: 'https://t.me/goldenbotmdchannel',
};

export interface SocialPostDraft {
  platform: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'telegram' | 'whatsapp' | 'x';
  captionText: string;
  hashtags: string[];
  suggestedMediaPrompt?: string;
  promotedLinks: string[];
  language: 'sinhala' | 'english' | 'bilingual';
}

/**
 * Uses Gemini to generate high-engagement social media content for Pasiya Max's athletic & tech channels
 */
export async function generateSocialPost(params: {
  topic: string;
  platform?: 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'telegram' | 'whatsapp' | 'x';
  language?: 'sinhala' | 'english' | 'bilingual';
  workoutMilestone?: {
    distanceKm: number;
    pace: string;
    athleteName?: string;
  };
}): Promise<SocialPostDraft> {
  const ai = getGenAI();
  const targetPlatform = params.platform || 'facebook';
  const targetLanguage = params.language || 'bilingual';

  const prompt = `You are the Official Social Media Marketing Agent for Pasiya Max and StrideClub Athletic Intelligence.
Generate an engaging, viral, high-converting social media post for the platform: ${targetPlatform.toUpperCase()}.

Topic / Context:
${params.topic}

Workout Milestone (if applicable):
${JSON.stringify(params.workoutMilestone || { distanceKm: 10, pace: '5:10/km' }, null, 2)}

Official Pasiya Max Social Links to reference:
- YouTube: ${PASIYA_MAX_SOCIAL_LINKS.youtube}
- Facebook: ${PASIYA_MAX_SOCIAL_LINKS.facebook}
- Instagram: ${PASIYA_MAX_SOCIAL_LINKS.instagram}
- TikTok: ${PASIYA_MAX_SOCIAL_LINKS.tiktok}
- Telegram: ${PASIYA_MAX_SOCIAL_LINKS.telegram}
- WhatsApp Channel: ${PASIYA_MAX_SOCIAL_LINKS.whatsappChannel}

Requirements:
1. Language: ${targetLanguage === 'sinhala' ? 'Sinhala only' : targetLanguage === 'bilingual' ? 'Sinhala and English mixed naturally' : 'English only'}.
2. Tone: Energetic, inspiring, athletic, and friendly.
3. Call to Action: Invite followers to join the club, follow Pasiya Max social media channels.
4. Include top 8 trending hashtags.
5. Provide a prompt to generate an accompanying running graphic or banner.

Respond in pure JSON:
{
  "platform": "${targetPlatform}",
  "captionText": "Full formatted caption with emojis and paragraph breaks",
  "hashtags": ["#RunningMotivation", "#StrideClub", "#PasiyaMax", "#FitnessSriLanka"],
  "suggestedMediaPrompt": "A high-contrast cinematic photo of a runner sprinting at sunrise with energetic gold and black lighting",
  "promotedLinks": ["${PASIYA_MAX_SOCIAL_LINKS.youtube}", "${PASIYA_MAX_SOCIAL_LINKS.whatsappChannel}"],
  "language": "${targetLanguage}"
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text || '{}';
  const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    platform: parsed.platform || targetPlatform,
    captionText: parsed.captionText || params.topic,
    hashtags: parsed.hashtags || ['#StrideClub', '#PasiyaMax'],
    suggestedMediaPrompt: parsed.suggestedMediaPrompt || 'Athletic runner at sunrise',
    promotedLinks: parsed.promotedLinks || [PASIYA_MAX_SOCIAL_LINKS.facebook, PASIYA_MAX_SOCIAL_LINKS.youtube],
    language: parsed.language || targetLanguage,
  };
}

/**
 * Dispatches the drafted post to a Make.com (formerly Integromat) Free Tier Webhook.
 * Make.com receives this JSON payload and automatically posts to Instagram / Facebook / Telegram / YouTube / etc.
 */
export async function dispatchToMakeWebhook(params: {
  webhookUrl: string;
  post: SocialPostDraft;
  imageUrl?: string;
}): Promise<{ success: boolean; status: number; message: string }> {
  try {
    const payload = {
      source: 'StrideClub Autonomous Social Agent',
      timestamp: new Date().toISOString(),
      platform: params.post.platform,
      caption: params.post.captionText,
      hashtags: params.post.hashtags.join(' '),
      imageUrl: params.imageUrl || 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=1200',
      links: params.post.promotedLinks,
      pasiyaMaxLinks: PASIYA_MAX_SOCIAL_LINKS,
    };

    const res = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    await logAgentAction({
      systemName: 'MAKE.COM SOCIAL AUTO-POSTER AGENT',
      actionType: 'social_auto_post',
      description: `Dispatched ${params.post.platform} post via Make.com webhook: "${params.post.captionText.substring(0, 60)}..."`,
      status: res.ok ? 'success' : 'warning',
      metrics: {
        platform: params.post.platform,
        status: res.status,
      },
    });

    return {
      success: res.ok,
      status: res.status,
      message: res.ok ? 'Successfully dispatched to Make.com workflow!' : `Make.com responded with HTTP ${res.status}`,
    };
  } catch (error: any) {
    return {
      success: false,
      status: 500,
      message: error.message || 'Failed to dispatch to Make.com webhook',
    };
  }
} 
