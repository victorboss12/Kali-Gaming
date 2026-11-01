"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, Award, Gift, AlertCircle, X, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { WheelSegment } from "@/lib/rng";

interface SpinningWheelProps {
  segments: WheelSegment[];
  canSpin: boolean;
  cooldownRemainingSeconds: number;
  onSpinSuccess: (result: any) => void;
  requiresLogin?: boolean;
  wheelType?: "SIGNUP" | "REGULAR";
}

export default function SpinningWheel({
  segments,
  canSpin,
  cooldownRemainingSeconds,
  onSpinSuccess,
  requiresLogin,
  wheelType = "REGULAR",
}: SpinningWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(0);
  const [rewardModal, setRewardModal] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(cooldownRemainingSeconds);

  // Cooldown countdown tick
  useEffect(() => {
    setCooldown(cooldownRemainingSeconds);
  }, [cooldownRemainingSeconds]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Format seconds to HH:MM:SS
  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Draw the high-fidelity Wheel on HTML5 Canvas (880x880 Super-Sampled for Razor-Sharp Text)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width; // 880
    const center = size / 2; // 440
    const outerRim = center - 14; // 426
    const innerRim = outerRim - 28; // 398 (usable slice radius)
    const numSegments = segments.length || 8;
    const arc = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate context for wheel rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // 1. Draw Outer Heavy Metallic Gold Bezel Rim
    const bezelGrad = ctx.createRadialGradient(0, 0, innerRim, 0, 0, outerRim + 12);
    bezelGrad.addColorStop(0, "#1b2a7a");
    bezelGrad.addColorStop(0.3, "#0D153A");
    bezelGrad.addColorStop(0.7, "#D97706");
    bezelGrad.addColorStop(0.9, "#F59E0B");
    bezelGrad.addColorStop(1, "#78350F");

    ctx.beginPath();
    ctx.arc(0, 0, outerRim + 10, 0, 2 * Math.PI);
    ctx.fillStyle = bezelGrad;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#FDE68A";
    ctx.stroke();

    // 2. High-Contrast Segment Palette (Alternating rich jewel tones for ultra readability)
    const segmentThemes = [
      { bg1: "#064e3b", bg2: "#047857", accent: "#34D399", border: "#6EE7B7" }, // Emerald (Freeplay)
      { bg1: "#1e293b", bg2: "#0f172a", accent: "#94A3B8", border: "#E2E8F0" }, // Slate Navy
      { bg1: "#7c2d12", bg2: "#9a3412", accent: "#FB923C", border: "#FDBA74" }, // Fiery Bronze
      { bg1: "#581c87", bg2: "#6b21a8", accent: "#C084FC", border: "#E9D5FF" }, // Royal Violet
      { bg1: "#0f172a", bg2: "#1e1b4b", accent: "#818CF8", border: "#C7D2FE" }, // Deep Indigo
      { bg1: "#831843", bg2: "#9d174d", accent: "#F472B6", border: "#FBCFE8" }, // Crimson Rose
      { bg1: "#713f12", bg2: "#854d0e", accent: "#FACC15", border: "#FEF08A" }, // Golden Amber (Freeplay)
      { bg1: "#1e3a8a", bg2: "#1d4ed8", accent: "#60A5FA", border: "#BFDBFE" }, // Electric Sapphire
    ];

    // 3. Draw individual segments with rich gradients & clear text
    for (let i = 0; i < numSegments; i++) {
      const seg = segments[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;
      const theme = segmentThemes[i % segmentThemes.length];

      // Segment wedge path
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, innerRim, startAngle, endAngle);
      ctx.closePath();

      // Radial wedge gradient (shadow towards center, vivid highlight outwards)
      const wedgeGrad = ctx.createRadialGradient(0, 0, 80, 0, 0, innerRim);
      wedgeGrad.addColorStop(0, "#080c1f");
      wedgeGrad.addColorStop(0.4, theme.bg1);
      wedgeGrad.addColorStop(1, theme.bg2);

      ctx.fillStyle = wedgeGrad;
      ctx.fill();

      // Segment divider line
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.stroke();

      // 4. Render Razor-Sharp, High-Legibility Typography
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // Parse clear display words
      let primaryText = "";
      let secondaryText = "";
      let primaryColor = "#FFFFFF";
      let secondaryColor = "#F6FF00";

      if (seg?.freeplayAmount) {
        primaryText = `$${seg.freeplayAmount} FREE PLAY`;
        secondaryText = "INSTANT CASH";
        primaryColor = "#34D399"; // Crisp Emerald Glow
        secondaryColor = "#FDE68A";
      } else if (seg?.percentage) {
        primaryText = `+${seg.percentage}% BONUS`;
        secondaryText = seg.percentage >= 80 ? "MEGA JACKPOT" : "DEPOSIT MATCH";
        primaryColor = seg.percentage >= 80 ? "#FDE047" : "#FFFFFF";
        secondaryColor = "#FDE68A";
      } else if (seg?.xpValue) {
        primaryText = seg.name;
        secondaryText = `+${seg.xpValue} XP BOOST`;
        primaryColor = "#FFFFFF";
        secondaryColor = "#F6FF00";
      } else {
        primaryText = seg?.name || `PRIZE ${i + 1}`;
        secondaryText = "REWARD";
      }

      const textX = innerRim - 42; // Position text comfortably inside the wedge

      // Primary Prize Label (Big, Ultra-Bold with sharp dark stroke)
      ctx.font = "900 28px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.lineJoin = "round";
      ctx.miterLimit = 2;
      ctx.lineWidth = 6;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
      ctx.strokeText(primaryText, textX, -12);
      ctx.fillStyle = primaryColor;
      ctx.fillText(primaryText, textX, -12);

      // Secondary Category / Bonus Label (Crisp, High-Contrast Subtitle)
      ctx.font = "800 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.95)";
      ctx.strokeText(secondaryText, textX, 18);
      ctx.fillStyle = secondaryColor;
      ctx.fillText(secondaryText, textX, 18);

      ctx.restore();
    }

    // 5. Outer Bezel Studs / Golden Casino Bulbs
    const numStuds = 24;
    for (let i = 0; i < numStuds; i++) {
      const studAngle = (i * 2 * Math.PI) / numStuds;
      const sx = Math.cos(studAngle) * (innerRim + 14);
      const sy = Math.sin(studAngle) * (innerRim + 14);

      // Glowing outer bulb halo
      ctx.beginPath();
      ctx.arc(sx, sy, 7, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "rgba(253, 224, 71, 0.9)" : "rgba(255, 255, 255, 0.95)";
      ctx.shadowColor = i % 2 === 0 ? "#F59E0B" : "#FFFFFF";
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Chrome rim on bulb
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#78350F";
      ctx.stroke();
    }

    // 6. Brass Segment Pegs between wedges
    for (let i = 0; i < numSegments; i++) {
      const pegAngle = i * arc;
      const px = Math.cos(pegAngle) * (innerRim - 2);
      const py = Math.sin(pegAngle) * (innerRim - 2);

      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "#FDE68A";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#451A03";
      ctx.stroke();
    }

    ctx.restore();

    // 7. Fixed Central Metallic Bezel (Border for center spin button)
    const hubGrad = ctx.createRadialGradient(center, center, 40, center, center, 95);
    hubGrad.addColorStop(0, "#080c1f");
    hubGrad.addColorStop(0.7, "#1e293b");
    hubGrad.addColorStop(1, "#D97706");

    ctx.beginPath();
    ctx.arc(center, center, 92, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#FDE68A";
    ctx.stroke();
  }, [currentRotation, segments]);

  const handleSpinClick = async () => {
    if (isSpinning || (!canSpin && cooldown > 0) || requiresLogin) return;

    setIsSpinning(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/wheel/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wheelType }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to spin the wheel");
      }

      // Smooth physics deceleration animation
      const durationMs = 5000;
      const startTime = performance.now();
      const startRot = currentRotation % 360;
      const totalDegrees = data.targetAngle;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        // Cubic-bezier ease-out
        const easeOut = 1 - Math.pow(1 - progress, 4);
        const nextRotation = startRot + totalDegrees * easeOut;

        setCurrentRotation(nextRotation);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Finished spinning! Trigger celebrations
          setIsSpinning(false);
          setRewardModal({
            ...data.winningSegment,
            wheelType: data.wheelType,
            message: data.message,
            isFreeplay: data.isFreeplay,
            percentage: data.percentage,
            freeplayAmount: data.freeplayAmount,
          });
          setCooldown(data.cooldownRemainingSeconds || 0);
          onSpinSuccess(data);

          // Confetti celebration
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ["#F36E0F", "#F6FF00", "#EA0000", "#FFFFFF", "#00FF99"],
          });
        }
      };

      requestAnimationFrame(animate);
    } catch (err: any) {
      setIsSpinning(false);
      setErrorMessage(err.message || "Failed to complete spin");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 relative select-none">
      {errorMessage && (
        <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 px-4 py-2.5 rounded-xl text-xs font-semibold">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          {errorMessage}
        </div>
      )}

      {/* Wheel Canvas Container */}
      <div className="relative flex items-center justify-center">
        {/* Top 3D Metallic Casino Flapper Pointer */}
        <div className="absolute top-0 z-30 flex flex-col items-center -translate-y-3.5 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] pointer-events-none">
          <div className="relative flex flex-col items-center">
            {/* Golden Pin Head with Ruby Center */}
            <div className="w-7 h-7 rounded-full bg-gradient-to-b from-[#FFFDF0] via-[#FBBF24] to-[#B45309] border-2 border-black/80 shadow-md flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-[#991B1B] via-[#DC2626] to-[#F87171] border border-white/60 shadow-inner" />
            </div>
            {/* Golden Tapered Dagger Pointer */}
            <div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[32px] border-t-[#FBBF24] -mt-1 relative">
              <div className="absolute -top-[32px] -left-[9px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[26px] border-t-[#FEF08A] opacity-75" />
            </div>
          </div>
        </div>

        {/* Outer ambient glow halo */}
        <div className="absolute w-[360px] h-[360px] sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-r from-[#F36E0F]/25 via-[#F6FF00]/15 to-[#EA0000]/25 blur-3xl -z-10" />

        {/* 880x880 Super-Sampled Retina Canvas */}
        <canvas
          ref={canvasRef}
          width={880}
          height={880}
          className="w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] rounded-full shadow-[0_0_50px_rgba(0,0,0,0.85)] border-4 border-amber-500/30"
        />

        {/* Central Beveled Spin Action Button */}
        <button
          onClick={handleSpinClick}
          disabled={isSpinning || (!canSpin && cooldown > 0) || requiresLogin}
          className={`absolute z-20 w-[84px] h-[84px] sm:w-[94px] sm:h-[94px] rounded-full flex flex-col items-center justify-center font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-2xl border-4 ${
            isSpinning
              ? "bg-[#1b2a7a] text-slate-300 border-[#2a3c91] cursor-not-allowed scale-95"
              : !canSpin && cooldown > 0
              ? "bg-[#0b132e] text-slate-400 border-slate-700 cursor-not-allowed shadow-none"
              : "bg-gradient-to-br from-[#FEF08A] via-[#F59E0B] to-[#D97706] text-black border-[#FDE68A] hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(245,158,11,0.8)] animate-pulse"
          }`}
        >
          {isSpinning ? (
            <span className="text-[10px] font-black tracking-widest animate-pulse">SPINNING</span>
          ) : !canSpin && cooldown > 0 ? (
            <div className="text-center">
              <span className="text-[9px] block font-bold text-amber-400">WAIT 24H</span>
              <span className="text-[9px] font-mono font-bold text-slate-300">
                {formatTimer(cooldown)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Sparkles className="w-4 h-4 mb-0.5 text-black drop-shadow" />
              <span className="font-black tracking-wider text-black text-sm drop-shadow-sm">SPIN</span>
            </div>
          )}
        </button>
      </div>

      {/* Status Bar below wheel */}
      <div className="flex flex-col items-center gap-2">
        {!canSpin && cooldown > 0 ? (
          <div className="text-center bg-[#1b2a7a]/60 border border-[#2a3c91] px-5 py-2.5 rounded-full text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            24h Cooldown: Next Spin Available In{" "}
            <strong className="text-amber-300 font-mono text-sm">{formatTimer(cooldown)}</strong>
          </div>
        ) : (
          <div className="text-center bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-5 py-2 rounded-full text-xs font-bold text-[#F36E0F] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F6FF00]" />
            {wheelType === "SIGNUP" ? "New Player Welcome Spin Ready! (40% - 90% Match)" : "Daily Free Spin Ready!"}
          </div>
        )}
      </div>

      {/* Celebratory Reward Modal */}
      {rewardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
          <div className="w-full max-w-md bg-gradient-to-b from-[#0e1b4d] to-[#0D0D2B] border-2 border-[#F36E0F] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(243,110,15,0.4)] text-center relative overflow-hidden">
            <button
              onClick={() => setRewardModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Glowing Trophy */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F6FF00] to-[#EA0000] mx-auto flex items-center justify-center text-black mb-4 shadow-[0_0_30px_rgba(243,110,15,0.6)]">
              {rewardModal.freeplayAmount ? (
                <Gift className="w-10 h-10 text-black" />
              ) : (
                <Trophy className="w-10 h-10" />
              )}
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-[#F6FF00] bg-[#1b2a7a] px-3 py-1 rounded-full">
              {rewardModal.wheelType === "SIGNUP" ? "Signup Bonus Revealed!" : "Daily Reward Unlocked!"}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {rewardModal.name}
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {rewardModal.description}
            </p>

            <div className="my-5 p-3.5 bg-[#1b2a7a]/60 border border-[#2a3c91] rounded-2xl flex items-center justify-around text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Reward</span>
                <strong className="text-white font-bold">
                  {rewardModal.freeplayAmount ? `$${rewardModal.freeplayAmount} Free Play` : `${rewardModal.percentage}% Match`}
                </strong>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">XP Granted</span>
                <strong className="text-[#F6FF00] font-bold">+{rewardModal.xpValue} XP</strong>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <strong className="text-emerald-400 font-bold">Active in Account</strong>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {rewardModal.percentage ? (
                <Link
                  href="/deposit"
                  onClick={() => setRewardModal(null)}
                  className="w-full bg-[#F36E0F] hover:bg-orange-500 text-black font-black py-3 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Deposit & Claim +{rewardModal.percentage}% Bonus <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <Link
                  href="/games"
                  onClick={() => setRewardModal(null)}
                  className="w-full bg-[#F6FF00] hover:bg-amber-300 text-black font-black py-3 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  Go To Games Lobby <ArrowRight className="w-4 h-4" />
                </Link>
              )}

              <button
                onClick={() => setRewardModal(null)}
                className="w-full bg-transparent hover:bg-white/5 text-slate-300 text-xs font-semibold py-2 rounded-lg"
              >
                Close & Keep Spinning
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
