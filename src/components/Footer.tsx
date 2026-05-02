import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border py-14">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-display text-xl text-foreground mb-3">Now We See You</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              A student-led project celebrating the hidden heroes who keep our school community running every day.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base text-foreground mb-3">Navigate</h4>
            <div className="flex flex-col gap-1.5">
              {[
                { to: "/", label: "Home" },
                { to: "/gallery", label: "Galleries" },
                { to: "/about", label: "Our Story" },
                { to: "/nominate", label: "Nominate" },
                { to: "/privacy", label: "Privacy & Ethics" },
              ].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="text-sm text-muted-foreground hover:text-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-base text-foreground mb-3">Get Involved</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Know someone who deserves recognition? Nominate them or participate in the project.
            </p>
            <Link
              to="/nominate"
              className="inline-block bg-secondary text-secondary-foreground px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Nominate Someone
            </Link>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Now We See You. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/admin/login" className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              Admin
            </Link>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Made with <Heart size={12} className="text-accent" /> at LWHS
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
