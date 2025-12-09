import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  university_id: string | null;
  created_at: string;
  // Add other profile fields if necessary (team_id, etc) based on your DB
  team_id?: string | null;
  is_banned?: boolean;
  is_locked?: boolean;
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

  // --- NEW: Check if username is taken ---
  const checkUsernameAvailable = async (username: string, excludeUserId?: string) => {
    const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();

    if (error) {
      throw new Error("Could not verify username availability. Please try again.");
    }

    if (data && data.id !== excludeUserId) {
      throw new Error("That username is already taken. Please choose another.");
    }
  };

  // Helper to fetch profile and admin role
  const fetchUserData = async (userId: string) => {
    try {
      const [profileResult, roleResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*") // Select all fields to be safe
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

  useEffect(() => {
    let isMounted = true;
    let loadingTimeout: NodeJS.Timeout;

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        // Fallback to stop loading if fetch takes too long
        loadingTimeout = setTimeout(() => {
          if (isMounted) setIsLoading(false);
        }, 5000);

        fetchUserData(session.user.id).finally(() => {
          if (isMounted) {
            clearTimeout(loadingTimeout);
            setIsLoading(false);
          }
        });
      } else {
        setIsLoading(false);
      }
    });

    // Realtime auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (!profile) {
          // Only fetch if we don't have it yet
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
      if (loadingTimeout) clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  // --- UPDATED: SignUp with Trim & Check ---
  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName?: string,
    universityId?: string,
  ) => {
    const trimmedUsername = username.trim();
    const trimmedFullName = fullName?.trim();
    const trimmedUniversityId = universityId?.trim();

    // 1. Check availability
    await checkUsernameAvailable(trimmedUsername);

    // 2. Create Auth User
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: trimmedUsername,
          full_name: trimmedFullName,
          university_id: trimmedUniversityId,
        },
        emailRedirectTo: `${window.location.origin}/challenges`,
      },
    });

    // 3. Fallback: Force update profile if trigger is slow/fails
    if (!result.error && result.data.user && (trimmedFullName || trimmedUniversityId)) {
      setTimeout(async () => {
        await supabase
          .from("profiles")
          .update({
            full_name: trimmedFullName || null,
            university_id: trimmedUniversityId || null,
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

  // --- UPDATED: UpdateProfile with Sanitization & Check ---
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { data: null, error: new Error("No user") };

    const sanitizedUpdates = {
      ...updates,
      username: updates.username?.trim(),
      full_name: updates.full_name?.trim(),
      university_id: updates.university_id?.trim(),
    };

    // Only check DB if username is actually changing
    if (sanitizedUpdates.username && sanitizedUpdates.username !== profile?.username) {
      await checkUsernameAvailable(sanitizedUpdates.username, user.id);
    }

    const result = await supabase
      .from("profiles")
      .update(sanitizedUpdates)
      .eq("id", user.id)
      .select("*") // Return updated data
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
