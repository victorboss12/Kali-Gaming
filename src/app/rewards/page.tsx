"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  Gift,
  Award,
  Sparkles,
  History,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Zap,
} from "lucide-react";

export default function RewardsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchRewards = async () => {
    try {
      const res = await fetch("/api/rewards");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40] text-white py-12 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-[#F36E0F] uppercase tracking-widest bg-[#1b2a7a] px-3 py-1 rounded-full">
              Rewards & Loyalty Hub
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white mt-1">Perks & Promotion History</h1>
            <p className="text-slate-300 text-sm max-w-xl mt-1">
              Track your unlocked VIP badges, cosmetic rewards, and auditable spin history.
            </p>
          </div>

          <Link
            href="/wheel"
            className="bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 hover:scale-105"
          >
            <Sparkles className="w-4 h-4" /> Spin Daily Wheel
          </Link>
        </div>

        {/* Section 1: Unlocked Badges Shelf */}
        <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Award className="w-6 h-6 text-[#F36E0F]" /> Your Unlocked Perks ({data?.userRewards?.length || 0})
            </h2>
            {user && (
              <span className="text-xs bg-[#1b2a7a] text-amber-300 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> Total XP: {user.xp}
              </span>
            )}
          </div>

          {data?.userRewards?.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.userRewards.map((ur: any) => (
                <div
                  key={ur.id}
                  className="bg-[#1b2a7a]/50 border border-[#2a3c91] hover:border-[#F36E0F] rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg"
                      style={{ backgroundColor: ur.reward.colorHex || "#F36E0F" }}
                    >
                      <Sparkles className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ur.reward.name}</h4>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                        Equipped on Profile
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{ur.reward.description}</p>

                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                    <span>+{ur.reward.xpValue} XP</span>
                    <span>{new Date(ur.acquiredAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-[#0D0D2B]/50 rounded-2xl border border-dashed border-white/10 flex flex-col items-center gap-3">
              <Award className="w-10 h-10 text-slate-500" />
              <p className="text-sm text-slate-400">No rewards unlocked yet.</p>
              <Link
                href="/wheel"
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-white text-xs font-bold px-4 py-2 rounded-lg"
              >
                Spin the Welcome Wheel
              </Link>
            </div>
          )}
        </div>

        {/* Section 2: All Available Platform Rewards */}
        <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <Gift className="w-6 h-6 text-amber-400" /> Available Wheel Reward Pool
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {data?.definitions?.map((def: any) => (
              <div
                key={def.id}
                className="bg-[#17102D] border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: def.colorHex }}
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    Segment #{def.segmentIndex}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{def.name}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{def.description}</p>
                <div className="text-[11px] font-bold text-[#F36E0F]">+{def.xpValue} Platform XP</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Spin & Claim Audit History */}
        <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-xl font-black text-white flex items-center gap-2 mb-6">
            <History className="w-6 h-6 text-purple-400" /> Auditable Spin History
          </h2>

          {data?.spinHistory?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1b2a7a] text-slate-300 uppercase tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-lg">Timestamp</th>
                    <th className="p-3">Reward Won</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">XP Granted</th>
                    <th className="p-3 rounded-r-lg">Server Audit Seed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {data.spinHistory.map((spin: any) => (
                    <tr key={spin.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-slate-400">
                        {new Date(spin.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-white flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: spin.reward.colorHex }}
                        />
                        {spin.reward.name}
                      </td>
                      <td className="p-3">
                        <span className="bg-[#2a3c91] px-2 py-0.5 rounded text-[10px] font-bold">
                          {spin.reward.type}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-[#F6FF00]">+{spin.reward.xpValue} XP</td>
                      <td className="p-3 font-mono text-slate-400 truncate max-w-[140px]">
                        {spin.serverSeed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-8 text-xs text-slate-400 italic">
              No spin history on record. Spin the wheel to generate your first audit log!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
