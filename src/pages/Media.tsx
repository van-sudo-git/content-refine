import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";

const Media = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6 max-w-3xl">
          <AnimatedSection>
            <h1 className="font-display text-4xl text-foreground mb-2">Media</h1>
            <p className="text-muted-foreground mb-12">
              Podcasts, talks, and press coverage featuring Now We See You.
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <p className="text-secondary font-medium text-sm uppercase tracking-wide mb-2">
              Podcast
            </p>
            <h2 className="font-display text-2xl text-foreground mb-1">
              More Than a Portrait: The Story Behind Now We See You
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              In the Groove with Todd and Jackie · Episode 69 · August 7, 2026 · 37 min
            </p>

            <div className="rounded-2xl overflow-hidden border border-border shadow-lg mb-4">
              <iframe
                src="https://www.youtube.com/embed/4dm-vo3Qk0U"
                title="More Than a Portrait: The Story Behind Now We See You"
                allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                loading="lazy"
                style={{ width: "100%", aspectRatio: "16 / 9", border: 0, display: "block" }}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <a

                href="https://open.spotify.com/episode/1qzW9Z9VSeYQPp01S9E1Dv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Spotify
              </a>
              <a

                href="https://podcasts.apple.com/us/podcast/ep-69-more-than-a-portrait-the-story-behind-now-we/id1830625612?i=1000780924636"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Apple Podcasts
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default Media;