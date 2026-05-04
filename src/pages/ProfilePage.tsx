import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import AppreciationWall from "@/components/AppreciationWall";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  bio: string | null;
}

interface ProfileImage {
  id: string;
  image_url: string;
  image_type: string;
  sort_order: number;
}

const ProfilePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [images, setImages] = useState<ProfileImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, slug, name, role, department, bio")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      if (error || !profileData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setProfile(profileData as ProfileData);

      const { data: imgData } = await supabase
        .from("profile_images")
        .select("id, image_url, image_type, sort_order")
        .eq("profile_id", (profileData as ProfileData).id)
        .order("sort_order");

      if (imgData) setImages(imgData as ProfileImage[]);
      setLoading(false);
    };

    load();
  }, [slug]);

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
            <h1 className="font-display text-4xl text-foreground mb-4">Profile Not Found</h1>
            <p className="text-muted-foreground mb-6">This person may not have a published profile yet.</p>
            <Link to="/gallery" className="text-secondary hover:underline">
              Back to Gallery
            </Link>
          </div>
        </section>
      </Layout>
    );
  }

  const portrait = images.find((i) => i.image_type === "portrait");
  const qr = images.find((i) => i.image_type === "qr");
  const additionalPhotos = images.filter((i) => i.image_type === "additional");
  const bioParagraphs = profile.bio?.split("\n").filter((p) => p.trim()) || [];
  const firstName = profile.name.split(" ")[0];

  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft size={16} /> Back to Gallery
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl">
            {/* Portrait */}
            {portrait && (
              <AnimatedSection>
                <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden sticky top-28 shadow-lg">
                  <img
                    src={portrait.image_url}
                    alt={`${profile.name} portrait`}
                    className="w-full h-full object-cover"
                  />
                </div>
              </AnimatedSection>
            )}

            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-foreground mb-1">
                    {profile.name}
                  </h1>
                  <p className="text-secondary font-medium text-lg">
                    {profile.role}
                    {profile.department && ` — ${profile.department}`}
                  </p>
                </div>

                {/* Bio with QR */}
                <div className="flex gap-8 items-start">
                  <div className="flex-1 space-y-4 text-muted-foreground leading-relaxed">
                    {bioParagraphs.slice(0, 3).map((p, i) => {
                      const trimmed = p.trim();
                      const isQuote = /^["“].+["”]$/.test(trimmed);
                      return isQuote ? (
                        <blockquote
                          key={i}
                          className="border-l-4 border-secondary pl-5 py-2 my-2 font-display text-2xl italic text-foreground leading-snug"
                        >
                          {trimmed.replace(/^["“]|["”]$/g, "")}
                        </blockquote>
                      ) : (
                        <p key={i}>{p}</p>
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
                        Scan to visit<br />this page
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile QR */}
                {qr && (
                  <div className="sm:hidden pt-4 border-t border-border flex items-center gap-4">
                    <div className="w-24 h-24 bg-card rounded-xl overflow-hidden border border-border shadow-sm flex-shrink-0">
                      <img
                        src={qr.image_url}
                        alt={`QR code for ${profile.name}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Scan to visit this page</p>
                  </div>
                )}

                {/* Remaining bio */}
                {bioParagraphs.length > 3 && (
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {bioParagraphs.slice(3).map((p, i) => {
                      const trimmed = p.trim();
                      const isQuote = /^["“].+["”]$/.test(trimmed);
                      return isQuote ? (
                        <blockquote
                          key={i}
                          className="border-l-4 border-secondary pl-5 py-2 my-2 font-display text-2xl italic text-foreground leading-snug"
                        >
                          {trimmed.replace(/^["“]|["”]$/g, "")}
                        </blockquote>
                      ) : (
                        <p key={i}>{p}</p>
                      );
                    })}
                  </div>
                )}

                {/* Additional photos */}
                {additionalPhotos.length > 0 && (
                  <div className={`grid gap-6 ${additionalPhotos.length === 1 ? "grid-cols-1 max-w-sm" : "grid-cols-2"}`}>
                    {additionalPhotos.map((img) => (
                      <div key={img.id} className="rounded-xl overflow-hidden shadow-md">
                        <img
                          src={img.image_url}
                          alt={`${profile.name} photo`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground pt-6">
                  Published with permission. See{" "}
                  <Link to="/privacy" className="text-secondary hover:underline">
                    Privacy, Consent & Ethics
                  </Link>
                  .
                </p>
              </div>
            </AnimatedSection>
          </div>

          {/* Appreciation Wall */}
          <div className="max-w-6xl mt-8">
            <AppreciationWall profileSlug={profile.slug} personName={firstName} />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ProfilePage;
