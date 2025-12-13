import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Competition {
  id: string;
  name: string;
  description: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  require_approval: boolean;
  created_at: string;
}

export interface CompetitionRegistration {
  id: string;
  competition_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
  competitions?: Competition;
}

export function useCompetitions() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all competitions
  const { data: competitions = [], isLoading: competitionsLoading } = useQuery({
    queryKey: ['competitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Competition[];
    },
  });

  // Fetch active competition (available to all users including anonymous)
  const { data: activeCompetition, isLoading: activeCompetitionLoading } = useQuery({
    queryKey: ['active-competition'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as Competition | null;
    },
    staleTime: 30000, // Cache for 30 seconds to reduce requests
  });

  // Fetch user's registration for active competition
  const { data: userRegistration, isLoading: registrationLoading } = useQuery({
    queryKey: ['user-registration', user?.id, activeCompetition?.id],
    queryFn: async () => {
      if (!user || !activeCompetition) return null;

      const { data, error } = await supabase
        .from('competition_registrations')
        .select('*, competitions(*)')
        .eq('user_id', user.id)
        .eq('competition_id', activeCompetition.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as CompetitionRegistration | null;
    },
    enabled: !!user && !!activeCompetition,
  });

  // Fetch all registrations (admin only)
  const { data: allRegistrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ['all-registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competition_registrations')
        .select('*, profiles(id, username, avatar_url), competitions(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CompetitionRegistration[];
    },
    enabled: isAdmin,
  });

  // Register for competition
  const registerMutation = useMutation({
    mutationFn: async (competitionId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('competition_registrations')
        .insert({
          competition_id: competitionId,
          user_id: user.id,
          status: 'pending',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-registration'] });
      toast.success('Registration submitted! Awaiting admin approval.');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('You are already registered for this competition');
      } else {
        toast.error('Failed to register: ' + error.message);
      }
    },
  });

  // Approve/reject registration (admin)
  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('competition_registrations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['all-registrations'] });
      toast.success(`Registration ${status}`);
    },
    onError: (error: any) => {
      toast.error('Failed to update registration: ' + error.message);
    },
  });

  // Admin assign user to competition
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, competitionId, status = 'approved' }: { 
      userId: string; 
      competitionId: string; 
      status?: string 
    }) => {
      const { data, error } = await supabase.rpc('admin_assign_user_to_competition', {
        p_user_id: userId,
        p_competition_id: competitionId,
        p_status: status,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string };
      if (!result.success) throw new Error(result.error || 'Failed to assign user');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-registrations'] });
      toast.success('User assigned to competition');
    },
    onError: (error: any) => {
      toast.error('Failed to assign user: ' + error.message);
    },
  });

  // Admin bulk assign users to competition
  const bulkAssignMutation = useMutation({
    mutationFn: async ({ userIds, competitionId, status = 'approved' }: { 
      userIds: string[]; 
      competitionId: string; 
      status?: string 
    }) => {
      const { data, error } = await supabase.rpc('admin_bulk_assign_to_competition', {
        p_user_ids: userIds,
        p_competition_id: competitionId,
        p_status: status,
      });

      if (error) throw error;
      const result = data as { success: boolean; error?: string; assigned_count?: number };
      if (!result.success) throw new Error(result.error || 'Failed to assign users');
      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['all-registrations'] });
      toast.success(`${data.assigned_count} users assigned to competition`);
    },
    onError: (error: any) => {
      toast.error('Failed to assign users: ' + error.message);
    },
  });
  const createCompetitionMutation = useMutation({
    mutationFn: async (data: Omit<Competition, 'id' | 'created_at'>) => {
      const { error } = await supabase
        .from('competitions')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition created!');
    },
    onError: (error: any) => {
      toast.error('Failed to create competition: ' + error.message);
    },
  });

  // Update competition (admin)
  const updateCompetitionMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Competition> & { id: string }) => {
      const { error } = await supabase
        .from('competitions')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      queryClient.invalidateQueries({ queryKey: ['active-competition'] });
      toast.success('Competition updated!');
    },
    onError: (error: any) => {
      toast.error('Failed to update competition: ' + error.message);
    },
  });

  // Delete competition (admin)
  const deleteCompetitionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('competitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitions'] });
      toast.success('Competition deleted!');
    },
    onError: (error: any) => {
      toast.error('Failed to delete competition: ' + error.message);
    },
  });

  return {
    competitions,
    activeCompetition,
    userRegistration,
    allRegistrations,
    isLoading: competitionsLoading || registrationLoading,
    registrationsLoading,
    register: (competitionId: string) => registerMutation.mutate(competitionId),
    updateRegistration: (id: string, status: 'approved' | 'rejected') => 
      updateRegistrationMutation.mutate({ id, status }),
    createCompetition: (data: Omit<Competition, 'id' | 'created_at'>) => 
      createCompetitionMutation.mutate(data),
    updateCompetition: (data: Partial<Competition> & { id: string }) => 
      updateCompetitionMutation.mutate(data),
    deleteCompetition: (id: string) => deleteCompetitionMutation.mutate(id),
    assignUser: (userId: string, competitionId: string, status?: string) =>
      assignUserMutation.mutate({ userId, competitionId, status }),
    bulkAssignUsers: (userIds: string[], competitionId: string, status?: string) =>
      bulkAssignMutation.mutate({ userIds, competitionId, status }),
    isAssigning: assignUserMutation.isPending || bulkAssignMutation.isPending,
  };
}
