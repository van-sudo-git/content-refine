import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import evaanPortrait from "@/assets/evaan-portrait.jpeg";
import qrCode from "@/assets/about-qr.jpeg";

const About = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <AnimatedSection>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold tracking-wide uppercase mb-5">
                <Sparkles size={13} /> A Movement of Visibility
              </span>
              <h1 className="font-display text-5xl sm:text-6xl md:text-7xl text-foreground mb-6 leading-[1.05]">
                Our Story
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                <em>Now We See You</em> is a student-led initiative dedicated to celebrating the
                hidden builders of school communities — staff who keep everything running but are
                often unseen. What began as a single chapter at Lake Washington High School is
                designed to grow into a national movement.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Inaugural Chapter */}
      <section className="py-16 bg-lavender/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
                <div className="md:col-span-1">
                  <span className="inline-flex items-center gap-1.5 text-secondary font-semibold text-xs tracking-wide uppercase mb-2">
                    <MapPin size={13} /> The Inaugural Chapter
                  </span>
                  <h2 className="font-display text-3xl text-foreground leading-tight">
                    Lake Washington High School
                  </h2>
                </div>
                <div className="md:col-span-2 space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    LWHS is the proven pilot — the first community where this model was built,
                    tested, and refined. Every portrait, story, QR code, and appreciation message
                    here represents the foundation of what's possible.
                  </p>
                  <p>
                    The model is intentionally designed to be repeatable. This site is built as a
                    central hub: each future school becomes its own chapter, with its own gallery,
                    while sharing the same mission and infrastructure.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Founder's Note */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="text-center mb-12">
                <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-xs">
                  Founder's Note
                </p>
                <h2 className="font-display text-4xl md:text-5xl text-foreground">
                  From the Founding Artist
                </h2>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-12 items-start">
              <AnimatedSection>
                <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={evaanPortrait}
                    alt="Evaan Ahlawat — Founding Artist & Creator"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-4 text-center">
                  <h3 className="font-display text-xl text-foreground">Evaan Ahlawat</h3>
                  <p className="text-secondary text-sm font-medium">
                    Founding Artist & Creator
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    10th Grade · Lake Washington High School
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="space-y-6">
                  <blockquote className="border-l-4 border-secondary pl-6 py-2 font-display text-2xl md:text-3xl italic text-foreground leading-snug">
                    I started <span className="text-secondary">Now We See You</span> because the
                    people who hold our school together every day deserve to be seen — not just
                    thanked in passing, but truly known.
                  </blockquote>

                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p>
                      Every portrait in this gallery is hand-drawn by me. Every story is collected
                      through a real conversation. The QR codes, the appreciation wall, the
                      analytics — they exist to test a single idea: <em>can technology, used
                      thoughtfully, make appreciation a habit instead of an afterthought?</em>
                    </p>
                    <p>
                      My vision is for this to outlast its first chapter. As the model expands to
                      other schools, my role is to protect the soul of the project — the
                      hand-drawn art, the consent-first ethics, and the focus on the people
                      most often overlooked.
                    </p>
                    <p className="text-foreground font-medium">— Evaan Ahlawat</p>
                  </div>

                  {/* QR card */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <div className="w-20 h-20 bg-card rounded-xl overflow-hidden border border-border shadow-sm flex-shrink-0">
                      <img
                        src={qrCode}
                        alt="QR code linking to this page"
                        className="w-full h-full object-contain p-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Scan to share this page or revisit the founder's note.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* Recognition section removed for now */}

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Want to bring a chapter to your school?
              </h2>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto leading-relaxed">
                The model is designed to scale. Reach out through the nominate page to start a
                conversation about expanding to your community.
              </p>
              <Link
                to="/nominate"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-7 py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
              >
                Get in Touch <ArrowRight size={16} />
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default About;
