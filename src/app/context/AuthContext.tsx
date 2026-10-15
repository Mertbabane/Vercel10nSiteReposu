import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Profile } from '@/app/lib/data';
import { api } from '@/app/lib/api';
import { trError } from '@/app/lib/errors';

type AuthUser = { id: string; email: string };

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

type MeResponse = { user: AuthUser | null; profile: Profile | null; isAdmin: boolean };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await api<MeResponse>('/auth/me');
      setUser(me.user);
      setProfile(me.profile);
      setIsAdmin(me.isAdmin);
    } catch {
      setUser(null);
      setProfile(null);
      setIsAdmin(false);
    }
  }

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    try {
      await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      await refresh();
      return { error: null };
    } catch (err) {
      return { error: trError((err as Error).message) };
    }
  }

  async function signUp(email: string, password: string, username: string) {
    try {
      await api('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, username }) });
      await refresh();
      return { error: null };
    } catch (err) {
      return { error: trError((err as Error).message) };
    }
  }

  async function signOut() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
