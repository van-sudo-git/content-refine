/**
 * moderate-appreciation (Supabase Edge Function)
 *
 * Handles appreciation wall submissions for staff profiles. Each message
 * is evaluated by an AI model before being stored. Rejected messages are
 * still saved for audit purposes but filtered out when displaying a profile.
 *
 * Flow:
 * 1. Receives POST request with { author_name?, message, profile_slug }
 *    (author_name is optional; message and profile_slug are required)
 * 2. Validates message is present, profile_slug is present, and message
 *    is under 500 characters
 * 3. Sends message to Gemini 2.5 Flash Lite via Lovable AI Gateway
 *    for moderation against school-appropriate criteria
 * 4. Stores the message in the appreciations table with status
 *    "approved" or "rejected" based on the moderation result
 * 5. Returns success response indicating whether the message was posted
 *
 * Moderation criteria (designed for a school context):
 * - APPROVE: genuine gratitude, positive experiences, encouragement
 * - REJECT: profanity, sarcasm, negativity, bullying, spam, off-topic
 *
 * The AI returns JSON { approved: boolean, reason: string }.
 * If the moderation service is unavailable or returns unparseable output,
 * the message defaults to rejected to protect staff profiles.
 *
 * Temperature is set to 0.1 to minimize variability in moderation
 * decisions — consistency matters more than creativity here.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Sends the message to the AI gateway and returns a moderation verdict.
 * Fails closed: any gateway error or unparseable response yields approved: false.
 */
async function checkPositiveIntent(message: string): Promise<{ approved: boolean; reason: string }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `You are a content moderator for a school appreciation wall. Your job is to determine if a message is appropriate and has positive intent.

APPROVE messages that:
- Express gratitude, thanks, or appreciation
- Share positive experiences or memories
- Are encouraging or uplifting
- Are respectful and kind

REJECT messages that:
- Contain profanity, slurs, or inappropriate language
- Are sarcastic, mocking, or backhanded compliments
- Are negative, critical, or complaining
- Contain personal attacks or bullying
- Are spam, off-topic, or nonsensical
- Contain inappropriate content for a school setting

Respond with ONLY valid JSON: {"approved": true/false, "reason": "brief explanation"}`,
        },
        {
          role: "user",
          content: `Evaluate this appreciation message:\n\n"${message}"`,
        },
      ],
      temperature: 0.1,
      max_tokens: 100,
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status, await response.text());
    return { approved: false, reason: "Moderation service unavailable" };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    // Models sometimes wrap JSON in extra text; grab the first {...} object.
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Parsing failed — fall through to the default rejection below.
  }
  return { approved: false, reason: "Could not determine message intent" };
}

Deno.serve(async (req) => {
  // Preflight for browser clients
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { author_name, message, profile_slug } = await req.json();

    if (!message?.trim() || !profile_slug?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message and profile are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.length > 500) {
      return new Response(
        JSON.stringify({ error: "Message must be under 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const moderation = await checkPositiveIntent(message.trim());

    // Service role bypasses RLS so we can insert on behalf of anonymous submitters
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const status = moderation.approved ? "approved" : "rejected";

    const { error } = await supabase.from("appreciations").insert({
      author_name: author_name?.trim() || null,
      message: message.trim(),
      profile_slug: profile_slug.trim(),
      status,
    });

    if (error) throw error;

    // User-facing reason is generic; the AI's moderation.reason is not exposed
    return new Response(
      JSON.stringify({
        success: true,
        approved: moderation.approved,
        reason: moderation.approved
          ? "Your appreciation has been posted!"
          : "Your message couldn't be posted. Please ensure it's a positive, appreciative message.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
