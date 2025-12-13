import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PublicLeaderboardEntry {
  player_id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  solve_count: number;
  first_bloods: number;
  created_at: string;
}

interface ScoreboardStats {
  user_count: number;
  competition_name: string | null;
}

export function usePublicLeaderboard() {
  const leaderboardQuery = useQuery({
    queryKey: ['public-leaderboard'],
    queryFn: async () => {
      // Query the public view that doesn't require auth
      const { data, error } = await supabase
        .from('leaderboard_public')
        .select('*');

      if (error) {
        console.error('Error fetching public leaderboard:', error);
        throw error;
      }

      // Transform to match expected interface (id instead of player_id)
      return (data || []).map((entry: PublicLeaderboardEntry) => ({
        id: entry.player_id,
        username: entry.username,
        avatar_url: entry.avatar_url,
        total_points: entry.total_points,
        solve_count: entry.solve_count,
        first_bloods: entry.first_bloods,
        created_at: entry.created_at,
      }));
    },
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 0,
  });

  const statsQuery = useQuery({
    queryKey: ['public-scoreboard-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scoreboard_stats_public')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching scoreboard stats:', error);
        return { user_count: 0, competition_name: null } as ScoreboardStats;
      }

      return data as ScoreboardStats;
    },
    refetchInterval: 10000, // Poll stats every 10 seconds
    staleTime: 0,
  });

  return {
    individual: leaderboardQuery.data || [],
    isLoading: leaderboardQuery.isLoading,
    stats: statsQuery.data || { user_count: 0, competition_name: null },
  };
}
