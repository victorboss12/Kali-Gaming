"use client";

import React from "react";
import Link from "next/link";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#060c1e] border-t border-white/5 text-slate-400 py-12 px-4 sm:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand info */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/logo.svg" alt="Kali Gaming" className="w-8 h-8 object-contain" />
              <span className="text-[#F36E0F] text-xl font-black uppercase">Kali Gaming</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md">
              #1 Social Gaming & Rewards Platform. Connect with fellow players, spin the daily welcome wheel, chat in real-time rooms, and unlock exclusive VIP perks.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              All Systems Operational & Real-Time Chat Online
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Explore</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/" className="hover:text-[#F36E0F] transition-colors">Home Platform</Link></li>
              <li><Link href="/games" className="hover:text-[#F36E0F] transition-colors">Games Directory</Link></li>
              <li><Link href="/wheel" className="hover:text-[#F36E0F] transition-colors">Spin Rewards Wheel</Link></li>
              <li><Link href="/rewards" className="hover:text-[#F36E0F] transition-colors">Perks & Badges</Link></li>
              <li><Link href="/rooms" className="hover:text-[#F36E0F] transition-colors">Community Rooms</Link></li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Community & Help</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link href="/support" className="hover:text-[#F36E0F] transition-colors">Official Live Support</Link></li>
              <li><Link href="/settings" className="hover:text-[#F36E0F] transition-colors">Account Settings</Link></li>
              <li><Link href="/support" className="hover:text-[#F36E0F] transition-colors">Platform Rules</Link></li>
              <li><Link href="/rewards" className="hover:text-[#F36E0F] transition-colors">Spin Eligibility Rules</Link></li>
            </ul>
          </div>
        </div>

        {/* Disclaimer per social gaming requirements */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-slate-500 text-center md:text-left">
            Kali-Gaming is an entertainment and social rewards platform. Rewards, badges, titles, and XP are strictly cosmetic digital perks for community use.
          </p>

          <div className="flex items-center gap-2 text-slate-300 font-medium">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-bounce" />
            <span>and Kali Gaming</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
