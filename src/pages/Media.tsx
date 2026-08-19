import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import { Helmet } from "react-helmet-async";
import { ArrowRight, Headphones } from "lucide-react";

const receptionPhotos = [
  {
    src: "/media/kac/kac-youth-art-showcase-flyer.png",
    alt: "Kirkland Arts Center Youth Art Showcase",
    caption:
      "Now We See You at the Kirkland Arts Center Showcase.",
  },
  {
    src: "/media/kac/visitor-conversation.jpg",
    alt: "Evaan Ahlawat speaking with a visitor at the Kirkland Arts Center reception",
    caption:
      "Speaking with a visitor at the reception as the project moved from a digital platform into a community setting.",
  },
];

const Media = () => {
  return (
    <Layout>
      <Helmet>
        <title>In the Community | Now We See You</title>
        <meta
          name="description"
          content="Exhibitions, conversations, and community moments that bring Now We See You stories beyond the screen."
        />
        <link rel="canonical" href="https://nowweseeyou.org/media" />
        <meta property="og:title" content="In the Community | Now We See You" />
        <meta
          property="og:description"
          content="See how Now We See You brings stories of overlooked school staff into exhibitions, conversations, and community spaces."
        />
        <meta property="og:url" content="https://nowweseeyou.org/media" />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Hero */}
      <section className="pt-24 pb-14">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <p className="text-secondary font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                Beyond the screen
              </p>
              <h1 className="font-display text-5xl sm:text-6xl text-foreground mb-5">
                In the Community
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
                Now We See You begins with a conversation and a portrait, but the goal is
                larger: to help overlooked members of a school community become known,
                remembered, and appreciated. These are some of the places where those
                stories have traveled beyond the website.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* KAC exhibition */}
      <section id="exhibitions" className="pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection>
              <div className="border-t border-border pt-10">
                <p className="text-secondary font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                  Exhibition
                </p>
                <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                  Kirkland Arts Center Youth Art Showcase
                </h2>
                <p className="text-muted-foreground text-sm mb-6">
                  Kirkland, Washington · 2026
                </p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-[1.08fr_0.92fr] gap-8 items-start">
              <AnimatedSection delay={0.08}>
                <figure>
                  <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-muted">
                    <img
                      src="/media/kac/evaan-exhibit.jpg"
                      alt="Evaan Ahlawat standing beside Brad Fisher's Now We See You portrait and QR placard at Kirkland Arts Center"
                      className="w-full h-auto block"
                    />
                  </div>
                  <figcaption className="text-xs text-muted-foreground mt-3 leading-relaxed">
                    Brad Fisher's portrait at Kirkland Arts Center, with a dedicated QR
                    placard connecting exhibition visitors to his Now We See You story.
                  </figcaption>
                </figure>
              </AnimatedSection>

              <AnimatedSection delay={0.14}>
                <div className="space-y-5 text-muted-foreground leading-relaxed">
                  <p>
                    In 2026, Evaan's portrait of{" "}
                    <strong className="text-foreground">Brad Fisher</strong>, Head Custodian
                    at Lake Washington High School, was exhibited at Kirkland Arts Center.
                  </p>
                  <p>
                    Brad's portrait was displayed alongside a dedicated QR placard linking
                    visitors directly to his Now We See You profile. The installation
                    extended the portrait beyond the gallery wall: visitors could see the
                    artwork, learn who Brad is, and read the story behind the person
                    represented.
                  </p>
                  <p>
                    For Now We See You, the exhibition became an early example of the
                    project's central idea: recognition can move between art, technology,
                    and public space while keeping the person being recognized at the center.
                  </p>
                </div>
              </AnimatedSection>
            </div>

            {/* Reception video */}
            <AnimatedSection delay={0.1}>
              <div className="mt-12">
                <p className="text-secondary font-semibold text-xs uppercase tracking-[0.2em] mb-4">
                  From the reception
                </p>
                <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-black">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster="/media/kac/reception-poster.jpg"
                    className="w-full aspect-video object-contain bg-black"
                  >
                    <source src="/media/kac/reception.mp4" type="video/mp4" />
                    Your browser does not support embedded video.
                  </video>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Evaan speaks about the project beside Brad's portrait and QR-linked story
                  during the Kirkland Arts Center artist reception.
                </p>
              </div>
            </AnimatedSection>

            {/* Reception photos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
              {receptionPhotos.map((photo, index) => (
                <AnimatedSection key={photo.src} delay={0.08 * (index + 1)}>
                  <figure>
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-border bg-muted">
                      <img
                        src={photo.src}
                        alt={photo.alt}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <figcaption className="text-xs text-muted-foreground mt-2 leading-relaxed">
                      {photo.caption}
                    </figcaption>
                  </figure>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Podcast */}
      <section id="conversations" className="py-20 bg-lavender/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection>
              <div className="flex items-center gap-2 text-secondary font-semibold text-xs uppercase tracking-[0.2em] mb-3">
                <Headphones size={15} />
                Conversation
              </div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-2">
                More Than a Portrait: The Story Behind Now We See You
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                In the Groove with Todd and Jackie · Episode 69 · August 7, 2026 · 37 min
              </p>

              <div className="space-y-4 text-muted-foreground leading-relaxed max-w-3xl mb-8">
                <p>
                  A conversation about what happens when recognition becomes more than
                  a thank-you.
                </p>
                <p>
                  Evaan talks with Jackie Bailey about why he started Now We See You,
                  how conversations with school staff become charcoal portraits and
                  permanent digital stories, and what he has learned about the difference
                  between noticing someone and truly seeing them.
                </p>
              </div>

              <p className="text-foreground font-medium text-sm mb-4">
                Watch the conversation
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.1}>
              <div className="rounded-2xl overflow-hidden border border-border shadow-lg mb-5 bg-card">
                <iframe
                  src="https://www.youtube.com/embed/4dm-vo3Qk0U"
                  title="More Than a Portrait: The Story Behind Now We See You"
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  style={{
                    width: "100%",
                    aspectRatio: "16 / 9",
                    border: 0,
                    display: "block",
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="https://open.spotify.com/episode/1qzW9Z9VSeYQPp01S9E1Dv"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Spotify <ArrowRight size={14} />
                </a>
                <a
                  href="https://podcasts.apple.com/us/podcast/ep-69-more-than-a-portrait-the-story-behind-now-we/id1830625612?i=1000780924636"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
                >
                  Apple Podcasts <ArrowRight size={14} />
                </a>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Media;
