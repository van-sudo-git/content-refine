import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function checkPositiveIntent(message: string): Promise<{ approved: boolean; reason: string }> {
  const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
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

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim() ?? "";

  try {
    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallthrough
  }
  return { approved: false, reason: "Could not determine message intent" };
}

Deno.serve(async (req) => {
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

    // Check positive intent with AI
    const moderation = await checkPositiveIntent(message.trim());

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const status = moderation.approved ? "approved" : "rejected";

    const { error } = await supabase.from("appreciations").insert({
      author_name: author_name.trim(),
      message: message.trim(),
      profile_slug: profile_slug.trim(),
      status,
    });

    if (error) throw error;

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
