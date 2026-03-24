import { useState, useEffect } from "react";
import { BarChart3, Eye, MessageCircle, XCircle, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileStat {
  slug: string;
  name: string;
  totalViews: number;
  approvedMessages: number;
  pendingMessages: number;
  rejectedMessages: number;
}

interface DailyStat {
  day: string;
  views: number;
}

const AdminAnalytics = ({ schoolId }: { schoolId: string | null }) => {
  const [profileStats, setProfileStats] = useState<ProfileStat[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [totals, setTotals] = useState({
    views: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [schoolId]);

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

    const [pageViewsRes, appreciationsRes] = await Promise.all([
      supabase.from("page_views").select("profile_slug, day, views").in("profile_slug", slugs),
      supabase.from("appreciations").select("profile_slug, status").in("profile_slug", slugs),
    ]);

    const pageViews = pageViewsRes.data ?? [];
    const appreciations = appreciationsRes.data ?? [];

    const stats: ProfileStat[] = profiles.map((p) => {
      const views = pageViews
        .filter((v) => v.profile_slug === p.slug)
        .reduce((sum, v) => sum + v.views, 0);

      const profileAppreciations = appreciations.filter((a) => a.profile_slug === p.slug);

      return {
        slug: p.slug,
        name: p.name,
        totalViews: views,
        approvedMessages: profileAppreciations.filter((a) => a.status === "approved").length,
        pendingMessages: profileAppreciations.filter((a) => a.status === "pending").length,
        rejectedMessages: profileAppreciations.filter((a) => a.status === "rejected").length,
      };
    });

    setProfileStats(stats);

    setTotals({
      views: stats.reduce((s, p) => s + p.totalViews, 0),
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

      days.push({ day: dayStr, views: dayViews });
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

  const maxDailyValue = Math.max(...dailyStats.map((d) => d.views), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Eye} label="Page Views" value={totals.views} color="text-blue-600" />
        <StatCard icon={MessageCircle} label="Approved Messages" value={totals.approved} color="text-emerald-600" />
        <StatCard icon={TrendingUp} label="Pending Messages" value={totals.pending} color="text-amber-600" />
        <StatCard icon={XCircle} label="Rejected Messages" value={totals.rejected} color="text-red-600" />
      </div>

      {/* Daily Trend Chart */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display text-xl text-foreground mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> 30-Day Trend
        </h3>
        <div className="flex items-end gap-[2px] h-40">
          {dailyStats.map((d) => {
            const viewHeight = maxDailyValue > 0 ? (d.views / maxDailyValue) * 100 : 0;
            return (
              <div
                key={d.day}
                className="flex-1 flex flex-col items-center group relative"
                title={`${d.day}\nViews: ${d.views}`}
              >
                <div
                  className="w-full bg-blue-400/60 rounded-t-sm transition-all hover:bg-blue-500/80"
                  style={{ height: `${Math.max(viewHeight, 2)}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-400/60" /> Page Views
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
                  <th className="pb-3 font-medium text-center">Page Views</th>
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
