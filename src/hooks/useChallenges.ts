import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { hashFlag } from '@/lib/hash';
import { useToast } from './use-toast';

export type Challenge = {
  id: string;
  title: string;
  description: string;
  points: number;
  category: string;
  flag_type: string;
  connection_info: unknown;
  dependencies: string[] | null;
  solve_count: number;
  first_blood_user_id: string | null;
  first_blood_at: string | null;
  is_active: boolean;
  created_at: string;
};


export function useChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      console.log('[useChallenges] Fetching challenges from challenges_public view...');
      
      // Use the secure public view with explicit columns (no flag_hash or flag_pattern)
      const { data, error } = await supabase
        .from('challenges_public')
        .select('id, title, description, points, category, flag_type, connection_info, dependencies, solve_count, first_blood_user_id, first_blood_at, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('points', { ascending: true });

      if (error) {
        console.error('[useChallenges] Error fetching challenges:', error);
        throw error;
      }
      
      console.log('[useChallenges] Fetched challenges:', data?.length || 0);
      return data as Challenge[];
    },
    refetchInterval: 10000, // Poll every 10 seconds for live updates
  });

  const userSolvesQuery = useQuery({
    queryKey: ['user-solves', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('solves')
        .select('id, challenge_id, user_id, team_id, points_awarded, is_first_blood, created_at')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 5000, // Poll every 5 seconds for live solve updates
  });

  const submitFlagMutation = useMutation({
    mutationFn: async ({ challengeId, flagInput }: { challengeId: string; flagInput: string }) => {
      const challenge = challengesQuery.data?.find(c => c.id === challengeId);
      if (!challenge) throw new Error('Challenge not found');

      // Get salt from settings
      const { data: saltSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'flag_salt')
        .single();

      const salt = saltSetting?.value || 'zd_s3cr3t_s4lt_2024';

      let requestBody: { challenge_id: string; flag_input?: string; flag_hash?: string } = {
        challenge_id: challengeId,
      };

      if (challenge.flag_type === 'static') {
        const hash = await hashFlag(flagInput, salt);
        requestBody.flag_hash = hash;
      } else {
        requestBody.flag_input = flagInput;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('verify-flag', {
        body: requestBody,
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: data.is_first_blood ? '🩸 FIRST BLOOD!' : 'FLAG ACCEPTED',
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['user-solves'] });
        queryClient.invalidateQueries({ queryKey: ['challenges'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      } else {
        toast({
          title: 'INCORRECT',
          description: data.message,
          variant: 'destructive',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'ERROR',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const isChallengeUnlocked = (challenge: Challenge) => {
    if (!challenge.dependencies || challenge.dependencies.length === 0) {
      return true;
    }
    const solvedIds = userSolvesQuery.data?.map(s => s.challenge_id) || [];
    return challenge.dependencies.every(dep => solvedIds.includes(dep));
  };

  const isChallengeSolved = (challengeId: string) => {
    return userSolvesQuery.data?.some(s => s.challenge_id === challengeId) || false;
  };

  return {
    challenges: challengesQuery.data || [],
    isLoading: challengesQuery.isLoading,
    userSolves: userSolvesQuery.data || [],
    submitFlag: submitFlagMutation.mutate,
    isSubmitting: submitFlagMutation.isPending,
    isChallengeUnlocked,
    isChallengeSolved,
  };
}
