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
      
      // Use teams_public view which only shows join_code to team members
      const { data: teamData, error: teamError } = await supabase
        .from('teams_public')
        .select('*')
        .eq('id', profile.team_id)
        .single();

      if (teamError) throw teamError;

      // Get team members separately
      const { data: members, error: membersError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .eq('team_id', profile.team_id);

      if (membersError) throw membersError;

      return { ...teamData, profiles: members };
    },
    enabled: !!profile?.team_id,
  });

  const createTeamMutation = useMutation({
    mutationFn: async (teamName: string) => {
      if (!user) throw new Error('Not authenticated');
      if (profile?.is_locked) throw new Error('You cannot change teams after your first solve');

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({ name: teamName })
        .select()
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
      if (profile?.is_locked) throw new Error('You cannot change teams after your first solve');

      // Find team by join code
      const { data: team, error: findError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('join_code', joinCode.toUpperCase())
        .single();

      if (findError || !team) throw new Error('Invalid join code');

      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ team_id: team.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Log activity
      await supabase.from('activity_log').insert({
        event_type: 'team_join',
        user_id: user.id,
        team_id: team.id,
        message: `${profile?.username || 'A user'} joined ${team.name}`,
      });

      return team;
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
