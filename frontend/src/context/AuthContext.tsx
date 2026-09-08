/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { AUTH_TOKEN_STORAGE_KEY, AUTH_USER_STORAGE_KEY } from "../services/api";

export interface AuthUser {
  email: string;
  full_name?: string;
}

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(AUTH_USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY),
  );
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login(newToken, newUser) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, newToken);
        localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
      },
      logout() {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_USER_STORAGE_KEY);
        setToken(null);
        setUser(null);
      },
    }),
    [token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}
