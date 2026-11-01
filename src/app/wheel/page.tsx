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
  Zap,
  Clock,
  Flame,
  Crown,
  DollarSign,
  TrendingUp,
} from "lucide-react";

export default function WheelPage() {
  const { user, refreshUser } = useAuth();
  const [wheelStatus, setWheelStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"SIGNUP" | "REGULAR">("SIGNUP");

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/wheel/status");
      if (res.ok) {
        const data = await res.json();
        setWheelStatus(data);
        // Default to active recommended mode if not set yet
        if (data.activeWheelMode) {
          setActiveTab(data.activeWheelMode);
        }
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

  // Determine segments and spin eligibility based on active tab
  const isSignupTab = activeTab === "SIGNUP";
  const signupInfo = wheelStatus?.signup;
  const regularInfo = wheelStatus?.regular;

  const currentSegments = isSignupTab
    ? signupInfo?.segments || []
    : regularInfo?.segments || [];

  const currentCanSpin = isSignupTab
    ? signupInfo?.canSpin ?? true
    : regularInfo?.canSpin ?? true;

  const currentCooldown = isSignupTab
    ? 0
    : regularInfo?.cooldownRemainingSeconds ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40] text-white py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
        {/* Title Banner */}
        <div className="text-center max-w-2xl flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#F36E0F]">
            <Gift className="w-4 h-4 text-[#F6FF00]" /> Kali Casino Rewards Wheel
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Spin To Win <span className="text-[#F36E0F]">Bonuses & Freeplay</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Spin for massive signup deposit bonuses of 40% to 90%, or claim your 24h daily wheel for Freeplay & deposit matches!
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#0D0D2B]/80 p-1.5 rounded-2xl border border-white/10 shadow-xl max-w-md w-full">
          <button
            onClick={() => setActiveTab("SIGNUP")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "SIGNUP"
                ? "bg-gradient-to-r from-[#F36E0F] to-[#EA0000] text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F6FF00]" />
            Signup Bonus Wheel
            {signupInfo?.claimed && (
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full text-emerald-400">
                Claimed
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("REGULAR")}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === "REGULAR"
                ? "bg-gradient-to-r from-[#1b2a7a] to-[#2a3c91] text-white border border-[#F36E0F]/40 shadow-lg shadow-blue-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Flame className="w-4 h-4 text-[#F36E0F]" />
            Daily Bonus Wheel
            {regularInfo?.cooldownRemainingSeconds > 0 && (
              <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full text-amber-400 font-mono">
                24h Cooldown
              </span>
            )}
          </button>
        </div>

        {/* Dynamic Mode Explanatory Card */}
        {isSignupTab ? (
          <div className="w-full max-w-xl bg-gradient-to-r from-[#F36E0F]/15 via-[#1b2a7a]/30 to-[#EA0000]/15 border border-[#F36E0F]/30 rounded-2xl p-4 text-center">
            <span className="text-xs uppercase tracking-widest text-[#F6FF00] font-black block mb-1">
              🎉 New Player Welcome Promotion
            </span>
            <p className="text-sm font-bold text-white">
              Every new player is guaranteed a first deposit match between <span className="text-[#F6FF00]">40% and 90%</span>!
            </p>
            {signupInfo?.claimed ? (
              <div className="mt-3 inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> You won a +{signupInfo.percentage}% Welcome Match Bonus!{" "}
                <Link href="/deposit" className="underline text-white hover:text-emerald-200">
                  Deposit to apply
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-300 mt-1">
                One-time spin for all newly registered players. Reveals your exact deposit bonus multiplier.
              </p>
            )}
          </div>
        ) : (
          <div className="w-full max-w-xl bg-[#0e1b4d]/80 border border-[#2a3c91] rounded-2xl p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F36E0F]" />
                <span className="text-slate-300">
                  Renew Interval: <strong className="text-white">Strict 24 Hours</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F6FF00]" />
                <span className="text-slate-300">
                  Freeplay Odds:{" "}
                  <strong className={regularInfo?.boostActive ? "text-emerald-400 font-bold" : "text-[#F6FF00] font-bold"}>
                    {regularInfo ? `${Math.round(regularInfo.freeplayOdds * 100)}%` : "10% - 80%"}
                  </strong>
                </span>
                {regularInfo?.boostActive && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    🚀 Boost Active
                  </span>
                )}
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 block">Has Played Freeplay:</span>
                <strong className="text-white">
                  {regularInfo?.hasPlayedFreeplay ? "Yes (Base 10% rate)" : "No (80% Welcome rate)"}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Deposits After Freeplay:</span>
                <strong className="text-white">
                  {regularInfo?.depositsAfterFreeplay ?? 0} {regularInfo?.depositsAfterFreeplay > 3 ? "(> 3, Boosted to 80%!)" : "(<= 3, 10% rate)"}
                </strong>
              </div>
            </div>
          </div>
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
                    <span className="font-bold text-white block">Guest Mode Preview</span>
                    <span className="text-slate-300">Sign in to claim your signup bonus and spin the wheel.</span>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-black px-4 py-2 rounded-lg whitespace-nowrap"
                >
                  Log In To Spin
                </Link>
              </div>
            ) : null}

            <SpinningWheel
              segments={currentSegments}
              canSpin={currentCanSpin}
              cooldownRemainingSeconds={currentCooldown}
              onSpinSuccess={handleSpinSuccess}
              requiresLogin={!user}
              wheelType={activeTab}
            />
          </div>
        )}

        {/* Rules & Eligibility Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#F36E0F] font-bold text-sm">
              <Gift className="w-4 h-4" /> 40% - 90% Signup Match
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              New players get an exclusive spin awarding 40% to 90% match on their very first deposit. Claimable once per account.
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Clock className="w-4 h-4" /> 24h Daily Cooldown
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              The regular bonus wheel does not renew if used within 24 hours. Check back daily to spin for Freeplay or 20% - 50% deposit bonus.
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <TrendingUp className="w-4 h-4" /> 10% to 80% Freeplay Odds
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Players who played freeplay have a 10% freeplay chance. Depositing more than 3 times boosts your freeplay odds up to 80%!
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
            href="/rewards"
            className="font-bold text-[#F36E0F] hover:text-orange-400 flex items-center gap-1.5 group"
          >
            <Award className="w-4 h-4" />
            View Your Earned Rewards
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
