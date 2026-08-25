// Runs before `vite dev` and `vite build`; writes public/llms.txt and public/llms-full.txt.
// /llms.txt format: https://llmstxt.org
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

interface Profile {
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  school_id: string | null;
}

interface School {
  id: string;
  name: string;
}

const STATIC_PAGES = [
  {
    path: "/",
    title: "Home",
    desc: "Mission, how the project works, and featured stories",
  },
  {
    path: "/galleries",
    title: "Galleries",
    desc: "School chapters and their published staff stories",
  },
  {
    path: "/about",
    title: "Our Story",
    desc: "How the student-led initiative began and how the chapter model works",
  },
  {
    path: "/media",
    title: "In the Community",
    desc: "Exhibitions, conversations, and community moments",
  },
  {
    path: "/nominate",
    title: "Nominate",
    desc: "Submit a staff member to be celebrated at a participating school",
  },
  {
    path: "/privacy",
    title: "Privacy & Ethics",
    desc: "Consent, participation, QR codes, appreciation messages, and analytics",
  },
];

const schoolToGallerySlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function fetchPublicData(): Promise<{
  profiles: Profile[];
  schools: School[];
}> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("slug, name, role, department, bio, school_id")
    .eq("status", "published")
    .order("name");

  if (profileError) {
    throw new Error(`Unable to load published profiles: ${profileError.message}`);
  }

  const profiles = (profileData || []) as Profile[];

  const schoolIds = Array.from(
    new Set(
      profiles
        .map((profile) => profile.school_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  if (schoolIds.length === 0) {
    return { profiles, schools: [] };
  }

  const { data: schoolData, error: schoolError } = await supabase
    .from("schools")
    .select("id, name")
    .in("id", schoolIds)
    .order("name");

  if (schoolError) {
    throw new Error(`Unable to load public schools: ${schoolError.message}`);
  }

  return {
    profiles,
    schools: (schoolData || []) as School[],
  };
}

function renderIndex(profiles: Profile[], schools: School[]) {
  const pageLinks = STATIC_PAGES.map(
    (page) => `- [${page.title}](${BASE_URL}${page.path}): ${page.desc}`
  ).join("\n");

  const chapterLinks =
    schools.length > 0
      ? schools
          .map(
            (school) =>
              `- [${school.name}](${BASE_URL}/galleries/${schoolToGallerySlug(
                school.name
              )}): School chapter gallery`
          )
          .join("\n")
      : "- No public chapter galleries yet.";

  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));

  const profileLinks =
    profiles.length > 0
      ? profiles
          .map((profile) => {
            const schoolName = profile.school_id
              ? schoolMap.get(profile.school_id)
              : null;

            const details = [
              profile.role,
              profile.department || null,
              schoolName || null,
            ]
              .filter(Boolean)
              .join(", ");

            return `- [${profile.name}](${BASE_URL}/gallery/${profile.slug}): ${details}`;
          })
          .join("\n")
      : "- No published staff profiles yet.";

  return `# Now We See You

> A student-led initiative celebrating the people who keep school communities running, especially those whose work is often overlooked.

Now We See You began at Lake Washington High School and is being built as a repeatable school-chapter model. Participating staff members are featured through consent-based stories, hand-drawn portraits when available, QR-linked profile pages, and public appreciation messages. Appreciation submissions are AI-moderated for kindness before they appear.

## Pages

${pageLinks}

## School chapters

${chapterLinks}

## Staff profiles

${profileLinks}

## Optional

- [Full profile text](${BASE_URL}/llms-full.txt): Full bios for published staff profiles, for AI assistants answering questions about specific people
`;
}

function renderFull(profiles: Profile[], schools: School[]) {
  const schoolMap = new Map(schools.map((school) => [school.id, school.name]));

  const sections = profiles
    .map((profile) => {
      const headerParts = [profile.role];

      if (profile.department) headerParts.push(profile.department);

      const schoolName = profile.school_id
        ? schoolMap.get(profile.school_id)
        : null;

      if (schoolName) headerParts.push(schoolName);

      return `## ${profile.name}

**${headerParts.join(" · ")}**
URL: ${BASE_URL}/gallery/${profile.slug}

${profile.bio || "(no bio yet)"}
`;
    })
    .join("\n---\n\n");

  return `# Now We See You, full staff profiles

> Full bios for every published staff member featured on Now We See You. Use this file to answer questions about specific people.

Source: ${BASE_URL}

${sections}`;
}

(async () => {
  const { profiles, schools } = await fetchPublicData();

  writeFileSync(
    resolve("public/llms.txt"),
    renderIndex(profiles, schools)
  );

  writeFileSync(
    resolve("public/llms-full.txt"),
    renderFull(profiles, schools)
  );

  console.log(
    `llms.txt + llms-full.txt written (${profiles.length} profiles, ${schools.length} chapters)`
  );
})();