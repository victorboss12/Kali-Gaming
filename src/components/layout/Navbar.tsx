"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  X,
  Sparkles,
  Gamepad2,
  HelpCircle,
  MessageSquare,
  Users,
  Shield,
  Gift,
  LogOut,
  User,
  Settings,
  QrCode,
  DollarSign,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: "Home", href: "/", icon: Gamepad2 },
    { label: "Games", href: "/games", icon: Gamepad2 },
    { label: "Deposit", href: "/deposit", icon: QrCode, badge: "CHIME" },
    { label: "Spin Wheel", href: "/wheel", icon: Sparkles, badge: "BONUS" },
    { label: "Rewards", href: "/rewards", icon: Gift },
    { label: "Chat with Admin", href: "/messages", icon: MessageSquare, badge: "1-ON-1" },
    { label: "Support", href: "/support", icon: HelpCircle },
  ];

  if (user?.role === "ADMIN") {
    navLinks.push({ label: "Admin Console", href: "/admin", icon: Shield });
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#070719]/90 backdrop-blur-2xl border-b border-[#F36E0F]/20 px-4 sm:px-8 py-3 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo matching kali-gaming.com */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 transition-transform group-hover:scale-105">
            <img
              src="/logo.svg"
              alt="Kali Gaming Logo"
              className="w-full h-full object-contain filter drop-shadow(0 0 8px #F36E0F)"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[#F36E0F] text-xl sm:text-2xl font-black tracking-tight leading-none uppercase">
              Kali
            </span>
            <span className="text-white text-xs sm:text-sm font-bold tracking-widest uppercase text-slate-300">
              Gaming
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <ul className="hidden lg:flex items-center gap-6 xl:gap-8 text-[15px] font-semibold">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 transition-all relative py-1 ${
                    isActive
                      ? "text-[#F36E0F] font-bold"
                      : "text-slate-300 hover:text-[#F36E0F]"
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="bg-gradient-to-r from-[#F6FF00] to-[#EA0000] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#F36E0F] rounded-full shadow-[0_0_10px_#F36E0F]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop User Status / Auth Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {user && (
            <Link
              href="/deposit"
              className="flex items-center gap-1.5 bg-[#25C974] hover:bg-[#1fb365] text-black font-black text-xs px-3.5 py-2 rounded-full shadow-[0_0_15px_rgba(37,201,116,0.35)] transition-all hover:scale-105"
            >
              <DollarSign className="w-3.5 h-3.5" /> Deposit
            </Link>
          )}

          {user ? (
            <div className="relative">
              <div
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-3 bg-[#142055]/80 hover:bg-[#1b2a7a] border border-[#2a3c91] px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 shadow-lg hover:border-[#F36E0F]"
              >
                <img
                  src={user.avatar || "/avatars/avatar-1.svg"}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-[#F36E0F] object-cover"
                />
                <div className="text-left text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    {user.displayName}
                    {user.role === "ADMIN" && (
                      <span className="bg-[#EA0000] text-white text-[9px] px-1 rounded font-black">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-[#F36E0F] font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#F6FF00]" />
                    {user.xp} XP
                  </div>
                </div>
              </div>

              {/* User Dropdown */}
              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-[#0c163b] border border-[#1b2a7a] rounded-2xl shadow-2xl py-2 z-50 text-sm text-slate-200 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="font-semibold text-white">{user.displayName}</p>
                    <p className="text-xs text-slate-400">@{user.username}</p>
                  </div>
                  <Link
                    href="/deposit"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors text-emerald-400 font-bold"
                  >
                    <DollarSign className="w-4 h-4" />
                    Deposit & Cashier
                  </Link>
                  <Link
                    href={`/profile/${user.id}`}
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors"
                  >
                    <User className="w-4 h-4 text-[#F36E0F]" />
                    Profile
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors text-amber-300 font-bold"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat with Admin
                  </Link>
                  <Link
                    href="/friends"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors"
                  >
                    <Users className="w-4 h-4 text-[#F36E0F]" />
                    Friends List
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[#F36E0F]" />
                    Settings
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-[#1b2a7a] transition-colors text-red-400 font-semibold"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Console
                    </Link>
                  )}
                  <div className="border-t border-white/10 my-1" />
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-500/20 text-rose-400 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-white hover:text-[#F36E0F] font-semibold text-base transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="w-[110px] h-[40px] flex items-center justify-center bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold text-sm rounded shadow-lg shadow-orange-500/30 transition-all hover:scale-105"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="lg:hidden flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1.5 text-xs bg-[#142055] px-2.5 py-1 rounded-full text-[#F36E0F] font-bold">
              <Sparkles className="w-3 h-3 text-[#F6FF00]" />
              {user.xp}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-white hover:text-[#F36E0F] p-1.5 transition-colors focus:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/10 bg-[#0c163b] rounded-2xl p-4 shadow-2xl flex flex-col gap-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? "bg-[#142055] text-[#F36E0F] font-bold"
                    : "text-slate-200 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-[#F36E0F]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-[#EA0000] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="border-t border-white/10 pt-3 mt-2 flex flex-col gap-2">
            {user ? (
              <>
                <Link
                  href={`/profile/${user.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-slate-200 hover:bg-white/5 rounded-lg"
                >
                  <User className="w-5 h-5 text-[#F36E0F]" />
                  My Profile ({user.displayName})
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-left"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-white border border-[#F36E0F] rounded-lg font-bold hover:bg-[#F36E0F]/10 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold rounded-lg transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
