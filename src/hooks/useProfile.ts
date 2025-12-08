import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SolveHistoryItem {
  id: string;
  challenge_id: string;
  challenge_title: string;
  challenge_category: string;
  points_awarded: number;
  is_first_blood: boolean;
  created_at: string;
}

interface ProfileStats {
  total_points: number;
  solve_count: number;
  first_bloods: number;
  rank: number;
}

export function useProfile(userId?: string) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;

  const statsQuery = useQuery({
    queryKey: ['profile-stats', targetUserId],
    queryFn: async (): Promise<ProfileStats> => {
      if (!targetUserId) throw new Error('No user ID');

      // Get user's solves
      const { data: solves, error: solvesError } = await supabase
        .from('solves')
        .select('points_awarded, is_first_blood')
        .eq('user_id', targetUserId);

      if (solvesError) throw solvesError;

      const total_points = solves?.reduce((sum, s) => sum + s.points_awarded, 0) || 0;
      const solve_count = solves?.length || 0;
      const first_bloods = solves?.filter(s => s.is_first_blood).length || 0;

      // Get rank by comparing to all users
      const { data: allSolves, error: allSolvesError } = await supabase
        .from('solves')
        .select('user_id, points_awarded');

      if (allSolvesError) throw allSolvesError;

      // Aggregate by user
      const userScores = new Map<string, number>();
      allSolves?.forEach((solve) => {
        const current = userScores.get(solve.user_id) || 0;
        userScores.set(solve.user_id, current + solve.points_awarded);
      });

      // Sort and find rank
      const sortedScores = Array.from(userScores.entries())
        .sort((a, b) => b[1] - a[1]);
      const rank = sortedScores.findIndex(([uid]) => uid === targetUserId) + 1;

      return {
        total_points,
        solve_count,
        first_bloods,
        rank: rank || 0,
      };
    },
    enabled: !!targetUserId,
  });

  const solveHistoryQuery = useQuery({
    queryKey: ['solve-history', targetUserId],
    queryFn: async (): Promise<SolveHistoryItem[]> => {
      if (!targetUserId) throw new Error('No user ID');

      // Get solves with challenge info
      const { data: solves, error } = await supabase
        .from('solves')
        .select(`
          id,
          challenge_id,
          points_awarded,
          is_first_blood,
          created_at
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get challenge details from public view
      const challengeIds = solves?.map(s => s.challenge_id) || [];
      if (challengeIds.length === 0) return [];

      const { data: challenges, error: challengesError } = await supabase
        .from('challenges_public')
        .select('id, title, category')
        .in('id', challengeIds);

      if (challengesError) throw challengesError;

      const challengeMap = new Map(challenges?.map(c => [c.id, c]));

      return solves?.map(solve => {
        const challenge = challengeMap.get(solve.challenge_id);
        return {
          id: solve.id,
          challenge_id: solve.challenge_id,
          challenge_title: challenge?.title || 'Unknown',
          challenge_category: challenge?.category || 'Other',
          points_awarded: solve.points_awarded,
          is_first_blood: solve.is_first_blood,
          created_at: solve.created_at,
        };
      }) || [];
    },
    enabled: !!targetUserId,
  });

  return {
    stats: statsQuery.data,
    solveHistory: solveHistoryQuery.data || [],
    isLoading: statsQuery.isLoading || solveHistoryQuery.isLoading,
  };
}
