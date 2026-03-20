import { Link } from "react-router-dom";
import { ArrowRight, Eye, Heart, BarChart3, Users, QrCode, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import bradPortrait from "@/assets/brad-portrait.jpeg";
import evaanPortrait from "@/assets/evaan-portrait.jpeg";

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-20">
        {/* Soft gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-lavender/40 to-background" />
        <div className="absolute top-20 right-[10%] w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-20 left-[5%] w-96 h-96 rounded-full bg-accent/8 blur-3xl" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Text — centered */}
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
              We see the people who keep our school running every day — through hand-drawn portraits, real stories, and the power of human connection.
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

          {/* Portraits — side by side, same size, below hero text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-2 gap-6 max-w-2xl mx-auto mt-14"
          >
            <Link to="/gallery/brad-fisher" className="group block">
              <div className="aspect-[3/4] bg-card rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow">
                <img src={bradPortrait} alt="Brad Fisher — hand-drawn portrait" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
              <h3 className="font-display text-lg text-foreground mt-3">Brad Fisher</h3>
              <p className="text-muted-foreground text-xs">Head Custodian, LWHS — since 2018</p>
            </Link>
            <Link to="/about" className="group block">
              <div className="aspect-[3/4] bg-card rounded-2xl overflow-hidden border border-border shadow-sm group-hover:shadow-md transition-shadow">
                <img src={evaanPortrait} alt="Evaan Ahlawat — self-portrait" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
              </div>
              <h3 className="font-display text-lg text-foreground mt-3">Evaan Ahlawat</h3>
              <p className="text-muted-foreground text-xs">Artist & Creator</p>
            </Link>
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
                description: "Staff are invited to participate. It's always optional — anyone can say no.",
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
