import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useRef } from 'react';
import { useSound } from '@/components/effects/SoundManager';
import { useAuth } from '@/hooks/useAuth';
import { useCompetitions } from '@/hooks/useCompetitions';

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
  const { activeCompetition } = useCompetitions();
  const queryClient = useQueryClient();
  const prevTopPlayer = useRef<string | null>(null);
  const prevTop3 = useRef<Set<string>>(new Set());

  const individualQuery = useQuery({
    queryKey: ['leaderboard', 'individual', activeCompetition?.id],
    queryFn: async () => {
      // If there's no active competition, return empty array
      if (!activeCompetition?.id) {
        return [];
      }

      // Get users registered for the active competition (approved only)
      const { data: registrations, error: regError } = await supabase
        .from('competition_registrations')
        .select('user_id')
        .eq('competition_id', activeCompetition.id)
        .eq('status', 'approved');

      if (regError) throw regError;

      const registeredUserIds = registrations?.map(r => r.user_id) || [];

      if (registeredUserIds.length === 0) {
        return [];
      }

      // Get profiles for registered users only
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, created_at')
        .in('id', registeredUserIds)
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;

      // Get all solves for registered users
      const { data: solves, error: solvesError } = await supabase
        .from('solves')
        .select('user_id, points_awarded, is_first_blood')
        .in('user_id', registeredUserIds);

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
    enabled: !!activeCompetition?.id,
    refetchInterval: 3000, // Poll every 3 seconds
    staleTime: 0,
  });

  // Subscribe to realtime updates for immediate refresh
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'solves' }, () => {
        // Force immediate refetch when a new solve is inserted
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        individualQuery.refetch();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'solves' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        individualQuery.refetch();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'solves' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        individualQuery.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        individualQuery.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'competition_registrations' }, () => {
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        individualQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [individualQuery, queryClient]);

  return {
    individual: individualQuery.data || [],
    isLoading: individualQuery.isLoading,
    competitionId: activeCompetition?.id,
  };
}
