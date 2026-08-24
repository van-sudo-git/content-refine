import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Galleries from "./pages/Galleries.tsx";
import Gallery from "./pages/Gallery.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import About from "./pages/About.tsx";
import Media from "./pages/Media.tsx";
import Nominate from "./pages/Nominate.tsx";
import Privacy from "./pages/Privacy.tsx";
import Admin from "./pages/Admin.tsx";
import AdminLogin from "./pages/AdminLogin.tsx";
import ClubDashboard from "./pages/ClubDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import PageViewTracker from "./components/PageViewTracker.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageViewTracker />
        <Routes>
          <Route path="/" element={<Index />} />

          {/* Old gallery links now go to the chapter directory. */}
          <Route path="/gallery" element={<Navigate to="/galleries" replace />} />
          <Route path="/galleries" element={<Galleries />} />
          <Route path="/galleries/:schoolSlug" element={<Gallery />} />

          {/* Individual profile URLs stay unchanged so QR codes keep working. */}
          <Route path="/gallery/:slug" element={<ProfilePage />} />

          <Route path="/about" element={<About />} />
          <Route path="/media" element={<Media />} />
          <Route path="/nominate" element={<Nominate />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/club" element={<ClubDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;