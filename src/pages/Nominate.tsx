import { ExternalLink } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";

const Nominate = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center">
            <AnimatedSection>
              <p className="text-secondary font-medium mb-2">Make Someone's Day</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">Nominate or Participate</h1>
              <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
                Know a staff member who deserves to be seen and celebrated? Nominate them using the form below. You can also volunteer to be featured yourself.
              </p>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
                <div className="space-y-6">
                  <div className="text-left space-y-4">
                    <h3 className="font-display text-2xl text-foreground">What you'll need</h3>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm flex items-center justify-center shrink-0 mt-0.5">1</span>
                        Their name, role, and department
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm flex items-center justify-center shrink-0 mt-0.5">2</span>
                        Why you're nominating them
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm flex items-center justify-center shrink-0 mt-0.5">3</span>
                        Whether you've told them about the nomination
                      </li>
                    </ul>
                  </div>

                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfHRY9IyLsILpUrTMfXQZPfO7uySZ86iO6pSGypEI7vE6hk-Q/viewform"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-7 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity text-lg"
                  >
                    Open Nomination Form <ExternalLink size={18} />
                  </a>

                  <p className="text-xs text-muted-foreground">
                    Participation is always voluntary. Nominees will be contacted and can choose not to participate.
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Nominate;
