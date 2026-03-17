import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import bradPortrait from "@/assets/brad-portrait.jpeg";

const BradFisher = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <Link to="/gallery" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft size={16} /> Back to Gallery
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl">
            <AnimatedSection>
              <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden sticky top-28 shadow-lg">
                <img
                  src={bradPortrait}
                  alt="Brad Fisher — hand-drawn portrait"
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl text-foreground mb-1">Brad Fisher</h1>
                  <p className="text-secondary font-medium text-lg">Custodian — Lake Washington High School</p>
                  <p className="text-muted-foreground text-sm mt-1">Working here since 2018</p>
                </div>

                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    Every school runs because of many people working behind the scenes. One of those people is Brad Fisher, who has been a custodian at Lake Washington High School since August 2018.
                  </p>
                  <p>
                    Brad says what he enjoys most about the school is the environment and the opportunity to interact with students and staff. For him, the job isn't just about cleaning or maintenance — it's also about helping people and solving problems.
                  </p>
                  <p>
                    A typical day for Brad rarely looks the same. Some mornings start with opening the school and setting up lunch tables. Other moments involve vacuuming hallways, picking up garbage, addressing heating or lighting issues, and supporting the kitchen staff. Every day brings different challenges.
                  </p>
                  <p>
                    His main responsibility, he says, is making sure the school remains clean, safe, and welcoming for everyone who learns and works there.
                  </p>
                  <p>
                    What keeps him motivated is the variety of the job. The work can be challenging, but it's also rewarding. Most of all, he values the daily interactions with people throughout the school.
                  </p>
                  <p>
                    Outside of work, Brad enjoys working on small engines, as well as camping and fishing. When asked about the biggest fish he has ever caught, he laughed and said it was about ten pounds.
                  </p>
                </div>

                <blockquote className="border-l-4 border-secondary pl-6 py-2">
                  <p className="font-display text-2xl text-foreground italic">
                    "Be flexible. Try to understand people. Everyone is different."
                  </p>
                </blockquote>

                <div className="pt-6">
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSf-cBs6BJ59ah8ctV3MHDZsqFVdcA83J-ZLV_PgRg6EQD0TIg/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-7 py-3.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Send a Thank You Note
                  </a>
                </div>

                <p className="text-xs text-muted-foreground pt-4">
                  Published with permission. See{" "}
                  <Link to="/privacy" className="text-secondary hover:underline">Privacy, Consent & Ethics</Link>.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BradFisher;
