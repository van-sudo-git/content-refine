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
      supabase.from("page_views").select("profile_slug, day, views"),
      supabase.from("appreciations").select("profile_slug, status").in("profile_slug", slugs),
      supabase.from("redirects").select("id, profile_slug").in("profile_slug", slugs),
      supabase.from("redirect_events_daily").select("id, day, count"),
    ]);

    const pageViews = pageViewsRes.data ?? [];
    const profilePageViews = pageViews.filter((v) => slugs.includes(v.profile_slug));
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
      const views = profilePageViews
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
      views: pageViews.reduce((s, v) => s + v.views, 0),
      scans: allScans,
      approved: stats.reduce((s, p) => s + p.approvedMessages, 0),
      pending: stats.reduce((s, p) => s + p.pendingMessages, 0),
      rejected: stats.reduce((s, p) => s + p.rejectedMessages, 0),
    });

    // Build daily trend (last 30 days)
    const today = new Date();
    const days: DailyStat[] = [];
    for (let i = 59; i >= 0; i--) {
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

  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  const chartData = useMemo(() => {
    const slice = dailyStats.slice(-rangeDays);
    const prev = dailyStats.slice(-rangeDays * 2, -rangeDays);
    return slice.map((d, i) => ({
      day: d.day,
      label: new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      views: d.views,
      scans: d.scans,
      prevViews: prev[i]?.views ?? 0,
    }));
  }, [dailyStats, rangeDays]);

  const rangeTotals = useMemo(() => {
    const v = chartData.reduce((s, d) => s + d.views, 0);
    const s = chartData.reduce((s, d) => s + d.scans, 0);
    const pv = chartData.reduce((s, d) => s + d.prevViews, 0);
    const delta = pv > 0 ? ((v - pv) / pv) * 100 : v > 0 ? 100 : 0;
    return { views: v, scans: s, prevViews: pv, delta };
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border p-12 text-center">
        <p className="text-muted-foreground">Loading analytics...</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Eye} label="Page Views (all time)" value={totals.views} color="text-blue-600" />
        <StatCard icon={QrCode} label="QR Scans" value={totals.scans} color="text-secondary" />
        <StatCard icon={MessageCircle} label="Approved Messages" value={totals.approved} color="text-emerald-600" />
        <StatCard icon={TrendingUp} label="Pending Messages" value={totals.pending} color="text-amber-600" />
        <StatCard icon={XCircle} label="Rejected Messages" value={totals.rejected} color="text-red-600" />
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="font-display text-xl text-foreground flex items-center gap-2">
              <BarChart3 size={20} /> Traffic Trend
            </h3>
            <div className="flex items-baseline gap-4 mt-2">
              <div>
                <p className="text-3xl font-display text-foreground">{rangeTotals.views}</p>
                <p className="text-xs text-muted-foreground">Views in last {rangeDays} days</p>
              </div>
              <div className="text-sm">
                <span className={rangeTotals.delta >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {rangeTotals.delta >= 0 ? "↑" : "↓"} {Math.abs(rangeTotals.delta).toFixed(1)}%
                </span>
                <span className="text-muted-foreground ml-1">vs previous period</span>
              </div>
              <div>
                <p className="text-3xl font-display text-foreground">{rangeTotals.scans}</p>
                <p className="text-xs text-muted-foreground">QR scans in last {rangeDays} days</p>
              </div>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs">
            {([7, 14, 30] as const).map((n) => (
              <button
                key={n}
                onClick={() => setRangeDays(n)}
                className={`px-3 py-1.5 transition-colors ${
                  rangeDays === n
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                Last {n} days
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))", fontWeight: 600 }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} iconType="line" />
              <Line
                type="monotone"
                dataKey="views"
                name="Website Views"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="prevViews"
                name="Previous period (views)"
                stroke="hsl(217, 91%, 60%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="scans"
                name="QR Scans"
                stroke="hsl(var(--secondary))"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
