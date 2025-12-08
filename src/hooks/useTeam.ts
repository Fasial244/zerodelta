import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export function useTeam() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const teamQuery = useQuery({
    queryKey: ['user-team', profile?.team_id],
    queryFn: async () => {
      if (!profile?.team_id) return null;
      
      // Fetch team from raw table (only team members can access their team's join_code)
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, score, join_code, created_at')
        .eq('id', profile.team_id)
        .single();

      if (teamError) throw teamError;

      // Get team members separately with explicit columns
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('team_id', profile.team_id);

      if (membersError) throw membersError;

      return { ...teamData, profiles: members || [] };
    },
    enabled: !!profile?.team_id,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamName: string) => {
      if (!user) throw new Error('Not authenticated');
      if (profile?.is_locked) throw new Error('You cannot change teams after your first solve');

      // Create team - only select non-sensitive columns except join_code which we need to show the creator
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName })
        .select('id, name, score, join_code, created_at')
        .single();

      if (teamError) throw teamError;

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: team.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      return team;
    },
    onSuccess: (team) => {
      toast({
        title: 'Team Created!',
        description: `Join code: ${team.join_code}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-team'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const joinTeamMutation = useMutation({
    mutationFn: async (joinCode: string) => {
      if (!user) throw new Error('Not authenticated');

      // Use secure RPC to join team - this never exposes join_code to client
      const { data, error } = await supabase.rpc('join_team_via_code', {
        code_input: joinCode,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; team_id?: string; team_name?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to join team');
      }

      return { id: result.team_id, name: result.team_name };
    },
    onSuccess: (team) => {
      toast({
        title: 'Joined Team!',
        description: `Welcome to ${team.name}`,
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-team'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      if (profile?.is_locked) throw new Error('You cannot change teams after your first solve');

      const { error } = await supabase
        .from('profiles')
        .update({ team_id: null })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Left Team',
        description: 'You are now playing solo',
      });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-team'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    team: teamQuery.data,
    isLoading: teamQuery.isLoading,
    isLocked: profile?.is_locked || false,
    createTeam: createTeamMutation.mutate,
    joinTeam: joinTeamMutation.mutate,
    leaveTeam: leaveTeamMutation.mutate,
    isCreating: createTeamMutation.isPending,
    isJoining: joinTeamMutation.isPending,
    isLeaving: leaveTeamMutation.isPending,
  };
}
