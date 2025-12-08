import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import { useSound } from '@/components/effects/SoundManager';
import { useAuth } from '@/hooks/useAuth';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  solve_count: number;
  first_bloods: number;
  created_at: string;
}

export function useLeaderboard() {
  const { play } = useSound();
  const { user } = useAuth();
  const prevTopPlayer = useRef<string | null>(null);
  const prevTop3 = useRef<Set<string>>(new Set());

  const individualQuery = useQuery({
    queryKey: ['leaderboard', 'individual'],
    queryFn: async () => {
      // First, get ALL profiles (users who signed up during competition)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      // Then get all solves
      const { data: solves, error: solvesError } = await supabase
        .from('solves')
        .select('user_id, points_awarded, is_first_blood');

      if (solvesError) throw solvesError;

      // Aggregate solves by user
      const solveMap = new Map<string, { points: number; solveCount: number; firstBloods: number }>();
      
      solves?.forEach((solve) => {
        const existing = solveMap.get(solve.user_id) || { points: 0, solveCount: 0, firstBloods: 0 };
        existing.points += solve.points_awarded;
        existing.solveCount += 1;
        if (solve.is_first_blood) existing.firstBloods += 1;
        solveMap.set(solve.user_id, existing);
      });

      // Combine profiles with solve data
      const leaderboard: LeaderboardEntry[] = (profiles || []).map((profile) => {
        const stats = solveMap.get(profile.id) || { points: 0, solveCount: 0, firstBloods: 0 };
        return {
          id: profile.id,
          username: profile.username || 'Anonymous',
          avatar_url: profile.avatar_url,
          total_points: stats.points,
          solve_count: stats.solveCount,
          first_bloods: stats.firstBloods,
          created_at: profile.created_at,
        };
      });

      // Sort by points descending, then by signup date for ties
      const sortedData = leaderboard.sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        // Earlier signup wins ties
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      // Check for rank change and play sounds
      if (sortedData.length > 0) {
        const newTopPlayer = sortedData[0].id;
        const newTop3 = new Set(sortedData.slice(0, 3).map(p => p.id));
        
        // If the top player changed (and it's not the first load)
        if (prevTopPlayer.current && prevTopPlayer.current !== newTopPlayer) {
          if (newTopPlayer === user?.id) {
            // Current user just took 1st place
            play('rankup_top');
          } else {
            // Someone else took 1st place
            play('rankup');
          }
        }

        // Check if current user entered top 3
        if (user?.id && newTop3.has(user.id) && !prevTop3.current.has(user.id)) {
          play('unlock'); // Use unlock sound for top 3 entry
        }
        
        prevTopPlayer.current = newTopPlayer;
        prevTop3.current = newTop3;
      }

      return sortedData;
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solves' }, () => {
        individualQuery.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        individualQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    individual: individualQuery.data || [],
    isLoading: individualQuery.isLoading,
  };
}
