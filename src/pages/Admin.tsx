import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LogOut, CheckCircle, XCircle, Clock, Star, UserPlus, Trash2, Eye } from "lucide-react";
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
import { DEMO_NOMINATIONS, DEMO_ADMINS, DEMO_EMAIL } from "@/lib/demoData";

type Nomination = Tables<"nominations">;
type NominationStatus = Database["public"]["Enums"]["nomination_status"];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800", icon: UserPlus },
  in_progress: { label: "In Progress", color: "bg-indigo-100 text-indigo-800", icon: Clock },
  submitted: { label: "Submitted", color: "bg-cyan-100 text-cyan-800", icon: CheckCircle },
  published: { label: "Published", color: "bg-purple-100 text-purple-800", icon: Star },
};


const Admin = () => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [nominations, setNominations] = useState<Nomination[]>(isDemo ? DEMO_NOMINATIONS : []);
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>(isDemo ? DEMO_ADMINS : []);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(isDemo ? "demo-school" : null);
  const [userEmail, setUserEmail] = useState<string | null>(isDemo ? DEMO_EMAIL : null);
  const [activeTab, setActiveTab] = useState<"nominations" | "profiles" | "admins" | "analytics" | "roles" | "flyer">("nominations");
  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(!isDemo);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  // global admin state
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [allSchools, setAllSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);

  // pr-only access - no admin row, just a club_roles row with role='pr'
  const [isPrOnly, setIsPrOnly] = useState(false);

  // club roles rosters, loaded per school so the assignment dropdowns have someone to pick from
  const [journalists, setJournalists] = useState<{ id: string; email: string | null }[]>([]);
  const [photographers, setPhotographers] = useState<{ id: string; email: string | null }[]>([]);
  const [artists, setArtists] = useState<{ id: string; email: string | null }[]>([]);

  // whoever's currently picked in the assignment dropdowns for the open nomination
  const [assignJournalist, setAssignJournalist] = useState<string>("");
  const [assignPhotographer, setAssignPhotographer] = useState<string>("");
  const [assignArtist, setAssignArtist] = useState<string>("");

  useEffect(() => {
    if (isDemo) return; // skip auth check in demo mode
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
      .select("id, school_id, is_global_admin")
      .eq("email", email.toLowerCase())
      .limit(1)
      .maybeSingle();

    if (!adminRow) {
      // not a school admin - check if they're pr instead, they still get in
      // but only see the flyer generator, nothing else
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

      // check if global admin
      if (adminRow.is_global_admin) {
        setIsGlobalAdmin(true);

        // load all schools for the selector
        const { data: schools } = await supabase
          .from("schools")
          .select("id, name")
          .order("name");

        if (schools && schools.length > 0) {
          setAllSchools(schools);
          // default to first school
          setSelectedSchoolId(schools[0].id);
          setSchoolId(schools[0].id);
          await loadData(schools[0].id);
        }
      } else {
        // regular school admin — load their school only
        setSchoolId(adminRow.school_id);
        setSelectedSchoolId(adminRow.school_id);
        // fetch school name for display
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

  // when global admin switches school
  const handleSchoolSwitch = async (newSchoolId: string) => {
    setSelectedSchoolId(newSchoolId);
    setSchoolId(newSchoolId);
    await loadData(newSchoolId);
  };

  const loadData = async (sid: string) => {
    const [nomRes, adminRes, rolesRes] = await Promise.all([
      supabase.from("nominations").select("*").eq("school_id", sid).order("created_at", { ascending: false }),
      supabase.from("school_admins").select("id, email").eq("school_id", sid),
      supabase.from("club_roles").select("id, email, role").eq("school_id", sid),
    ]);
    if (nomRes.data) setNominations(nomRes.data);
    if (adminRes.data) setAdmins(adminRes.data);

    // split the roster by role so each dropdown only shows the right people
    if (rolesRes.data) {
      setJournalists(rolesRes.data.filter((r) => r.role === "journalist"));
      setPhotographers(rolesRes.data.filter((r) => r.role === "photographer"));
      setArtists(rolesRes.data.filter((r) => r.role === "artist"));
    }
  };

  // when a nomination card opens, show who's already assigned to it -
  // fall back to auto-picking if there's only one option for that role
  useEffect(() => {
    if (!selectedNomination) return;

    setAssignJournalist(
      selectedNomination.journalist_id ?? (journalists.length === 1 ? journalists[0].id : "")
    );
    setAssignPhotographer(
      selectedNomination.photographer_id ?? (photographers.length === 1 ? photographers[0].id : "")
    );
    setAssignArtist(
      selectedNomination.artist_id ?? (artists.length === 1 ? artists[0].id : "")
    );
  }, [selectedNomination, journalists, photographers, artists]);

  // approving is what fires the assigned-team email, so assignment has to
  // happen in the same action - no one picked just means that role stays null
  const approveWithAssignment = async (id: string) => {
    if (isDemo) { demoGuard(); return; }

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
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Approved", description: "Assigned team members will get an email." });
    setSelectedNomination(null);
    setAdminNotes("");
    if (schoolId) loadData(schoolId);
  };

  const deleteNomination = async (id: string) => {
    if (isDemo) { demoGuard(); return; }
    if (!confirm("Delete this nomination? This cannot be undone.")) return;
  
    const { error } = await supabase.from("nominations").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
  
    toast({ title: "Nomination deleted" });
    setSelectedNomination(null);
    if (schoolId) loadData(schoolId);
  };
  
  const demoGuard = () => {
    toast({ title: "Demo Mode", description: "This action is disabled in demo mode.", variant: "destructive" });
  };

  const updateStatus = async (id: string, status: NominationStatus) => {
    if (isDemo) { demoGuard(); return; }
    const { error } = await supabase
      .from("nominations")
      .update({ status, admin_notes: adminNotes || null })
      .eq("id", id);


    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Updated", description: `Nomination marked as ${status}.` });
    setSelectedNomination(null);
    setAdminNotes("");
    if (schoolId) loadData(schoolId);
  };

  const addAdmin = async () => {
    if (isDemo) { demoGuard(); return; }
    if (!schoolId || !newAdminEmail.trim()) return;

    const { error } = await supabase.from("school_admins").insert({
      school_id: schoolId,
      email: newAdminEmail.trim().toLowerCase(),
    });

    if (error) {
      toast({
        title: "Error",
        description: error.code === "23505" ? "This email is already an admin." : error.message,
        variant: "destructive",
      });
      return;
    }

    toast({ title: "Admin added", description: `${newAdminEmail} can now access this dashboard.` });
    setNewAdminEmail("");
    loadData(schoolId);
  };

  const removeAdmin = async (id: string, email: string) => {
    if (isDemo) { demoGuard(); return; }
    if (email === userEmail) {
      toast({ title: "Can't remove yourself", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("school_admins").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
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
    pending: nominations.filter((n) => n.status === "pending").length,
    approved: nominations.filter((n) => n.status === "approved").length,
    published: nominations.filter((n) => n.status === "published").length,
    total: nominations.length,
  };


  const selectedSchoolName = allSchools.find((s) => s.id === selectedSchoolId)?.name ?? "Your School";

  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          {/* Demo Banner */}
          {isDemo && (
            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 p-4 flex items-center gap-3">
              <Eye size={20} className="text-amber-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Demo Mode</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  You're viewing sample data. Sign in with a real admin account to manage your school.
                </p>
              </div>
              <Button size="sm" variant="outline" className="ml-auto shrink-0" onClick={() => navigate("/admin/login")}>
                Sign In
              </Button>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isDemo ? "Demo account" : `Signed in as ${userEmail}`}
                {isGlobalAdmin && " · Global Admin"}
                {!isGlobalAdmin && selectedSchoolName !== "Your School" && ` · ${selectedSchoolName}`}
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} /> {isDemo ? "Exit Demo" : "Sign Out"}
            </Button>
          </div>

          {/* Global admin school selector */}
          {isGlobalAdmin && allSchools.length > 0 && (
            <div className="mb-6 flex items-center gap-3">
              <label className="text-sm font-medium text-foreground shrink-0">Viewing school:</label>
              <select
                className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                value={selectedSchoolId ?? ""}
                onChange={(e) => handleSchoolSwitch(e.target.value)}
              >
                {allSchools.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span className="text-xs text-muted-foreground">
                Switch schools to view their nominations, profiles, and analytics independently.
              </span>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: counts.total, color: "text-foreground" },
              { label: "Pending", value: counts.pending, color: "text-amber-600" },
              { label: "Approved", value: counts.approved, color: "text-emerald-600" },
              { label: "Published", value: counts.published, color: "text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5 text-center">
                <p className={`font-display text-3xl ${stat.color}`}>{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs - pr-only users skip this entirely, they land straight on flyer */}
          {!isPrOnly && (
            <div className="flex gap-2 mb-6 flex-wrap">
              <Button variant={activeTab === "nominations" ? "secondary" : "outline"} onClick={() => setActiveTab("nominations")}>
                Nominations
              </Button>
              <Button variant={activeTab === "profiles" ? "secondary" : "outline"} onClick={() => setActiveTab("profiles")}>
                Profiles
              </Button>
              <Button variant={activeTab === "admins" ? "secondary" : "outline"} onClick={() => setActiveTab("admins")}>
                Manage Admins
              </Button>
              <Button variant={activeTab === "roles" ? "secondary" : "outline"} onClick={() => setActiveTab("roles")}>
                Manage Roles
              </Button>
              <Button variant={activeTab === "analytics" ? "secondary" : "outline"} onClick={() => setActiveTab("analytics")}>
                Analytics
              </Button>
              <Button variant={activeTab === "flyer" ? "secondary" : "outline"} onClick={() => setActiveTab("flyer")}>
                Flyer Generator
              </Button>
            </div>
          )}

          {isPrOnly && (
            <p className="text-sm text-muted-foreground mb-4">
              You have PR access for {allSchools[0]?.name ?? "your school"}. You can generate
              flyers for any published profile here.
            </p>
          )}

          {/* Nominations Tab */}
          {activeTab === "nominations" && (
            <div className="space-y-4">
              {nominations.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <p className="text-muted-foreground">No nominations yet{isGlobalAdmin ? ` for ${selectedSchoolName}` : ""}.</p>
                </div>
              ) : (
                nominations.map((nom) => {
                  const config = statusConfig[nom.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  const isSelected = selectedNomination?.id === nom.id;

                  return (
                    <div
                      key={nom.id}
                      className={`bg-card rounded-xl border transition-colors ${
                        isSelected ? "border-secondary" : "border-border"
                      } p-6 cursor-pointer`}
                      onClick={() => {
                        setSelectedNomination(isSelected ? null : nom);
                        setAdminNotes(nom.admin_notes || "");
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-display text-xl text-foreground">{nom.nominee_name}</h3>
                            <Badge className={`${config.color} border-0`}>
                              <StatusIcon size={12} className="mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {nom.nominee_role} · {nom.nominee_department}
                          </p>
                          <p className="text-foreground/80 text-sm mt-3 leading-relaxed">{nom.reason}</p>
                          <p className="text-muted-foreground text-xs mt-3">
                            Nominated by {nom.nominator_name} ({nom.nominator_email}) ·{" "}
                            {new Date(nom.created_at).toLocaleDateString()}
                            {nom.nominee_informed && " · Nominee has been told"}
                          </p>
                          {(nom.journalist_id || nom.photographer_id || nom.artist_id) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {nom.journalist_id &&
                                `Journalist: ${journalists.find((j) => j.id === nom.journalist_id)?.email ?? "—"}`}
                              {nom.photographer_id &&
                                ` · Photographer: ${photographers.find((p) => p.id === nom.photographer_id)?.email ?? "—"}`}
                              {nom.artist_id &&
                                ` · Artist: ${artists.find((a) => a.id === nom.artist_id)?.email ?? "—"}`}
                            </p>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={(e) => e.stopPropagation()}>
                          <div>
                            <label className="text-sm font-medium text-foreground block mb-1.5">Admin Notes</label>
                            <Textarea
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              placeholder="Internal notes about this nomination..."
                              className="min-h-[80px]"
                            />
                          </div>

                          {/* assign the team before approving - approving is what sends the emails */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">Journalist</label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignJournalist}
                                onChange={(e) => setAssignJournalist(e.target.value)}
                              >
                                <option value="">
                                  {journalists.length === 0 ? "No journalists yet" : "Not assigned"}
                                </option>
                                {journalists.map((j) => (
                                  <option key={j.id} value={j.id}>{j.email}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">Photographer</label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignPhotographer}
                                onChange={(e) => setAssignPhotographer(e.target.value)}
                              >
                                <option value="">
                                  {photographers.length === 0 ? "No photographers yet" : "Not assigned"}
                                </option>
                                {photographers.map((p) => (
                                  <option key={p.id} value={p.id}>{p.email}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-muted-foreground block mb-1">Artist</label>
                              <select
                                className="w-full border border-border rounded-lg px-2 py-1.5 text-sm bg-background text-foreground"
                                value={assignArtist}
                                onChange={(e) => setAssignArtist(e.target.value)}
                              >
                                <option value="">
                                  {artists.length === 0 ? "No artists yet" : "Not assigned"}
                                </option>
                                {artists.map((a) => (
                                  <option key={a.id} value={a.id}>{a.email}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => approveWithAssignment(nom.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              <CheckCircle size={14} /> Approve & Assign
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(nom.id, "pending")}>
                              <Clock size={14} /> Reset to Pending
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteNomination(nom.id)} className="text-muted-foreground hover:text-destructive">
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

          {/* Profiles Tab */}
          {activeTab === "profiles" && (
            isDemo ? (
              <DemoProfileManager />
            ) : (
              <AdminProfileManager schoolId={schoolId} />
            )
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <AdminAnalytics schoolId={schoolId} isDemo={isDemo} />
          )}

          {/* Flyer Tab */}
          {activeTab === "flyer" && (
            <AdminFlyer schoolId={schoolId} />
          )}
          
          {activeTab === "roles" && <ManageRoles schoolId={schoolId} />}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-xl text-foreground mb-4">
                  School Admins {isGlobalAdmin && `— ${selectedSchoolName}`}
                </h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Add email addresses to grant admin access. They'll need to create an account using that email.
                </p>

                <div className="flex gap-2 mb-6">
                  <Input
                    type="email"
                    placeholder="newadmin@school.edu"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAdmin()}
                  />
                  <Button onClick={addAdmin} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shrink-0">
                    <UserPlus size={16} /> Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between py-3 px-4 rounded-lg bg-background border border-border">
                      <span className="text-sm text-foreground">{admin.email}</span>
                      {admin.email !== userEmail && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeAdmin(admin.id, admin.email)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* School onboarding — global admin only */}
              {isGlobalAdmin && (
                <SchoolOnboarding onSchoolCreated={async () => {
                  const { data: schools } = await supabase.from("schools").select("id, name").order("name");
                  if (schools) setAllSchools(schools);
                }} />
              )}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Admin;