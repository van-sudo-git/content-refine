import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  LogOut,
  CheckCircle,
  Clock,
  Star,
  UserPlus,
  Trash2,
  Eye,
} from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/use-auth-ready";
import AdminProfileManager from "@/components/AdminProfileManager";
import DemoProfileManager from "@/components/DemoProfileManager";
import AdminAnalytics from "@/components/AdminAnalytics";
import AdminFlyer from "@/pages/AdminFlyer";
import SchoolOnboarding from "@/components/SchoolOnboarding";
import type { Tables, Database } from "@/integrations/supabase/types";
import ManageRoles from "@/components/ManageRoles";
import {
  DEMO_NOMINATIONS,
  DEMO_ADMINS,
  DEMO_EMAIL,
  DEMO_ADMIN_NAME,
  DEMO_ROLES,
  DEMO_SCHOOL_ID,
  DEMO_SCHOOL_NAME,
} from "@/lib/demoData";

type Nomination = Tables<"nominations">;
type NominationStatus = Database["public"]["Enums"]["nomination_status"];

interface AdminRow {
  id: string;
  email: string;
  name: string | null;
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: typeof Clock }
> = {
  pending: {
    label: "Pending",
    color: "bg-amber-100 text-amber-800",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle,
  },
  assigned: {
    label: "Assigned",
    color: "bg-blue-100 text-blue-800",
    icon: UserPlus,
  },
  in_progress: {
    label: "In Progress",
    color: "bg-indigo-100 text-indigo-800",
    icon: Clock,
  },
  submitted: {
    label: "Submitted",
    color: "bg-cyan-100 text-cyan-800",
    icon: CheckCircle,
  },
  published: {
    label: "Published",
    color: "bg-purple-100 text-purple-800",
    icon: Star,
  },
};

const Admin = () => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [nominations, setNominations] = useState<Nomination[]>(
    isDemo ? DEMO_NOMINATIONS : []
  );
  const [admins, setAdmins] = useState<AdminRow[]>(
    isDemo ? DEMO_ADMINS : []
  );
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [editAdminName, setEditAdminName] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(
    isDemo ? DEMO_SCHOOL_ID : null
  );
  const [userEmail, setUserEmail] = useState<string | null>(
    isDemo ? DEMO_EMAIL : null
  );
  const [userName, setUserName] = useState<string | null>(
    isDemo ? DEMO_ADMIN_NAME : null
  );
  const [activeTab, setActiveTab] = useState<
    "nominations" | "profiles" | "admins" | "analytics" | "roles" | "flyer"
  >("nominations");
  const [selectedNomination, setSelectedNomination] =
    useState<Nomination | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(!isDemo);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  // In demo mode we deliberately show the global-admin experience so the
  // school onboarding workflow is visible without touching production data.
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(isDemo);
  const [allSchools, setAllSchools] = useState<
    { id: string; name: string }[]
  >(isDemo ? [{ id: DEMO_SCHOOL_ID, name: DEMO_SCHOOL_NAME }] : []);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(
    isDemo ? DEMO_SCHOOL_ID : null
  );

  // PR-only access: no admin row, only a club_roles row with role='pr'.
  const [isPrOnly, setIsPrOnly] = useState(false);

  // Club-role rosters are also seeded in demo mode so assignment names show.
  const [journalists, setJournalists] = useState<
    { id: string; email: string | null; name: string | null }[]
  >(
    isDemo
      ? DEMO_ROLES.filter((role) => role.role === "journalist")
      : []
  );
  const [photographers, setPhotographers] = useState<
    { id: string; email: string | null; name: string | null }[]
  >(
    isDemo
      ? DEMO_ROLES.filter((role) => role.role === "photographer")
      : []
  );
  const [artists, setArtists] = useState<
    { id: string; email: string | null; name: string | null }[]
  >(isDemo ? DEMO_ROLES.filter((role) => role.role === "artist") : []);

  const [assignJournalist, setAssignJournalist] = useState("");
  const [assignPhotographer, setAssignPhotographer] = useState("");
  const [assignArtist, setAssignArtist] = useState("");

  useEffect(() => {
    if (isDemo) return;
    if (!isReady) return;

    const init = async () => {
      if (!user?.email) {
        setLoading(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      const email = user.email ?? "";
      setUserEmail(email);

      const { data: adminRow } = await supabase
        .from("school_admins")
        .select("id, school_id, is_global_admin, name")
        .eq("email", email.toLowerCase())
        .limit(1)
        .maybeSingle();

      if (!adminRow) {
        const { data: prRole } = await supabase
          .from("club_roles")
          .select("id, school_id")
          .eq("email", email.toLowerCase())
          .eq("role", "pr")
          .limit(1)
          .maybeSingle();

        if (!prRole) {
          setLoading(false);
          navigate("/admin/login", { replace: true });
          return;
        }

        setIsPrOnly(true);
        setSchoolId(prRole.school_id);
        setSelectedSchoolId(prRole.school_id);
        setActiveTab("flyer");

        const { data: school } = await supabase
          .from("schools")
          .select("id, name")
          .eq("id", prRole.school_id)
          .single();

        if (school) setAllSchools([school]);

        setLoading(false);
        return;
      }

      setUserName(adminRow.name || email);

      if (adminRow.is_global_admin) {
        setIsGlobalAdmin(true);

        const { data: schools } = await supabase
          .from("schools")
          .select("id, name")
          .order("name");

        if (schools && schools.length > 0) {
          setAllSchools(schools);
          setSelectedSchoolId(schools[0].id);
          setSchoolId(schools[0].id);
          await loadData(schools[0].id);
        }
      } else {
        setSchoolId(adminRow.school_id);
        setSelectedSchoolId(adminRow.school_id);

        const { data: school } = await supabase
          .from("schools")
          .select("id, name")
          .eq("id", adminRow.school_id)
          .single();

        if (school) setAllSchools([school]);

        await loadData(adminRow.school_id);
      }

      setLoading(false);
    };

    init();
  }, [isReady, navigate, user, isDemo]);

  const handleSchoolSwitch = async (newSchoolId: string) => {
    if (isDemo) return;

    setSelectedSchoolId(newSchoolId);
    setSchoolId(newSchoolId);
    await loadData(newSchoolId);
  };

  const loadData = async (sid: string) => {
    const [nomRes, adminRes, rolesRes] = await Promise.all([
      supabase
        .from("nominations")
        .select("*")
        .eq("school_id", sid)
        .order("created_at", { ascending: false }),
      supabase
        .from("school_admins")
        .select("id, email, name")
        .eq("school_id", sid),
      supabase
        .from("club_roles")
        .select("id, email, name, role")
        .eq("school_id", sid),
    ]);

    if (nomRes.data) setNominations(nomRes.data);
    if (adminRes.data) setAdmins(adminRes.data as AdminRow[]);

    if (rolesRes.data) {
      setJournalists(
        rolesRes.data.filter((role) => role.role === "journalist")
      );
      setPhotographers(
        rolesRes.data.filter((role) => role.role === "photographer")
      );
      setArtists(rolesRes.data.filter((role) => role.role === "artist"));
    }
  };

  // Show assignments exactly as saved. An unassigned role must remain
  // unassigned rather than auto-selecting the only person in that roster.
  useEffect(() => {
    if (!selectedNomination) return;

    setAssignJournalist(selectedNomination.journalist_id ?? "");
    setAssignPhotographer(selectedNomination.photographer_id ?? "");
    setAssignArtist(selectedNomination.artist_id ?? "");
  }, [selectedNomination]);

  const approveWithAssignment = async (id: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    const { error } = await supabase
      .from("nominations")
      .update({
        status: "approved",
        admin_notes: adminNotes || null,
        journalist_id: assignJournalist || null,
        photographer_id: assignPhotographer || null,
        artist_id: assignArtist || null,
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Approved",
      description: "Assigned team members will get an email.",
    });
    setSelectedNomination(null);
    setAdminNotes("");
    if (schoolId) loadData(schoolId);
  };

  const deleteNomination = async (id: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    if (!confirm("Delete this nomination? This cannot be undone.")) return;

    const { error } = await supabase
      .from("nominations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Nomination deleted" });
    setSelectedNomination(null);
    if (schoolId) loadData(schoolId);
  };

  const demoGuard = () => {
    toast({
      title: "Demo Mode",
      description: "This action is disabled in demo mode.",
    });
  };

  const updateStatus = async (id: string, status: NominationStatus) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    const { error } = await supabase
      .from("nominations")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Updated",
      description: `Nomination marked as ${status}.`,
    });
    setSelectedNomination(null);
    setAdminNotes("");
    if (schoolId) loadData(schoolId);
  };

  const addAdmin = async () => {
    if (isDemo) {
      demoGuard();
      return;
    }

    if (!schoolId || !newAdminName.trim() || !newAdminEmail.trim()) return;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(newAdminEmail.trim())) {
      toast({
        title: "That doesn't look like a valid email",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("school_admins").insert({
      school_id: schoolId,
      name: newAdminName.trim(),
      email: newAdminEmail.trim().toLowerCase(),
    });

    if (error) {
      toast({
        title: "Error",
        description:
          error.code === "23505"
            ? "This email is already an admin."
            : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Admin added",
      description: `${newAdminName.trim()} can now access this dashboard.`,
    });
    setNewAdminName("");
    setNewAdminEmail("");
    loadData(schoolId);
  };

  const startAdminNameEdit = (admin: AdminRow) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    setEditingAdminId(admin.id);
    setEditAdminName(admin.name || "");
  };

  const saveAdminName = async (id: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    if (!editAdminName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("school_admins")
      .update({ name: editAdminName.trim() })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Admin name updated" });
    setEditingAdminId(null);
    setEditAdminName("");
    if (schoolId) loadData(schoolId);
  };

  const removeAdmin = async (id: string, email: string) => {
    if (isDemo) {
      demoGuard();
      return;
    }

    if (email.toLowerCase() === userEmail?.toLowerCase()) {
      toast({ title: "Can't remove yourself", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("school_admins")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Admin removed" });
    if (schoolId) loadData(schoolId);
  };

  const handleSignOut = async () => {
    if (isDemo) {
      navigate("/admin/login", { replace: true });
      return;
    }

    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  const counts = {
    pending: nominations.filter((nomination) => nomination.status === "pending")
      .length,
    approved: nominations.filter(
      (nomination) => nomination.status === "approved"
    ).length,
    published: nominations.filter(
      (nomination) => nomination.status === "published"
    ).length,
    total: nominations.length,
  };

  const selectedSchoolName =
    allSchools.find((school) => school.id === selectedSchoolId)?.name ??
    "Your School";

  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          {isDemo && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 flex items-center gap-3">
              <Eye size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Demo Mode
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You're viewing fictional sample data. Explore the full admin
                  workflow without changing production data.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="ml-auto shrink-0"
                onClick={() => navigate("/admin/login")}
              >
                Sign In
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {`Signed in as ${userName || userEmail}`}
                {isGlobalAdmin && " · Global Admin"}
                {!isGlobalAdmin &&
                  selectedSchoolName !== "Your School" &&
                  ` · ${selectedSchoolName}`}
              </p>
            </div>

            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} /> {isDemo ? "Exit Demo" : "Sign Out"}
            </Button>
          </div>

          {isGlobalAdmin && allSchools.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-foreground shrink-0">
                Viewing school:
              </label>
              <select
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={selectedSchoolId ?? ""}
                onChange={(event) => handleSchoolSwitch(event.target.value)}
                disabled={isDemo}
              >
                {allSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                {isDemo
                  ? "Demo is showing one fictional chapter; new-school creation is demonstrated under Manage Admins."
                  : "Switch schools to view their nominations, profiles, and analytics independently."}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total",
                value: counts.total,
                color: "text-foreground",
              },
              {
                label: "Pending",
                value: counts.pending,
                color: "text-amber-600",
              },
              {
                label: "Approved",
                value: counts.approved,
                color: "text-emerald-600",
              },
              {
                label: "Published",
                value: counts.published,
                color: "text-purple-600",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-card rounded-xl border border-border p-5 text-center"
              >
                <p className={`font-display text-3xl ${stat.color}`}>
                  {stat.value}
                </p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {!isPrOnly && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button
                variant={activeTab === "nominations" ? "secondary" : "outline"}
                onClick={() => setActiveTab("nominations")}
              >
                Nominations
              </Button>
              <Button
                variant={activeTab === "profiles" ? "secondary" : "outline"}
                onClick={() => setActiveTab("profiles")}
              >
                Profiles
              </Button>
              <Button
                variant={activeTab === "admins" ? "secondary" : "outline"}
                onClick={() => setActiveTab("admins")}
              >
                Manage Admins
              </Button>
              <Button
                variant={activeTab === "roles" ? "secondary" : "outline"}
                onClick={() => setActiveTab("roles")}
              >
                Manage Roles
              </Button>
              <Button
                variant={activeTab === "analytics" ? "secondary" : "outline"}
                onClick={() => setActiveTab("analytics")}
              >
                Analytics
              </Button>
              <Button
                variant={activeTab === "flyer" ? "secondary" : "outline"}
                onClick={() => setActiveTab("flyer")}
              >
                Flyer Generator
              </Button>
            </div>
          )}

          {isPrOnly && (
            <p className="text-sm text-muted-foreground mb-4">
              You have Community Outreach access for{" "}
              {allSchools[0]?.name ?? "your school"}. You can generate flyers
              for any published profile here.
            </p>
          )}

          {activeTab === "nominations" && (
            <div className="space-y-4">
              {nominations.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <p className="text-muted-foreground">
                    No nominations yet
                    {isGlobalAdmin ? ` for ${selectedSchoolName}` : ""}.
                  </p>
                </div>
              ) : (
                nominations.map((nomination) => {
                  const config =
                    statusConfig[nomination.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isSelected =
                    selectedNomination?.id === nomination.id;

                  return (
                    <div
                      key={nomination.id}
                      className={`bg-card rounded-xl border transition-colors ${
                        isSelected ? "border-secondary" : "border-border"
                      } p-6 cursor-pointer`}
                      onClick={() => {
                        setSelectedNomination(
                          isSelected ? null : nomination
                        );
                        setAdminNotes(nomination.admin_notes || "");
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display text-xl text-foreground">
                              {nomination.nominee_name}
                            </h3>
                            <Badge
                              className={`${config.color} border-0`}
                            >
                              <StatusIcon size={12} className="mr-1" />
                              {config.label}
                            </Badge>
                          </div>

                          <p className="text-muted-foreground text-sm">
                            {nomination.nominee_role} ·{" "}
                            {nomination.nominee_department}
                          </p>

                          <p className="text-foreground/80 text-sm mt-3 leading-relaxed">
                            {nomination.reason}
                          </p>

                          <p className="text-muted-foreground text-xs mt-3">
                            Nominated by {nomination.nominator_name} (
                            {nomination.nominator_email}) ·{" "}
                            {new Date(
                              nomination.created_at
                            ).toLocaleDateString()}
                            {nomination.nominee_informed &&
                              " · Nominee has been told"}
                          </p>

                          {(nomination.journalist_id ||
                            nomination.photographer_id ||
                            nomination.artist_id) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {nomination.journalist_id &&
                                `Journalist: ${
                                  (() => {
                                    const journalist = journalists.find(
                                      (item) =>
                                        item.id ===
                                        nomination.journalist_id
                                    );
                                    return journalist
                                      ? journalist.name || journalist.email
                                      : "—";
                                  })()
                                }`}
                              {nomination.photographer_id &&
                                ` · Photographer: ${
                                  (() => {
                                    const photographer =
                                      photographers.find(
                                        (item) =>
                                          item.id ===
                                          nomination.photographer_id
                                      );
                                    return photographer
                                      ? photographer.name ||
                                          photographer.email
                                      : "—";
                                  })()
                                }`}
                              {nomination.artist_id &&
                                ` · Artist: ${
                                  (() => {
                                    const artist = artists.find(
                                      (item) =>
                                        item.id === nomination.artist_id
                                    );
                                    return artist
                                      ? artist.name || artist.email
                                      : "—";
                                  })()
                                }`}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div
                          className="mt-4 pt-4 border-t border-border space-y-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">
                              Admin Notes
                            </label>
                            <Textarea
                              value={adminNotes}
                              onChange={(event) =>
                                setAdminNotes(event.target.value)
                              }
                              placeholder="Internal notes about this nomination..."
                              className="min-h-[80px]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Journalist
                              </label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignJournalist}
                                onChange={(event) =>
                                  setAssignJournalist(event.target.value)
                                }
                              >
                                <option value="">
                                  {journalists.length === 0
                                    ? "No journalists yet"
                                    : "Not assigned"}
                                </option>
                                {journalists.map((journalist) => (
                                  <option
                                    key={journalist.id}
                                    value={journalist.id}
                                  >
                                    {journalist.name || journalist.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Photographer
                              </label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignPhotographer}
                                onChange={(event) =>
                                  setAssignPhotographer(event.target.value)
                                }
                              >
                                <option value="">
                                  {photographers.length === 0
                                    ? "No photographers yet"
                                    : "Not assigned"}
                                </option>
                                {photographers.map((photographer) => (
                                  <option
                                    key={photographer.id}
                                    value={photographer.id}
                                  >
                                    {photographer.name ||
                                      photographer.email}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">
                                Artist
                              </label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignArtist}
                                onChange={(event) =>
                                  setAssignArtist(event.target.value)
                                }
                              >
                                <option value="">
                                  {artists.length === 0
                                    ? "No artists yet"
                                    : "Not assigned"}
                                </option>
                                {artists.map((artist) => (
                                  <option key={artist.id} value={artist.id}>
                                    {artist.name || artist.email}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() =>
                                approveWithAssignment(nomination.id)
                              }
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCircle size={14} /> Approve & Assign
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateStatus(nomination.id, "pending")
                              }
                            >
                              <Clock size={14} /> Reset to Pending
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                deleteNomination(nomination.id)
                              }
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={14} /> Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === "profiles" &&
            (isDemo ? (
              <DemoProfileManager />
            ) : (
              <AdminProfileManager schoolId={schoolId} />
            ))}

          {activeTab === "analytics" && (
            <AdminAnalytics schoolId={schoolId} isDemo={isDemo} />
          )}

          {activeTab === "flyer" && (
            <AdminFlyer schoolId={schoolId} isDemo={isDemo} />
          )}

          {activeTab === "roles" && (
            <ManageRoles schoolId={schoolId} isDemo={isDemo} />
          )}

          {activeTab === "admins" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-xl text-foreground mb-4">
                  School Admins{" "}
                  {isGlobalAdmin && `— ${selectedSchoolName}`}
                </h3>

                <p className="text-muted-foreground text-sm mb-6">
                  Add a name and email address to grant admin access. They'll
                  need to create an account using that email.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                  <Input
                    placeholder="Admin name"
                    value={newAdminName}
                    onChange={(event) =>
                      setNewAdminName(event.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    type="email"
                    placeholder="Admin email"
                    value={newAdminEmail}
                    onChange={(event) =>
                      setNewAdminEmail(event.target.value)
                    }
                    onKeyDown={(event) =>
                      event.key === "Enter" && addAdmin()
                    }
                    className="flex-1"
                  />
                  <Button
                    onClick={addAdmin}
                    disabled={
                      !newAdminName.trim() || !newAdminEmail.trim()
                    }
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0"
                  >
                    <UserPlus size={16} /> Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between gap-4 py-3 px-4 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        {editingAdminId === admin.id ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="min-w-0 sm:w-64">
                              <p className="text-xs text-muted-foreground truncate">
                                {admin.email}
                              </p>
                            </div>
                            <Input
                              value={editAdminName}
                              onChange={(event) =>
                                setEditAdminName(event.target.value)
                              }
                              placeholder="Admin name"
                              className="h-8 text-sm flex-1"
                              autoFocus
                              onKeyDown={(event) => {
                                if (event.key === "Enter")
                                  saveAdminName(admin.id);
                                if (event.key === "Escape") {
                                  setEditingAdminId(null);
                                  setEditAdminName("");
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={() => saveAdminName(admin.id)}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingAdminId(null);
                                setEditAdminName("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startAdminNameEdit(admin)}
                            className="text-left min-w-0 hover:opacity-80 transition-opacity"
                            title={
                              isDemo
                                ? "View-only in demo mode"
                                : "Click to edit name"
                            }
                          >
                            <p className="text-sm font-medium text-foreground">
                              {admin.name || (
                                <span className="text-muted-foreground italic font-normal">
                                  no name — click to add
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {admin.email}
                            </p>
                          </button>
                        )}
                      </div>

                      {editingAdminId !== admin.id &&
                        admin.email.toLowerCase() !==
                          userEmail?.toLowerCase() && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              removeAdmin(admin.id, admin.email)
                            }
                            className="text-muted-foreground hover:text-destructive shrink-0"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {isGlobalAdmin && (
                <SchoolOnboarding
                  isDemo={isDemo}
                  onSchoolCreated={async () => {
                    if (isDemo) return;

                    const { data: schools } = await supabase
                      .from("schools")
                      .select("id, name")
                      .order("name");

                    if (schools) setAllSchools(schools);
                  }}
                />
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Admin;