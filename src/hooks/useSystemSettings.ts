import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SystemSettings {
  game_paused: boolean;
  game_start_time: Date;
  game_end_time: Date;
  decay_rate: number;
  decay_factor: number;
  min_points: number;
  event_title: string;
  flag_salt: string;
  honeypot_hash: string;
  instance_reset_interval: number;
}

type GameState = 'before_start' | 'active' | 'ended' | 'paused';

const parseSettings = (data: Array<{ key: string; value: string }> | null): SystemSettings => {
  const settingsMap: Record<string, string> = {};
  data?.forEach(row => {
    settingsMap[row.key] = row.value;
  });

  return {
    game_paused: settingsMap.game_paused === 'true',
    game_start_time: new Date(settingsMap.game_start_time || '2024-01-01T00:00:00Z'),
    game_end_time: new Date(settingsMap.game_end_time || '2024-12-31T23:59:59Z'),
    decay_rate: parseFloat(settingsMap.decay_rate || '0.5'),
    decay_factor: parseFloat(settingsMap.decay_factor || '10'),
    min_points: parseInt(settingsMap.min_points || '50'),
    event_title: settingsMap.event_title || 'ZeroDelta',
    flag_salt: settingsMap.flag_salt || '',
    honeypot_hash: settingsMap.honeypot_hash || '',
    instance_reset_interval: parseInt(settingsMap.instance_reset_interval || '15'),
  };
};

const fetchSystemSettings = async (): Promise<SystemSettings> => {
  const { data, error } = await supabase
    .from('system_settings')
    .select('key, value');

  if (error) throw error;
  return parseSettings(data);
};

export function useSystemSettings() {
  const queryClient = useQueryClient();
  const [gameState, setGameState] = useState<GameState>('before_start');
  const [countdown, setCountdown] = useState<string>('');

  const { data: settings, isLoading, refetch } = useQuery({
    queryKey: ['system-settings'],
    queryFn: fetchSystemSettings,
    staleTime: 60000, // Cache for 1 minute to prevent duplicate requests
    gcTime: 300000, // Keep in cache for 5 minutes
  });

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = supabase
      .channel('system-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        () => {
          // Invalidate cache to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['system-settings'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Update game state based on settings
  useEffect(() => {
    if (!settings) return;

    const updateGameState = () => {
      const now = new Date();
      const start = settings.game_start_time;
      const end = settings.game_end_time;

      if (settings.game_paused) {
        setGameState('paused');
        setCountdown('GAME PAUSED');
        return;
      }

      if (now < start) {
        setGameState('before_start');
        setCountdown(formatCountdown(start.getTime() - now.getTime()));
      } else if (now > end) {
        setGameState('ended');
        setCountdown('CTF ENDED');
      } else {
        setGameState('active');
        setCountdown(formatCountdown(end.getTime() - now.getTime()));
      }
    };

    updateGameState();
    const interval = setInterval(updateGameState, 1000);
    return () => clearInterval(interval);
  }, [settings]);

  function formatCountdown(ms: number): string {
    if (ms <= 0) return '00:00:00';
    
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const calculateDynamicPoints = useCallback((basePoints: number, solveCount: number): number => {
    if (!settings) return basePoints;
    
    const { decay_rate, decay_factor, min_points } = settings;
    const points = Math.floor(basePoints * Math.pow(decay_rate, solveCount / decay_factor));
    return Math.max(min_points, points);
  }, [settings]);

  return {
    settings: settings ?? null,
    isLoading,
    gameState,
    countdown,
    calculateDynamicPoints,
    refetch,
  };
}
