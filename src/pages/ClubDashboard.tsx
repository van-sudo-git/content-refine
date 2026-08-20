import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/use-auth-ready";
import ImageUploader from "@/components/ImageUploader";
import { LogOut } from "lucide-react";

type ClubRoleType = "journalist" | "photographer" | "artist" | "pr";

interface MyRole {
  id: string;
  role: ClubRoleType;
  school_id: string;
}

interface AssignedNomination {
  id: string;
  nominee_name: string;
  nominee_role: string;
  nominee_department: string;
  reason: string;
  status: string;
  journalist_id: string | null;
  photographer_id: string | null;
  artist_id: string | null;
}

interface LinkedProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  status: string;
}

const ClubDashboard = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  const [loading, setLoading] = useState(true);
  const [myRoles, setMyRoles] = useState<MyRole[]>([]);
  const [nominations, setNominations] = useState<AssignedNomination[]>([]);
  const [profiles, setProfiles] = useState<Record<string, LinkedProfile>>({});

  // journalist write-up form state, keyed by nomination id when open
  const [openNomId, setOpenNomId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", role: "", department: "", bio: "" });
  const [saving, setSaving] = useState(false);

  // someone can hold pr alongside a creative role - give them a way back to flyer generator
  const hasPrRole = myRoles.some((r) => r.role === "pr");

  useEffect(() => {
    if (!isReady) return;

    const init = async () => {
      if (!user?.email) {
        navigate("/admin/login", { replace: true });
        return;
      }

      const { data: roles } = await supabase
        .from("club_roles")
        .select("id, role, school_id")
        .eq("user_id", user.id);

      if (!roles || roles.length === 0) {
        // not actually a club member - shouldn't normally reach here since
        // AdminLogin already routes based on role, but guard anyway
        navigate("/admin/login", { replace: true });
        return;
      }

      setMyRoles(roles as MyRole[]);
      await loadAssignments(roles as MyRole[]);
      setLoading(false);
    };

    init();
  }, [isReady, user, navigate]);

  const loadAssignments = async (roles: MyRole[]) => {
    const myRoleIds = roles.map((r) => r.id);

    if (myRoleIds.length === 0) return;

    // find nominations where any of my role ids show up as journalist/photographer/artist
    const { data: noms } = await supabase
      .from("nominations")
      .select("id, nominee_name, nominee_role, nominee_department, reason, status, journalist_id, photographer_id, artist_id")
      .or(
        myRoleIds.map((id) => `journalist_id.eq.${id},photographer_id.eq.${id},artist_id.eq.${id}`).join(",")
      );

    if (!noms) return;
    setNominations(noms as AssignedNomination[]);

    // check which of these nominations already have a linked profile
    const nomIds = noms.map((n) => n.id);
    if (nomIds.length === 0) return;

    // Supabase's generated types hit a depth limit on this query, so the result is cast below
    const { data: linkedProfiles } = await supabase
      .from("profiles")
      .select("id, slug, name, role, department, bio, status, nomination_id")
      .in("nomination_id", nomIds) as { data: LinkedProfile[] | null };

    if (linkedProfiles) {
      const byNomId: Record<string, LinkedProfile> = {};
      linkedProfiles.forEach((p: any) => {
        byNomId[p.nomination_id] = p;
      });
      setProfiles(byNomId);
    }
  };

  // A single club member can be assigned to more than one role on the same nomination.
  // Return every matching role instead of stopping at the first match.
  const myRolesFor = (nom: AssignedNomination): ClubRoleType[] => {
    const roleIds = new Set(myRoles.map((r) => r.id));
    const roles: ClubRoleType[] = [];

    if (nom.journalist_id && roleIds.has(nom.journalist_id)) roles.push("journalist");
    if (nom.photographer_id && roleIds.has(nom.photographer_id)) roles.push("photographer");
    if (nom.artist_id && roleIds.has(nom.artist_id)) roles.push("artist");

    return roles;
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const startWriteUp = (nom: AssignedNomination) => {
    setOpenNomId(nom.id);
    const existing = profiles[nom.id];

    if (existing) {
      // editing an already-started draft - load its real content
      setForm({
        name: existing.name,
        slug: existing.slug,
        role: existing.role,
        department: existing.department ?? "",
        bio: existing.bio ?? "",
      });
    } else {
      // brand new - pre-fill from the nomination itself
      setForm({
        name: nom.nominee_name,
        slug: generateSlug(nom.nominee_name),
        role: nom.nominee_role,
        department: nom.nominee_department,
        bio: "",
      });
    }
  };

  const saveWriteUp = async (nomId: string) => {
    if (!form.name.trim() || !form.slug.trim() || !form.role.trim()) {
      toast({ title: "Missing fields", description: "Name, slug, and role are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const existing = profiles[nomId];

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      role: form.role.trim(),
      department: form.department.trim() || null,
      bio: form.bio.trim() || null,
    };

    const { error } = existing
      ? await supabase.from("profiles").update(payload).eq("id", existing.id)
      : await supabase.from("profiles").insert({
          ...payload,
          school_id: myRoles[0].school_id,
          status: "draft",
          nomination_id: nomId,
        });

    if (error) {
      toast({
        title: "Error",
        description: error.message?.includes("duplicate") ? "That slug is already taken." : error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (!existing) {
      // move the nomination to in_progress now that the write-up exists
      await supabase.from("nominations").update({ status: "in_progress" }).eq("id", nomId);
    }

    toast({ title: existing ? "Profile updated" : "Profile started" });
    setOpenNomId(null);
    await loadAssignments(myRoles);
    setSaving(false);
  };

  const handleSignOut = async () => {
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

  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl text-foreground">Your Assignments</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Signed in as {user?.email} · {myRoles.map((r) => r.role).join(", ")}
              </p>
            </div>
            <div className="flex gap-2">
              {hasPrRole && (
                <Button variant="outline" onClick={() => navigate("/admin")}>
                  Flyer Generator
                </Button>
              )}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </Button>
            </div>
          </div>

          {nominations.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Nothing assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {nominations.map((nom) => {
                const rolesForNom = myRolesFor(nom);
                const isJournalist = rolesForNom.includes("journalist");
                const isPhotographer = rolesForNom.includes("photographer");
                const isArtist = rolesForNom.includes("artist");
                const profile = profiles[nom.id];
                const isOpen = openNomId === nom.id;

                return (
                  <div key={nom.id} className="bg-card rounded-xl border border-border p-6">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-display text-xl text-foreground">{nom.nominee_name}</h3>

                      {rolesForNom.map((role) => (
                        <Badge key={role} className="bg-blue-100 text-blue-800 border-0">
                          {role}
                        </Badge>
                      ))}

                      <Badge variant="outline">{nom.status}</Badge>
                    </div>

                    <p className="text-muted-foreground text-sm">
                      {nom.nominee_role} · {nom.nominee_department}
                    </p>
                    <p className="text-foreground/80 text-sm mt-2">{nom.reason}</p>

                    {/* journalist view */}
                    {isJournalist && !profile && !isOpen && (
                      <Button size="sm" className="mt-4" onClick={() => startWriteUp(nom)}>
                        Start write-up
                      </Button>
                    )}

                    {isJournalist && profile && !isOpen && profile.status !== "published" && (
                      <Button size="sm" className="mt-4" onClick={() => startWriteUp(nom)}>
                        Edit write-up
                      </Button>
                    )}

                    {isJournalist && isOpen && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <Input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Name"
                        />
                        <Input
                          value={form.slug}
                          onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                          placeholder="URL slug"
                        />
                        <Input
                          value={form.role}
                          onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                          placeholder="Role"
                        />
                        <Input
                          value={form.department}
                          onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                          placeholder="Department"
                        />
                        <Textarea
                          value={form.bio}
                          onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                          placeholder="Their story..."
                          className="min-h-[150px]"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveWriteUp(nom.id)} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setOpenNomId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {isJournalist && profile && profile.status !== "published" && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-sm text-muted-foreground">
                          Draft saved. An admin will publish this once photos and portrait are ready.
                        </p>
                      </div>
                    )}

                  {/* photographer / artist view
                      Creative work is nomination-first, so photographers and artists
                      do not have to wait for the journalist to start the profile. */}
                  {(isPhotographer || isArtist) && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Upload your assigned work here. It stays linked to this nomination
                        and will attach to the profile automatically.
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {isPhotographer && (
                          <ImageUploader
                            nominationId={nom.id}
                            imageType="additional"
                            label="Photo"
                            currentSortOrder={0}
                            onUploaded={() => loadAssignments(myRoles)}
                          />
                        )}

                        {isArtist && (
                          <ImageUploader
                            nominationId={nom.id}
                            imageType="portrait"
                            label="Portrait"
                            currentSortOrder={0}
                            onUploaded={() => loadAssignments(myRoles)}
                          />
                        )}
                      </div>
                    </div>
                  )}

                    {profile?.status === "published" && (
                      <p className="text-sm text-emerald-600 mt-4 pt-4 border-t border-border font-medium">
                        Published — live at /gallery/{profile.slug}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default ClubDashboard;