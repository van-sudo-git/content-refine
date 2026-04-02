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
import type { Tables } from "@/integrations/supabase/types";
import { DEMO_NOMINATIONS, DEMO_ADMINS, DEMO_EMAIL } from "@/lib/demoData";

type Nomination = Tables<"nominations">;

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-800", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: XCircle },
  featured: { label: "Featured", color: "bg-purple-100 text-purple-800", icon: Star },
};

const Admin = () => {
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  const [nominations, setNominations] = useState<Nomination[]>(isDemo ? DEMO_NOMINATIONS : []);
  const [admins, setAdmins] = useState<{ id: string; email: string }[]>(isDemo ? DEMO_ADMINS : []);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [schoolId, setSchoolId] = useState<string | null>(isDemo ? "demo-school" : null);
  const [userEmail, setUserEmail] = useState<string | null>(isDemo ? DEMO_EMAIL : null);
  const [activeTab, setActiveTab] = useState<"nominations" | "profiles" | "admins" | "analytics">("nominations");
  const [selectedNomination, setSelectedNomination] = useState<Nomination | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(!isDemo);
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

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

      const { data: isAdmin } = await supabase.rpc("is_any_school_admin", { _email: email });
      if (!isAdmin) {
        setLoading(false);
        navigate("/admin/login", { replace: true });
        return;
      }

      const { data: adminData } = await supabase
        .from("school_admins")
        .select("school_id")
        .eq("email", email.toLowerCase())
        .limit(1)
        .single();

      if (adminData) {
        setSchoolId(adminData.school_id);
        await loadData(adminData.school_id);
      }
      setLoading(false);
    };

    init();
  }, [isReady, navigate, user, isDemo]);

  const loadData = async (sid: string) => {
    const [nomRes, adminRes] = await Promise.all([
      supabase.from("nominations").select("*").eq("school_id", sid).order("created_at", { ascending: false }),
      supabase.from("school_admins").select("id, email").eq("school_id", sid),
    ]);
    if (nomRes.data) setNominations(nomRes.data);
    if (adminRes.data) setAdmins(adminRes.data);
  };

  const demoGuard = () => {
    toast({ title: "Demo Mode", description: "This action is disabled in demo mode.", variant: "destructive" });
  };

  const updateStatus = async (id: string, status: string) => {
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
    featured: nominations.filter((n) => n.status === "featured").length,
    total: nominations.length,
  };

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
              </p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut size={16} /> {isDemo ? "Exit Demo" : "Sign Out"}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total", value: counts.total, color: "text-foreground" },
              { label: "Pending", value: counts.pending, color: "text-amber-600" },
              { label: "Approved", value: counts.approved, color: "text-emerald-600" },
              { label: "Featured", value: counts.featured, color: "text-purple-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border p-5 text-center">
                <p className={`font-display text-3xl ${stat.color}`}>{stat.value}</p>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
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
              variant={activeTab === "analytics" ? "secondary" : "outline"}
              onClick={() => setActiveTab("analytics")}
            >
              Analytics
            </Button>
          </div>

          {/* Nominations Tab */}
          {activeTab === "nominations" && (
            <div className="space-y-4">
              {nominations.length === 0 ? (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <p className="text-muted-foreground">No nominations yet.</p>
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
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" onClick={() => updateStatus(nom.id, "approved")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                              <CheckCircle size={14} /> Approve
                            </Button>
                            <Button size="sm" onClick={() => updateStatus(nom.id, "featured")} className="bg-purple-600 hover:bg-purple-700 text-white">
                              <Star size={14} /> Feature
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(nom.id, "declined")}>
                              <XCircle size={14} /> Decline
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => updateStatus(nom.id, "pending")}>
                              <Clock size={14} /> Reset to Pending
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
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <p className="text-muted-foreground">Profile management is disabled in demo mode.</p>
              </div>
            ) : (
              <AdminProfileManager schoolId={schoolId} />
            )
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <AdminAnalytics schoolId={schoolId} isDemo={isDemo} />
          )}

          {/* Admins Tab */}
          {activeTab === "admins" && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-display text-xl text-foreground mb-4">School Admins</h3>
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
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
