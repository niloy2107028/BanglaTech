import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../lib/api";
import { clearToken, getToken, saveToken } from "../lib/tokenStorage";
import { AuthResponse, AuthUser } from "../types/auth";

interface AuthContextValue {
  user: AuthUser | null;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  setSession: (token: string, user: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const token = await getToken();
        if (!token) return;
        const { data } = await api.get<AuthResponse>("/api/auth/me");
        if (mounted) {
          setUser(data.user || null);
        }
      } catch {
        await clearToken();
      } finally {
        if (mounted) {
          setBootstrapping(false);
        }
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      bootstrapping,
      setSession: async (token: string, nextUser: AuthUser) => {
        await saveToken(token);
        setUser(nextUser);
      },
      login: async (email: string, password: string) => {
        const { data } = await api.post<AuthResponse>("/api/auth/login", {
          email,
          password,
          clientType: "mobile",
        });

        if (!data.token || !data.user) {
          throw new Error(data.message || "Login failed");
        }

        await saveToken(data.token);
        setUser(data.user);
      },
      logout: async () => {
        await api.post("/api/auth/logout", { clientType: "mobile" });
        await clearToken();
        setUser(null);
      },
    }),
    [bootstrapping, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
