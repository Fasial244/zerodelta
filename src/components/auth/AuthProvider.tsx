import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  team_id: string | null;
  is_banned: boolean;
  is_locked: boolean;
  created_at: string;
  full_name: string | null;
  university_id: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName?: string,
    universityId?: string,
  ) => Promise<{ data: any; error: any }>;
  signInWithGoogle: () => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch profile and admin role in parallel
  const fetchUserData = async (userId: string) => {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, avatar_url, team_id, is_banned, is_locked, created_at, full_name, university_id")
          .eq("id", userId)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle(),
      ]);

      if (profileResult.data) setProfile(profileResult.data as Profile);
      setIsAdmin(roleResult.data?.role === "admin");
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  // Refetch profile data (useful after profile updates)
  const refetchProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn("AuthProvider: Loading timed out, forcing completion");
        setIsLoading(false);
      }
    }, 8000);

    // 1. Check active session on mount
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserData(session.user.id).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        } else {
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error("Error getting session:", error);
        if (isMounted) setIsLoading(false);
      });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Short delay on sign in to allow DB triggers to create profile
        if (event === "SIGNED_IN") {
          setTimeout(() => {
            if (isMounted) {
              fetchUserData(session.user.id).finally(() => setIsLoading(false));
            }
          }, 500);
        } else {
          fetchUserData(session.user.id).finally(() => {
            if (isMounted) setIsLoading(false);
          });
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Auth Methods
  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName?: string,
    universityId?: string,
  ) => {
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, full_name: fullName, university_id: universityId },
        emailRedirectTo: `${window.location.origin}/challenges`,
      },
    });

    // If signup successful and we have full_name/university_id, update the profile
    if (!result.error && result.data.user && (fullName || universityId)) {
      // Wait a bit for the trigger to create the profile first
      setTimeout(async () => {
        await supabase
          .from("profiles")
          .update({
            full_name: fullName || null,
            university_id: universityId || null,
          })
          .eq("id", result.data.user!.id);
      }, 1000);
    }

    return result;
  };

  const signInWithGoogle = async () => {
    return supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/challenges`,
      },
    });
  };

  const signOut = async () => {
    setProfile(null);
    setIsAdmin(false);
    return supabase.auth.signOut();
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error("No user") };
    const result = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, username, avatar_url, team_id, is_banned, is_locked, created_at, full_name, university_id")
      .single();

    if (result.data) {
      setProfile(result.data as Profile);
    }
    return result;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
