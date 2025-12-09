import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Global Realtime Manager - Subscribes to database changes and invalidates queries
 * This component should be mounted once in App.tsx
 */
const LEADERBOARD_QUERY_KEYS: (string | number)[][] = [['leaderboard', 'individual']];

export function RealtimeManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidateLeaderboardQueries = useCallback(() => {
    LEADERBOARD_QUERY_KEYS.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  }, [queryClient]);

  useEffect(() => {
    // Channel for solves - invalidate leaderboard and challenges
    const solvesChannel = supabase
      .channel('realtime-solves')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solves' },
        (payload) => {
          console.log('[Realtime] Solves changed:', payload.eventType);
          invalidateLeaderboardQueries();
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      )
      .subscribe();

    // Channel for challenges - invalidate challenges query
    const challengesChannel = supabase
      .channel('realtime-challenges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        (payload) => {
          console.log('[Realtime] Challenges changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['challenges'] });
        }
      )
      .subscribe();

    // Channel for system_settings - invalidate settings query
    const settingsChannel = supabase
      .channel('realtime-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          console.log('[Realtime] Settings changed:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['system-settings'] });
        }
      )
      .subscribe();

    // Channel for activity_log - show toast for new events
    const activityChannel = supabase
      .channel('realtime-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload) => {
          console.log('[Realtime] New activity:', payload.new);
          const newActivity = payload.new as {
            event_type: string;
            message: string;
            points?: number;
          };

          // Show toast for important events
          if (newActivity.event_type === 'first_blood') {
            toast({
              title: '🩸 FIRST BLOOD!',
              description: newActivity.message,
              variant: 'destructive',
              duration: 10000,
            });
          } else if (newActivity.event_type === 'announcement') {
            toast({
              title: '📢 ANNOUNCEMENT',
              description: newActivity.message,
              duration: 10000,
            });
          }

          // Invalidate activity queries
          queryClient.invalidateQueries({ queryKey: ['activity'] });
        }
      )
      .subscribe();

    // Channel for profiles - invalidate leaderboard
    const profilesChannel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[Realtime] Profiles changed:', payload.eventType);
          invalidateLeaderboardQueries();
          queryClient.invalidateQueries({ queryKey: ['all-users'] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(solvesChannel);
      supabase.removeChannel(challengesChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(activityChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [invalidateLeaderboardQueries, queryClient, toast]);

  // This component doesn't render anything
  return null;
}
