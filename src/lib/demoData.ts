// Demo data for the admin dashboard preview mode
// No real data is exposed — everything here is fictional.

import type { Tables } from "@/integrations/supabase/types";

type Nomination = Tables<"nominations">;

export const DEMO_EMAIL = "demo@nowweseeyou.app";

export const DEMO_NOMINATIONS: Nomination[] = [
  {
    id: "demo-nom-1",
    school_id: "demo-school",
    nominee_name: "Maria Rodriguez",
    nominee_role: "Science Teacher",
    nominee_department: "Science",
    reason:
      "Maria stays after school every day to help struggling students. She created a free weekend tutoring programme that has lifted grades across the whole year group.",
    nominator_name: "Alex Chen",
    nominator_email: "alex.c@school.edu",
    nominee_informed: false,
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "demo-nom-2",
    school_id: "demo-school",
    nominee_name: "James Okafor",
    nominee_role: "Custodian",
    nominee_department: "Facilities",
    reason:
      "James knows every student by name and always greets them with a smile. He fixed the playground equipment on his own time so kids wouldn't miss recess.",
    nominator_name: "Sarah Kim",
    nominator_email: "sarah.k@school.edu",
    nominee_informed: true,
    status: "approved",
    admin_notes: "Great candidate — profile being drafted.",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "demo-nom-3",
    school_id: "demo-school",
    nominee_name: "Priya Sharma",
    nominee_role: "Librarian",
    nominee_department: "Library",
    reason:
      "Priya turned our library into the most popular room in school. She started a student book club, reading challenges, and a cozy corner that kids love.",
    nominator_name: "Tom Baker",
    nominator_email: "tom.b@school.edu",
    nominee_informed: false,
    status: "featured",
    admin_notes: "Profile live — featured on homepage.",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: "demo-nom-4",
    school_id: "demo-school",
    nominee_name: "David Nguyen",
    nominee_role: "Math Teacher",
    nominee_department: "Mathematics",
    reason:
      "David makes math fun. His creative problem-solving activities have inspired several students to join math competitions.",
    nominator_name: "Lisa Park",
    nominator_email: "lisa.p@school.edu",
    nominee_informed: false,
    status: "pending",
    admin_notes: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

export const DEMO_ADMINS = [
  { id: "demo-admin-1", email: DEMO_EMAIL },
  { id: "demo-admin-2", email: "principal@school.edu" },
];

// Analytics demo data
export const DEMO_PROFILE_STATS = [
  {
    slug: "priya-sharma",
    name: "Priya Sharma",
    totalViews: 342,
    qrScans: { "priya-poster": 89, "priya-flyer": 47 } as Record<string, number>,
    approvedMessages: 12,
    pendingMessages: 3,
    rejectedMessages: 1,
  },
  {
    slug: "james-okafor",
    name: "James Okafor",
    totalViews: 218,
    qrScans: { "james-hallway": 63 } as Record<string, number>,
    approvedMessages: 8,
    pendingMessages: 1,
    rejectedMessages: 0,
  },
];

export const DEMO_ALL_QR_IDS = ["james-hallway", "priya-flyer", "priya-poster"];

function buildDemoDaily() {
  const days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    // Create a realistic-looking curve
    const base = Math.sin((30 - i) / 5) * 8 + 10;
    days.push({
      day: dayStr,
      views: Math.max(0, Math.round(base + Math.random() * 6)),
      scans: Math.max(0, Math.round(base * 0.4 + Math.random() * 4)),
    });
  }
  return days;
}

export const DEMO_DAILY_STATS = buildDemoDaily();

export const DEMO_TOTALS = {
  views: DEMO_PROFILE_STATS.reduce((s, p) => s + p.totalViews, 0),
  scans: Object.values(DEMO_PROFILE_STATS.reduce((acc, p) => {
    Object.values(p.qrScans).forEach((v) => (acc.total = (acc.total || 0) + v));
    return acc;
  }, { total: 0 } as Record<string, number>)).reduce((a, b) => a + b, 0),
  approved: DEMO_PROFILE_STATS.reduce((s, p) => s + p.approvedMessages, 0),
  pending: DEMO_PROFILE_STATS.reduce((s, p) => s + p.pendingMessages, 0),
  rejected: DEMO_PROFILE_STATS.reduce((s, p) => s + p.rejectedMessages, 0),
};
