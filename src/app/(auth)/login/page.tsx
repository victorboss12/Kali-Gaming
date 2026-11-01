"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  User,
  Phone,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
} from "lucide-react";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your Phone Number, Username, or Email.");
      return;
    }

    if (!password) {
      setError("Please enter your account password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailOrUsername: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      await refreshUser();

      // If user hasn't claimed signup bonus, guide them directly to spin the wheel
      if (data.user && !data.user.hasClaimedSignupBonus) {
        router.push("/wheel");
      } else {
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during sign-in.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (userType: "player1" | "player2") => {
    if (userType === "player1") {
      setIdentifier("player1@kali-gaming.com");
      setPassword("Player123!");
    } else if (userType === "player2") {
      setIdentifier("player2@kali-gaming.com");
      setPassword("Player123!");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40]">
      <div className="w-full max-w-md bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#142055] px-6 py-6 text-center border-b border-white/10 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D0D2B] border border-[#F36E0F] mb-2.5 shadow-md">
            <img src="/logo.svg" alt="Kali Gaming" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Player Sign-In
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Log in with your <strong className="text-white">Phone Number</strong>, <strong className="text-white">Username</strong>, or <strong className="text-white">Email</strong> and password.
          </p>

          <div className="inline-flex items-center gap-1.5 bg-[#25C974]/20 border border-[#25C974]/40 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-300 mt-2.5">
            <Flame className="w-3.5 h-3.5 text-emerald-400" />
            Direct Password Access • Instant Sign-In
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {/* 1. Phone / Username / Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Phone Number, Username, or Email</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 555-019-2831, +15551234567, or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                />
              </div>
              <span className="text-[10px] text-slate-400">
                You can enter your phone number with or without country code.
              </span>
            </div>

            {/* 2. Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  href="/reset-password"
                  className="text-xs text-[#F36E0F] hover:underline font-semibold"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 3. Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 disabled:opacity-60 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? "Signing In..." : "Log In to Platform"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Player Demo Testing Buttons */}
          <div className="mt-2 pt-4 border-t border-white/10 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Quick Testing Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("player1")}
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-xs font-semibold py-2 px-2 rounded-xl text-slate-200 transition-colors"
              >
                Player 1 Demo
              </button>
              <button
                type="button"
                onClick={() => fillDemo("player2")}
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-xs font-semibold py-2 px-2 rounded-xl text-slate-200 transition-colors"
              >
                Player 2 Demo
              </button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-xs text-slate-300 pt-2">
            Don&apos;t have a player account yet?{" "}
            <Link href="/signup" className="text-[#F36E0F] font-bold hover:underline">
              Create Account & Spin Wheel →
            </Link>
          </div>

          {/* Staff Login Link */}
          <div className="pt-3 border-t border-white/10 text-center">
            <Link
              href="/admin/login"
              className="text-[11px] font-mono text-slate-400 hover:text-red-400 transition-colors inline-flex items-center gap-1"
            >
              Staff Administrator? Access Admin Console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}