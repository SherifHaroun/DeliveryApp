import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client";
import type { AuthUser } from "../api/types";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api<AuthUser>("/api/auth/me");
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    void refresh();
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const result = await api<{ token: string; user: AuthUser }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        setToken(result.token);
        setUser(result.user);
      },
      logout() {
        clearToken();
        setUser(null);
      },
      refresh,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
