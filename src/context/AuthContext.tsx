import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import supabase from '../../supabase';
import { setApiUser } from '../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  role: 'client' | 'runner';
  email: string; // ✅ FIX: add email
}

interface AuthContextType {
  user: User | null;
  initializing: boolean;
  logout: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const u = session.user;

          const userData: User = {
            id: u.id,
            role: (u.user_metadata?.role as User['role']) ?? 'client',
            email: u.email ?? '', // ✅ FIX: map email safely
          };

          setUser(userData);
          setApiUser(userData);
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setApiUser(null);
        }

        setInitializing(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, initializing, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}