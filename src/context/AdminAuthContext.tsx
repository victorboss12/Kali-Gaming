"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface CurrentAdmin {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "ADMIN" | "MODERATOR";
  avatar: string;
  isOnline: boolean;
  xp: number;
}

interface AdminAuthContextType {
  admin: CurrentAdmin | null;
  loading: boolean;
  refreshAdmin: () => Promise<void>;
  adminLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  admin: null,
  loading: true,
  refreshAdmin: async () => {},
  adminLogout: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshAdmin = async () => {
    try {
      const res = await fetch("/api/admin/auth/me");
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  const adminLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      setAdmin(null);
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error("Admin logout error", e);
    }
  };

  useEffect(() => {
    refreshAdmin();
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, loading, refreshAdmin, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
