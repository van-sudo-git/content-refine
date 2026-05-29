// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://nowweseeyou.org";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mxhkpmqaoifrufzpqszl.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aGtwbXFhb2lmcnVmenBxc3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTM5MjUsImV4cCI6MjA4OTM2OTkyNX0.0NRnzuzA7wGWjDPlRnN9X6hHnJEnUE1gct9Rlz-ZY5E";

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/gallery", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/nominate", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

async function fetchProfileEntries(): Promise<Entry[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("profiles")
      .select("slug, updated_at")
      .eq("status", "published");
    if (error || !data) return [];
    return data.map((p: { slug: string; updated_at?: string }) => ({
      path: `/gallery/${p.slug}`,
      changefreq: "monthly",
      priority: "0.8",
      lastmod: p.updated_at ? new Date(p.updated_at).toISOString().slice(0, 10) : undefined,
    }));
  } catch {
    return [];
  }
}

function render(entries: Entry[]) {
  const urls = entries.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n")
  );
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

(async () => {
  const profiles = await fetchProfileEntries();
  const all = [...staticEntries, ...profiles];
  writeFileSync(resolve("public/sitemap.xml"), render(all));
  console.log(`sitemap.xml written (${all.length} entries, ${profiles.length} profiles)`);
})();
