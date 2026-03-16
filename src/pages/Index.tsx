import { Link } from "react-router-dom";
import { ArrowRight, Eye, Heart, BarChart3, Users, QrCode, Shield } from "lucide-react";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import heroCommunity from "@/assets/hero-community.jpg";

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-primary/90" />
        <div className="absolute inset-0 opacity-20">
          <img src={heroCommunity} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-3xl">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-secondary font-medium mb-4 text-lg"
            >
              A Student-Led Project
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display text-5xl md:text-7xl text-primary-foreground mb-6 leading-tight"
            >
              Now We See You
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-primary-foreground/80 text-lg md:text-xl mb-10 leading-relaxed max-w-2xl"
            >
              Celebrating the hidden heroes who keep our school community running every day. Through portraits and stories—shared with consent—we're building a culture where appreciation is visible, specific, and ongoing.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-7 py-3.5 rounded-lg font-medium hover:opacity-90 transition-opacity text-base"
              >
                Explore the Stories <ArrowRight size={18} />
              </Link>
              <Link
                to="/nominate"
                className="inline-flex items-center gap-2 border border-primary-foreground/30 text-primary-foreground px-7 py-3.5 rounded-lg font-medium hover:bg-primary-foreground/10 transition-colors text-base"
              >
                Nominate Someone
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-medium mb-2">Simple & Respectful</p>
              <h2 className="font-display text-4xl md:text-5xl text-foreground">How It Works</h2>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: Users,
                step: "01",
                title: "Invite",
                description: "We invite staff to participate. Participation is always optional—anyone can say no, no questions asked.",
              },
              {
                icon: Shield,
                step: "02",
                title: "Consent",
                description: "We publish only what each person consents to share. They choose their level of visibility.",
              },
              {
                icon: QrCode,
                step: "03",
                title: "Connect",
                description: "QR codes link to personal story pages so anyone can learn about and thank these unsung heroes.",
              },
            ].map((item, i) => (
              <AnimatedSection key={item.step} delay={i * 0.15}>
                <div className="bg-card rounded-2xl p-8 text-center border border-border hover:shadow-lg transition-shadow">
                  <div className="w-14 h-14 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto mb-5">
                    <item.icon size={24} className="text-secondary" />
                  </div>
                  <span className="text-sm font-medium text-secondary">{item.step}</span>
                  <h3 className="font-display text-2xl text-foreground mt-1 mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Story */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            <AnimatedSection>
              <div className="aspect-[4/5] bg-muted rounded-2xl overflow-hidden">
                <img
                  src="https://lh3.googleusercontent.com/sitesv/APaQ0SR_o5P6BmZrLt1Mc9_rHh8jOd2A7T3hlHYnO9CwpdOKkwYs3Q2i-hGf9E-9NV3VsRSk6OFy6Ton4MXkFJ0eMItbFVCDVQI3b2oYyJLmB3kyLLAcxe2lRyzQiWPf0YkG2jtjqNJZK4nyTQayc-lU3Gh5PB5C5mJbxD8H4kwPJ-dRddvHszUqjUGC4qxkjPX81UOl3yGFgkB0Iv9SUTKaNgs1vTKBJ9Gn8Shxul8=w1280"
                  alt="Brad Fisher, Custodian at LWHS"
                  className="w-full h-full object-cover"
                />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="text-secondary font-medium mb-2">Featured Story</p>
              <h2 className="font-display text-4xl text-foreground mb-2">Keeping the School Running</h2>
              <h3 className="font-display text-2xl text-muted-foreground mb-6">Brad Fisher, Custodian</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Brad has been a custodian at Lake Washington High School since 2018. For him, the job isn't just about cleaning or maintenance—it's about helping people and solving problems.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                His main responsibility is making sure the school remains clean, safe, and welcoming for everyone who learns and works there.
              </p>
              <blockquote className="border-l-4 border-secondary pl-5 my-8">
                <p className="font-display text-xl text-foreground italic">
                  "Be flexible. Try to understand people. Everyone is different."
                </p>
              </blockquote>
              <Link
                to="/gallery"
                className="inline-flex items-center gap-2 text-secondary font-medium hover:underline"
              >
                View all stories <ArrowRight size={16} />
              </Link>
            </AnimatedSection>
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
              { icon: Heart, title: "Appreciate", desc: "Leave a thank-you note to show gratitude for their everyday contributions." },
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
            <p className="text-primary-foreground/70 text-lg mb-10 max-w-xl mx-auto">
              Nominate a staff member who deserves to be seen and celebrated. Participation is always voluntary and consent-based.
            </p>
            <Link
              to="/nominate"
              className="inline-flex items-center gap-2 bg-secondary text-secondary-foreground px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-opacity text-lg"
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
