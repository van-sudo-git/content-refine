import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { schoolToGallerySlug } from "@/lib/schoolGallery";

interface GalleryProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  nomination_id: string | null;
  created_at: string;
  portrait_url: string | null;
  artist_name: string | null;
}

interface GallerySchool {
  id: string;
  name: string;
  district: string;
}

const CONTRIBUTOR_TRACKING_STARTED = "2026-08-20T00:00:00Z";

const Gallery = () => {
  const { schoolSlug } = useParams<{ schoolSlug: string }>();
  const [school, setSchool] = useState<GallerySchool | null>(null);
  const [profiles, setProfiles] = useState<GalleryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const loadProfiles = async () => {
      if (!schoolSlug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // The database already has school ids. We only derive the readable
      // URL from the school name here, then use the real school id for data.
      const { data: schoolsData, error: schoolsError } = await supabase
        .from("schools")
        .select("id, name, district");

      if (schoolsError || !schoolsData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const matchedSchool = schoolsData.find(
        (item) => schoolToGallerySlug(item.name) === schoolSlug
      );

      if (!matchedSchool) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const typedSchool = matchedSchool as GallerySchool;
      setSchool(typedSchool);

      // This is the important multi-school boundary: only this school's
      // published profiles are allowed into this chapter gallery.
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, slug, name, role, department, nomination_id, created_at")
        .eq("school_id", typedSchool.id)
        .eq("status", "published")
        .order("created_at", { ascending: true });

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const typedProfiles = profilesData as Omit<
        GalleryProfile,
        "portrait_url" | "artist_name"
      >[];
      const profileIds = typedProfiles.map((p) => p.id);

      const [{ data: imagesData }, { data: artistData }] = await Promise.all([
        supabase
          .from("profile_images")
          .select("profile_id, image_url")
          .in("profile_id", profileIds)
          .eq("image_type", "portrait"),
        supabase
          .from("profile_contributors")
          .select("profile_id, contributor_name")
          .in("profile_id", profileIds)
          .eq("contribution_type", "artist"),
      ]);

      const portraitMap = new Map<string, string>();
      if (imagesData) {
        for (const img of imagesData) {
          if (img.profile_id && !portraitMap.has(img.profile_id)) {
            portraitMap.set(img.profile_id, img.image_url);
          }
        }
      }

      const artistMap = new Map<string, string[]>();
      if (artistData) {
        for (const contributor of artistData) {
          const existing = artistMap.get(contributor.profile_id) || [];
          if (!existing.includes(contributor.contributor_name)) {
            existing.push(contributor.contributor_name);
          }
          artistMap.set(contributor.profile_id, existing);
        }
      }

      setProfiles(
        typedProfiles.map((p) => {
          const portraitUrl = portraitMap.get(p.id) || null;
          const artistNames = artistMap.get(p.id);

          return {
            ...p,
            portrait_url: portraitUrl,
            artist_name:
              artistNames && artistNames.length > 0
                ? artistNames.join(", ")
                : portraitUrl && p.created_at < CONTRIBUTOR_TRACKING_STARTED
                  ? "Evaan Ahlawat"
                  : null,
          };
        })
      );

      setLoading(false);
    };

    loadProfiles();
  }, [schoolSlug]);

  if (notFound) {
    return (
      <Layout>
        <section className="py-24 min-h-[70vh] flex items-center">
          <div className="container mx-auto px-6 text-center">
            <h1 className="font-display text-4xl text-foreground mb-4">
              Gallery Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              This school does not have a public gallery yet.
            </p>
            <Link to="/galleries" className="text-secondary hover:underline">
              Back to Galleries
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const canonical = school
    ? `https://nowweseeyou.org/galleries/${schoolToGallerySlug(school.name)}`
    : "https://nowweseeyou.org/galleries";

  return (
    <Layout>
      <Helmet>
        <title>
          {school
            ? `${school.name} Gallery | Now We See You`
            : "Gallery | Now We See You"}
        </title>
        <meta
          name="description"
          content={
            school
              ? `Portraits and stories from the ${school.name} chapter of Now We See You.`
              : "Portraits and stories from Now We See You."
          }
        />
        <link rel="canonical" href={canonical} />
        <meta
          property="og:title"
          content={
            school
              ? `${school.name} Gallery — Now We See You`
              : "Gallery — Now We See You"
          }
        />
        <meta
          property="og:description"
          content={
            school
              ? `Meet the unsung heroes recognized by the ${school.name} chapter.`
              : "Meet the unsung heroes recognized by Now We See You."
          }
        />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: school
              ? `${school.name} Gallery — Now We See You`
              : "Gallery — Now We See You",
            description: school
              ? `A collection of consent-based portraits and stories from ${school.name}.`
              : "A collection of consent-based portraits and stories.",
            url: canonical,
            isPartOf: {
              "@type": "WebSite",
              name: "Now We See You",
              url: "https://nowweseeyou.org",
            },
            hasPart: profiles.map((p) => ({
              "@type": "Person",
              name: p.name,
              jobTitle: p.role,
              url: `https://nowweseeyou.org/gallery/${p.slug}`,
              ...(p.portrait_url ? { image: p.portrait_url } : {}),
            })),
          })}
        </script>
      </Helmet>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <Link
            to="/galleries"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft size={16} /> All Galleries
          </Link>

          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-sm">
                The People Behind the Scenes
              </p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
                {school?.name || "Gallery"}
              </h1>
              {school?.district && (
                <p className="text-muted-foreground text-sm mb-3">
                  {school.district}
                </p>
              )}
              <p className="text-muted-foreground max-w-xl mx-auto">
                Meet the unsung heroes in this school community. Each portrait
                and story is shared with full consent.
              </p>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading profiles...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {profiles.map((profile, i) => (
                <AnimatedSection key={profile.id} delay={i * 0.1}>
                  <Link to={`/gallery/${profile.slug}`} className="group block">
                    <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                      {profile.portrait_url ? (
                        <img
                          src={profile.portrait_url}
                          alt={profile.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-card p-6 text-center">
                          <span className="font-display text-6xl opacity-30 mb-3">
                            {profile.name[0]}
                          </span>
                          <p className="text-xs uppercase tracking-widest text-secondary font-semibold">
                            Portrait in progress
                          </p>
                          <p className="text-[11px] text-muted-foreground italic mt-1">
                            A hand-drawn portrait is being prepared
                          </p>
                        </div>
                      )}
                    </div>
                    <h2 className="font-display text-xl text-foreground group-hover:text-secondary transition-colors">
                      {profile.name}
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {profile.role}
                      {profile.department && `, ${profile.department}`}
                    </p>
                    {profile.portrait_url && profile.artist_name && (
                      <p className="text-[11px] text-muted-foreground italic mt-1">
                        Artist — {profile.artist_name}
                      </p>
                    )}
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          )}

          {!loading && profiles.length === 0 && (
            <AnimatedSection delay={0.3}>
              <div className="text-center mt-4 p-12 bg-card rounded-2xl border border-border max-w-lg mx-auto">
                <p className="text-muted-foreground mb-4">
                  No published profiles yet. Check back soon!
                </p>
                <Link
                  to="/nominate"
                  className="inline-flex items-center gap-2 text-secondary font-medium hover:underline"
                >
                  Nominate someone <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedSection>
          )}

          {!loading && profiles.length > 0 && (
            <AnimatedSection delay={profiles.length * 0.1 + 0.2}>
              <div className="text-center mt-16">
                <Link
                  to="/nominate"
                  className="inline-flex items-center gap-2 text-secondary font-medium hover:underline"
                >
                  Know someone who deserves to be seen? Nominate them{" "}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Gallery;