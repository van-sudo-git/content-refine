import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageViewTracker from "./components/PageViewTracker.tsx";

const Index = lazy(() => import("./pages/Index.tsx"));
const Galleries = lazy(() => import("./pages/Galleries.tsx"));
const Gallery = lazy(() => import("./pages/Gallery.tsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const WhyItMatters = lazy(() => import("./pages/WhyItMatters.tsx"));
const Media = lazy(() => import("./pages/Media.tsx"));
const Nominate = lazy(() => import("./pages/Nominate.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const AdminLogin = lazy(() => import("./pages/AdminLogin.tsx"));
const ClubDashboard = lazy(() => import("./pages/ClubDashboard.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const ProfileConsent = lazy(() => import("./pages/ProfileConsent"));
const AdminProfilePreview = lazy(() => import("./pages/AdminProfilePreview"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[70vh] flex items-center justify-center pt-[73px]">
    <p className="text-muted-foreground">Loading...</p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageViewTracker />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />

            {/* Old gallery links now go to the chapter directory. */}
            <Route path="/gallery" element={<Navigate to="/galleries" replace />} />
            <Route path="/galleries" element={<Galleries />} />
            <Route path="/galleries/:schoolSlug" element={<Gallery />} />

            {/* Individual profile URLs stay unchanged so QR codes keep working. */}
            <Route path="/gallery/:slug" element={<ProfilePage />} />

            <Route path="/consent/:token" element={<ProfileConsent />} />
            <Route path="/about" element={<About />} />
            <Route path="/why-it-matters" element={<WhyItMatters />} />
            <Route path="/media" element={<Media />} />
            <Route path="/nominate" element={<Nominate />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/profiles/:profileId/preview"
              element={<AdminProfilePreview />}
            />
            <Route path="/club" element={<ClubDashboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
