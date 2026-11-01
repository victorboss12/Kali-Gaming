"use client";

import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Gamepad2,
  Users,
  MessageSquare,
  ShieldCheck,
  Flame,
  ArrowRight,
  Trophy,
  Gift,
  HelpCircle,
  Play,
  Zap,
  Shield,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section with animated casino styling */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4 sm:px-8 border-b border-[#F36E0F]/20">
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center gap-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#F36E0F]/20 border border-[#F36E0F]/50 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold text-[#F36E0F] animate-pulse shadow-[0_0_15px_rgba(243,110,15,0.4)]">
            <Sparkles className="w-4 h-4 text-[#F6FF00]" />
            #1 Social Casino Gaming & VIP Rewards Platform
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(243,110,15,0.6)]">
              Play & Win Now
            </span>
          </h1>

          <p className="text-white sm:text-2xl text-lg max-w-2xl text-slate-200 font-normal leading-relaxed">
            Experience our playable <strong>In-House Fishing Casino Game</strong>, spin the daily rewards wheel, chat 1-on-1 with Staff, and explore 15 top sweepstakes titles!
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
            <Link
              href="/games/fishing"
              className="flex items-center gap-2 text-black bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:scale-105 min-w-[210px] h-[58px] px-6 rounded-xl text-lg font-black shadow-[0_0_25px_rgba(243,110,15,0.6)] transition-all duration-300 justify-center"
            >
              <Play className="w-5 h-5 fill-black" />
              Play Fishing Game
            </Link>

            <Link
              href="/wheel"
              className="flex items-center gap-2 text-white bg-[#142055] hover:bg-[#1b2a7a] border border-[#2a3c91] hover:border-[#F36E0F] min-w-[190px] h-[58px] px-6 rounded-xl text-lg font-bold transition-all duration-300 justify-center"
            >
              <Sparkles className="w-5 h-5 text-[#F6FF00]" />
              Spin Daily Wheel
            </Link>

            <Link
              href="/messages"
              className="flex items-center gap-2 text-white border border-[#FFD700]/30 hover:border-[#FFD700] min-w-[170px] h-[58px] px-5 rounded-xl text-base font-bold bg-[#0c163b]/80 backdrop-blur-sm transition-all duration-300 justify-center text-[#FFD700]"
            >
              <MessageSquare className="w-5 h-5" />
              Chat With Admin
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12 bg-[#0c163b]/80 border border-[#1b2a7a] rounded-2xl p-4 sm:p-6 backdrop-blur-lg shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F36E0F]">24,500+</span>
              <span className="text-xs sm:text-sm text-slate-400">Active Players</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#FFD700]">60 FPS</span>
              <span className="text-xs sm:text-sm text-slate-400">In-House Fish Table</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">Direct</span>
              <span className="text-xs sm:text-sm text-slate-400">1-on-1 Admin Chat</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-purple-400">150x</span>
              <span className="text-xs sm:text-sm text-slate-400">Boss Jackpot Multiplier</span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured In-House Fishing Game Spotlight */}
      <section className="py-16 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-[#0c163b] via-[#142055] to-[#0c163b] border-2 border-[#00D2FF]/50 rounded-3xl p-8 sm:p-12 shadow-[0_0_50px_rgba(0,210,255,0.2)] relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="flex flex-col gap-4 text-left">
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#00D2FF] tracking-wider uppercase bg-[#1f3078] px-3 py-1 rounded-full w-fit">
                <Zap className="w-4 h-4" /> Platform Original Casino Game
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Kali Fishing Hunter <br />
                <span className="text-[#FFD700]">Deep Ocean Casino Arena</span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Take command of the high-velocity energy cannon! Aim at swimming species with up to 150x payouts, unleash Freeze Bombs and Hyper Lasers, and reload your demo coins anytime for endless arcade excitement.
              </p>
              <div className="pt-2 flex items-center gap-4">
                <Link
                  href="/games/fishing"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] text-black font-black px-6 py-3.5 rounded-xl shadow-[0_0_20px_rgba(243,110,15,0.5)] transition-all hover:scale-105"
                >
                  <Play className="w-5 h-5 fill-black" />
                  Launch Fishing Game
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/games"
                  className="text-xs font-bold text-slate-300 hover:text-white underline"
                >
                  View All Games
                </Link>
              </div>
            </div>

            {/* Fish Game Visual Mockup */}
            <div className="flex justify-center items-center">
              <div className="w-full max-w-sm h-64 rounded-2xl bg-[#030c22] border border-[#00D2FF]/40 shadow-2xl flex flex-col items-center justify-center p-6 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c163b]/90 to-transparent pointer-events-none" />
                <div className="w-16 h-16 rounded-full bg-[#F36E0F] flex items-center justify-center text-black font-black mb-3 shadow-[0_0_20px_#F36E0F]">
                  <Play className="w-8 h-8 fill-black translate-x-0.5" />
                </div>
                <h4 className="text-lg font-black text-white relative z-10">Instant Browser Play</h4>
                <p className="text-xs text-slate-300 relative z-10 mt-1">
                  No downloads needed. 60 FPS HTML5 Canvas engine with synthesized sound effects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct 1-on-1 Admin Chat Highlight */}
      <section className="py-16 px-4 sm:px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold text-[#F36E0F] tracking-widest uppercase">VIP Player Service</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Direct 1-on-1 Chat With Admin</h2>
            <p className="text-slate-300 text-sm mt-2">
              Skip public noise. Every player gets a private encrypted communication channel directly with the Kali Platform Administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#FFD700]/20 border border-[#FFD700]/40 flex items-center justify-center text-[#FFD700]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Direct Admin Access</h3>
              <p className="text-slate-300 text-sm">
                Message our official platform admin for instant game setup, questions, or VIP rewards verification.
              </p>
              <Link href="/messages" className="text-sm font-semibold text-[#FFD700] hover:underline mt-auto pt-2">
                Chat with Admin Now →
              </Link>
            </div>

            <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F36E0F]/20 border border-[#F36E0F]/40 flex items-center justify-center text-[#F36E0F]">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Daily Welcome Wheel</h3>
              <p className="text-slate-300 text-sm">
                Spin once every 24 hours to win high-roller badges, neon avatar frames, cosmic titles, and platform XP.
              </p>
              <Link href="/wheel" className="text-sm font-semibold text-[#F36E0F] hover:underline mt-auto pt-2">
                Spin The Wheel →
              </Link>
            </div>

            <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">15 Partner Sweepstakes</h3>
              <p className="text-slate-300 text-sm">
                Access external favorites including Milkyway, Juwa, Firekirin, Orion Stars, Gamevault, and Cash Frenzy.
              </p>
              <Link href="/games" className="text-sm font-semibold text-purple-400 hover:underline mt-auto pt-2">
                Browse Partner Games →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
