import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useStore } from '../store';

export interface Profile {
  username: string;
  bio: string | null;
  avatar_color: string;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, username: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEFAULT_COLOR = '#7F77DD';

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('username, bio, avatar_color')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const p = await fetchProfile(userId);
    setProfile(p);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const userId = data.session?.user?.id ?? null;
      const store = useStore.getState();
      store.setCurrentUser(userId);
      if (userId) {
        store.loadAllData();
        loadProfile(userId);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const userId = session?.user?.id ?? null;
      const store = useStore.getState();
      store.setCurrentUser(userId);
      if (userId) {
        store.loadAllData();
        loadProfile(userId);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  };

  const signUp = async (email: string, password: string, username: string): Promise<string | null> => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: username.trim(),
        avatar_color: DEFAULT_COLOR,
        bio: null,
      });
    }
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const updateProfile = async (data: Partial<Profile>): Promise<string | null> => {
    const userId = session?.user?.id;
    if (!userId) return 'Nicht angemeldet';
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...data }, { onConflict: 'id' });
    if (error) return error.message;
    setProfile((prev) => prev ? { ...prev, ...data } : ({ username: '', bio: null, avatar_color: DEFAULT_COLOR, ...data } as Profile));
    return null;
  };

  const refreshProfile = async () => {
    const userId = session?.user?.id;
    if (userId) await loadProfile(userId);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signIn, signUp, signOut, updateProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth muss innerhalb von AuthProvider verwendet werden');
  return ctx;
}

export function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('');
}
