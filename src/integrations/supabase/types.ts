export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          challenge_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          message: string
          points: number | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          message: string
          points?: number | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          message?: string
          points?: number | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          name: string
          role: string
          social_link: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name: string
          role: string
          social_link?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          name?: string
          role?: string
          social_link?: string | null
        }
        Relationships: []
      }
      challenge_instances: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          last_reset_at: string | null
          next_reset_at: string | null
          status: Database["public"]["Enums"]["instance_status"]
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          last_reset_at?: string | null
          next_reset_at?: string | null
          status?: Database["public"]["Enums"]["instance_status"]
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          last_reset_at?: string | null
          next_reset_at?: string | null
          status?: Database["public"]["Enums"]["instance_status"]
        }
        Relationships: [
          {
            foreignKeyName: "challenge_instances_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_instances_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_public"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          category: Database["public"]["Enums"]["challenge_category"]
          connection_info: Json | null
          created_at: string
          dependencies: string[] | null
          description: string
          first_blood_at: string | null
          first_blood_user_id: string | null
          flag_hash: string | null
          flag_pattern: string | null
          flag_type: Database["public"]["Enums"]["flag_type"]
          id: string
          is_active: boolean
          points: number
          solve_count: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["challenge_category"]
          connection_info?: Json | null
          created_at?: string
          dependencies?: string[] | null
          description?: string
          first_blood_at?: string | null
          first_blood_user_id?: string | null
          flag_hash?: string | null
          flag_pattern?: string | null
          flag_type?: Database["public"]["Enums"]["flag_type"]
          id?: string
          is_active?: boolean
          points?: number
          solve_count?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["challenge_category"]
          connection_info?: Json | null
          created_at?: string
          dependencies?: string[] | null
          description?: string
          first_blood_at?: string | null
          first_blood_user_id?: string | null
          flag_hash?: string | null
          flag_pattern?: string | null
          flag_type?: Database["public"]["Enums"]["flag_type"]
          id?: string
          is_active?: boolean
          points?: number
          solve_count?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_first_blood_user_id_fkey"
            columns: ["first_blood_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_registrations: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_registrations_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_active: boolean
          name: string
          require_approval: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          require_approval?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          require_approval?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_banned: boolean
          is_locked: boolean
          team_id: string | null
          university_id: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_banned?: boolean
          is_locked?: boolean
          team_id?: string | null
          university_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_locked?: boolean
          team_id?: string | null
          university_id?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_public"
            referencedColumns: ["id"]
          },
        ]
      }
      score_snapshots: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          points: number
          rank: number
          snapshot_at: string
          user_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          points?: number
          rank?: number
          snapshot_at?: string
          user_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          points?: number
          rank?: number
          snapshot_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_snapshots_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      solves: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          is_first_blood: boolean
          points_awarded: number
          team_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          is_first_blood?: boolean
          points_awarded?: number
          team_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          is_first_blood?: boolean
          points_awarded?: number
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solves_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solves_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solves_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solves_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_attempts: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          ip_address: string | null
          is_correct: boolean
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_correct?: boolean
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          is_correct?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      teams: {
        Row: {
          created_at: string
          id: string
          join_code: string
          name: string
          score: number
        }
        Insert: {
          created_at?: string
          id?: string
          join_code?: string
          name: string
          score?: number
        }
        Update: {
          created_at?: string
          id?: string
          join_code?: string
          name?: string
          score?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      challenges_public: {
        Row: {
          category: Database["public"]["Enums"]["challenge_category"] | null
          connection_info: Json | null
          created_at: string | null
          dependencies: string[] | null
          description: string | null
          first_blood_at: string | null
          first_blood_user_id: string | null
          flag_type: Database["public"]["Enums"]["flag_type"] | null
          id: string | null
          is_active: boolean | null
          points: number | null
          solve_count: number | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          connection_info?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          first_blood_at?: string | null
          first_blood_user_id?: string | null
          flag_type?: Database["public"]["Enums"]["flag_type"] | null
          id?: string | null
          is_active?: boolean | null
          points?: number | null
          solve_count?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["challenge_category"] | null
          connection_info?: Json | null
          created_at?: string | null
          dependencies?: string[] | null
          description?: string | null
          first_blood_at?: string | null
          first_blood_user_id?: string | null
          flag_type?: Database["public"]["Enums"]["flag_type"] | null
          id?: string | null
          is_active?: boolean | null
          points?: number | null
          solve_count?: number | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_first_blood_user_id_fkey"
            columns: ["first_blood_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_bloods: number | null
          player_id: string | null
          solve_count: number | null
          total_points: number | null
          username: string | null
        }
        Relationships: []
      }
      scoreboard_stats_public: {
        Row: {
          competition_name: string | null
          generated_at: string | null
          user_count: number | null
        }
        Relationships: []
      }
      submission_attempts_public: {
        Row: {
          challenge_id: string | null
          created_at: string | null
          id: string | null
          is_correct: boolean | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string | null
          is_correct?: boolean | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string | null
          is_correct?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings_public: {
        Row: {
          description: string | null
          key: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          key?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      teams_public: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          score?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_my_team_join_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      join_team_via_code: { Args: { code_input: string }; Returns: Json }
      log_activity: {
        Args: {
          p_challenge_id?: string
          p_event_type: Database["public"]["Enums"]["event_type"]
          p_message: string
          p_points?: number
          p_team_id?: string
          p_user_id?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      challenge_category: "Web" | "Pwn" | "Forensics" | "Crypto" | "Other"
      event_type:
        | "solve"
        | "first_blood"
        | "announcement"
        | "team_join"
        | "team_leave"
        | "user_banned"
      flag_type: "static" | "regex"
      instance_status: "online" | "resetting" | "offline"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      challenge_category: ["Web", "Pwn", "Forensics", "Crypto", "Other"],
      event_type: [
        "solve",
        "first_blood",
        "announcement",
        "team_join",
        "team_leave",
        "user_banned",
      ],
      flag_type: ["static", "regex"],
      instance_status: ["online", "resetting", "offline"],
    },
  },
} as const
