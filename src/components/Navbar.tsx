import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/use-auth-ready";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/gallery", label: "Galleries" },
  { to: "/about", label: "Our Story" },
  { to: "/nominate", label: "Nominate" },
  { to: "/privacy", label: "Privacy & Ethics" },
];

const desktopNavLinks = navLinks.filter((link) => link.to !== "/about" && link.to !== "/gallery");

const galleryChapters = [
  { to: "/gallery", label: "LWHS, Inaugural Chapter" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const { user, isReady } = useAuthReady();

  useEffect(() => {
    let cancelled = false;
    const authEmail = user?.email?.toLowerCase() ?? null;

    if (!isReady) {
      return () => {
        cancelled = true;
      };
    }

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
  }, [isReady, user]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-display text-xl text-foreground tracking-tight">
          Now We See You
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {/* Galleries dropdown */}
          <div className="relative group">
            <Link
              to="/gallery"
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-secondary ${
                location.pathname.startsWith("/gallery") ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              Galleries <ChevronDown size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
            </Link>
            <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <div className="min-w-[220px] bg-background border border-border rounded-xl shadow-lg py-2">
                {galleryChapters.map((c) => (
                  <Link
                    key={c.to}
                    to={c.to}
                    className="block px-4 py-2 text-sm text-muted-foreground hover:text-secondary hover:bg-muted/50 transition-colors"
                  >
                    {c.label}
                  </Link>
                ))}
                <div className="px-4 py-2 text-[11px] text-muted-foreground italic border-t border-border mt-1 pt-2">
                  More chapters coming soon
                </div>
              </div>
            </div>
          </div>
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
