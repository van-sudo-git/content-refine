/**
 * qr-redirect (Supabase Edge Function)
 *
 * Resolves QR code scans into HTTP 302 redirects to staff profile pages.
 * QR codes encode a stable Supabase function URL with ?id=<redirect_id>;
 * admins create matching rows in the redirects table when generating codes.
 *
 * Flow:
 * 1. Receives GET request with ?id=<redirect_id> (typically a profile slug)
 * 2. Looks up destination_url and active flag in the redirects table
 * 3. If missing or inactive, redirects to the site homepage as a fallback
 * 4. Logs the scan via increment_redirect_daily (fire-and-forget, non-blocking)
 * 5. Normalizes destination_url (prepends https:// if no scheme) and 302-redirects
 *
 * Scan counts are stored per redirect per calendar day in redirect_events_daily
 * and surfaced in admin analytics. Logging failures do not block the redirect.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/** Returns the current UTC date as YYYY-MM-DD for daily scan aggregation. */
function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  // Preflight for browser clients
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing redirect id", { status: 400, headers: corsHeaders });
    }

    // Service role bypasses RLS so anonymous QR scans can read redirect rows
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: redirect } = await supabase
      .from("redirects")
      .select("destination_url, active")
      .eq("id", id)
      .single();

    // Unknown or deactivated redirects fall back to the main site
    if (!redirect || redirect.active !== true) {
      return Response.redirect("https://nowweseeyou.org", 302);
    }

    // Log the scan without awaiting — redirect speed matters more than analytics
    supabase.rpc("increment_redirect_daily", {
      p_id: id,
      p_day: isoDay(new Date()),
    }).then(() => {}).catch(console.error);

    // Ensure a scheme is present; admins may store bare domains
    let destination = redirect.destination_url.trim();
    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    return Response.redirect(destination, 302);
  } catch (error) {
    console.error("QR redirect error:", error);
    return Response.redirect("https://nowweseeyou.org", 302);
  }
});
