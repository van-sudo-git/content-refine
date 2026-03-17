import { Link } from "react-router-dom";
import { ArrowRight, Eye, Heart, BarChart3, Users, QrCode, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import bradPortrait from "@/assets/brad-portrait.jpeg";
import evaanPortrait from "@/assets/evaan-portrait.jpeg";

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-secondary/20" />
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-1.5 rounded-full border border-secondary/40 text-secondary text-sm font-medium tracking-wide uppercase">
                A Student-Led Initiative
              </span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="font-display text-5xl sm:text-6xl md:text-8xl text-primary-foreground mb-6 leading-[1.05] tracking-tight"
            >
              Every Face <br />
              <span className="text-secondary">Has a Story.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-primary-foreground/70 text-lg md:text-xl mb-12 leading-relaxed max-w-2xl mx-auto"
            >
              We see the people who keep our school running every day—through hand-drawn portraits, real stories, and the power of human connection.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-base"
              >
                Explore Stories <ArrowRight size={18} />
              </Link>
              <Link
                to="/nominate"
                className="inline-flex items-center gap-2 border border-primary-foreground/25 text-primary-foreground px-8 py-4 rounded-lg font-medium hover:bg-primary-foreground/5 transition-colors text-base"
              >
                Nominate Someone
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portraits Section */}
      <section className="py-28">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-20">
              <p className="text-secondary font-semibold mb-3 tracking-wide uppercase text-sm">The Portraits</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground">Drawn by Hand. Told in Words.</h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <AnimatedSection delay={0.1}>
              <Link to="/gallery/brad-fisher" className="group block">
                <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden mb-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src={bradPortrait} alt="Brad Fisher — hand-drawn portrait" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <h3 className="font-display text-2xl text-foreground group-hover:text-secondary transition-colors">Brad Fisher</h3>
                <p className="text-muted-foreground text-sm mt-1">Custodian, LWHS — since 2018</p>
              </Link>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link to="/about" className="group block">
                <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden mb-5 shadow-lg group-hover:shadow-xl transition-shadow">
                  <img src={evaanPortrait} alt="Evaan Ahlawat — self-portrait" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                </div>
                <h3 className="font-display text-2xl text-foreground group-hover:text-secondary transition-colors">Evaan Ahlawat</h3>
                <p className="text-muted-foreground text-sm mt-1">Artist & Creator of Now We See You</p>
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-semibold mb-3 tracking-wide uppercase text-sm">The Process</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground">How It Works</h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                step: "01",
                title: "Invite",
                description: "Staff are invited to participate. It's always optional—anyone can say no.",
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
              <AnimatedSection key={item.step} delay={i * 0.15}>
                <div className="bg-background rounded-2xl p-8 text-center border border-border hover:border-secondary/30 transition-colors">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon size={24} className="text-secondary" />
                  </div>
                  <span className="text-xs font-semibold text-secondary tracking-widest">{item.step}</span>
                  <h3 className="font-display text-2xl text-foreground mt-1 mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Pillars */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <h2 className="font-display text-4xl md:text-5xl text-foreground">See. Appreciate. Measure.</h2>
            </div>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: Eye, title: "See", desc: "QR-linked stories bring visibility to the people behind the scenes." },
              { icon: Heart, title: "Appreciate", desc: "Leave a thank-you note to show gratitude for everyday contributions." },
              { icon: BarChart3, title: "Measure", desc: "Privacy-safe analytics track reach and impact without identifying visitors." },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 0.15}>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon size={28} className="text-secondary" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary">
        <div className="container mx-auto px-6 text-center">
          <AnimatedSection>
            <h2 className="font-display text-4xl md:text-5xl text-primary-foreground mb-6">
              Know an Unsung Hero?
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-10 max-w-xl mx-auto">
              Nominate a staff member who deserves to be seen and celebrated. Participation is always voluntary and consent-based.
            </p>
            <Link
              to="/nominate"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-semibold hover:opacity-90 transition-opacity text-lg"
            >
              Nominate Someone <ArrowRight size={20} />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
