import { createClient } from "@supabase/supabase-js";

async function main() {
  const url = process.env.VITE_SUPABASE_URL ?? "https://mxhkpmqaoifrufzpqszl.supabase.co";
  const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error("Missing Supabase publishable key in environment");
  const sb = createClient(url, key);
  const today = new Date().toISOString().slice(0, 10);

  const [profiles, redirects, localScans, appreciations] = await Promise.all([
    sb.from("profiles").select("slug, name, status").eq("status", "published"),
    sb.from("redirects").select("id, profile_slug, destination_url, active"),
    sb.from("redirect_events_daily").select("id, day, count").gte("day", today),
    sb.from("appreciations").select("profile_slug, status").eq("profile_slug", "brad-fisher").limit(3),
  ]);

  const qrTests = ["shirley", "brad", "bradflyer"];
  const qrResults: Record<string, string | null> = {};
  for (const id of qrTests) {
    const res = await fetch(
      `https://mxhkpmqaoifrufzpqszl.supabase.co/functions/v1/qr-redirect?id=${id}`,
      { redirect: "manual" },
    );
    qrResults[id] = res.headers.get("location");
  }

  console.log(
    JSON.stringify(
      {
        publishedProfiles: profiles.data,
        redirects: redirects.data,
        localScansToday: localScans.data,
        bradAppreciationsSample: appreciations.data,
        qrRedirects: qrResults,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
