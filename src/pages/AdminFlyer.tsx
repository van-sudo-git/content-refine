import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FlyerPreview from "@/components/FlyerPreview";
import { Badge } from "@/components/ui/badge";
import { DEMO_FLYER_PROFILES } from "@/lib/demoData";

interface Profile {
  slug: string;
  name: string;
  role: string;
}

const AdminFlyer = ({
  schoolId = null,
  isDemo = false,
}: {
  schoolId?: string | null;
  isDemo?: boolean;
}) => {
  const demoProfiles: Profile[] = DEMO_FLYER_PROFILES.map(
    ({ slug, name, role }) => ({ slug, name, role })
  );

  const [profiles, setProfiles] = useState<Profile[]>(
    isDemo ? demoProfiles : []
  );
  const [selectedSlug, setSelectedSlug] = useState<string>(
    isDemo ? DEMO_FLYER_PROFILES[0]?.slug ?? "" : ""
  );
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(
    isDemo ? demoProfiles[0] ?? null : null
  );
  const [redirectId, setRedirectId] = useState<string | null>(
    isDemo ? DEMO_FLYER_PROFILES[0]?.redirectId ?? null : null
  );
  const [loading, setLoading] = useState(!isDemo);
  const [redirectError, setRedirectError] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setProfiles(demoProfiles);
      setLoading(false);
      return;
    }

    const loadProfiles = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("slug, name, role")
        .eq("status", "published")
        .eq("school_id", schoolId)
        .order("name");

      setProfiles(data ?? []);
      setLoading(false);
    };

    if (schoolId) loadProfiles();
  }, [schoolId, isDemo]);

  useEffect(() => {
    if (!selectedSlug) {
      setRedirectId(null);
      setSelectedProfile(null);
      setRedirectError(false);
      return;
    }

    const profile =
      profiles.find((item) => item.slug === selectedSlug) ?? null;
    setSelectedProfile(profile);

    if (isDemo) {
      const demoProfile = DEMO_FLYER_PROFILES.find(
        (item) => item.slug === selectedSlug
      );
      setRedirectId(demoProfile?.redirectId ?? null);
      setRedirectError(false);
      return;
    }

    setRedirectId(null);
    setRedirectError(false);

    const lookupRedirect = async () => {
      const { data } = await supabase
        .from("redirects")
        .select("id, destination_url")
        .eq("active", true);

      if (data) {
        const match = data.find((redirect) =>
          redirect.destination_url?.includes(`/gallery/${selectedSlug}`)
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
  }, [selectedSlug, profiles, isDemo]);

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-display text-foreground">
            Flyer Generator
          </h1>
          {isDemo && <Badge variant="outline">Read-only demo</Badge>}
        </div>
        <p className="text-muted-foreground mt-1">
          Select a published staff profile to preview a printable QR flyer.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
          Staff Member
        </label>
        <select
          className="w-full border border-border rounded-lg px-3 py-2 bg-background text-foreground"
          value={selectedSlug}
          onChange={(event) => setSelectedSlug(event.target.value)}
        >
          <option value="">Select a profile...</option>
          {profiles.map((profile) => (
            <option key={profile.slug} value={profile.slug}>
              {profile.name} — {profile.role}
            </option>
          ))}
        </select>
      </div>

      {redirectError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 text-sm">
            No active QR redirect found for this profile.
          </p>
        </div>
      )}

      {selectedProfile && redirectId && (
        <FlyerPreview
          name={selectedProfile.name}
          role={selectedProfile.role}
          redirectId={redirectId}
          slug={selectedSlug}
        />
      )}
    </div>
  );
};

export default AdminFlyer;