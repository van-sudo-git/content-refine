// Runs before `vite dev` and `vite build`; writes public/sitemap.xml.
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv } from "vite";

const BASE_URL = "https://nowweseeyou.org";

const mode =
  process.env.npm_lifecycle_event === "prebuild" ? "production" : "development";

const env = loadEnv(mode, process.cwd(), "VITE_");

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;

const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY."
  );
}

interface Entry {
  path: string;
  changefreq?: string;
  priority?: string;
  lastmod?: string;
}

interface PublishedProfile {
  slug: string;
  school_id: string | null;
  updated_at?: string | null;
}

interface SchoolRow {
  id: string;
  name: string;
}

const staticEntries: Entry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/galleries", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/media", changefreq: "monthly", priority: "0.7" },
  { path: "/nominate", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
];

const schoolToGallerySlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toDate = (value?: string | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : undefined;

async function fetchDynamicEntries(): Promise<Entry[]> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("slug, school_id, updated_at")
    .eq("status", "published");

  if (profileError) {
    throw new Error(`Unable to load published profiles: ${profileError.message}`);
  }

  const profiles = (profileData || []) as PublishedProfile[];

  const profileEntries: Entry[] = profiles.map((profile) => ({
    path: `/gallery/${profile.slug}`,
    changefreq: "monthly",
    priority: "0.8",
    lastmod: toDate(profile.updated_at),
  }));

  const schoolIds = Array.from(
    new Set(
      profiles
        .map((profile) => profile.school_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (schoolIds.length === 0) return profileEntries;

  const { data: schoolData, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .in("id", schoolIds)
    .order("name");

  if (schoolError) {
    throw new Error(`Unable to load gallery schools: ${schoolError.message}`);
  }

  const schools = (schoolData || []) as SchoolRow[];

  const schoolEntries: Entry[] = schools.map((school) => {
    const schoolProfiles = profiles.filter(
      (profile) => profile.school_id === school.id
    );

    const latestUpdatedAt = schoolProfiles
      .map((profile) => profile.updated_at)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1);

    return {
      path: `/galleries/${schoolToGallerySlug(school.name)}`,
      changefreq: "weekly",
      priority: "0.8",
      lastmod: toDate(latestUpdatedAt),
    };
  });

  return [...schoolEntries, ...profileEntries];
}

function render(entries: Entry[]) {
  const urls = entries.map((entry) =>
    [
      "  <url>",
      `    <loc>${BASE_URL}${entry.path}</loc>`,
      entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>` : null,
      entry.changefreq
        ? `    <changefreq>${entry.changefreq}</changefreq>`
        : null,
      entry.priority ? `    <priority>${entry.priority}</priority>` : null,
      "  </url>",
    ]
      .filter(Boolean)
      .join("\n")
  );

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    "</urlset>",
  ].join("\n");
}

(async () => {
  const dynamicEntries = await fetchDynamicEntries();
  const allEntries = [...staticEntries, ...dynamicEntries];

  writeFileSync(resolve("public/sitemap.xml"), render(allEntries));

  console.log(
    `sitemap.xml written (${allEntries.length} entries, ${dynamicEntries.length} dynamic)`
  );
})();