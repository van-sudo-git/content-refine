/**
 * AdminAnalytics
 * VERSION: 2026-07-27-v4-no-warning
 *
 * Global scope:
 * - Page-view summary
 * - QR-scan summary
 * - Traffic trend chart
 *
 * Selected-school scope:
 * - Per-profile table
 * - Appreciation-message counts
 * - QR columns shown in the table
 *
 * Analytics comes from both the main Supabase project and the external
 * heros-redirect Supabase project. A failed optional query no longer causes
 * the entire analytics screen to fail; available data still renders while
 * source failures are logged only to the browser console.
 */

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Eye,
  MessageCircle,
  QrCode,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  DEMO_ALL_QR_IDS,
  DEMO_DAILY_STATS,
  DEMO_PROFILE_STATS,
  DEMO_TOTALS,
} from "@/lib/demoData";
import { herosRedirectClient } from "@/lib/herosRedirectClient";

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

type ProfileRow = {
  slug: string;
  name: string;
};

type PageViewRow = {
  profile_slug: string;
  day: string;
  views: number;
};

type AppreciationRow = {
  profile_slug: string;
  status: string;
};

type LocalRedirectRow = {
  id: string;
  profile_slug: string;
  active: boolean;
};

type ExternalRedirectRow = {
  id: string;
  destination_url: string | null;
  active: boolean;
};

type NormalizedRedirectRow = {
  id: string;
  profile_slug: string;
};

type QrDailyRow = {
  id: string;
  day: string;
  count: number;
};

type SettledQuery = PromiseSettledResult<unknown>;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    const parts = [
      candidate.message,
      candidate.details,
      candidate.hint,
      candidate.code ? `Code: ${String(candidate.code)}` : null,
    ].filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0,
    );

    if (parts.length > 0) return parts.join(" — ");

    try {
      return JSON.stringify(error);
    } catch {
      return "Unknown analytics error";
    }
  }

  return String(error || "Unknown analytics error");
};

const getRows = <T,>(
  label: string,
  result: SettledQuery,
  warnings: string[],
): T[] => {
  if (result.status === "rejected") {
    const message = `${label}: ${getErrorMessage(result.reason)}`;
    console.error(message, result.reason);
    warnings.push(message);
    return [];
  }

  const response = result.value as {
    data?: unknown;
    error?: unknown;
  };

  if (response.error) {
    const message = `${label}: ${getErrorMessage(response.error)}`;
    console.error(message, response.error);
    warnings.push(message);
    return [];
  }

  return Array.isArray(response.data) ? (response.data as T[]) : [];
};

const getSlugFromRedirect = (redirect: {
  destination_url?: string | null;
  profile_slug?: string | null;
}): string | null => {
  if (redirect.profile_slug) return redirect.profile_slug;

  try {
    // The base also lets this work when destination_url is a relative URL.
    const path = new URL(
      redirect.destination_url ?? "",
      "https://nowweseeyou.org",
    ).pathname;
    const match = path.match(/^\/gallery\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
};

const toLocalDay = (date: Date): string =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const AdminAnalytics = ({
  schoolId,
  isDemo = false,
}: {
  schoolId: string | null;
  isDemo?: boolean;
}) => {
  const [profileStats, setProfileStats] = useState<ProfileStat[]>(
    isDemo ? DEMO_PROFILE_STATS : [],
  );
  const [dailyStats, setDailyStats] = useState<DailyStat[]>(
    isDemo ? DEMO_DAILY_STATS : [],
  );
  const [allQrIds, setAllQrIds] = useState<string[]>(
    isDemo ? DEMO_ALL_QR_IDS : [],
  );
  const [totals, setTotals] = useState(
    isDemo
      ? DEMO_TOTALS
      : {
          views: 0,
          scans: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
        },
  );
  const [loading, setLoading] = useState(!isDemo);
  const [rangeDays, setRangeDays] = useState<7 | 14 | 30>(7);

  useEffect(() => {
    if (isDemo) return;

    console.info("[AdminAnalytics] running v3-final");

    let cancelled = false;

    const loadAnalytics = async () => {
      setLoading(true);

      try {
        /*
         * Do not load all profiles for the global chart. Global page_views can
         * be aggregated directly, while the profiles query stays restricted to
         * the selected school.
         */
        const schoolProfilesQuery = schoolId
          ? supabase
              .from("profiles")
              .select("slug, name")
              .eq("school_id", schoolId)
              .eq("status", "published")
          : Promise.resolve({ data: [] as ProfileRow[], error: null });

        const schoolProfilesResult = await Promise.resolve(
          schoolProfilesQuery,
        );

        const schoolProfilesError = (
          schoolProfilesResult as { error?: unknown }
        ).error;

        let schoolProfiles: ProfileRow[] = [];
        const loadWarnings: string[] = [];

        if (schoolProfilesError) {
          const message = `Selected-school profiles: ${getErrorMessage(
            schoolProfilesError,
          )}`;
          console.error(message, schoolProfilesError);
          loadWarnings.push(message);
        } else {
          const data = (schoolProfilesResult as { data?: unknown }).data;
          schoolProfiles = Array.isArray(data) ? (data as ProfileRow[]) : [];
        }

        const schoolSlugSet = new Set(
          schoolProfiles.map((profile) => profile.slug),
        );
        const schoolSlugs = Array.from(schoolSlugSet);

        const appreciationsQuery = schoolSlugs.length
          ? supabase
              .from("appreciations")
              .select("profile_slug, status")
              .in("profile_slug", schoolSlugs)
          : Promise.resolve({ data: [] as AppreciationRow[], error: null });

        const results = await Promise.allSettled([
          // Global traffic data.
          supabase.from("page_views").select("profile_slug, day, views"),

          // Selected-school message data.
          appreciationsQuery,

          // Main-project QR data.
          supabase.from("redirects").select("id, profile_slug, active"),
          supabase.from("redirect_events_daily").select("id, day, count"),

          // External heros-redirect QR data.
          herosRedirectClient
            .from("redirects")
            .select("id, destination_url, active"),
          herosRedirectClient
            .from("redirect_events_daily")
            .select("id, day, count"),
        ]);

        const pageViews = getRows<PageViewRow>(
          "Global page views",
          results[0],
          loadWarnings,
        );
        const appreciations = getRows<AppreciationRow>(
          "Selected-school appreciations",
          results[1],
          loadWarnings,
        );
        const localRedirectRows = getRows<LocalRedirectRow>(
          "Main-project redirects",
          results[2],
          loadWarnings,
        );
        const localQrDaily = getRows<QrDailyRow>(
          "Main-project QR events",
          results[3],
          loadWarnings,
        );
        const externalRedirectRows = getRows<ExternalRedirectRow>(
          "External redirects",
          results[4],
          loadWarnings,
        );
        const externalQrDaily = getRows<QrDailyRow>(
          "External QR events",
          results[5],
          loadWarnings,
        );

        const localRedirects: NormalizedRedirectRow[] = localRedirectRows
          .filter(
            (redirect) =>
              redirect.active && Boolean(redirect.profile_slug),
          )
          .map((redirect) => ({
            id: redirect.id,
            profile_slug: redirect.profile_slug,
          }));

        const externalRedirects: NormalizedRedirectRow[] =
          externalRedirectRows
            .filter((redirect) => redirect.active)
            .map((redirect) => ({
              id: redirect.id,
              profile_slug: getSlugFromRedirect(redirect),
            }))
            .filter(
              (
                redirect,
              ): redirect is NormalizedRedirectRow =>
                Boolean(redirect.profile_slug),
            );

        /*
         * External redirects take precedence when the same QR ID exists in
         * both projects. Insert local first, then external, so external wins.
         */
        const redirects = Array.from(
          [...localRedirects, ...externalRedirects]
            .reduce(
              (map, redirect) => map.set(redirect.id, redirect),
              new Map<string, NormalizedRedirectRow>(),
            )
            .values(),
        );

        const externalQrIds = new Set(
          externalRedirects.map((redirect) => redirect.id),
        );

        const qrDaily: QrDailyRow[] = [
          ...externalQrDaily,
          ...localQrDaily.filter((row) => !externalQrIds.has(row.id)),
        ];

        // Count only events whose active redirect is available.
        const activeGlobalQrIds = new Set(
          redirects.map((redirect) => redirect.id),
        );
        const globalQrDaily = qrDaily.filter((row) =>
          activeGlobalQrIds.has(row.id),
        );

        // Selected-school data for the profile table.
        const schoolPageViews = pageViews.filter((view) =>
          schoolSlugSet.has(view.profile_slug),
        );

        const schoolRedirects = redirects.filter((redirect) =>
          schoolSlugSet.has(redirect.profile_slug),
        );
        const schoolQrIds = new Set(
          schoolRedirects.map((redirect) => redirect.id),
        );
        const schoolQrDaily = globalQrDaily.filter((row) =>
          schoolQrIds.has(row.id),
        );

        const slugToQrIds: Record<string, string[]> = {};
        schoolRedirects.forEach((redirect) => {
          if (!slugToQrIds[redirect.profile_slug]) {
            slugToQrIds[redirect.profile_slug] = [];
          }
          slugToQrIds[redirect.profile_slug].push(redirect.id);
        });

        const stats: ProfileStat[] = schoolProfiles.map((profile) => {
          const totalViews = schoolPageViews
            .filter((view) => view.profile_slug === profile.slug)
            .reduce((sum, view) => sum + Number(view.views || 0), 0);

          const qrScans: Record<string, number> = {};
          (slugToQrIds[profile.slug] ?? []).forEach((qrId) => {
            qrScans[qrId] = schoolQrDaily
              .filter((row) => row.id === qrId)
              .reduce((sum, row) => sum + Number(row.count || 0), 0);
          });

          const profileAppreciations = appreciations.filter(
            (appreciation) =>
              appreciation.profile_slug === profile.slug,
          );

          return {
            slug: profile.slug,
            name: profile.name,
            totalViews,
            qrScans,
            approvedMessages: profileAppreciations.filter(
              (appreciation) => appreciation.status === "approved",
            ).length,
            pendingMessages: profileAppreciations.filter(
              (appreciation) => appreciation.status === "pending",
            ).length,
            rejectedMessages: profileAppreciations.filter(
              (appreciation) => appreciation.status === "rejected",
            ).length,
          };
        });

        const today = new Date();
        const days: DailyStat[] = [];

        for (let offset = 59; offset >= 0; offset -= 1) {
          const date = new Date(today);
          date.setDate(date.getDate() - offset);
          const day = toLocalDay(date);

          days.push({
            day,
            views: pageViews
              .filter((view) => view.day === day)
              .reduce((sum, view) => sum + Number(view.views || 0), 0),
            scans: globalQrDaily
              .filter((row) => row.day === day)
              .reduce((sum, row) => sum + Number(row.count || 0), 0),
          });
        }

        if (cancelled) return;

        setProfileStats(stats);
        setAllQrIds(Array.from(schoolQrIds).sort());
        setDailyStats(days);
        setTotals({
          // Global traffic for every admin.
          views: pageViews.reduce(
            (sum, view) => sum + Number(view.views || 0),
            0,
          ),
          scans: globalQrDaily.reduce(
            (sum, row) => sum + Number(row.count || 0),
            0,
          ),

          // Selected-school message totals.
          approved: stats.reduce(
            (sum, profile) => sum + profile.approvedMessages,
            0,
          ),
          pending: stats.reduce(
            (sum, profile) => sum + profile.pendingMessages,
            0,
          ),
          rejected: stats.reduce(
            (sum, profile) => sum + profile.rejectedMessages,
            0,
          ),
        });
        if (loadWarnings.length > 0) {
          console.warn(
            "[AdminAnalytics] Some analytics sources could not be read:",
            loadWarnings,
          );
        }
      } catch (error) {
        const message = `Unexpected analytics failure: ${getErrorMessage(error)}`;
        console.error(message, error);

        // Never replace the entire analytics panel with a fatal error screen.
        // Render the UI with available/empty data; details stay in the console.
        if (!cancelled) {
          setProfileStats([]);
          setAllQrIds([]);
          setDailyStats([]);
          setTotals({
            views: 0,
            scans: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, [schoolId, isDemo]);

  const chartData = useMemo(() => {
    const current = dailyStats.slice(-rangeDays);
    const previous = dailyStats.slice(-rangeDays * 2, -rangeDays);

    return current.map((day, index) => ({
      day: day.day,
      label: new Date(`${day.day}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      views: day.views,
      scans: day.scans,
      prevViews: previous[index]?.views ?? 0,
    }));
  }, [dailyStats, rangeDays]);

  const rangeTotals = useMemo(() => {
    const views = chartData.reduce((sum, day) => sum + day.views, 0);
    const scans = chartData.reduce((sum, day) => sum + day.scans, 0);
    const previousViews = chartData.reduce(
      (sum, day) => sum + day.prevViews,
      0,
    );
    const delta =
      previousViews > 0
        ? ((views - previousViews) / previousViews) * 100
        : views > 0
          ? 100
          : 0;

    return { views, scans, previousViews, delta };
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
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard
          icon={Eye}
          label="Page Views (all schools)"
          value={totals.views}
          color="text-blue-600"
        />
        <StatCard
          icon={QrCode}
          label="QR Scans (all schools)"
          value={totals.scans}
          color="text-secondary"
        />
        <StatCard
          icon={MessageCircle}
          label="Approved Messages"
          value={totals.approved}
          color="text-emerald-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Pending Messages"
          value={totals.pending}
          color="text-amber-600"
        />
        <StatCard
          icon={XCircle}
          label="Rejected Messages"
          value={totals.rejected}
          color="text-red-600"
        />
      </div>

      {/* Global traffic trend */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display flex items-center gap-2 text-xl text-foreground">
              <BarChart3 size={20} /> Traffic Trend (All Schools)
            </h3>

            <div className="mt-2 flex flex-wrap items-baseline gap-4">
              <div>
                <p className="font-display text-3xl text-foreground">
                  {rangeTotals.views}
                </p>
                <p className="text-xs text-muted-foreground">
                  Views in last {rangeDays} days
                </p>
              </div>

              <div className="text-sm">
                <span
                  className={
                    rangeTotals.delta >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }
                >
                  {rangeTotals.delta >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(rangeTotals.delta).toFixed(1)}%
                </span>
                <span className="ml-1 text-muted-foreground">
                  vs previous period
                </span>
              </div>

              <div>
                <p className="font-display text-3xl text-foreground">
                  {rangeTotals.scans}
                </p>
                <p className="text-xs text-muted-foreground">
                  QR scans in last {rangeDays} days
                </p>
              </div>
            </div>
          </div>

          <div className="inline-flex overflow-hidden rounded-lg border border-border text-xs">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => setRangeDays(days)}
                className={`px-3 py-1.5 transition-colors ${
                  rangeDays === days
                    ? "bg-foreground text-background"
                    : "bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                Last {days} days
              </button>
            ))}
          </div>
        </div>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
                tickLine={false}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{
                  fontSize: 11,
                  fill: "hsl(var(--muted-foreground))",
                }}
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
                labelStyle={{
                  color: "hsl(var(--foreground))",
                  fontWeight: 600,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
                iconType="line"
              />
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

      {/* Selected-school profile table */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-display mb-4 text-xl text-foreground">
          Selected School Profiles
        </h3>

        {!schoolId ? (
          <p className="text-sm text-muted-foreground">
            Select a school to view its profiles.
          </p>
        ) : profileStats.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No published profiles found for this school.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Profile</th>
                  <th className="pb-3 text-center font-medium">
                    Website Views
                  </th>
                  {allQrIds.map((qrId) => (
                    <th
                      key={qrId}
                      className="pb-3 text-center font-medium"
                    >
                      <span className="flex items-center justify-center gap-1">
                        <QrCode size={12} />
                        {qrId}
                      </span>
                    </th>
                  ))}
                  <th className="pb-3 text-center font-medium">Approved</th>
                  <th className="pb-3 text-center font-medium">Pending</th>
                  <th className="pb-3 text-center font-medium">Rejected</th>
                </tr>
              </thead>

              <tbody>
                {profileStats.map((profile) => (
                  <tr
                    key={profile.slug}
                    className="border-b border-border/50 last:border-0"
                  >
                    <td className="py-3 font-medium text-foreground">
                      {profile.name}
                    </td>
                    <td className="py-3 text-center font-medium text-blue-600">
                      {profile.totalViews}
                    </td>
                    {allQrIds.map((qrId) => (
                      <td
                        key={qrId}
                        className="py-3 text-center font-medium text-secondary"
                      >
                        {profile.qrScans[qrId] ?? "—"}
                      </td>
                    ))}
                    <td className="py-3 text-center font-medium text-emerald-600">
                      {profile.approvedMessages}
                    </td>
                    <td className="py-3 text-center font-medium text-amber-600">
                      {profile.pendingMessages}
                    </td>
                    <td className="py-3 text-center font-medium text-red-600">
                      {profile.rejectedMessages}
                    </td>
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
    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
  </div>
);

export default AdminAnalytics;