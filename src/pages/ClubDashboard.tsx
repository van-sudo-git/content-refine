import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  reflection_quote: string | null;
  reflection_video_url: string | null;
  reflection_recorded_date: string | null;
  status: string;
  nomination_id: string | null;
}

interface AssignmentImage {
  id: string;
  image_url: string;
  image_type: string;
  sort_order: number;
  nomination_id: string | null;
  profile_id: string | null;
}

interface WriteUpForm {
  name: string;
  slug: string;
  role: string;
  department: string;
  featuredQuote: string;
  story: string;
  reflectionQuote: string;
  reflectionVideoUrl: string;
  reflectionRecordedDate: string;
}

// Profiles already store a featured quote inside bio as a quoted paragraph.
// Keep that detail hidden from the journalist and give the quote its own field.
const splitBio = (bio: string | null) => {
  if (!bio) return { featuredQuote: "", story: "" };

  const lines = bio.split("\n");
  const quoteIndex = lines.findIndex((line) => {
    const trimmed = line.trim();
    return /^["“].+["”]$/.test(trimmed);
  });

  if (quoteIndex === -1) {
    return { featuredQuote: "", story: bio };
  }

  const featuredQuote = lines[quoteIndex]
    .trim()
    .replace(/^["“]|["”]$/g, "");

  const story = lines
    .filter((_, index) => index !== quoteIndex)
    .join("\n")
    .trim();

  return { featuredQuote, story };
};

const buildBio = (story: string, featuredQuote: string) => {
  const paragraphs = story
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const quote = featuredQuote.trim();

  if (!quote) return paragraphs.join("\n") || null;
  if (paragraphs.length === 0) return `"${quote}"`;

  // The public profile already styles quoted paragraphs as pull quotes.
  // Put it after the opening paragraph so the story reads naturally.
  return [
    paragraphs[0],
    `"${quote}"`,
    ...paragraphs.slice(1),
  ].join("\n");
};

const ClubDashboard = () => {
  const navigate = useNavigate();
  const { user, isReady } = useAuthReady();

  const [loading, setLoading] = useState(true);
  const [myRoles, setMyRoles] = useState<MyRole[]>([]);
  const [nominations, setNominations] = useState<AssignedNomination[]>([]);
  const [profiles, setProfiles] = useState<Record<string, LinkedProfile>>({});
  const [assets, setAssets] = useState<Record<string, AssignmentImage[]>>({});

  // Journalist write-up form state, keyed by nomination id when open.
  const [openNomId, setOpenNomId] = useState<string | null>(null);
  const [form, setForm] = useState<WriteUpForm>({
    name: "",
    slug: "",
    role: "",
    department: "",
    featuredQuote: "",
    story: "",
    reflectionQuote: "",
    reflectionVideoUrl: "",
    reflectionRecordedDate: "",
  });
  const [saving, setSaving] = useState(false);

  // Someone can hold Community Outreach alongside a creative role.
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
        // AdminLogin should normally keep non-club users out, but guard anyway.
        navigate("/admin/login", { replace: true });
        return;
      }

      const typedRoles = roles as MyRole[];
      setMyRoles(typedRoles);
      await loadAssignments(typedRoles);
      setLoading(false);
    };

    init();
  }, [isReady, user, navigate]);

  const loadAssignments = async (roles: MyRole[]) => {
    const myRoleIds = roles.map((r) => r.id);

    if (myRoleIds.length === 0) {
      setNominations([]);
      setProfiles({});
      setAssets({});
      return;
    }

    // Find nominations where any of my role ids are assigned.
    const { data: noms } = await supabase
      .from("nominations")
      .select(
        "id, nominee_name, nominee_role, nominee_department, reason, status, journalist_id, photographer_id, artist_id"
      )
      .or(
        myRoleIds
          .map(
            (id) =>
              `journalist_id.eq.${id},photographer_id.eq.${id},artist_id.eq.${id}`
          )
          .join(",")
      );

    if (!noms || noms.length === 0) {
      setNominations([]);
      setProfiles({});
      setAssets({});
      return;
    }

    const typedNoms = noms as AssignedNomination[];
    setNominations(typedNoms);

    const nomIds = typedNoms.map((n) => n.id);

    // Load the linked profile and creative work together.
    // Creative work is nomination-first, so it exists even before a profile does.
    const [profileResult, imageResult] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, slug, name, role, department, bio, reflection_quote, reflection_video_url, reflection_recorded_date, status, nomination_id"
        )
        .in("nomination_id", nomIds),
      supabase
        .from("profile_images")
        .select(
          "id, image_url, image_type, sort_order, nomination_id, profile_id"
        )
        .in("nomination_id", nomIds)
        .order("sort_order"),
    ]);

    const linkedProfiles =
      (profileResult.data as LinkedProfile[] | null) ?? [];

    const byNomId: Record<string, LinkedProfile> = {};
    linkedProfiles.forEach((profile) => {
      if (profile.nomination_id) {
        byNomId[profile.nomination_id] = profile;
      }
    });
    setProfiles(byNomId);

    const imageRows =
      (imageResult.data as AssignmentImage[] | null) ?? [];

    const assetsByNomId: Record<string, AssignmentImage[]> = {};
    imageRows.forEach((image) => {
      if (!image.nomination_id) return;

      if (!assetsByNomId[image.nomination_id]) {
        assetsByNomId[image.nomination_id] = [];
      }

      assetsByNomId[image.nomination_id].push(image);
    });
    setAssets(assetsByNomId);
  };

  // A single club member can be assigned to more than one role on the same nomination.
  // Return every matching role instead of stopping at the first match.
  const myRolesFor = (nom: AssignedNomination): ClubRoleType[] => {
    const roleIds = new Set(myRoles.map((r) => r.id));
    const roles: ClubRoleType[] = [];

    if (nom.journalist_id && roleIds.has(nom.journalist_id)) {
      roles.push("journalist");
    }
    if (nom.photographer_id && roleIds.has(nom.photographer_id)) {
      roles.push("photographer");
    }
    if (nom.artist_id && roleIds.has(nom.artist_id)) {
      roles.push("artist");
    }

    return roles;
  };

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  const startWriteUp = (nom: AssignedNomination) => {
    setOpenNomId(nom.id);
    const existing = profiles[nom.id];

    if (existing) {
      const { featuredQuote, story } = splitBio(existing.bio);

      setForm({
        name: existing.name,
        slug: existing.slug,
        role: existing.role,
        department: existing.department ?? "",
        featuredQuote,
        story,
        reflectionQuote: existing.reflection_quote ?? "",
        reflectionVideoUrl: existing.reflection_video_url ?? "",
        reflectionRecordedDate: existing.reflection_recorded_date ?? "",
      });
      return;
    }

    // Brand new profile: pre-fill what we already know from the nomination.
    setForm({
      name: nom.nominee_name,
      slug: generateSlug(nom.nominee_name),
      role: nom.nominee_role,
      department: nom.nominee_department ?? "",
      featuredQuote: "",
      story: "",
      reflectionQuote: "",
      reflectionVideoUrl: "",
      reflectionRecordedDate: "",
    });
  };

  const saveWriteUp = async (nomId: string) => {
    if (!form.name.trim() || !form.slug.trim() || !form.role.trim()) {
      toast({
        title: "Missing fields",
        description: "Name, slug, and role are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const existing = profiles[nomId];

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      role: form.role.trim(),
      department: form.department.trim() || null,
      bio: buildBio(form.story, form.featuredQuote),
      reflection_quote: form.reflectionQuote.trim() || null,
      reflection_video_url: form.reflectionVideoUrl.trim() || null,
      reflection_recorded_date: form.reflectionRecordedDate || null,
    };

    const { error } = existing
      ? await supabase
          .from("profiles")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("profiles").insert({
          ...payload,
          school_id: myRoles[0].school_id,
          status: "draft",
          nomination_id: nomId,
        });

    if (error) {
      toast({
        title: "Error",
        description: error.message?.includes("duplicate")
          ? "That slug is already taken."
          : error.message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    if (!existing) {
      // The first saved write-up is the point where work is actively underway.
      await supabase
        .from("nominations")
        .update({ status: "in_progress" })
        .eq("id", nomId);
    }

    toast({
      title: existing ? "Profile updated" : "Profile started",
    });

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
              <h1 className="font-display text-4xl text-foreground">
                Your Assignments
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Signed in as {user?.email} ·{" "}
                {myRoles.map((r) => r.role).join(", ")}
              </p>
            </div>

            <div className="flex gap-2">
              {hasPrRole && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
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
              <p className="text-muted-foreground">
                Nothing assigned to you yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {nominations.map((nom) => {
                const rolesForNom = myRolesFor(nom);
                const isJournalist =
                  rolesForNom.includes("journalist");
                const isPhotographer =
                  rolesForNom.includes("photographer");
                const isArtist = rolesForNom.includes("artist");
                const profile = profiles[nom.id];
                const isOpen = openNomId === nom.id;

                const nominationAssets = assets[nom.id] ?? [];
                const portraits = nominationAssets.filter(
                  (image) => image.image_type === "portrait"
                );
                const photos = nominationAssets.filter(
                  (image) => image.image_type === "additional"
                );

                return (
                  <div
                    key={nom.id}
                    className="bg-card rounded-xl border border-border p-6"
                  >
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-display text-xl text-foreground">
                        {nom.nominee_name}
                      </h3>

                      {rolesForNom.map((role) => (
                        <Badge
                          key={role}
                          className="bg-blue-100 text-blue-800 border-0"
                        >
                          {role}
                        </Badge>
                      ))}

                      <Badge variant="outline">{nom.status}</Badge>
                    </div>

                    <p className="text-muted-foreground text-sm">
                      {nom.nominee_role}
                      {nom.nominee_department
                        ? ` · ${nom.nominee_department}`
                        : ""}
                    </p>

                    <p className="text-foreground/80 text-sm mt-2">
                      {nom.reason}
                    </p>

                    {/* Everyone assigned to the nomination can see the work already added. */}
                    {nominationAssets.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs uppercase tracking-wide font-semibold text-foreground mb-3">
                          Shared Assets
                        </p>

                        <div className="flex flex-wrap gap-3">
                          {portraits.map((portrait, index) => (
                            <div key={portrait.id} className="w-28">
                              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                <img
                                  src={portrait.image_url}
                                  alt={`${nom.nominee_name} portrait ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {portraits.length > 1
                                  ? `Portrait ${index + 1}`
                                  : "Portrait uploaded"}
                              </p>
                            </div>
                          ))}

                          {photos.map((photo, index) => (
                            <div key={photo.id} className="w-28">
                              <div className="aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                                <img
                                  src={photo.image_url}
                                  alt={`${nom.nominee_name} photo ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Photo {index + 1}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Journalist view */}
                    {isJournalist &&
                      !profile &&
                      !isOpen && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => startWriteUp(nom)}
                        >
                          Start write-up
                        </Button>
                      )}

                    {isJournalist &&
                      profile &&
                      !isOpen &&
                      profile.status !== "published" && (
                        <Button
                          size="sm"
                          className="mt-4"
                          onClick={() => startWriteUp(nom)}
                        >
                          Edit write-up
                        </Button>
                      )}

                    {isJournalist && isOpen && (
                      <div className="mt-4 pt-4 border-t border-border space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name *</Label>
                            <Input
                              value={form.name}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="e.g. Brad Fisher"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>URL Slug *</Label>
                            <Input
                              value={form.slug}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  slug: e.target.value,
                                }))
                              }
                              placeholder="e.g. brad-fisher"
                            />
                            <p className="text-xs text-muted-foreground">
                              /gallery/{form.slug || "..."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Role *</Label>
                            <Input
                              value={form.role}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  role: e.target.value,
                                }))
                              }
                              placeholder="e.g. Head Custodian"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Department</Label>
                            <Input
                              value={form.department}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  department: e.target.value,
                                }))
                              }
                              placeholder="e.g. Facilities"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Featured Quote (optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            A short quote from the staff member that captures
                            their voice. It will be placed automatically after
                            the opening paragraph.
                          </p>
                          <Input
                            value={form.featuredQuote}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                featuredQuote: e.target.value,
                              }))
                            }
                            placeholder="A warm welcome can make a difference in someone's day."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Bio / Story</Label>
                          <Textarea
                            value={form.story}
                            onChange={(e) =>
                              setForm((p) => ({
                                ...p,
                                story: e.target.value,
                              }))
                            }
                            placeholder="Tell their story... Use separate lines for each paragraph."
                            className="min-h-[200px]"
                          />
                        </div>

                        <div className="border-t border-border pt-5 space-y-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              Staff Reflection (optional)
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Add a short reflection shared by the staff member after seeing or participating in the project.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Reflection Quote</Label>
                            <Textarea
                              value={form.reflectionQuote}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  reflectionQuote: e.target.value,
                                }))
                              }
                              placeholder="What did this recognition or portrait mean to them?"
                              className="min-h-[100px]"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Reflection Video URL</Label>
                            <Input
                              type="url"
                              value={form.reflectionVideoUrl}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  reflectionVideoUrl: e.target.value,
                                }))
                              }
                              placeholder="https://..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Optional. Use a public YouTube, Vimeo, or direct video URL.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>Recorded Date</Label>
                            <Input
                              type="date"
                              value={form.reflectionRecordedDate}
                              onChange={(e) =>
                                setForm((p) => ({
                                  ...p,
                                  reflectionRecordedDate: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => saveWriteUp(nom.id)}
                            disabled={saving}
                          >
                            {saving ? "Saving..." : "Save"}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setOpenNomId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {isJournalist &&
                      profile &&
                      profile.status !== "published" &&
                      !isOpen && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground">
                            Draft saved. An admin will publish this once the
                            story and creative work are ready.
                          </p>
                        </div>
                      )}

                    {/* Photographers and artists work nomination-first.
                        They can upload before or after the journalist starts the profile. */}
                    {(isPhotographer || isArtist) && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Upload your assigned work here at any time. It stays
                          linked to this nomination and attaches to the profile
                          automatically.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {isPhotographer && (
                            <ImageUploader
                              nominationId={nom.id}
                              imageType="additional"
                              label="Photo"
                              currentSortOrder={photos.length}
                              onUploaded={() =>
                                loadAssignments(myRoles)
                              }
                            />
                          )}

                          {isArtist && (
                            <ImageUploader
                              nominationId={nom.id}
                              imageType="portrait"
                              label="Portrait"
                              currentSortOrder={portraits.length}
                              onUploaded={() =>
                                loadAssignments(myRoles)
                              }
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