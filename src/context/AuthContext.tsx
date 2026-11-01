"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  status: "ACTIVE" | "MUTED" | "BANNED";
  avatar: string;
  bio: string;
  isOnline: boolean;
  soundEnabled: boolean;
  allowFriendRequests: boolean;
  xp: number;
  hasClaimedSignupBonus?: boolean;
  signupBonusPercent?: number | null;
  hasPlayedFreeplay?: boolean;
  lastFreeplayAt?: string | null;
  lastRegularSpinAt?: string | null;
  lastSignupSpinAt?: string | null;
  activeDepositBonus?: number | null;
}

interface AuthContextType {
  user: CurrentUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout error", e);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
