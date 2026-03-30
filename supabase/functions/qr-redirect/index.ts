import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response("Missing redirect id", { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: redirect } = await supabase
      .from("redirects")
      .select("destination_url, active")
      .eq("id", id)
      .single();

    if (!redirect || redirect.active !== true) {
      return Response.redirect("https://nowweseeyou.lovable.app", 302);
    }

    // Log the scan (fire-and-forget)
    supabase.rpc("increment_redirect_daily", {
      p_id: id,
      p_day: isoDay(new Date()),
    }).then(() => {}).catch(console.error);

    let destination = redirect.destination_url.trim();
    if (!/^https?:\/\//i.test(destination)) {
      destination = `https://${destination}`;
    }

    return Response.redirect(destination, 302);
  } catch (error) {
    console.error("QR redirect error:", error);
    return Response.redirect("https://nowweseeyou.lovable.app", 302);
  }
});
