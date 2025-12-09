import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { hashFlag } from "@/lib/hash";
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
    queryKey: ["admin-users", isAdminQuery.data],
    queryFn: async () => {
      console.log("Fetching users for admin panel...");
      // Admin user management - explicit columns including full_name and university_id
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id, username, full_name, university_id, avatar_url, team_id, is_banned, is_locked, created_at, updated_at,
          teams (name),
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
    enabled: isAdminQuery.data === true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const activityLogQuery = useQuery({
    queryKey: ["admin-activity", isAdminQuery.data],
    queryFn: async () => {
      console.log("Fetching activity log for admin panel...");
      // Admin activity log - explicit columns
      const { data, error } = await supabase
        .from("activity_log")
        .select(
          `
          id, event_type, message, points, user_id, challenge_id, team_id, created_at,
          profiles:user_id (username),
          challenges:challenge_id (title)
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
    enabled: isAdminQuery.data === true,
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
      const { data: saltSetting } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "flag_salt")
        .single();

      const salt = saltSetting?.value || "zd_s3cr3t_s4lt_2024";

      let flag_hash = null;
      let flag_pattern = null;

      if (challenge.flag_type === "static") {
        flag_hash = await hashFlag(challenge.flag_value, salt);
      } else {
        flag_pattern = challenge.flag_value;
      }

      const { data, error } = await supabase
        .from("challenges")
        .insert([
          {
            title: challenge.title,
            description: challenge.description,
            points: challenge.points,
            category: challenge.category as "Web" | "Pwn" | "Forensics" | "Crypto" | "Other",
            flag_type: challenge.flag_type as "static" | "regex",
            flag_hash,
            flag_pattern,
            connection_info: (challenge.connection_info || {}) as Json,
            dependencies: challenge.dependencies || [],
          },
        ])
        .select()
        .single();

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
      let finalUpdates: Record<string, unknown> = { ...updates };

      // If new flag value provided, hash it
      if (flag_value && flag_type) {
        const { data: saltSetting } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "flag_salt")
          .single();

        const salt = saltSetting?.value || "zd_s3cr3t_s4lt_2024";

        if (flag_type === "static") {
          finalUpdates.flag_hash = await hashFlag(flag_value, salt);
          finalUpdates.flag_pattern = null;
          finalUpdates.flag_type = "static";
        } else {
          finalUpdates.flag_pattern = flag_value;
          finalUpdates.flag_hash = null;
          finalUpdates.flag_type = "regex";
        }
      }

      // Convert connection_info if present
      if (updates.connection_info) {
        finalUpdates.connection_info = updates.connection_info as Json;
      }

      const { error } = await supabase.from("challenges").update(finalUpdates).eq("id", id);

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
      const { error } = await supabase.from("challenges").delete().eq("id", id);

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
      const { error } = await supabase.from("profiles").update({ is_banned: ban }).eq("id", userId);

      if (error) throw error;

      if (ban) {
        const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single();

        await supabase.from("activity_log").insert({
          event_type: "user_banned",
          user_id: userId,
          message: `${profile?.username || "User"} was banned`,
        });
      }
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
      const { error } = await supabase.from("profiles").update({ is_locked: false }).eq("id", userId);

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
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });

      if (error) {
        if (error.code === "23505") {
          throw new Error("User is already an admin");
        }
        throw error;
      }

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single();

      await supabase.from("activity_log").insert({
        event_type: "announcement",
        user_id: userId,
        message: `${profile?.username || "User"} was promoted to admin`,
      });
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
      const { error } = await supabase.from("solves").delete().eq("user_id", userId);

      if (error) throw error;

      const { data: profile } = await supabase.from("profiles").select("username").eq("id", userId).single();

      await supabase.from("activity_log").insert({
        event_type: "announcement",
        user_id: userId,
        message: `${profile?.username || "User"}'s score was reset`,
      });
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
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });

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
      const { error } = await supabase.from("activity_log").insert({
        event_type: "announcement",
        message,
      });

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
