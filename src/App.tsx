import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SoundProvider } from "@/components/effects/SoundManager";
import { CelebrationOverlay } from "@/components/effects/CelebrationOverlay";
import { RealtimeManager } from "@/components/realtime/RealtimeManager";
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";

// Critical pages loaded immediately
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Lazy load heavy pages to reduce initial bundle size
const Challenges = lazy(() => import("./pages/Challenges"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Admin = lazy(() => import("./pages/Admin"));
const Profile = lazy(() => import("./pages/Profile"));
const Activity = lazy(() => import("./pages/Activity"));
const Authors = lazy(() => import("./pages/Authors"));
const Scoreboard = lazy(() => import("./pages/Scoreboard"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-muted-foreground font-mono">LOADING...</p>
      </div>
    </div>
  );
}

// React Query setup with enhanced real-time configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0, // Always consider data stale for real-time freshness
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SoundProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            {/* Global Realtime Manager for live updates */}
            <RealtimeManager />
            {/* Public routes outside MaintenanceWrapper */}
            <Routes>
              <Route path="/scoreboard" element={
                <Suspense fallback={<PageLoader />}>
                  <Scoreboard />
                </Suspense>
              } />
              <Route path="/authors" element={
                <Suspense fallback={<PageLoader />}>
                  <Authors />
                </Suspense>
              } />
              <Route path="*" element={
                <MaintenanceWrapper>
                  <CelebrationOverlay />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/challenges" element={
                      <Suspense fallback={<PageLoader />}>
                        <Challenges />
                      </Suspense>
                    } />
                    <Route path="/leaderboard" element={
                      <Suspense fallback={<PageLoader />}>
                        <Leaderboard />
                      </Suspense>
                    } />
                    <Route path="/admin" element={
                      <Suspense fallback={<PageLoader />}>
                        <Admin />
                      </Suspense>
                    } />
                    <Route path="/profile" element={
                      <Suspense fallback={<PageLoader />}>
                        <Profile />
                      </Suspense>
                    } />
                    <Route path="/activity" element={
                      <Suspense fallback={<PageLoader />}>
                        <Activity />
                      </Suspense>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </MaintenanceWrapper>
              } />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;