"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SpinningWheel from "@/components/wheel/SpinningWheel";
import {
  Sparkles,
  Gift,
  ShieldAlert,
  Award,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  Crown,
  DollarSign,
  TrendingUp,
  Zap,
} from "lucide-react";

export default function WheelPage() {
  const { user, refreshUser } = useAuth();
  const [wheelStatus, setWheelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/wheel/status");
      if (res.ok) {
        const data = await res.json();
        setWheelStatus(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSpinSuccess = async (result: any) => {
    await refreshUser();
    fetchStatus();
  };

  // Rule: Signup wheel is shown ONLY in the signup time.
  // After once used, use ONLY the regular bonus wheel.
  // Don't include signup bonus in the regular wheel.
  const hasClaimedSignup = Boolean(
    user?.hasClaimedSignupBonus || wheelStatus?.hasClaimedSignupBonus || wheelStatus?.signup?.claimed
  );
  const showSignupWheel = Boolean(user && !hasClaimedSignup);

  const regularInfo = wheelStatus?.regular;
  const signupInfo = wheelStatus?.signup;

  const currentSegments = showSignupWheel
    ? signupInfo?.segments || []
    : regularInfo?.segments || [];

  const currentCanSpin = showSignupWheel
    ? signupInfo?.canSpin ?? true
    : regularInfo?.canSpin ?? true;

  const currentCooldown = showSignupWheel
    ? 0
    : regularInfo?.cooldownRemainingSeconds ?? 0;

  const activeBonusPercent = user?.signupBonusPercent || user?.activeDepositBonus;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40] text-white py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
        {/* ==================================================== */}
        {/* CASE A: BRAND NEW PLAYER (SIGNUP TIME WHEEL ONLY)    */}
        {/* ==================================================== */}
        {showSignupWheel ? (
          <>
            <div className="text-center max-w-2xl flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#F36E0F]">
                <Sparkles className="w-4 h-4 text-[#F6FF00]" /> Welcome to Kali-Gaming!
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white">
                Spin Your <span className="text-[#F36E0F]">Signup Bonus</span> Wheel
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Welcome gift for newly registered players! Spin to reveal your starting deposit bonus between{" "}
                <strong className="text-[#F6FF00]">40% and 90%</strong>.
              </p>
            </div>

            <div className="w-full max-w-xl bg-gradient-to-r from-[#F36E0F]/20 via-[#1b2a7a]/40 to-[#EA0000]/20 border border-[#F36E0F]/40 rounded-2xl p-4 text-center">
              <span className="text-xs uppercase tracking-widest text-[#F6FF00] font-black block mb-1">
                ⭐ One-Time Welcome Perk
              </span>
              <p className="text-xs text-slate-200">
                This signup wheel is available only once at registration. After spinning, this wheel is retired and your account unlocks the <strong>Daily Regular Bonus Wheel</strong>.
              </p>
            </div>
          </>
        ) : (
          /* ==================================================== */
          /* CASE B: REGULAR BONUS WHEEL (AFTER ONCE USED)        */
          /* ==================================================== */
          <>
            <div className="text-center max-w-2xl flex flex-col items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-[#1b2a7a] border border-[#2a3c91] px-4 py-1.5 rounded-full text-xs font-bold text-slate-200">
                <Flame className="w-4 h-4 text-[#F36E0F]" /> Daily Kali Rewards Wheel
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white">
                Daily <span className="text-[#F36E0F]">Bonus & Freeplay</span> Spinner
              </h1>
              <p className="text-slate-300 text-sm sm:text-base">
                Spin daily every 24 hours to win <strong className="text-emerald-400">Free Play ($3 to $5)</strong> or a <strong className="text-[#F6FF00]">20% to 50%</strong> match on your next deposit!
              </p>
            </div>

            {/* Active Bonus Callout */}
            {activeBonusPercent && (
              <div className="w-full max-w-xl bg-emerald-500/15 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-emerald-400 block font-bold">
                      Active In Your Account
                    </span>
                    <strong className="text-sm text-white">
                      +{activeBonusPercent}% Bonus Match On Next Deposit
                    </strong>
                  </div>
                </div>
                <Link
                  href="/deposit"
                  className="bg-[#25C974] hover:bg-emerald-400 text-black text-xs font-black px-4 py-2 rounded-xl whitespace-nowrap shadow-md"
                >
                  Deposit Now →
                </Link>
              </div>
            )}

            {/* Live Algorithm Statistics Box */}
            <div className="w-full max-w-xl bg-[#0e1b4d]/80 border border-[#2a3c91] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F36E0F]" />
                  <span className="text-slate-300">
                    Interval: <strong className="text-white">Strict 24h Non-Renewal</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#F6FF00]" />
                  <span className="text-slate-300">
                    Freeplay Odds:{" "}
                    <strong className={regularInfo?.boostActive ? "text-emerald-400 font-bold" : "text-[#F6FF00] font-bold"}>
                      {regularInfo ? `${Math.round(regularInfo.freeplayOdds * 100)}%` : "10% / 80%"}
                    </strong>
                  </span>
                  {regularInfo?.boostActive && (
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                      🚀 Boost Active
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                <div>
                  <span className="text-slate-400 block">Freeplay Played:</span>
                  <strong className="text-white">
                    {regularInfo?.hasPlayedFreeplay ? "Yes (10% base rate)" : "No (80% welcome rate)"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Deposits After Freeplay:</span>
                  <strong className="text-white">
                    {regularInfo?.depositsAfterFreeplay ?? 0} {regularInfo?.depositsAfterFreeplay > 3 ? "(> 3, Boosted to 80%!)" : "(<= 3, 10% rate)"}
                  </strong>
                </div>
              </div>

              <div className="bg-[#060B1A]/60 rounded-xl p-2.5 border border-white/5 text-[11px] text-slate-300 flex items-center justify-between">
                <span>Freeplay Value Split:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  80% chance of $3 • 20% chance of $4 or $5
                </span>
              </div>
            </div>
          </>
        )}

        {/* Wheel Box */}
        {loading ? (
          <div className="py-24 text-center text-[#F36E0F] font-bold">
            <div className="w-12 h-12 border-4 border-[#F36E0F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading Wheel Engine...
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {!user ? (
              <div className="mb-6 p-4 bg-[#1b2a7a]/60 border border-[#F36E0F]/40 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 max-w-xl w-full">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-6 h-6 text-[#F6FF00]" />
                  <div className="text-left text-xs">
                    <span className="font-bold text-white block">New to Kali-Gaming?</span>
                    <span className="text-slate-300">Register now to spin the exclusive 40% - 90% Signup Wheel!</span>
                  </div>
                </div>
                <Link
                  href="/signup"
                  className="bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-black px-4 py-2 rounded-lg whitespace-nowrap"
                >
                  Create Account
                </Link>
              </div>
            ) : null}

            <SpinningWheel
              segments={currentSegments}
              canSpin={currentCanSpin}
              cooldownRemainingSeconds={currentCooldown}
              onSpinSuccess={handleSpinSuccess}
              requiresLogin={!user}
              wheelType={showSignupWheel ? "SIGNUP" : "REGULAR"}
            />
          </div>
        )}

        {/* Rules & Eligibility Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#F36E0F] font-bold text-sm">
              <Gift className="w-4 h-4" /> Signup Wheel (Signup Only)
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              New players spin once upon signup for a guaranteed 40% to 90% deposit match. Once claimed, your account permanently switches to the daily regular wheel.
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" /> Max $3 to $5 Free Play
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Regular wheel freeplays are strictly $3 to $5: 80% chance for $3, and 20% chance for $4 or $5. Freeplay success rate jumps to 80% after &gt;3 deposits!
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4" /> 24h Non-Renewal Interval
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The daily wheel never renews if used within 24 hours. All non-freeplay outcomes award 20% to 50% deposit match on your next deposit.
            </p>
          </div>
        </div>

        {/* Bottom CTA to Deposit & Rewards */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          <Link
            href="/deposit"
            className="font-bold text-[#F6FF00] hover:text-amber-300 flex items-center gap-1.5 group"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Go To Cashier & Deposit
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <span className="text-white/20">|</span>
          <Link
            href="/games"
            className="font-bold text-[#F36E0F] hover:text-orange-400 flex items-center gap-1.5 group"
          >
            <Flame className="w-4 h-4" />
            Explore Casino Games Lobby
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
