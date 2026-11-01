"use client";

import React, { useRef, useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { Sparkles, Trophy, Award, Gift, AlertCircle, X, ShieldCheck } from "lucide-react";
import { WheelSegment } from "@/lib/rng";

interface SpinningWheelProps {
  segments: WheelSegment[];
  canSpin: boolean;
  cooldownRemainingSeconds: number;
  onSpinSuccess: (result: any) => void;
  requiresLogin?: boolean;
}

export default function SpinningWheel({
  segments,
  canSpin,
  cooldownRemainingSeconds,
  onSpinSuccess,
  requiresLogin,
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

  // Draw the high-fidelity Wheel on HTML5 Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 16;
    const numSegments = segments.length || 8;
    const arc = (2 * Math.PI) / numSegments;

    ctx.clearRect(0, 0, size, size);

    // Save and rotate context for wheel rotation
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((currentRotation * Math.PI) / 180);

    // Outer Gold Ring with studs
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, 2 * Math.PI);
    ctx.fillStyle = "#1b2a7a";
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#F36E0F";
    ctx.stroke();

    // Draw individual segments
    for (let i = 0; i < numSegments; i++) {
      const seg = segments[i];
      const startAngle = i * arc;
      const endAngle = startAngle + arc;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Alternate / custom fill
      ctx.fillStyle = seg?.colorHex || (i % 2 === 0 ? "#F36E0F" : "#0e1b4d");
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#FFFFFF20";
      ctx.stroke();

      // Segment text labels
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 13px system-ui, sans-serif";
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(seg ? seg.name : `Perk ${i + 1}`, radius - 24, 5);

      // Subtitle / XP value
      if (seg?.xpValue) {
        ctx.fillStyle = "#F6FF00";
        ctx.font = "900 10px system-ui, sans-serif";
        ctx.fillText(`+${seg.xpValue} XP`, radius - 24, 18);
      }
      ctx.restore();
    }

    // Outer edge light studs
    for (let i = 0; i < 24; i++) {
      const studAngle = (i * 2 * Math.PI) / 24;
      const sx = Math.cos(studAngle) * (radius + 4);
      const sy = Math.sin(studAngle) * (radius + 4);
      ctx.beginPath();
      ctx.arc(sx, sy, 3, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? "#F6FF00" : "#FFFFFF";
      ctx.fill();
    }

    ctx.restore();

    // Central fixed glowing hub border
    ctx.beginPath();
    ctx.arc(center, center, 44, 0, 2 * Math.PI);
    ctx.fillStyle = "#0D0D2B";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#F36E0F";
    ctx.stroke();
  }, [currentRotation, segments]);

  const handleSpinClick = async () => {
    if (isSpinning || (!canSpin && cooldown > 0) || requiresLogin) return;

    setIsSpinning(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/wheel/spin", {
        method: "POST",
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
          setRewardModal(data.winningSegment);
          setCooldown(data.cooldownRemainingSeconds || 86400);
          onSpinSuccess(data);

          // Confetti cannons
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#F36E0F", "#F6FF00", "#EA0000", "#FFFFFF"],
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
        {/* Top Fixed Indicator Pointer pointing directly into winning segment */}
        <div className="absolute top-0 z-30 flex flex-col items-center -translate-y-2">
          <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[30px] border-t-[#F6FF00] filter drop-shadow-[0_2px_8px_rgba(246,255,0,0.8)]" />
        </div>

        {/* Glow backdrop ring */}
        <div className="absolute w-[380px] h-[380px] sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-r from-[#F36E0F]/20 to-[#EA0000]/20 blur-2xl -z-10" />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={440}
          height={440}
          className="w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full shadow-[0_0_35px_rgba(0,0,0,0.7)]"
        />

        {/* Center Spin Action Button */}
        <button
          onClick={handleSpinClick}
          disabled={isSpinning || (!canSpin && cooldown > 0) || requiresLogin}
          className={`absolute z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center font-black text-xs sm:text-sm tracking-wider uppercase transition-all duration-300 shadow-2xl ${
            isSpinning
              ? "bg-[#1b2a7a] text-slate-300 cursor-not-allowed scale-95"
              : !canSpin && cooldown > 0
              ? "bg-[#17102D] text-slate-400 border-2 border-slate-600 cursor-not-allowed"
              : "bg-gradient-to-br from-[#F6FF00] via-[#F36E0F] to-[#EA0000] text-black hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(243,110,15,0.7)] animate-pulse"
          }`}
        >
          {isSpinning ? (
            <span className="text-[11px]">SPINNING...</span>
          ) : !canSpin && cooldown > 0 ? (
            <div className="text-center">
              <span className="text-[10px] block font-bold text-amber-400">WAIT</span>
              <span className="text-[9px] font-mono font-bold text-slate-300">
                {formatTimer(cooldown)}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Sparkles className="w-4 h-4 mb-0.5" />
              <span>SPIN</span>
            </div>
          )}
        </button>
      </div>

      {/* Status Bar below wheel */}
      <div className="flex flex-col items-center gap-2">
        {!canSpin && cooldown > 0 ? (
          <div className="text-center bg-[#1b2a7a]/60 border border-[#2a3c91] px-5 py-2.5 rounded-full text-xs text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Next Free Spin In:{" "}
            <strong className="text-amber-300 font-mono text-sm">{formatTimer(cooldown)}</strong>
          </div>
        ) : (
          <div className="text-center bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-5 py-2 rounded-full text-xs font-bold text-[#F36E0F] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F6FF00]" />
            Your Daily Welcome Spin Is Ready!
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
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs font-black uppercase tracking-widest text-[#F6FF00] bg-[#1b2a7a] px-3 py-1 rounded-full">
              Congratulations!
            </span>

            <h2 className="text-2xl sm:text-3xl font-black text-white mt-2">
              {rewardModal.name}
            </h2>

            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {rewardModal.description}
            </p>

            <div className="my-5 p-3.5 bg-[#1b2a7a]/60 border border-[#2a3c91] rounded-2xl flex items-center justify-around text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Reward Type</span>
                <strong className="text-white font-bold">{rewardModal.type}</strong>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">XP Granted</span>
                <strong className="text-[#F6FF00] font-bold">+{rewardModal.xpValue} XP</strong>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Status</span>
                <strong className="text-emerald-400 font-bold">Equipped</strong>
              </div>
            </div>

            <button
              onClick={() => setRewardModal(null)}
              className="w-full bg-[#F36E0F] hover:bg-orange-500 text-black font-black py-3 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider"
            >
              Claim & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
