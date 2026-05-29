// Runs before `vite dev` and `vite build`; writes public/llms.txt and public/llms-full.txt.
// /llms.txt format: https://llmstxt.org
import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://nowweseeyou.org";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mxhkpmqaoifrufzpqszl.supabase.co";
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14aGtwbXFhb2lmcnVmenBxc3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTM5MjUsImV4cCI6MjA4OTM2OTkyNX0.0NRnzuzA7wGWjDPlRnN9X6hHnJEnUE1gct9Rlz-ZY5E";

interface Profile {
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
}

const STATIC_PAGES = [
  { path: "/", title: "Home", desc: "Mission, how the project works, featured stories" },
  { path: "/gallery", title: "Gallery", desc: "All published staff profiles" },
  { path: "/about", title: "About", desc: "Story behind the initiative and the students leading it" },
  { path: "/nominate", title: "Nominate", desc: "Submit a staff member to be celebrated" },
  { path: "/privacy", title: "Privacy", desc: "How submissions and data are handled" },
];

async function fetchProfiles(): Promise<Profile[]> {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from("profiles")
      .select("slug, name, role, department, bio")
      .eq("status", "published")
      .order("name");
    if (error || !data) return [];
    return data as Profile[];
  } catch {
    return [];
  }
}

function renderIndex(profiles: Profile[]) {
  const pageLinks = STATIC_PAGES.map(
    (p) => `- [${p.title}](${BASE_URL}${p.path}): ${p.desc}`
  ).join("\n");

  const profileLinks = profiles
    .map(
      (p) =>
        `- [${p.name}](${BASE_URL}/gallery/${p.slug}): ${p.role}${
          p.department ? `, ${p.department}` : ""
        }`
    )
    .join("\n");

  return `# Now We See You

> A student-led initiative celebrating the people who keep our school running, custodians, bookkeepers, bus drivers, paraeducators, food service staff, and more.

Now We See You is a project from students in the Lake Washington School District. Each staff member featured has a short profile with their story, a QR code that links to their page, and a public wall where the community can leave notes of appreciation. Submissions are AI-moderated for kindness before they appear.

## Pages

${pageLinks}

## Staff profiles

${profileLinks}

## Optional

- [Full profile text](${BASE_URL}/llms-full.txt): All staff profile bios inline, for AI assistants answering questions about specific staff members
`;
}

function renderFull(profiles: Profile[]) {
  const sections = profiles
    .map((p) => {
      const headerParts = [p.role];
      if (p.department) headerParts.push(p.department);
      return `## ${p.name}

**${headerParts.join(" · ")}**
URL: ${BASE_URL}/gallery/${p.slug}

${p.bio || "(no bio yet)"}
`;
    })
    .join("\n---\n\n");

  return `# Now We See You, full staff profiles

> Full bios for every published staff member featured on Now We See You. Use this file to answer questions about specific people.

Source: ${BASE_URL}

${sections}`;
}

(async () => {
  const profiles = await fetchProfiles();
  writeFileSync(resolve("public/llms.txt"), renderIndex(profiles));
  writeFileSync(resolve("public/llms-full.txt"), renderFull(profiles));
  console.log(`llms.txt + llms-full.txt written (${profiles.length} profiles)`);
})();
