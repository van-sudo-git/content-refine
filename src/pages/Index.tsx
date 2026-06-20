import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Eye, Heart, BarChart3, Users, QrCode, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  department: string | null;
  portrait_url: string | null;
}

const Index = () => {
  const [profiles, setProfiles] = useState<FeaturedProfile[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, slug, name, role, department")
        .eq("status", "published")
        .order("created_at", { ascending: true });
      if (!profilesData) return;
      const ids = profilesData.map((p) => p.id);
      const { data: imagesData } = await supabase
        .from("profile_images")
        .select("profile_id, image_url")
        .in("profile_id", ids)
        .eq("image_type", "portrait");
      const portraitMap = new Map<string, string>();
      imagesData?.forEach((img) => portraitMap.set(img.profile_id, img.image_url));
      setProfiles(
        (profilesData as Omit<FeaturedProfile, "portrait_url">[]).map((p) => ({
          ...p,
          portrait_url: portraitMap.get(p.id) || null,
        }))
      );
    };
    load();
  }, []);

  return (
    <Layout>
      <Helmet>
        <title>Now We See You — Visibility in Action</title>
        <meta name="description" content="A student-led initiative celebrating the people who keep our school running. Read their stories, scan their QR code, leave a note of appreciation." />
        <link rel="canonical" href="https://nowweseeyou.org/" />
        <meta property="og:title" content="Now We See You — Visibility in Action" />
        <meta property="og:description" content="A student-led initiative celebrating the people who keep our school running." />
        <meta property="og:url" content="https://nowweseeyou.org/" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Now We See You",
          url: "https://nowweseeyou.org",
          description: "A student-led initiative celebrating the people who keep our school running.",
        })}</script>
      </Helmet>
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-20">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-lavender/40 to-background" />
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-20 left-[5%] w-96 h-96 rounded-full bg-accent/8 blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Text, centered */}
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-5"
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase">
                <Sparkles size={13} /> A Student-Led Initiative
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold text-6xl sm:text-7xl md:text-8xl text-foreground mb-5 leading-[1.05]"
            >
              Visibility{" "}
              <span className="text-gradient">in Motion.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed max-w-xl mx-auto"
            >
              We see the people who keep our school running every day, through hand-drawn portraits, real stories, and the power of human connection.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              <Link
                to="/gallery"
                className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Explore Stories <ArrowRight size={16} />
              </Link>
              <Link
                to="/nominate"
                className="inline-flex items-center justify-center gap-2 border border-border text-foreground px-7 py-3.5 rounded-xl font-medium hover:bg-muted transition-colors text-sm"
              >
                Nominate Someone
              </Link>
            </motion.div>
          </div>

          {/* Featured profiles carousel */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-5xl mx-auto mt-14"
          >
            {profiles.length > 0 && (
              <Carousel opts={{ align: "start", loop: profiles.length > 3 }} className="w-full">
                <CarouselContent className="-ml-4">
                  {profiles.map((p) => (
                    <CarouselItem key={p.id} className="pl-4 basis-2/3 sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <Link to={`/gallery/${p.slug}`} className="group block">
                        <div className="aspect-[3/4] bg-card rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow">
                          {p.portrait_url ? (
                            <img
                              src={p.portrait_url}
                              alt={`${p.name}, hand-drawn portrait`}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-card">
                              <span className="font-display text-5xl opacity-30">{p.name[0]}</span>
                            </div>
                          )}
                        </div>
                        <h2 className="font-display text-base text-foreground mt-3 truncate">{p.name}</h2>
                        <p className="text-muted-foreground text-xs truncate">
                          {p.role}
                          {p.department && `, ${p.department}`}
                        </p>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="hidden sm:flex -left-4" />
                <CarouselNext className="hidden sm:flex -right-4" />
              </Carousel>
            )}
            <p className="text-center text-xs text-muted-foreground mt-4">
              Scroll sideways to meet everyone · <Link to="/gallery" className="text-secondary hover:underline">View full gallery</Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-xs">The Process</p>
              <h2 className="font-display text-3xl md:text-4xl text-foreground">How It Works</h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                step: "01",
                title: "Invite",
                description: "Staff are invited to participate. It's always optional, anyone can say no.",
              },
              {
                icon: Shield,
                step: "02",
                title: "Consent",
                description: "Only what each person consents to share is published. They choose their visibility.",
              },
              {
                icon: QrCode,
                step: "03",
                title: "Connect",
                description: "QR codes link to story pages so anyone can learn about and thank these heroes.",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.12}>
                <div className="bg-card rounded-2xl p-7 text-center border border-border hover:border-secondary/40 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={22} className="text-secondary" />
                  </div>
                  <span className="text-[10px] font-bold text-secondary tracking-widest uppercase">{item.step}</span>
                  <h3 className="font-display text-xl text-foreground mt-1 mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Pillars */}
      <section className="py-20 bg-lavender/30">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-14">
              <h2 className="font-display text-3xl md:text-4xl text-foreground">See. Appreciate. Measure.</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { icon: Eye, title: "See", desc: "QR-linked stories bring visibility to the people behind the scenes.", color: "text-secondary" },
              { icon: Heart, title: "Appreciate", desc: "Leave a thank-you note to show gratitude for everyday contributions.", color: "text-accent" },
              { icon: BarChart3, title: "Measure", desc: "Privacy-safe analytics track reach and impact without identifying visitors.", color: "text-secondary" },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.12}>
                <div className="text-center bg-background/60 rounded-2xl p-7 border border-border">
                  <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <item.icon size={26} className={item.color} />
                  </div>
                  <h3 className="font-display text-xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="max-w-2xl mx-auto text-center bg-card rounded-3xl p-10 md:p-14 border border-border shadow-sm">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Heart size={26} className="text-accent" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Know an Unsung Hero?
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
                Nominate a staff member who deserves to be seen and celebrated. Participation is always voluntary and consent-based.
              </p>
              <Link
                to="/nominate"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Nominate Someone <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
