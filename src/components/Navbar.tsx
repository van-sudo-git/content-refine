import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Shield, ChevronDown, LogIn, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/use-auth-ready";
import { schoolGalleryPath } from "@/lib/schoolGallery";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/nominate", label: "Nominate" },
  { to: "/about", label: "Our Story" },
  { to: "/media", label: "In the Community" },
  { to: "/privacy", label: "Privacy & Ethics" },
];

interface GalleryChapter {
  id: string;
  name: string;
}

type DashboardDestination = "/admin" | "/club" | null;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [dashboardDestination, setDashboardDestination] = useState<DashboardDestination>(null);
  const [galleryChapters, setGalleryChapters] = useState<GalleryChapter[]>([]);
  const location = useLocation();
  const { user, isReady } = useAuthReady();

  useEffect(() => {
    let cancelled = false;

    const loadGalleryChapters = async () => {
      // New schools appear automatically once they have a published profile.
      const { data: publishedProfiles } = await supabase
        .from("profiles")
        .select("school_id")
        .eq("status", "published");

      if (cancelled || !publishedProfiles) return;

      const schoolIds = Array.from(
        new Set(
          publishedProfiles
            .map((profile) => profile.school_id)
            .filter((id): id is string => Boolean(id))
        )
      );

      if (schoolIds.length === 0) {
        setGalleryChapters([]);
        return;
      }

      const { data: schools } = await supabase
        .from("schools")
        .select("id, name")
        .in("id", schoolIds)
        .order("name");

      if (cancelled || !schools) return;

      setGalleryChapters(schools as GalleryChapter[]);
    };

    loadGalleryChapters();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
  
    const authEmail = user?.email?.toLowerCase() ?? null;
    const userId = user?.id ?? null;
  
    if (!isReady) {
      return () => {
        cancelled = true;
      };
    }
  
    if (!authEmail || !userId) {
      setDashboardDestination(null);
      return;
    }
  
    const resolveDashboard = async () => {
      // Keep the same priority as the login page:
      // school admin -> Admin
      // creative club role -> Club
      // PR role -> Admin
      const { data: adminRow } = await supabase
        .from("school_admins")
        .select("id")
        .eq("email", authEmail)
        .limit(1)
        .maybeSingle();
  
      if (cancelled) return;
  
      if (adminRow) {
        setDashboardDestination("/admin");
        return;
      }
  
      const { data: roleRows } = await supabase
        .from("club_roles")
        .select("role")
        .eq("user_id", userId);
  
      if (cancelled) return;
  
      const roles = (roleRows ?? []).map((row) => row.role);
  
      const isCreative = roles.some(
        (role) =>
          role === "journalist" ||
          role === "photographer" ||
          role === "artist"
      );
  
      const isPr = roles.includes("pr");
  
      if (isCreative) {
        setDashboardDestination("/club");
      } else if (isPr) {
        setDashboardDestination("/admin");
      } else {
        setDashboardDestination(null);
      }
    };
  
    resolveDashboard();
  
    return () => {
      cancelled = true;
    };
  }, [isReady, user]);

  const galleriesActive =
    location.pathname.startsWith("/galleries") ||
    location.pathname.startsWith("/gallery");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-display text-xl text-foreground tracking-tight"
        >
          Now We See You
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <div className="relative group">
            <Link
              to="/galleries"
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-secondary ${
                galleriesActive ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              Galleries{" "}
              <ChevronDown
                size={14}
                className="opacity-60 group-hover:opacity-100 transition-opacity"
              />
            </Link>

            <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
              <div className="min-w-[260px] bg-background border border-border rounded-xl shadow-lg py-2">
                {galleryChapters.length > 0 ? (
                  galleryChapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      to={schoolGalleryPath(chapter.name)}
                      className="block px-4 py-2 text-sm text-muted-foreground hover:text-secondary hover:bg-muted/50 transition-colors"
                    >
                      {chapter.name}
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-muted-foreground">
                    Galleries are being prepared
                  </div>
                )}

                <Link
                  to="/galleries"
                  className="block px-4 py-2 text-[11px] text-muted-foreground hover:text-secondary border-t border-border mt-1 pt-2"
                >
                  View all chapters
                </Link>
              </div>
            </div>
          </div>

          {navLinks.map((link) => (
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

          {!user && (
            <Link
              to="/admin/login"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                location.pathname === "/admin/login"
                  ? "border-secondary text-secondary"
                  : "border-border text-muted-foreground hover:border-secondary hover:text-secondary"
              }`}
            >
              <LogIn size={14} /> Club &amp; Admin Login
            </Link>
          )}

          {dashboardDestination && (
            <Link
              to={dashboardDestination}
              className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-secondary ${
                location.pathname.startsWith(dashboardDestination)
                  ? "text-secondary"
                  : "text-muted-foreground"
              }`}
            >
              {dashboardDestination === "/admin" ? (
                <>
                  <Shield size={14} /> Admin
                </>
              ) : (
                <>
                  <Users size={14} /> Club
                </>
              )}
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
              <div>
                <Link
                  to="/galleries"
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium transition-colors ${
                    galleriesActive ? "text-secondary" : "text-muted-foreground"
                  }`}
                >
                  Galleries
                </Link>

                {galleryChapters.length > 0 && (
                  <div className="pl-4 mt-2 flex flex-col gap-2">
                    {galleryChapters.map((chapter) => (
                      <Link
                        key={chapter.id}
                        to={schoolGalleryPath(chapter.name)}
                        onClick={() => setIsOpen(false)}
                        className="text-sm text-muted-foreground"
                      >
                        {chapter.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

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

              {!user && (
                <Link
                  to="/admin/login"
                  onClick={() => setIsOpen(false)}
                  className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-base font-medium transition-colors ${
                    location.pathname === "/admin/login"
                      ? "border-secondary text-secondary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <LogIn size={16} /> Club &amp; Admin Login
                </Link>
              )}

              {dashboardDestination && (
                <Link
                  to={dashboardDestination}
                  onClick={() => setIsOpen(false)}
                  className={`inline-flex items-center gap-1.5 text-base font-medium transition-colors ${
                    location.pathname.startsWith(dashboardDestination)
                      ? "text-secondary"
                      : "text-muted-foreground"
                  }`}
                >
                  {dashboardDestination === "/admin" ? (
                    <>
                      <Shield size={16} /> Admin Dashboard
                    </>
                  ) : (
                    <>
                      <Users size={16} /> Club Dashboard
                    </>
                  )}
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