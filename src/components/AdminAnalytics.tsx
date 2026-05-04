import { useState, useEffect, useMemo } from "react";
import { BarChart3, Eye, QrCode, MessageCircle, XCircle, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_PROFILE_STATS,
  DEMO_ALL_QR_IDS,
  DEMO_DAILY_STATS,
  DEMO_TOTALS,
} from "@/lib/demoData";

interface ProfileStat {
  slug: string;
  name: string;
  totalViews: number;
  qrScans: Record<string, number>;
  approvedMessages: number;
  pendingMessages: number;
  rejectedMessages: number;
}

interface DailyStat {
  day: string;
  views: number;
  scans: number;
}

const AdminAnalytics = ({ schoolId, isDemo = false }: { schoolId: string | null; isDemo?: boolean }) => {
  const [profileStats, setProfileStats] = useState<ProfileStat[]>(isDemo ? DEMO_PROFILE_STATS : []);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>(isDemo ? DEMO_DAILY_STATS : []);
  const [allQrIds, setAllQrIds] = useState<string[]>(isDemo ? DEMO_ALL_QR_IDS : []);
  const [totals, setTotals] = useState(isDemo ? DEMO_TOTALS : {
    views: 0,
    scans: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(!isDemo);

  useEffect(() => {
    if (isDemo) return;
    loadAnalytics();
  }, [schoolId, isDemo]);

  const loadAnalytics = async () => {
    setLoading(true);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("slug, name")
      .eq("status", "published");

    if (!profiles || profiles.length === 0) {
      setLoading(false);
      return;
    }

    const slugs = profiles.map((p) => p.slug);

    // All data from THIS project's tables
    const [pageViewsRes, appreciationsRes, redirectsRes, qrDailyRes] = await Promise.all([
      supabase.from("page_views").select("profile_slug, day, views").in("profile_slug", slugs),
      supabase.from("appreciations").select("profile_slug, status").in("profile_slug", slugs),
      supabase.from("redirects").select("id, profile_slug").in("profile_slug", slugs),
      supabase.from("redirect_events_daily").select("id, day, count"),
    ]);

    const pageViews = pageViewsRes.data ?? [];
    const appreciations = appreciationsRes.data ?? [];
    const redirects = (redirectsRes.data ?? []) as { id: string; profile_slug: string }[];
    const qrDaily = (qrDailyRes.data ?? []) as { id: string; day: string; count: number }[];

    // Build slug → qr IDs mapping dynamically from redirects table
    const slugToQrIds: Record<string, string[]> = {};
    redirects.forEach((r) => {
      if (!slugToQrIds[r.profile_slug]) slugToQrIds[r.profile_slug] = [];
      slugToQrIds[r.profile_slug].push(r.id);
    });

    // Collect all QR IDs for the table header
    const profileQrIds = new Set<string>();
    redirects.forEach((r) => profileQrIds.add(r.id));
    setAllQrIds(Array.from(profileQrIds).sort());

    const stats: ProfileStat[] = profiles.map((p) => {
      const views = pageViews
        .filter((v) => v.profile_slug === p.slug)
        .reduce((sum, v) => sum + v.views, 0);

      const qrIds = slugToQrIds[p.slug] || [];
      const qrScans: Record<string, number> = {};
      qrIds.forEach((qrId) => {
        qrScans[qrId] = qrDaily
          .filter((rd) => rd.id === qrId)
          .reduce((sum, rd) => sum + rd.count, 0);
      });

      const profileAppreciations = appreciations.filter((a) => a.profile_slug === p.slug);

      return {
        slug: p.slug,
        name: p.name,
        totalViews: views,
        qrScans,
        approvedMessages: profileAppreciations.filter((a) => a.status === "approved").length,
        pendingMessages: profileAppreciations.filter((a) => a.status === "pending").length,
        rejectedMessages: profileAppreciations.filter((a) => a.status === "rejected").length,
      };
    });

    setProfileStats(stats);

    const allScans = qrDaily.reduce((sum, rd) => sum + rd.count, 0);

    setTotals({
      views: stats.reduce((s, p) => s + p.totalViews, 0),
      scans: allScans,
      approved: stats.reduce((s, p) => s + p.approvedMessages, 0),
      pending: stats.reduce((s, p) => s + p.pendingMessages, 0),
      rejected: stats.reduce((s, p) => s + p.rejectedMessages, 0),
    });

    // Build daily trend (last 30 days)
    const today = new Date();
    const days: DailyStat[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);

      const dayViews = pageViews
        .filter((v) => v.day === dayStr)
        .reduce((sum, v) => sum + v.views, 0);

      const dayScans = qrDaily
        .filter((rd) => rd.day === dayStr)
        .reduce((sum, rd) => sum + rd.count, 0);

      days.push({ day: dayStr, views: dayViews, scans: dayScans });
    }
    setDailyStats(days);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }

  const maxDailyValue = Math.max(
    ...dailyStats.map((d) => Math.max(d.views, d.scans)),
    1
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Eye} label="Website Views" value={totals.views} color="text-blue-600" />
        <StatCard icon={QrCode} label="QR Scans" value={totals.scans} color="text-secondary" />
        <StatCard icon={MessageCircle} label="Approved Messages" value={totals.approved} color="text-emerald-600" />
        <StatCard icon={TrendingUp} label="Pending Messages" value={totals.pending} color="text-amber-600" />
        <StatCard icon={XCircle} label="Rejected Messages" value={totals.rejected} color="text-red-600" />
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> 30-Day Trend
        </h3>
        <div className="flex items-end gap-[3px]" style={{ height: '160px' }}>
          {dailyStats.map((d) => {
            const maxH = 160;
            const viewH = maxDailyValue > 0 ? Math.max((d.views / maxDailyValue) * maxH, d.views > 0 ? 4 : 0) : 0;
            const scanH = maxDailyValue > 0 ? Math.max((d.scans / maxDailyValue) * maxH, d.scans > 0 ? 4 : 0) : 0;
            return (
              <div
                key={d.day}
                className="flex-1 flex items-end justify-center gap-[1px] group relative"
                style={{ height: `${maxH}px` }}
                title={`${d.day}\nWebsite Views: ${d.views}\nQR Scans: ${d.scans}`}
              >
                <div
                  className="flex-1 bg-blue-400/60 rounded-t-sm transition-all hover:bg-blue-500/80"
                  style={{ height: `${viewH}px` }}
                />
                <div
                  className="flex-1 bg-secondary/60 rounded-t-sm transition-all hover:bg-secondary/80"
                  style={{ height: `${scanH}px` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-400/60" /> Website Views
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-secondary/60" /> QR Scans
          </span>
        </div>
      </div>

      {/* Per-Profile Breakdown */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display text-xl text-foreground mb-4">Per-Profile Breakdown</h3>
        {profileStats.length === 0 ? (
          <p className="text-muted-foreground text-sm">No published profiles yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Profile</th>
                  <th className="pb-3 font-medium text-center">Website Views</th>
                  {allQrIds.map((qrId) => (
                    <th key={qrId} className="pb-3 font-medium text-center">
                      <span className="flex items-center justify-center gap-1">
                        <QrCode size={12} />
                        {qrId}
                      </span>
                    </th>
                  ))}
                  <th className="pb-3 font-medium text-center">Approved</th>
                  <th className="pb-3 font-medium text-center">Pending</th>
                  <th className="pb-3 font-medium text-center">Rejected</th>
                </tr>
              </thead>
              <tbody>
                {profileStats.map((p) => (
                  <tr key={p.slug} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 text-center text-blue-600 font-medium">{p.totalViews}</td>
                    {allQrIds.map((qrId) => (
                      <td key={qrId} className="py-3 text-center text-secondary font-medium">
                        {p.qrScans[qrId] ?? "—"}
                      </td>
                    ))}
                    <td className="py-3 text-center text-emerald-600 font-medium">{p.approvedMessages}</td>
                    <td className="py-3 text-center text-amber-600 font-medium">{p.pendingMessages}</td>
                    <td className="py-3 text-center text-red-600 font-medium">{p.rejectedMessages}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
  color: string;
}) => (
  <div className="bg-card rounded-xl border border-border p-5 text-center">
    <Icon size={20} className={`${color} mx-auto mb-2`} />
    <p className={`font-display text-2xl ${color}`}>{value}</p>
    <p className="text-muted-foreground text-xs mt-1">{label}</p>
  </div>
);

export default AdminAnalytics;
