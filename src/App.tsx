import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { SoundProvider } from "@/components/effects/SoundManager";
import { CelebrationOverlay } from "@/components/effects/CelebrationOverlay";
import { RealtimeManager } from "@/components/realtime/RealtimeManager";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Challenges from "./pages/Challenges";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import Activity from "./pages/Activity";
import Authors from "./pages/Authors";
import Scoreboard from "./pages/Scoreboard";
import NotFound from "./pages/NotFound";
import { MaintenanceWrapper } from "./components/MaintenanceWrapper";

// CONFIGURE REAL-TIME BEHAVIOR
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Treat data as stale immediately. This forces a refetch on every component mount
      // or window focus, ensuring users always see the latest data.
      staleTime: 0,
      // Refetch when the user returns to the tab
      refetchOnWindowFocus: true,
      // Retry failed requests (e.g. temporary network blip)
      retry: 1,
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
            {/* Global Realtime Manager subscribes to DB changes */}
            <RealtimeManager />
            <Routes>
              {/* Scoreboard is always public and distinct */}
              <Route path="/scoreboard" element={<Scoreboard />} />

              <Route
                path="*"
                element={
                  <MaintenanceWrapper>
                    <CelebrationOverlay />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/challenges" element={<Challenges />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/activity" element={<Activity />} />
                      <Route path="/authors" element={<Authors />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MaintenanceWrapper>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </SoundProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
