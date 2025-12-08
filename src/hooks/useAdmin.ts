import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { hashFlag } from '@/lib/hash';
import type { Json } from '@/integrations/supabase/types';

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdminQuery = useQuery({
    queryKey: ['is-admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!user,
  });

  const allChallengesQuery = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const allUsersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          teams (name),
          solves (id, points_awarded)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const activityLogQuery = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select(`
          *,
          profiles:user_id (username),
          challenges:challenge_id (title)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const createChallengeMutation = useMutation({
    mutationFn: async (challenge: {
      title: string;
      description: string;
      points: number;
      category: string;
      flag_type: string;
      flag_value: string;
      connection_info?: Record<string, unknown>;
      dependencies?: string[];
    }) => {
      const { data: saltSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'flag_salt')
        .single();

      const salt = saltSetting?.value || 'zd_s3cr3t_s4lt_2024';

      let flag_hash = null;
      let flag_pattern = null;

      if (challenge.flag_type === 'static') {
        flag_hash = await hashFlag(challenge.flag_value, salt);
      } else {
        flag_pattern = challenge.flag_value;
      }

      const { data, error } = await supabase
        .from('challenges')
        .insert([{
          title: challenge.title,
          description: challenge.description,
          points: challenge.points,
          category: challenge.category as "Web" | "Pwn" | "Forensics" | "Crypto" | "Other",
          flag_type: challenge.flag_type as "static" | "regex",
          flag_hash,
          flag_pattern,
          connection_info: (challenge.connection_info || {}) as Json,
          dependencies: challenge.dependencies || [],
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Challenge created!' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean }) => {
      const { error } = await supabase
        .from('challenges')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Challenge updated!' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Challenge deleted!' });
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_banned: ban })
        .eq('id', userId);

      if (error) throw error;

      if (ban) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .single();

        await supabase.from('activity_log').insert({
          event_type: 'user_banned',
          user_id: userId,
          message: `${profile?.username || 'User'} was banned`,
        });
      }
    },
    onSuccess: (_, { ban }) => {
      toast({ title: ban ? 'User banned' : 'User unbanned' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_locked: false })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'User unlocked' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('system_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Setting updated!' });
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const postAnnouncementMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.from('activity_log').insert({
        event_type: 'announcement',
        message,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Announcement posted!' });
      queryClient.invalidateQueries({ queryKey: ['activity-log'] });
      queryClient.invalidateQueries({ queryKey: ['admin-activity'] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  return {
    isAdmin: isAdminQuery.data || false,
    isLoadingAdmin: isAdminQuery.isLoading,
    challenges: allChallengesQuery.data || [],
    users: allUsersQuery.data || [],
    activityLog: activityLogQuery.data || [],
    createChallenge: createChallengeMutation.mutate,
    updateChallenge: updateChallengeMutation.mutate,
    deleteChallenge: deleteChallengeMutation.mutate,
    banUser: banUserMutation.mutate,
    unlockUser: unlockUserMutation.mutate,
    updateSetting: updateSettingMutation.mutate,
    postAnnouncement: postAnnouncementMutation.mutate,
  };
}
