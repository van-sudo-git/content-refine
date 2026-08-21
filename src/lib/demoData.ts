// Rich fictional data for the read-only admin dashboard demo.
// Nothing in this file is production school data and no existing NWSY portraits are reused.

import type { Tables, Database } from "@/integrations/supabase/types";

type Nomination = Tables<"nominations">;
type ClubRole = Database["public"]["Enums"]["club_role"];

export const DEMO_EMAIL = "demo@nowweseeyou.app";
export const DEMO_ADMIN_NAME = "Taylor Morgan";
export const DEMO_SCHOOL_ID = "demo-school";
export const DEMO_SCHOOL_NAME = "Cedar Ridge High School";

const demoImage = (
  title: string,
  subtitle: string,
  kind: "portrait" | "photo" | "qr" = "portrait"
) => {
  const initials = title
    .split(" ")
    .map((part) => part[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const artwork =
    kind === "qr"
      ? `
        <rect x="95" y="95" width="310" height="310" rx="18" fill="#fff"/>
        <g fill="#1a2744">
          <rect x="125" y="125" width="85" height="85"/>
          <rect x="290" y="125" width="85" height="85"/>
          <rect x="125" y="290" width="85" height="85"/>
          <rect x="240" y="245" width="35" height="35"/>
          <rect x="295" y="250" width="28" height="28"/>
          <rect x="340" y="290" width="35" height="35"/>
          <rect x="250" y="340" width="28" height="28"/>
        </g>`
      : kind === "photo"
        ? `
          <rect x="70" y="85" width="360" height="250" rx="28" fill="#ffffff" opacity="0.72"/>
          <circle cx="160" cy="175" r="48" fill="#d7c7aa"/>
          <path d="M92 310 L190 225 L250 270 L330 185 L410 310 Z" fill="#8ea29a" opacity="0.9"/>
          <text x="250" y="390" text-anchor="middle" font-size="22" font-family="Arial" fill="#1a2744">Sample uploaded photo</text>`
        : `
          <circle cx="250" cy="190" r="95" fill="#d9cbb3"/>
          <circle cx="250" cy="170" r="62" fill="#f2eee6"/>
          <path d="M145 405 C155 300 205 250 250 250 C295 250 345 300 355 405 Z" fill="#7f918b"/>
          <text x="250" y="185" text-anchor="middle" font-size="44" font-weight="700" font-family="Georgia" fill="#1a2744">${initials}</text>`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" fill="#f5f0e8"/>
      <rect x="18" y="18" width="464" height="464" rx="28" fill="none" stroke="#1a2744" stroke-width="4"/>
      ${artwork}
      <text x="250" y="445" text-anchor="middle" font-size="22" font-weight="700" font-family="Georgia" fill="#1a2744">${title}</text>
      <text x="250" y="472" text-anchor="middle" font-size="14" font-family="Arial" fill="#666">${subtitle}</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export interface DemoRole {
  id: string;
  school_id: string;
  email: string;
  name: string;
  role: ClubRole;
  created_at: string;
}

export const DEMO_ROLES: DemoRole[] = [
  {
    id: "demo-role-jordan-journalist",
    school_id: DEMO_SCHOOL_ID,
    email: "jordan.lee@cedarridge.edu",
    name: "Jordan Lee",
    role: "journalist",
    created_at: "2026-08-04T16:00:00Z",
  },
  {
    id: "demo-role-maya-journalist",
    school_id: DEMO_SCHOOL_ID,
    email: "maya.patel@cedarridge.edu",
    name: "Maya Patel",
    role: "journalist",
    created_at: "2026-08-05T16:00:00Z",
  },
  {
    id: "demo-role-maya-artist",
    school_id: DEMO_SCHOOL_ID,
    email: "maya.patel@cedarridge.edu",
    name: "Maya Patel",
    role: "artist",
    created_at: "2026-08-05T16:01:00Z",
  },
  {
    id: "demo-role-lucas-photographer",
    school_id: DEMO_SCHOOL_ID,
    email: "lucas.chen@cedarridge.edu",
    name: "Lucas Chen",
    role: "photographer",
    created_at: "2026-08-06T16:00:00Z",
  },
  {
    id: "demo-role-avery-photographer",
    school_id: DEMO_SCHOOL_ID,
    email: "avery.brooks@cedarridge.edu",
    name: "Avery Brooks",
    role: "photographer",
    created_at: "2026-08-07T16:00:00Z",
  },
  {
    id: "demo-role-sofia-artist",
    school_id: DEMO_SCHOOL_ID,
    email: "sofia.martinez@cedarridge.edu",
    name: "Sofia Martinez",
    role: "artist",
    created_at: "2026-08-08T16:00:00Z",
  },
  {
    id: "demo-role-noah-outreach",
    school_id: DEMO_SCHOOL_ID,
    email: "noah.williams@cedarridge.edu",
    name: "Noah Williams",
    role: "pr",
    created_at: "2026-08-09T16:00:00Z",
  },
];

export const DEMO_NOMINATIONS: Nomination[] = [
  {
    id: "demo-nom-pending",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Maria Santos",
    nominee_role: "Head Custodian",
    nominee_department: "Facilities",
    reason:
      "Maria arrives before most of the building is awake and somehow knows when a classroom, event, or student needs help before anyone asks. Students regularly mention how welcome she makes them feel.",
    nominator_name: "Aiden Murphy",
    nominator_email: "aiden.m@cedarridge.edu",
    nominee_informed: false,
    status: "pending",
    admin_notes: "New nomination. Confirm consent before assigning the team.",
    journalist_id: null,
    photographer_id: null,
    artist_id: null,
    created_at: "2026-08-20T16:30:00Z",
    updated_at: "2026-08-20T16:30:00Z",
  },
  {
    id: "demo-nom-approved",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Denise Walker",
    nominee_role: "Attendance Secretary",
    nominee_department: "Main Office",
    reason:
      "Denise is often the first person families speak with when something has gone wrong. She stays calm, remembers details about students, and makes a busy front office feel personal.",
    nominator_name: "Riley Adams",
    nominator_email: "riley.a@cedarridge.edu",
    nominee_informed: true,
    status: "approved",
    admin_notes: "Consent confirmed. Team assigned and ready to begin.",
    journalist_id: "demo-role-jordan-journalist",
    photographer_id: "demo-role-lucas-photographer",
    artist_id: "demo-role-sofia-artist",
    created_at: "2026-08-16T18:15:00Z",
    updated_at: "2026-08-18T15:00:00Z",
  },
  {
    id: "demo-nom-progress",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Roberto Alvarez",
    nominee_role: "Groundskeeper",
    nominee_department: "Operations",
    reason:
      "Roberto has cared for the campus for more than a decade. He is known for quietly fixing problems before they become visible and for teaching student volunteers how much work goes into maintaining shared spaces.",
    nominator_name: "Emma Nguyen",
    nominator_email: "emma.n@cedarridge.edu",
    nominee_informed: true,
    status: "in_progress",
    admin_notes:
      "Interview complete. Photography uploaded. Artwork and final story are in progress.",
    journalist_id: "demo-role-maya-journalist",
    photographer_id: "demo-role-lucas-photographer",
    artist_id: "demo-role-maya-artist",
    created_at: "2026-08-10T17:20:00Z",
    updated_at: "2026-08-19T19:45:00Z",
  },
  {
    id: "demo-nom-submitted",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Kim Park",
    nominee_role: "Nutrition Services Lead",
    nominee_department: "Nutrition Services",
    reason:
      "Kim makes the lunchroom feel like part of the school community rather than a transaction. She notices when students are having difficult days and has built a team culture centered on dignity and care.",
    nominator_name: "Samir Shah",
    nominator_email: "samir.s@cedarridge.edu",
    nominee_informed: true,
    status: "submitted",
    admin_notes:
      "Story, photography, and artwork are complete. Waiting for admin review before publishing.",
    journalist_id: "demo-role-jordan-journalist",
    photographer_id: "demo-role-avery-photographer",
    artist_id: "demo-role-sofia-artist",
    created_at: "2026-08-03T16:05:00Z",
    updated_at: "2026-08-20T20:15:00Z",
  },
  {
    id: "demo-nom-published-1",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Janet Brooks",
    nominee_role: "Paraeducator",
    nominee_department: "Student Support",
    reason:
      "Janet supports students who need extra patience and consistency. Families describe her as someone who celebrates small wins and makes students feel capable.",
    nominator_name: "Olivia Reed",
    nominator_email: "olivia.r@cedarridge.edu",
    nominee_informed: true,
    status: "published",
    admin_notes: "Published. Hallway QR placard installed.",
    journalist_id: "demo-role-maya-journalist",
    photographer_id: "demo-role-avery-photographer",
    artist_id: "demo-role-maya-artist",
    created_at: "2026-07-22T15:30:00Z",
    updated_at: "2026-08-12T18:00:00Z",
  },
  {
    id: "demo-nom-published-2",
    school_id: DEMO_SCHOOL_ID,
    nominee_name: "Omar Hassan",
    nominee_role: "Bus Driver",
    nominee_department: "Transportation",
    reason:
      "Omar begins and ends the school day with many of the same students. He remembers names, waits when a student is running late, and has become a trusted adult for families on his route.",
    nominator_name: "Grace Liu",
    nominator_email: "grace.l@cedarridge.edu",
    nominee_informed: true,
    status: "published",
    admin_notes: "Published. Family appreciation messages are coming in.",
    journalist_id: "demo-role-jordan-journalist",
    photographer_id: "demo-role-lucas-photographer",
    artist_id: "demo-role-sofia-artist",
    created_at: "2026-07-12T17:10:00Z",
    updated_at: "2026-08-02T21:00:00Z",
  },
];

export const DEMO_ADMINS = [
  { id: "demo-admin-1", email: DEMO_EMAIL, name: DEMO_ADMIN_NAME },
  {
    id: "demo-admin-2",
    email: "principal.reyes@cedarridge.edu",
    name: "Dr. Elena Reyes",
  },
  {
    id: "demo-admin-3",
    email: "activities@cedarridge.edu",
    name: "Marcus Green",
  },
];

export interface DemoProfile {
  id: string;
  school_id: string;
  nomination_id: string | null;
  name: string;
  slug: string;
  role: string;
  department: string;
  bio: string;
  status: "published" | "draft";
  contributors: {
    role: "journalist" | "photographer" | "artist";
    name: string;
  }[];
  images: {
    type: "portrait" | "additional" | "qr";
    url: string;
  }[];
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    id: "demo-profile-janet",
    school_id: DEMO_SCHOOL_ID,
    nomination_id: "demo-nom-published-1",
    name: "Janet Brooks",
    slug: "janet-brooks",
    role: "Paraeducator",
    department: "Student Support",
    bio:
      "Janet works alongside students who need extra patience, encouragement, and consistency. She is known for noticing progress that others might miss and for making students feel capable before they feel confident themselves.",
    status: "published",
    contributors: [
      { role: "journalist", name: "Maya Patel" },
      { role: "artist", name: "Maya Patel" },
      { role: "photographer", name: "Avery Brooks" },
    ],
    images: [
      { type: "portrait", url: demoImage("Janet Brooks", "Demo portrait") },
      { type: "additional", url: demoImage("Janet Brooks", "Demo photo", "photo") },
      { type: "qr", url: demoImage("Janet Brooks", "Demo QR", "qr") },
    ],
  },
  {
    id: "demo-profile-omar",
    school_id: DEMO_SCHOOL_ID,
    nomination_id: "demo-nom-published-2",
    name: "Omar Hassan",
    slug: "omar-hassan",
    role: "Bus Driver",
    department: "Transportation",
    bio:
      "Omar starts and ends the school day with many of the same students. Over time, the bus has become a small community where names are remembered, routines matter, and students know there is another adult looking out for them.",
    status: "published",
    contributors: [
      { role: "journalist", name: "Jordan Lee" },
      { role: "artist", name: "Sofia Martinez" },
      { role: "photographer", name: "Lucas Chen" },
    ],
    images: [
      { type: "portrait", url: demoImage("Omar Hassan", "Demo portrait") },
      { type: "qr", url: demoImage("Omar Hassan", "Demo QR", "qr") },
    ],
  },
  {
    id: "demo-profile-kim",
    school_id: DEMO_SCHOOL_ID,
    nomination_id: "demo-nom-submitted",
    name: "Kim Park",
    slug: "kim-park",
    role: "Nutrition Services Lead",
    department: "Nutrition Services",
    bio:
      "Kim leads a busy lunchroom team while still finding ways to make individual students feel seen. The profile has been submitted by the student team and is waiting for admin review.",
    status: "draft",
    contributors: [
      { role: "journalist", name: "Jordan Lee" },
      { role: "artist", name: "Sofia Martinez" },
      { role: "photographer", name: "Avery Brooks" },
    ],
    images: [
      { type: "portrait", url: demoImage("Kim Park", "Submitted demo portrait") },
      { type: "additional", url: demoImage("Kim Park", "Demo photo", "photo") },
    ],
  },
  {
    id: "demo-profile-roberto",
    school_id: DEMO_SCHOOL_ID,
    nomination_id: "demo-nom-progress",
    name: "Roberto Alvarez",
    slug: "roberto-alvarez",
    role: "Groundskeeper",
    department: "Operations",
    bio:
      "The interview and photography are complete. The artwork and final story are still being developed by the assigned student team.",
    status: "draft",
    contributors: [
      { role: "journalist", name: "Maya Patel" },
      { role: "artist", name: "Maya Patel" },
      { role: "photographer", name: "Lucas Chen" },
    ],
    images: [
      { type: "additional", url: demoImage("Roberto Alvarez", "Photo uploaded; portrait in progress", "photo") },
    ],
  },
];

export const DEMO_FLYER_PROFILES = [
  {
    slug: "janet-brooks",
    name: "Janet Brooks",
    role: "Paraeducator",
    redirectId: "janet-brooks-demo-flyer-1",
  },
  {
    slug: "omar-hassan",
    name: "Omar Hassan",
    role: "Bus Driver",
    redirectId: "omar-hassan-demo-flyer-1",
  },
];

export const DEMO_PROFILE_STATS = [
  {
    slug: "janet-brooks",
    name: "Janet Brooks",
    totalViews: 684,
    qrScans: {
      "janet-hallway": 146,
      "janet-library": 54,
      "janet-family-night": 38,
    } as Record<string, number>,
    approvedMessages: 26,
    pendingMessages: 4,
    rejectedMessages: 2,
  },
  {
    slug: "omar-hassan",
    name: "Omar Hassan",
    totalViews: 493,
    qrScans: {
      "omar-bus-loop": 121,
      "omar-flyer-1": 42,
    } as Record<string, number>,
    approvedMessages: 18,
    pendingMessages: 2,
    rejectedMessages: 1,
  },
];

export const DEMO_ALL_QR_IDS = [
  "janet-hallway",
  "janet-library",
  "janet-family-night",
  "omar-bus-loop",
  "omar-flyer-1",
];

function buildDemoDaily() {
  const rows: { day: string; views: number; scans: number }[] = [];
  const today = new Date("2026-08-21T12:00:00Z");

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - i);
    const day = date.toISOString().slice(0, 10);
    const x = 30 - i;
    const eventLift = x >= 20 && x <= 23 ? 18 : 0;
    const views = Math.round(
      14 + x * 0.9 + Math.sin(x / 2.4) * 7 + eventLift
    );
    const scans = Math.round(
      5 + x * 0.35 + Math.cos(x / 2.8) * 3 + eventLift * 0.45
    );

    rows.push({
      day,
      views: Math.max(0, views),
      scans: Math.max(0, scans),
    });
  }

  return rows;
}

export const DEMO_DAILY_STATS = buildDemoDaily();

export const DEMO_TOTALS = {
  views: DEMO_PROFILE_STATS.reduce(
    (sum, profile) => sum + profile.totalViews,
    0
  ),
  scans: DEMO_PROFILE_STATS.reduce(
    (sum, profile) =>
      sum +
      Object.values(profile.qrScans).reduce(
        (profileSum, count) => profileSum + count,
        0
      ),
    0
  ),
  approved: DEMO_PROFILE_STATS.reduce(
    (sum, profile) => sum + profile.approvedMessages,
    0
  ),
  pending: DEMO_PROFILE_STATS.reduce(
    (sum, profile) => sum + profile.pendingMessages,
    0
  ),
  rejected: DEMO_PROFILE_STATS.reduce(
    (sum, profile) => sum + profile.rejectedMessages,
    0
  ),
};