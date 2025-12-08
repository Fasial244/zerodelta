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
  team_name: string | null;
}

interface TeamLeaderboardEntry {
  id: string;
  name: string;
  score: number;
  member_count: number;
}

export function useLeaderboard() {
  const { play } = useSound();
  const { user } = useAuth();
  const prevTopPlayer = useRef<string | null>(null);

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

      const sortedData = Array.from(userMap.values())
        .sort((a, b) => b.total_points - a.total_points);

      // Check for rank change and play sound
      if (sortedData.length > 0) {
        const newTopPlayer = sortedData[0].id;
        
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
        prevTopPlayer.current = newTopPlayer;
      }

      return sortedData;
    },
  });

  const teamQuery = useQuery({
    queryKey: ['leaderboard', 'team'],
    queryFn: async () => {
      // Use teams_public view with explicit columns (excludes join_code for non-members)
      const { data: teams, error } = await supabase
        .from('teams_public')
        .select('id, name, score')
        .gt('score', 0)
        .order('score', { ascending: false });

      if (error) throw error;

      // Get member counts separately with explicit columns
      const teamIds = teams?.map(t => t.id).filter(Boolean) as string[] || [];
      if (teamIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('team_id')
        .in('team_id', teamIds);

      const memberCounts = new Map<string, number>();
      profiles?.forEach(p => {
        if (p.team_id) {
          memberCounts.set(p.team_id, (memberCounts.get(p.team_id) || 0) + 1);
        }
      });

      return teams?.map((team) => ({
        id: team.id as string,
        name: team.name as string,
        score: team.score as number,
        member_count: memberCounts.get(team.id as string) || 0,
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
