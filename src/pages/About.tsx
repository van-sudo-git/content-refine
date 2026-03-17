import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import evaanPortrait from "@/assets/evaan-portrait.jpeg";
import qrCode from "@/assets/qr-who-am-i.png";

const About = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-sm">The Person Behind the Project</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-12">Meet Evaan Ahlawat</h1>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
              <AnimatedSection>
                <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden shadow-lg">
                  <img
                    src={evaanPortrait}
                    alt="Evaan Ahlawat — self-portrait drawing"
                    className="w-full h-full object-cover"
                  />
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="space-y-5 text-muted-foreground leading-relaxed">
                  <p>
                    I'm Evaan, a 10th grader at LWHS. This project celebrates the hidden builders of our school—staff who keep everything running but are often unseen.
                  </p>
                  <p>
                    I'm using portraits and QR-linked stories to see how connection changes behavior, and how technology can bring people forward, not pull us away.
                  </p>
                  <p>
                    Through <em>Now We See You</em>, I want to explore whether making someone's story visible can change how a community treats them—and whether technology, used thoughtfully, can make appreciation a habit rather than an afterthought.
                  </p>
                </div>

                <div className="mt-8 pt-8 border-t border-border">
                  <p className="text-sm font-semibold text-foreground mb-4">Page QR Code</p>
                  <div className="w-40 h-40 bg-card rounded-xl overflow-hidden border border-border shadow-sm">
                    <img
                      src={qrCode}
                      alt="QR code linking to Who Am I page"
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Scan to visit the original page</p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
