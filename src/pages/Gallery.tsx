import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";

interface GalleryProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  portrait_url: string | null;
}

const Gallery = () => {
  const [profiles, setProfiles] = useState<GalleryProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfiles = async () => {
      // Fetch published profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, slug, name, role, department")
        .eq("status", "published")
        .order("created_at", { ascending: true });

      if (!profilesData) {
        setLoading(false);
        return;
      }

      // Fetch portrait images for these profiles
      const profileIds = (profilesData as GalleryProfile[]).map((p) => p.id);
      const { data: imagesData } = await supabase
        .from("profile_images")
        .select("profile_id, image_url")
        .in("profile_id", profileIds)
        .eq("image_type", "portrait");

      const portraitMap = new Map<string, string>();
      if (imagesData) {
        for (const img of imagesData) {
          portraitMap.set(img.profile_id, img.image_url);
        }
      }

      setProfiles(
        (profilesData as GalleryProfile[]).map((p) => ({
          ...p,
          portrait_url: portraitMap.get(p.id) || null,
        }))
      );
      setLoading(false);
    };

    loadProfiles();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Gallery — Meet Our Unsung Heroes | Now We See You</title>
        <meta name="description" content="Browse portraits and stories of the staff who keep our school running. Each profile is hand-drawn, written with consent, and linked to a QR code." />
        <link rel="canonical" href="https://nowweseeyou.org/gallery" />
        <meta property="og:title" content="Gallery — Meet Our Unsung Heroes" />
        <meta property="og:description" content="Portraits and stories of the staff who keep our school running, shared with consent." />
        <meta property="og:url" content="https://nowweseeyou.org/gallery" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Gallery — Meet Our Unsung Heroes",
          description: "A collection of hand-drawn portraits and consent-based stories of the staff who keep our school community running.",
          url: "https://nowweseeyou.org/gallery",
          isPartOf: { "@type": "WebSite", name: "Now We See You", url: "https://nowweseeyou.org" },
          hasPart: profiles.map((p) => ({
            "@type": "Person",
            name: p.name,
            jobTitle: p.role,
            url: `https://nowweseeyou.org/gallery/${p.slug}`,
            ...(p.portrait_url ? { image: p.portrait_url } : {}),
          })),
        })}</script>
      </Helmet>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-sm">The People Behind the Scenes</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">Gallery</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Meet the unsung heroes who keep our communities running. Each portrait and story is shared with full consent.
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
                          <span className="font-display text-6xl opacity-30 mb-3">{profile.name[0]}</span>
                          <p className="text-xs uppercase tracking-widest text-secondary font-semibold">Portrait in progress</p>
                          <p className="text-[11px] text-muted-foreground italic mt-1">A hand-drawn portrait is being prepared</p>
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
                    {profile.portrait_url && (
                      <p className="text-[11px] text-muted-foreground italic mt-1">
                        Portrait by Evaan Ahlawat
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
                <p className="text-muted-foreground mb-4">Profiles are being prepared. Check back soon!</p>
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
                  Know someone who deserves to be seen? Nominate them <ArrowRight size={16} />
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
