import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "Who Am I" },
  { to: "/nominate", label: "Nominate" },
  { to: "/privacy", label: "Privacy & Ethics" },
];

const desktopNavLinks = navLinks.filter((link) => link.to !== "/about");

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setAuthEmail(session?.user?.email?.toLowerCase() ?? null);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextEmail = session?.user?.email?.toLowerCase() ?? null;
      window.setTimeout(() => {
        if (!cancelled) setAuthEmail(nextEmail);
      }, 0);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!authEmail) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      const { data } = await supabase.rpc("is_any_school_admin", { _email: authEmail });
      if (!cancelled) setIsAdmin(!!data);
    };

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [authEmail]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl text-foreground tracking-tight">
          Now We See You
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {desktopNavLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm font-medium transition-colors hover:text-secondary ${
                location.pathname === link.to
                  ? "text-secondary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-secondary ${
                location.pathname === "/admin" ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              <Shield size={14} /> Admin
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium transition-colors ${
                    location.pathname === link.to
                      ? "text-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsOpen(false)}
                  className={`inline-flex items-center gap-1.5 text-base font-medium transition-colors ${
                    location.pathname === "/admin" ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  <Shield size={16} /> Admin Dashboard
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
