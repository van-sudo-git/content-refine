import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ReviewImage {
  image_url: string;
  image_type: string;
  sort_order: number;
}

interface ReviewProfile {
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  reflectionQuote: string | null;
  reflectionVideoUrl: string | null;
  reflectionRecordedDate: string | null;
  images: ReviewImage[];
}

interface ReviewResponse {
  success: boolean;
  alreadyApproved?: boolean;
  approvedAt?: string | null;
  profile?: ReviewProfile;
  error?: string;
}

const getVideoEmbedUrl = (url: string | null): string | null => {
  if (!url) return null;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname === "youtu.be" ||
      parsed.hostname.endsWith(".youtu.be")
    ) {
      const videoId = parsed.pathname.replace("/", "").trim();
      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }

    if (
      parsed.hostname === "youtube.com" ||
      parsed.hostname.endsWith(".youtube.com")
    ) {
      if (parsed.pathname.startsWith("/embed/")) {
        return url;
      }

      const videoId = parsed.searchParams.get("v");
      return videoId
        ? `https://www.youtube.com/embed/${videoId}`
        : null;
    }

    if (
      parsed.hostname === "vimeo.com" ||
      parsed.hostname.endsWith(".vimeo.com")
    ) {
      const videoId = parsed.pathname
        .split("/")
        .filter(Boolean)
        .pop();

      return videoId
        ? `https://player.vimeo.com/video/${videoId}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
};

const ProfileConsent = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [profile, setProfile] = useState<ReviewProfile | null>(null);
  const [approved, setApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const portrait = useMemo(
    () =>
      profile?.images.find(
        (image) => image.image_type === "portrait",
      ) ?? null,
    [profile],
  );

  const additionalImages = useMemo(
    () =>
      profile?.images.filter(
        (image) => image.image_type === "additional",
      ) ?? [],
    [profile],
  );

  const reflectionEmbedUrl = useMemo(
    () => getVideoEmbedUrl(profile?.reflectionVideoUrl ?? null),
    [profile?.reflectionVideoUrl],
  );

  useEffect(() => {
    const loadReview = async () => {
      if (!token) {
        setError("This permission link is invalid or has expired.");
        setLoading(false);
        return;
      }

      const { data, error: invokeError } =
        await supabase.functions.invoke<ReviewResponse>(
          "approve-profile-consent",
          {
            body: {
              token,
              action: "review",
            },
          },
        );

      if (invokeError || !data?.success || !data.profile) {
        setError(
          data?.error ||
            "This permission link is invalid or has expired. Please ask the Now We See You team for a new link.",
        );
        setLoading(false);
        return;
      }

      setProfile(data.profile);

      if (data.alreadyApproved) {
        setApproved(true);
        setApprovedAt(data.approvedAt ?? null);
      }

      setLoading(false);
    };

    loadReview();
  }, [token]);

  const approve = async () => {
    if (!token || approving || approved) return;

    setApproving(true);
    setError(null);

    const { data, error: invokeError } =
      await supabase.functions.invoke<ReviewResponse>(
        "approve-profile-consent",
        {
          body: {
            token,
            action: "approve",
          },
        },
      );

    if (invokeError || !data?.success) {
      setError(
        data?.error ||
          "Permission could not be recorded. Please try again.",
      );
      setApproving(false);
      return;
    }

    setApproved(true);
    setApprovedAt(data.approvedAt ?? null);
    setApproving(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 animate-spin text-secondary"
            size={30}
          />
          <p className="text-muted-foreground">
            Loading your profile for review...
          </p>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl text-foreground mb-4">
            We could not open this review
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            {error}
          </p>

          <p className="text-sm text-muted-foreground mt-6">
            No profile has been approved or published from this page.
          </p>
        </div>
      </main>
    );
  }

  if (approved) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-xl bg-card border border-border rounded-2xl p-8 text-center">
          <CheckCircle2
            className="mx-auto mb-5 text-emerald-600"
            size={44}
          />

          <h1 className="font-display text-3xl text-foreground mb-4">
            Permission received
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            Thank you. Your permission has been recorded. The Now We
            See You team can now publish the profile.
          </p>

          {approvedAt && (
            <p className="text-sm text-muted-foreground mt-5">
              Permission recorded{" "}
              {new Date(approvedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}

          <p className="text-xs text-muted-foreground mt-6">
            Giving permission does not automatically publish the
            profile. Publication remains a separate administrative
            step.
          </p>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-5 py-10 sm:py-14">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.18em] text-secondary font-medium mb-3">
            Now We See You
          </p>

          <h1 className="font-display text-4xl sm:text-5xl text-foreground">
            Review your profile
          </h1>

          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nothing will be published until you give permission.
            Please review the profile and media below before deciding.
          </p>
        </header>

        <section className="bg-card border border-border rounded-2xl overflow-hidden">
          {portrait && (
            <div className="bg-muted flex justify-center">
              <img
                src={portrait.image_url}
                alt={`Portrait of ${profile.name}`}
                className="max-h-[620px] w-full object-contain"
              />
            </div>
          )}

          <div className="p-6 sm:p-9">
            <h2 className="font-display text-4xl text-foreground">
              {profile.name}
            </h2>

            <p className="text-lg text-muted-foreground mt-1">
              {profile.role}
              {profile.department
                ? ` · ${profile.department}`
                : ""}
            </p>

            {profile.bio && (
              <div className="mt-8 space-y-4">
                {profile.bio
                  .split("\n")
                  .map((paragraph) => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, index) => {
                    const isQuote =
                      /^["“].+["”]$/.test(paragraph);

                    if (isQuote) {
                      return (
                        <blockquote
                          key={index}
                          className="font-display text-2xl leading-relaxed border-l-4 border-secondary pl-5 my-7"
                        >
                          {paragraph.replace(
                            /^["“]|["”]$/g,
                            "",
                          )}
                        </blockquote>
                      );
                    }

                    return (
                      <p
                        key={index}
                        className="text-foreground/90 leading-7"
                      >
                        {paragraph}
                      </p>
                    );
                  })}
              </div>
            )}

            {(profile.reflectionQuote ||
              profile.reflectionVideoUrl) && (
              <section className="mt-10 pt-8 border-t border-border">
                <p className="text-sm uppercase tracking-[0.14em] text-secondary font-medium">
                  In Their Own Words
                </p>

                <h3 className="font-display text-2xl text-foreground mt-2">
                  A Reflection from {profile.name.split(" ")[0]}
                </h3>

                {profile.reflectionQuote && (
                  <blockquote className="mt-5 font-display text-xl sm:text-2xl leading-relaxed">
                    “{profile.reflectionQuote}”
                  </blockquote>
                )}

                {profile.reflectionRecordedDate && (
                  <p className="text-sm text-muted-foreground mt-3">
                    Recorded{" "}
                    {new Date(
                      `${profile.reflectionRecordedDate}T12:00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}

                {reflectionEmbedUrl && (
                  <div className="mt-6 aspect-video rounded-xl overflow-hidden bg-muted">
                    <iframe
                      src={reflectionEmbedUrl}
                      title={`${profile.name} reflection`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {profile.reflectionVideoUrl &&
                  !reflectionEmbedUrl && (
                    <div className="mt-6">
                      <video
                        src={profile.reflectionVideoUrl}
                        controls
                        className="w-full rounded-xl bg-black"
                      />
                    </div>
                  )}
              </section>
            )}

            {additionalImages.length > 0 && (
              <section className="mt-10 pt-8 border-t border-border">
                <h3 className="font-display text-2xl text-foreground mb-5">
                  Additional Photos
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {additionalImages.map((image, index) => (
                    <img
                      key={`${image.image_url}-${index}`}
                      src={image.image_url}
                      alt={`${profile.name} additional photo ${index + 1}`}
                      className="w-full rounded-xl border border-border object-cover"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        <section className="mt-8 bg-card border border-border rounded-2xl p-6 sm:p-8">
          <h2 className="font-display text-2xl text-foreground">
            Publication permission
          </h2>

          <p className="mt-3 text-foreground/90 leading-relaxed">
            By approving, I give permission for this profile and the
            media shown above to be published publicly on Now We See
            You.
          </p>

          <p className="mt-3 text-sm text-muted-foreground">
            Approval does not publish the profile automatically. The
            Now We See You team will complete publication separately.
          </p>

          {error && (
            <p className="mt-5 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            onClick={approve}
            disabled={approving}
            className="mt-6 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            {approving && (
              <Loader2
                size={16}
                className="mr-2 animate-spin"
              />
            )}

            {approving
              ? "Recording permission..."
              : "Approve for publication"}
          </Button>
        </section>

        <footer className="text-center text-xs text-muted-foreground mt-8 pb-6">
          Now We See You · Visibility for the People Behind the Scenes
        </footer>
      </div>
    </main>
  );
};

export default ProfileConsent;