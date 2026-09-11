import {
  useState,
  useEffect,
  useRef,
  type TouchEvent,
} from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import AppreciationWall from "@/components/AppreciationWall";
import { supabase } from "@/integrations/supabase/client";
import ShareButton from "@/components/ShareButton";
import { schoolGalleryPath } from "@/lib/schoolGallery";

interface ProfileData {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
  nomination_id: string | null;
  school_id: string | null;
  reflection_quote: string | null;
  reflection_video_url: string | null;
  reflection_recorded_date: string | null;
  created_at: string;
}

interface ProfileImage {
  id: string;
  image_url: string;
  image_type: string;
  sort_order: number;
}

interface ProfileContributor {
  contributor_name: string;
  contribution_type: "journalist" | "photographer" | "artist" | "pr";
}

const CONTRIBUTOR_TRACKING_STARTED = "2026-08-20T00:00:00Z";

const formatReflectionDate = (date: string | null) => {
  if (!date) return null;

  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

const getReflectionEmbedUrl = (videoUrl: string | null) => {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname.startsWith("/embed/")) return videoUrl;

      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "vimeo.com") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const isDirectVideoUrl = (videoUrl: string) =>
  /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);

const ProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [contributors, setContributors] = useState<ProfileContributor[]>([]);
  const [galleryPath, setGalleryPath] = useState("/galleries");
  const [galleryName, setGalleryName] = useState("Galleries");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Lightbox state for additional photos only.
  const [selectedAdditionalPhotoIndex, setSelectedAdditionalPhotoIndex] =
    useState<number | null>(null);

  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select(
          "id, slug, name, role, department, bio, nomination_id, school_id, reflection_quote, reflection_video_url, reflection_recorded_date, created_at"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const typedProfile = profileData as ProfileData;
      setProfile(typedProfile);

      const imagePromise = supabase
        .from("profile_images")
        .select("id, image_url, image_type, sort_order")
        .eq("profile_id", typedProfile.id)
        .order("sort_order");

      const contributorPromise = supabase
        .from("profile_contributors")
        .select("contributor_name, contribution_type")
        .eq("profile_id", typedProfile.id);

      const schoolPromise = typedProfile.school_id
        ? supabase
            .from("schools")
            .select("name")
            .eq("id", typedProfile.school_id)
            .maybeSingle()
        : Promise.resolve({ data: null });

      const [
        { data: imgData },
        { data: contributorData },
        { data: schoolData },
      ] = await Promise.all([
        imagePromise,
        contributorPromise,
        schoolPromise,
      ]);

      if (imgData) {
        setImages(imgData as ProfileImage[]);
      }

      if (contributorData && contributorData.length > 0) {
        setContributors(contributorData as ProfileContributor[]);
      } else if (typedProfile.created_at < CONTRIBUTOR_TRACKING_STARTED) {
        setContributors([
          {
            contributor_name: "Evaan Ahlawat",
            contribution_type: "journalist",
          },
          {
            contributor_name: "Evaan Ahlawat",
            contribution_type: "artist",
          },
        ]);
      }

      if (schoolData?.name) {
        setGalleryPath(schoolGalleryPath(schoolData.name));
        setGalleryName(`${schoolData.name} Gallery`);
      }

      setLoading(false);
    };

    load();
  }, [slug]);

  const additionalPhotos = images.filter(
    (image) => image.image_type === "additional"
  );

  const goToPreviousAdditionalPhoto = () => {
    if (additionalPhotos.length <= 1) return;

    setSelectedAdditionalPhotoIndex((current) => {
      if (current === null) return null;

      return (
        (current - 1 + additionalPhotos.length) % additionalPhotos.length
      );
    });
  };

  const goToNextAdditionalPhoto = () => {
    if (additionalPhotos.length <= 1) return;

    setSelectedAdditionalPhotoIndex((current) => {
      if (current === null) return null;

      return (current + 1) % additionalPhotos.length;
    });
  };

  // Keyboard navigation and page-scroll lock while an additional photo is open.
  useEffect(() => {
    if (selectedAdditionalPhotoIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedAdditionalPhotoIndex(null);
        return;
      }

      if (event.key === "ArrowLeft" && additionalPhotos.length > 1) {
        setSelectedAdditionalPhotoIndex((current) => {
          if (current === null) return null;

          return (
            (current - 1 + additionalPhotos.length) %
            additionalPhotos.length
          );
        });
      }

      if (event.key === "ArrowRight" && additionalPhotos.length > 1) {
        setSelectedAdditionalPhotoIndex((current) => {
          if (current === null) return null;

          return (current + 1) % additionalPhotos.length;
        });
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedAdditionalPhotoIndex, additionalPhotos.length]);

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (
      touchStartX.current === null ||
      additionalPhotos.length <= 1
    ) {
      touchStartX.current = null;
      return;
    }

    const endX = event.changedTouches[0]?.clientX;

    if (endX === undefined) {
      touchStartX.current = null;
      return;
    }

    const distance = touchStartX.current - endX;

    if (Math.abs(distance) > 50) {
      if (distance > 0) {
        goToNextAdditionalPhoto();
      } else {
        goToPreviousAdditionalPhoto();
      }
    }

    touchStartX.current = null;
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

  if (notFound || !profile) {
    return (
      <Layout>
        <section className="py-24 min-h-[70vh] flex items-center">
          <div className="container mx-auto px-6 text-center">
            <h1 className="font-display text-4xl text-foreground mb-4">
              Profile Not Found
            </h1>

            <p className="text-muted-foreground mb-6">
              This person may not have a published profile yet.
            </p>

            <Link
              to="/galleries"
              className="text-secondary hover:underline"
            >
              Back to Galleries
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const portrait = images.find(
    (image) => image.image_type === "portrait"
  );

  const qr = images.find(
    (image) => image.image_type === "qr"
  );

  const bioParagraphs =
    profile.bio?.split("\n").filter((paragraph) => paragraph.trim()) ||
    [];

  const firstName = profile.name.split(" ")[0];

  const reflectionDate = formatReflectionDate(
    profile.reflection_recorded_date
  );

  const reflectionEmbedUrl = getReflectionEmbedUrl(
    profile.reflection_video_url
  );

  const contributorLabels: Record<string, string> = {
    journalist: "Journalist",
    artist: "Artist",
    photographer: "Photographer",
  };

  const contributorOrder = [
    "journalist",
    "artist",
    "photographer",
  ];

  const contributorsByPerson = new Map<string, string[]>();

  for (const contributor of contributors) {
    if (!contributorOrder.includes(contributor.contribution_type)) {
      continue;
    }

    const roles =
      contributorsByPerson.get(contributor.contributor_name) || [];

    if (!roles.includes(contributor.contribution_type)) {
      roles.push(contributor.contribution_type);
    }

    contributorsByPerson.set(
      contributor.contributor_name,
      roles
    );
  }

  const contributorRows = Array.from(
    contributorsByPerson.entries()
  ).map(([name, roles]) => ({
    name,
    label: contributorOrder
      .filter((role) => roles.includes(role))
      .map((role) => contributorLabels[role])
      .join(", "),
  }));

  const canonical = `https://nowweseeyou.org/gallery/${profile.slug}`;

  const description = (
    bioParagraphs[0] ||
    `${profile.name}, ${profile.role} at Now We See You.`
  )
    .replace(/^[\"“”]|[\"“”]$/g, "")
    .slice(0, 155);

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    ...(profile.department
      ? {
          worksFor: {
            "@type": "Organization",
            name: profile.department,
          },
        }
      : {}),
    ...(portrait
      ? {
          image: portrait.image_url,
        }
      : {}),
    url: canonical,
    description,
  };

  return (
    <Layout>
      <Helmet>
        <title>
          {`${profile.name}, ${profile.role} | Now We See You`}
        </title>

        <meta
          name="description"
          content={description}
        />

        <link
          rel="canonical"
          href={canonical}
        />

        <meta
          property="og:type"
          content="profile"
        />

        <meta
          property="og:title"
          content={`${profile.name}, ${profile.role}`}
        />

        <meta
          property="og:description"
          content={description}
        />

        <meta
          property="og:url"
          content={canonical}
        />

        {portrait && (
          <meta
            property="og:image"
            content={portrait.image_url}
          />
        )}

        <meta
          name="twitter:card"
          content="summary_large_image"
        />

        <meta
          name="twitter:title"
          content={`${profile.name}, ${profile.role}`}
        />

        <meta
          name="twitter:description"
          content={description}
        />

        {portrait && (
          <meta
            name="twitter:image"
            content={portrait.image_url}
          />
        )}

        <script type="application/ld+json">
          {JSON.stringify(personLd)}
        </script>
      </Helmet>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <Link
            to={galleryPath}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft size={16} />
            Back to {galleryName}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl">
            <AnimatedSection>
              <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden sticky top-28 shadow-lg">
                {portrait ? (
                  <img
                    src={portrait.image_url}
                    alt={`${profile.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 bg-gradient-to-br from-muted to-card">
                    <span className="font-display text-8xl opacity-20 mb-4">
                      {profile.name[0]}
                    </span>

                    <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-2">
                      Portrait in progress
                    </p>

                    <p className="text-sm text-muted-foreground italic max-w-xs">
                      A hand-drawn charcoal portrait of {firstName} is
                      being prepared and will appear here soon.
                    </p>
                  </div>
                )}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-foreground mb-1">
                    {profile.name}
                  </h1>

                  <p className="text-secondary font-medium text-lg">
                    {profile.role}
                    {profile.department &&
                      ` — ${profile.department}`}
                  </p>
                </div>

                <ShareButton
                  name={profile.name}
                  slug={profile.slug}
                />

                {contributorRows.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-foreground mb-1">
                      Created by
                    </p>

                    <div className="space-y-0.5 text-sm text-muted-foreground italic">
                      {contributorRows.map((row) => (
                        <p key={row.name}>
                          {row.label} — {row.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-8 items-start">
                  <div className="flex-1 space-y-4 text-muted-foreground leading-relaxed">
                    {bioParagraphs
                      .slice(0, 3)
                      .map((paragraph, index) => {
                        const trimmed = paragraph.trim();
                        const isQuote =
                          /^[\"“].+[\"”]$/.test(trimmed);

                        return isQuote ? (
                          <blockquote
                            key={index}
                            className="border-l-4 border-secondary pl-5 py-2 my-2 font-display text-2xl italic text-foreground leading-snug"
                          >
                            {trimmed.replace(
                              /^[\"“]|[\"”]$/g,
                              ""
                            )}
                          </blockquote>
                        ) : (
                          <p key={index}>
                            {paragraph}
                          </p>
                        );
                      })}
                  </div>

                  {qr && (
                    <div className="hidden sm:flex flex-col items-center flex-shrink-0">
                      <div className="w-32 h-32 bg-card rounded-xl overflow-hidden border border-border shadow-sm">
                        <img
                          src={qr.image_url}
                          alt={`QR code for ${profile.name}`}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-2 text-center">
                        Scan to visit
                        <br />
                        this page
                      </p>
                    </div>
                  )}
                </div>

                {qr && (
                  <div className="sm:hidden pt-4 border-t border-border flex items-center gap-4">
                    <div className="w-24 h-24 bg-card rounded-xl overflow-hidden border border-border shadow-sm flex-shrink-0">
                      <img
                        src={qr.image_url}
                        alt={`QR code for ${profile.name}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Scan to visit this page
                    </p>
                  </div>
                )}

                {bioParagraphs.length > 3 && (
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {bioParagraphs
                      .slice(3)
                      .map((paragraph, index) => {
                        const trimmed = paragraph.trim();
                        const isQuote =
                          /^[\"“].+[\"”]$/.test(trimmed);

                        return isQuote ? (
                          <blockquote
                            key={index}
                            className="border-l-4 border-secondary pl-5 py-2 my-2 font-display text-2xl italic text-foreground leading-snug"
                          >
                            {trimmed.replace(
                              /^[\"“]|[\"”]$/g,
                              ""
                            )}
                          </blockquote>
                        ) : (
                          <p key={index}>
                            {paragraph}
                          </p>
                        );
                      })}
                  </div>
                )}

                {profile.name === "Brad Fisher" && (
                  <div className="border-t border-border pt-6">
                    <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-5 items-center">
                      <img
                        src="/media/kac/evaan-exhibit.jpg"
                        alt="Brad Fisher's portrait exhibited at Kirkland Arts Center"
                        className="w-full rounded-xl border border-border shadow-sm"
                      />

                      <div>
                        <p className="text-secondary font-semibold text-xs uppercase tracking-wide mb-2">
                          In the Community
                        </p>

                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Brad's portrait was exhibited at the
                          Kirkland Arts Center Youth Art Showcase in
                          2026, with a QR placard linking visitors
                          directly to this profile.
                        </p>

                        <Link
                          to="/media#exhibitions"
                          className="inline-block mt-3 text-sm text-secondary font-medium hover:underline"
                        >
                          See the exhibition →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* Additional photos only */}
                {additionalPhotos.length > 0 && (
                  <div
                    className={`grid gap-6 ${
                      additionalPhotos.length === 1
                        ? "grid-cols-1 max-w-sm"
                        : "grid-cols-2"
                    }`}
                  >
                    {additionalPhotos.map(
                      (image, index) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() =>
                            setSelectedAdditionalPhotoIndex(index)
                          }
                          className="group relative rounded-xl overflow-hidden shadow-md bg-muted cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                          aria-label={`View ${profile.name} additional photo ${
                            index + 1
                          } larger`}
                        >
                          <img
                            src={image.image_url}
                            alt={`${profile.name} additional photo ${
                              index + 1
                            }`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                          />

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </button>
                      )
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-6">
                  Published with permission. See{" "}
                  <Link
                    to="/privacy"
                    className="text-secondary hover:underline"
                  >
                    Privacy, Consent & Ethics
                  </Link>
                  .
                </p>
              </div>
            </AnimatedSection>
          </div>

          {profile.reflection_quote && (
            <div className="max-w-4xl mt-14">
              <AnimatedSection>
                <div className="border-t border-border pt-10">
                  <p className="text-secondary font-semibold text-xs uppercase tracking-wide mb-2">
                    In Their Own Words
                  </p>

                  <h2 className="font-display text-3xl text-foreground mb-6">
                    A Reflection from {firstName}
                  </h2>

                  {profile.reflection_video_url && (
                    <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-muted shadow-sm mb-7">
                      {reflectionEmbedUrl ? (
                        <iframe
                          src={reflectionEmbedUrl}
                          title={`${profile.name} reflection video`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                        />
                      ) : isDirectVideoUrl(
                          profile.reflection_video_url
                        ) ? (
                        <video
                          src={
                            profile.reflection_video_url
                          }
                          controls
                          className="w-full h-full object-contain bg-black"
                        />
                      ) : (
                        <a
                          href={
                            profile.reflection_video_url
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="w-full h-full flex items-center justify-center text-secondary font-medium hover:underline p-6 text-center"
                        >
                          Watch {firstName}'s reflection
                        </a>
                      )}
                    </div>
                  )}

                  <blockquote className="font-display text-2xl md:text-3xl italic text-foreground leading-snug max-w-3xl">
                    “{profile.reflection_quote}”
                  </blockquote>

                  <p className="text-xs text-muted-foreground mt-4">
                    {reflectionDate
                      ? `Recorded ${reflectionDate}, with permission.`
                      : "Shared with permission."}
                  </p>
                </div>
              </AnimatedSection>
            </div>
          )}

          <div className="max-w-6xl mt-8">
            <AppreciationWall
              profileSlug={profile.slug}
              personName={firstName}
            />
          </div>
        </div>
      </section>

      {/* Lightbox for additional photos only */}
      {selectedAdditionalPhotoIndex !== null &&
        additionalPhotos[selectedAdditionalPhotoIndex] && (
          <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={`${profile.name} additional photo gallery`}
            onClick={() =>
              setSelectedAdditionalPhotoIndex(null)
            }
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setSelectedAdditionalPhotoIndex(null);
              }}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-10 text-white p-2.5 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              aria-label="Close photo"
            >
              <X size={28} />
            </button>

            {additionalPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToPreviousAdditionalPhoto();
                }}
                className="absolute left-2 md:left-8 z-10 text-white p-2 md:p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft
                  size={36}
                  strokeWidth={1.8}
                />
              </button>
            )}

            <div
              className="max-w-6xl max-h-[92vh] flex flex-col items-center justify-center"
              onClick={(event) =>
                event.stopPropagation()
              }
            >
              <img
                src={
                  additionalPhotos[selectedAdditionalPhotoIndex]
                    .image_url
                }
                alt={`${profile.name} additional photo ${
                  selectedAdditionalPhotoIndex + 1
                }`}
                className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl"
              />

              {additionalPhotos.length > 1 && (
                <>
                  <p className="text-white/75 text-sm mt-4">
                    {selectedAdditionalPhotoIndex + 1} /{" "}
                    {additionalPhotos.length}
                  </p>

                  <p className="text-white/50 text-xs mt-1 md:hidden">
                    Swipe to view more
                  </p>
                </>
              )}
            </div>

            {additionalPhotos.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goToNextAdditionalPhoto();
                }}
                className="absolute right-2 md:right-8 z-10 text-white p-2 md:p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight
                  size={36}
                  strokeWidth={1.8}
                />
              </button>
            )}
          </div>
        )}
    </Layout>
  );
};

export default ProfilePage;