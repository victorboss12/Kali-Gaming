"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import SpinningWheel from "@/components/wheel/SpinningWheel";
import { Sparkles, Gift, ShieldAlert, Award, ArrowRight, HelpCircle, CheckCircle2 } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40] text-white py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
        {/* Title Banner */}
        <div className="text-center max-w-2xl flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#F36E0F]">
            <Gift className="w-4 h-4 text-[#F6FF00]" /> Welcome Bonus Wheel
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Spin The <span className="text-[#F36E0F]">Kali Rewards</span> Wheel
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Claim your daily free spin! Win exclusive profile badges, XP multipliers, glowing avatar frames, and cosmic VIP titles.
          </p>
        </div>

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
                    <span className="text-slate-300">Sign in to save your rewards and badges to your profile.</span>
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
              segments={wheelStatus?.segments || []}
              canSpin={wheelStatus?.canSpin ?? true}
              cooldownRemainingSeconds={wheelStatus?.cooldownRemainingSeconds ?? 0}
              onSpinSuccess={handleSpinSuccess}
              requiresLogin={!user}
            />
          </div>
        )}

        {/* Rules & Eligibility Cards */}
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[#F36E0F] font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> 100% Free Daily Spin
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every verified Kali-Gaming player receives 1 free spin every 24 hours. No deposit or purchase is ever required.
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <Award className="w-4 h-4" /> Non-Cash Entertainment
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Rewards are strictly social and cosmetic badges, platform XP, and chat perks. Wager-linked free play credits are prohibited.
            </p>
          </div>

          <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <ShieldAlert className="w-4 h-4" /> Server RNG Audited
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Winning segments are determined by cryptographically secure random generation on our backend before the wheel halts.
            </p>
          </div>
        </div>

        {/* Bottom CTA to Rewards Hub */}
        <div className="flex items-center gap-2">
          <Link
            href="/rewards"
            className="text-sm font-bold text-[#F36E0F] hover:text-orange-400 flex items-center gap-1 group"
          >
            View Your Earned Rewards & Badges Shelf
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
