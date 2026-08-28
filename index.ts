// Supabase Edge Function: StrideClub Autonomous Agent Trigger
// Deploy with: supabase functions deploy strideclub-agent-trigger

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const APP_URL = Deno.env.get("APP_URL") || "https://strideclub.app";
    const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

    const { action } = await req.json().catch(() => ({ action: "full_cycle" }));

    // Trigger the StrideClub backend autonomous agent endpoint
    const response = await fetch(`${APP_URL}/api/agent/trigger/full-cycle`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": CRON_SECRET,
      },
    });

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, timestamp: new Date().toISOString(), result: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
