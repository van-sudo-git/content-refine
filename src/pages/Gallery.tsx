import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";
import bradPortrait from "@/assets/brad-portrait.jpeg";

const galleryItems = [
  {
    name: "Brad Fisher",
    role: "Custodian, LWHS",
    image: bradPortrait,
    slug: "brad-fisher",
  },
];

const Gallery = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-secondary font-semibold mb-2 tracking-wide uppercase text-sm">The People Behind the Scenes</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-4">Gallery</h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Meet the unsung heroes who keep our school running. Each portrait and story is shared with full consent.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {galleryItems.map((item, i) => (
              <AnimatedSection key={item.slug} delay={i * 0.1}>
                <Link to={`/gallery/${item.slug}`} className="group block">
                  <div className="aspect-[3/4] bg-muted rounded-2xl overflow-hidden mb-4 shadow-lg group-hover:shadow-xl transition-shadow">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-display text-xl text-foreground group-hover:text-secondary transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{item.role}</p>
                </Link>
              </AnimatedSection>
            ))}
          </div>

          {galleryItems.length === 1 && (
            <AnimatedSection delay={0.3}>
              <div className="text-center mt-16 p-12 bg-card rounded-2xl border border-border max-w-lg mx-auto">
                <p className="text-muted-foreground mb-4">More stories coming soon as staff choose to participate.</p>
                <Link
                  to="/nominate"
                  className="inline-flex items-center gap-2 text-secondary font-medium hover:underline"
                >
                  Nominate someone <ArrowRight size={16} />
                </Link>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Gallery;
