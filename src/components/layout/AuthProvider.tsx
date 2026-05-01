'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { JWTPayload } from '@/lib/auth';

interface AuthContextType {
  user: JWTPayload | null;
  setUser: (u: JWTPayload | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession: JWTPayload | null;
}) {
  const [user, setUser] = useState<JWTPayload | null>(initialSession);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
