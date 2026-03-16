import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";

const About = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <p className="text-secondary font-medium mb-2">The Person Behind the Project</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-12">Meet Evaan Ahlawat</h1>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-12 items-start">
              <AnimatedSection>
                <div className="aspect-square bg-muted rounded-2xl overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/sitesv/APaQ0STLnMZrJvUoOMXcAt9-tLwfyJzkboY2_y2xOauIa0FC8kNheZf6JH1c8ujsHoJ0-KNFksWvFOb8cUaSlMH2fLI7ietIb4HqEPx4C5BqhM0D8oNESo3kN6gApK7nowKBaWHZN89rYpVVHQUunwG3eoPcdMqqkfWMXT65YJASshTMuvLMqPXxhpQGouUHFKTakNU0K0X--YyyLoxkAE1f3-3JfWgChsnHaqq_YmA=w1280"
                    alt="Evaan Ahlawat"
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
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default About;
