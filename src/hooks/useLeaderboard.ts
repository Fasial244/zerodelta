import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface LeaderboardEntry {
  id: string;
  username: string;
  avatar_url: string | null;
  total_points: number;
  solve_count: number;
  first_bloods: number;
  team_name: string | null;
}

interface TeamLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  member_count: number;
}

export function useLeaderboard() {
  const individualQuery = useQuery({
    queryKey: ['leaderboard', 'individual'],
    queryFn: async () => {
      // Get all solves with user profiles
      const { data: solves, error } = await supabase
        .from('solves')
        .select(`
          user_id,
          points_awarded,
          is_first_blood,
          profiles!solves_user_id_fkey (
            id,
            username,
            avatar_url,
            team_id,
            teams (name)
          )
        `);

      if (error) throw error;

      // Aggregate by user
      const userMap = new Map<string, LeaderboardEntry>();
      
      solves?.forEach((solve: any) => {
        const profile = solve.profiles;
        if (!profile) return;

        if (!userMap.has(solve.user_id)) {
          userMap.set(solve.user_id, {
            id: profile.id,
            username: profile.username || 'Anonymous',
            avatar_url: profile.avatar_url,
            total_points: 0,
            solve_count: 0,
            first_bloods: 0,
            team_name: profile.teams?.name || null,
          });
        }

        const entry = userMap.get(solve.user_id)!;
        entry.total_points += solve.points_awarded;
        entry.solve_count += 1;
        if (solve.is_first_blood) entry.first_bloods += 1;
      });

      return Array.from(userMap.values())
        .sort((a, b) => b.total_points - a.total_points);
    },
  });

  const teamQuery = useQuery({
    queryKey: ['leaderboard', 'team'],
    queryFn: async () => {
      const { data: teams, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          score,
          profiles (id)
        `)
        .gt('score', 0)
        .order('score', { ascending: false });

      if (error) throw error;

      return teams?.map((team: any) => ({
        id: team.id,
        name: team.name,
        score: team.score,
        member_count: team.profiles?.length || 0,
      })) || [];
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('leaderboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solves' }, () => {
        individualQuery.refetch();
        teamQuery.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        teamQuery.refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    individual: individualQuery.data || [],
    teams: teamQuery.data || [],
    isLoading: individualQuery.isLoading || teamQuery.isLoading,
  };
}
