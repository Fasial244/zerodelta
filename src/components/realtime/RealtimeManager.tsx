import { useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// 1. Define keys outside to prevent recreation
// Added 'individual' based on your diff
const LEADERBOARD_QUERY_KEYS = [["leaderboard"], ["leaderboard", "individual"]];

export function RealtimeManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 2. Memoized invalidation function
  const invalidateLeaderboardQueries = useCallback(() => {
    LEADERBOARD_QUERY_KEYS.forEach((queryKey) => {
      // "exact: true" = strict matching
      // "type: active" = only refetch if component is mounted/visible
      queryClient.invalidateQueries({ queryKey, exact: true, type: "active" });
    });
  }, [queryClient]);

  useEffect(() => {
    console.log("🔌 Initializing Realtime Manager...");

    // --- Channel 1: Solves ---
    const solvesChannel = supabase
      .channel("realtime-solves")
      .on("postgres_changes", { event: "*", schema: "public", table: "solves" }, (payload) => {
        console.log("[Realtime] Solves changed:", payload.eventType);
        invalidateLeaderboardQueries(); // Uses your new optimized function
        // We generally keep challenges invalidation loose (no exact/active)
        // because we want that data ready immediately
        queryClient.invalidateQueries({ queryKey: ["challenges"] });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      })
      .subscribe();

    // --- Channel 2: Challenges ---
    const challengesChannel = supabase
      .channel("realtime-challenges")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, (payload) => {
        console.log("[Realtime] Challenges changed:", payload.eventType);
        queryClient.invalidateQueries({ queryKey: ["challenges"] });
      })
      .subscribe();

    // --- Channel 3: Settings ---
    const settingsChannel = supabase
      .channel("realtime-settings")
      .on("postgres_changes", { event: "*", schema: "public", table: "system_settings" }, () => {
        console.log("[Realtime] Settings changed");
        queryClient.invalidateQueries({ queryKey: ["settings"] });
      })
      .subscribe();

    // --- Channel 4: Activity / Logs ---
    // (Reconstructed from context as it was hidden in the diff)
    const activityChannel = supabase
      .channel("realtime-activity")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_logs" }, (payload) => {
        const newActivity = payload.new as any;

        if (newActivity.event_type === "first_blood") {
          toast({
            title: "🩸 FIRST BLOOD",
            description: newActivity.message,
            variant: "destructive",
            duration: 10000,
          });
        } else if (newActivity.event_type === "announcement") {
          toast({
            title: "📢 ANNOUNCEMENT",
            description: newActivity.message,
            duration: 10000,
          });
        }

        queryClient.invalidateQueries({ queryKey: ["activity"] });
      })
      .subscribe();

    // --- Channel 5: Profiles ---
    const profilesChannel = supabase
      .channel("realtime-profiles")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        console.log("[Realtime] Profiles changed:", payload.eventType);
        invalidateLeaderboardQueries(); // Optimized
        queryClient.invalidateQueries({ queryKey: ["all-users"] });
      })
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(solvesChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [invalidateLeaderboardQueries, queryClient, toast]);

  return null;
}
