import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/use-auth-ready";
import FlyerPreview from "@/components/FlyerPreview";

interface Profile {
  slug: string;
  name: string;
  role: string;
}

const AdminFlyer = () => {
  const { isReady, user } = useAuthReady();
  const navigate = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [redirectId, setRedirectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectError, setRedirectError] = useState(false);
  const [newRedirectId, setNewRedirectId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (isReady && !user) {
      navigate("/admin/login");
    }
  }, [isReady, user, navigate]);

  // Load all published profiles for the dropdown
  useEffect(() => {
    const loadProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("slug, name, role")
        .eq("status", "published")
        .order("name");

      setProfiles(data ?? []);
      setLoading(false);
    };

    if (user) loadProfiles();
  }, [user]);

  // Find next available flyer ID for a given slug
  const getNextFlyerId = async (slug: string) => {
    const { data } = await supabase
      .from("redirects")
      .select("id")
      .like("id", `${slug}-flyer-%`);

    if (!data || data.length === 0) return `${slug}-flyer-1`;

    const numbers = data
      .map((r) => parseInt(r.id.replace(`${slug}-flyer-`, ""), 10))
      .filter((n) => !isNaN(n));

    const max = numbers.length > 0 ? Math.max(...numbers) : 0;
    return `${slug}-flyer-${max + 1}`;
  };

  // When a profile is selected, look up its active redirect ID
  useEffect(() => {
    if (!selectedSlug) {
      setRedirectId(null);
      setSelectedProfile(null);
      setRedirectError(false);
      setNewRedirectId("");
      setCreateError(null);
      return;
    }

    // Clear previous flyer immediately on profile switch
    setRedirectId(null);
    setRedirectError(false);
    setCreateError(null);

    const profile = profiles.find((p) => p.slug === selectedSlug) ?? null;
    setSelectedProfile(profile);

    // Set next available flyer ID
    getNextFlyerId(selectedSlug).then(setNewRedirectId);

    const lookupRedirect = async () => {
      const { data } = await supabase
        .from("redirects")
        .select("id, destination_url")
        .eq("active", true);

      if (data) {
        const match = data.find((r) =>
          r.destination_url?.includes(`/gallery/${selectedSlug}`)
        );
        if (match) {
          setRedirectId(match.id);
          setRedirectError(false);
        } else {
          setRedirectId(null);
          setRedirectError(true);
        }
      } else {
        setRedirectId(null);
        setRedirectError(true);
      }
    };

    lookupRedirect();
  }, [selectedSlug, profiles]);

  const handleCreateRedirect = async () => {
    if (!newRedirectId.trim() || !selectedProfile) return;
    setCreating(true);
    setCreateError(null);

    const destinationUrl = `https://nowweseeyou.org/gallery/${selectedSlug}`;

    const { error } = await supabase
      .from("redirects")
      .insert({
        id: newRedirectId.trim(),
        destination_url: destinationUrl,
        active: true,
      });

    if (error) {
      setCreateError(error.message);
      setCreating(false);
      return;
    }

    // Use the new redirect ID for the flyer
    setRedirectId(newRedirectId.trim());
    setRedirectError(false);
    setCreating(false);
  };

  if (!isReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display text-foreground">Flyer Generator</h1>
          <p className="text-muted-foreground mt-1">
            Select a staff member to generate a printable flyer with their QR code.
          </p>
        </div>

        {/* Profile selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Staff Member
          </label>
          <select
            className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
          >
            <option value="">Select a profile...</option>
            {profiles.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} — {p.role}
              </option>
            ))}
          </select>
        </div>

        {/* Error state — no existing redirect */}
        {redirectError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">
              No active QR redirect found for this profile. Create one below.
            </p>
          </div>
        )}

        {/* Create new redirect */}
        {selectedProfile && (
          <div className="border border-border rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Create a new QR code for this profile
            </p>
            <p className="text-xs text-muted-foreground">
              Use a unique ID to track engagement from this specific flyer
              separately in analytics. Default is pre-filled — change it if
              you are creating a second flyer for the same profile.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                placeholder={`${selectedSlug}-flyer-1`}
                value={newRedirectId}
                onChange={(e) => setNewRedirectId(e.target.value)}
              />
              <button
                onClick={handleCreateRedirect}
                disabled={creating || !newRedirectId.trim()}
                className="bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? "Creating..." : "Create & Generate"}
              </button>
            </div>
            {createError && (
              <p className="text-red-600 text-xs">{createError}</p>
            )}
          </div>
        )}

        {/* Flyer preview */}
        {selectedProfile && redirectId && (
          <FlyerPreview
            name={selectedProfile.name}
            role={selectedProfile.role}
            redirectId={redirectId}
            slug={selectedSlug}
        />
        )}
      </div>
    </div>
  );
};

export default AdminFlyer;