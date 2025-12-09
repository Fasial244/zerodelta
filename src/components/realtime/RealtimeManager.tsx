import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'react-router-dom';

/**
 * Enhanced Global Realtime Manager - Subscribes to database changes and invalidates queries
 * This component should be mounted once in App.tsx
 * Now includes route-based refetching for guaranteed real-time updates
 */
export function RealtimeManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();

  // Refetch queries when route changes for guaranteed freshness
  useEffect(() => {
    console.log('[Realtime] Route changed to:', location.pathname);
    
    // Refetch relevant queries based on route
    if (location.pathname.includes('/challenges')) {
      queryClient.refetchQueries({ queryKey: ['challenges'] });
      queryClient.refetchQueries({ queryKey: ['user-solves'] });
    } else if (location.pathname.includes('/leaderboard') || location.pathname.includes('/scoreboard')) {
      queryClient.refetchQueries({ queryKey: ['leaderboard'] });
    } else if (location.pathname.includes('/activity')) {
      queryClient.refetchQueries({ queryKey: ['activity'] });
    }
  }, [location.pathname, queryClient]);

  useEffect(() => {
    // Channel for solves - invalidate leaderboard and challenges
    const solvesChannel = supabase
      .channel('realtime-solves')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'solves' },
        (payload) => {
          console.log('[Realtime] Solves changed:', payload.eventType);
          // Force refetch instead of just invalidate
          queryClient.refetchQueries({ queryKey: ['leaderboard'] });
          queryClient.refetchQueries({ queryKey: ['challenges'] });
          queryClient.refetchQueries({ queryKey: ['user-solves'] });
          queryClient.refetchQueries({ queryKey: ['profile'] });
        }
      )
      .subscribe();

    // Channel for challenges - refetch challenges query
    const challengesChannel = supabase
      .channel('realtime-challenges')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges' },
        (payload) => {
          console.log('[Realtime] Challenges changed:', payload.eventType);
          queryClient.refetchQueries({ queryKey: ['challenges'] });
        }
      )
      .subscribe();

    // Channel for system_settings - refetch settings query
    const settingsChannel = supabase
      .channel('realtime-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'system_settings' },
        (payload) => {
          console.log('[Realtime] Settings changed:', payload.eventType);
          queryClient.refetchQueries({ queryKey: ['system-settings'] });
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

          // Refetch activity queries
          queryClient.refetchQueries({ queryKey: ['activity'] });
        }
      )
      .subscribe();

    // Channel for profiles - refetch leaderboard
    const profilesChannel = supabase
      .channel('realtime-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        (payload) => {
          console.log('[Realtime] Profiles changed:', payload.eventType);
          queryClient.refetchQueries({ queryKey: ['leaderboard'] });
          queryClient.refetchQueries({ queryKey: ['all-users'] });
          queryClient.refetchQueries({ queryKey: ['profile'] });
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
  }, [queryClient, toast]);

  // This component doesn't render anything
  return null;
}
