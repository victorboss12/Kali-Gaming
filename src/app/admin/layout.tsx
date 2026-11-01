"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/context/AdminAuthContext";
import {
  Shield,
  LayoutDashboard,
  Users,
  MessageSquare,
  AlertTriangle,
  Gift,
  QrCode,
  FileText,
  Activity,
  LogOut,
  ExternalLink,
  Clock,
  Radio,
} from "lucide-react";

function AdminConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, adminLogout } = useAdminAuth();
  const [utcTime, setUtcTime] = useState("");

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().replace("GMT", "UTC"));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Redirect to /admin/login if not logged in and not on login page
  useEffect(() => {
    if (!loading && !admin && !isLoginPage) {
      router.push("/admin/login");
    }
  }, [admin, loading, isLoginPage, router]);

  // If on admin login page, display children cleanly
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#060B1A] text-white">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060B1A] flex items-center justify-center text-[#EA0000]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#EA0000] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest font-mono text-slate-400">
            Validating Staff Security Clearance...
          </p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#060B1A] text-white flex flex-col font-sans">
      {/* Top Enterprise Command Bar */}
      <header className="h-16 border-b border-[#1E293B] bg-[#0A1026] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#EA0000] to-[#990000] flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-wide text-white">KALI-GAMING</span>
                <span className="bg-[#EA0000] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  Management Console
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">Back-End Operations Platform</p>
            </div>
          </Link>
        </div>

        {/* Center Live Telemetry Bar */}
        <div className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2 bg-[#060B1A] border border-[#1E293B] px-3 py-1.5 rounded-lg">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">LIVE TRANSPORT</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{utcTime}</span>
          </div>
        </div>

        {/* Right Admin Profile & Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#141C38] hover:bg-[#1C274E] px-3 py-1.5 rounded-lg border border-[#1E293B] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Player Casino
          </Link>

          <div className="flex items-center gap-2.5 pl-2 border-l border-[#1E293B]">
            <img
              src={admin.avatar || "/avatars/avatar-admin.svg"}
              alt={admin.displayName}
              className="w-8 h-8 rounded-full border border-[#EA0000] bg-[#060B1A]"
            />
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white leading-tight">{admin.displayName}</span>
              <span className="text-[10px] font-mono text-[#F36E0F]">@{admin.username}</span>
            </div>
          </div>

          <button
            onClick={adminLogout}
            title="Log out of Admin Console"
            className="p-2 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Back-End Console Layout */}
      <div className="flex-1 flex">
        {/* Left Nav Sidebar */}
        <aside className="w-64 border-r border-[#1E293B] bg-[#080D21] hidden lg:flex flex-col p-4 justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="px-3 py-2 text-[10px] font-mono text-slate-400 uppercase tracking-widest">
              Core Back-End Navigation
            </div>

            <Link
              href="/admin?tab=overview"
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                pathname === "/admin" && !pathname.includes("tab=")
                  ? "bg-[#EA0000] text-white shadow-md"
                  : "text-slate-300 hover:bg-[#141C38] hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
            </Link>

            <Link
              href="/admin?tab=users"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <Users className="w-4 h-4 text-[#00D2FF]" /> Player Management
            </Link>

            <Link
              href="/admin?tab=messages"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" /> Player Messages (Live)
            </Link>

            <Link
              href="/admin?tab=payments"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <QrCode className="w-4 h-4 text-emerald-400" /> Payments & QR Code
            </Link>

            <Link
              href="/admin?tab=reports"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" /> Moderation Reports
            </Link>

            <Link
              href="/admin?tab=rewards"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <Gift className="w-4 h-4 text-[#F36E0F]" /> Wheel Config & Badges
            </Link>

            <Link
              href="/admin?tab=audit"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <FileText className="w-4 h-4 text-purple-400" /> Security Audit Log
            </Link>

            <Link
              href="/admin?tab=system"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:bg-[#141C38] hover:text-white transition-all"
            >
              <Activity className="w-4 h-4 text-pink-400" /> System & API Telemetry
            </Link>
          </div>

          <div className="border-t border-[#1E293B] pt-4">
            <div className="bg-[#0D1533] p-3 rounded-xl border border-[#1E293B]/60 text-xs">
              <span className="font-mono text-[10px] text-slate-400 uppercase block mb-1">
                Security Perimeter
              </span>
              <p className="text-[11px] text-slate-300 font-semibold">Strict Staff Authorization</p>
              <span className="text-[10px] text-emerald-400 block mt-1 font-mono">
                ● Isolated Admin Session
              </span>
            </div>
          </div>
        </aside>

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-8 bg-[#060B1A] overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminConsoleShell>{children}</AdminConsoleShell>
    </AdminAuthProvider>
  );
}
