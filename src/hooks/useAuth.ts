import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  team_id: string | null;
  is_banned: boolean;
  is_locked: boolean;
  created_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isLoading: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    isAdmin: false,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;
    
    // Timeout to prevent infinite loading state
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('useAuth: Loading timed out, forcing completion');
        setAuthState(prev => {
          if (prev.isLoading) {
            return { ...prev, isLoading: false };
          }
          return prev;
        });
      }
    }, 8000); // 8 second timeout

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        fetchUserData(session.user, session);
      } else {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    }).catch((error) => {
      console.error('Error getting session:', error);
      if (isMounted) {
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          await fetchUserData(session.user, session);
        } else {
          setAuthState({
            user: null,
            session: null,
            profile: null,
            isAdmin: false,
            isLoading: false,
          });
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function fetchUserData(user: User, session: Session) {
    try {
      // Fetch profile with explicit columns
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, team_id, is_banned, is_locked, created_at')
        .eq('id', user.id)
        .maybeSingle();

      // Check admin role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setAuthState({
        user,
        session,
        profile: profile as Profile | null,
        isAdmin: roleData?.role === 'admin',
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }

  async function signUp(email: string, password: string, username: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });
    return { data, error };
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/challenges`,
      },
    });
    return { data, error };
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!authState.user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', authState.user.id)
      .select()
      .single();

    if (data) {
      setAuthState(prev => ({ ...prev, profile: data as Profile }));
    }

    return { data, error };
  }

  return {
    ...authState,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };
}
