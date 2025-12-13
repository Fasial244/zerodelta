import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import type { Json } from "@/integrations/supabase/types";

export function useAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdminQuery = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        throw error;
      }
      console.log("Admin check result:", data, "for user:", user.id);
      return !!data;
    },
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: true,
  });

  const allChallengesQuery = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: async () => {
      // Admins have full access - select explicit columns for clarity
      const { data, error } = await supabase
        .from("challenges")
        .select(
          "id, title, description, points, category, flag_type, flag_hash, flag_pattern, connection_info, dependencies, solve_count, first_blood_user_id, first_blood_at, is_active, created_at, updated_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdminQuery.data === true,
  });

  const allUsersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      console.log("Fetching users for admin panel...");
      // Admin user management - explicit columns including full_name and university_id
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, username, full_name, university_id, avatar_url, team_id, is_banned, is_locked, created_at, updated_at,
          teams_public:team_id (id, name),
          solves (id, points_awarded)
        `,
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      console.log("Fetched users:", data?.length || 0);
      return data || [];
    },
    enabled: !!isAdminQuery.data,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const activityLogQuery = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      console.log("Fetching activity log for admin panel...");
      // Admin activity log - explicit columns
      const { data, error } = await supabase
        .from("activity_log")
        .select(
          `
          id, event_type, message, points, user_id, challenge_id, team_id, created_at,
          profiles:user_id (username)
        `,
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching activity log:", error);
        throw error;
      }
      console.log("Fetched activity log:", data?.length || 0);
      return data || [];
    },
    enabled: !!isAdminQuery.data,
    staleTime: 0,
    refetchOnMount: "always",
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
      const { data, error } = await supabase.rpc("admin_create_challenge", {
        p_title: challenge.title,
        p_description: challenge.description,
        p_points: challenge.points,
        p_category: challenge.category,
        p_flag_type: challenge.flag_type,
        p_flag_value: challenge.flag_value,
        p_connection_info: (challenge.connection_info || {}) as Json,
        p_dependencies: challenge.dependencies || [],
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Challenge created!" });
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateChallengeMutation = useMutation({
    mutationFn: async ({
      id,
      flag_value,
      flag_type,
      ...updates
    }: {
      id: string;
      is_active?: boolean;
      title?: string;
      description?: string;
      points?: number;
      category?: string;
      dependencies?: string[];
      connection_info?: Record<string, unknown>;
      flag_type?: string;
      flag_value?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_challenge", {
        p_id: id,
        p_title: updates.title,
        p_description: updates.description,
        p_points: updates.points,
        p_category: updates.category,
        p_flag_type: flag_type,
        p_flag_value: flag_value,
        p_connection_info: updates.connection_info as Json | undefined,
        p_dependencies: updates.dependencies,
        p_is_active: updates.is_active,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Challenge updated!" });
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteChallengeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("admin_delete_challenge", { p_id: id });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Challenge deleted!" });
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["challenges"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, ban }: { userId: string; ban: boolean }) => {
      const { error } = await supabase.rpc("admin_set_user_ban", { p_user_id: userId, p_ban: ban });

      if (error) throw error;
    },
    onSuccess: (_, { ban }) => {
      toast({ title: ban ? "User banned" : "User unbanned" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const unlockUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_set_user_lock", { p_user_id: userId, p_locked: false });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User unlocked" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_promote_user", { p_user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User promoted to admin!" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const resetUserScoreMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.rpc("admin_reset_user_score", { p_user_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "User score reset!" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.rpc("admin_update_setting", { p_key: key, p_value: value });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Setting updated!" });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const postAnnouncementMutation = useMutation({
    mutationFn: async (message: string) => {
      const { error } = await supabase.rpc("admin_post_announcement", { p_message: message });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Announcement posted!" });
      queryClient.invalidateQueries({ queryKey: ["activity-log"] });
      queryClient.invalidateQueries({ queryKey: ["admin-activity"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
  const isInitializing = isAdminQuery.isLoading;
  const isFetchingData = isAdminQuery.data === true && (allUsersQuery.isLoading || allChallengesQuery.isLoading);
  return {
    isAdmin: isAdminQuery.data || false,
    isLoadingAdmin: isInitializing || isFetchingData,

    challenges: allChallengesQuery.data || [],
    users: allUsersQuery.data || [],
    activityLog: activityLogQuery.data || [],

    // ... keep mutations as they are ...
    createChallenge: createChallengeMutation.mutate,
    updateChallenge: updateChallengeMutation.mutate,
    deleteChallenge: deleteChallengeMutation.mutate,
    banUser: banUserMutation.mutate,
    unlockUser: unlockUserMutation.mutate,
    promoteToAdmin: promoteToAdminMutation.mutate,
    resetUserScore: resetUserScoreMutation.mutate,
    updateSetting: updateSettingMutation.mutate,
    postAnnouncement: postAnnouncementMutation.mutate,
  };
}
