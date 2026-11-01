"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  ArrowRight,
  Terminal,
  ExternalLink,
} from "lucide-react";

export default function AdminLoginPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { refreshAdmin } = useAdminAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Staff authentication failed");
      }

      await refreshAdmin();
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "An unexpected authentication error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmailOrUsername("admin@kali-gaming.com");
    setPassword("KaliAdmin123!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#050814] relative overflow-hidden">
      {/* Background Matrix/Security Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />

      {/* Glow Orbs */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#090F24] border border-[#1E293B] rounded-2xl shadow-2xl relative z-10 overflow-hidden">
        {/* Top Warning Banner */}
        <div className="bg-[#EA0000] px-4 py-2 flex items-center justify-between text-white text-[11px] font-mono font-bold tracking-wider">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>RESTRICTED ACCESS AREA</span>
          </div>
          <span className="uppercase text-[9px] bg-black/40 px-2 py-0.5 rounded">Staff Only</span>
        </div>

        {/* Portal Header */}
        <div className="p-6 sm:p-8 text-center border-b border-[#1E293B] bg-[#0C1430]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EA0000] to-[#800000] text-white shadow-[0_0_20px_rgba(234,0,0,0.4)] mb-3">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">KALI-GAMING</h1>
          <p className="text-xs font-mono text-[#F36E0F] mt-1 font-bold">
            Back-End Management Console
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Security Gateway: v2.4 (Encrypted)</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleAdminLogin} className="p-6 sm:p-8 flex flex-col gap-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/40 text-rose-300 p-3 rounded-xl text-xs font-medium">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Staff Identifier (Email or Username)
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="admin@kali-gaming.com"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                className="w-full bg-[#121B3B] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#EA0000] border border-[#1E293B] font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Master Security Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#121B3B] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#EA0000] border border-[#1E293B] font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-[#EA0000] to-[#b80000] hover:from-red-600 hover:to-red-800 disabled:opacity-60 text-white font-black py-3.5 rounded-xl shadow-[0_0_20px_rgba(234,0,0,0.3)] transition-all flex items-center justify-center gap-2 text-sm tracking-wide"
          >
            {loading ? "Authenticating Clearance..." : "Enter Management Console"}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Staff Demo Fill */}
          <div className="mt-4 pt-4 border-t border-[#1E293B] flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center">
              Authorized Test Sign-In
            </span>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full bg-[#141C38] hover:bg-[#1C274E] text-slate-200 text-xs font-mono py-2 px-3 rounded-lg border border-[#1E293B] transition-colors flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Fill Root Admin Credentials
            </button>
          </div>

          <div className="text-center text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
            <span>Are you a player?</span>
            <Link href="/login" className="text-[#F36E0F] font-bold hover:underline inline-flex items-center gap-0.5">
              Player Login Portal <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
