import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { User } from '@/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isNewUser: false,
  setIsNewUser: () => {},
  signOut: async () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUser(session.user.id);
      else { setUser(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUser = async (id: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', id).single();
    if (!data) {
      setIsNewUser(true);
    }
    setUser(data);
    setLoading(false);
  };

  const refreshUser = async () => {
    if (session) await fetchUser(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsNewUser(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, isNewUser, setIsNewUser, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
