"use client";

import React, { useMemo } from "react";

export default function CasinoBackground() {
  // Generate stable deterministic positions for floating casino elements
  const floatingChips = useMemo(
    () => [
      { id: 1, top: "8%", left: "4%", size: 68, delay: "0s", duration: "16s", color: "#F36E0F" },
      { id: 2, top: "18%", right: "6%", size: 84, delay: "3s", duration: "20s", color: "#FFD700" },
      { id: 3, top: "45%", left: "2%", size: 60, delay: "5s", duration: "18s", color: "#EA0000" },
      { id: 4, top: "68%", right: "4%", size: 76, delay: "2s", duration: "22s", color: "#F36E0F" },
      { id: 5, top: "85%", left: "7%", size: 70, delay: "4s", duration: "19s", color: "#00D2FF" },
      { id: 6, top: "35%", right: "12%", size: 54, delay: "7s", duration: "17s", color: "#FFD700" },
    ],
    []
  );

  const floatingSuits = useMemo(
    () => [
      { id: 1, symbol: "♠", top: "12%", left: "22%", size: 48, delay: "1s", duration: "21s", color: "#00D2FF" },
      { id: 2, symbol: "♥", top: "28%", right: "25%", size: 52, delay: "4s", duration: "19s", color: "#EA0000" },
      { id: 3, symbol: "♦", top: "58%", left: "18%", size: 44, delay: "2s", duration: "23s", color: "#FFD700" },
      { id: 4, symbol: "♣", top: "75%", right: "22%", size: 50, delay: "6s", duration: "20s", color: "#F36E0F" },
      { id: 5, symbol: "7", top: "88%", right: "45%", size: 56, delay: "3s", duration: "25s", color: "#F6FF00" },
      { id: 6, symbol: "★", top: "4%", right: "42%", size: 38, delay: "5s", duration: "18s", color: "#FFD700" },
    ],
    []
  );

  const goldDust = useMemo(
    () => [
      { id: 1, top: "15%", left: "35%", delay: "0s", duration: "4s" },
      { id: 2, top: "25%", left: "70%", delay: "1.5s", duration: "5s" },
      { id: 3, top: "40%", left: "50%", delay: "2s", duration: "3.5s" },
      { id: 4, top: "65%", left: "30%", delay: "0.8s", duration: "4.5s" },
      { id: 5, top: "80%", left: "60%", delay: "2.5s", duration: "6s" },
      { id: 6, top: "50%", left: "85%", delay: "1.2s", duration: "4s" },
      { id: 7, top: "92%", left: "15%", delay: "3s", duration: "5s" },
    ],
    []
  );

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none"
    >
      {/* Base Deep Casino Gradients */}
      <div className="absolute inset-0 bg-[#070719]" />
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#F36E0F]/10 via-[#1b2a7a]/20 to-transparent rounded-full blur-3xl animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-gradient-to-tl from-[#EA0000]/10 via-[#142055]/30 to-transparent rounded-full blur-3xl animate-pulse [animation-duration:10s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[#FFD700]/5 to-[#F36E0F]/5 rounded-full blur-[140px]" />

      {/* Subtle Casino Table Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #FFD700 1px, transparent 1px), linear-gradient(to bottom, #FFD700 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating Animated Casino Chips */}
      {floatingChips.map((chip) => (
        <div
          key={chip.id}
          className="absolute animate-casino-chip"
          style={{
            top: chip.top,
            left: (chip as any).left,
            right: (chip as any).right,
            width: `${chip.size}px`,
            height: `${chip.size}px`,
            animationDelay: chip.delay,
            animationDuration: chip.duration,
          }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_12px_rgba(243,110,15,0.4)]">
            <circle cx="50" cy="50" r="46" fill="#0D0D2B" stroke={chip.color} strokeWidth="6" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
            <circle cx="50" cy="50" r="26" fill={chip.color} opacity="0.3" />
            <circle cx="50" cy="50" r="16" fill="#0D0D2B" stroke={chip.color} strokeWidth="3" />
            <text x="50" y="55" textAnchor="middle" fill={chip.color} fontSize="14" fontWeight="900" fontFamily="sans-serif">
              KALI
            </text>
          </svg>
        </div>
      ))}

      {/* Floating Neon Casino Card Suits */}
      {floatingSuits.map((item) => (
        <div
          key={item.id}
          className="absolute animate-casino-suit font-black filter drop-shadow-[0_0_15px_currentColor]"
          style={{
            top: item.top,
            left: (item as any).left,
            right: (item as any).right,
            fontSize: `${item.size}px`,
            color: item.color,
            animationDelay: item.delay,
            animationDuration: item.duration,
          }}
        >
          {item.symbol}
        </div>
      ))}

      {/* Twinkling Gold Dust Particles */}
      {goldDust.map((dust) => (
        <div
          key={dust.id}
          className="absolute w-2 h-2 rounded-full bg-[#FFD700] blur-[1px] animate-ping"
          style={{
            top: dust.top,
            left: dust.left,
            animationDelay: dust.delay,
            animationDuration: dust.duration,
            opacity: 0.4,
          }}
        />
      ))}
    </div>
  );
}
