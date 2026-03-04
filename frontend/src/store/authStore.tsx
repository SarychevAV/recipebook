import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { tokenStore } from './tokenStore';
import type { UserResponse } from '../types/auth';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserResponse) => void;
  clearAuth: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);

  const setAuth = useCallback((token: string, newUser: UserResponse) => {
    tokenStore.setToken(token);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    tokenStore.setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        setAuth,
        clearAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}