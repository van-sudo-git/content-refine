import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { supabase } from "@/integrations/supabase/client";
import { schoolGalleryPath } from "@/lib/schoolGallery";

interface ChapterSchool {
  id: string;
  name: string;
  district: string;
}

const Galleries = () => {
  const [schools, setSchools] = useState<ChapterSchool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSchools = async () => {
      // A school becomes a public chapter once it has at least one
      // published profile. No frontend code change is needed for new schools.
      const { data: publishedProfiles } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("status", "published");

      const schoolIds = Array.from(
        new Set(
          (publishedProfiles || [])
            .map((profile) => profile.school_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (schoolIds.length === 0) {
        setSchools([]);
        setLoading(false);
        return;
      }

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id, name, district")
        .in("id", schoolIds)
        .order("name");

      setSchools((schoolData || []) as ChapterSchool[]);
      setLoading(false);
    };

    loadSchools();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Galleries | Now We See You</title>
        <meta
          name="description"
          content="Explore Now We See You school chapters and the portraits and stories created in each community."
        />
        <link rel="canonical" href="https://nowweseeyou.org/galleries" />
        <meta property="og:title" content="Galleries | Now We See You" />
        <meta
          property="og:description"
          content="Explore school chapters recognizing the people who keep their communities running."
        />
        <meta property="og:url" content="https://nowweseeyou.org/galleries" />
        <meta property="og:type" content="website" />
      </Helmet>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-sm">
                Our Chapters
              </p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">
                Galleries
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Each school chapter recognizes the people behind the scenes in
                its own community.
              </p>
            </div>
          </AnimatedSection>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading chapters...</p>
            </div>
          ) : schools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {schools.map((school, index) => (
                <AnimatedSection key={school.id} delay={index * 0.08}>
                  <Link
                    to={schoolGalleryPath(school.name)}
                    className="group block h-full rounded-2xl border border-border bg-card p-7 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs uppercase tracking-widest text-secondary font-semibold mb-2">
                      School Chapter
                    </p>
                    <h2 className="font-display text-2xl text-foreground group-hover:text-secondary transition-colors mb-2">
                      {school.name}
                    </h2>
                    {school.district && (
                      <p className="text-sm text-muted-foreground mb-5">
                        {school.district}
                      </p>
                    )}
                    <span className="inline-flex items-center gap-2 text-sm text-secondary font-medium">
                      View gallery <ArrowRight size={15} />
                    </span>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection delay={0.2}>
              <div className="text-center p-12 bg-card rounded-2xl border border-border max-w-lg mx-auto">
                <p className="text-muted-foreground">
                  Chapter galleries are being prepared. Check back soon!
                </p>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Galleries;