import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-display text-2xl mb-4">Now We See You</h3>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              A student-led project celebrating the hidden heroes who keep our school community running every day.
            </p>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Navigate</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: "/", label: "Home" },
                { to: "/gallery", label: "Gallery" },
                { to: "/about", label: "Who Am I" },
                { to: "/nominate", label: "Nominate" },
                { to: "/privacy", label: "Privacy & Ethics" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-primary-foreground/70 hover:text-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-lg mb-4">Get Involved</h4>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Know someone who deserves recognition? Nominate them or participate in the project.
            </p>
            <Link
              to="/nominate"
              className="inline-block bg-secondary text-secondary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Nominate Someone
            </Link>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} Now We See You. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/50 flex items-center gap-1">
            Made with <Heart size={14} className="text-secondary" /> at LWHS
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
