import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * Fires a page_view RPC on every route change.
 * Uses the pathname as the "slug" so non-profile pages (home, gallery, about…)
 * are also tracked. Admin routes are excluded so dashboard activity doesn't
 * inflate analytics.
 */
const PageViewTracker = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const profileMatch = pathname.match(/^\/gallery\/([^/]+)$/);
    const slug = profileMatch
      ? decodeURIComponent(profileMatch[1])
      : pathname === "/"
        ? "home"
        : pathname.replace(/^\//, "").replace(/\//g, ":");

    void supabase.rpc("increment_page_view", {
      p_slug: slug,
      p_day: new Date().toISOString().slice(0, 10),
    });
  }, [pathname]);

  return null;
};

export default PageViewTracker;
