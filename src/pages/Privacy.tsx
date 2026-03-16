import { Shield, Eye, Lock, MessageCircle, BarChart3, Gift, HelpCircle, UserCheck, FileText } from "lucide-react";
import Layout from "@/components/Layout";
import AnimatedSection from "@/components/AnimatedSection";

const sections = [
  {
    icon: FileText,
    title: "1. Purpose",
    content: "This project highlights the people who help make our school run every day—often behind the scenes. The goal is to build appreciation and understanding, and to learn how respectful storytelling and technology can strengthen community.",
  },
  {
    icon: UserCheck,
    title: "2. Participation is 100% Optional",
    content: null,
    list: [
      "Participation is voluntary.",
      "Anyone can say no for any reason.",
      "Saying no will be respected without questions.",
    ],
  },
  {
    icon: Eye,
    title: "3. What Participation Involves",
    content: "If someone chooses to participate, it may include:",
    list: [
      "A short interview (5–10 minutes)",
      "A hand-drawn portrait (optional)",
      'A short "story card" with a few questions (optional)',
      "A QR code that links to a page (only if they consent)",
    ],
  },
  {
    icon: Shield,
    title: "4. Consent Options",
    content: "Each participant can choose one of these options:",
    list: [
      'Option A — First name + role (e.g., "Maria, Librarian")',
      'Option B — Role only (e.g., "School Librarian")',
      "Option C — No web page (portrait can still be shown privately/offline)",
      "Option D — Anonymous (no identifiable details)",
      "Option E — No photo/portrait online (text-only page)",
    ],
    extra: [
      "Whether their portrait is shown publicly",
      "Whether a QR code is printed/displayed",
      "Whether the page is listed publicly or only accessible via QR",
    ],
  },
  {
    icon: Lock,
    title: "5. Right to Review and Withdraw",
    content: null,
    list: [
      "Participants can review their page before it is published.",
      "Participants can request edits or removal at any time.",
      "If a page is removed, the QR link will be disabled.",
    ],
  },
  {
    icon: MessageCircle,
    title: "6. Privacy, Respect & Safety Rules",
    content: "This project follows these rules:",
    list: [
      "No private information (home address, phone number, personal schedules, etc.)",
      "No sensitive personal topics unless the participant explicitly requests it",
      "No student gossip or negative content",
      "No pressure to share personal stories",
      "No recording without explicit permission",
      "No publishing without consent",
    ],
  },
  {
    icon: BarChart3,
    title: "7. Data and Analytics",
    content: "To understand reach and improve the project, the site may collect basic visit counts such as how many times a QR code was scanned or a page was viewed. We do not try to identify individual visitors. We do not sell or share data.",
  },
  {
    icon: Gift,
    title: "8. Appreciation and Gifts",
    content: "If we include an option for community appreciation (e.g., gift cards), it will be:",
    list: [
      "Optional for donors and participants",
      "Transparent about how funds are used",
      "Not tied to participation (no one is paid to be featured)",
      "Handled with school guidance (or disabled if not allowed)",
    ],
  },
  {
    icon: HelpCircle,
    title: "9. Questions or Concerns",
    content: "If you have questions, feedback, or concerns about the project, please reach out to the project team through the school.",
  },
];

const Privacy = () => {
  return (
    <Layout>
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <AnimatedSection>
              <p className="text-secondary font-medium mb-2">Trust & Transparency</p>
              <h1 className="font-display text-5xl md:text-6xl text-foreground mb-6">Privacy, Consent & Ethics</h1>
              <p className="text-muted-foreground text-lg mb-16 leading-relaxed">
                Every aspect of this project is built on respect, consent, and transparency. Here's exactly how we handle participation and data.
              </p>
            </AnimatedSection>

            <div className="space-y-10">
              {sections.map((section, i) => (
                <AnimatedSection key={i} delay={i * 0.05}>
                  <div className="bg-card rounded-2xl border border-border p-8">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                        <section.icon size={20} className="text-secondary" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl text-foreground mb-3">{section.title}</h3>
                        {section.content && (
                          <p className="text-muted-foreground leading-relaxed mb-3">{section.content}</p>
                        )}
                        {section.list && (
                          <ul className="space-y-2 text-muted-foreground">
                            {section.list.map((item, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span className="text-secondary mt-1.5">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.extra && (
                          <div className="mt-4">
                            <p className="text-muted-foreground mb-2">Participants can also choose:</p>
                            <ul className="space-y-2 text-muted-foreground">
                              {section.extra.map((item, j) => (
                                <li key={j} className="flex items-start gap-2">
                                  <span className="text-secondary mt-1.5">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Privacy;
