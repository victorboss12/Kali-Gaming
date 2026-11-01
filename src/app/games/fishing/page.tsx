"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Volume2,
  VolumeX,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  Zap,
  Snowflake,
  Shield,
  Crosshair,
  Trophy,
  Maximize2,
} from "lucide-react";

// Web Audio API Sound Synthesizer for 100% self-contained gaming audio
class SoundEffects {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    // Lazy init on first user interaction
  }

  private init() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  public playLaser() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {}
  }

  public playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {}
  }

  public playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.25, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
      });
    } catch {}
  }

  public playBossDefeat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.3, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.35);
      });
    } catch {}
  }
}

interface Fish {
  id: number;
  type: "guppy" | "clownfish" | "angel" | "puffer" | "shark" | "leviathan";
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  multiplier: number;
  radius: number;
  color: string;
  isBoss?: boolean;
}

interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  bet: number;
  radius: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
}

interface Floater {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
}

export default function FishingGamePage() {
  const { user, refreshUser } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [soundManager] = useState(() => new SoundEffects());
  const [soundOn, setSoundOn] = useState(true);
  const [coins, setCoins] = useState(1000);
  const [score, setScore] = useState(0);
  const [bet, setBet] = useState(10);
  const [freezeActive, setFreezeActive] = useState(false);
  const [autoFire, setAutoFire] = useState(false);
  const [bigWinMessage, setBigWinMessage] = useState<string | null>(null);

  // Mutable Game Engine state
  const gameState = useRef<{
    cannonAngle: number;
    fishList: Fish[];
    bullets: Bullet[];
    particles: Particle[];
    floaters: Floater[];
    freezeEndTime: number;
    lastShotTime: number;
    lastFishSpawnTime: number;
    nextFishId: number;
    nextBulletId: number;
    nextFloaterId: number;
    mousePos: { x: number; y: number };
  }>({
    cannonAngle: -Math.PI / 2,
    fishList: [],
    bullets: [],
    particles: [],
    floaters: [],
    freezeEndTime: 0,
    lastShotTime: 0,
    lastFishSpawnTime: 0,
    nextFishId: 1,
    nextBulletId: 1,
    nextFloaterId: 1,
    mousePos: { x: 480, y: 100 },
  });

  const betLevels = [10, 25, 50, 100];

  const toggleSound = () => {
    soundManager.enabled = !soundOn;
    setSoundOn(!soundOn);
  };

  const reloadCoins = () => {
    setCoins((prev) => prev + 1000);
    soundManager.playCoin();
  };

  // Trigger Freeze Wave Power-Up
  const triggerFreeze = () => {
    if (coins < 100) return;
    setCoins((prev) => prev - 100);
    gameState.current.freezeEndTime = Date.now() + 5000;
    setFreezeActive(true);
    soundManager.playBossDefeat();
    setTimeout(() => setFreezeActive(false), 5000);
  };

  // Trigger Hyper Laser Screen Wipe
  const triggerLaser = () => {
    if (coins < 250) return;
    setCoins((prev) => prev - 250);
    soundManager.playLaser();

    // Damage all fish on screen
    let totalWon = 0;
    gameState.current.fishList.forEach((fish) => {
      fish.hp -= 10;
      if (fish.hp <= 0) {
        totalWon += fish.multiplier * bet;
      }
    });

    if (totalWon > 0) {
      setCoins((prev) => prev + totalWon);
      setScore((prev) => prev + totalWon);
      soundManager.playCoin();
      setBigWinMessage(`HYPER LASER WIPEOUT: +${totalWon} COINS!`);
      setTimeout(() => setBigWinMessage(null), 3000);
    }
  };

  // Main Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const state = gameState.current;

    // Spawn fish logic
    const spawnFish = (width: number, height: number) => {
      const now = Date.now();
      if (now - state.lastFishSpawnTime < 1200 && state.fishList.length >= 14) return;
      state.lastFishSpawnTime = now;

      const fromLeft = Math.random() < 0.5;
      const x = fromLeft ? -40 : width + 40;
      const y = 50 + Math.random() * (height - 200);
      const speed = 1.2 + Math.random() * 1.6;
      const vx = fromLeft ? speed : -speed;
      const vy = (Math.random() - 0.5) * 0.6;

      const rand = Math.random();
      let fish: Fish;

      if (rand < 0.4) {
        fish = {
          id: state.nextFishId++,
          type: "guppy",
          name: "Golden Guppy",
          x,
          y,
          vx,
          vy,
          hp: 1,
          maxHp: 1,
          multiplier: 2,
          radius: 16,
          color: "#FFD700",
        };
      } else if (rand < 0.65) {
        fish = {
          id: state.nextFishId++,
          type: "clownfish",
          name: "Neon Clownfish",
          x,
          y,
          vx,
          vy,
          hp: 2,
          maxHp: 2,
          multiplier: 4,
          radius: 20,
          color: "#F36E0F",
        };
      } else if (rand < 0.82) {
        fish = {
          id: state.nextFishId++,
          type: "angel",
          name: "Abyssal Angelfish",
          x,
          y,
          vx,
          vy,
          hp: 3,
          maxHp: 3,
          multiplier: 8,
          radius: 24,
          color: "#00D2FF",
        };
      } else if (rand < 0.93) {
        fish = {
          id: state.nextFishId++,
          type: "puffer",
          name: "Spiky Pufferfish",
          x,
          y,
          vx,
          vy,
          hp: 6,
          maxHp: 6,
          multiplier: 15,
          radius: 28,
          color: "#EA0000",
        };
      } else if (rand < 0.98) {
        fish = {
          id: state.nextFishId++,
          type: "shark",
          name: "Hammerhead Shark",
          x,
          y,
          vx: fromLeft ? 1.0 : -1.0,
          vy: (Math.random() - 0.5) * 0.3,
          hp: 15,
          maxHp: 15,
          multiplier: 40,
          radius: 42,
          color: "#8A2BE2",
        };
      } else {
        // Grand Boss: Leviathan!
        fish = {
          id: state.nextFishId++,
          type: "leviathan",
          name: "Kali Golden Leviathan",
          x,
          y: height / 3,
          vx: fromLeft ? 0.8 : -0.8,
          vy: 0.2,
          hp: 45,
          maxHp: 45,
          multiplier: 150,
          radius: 65,
          color: "#F6FF00",
          isBoss: true,
        };
      }

      state.fishList.push(fish);
    };

    // Firing Bullet
    const fireBullet = (targetX: number, targetY: number) => {
      if (coins < bet) return;
      const cannonX = canvas.width / 2;
      const cannonY = canvas.height - 30;

      const angle = Math.atan2(targetY - cannonY, targetX - cannonX);
      state.cannonAngle = angle;

      const speed = 12;
      state.bullets.push({
        id: state.nextBulletId++,
        x: cannonX,
        y: cannonY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        bet,
        radius: 6,
      });

      setCoins((prev) => prev - bet);
      soundManager.playLaser();
    };

    // Canvas click / mouse down listener
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      fireBullet(x, y);
    };

    // Mouse move to rotate cannon
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      state.mousePos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };

      const cannonX = canvas.width / 2;
      const cannonY = canvas.height - 30;
      state.cannonAngle = Math.atan2(state.mousePos.y - cannonY, state.mousePos.x - cannonX);
    };

    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Render loop
    let lastTime = performance.now();

    const loop = (time: number) => {
      animId = requestAnimationFrame(loop);
      const width = canvas.width;
      const height = canvas.height;

      // Auto-fire timer check
      if (autoFire && time - state.lastShotTime > 250) {
        state.lastShotTime = time;
        fireBullet(state.mousePos.x, state.mousePos.y);
      }

      spawnFish(width, height);

      // 1. Draw Deep Ocean Background with Light Caustics
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#030c22");
      grad.addColorStop(0.5, "#061845");
      grad.addColorStop(1, "#020712");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Light caustic rays
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = "#00D2FF";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const offset = Math.sin(time / 1500 + i) * 60;
        ctx.moveTo(150 * i + offset, 0);
        ctx.lineTo(250 * i + offset + 80, height);
        ctx.lineTo(200 * i + offset + 120, height);
        ctx.lineTo(120 * i + offset, 0);
        ctx.fill();
      }
      ctx.restore();

      // Freeze wave overlay effect
      const isFrozen = Date.now() < state.freezeEndTime;
      if (isFrozen) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 210, 255, 0.15)";
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 2. Update and Draw Fish
      for (let i = state.fishList.length - 1; i >= 0; i--) {
        const fish = state.fishList[i];

        if (!isFrozen) {
          fish.x += fish.vx;
          fish.y += fish.vy;
          // Gentle vertical undulating
          fish.y += Math.sin(time / 400 + fish.id) * 0.4;
        }

        // Draw fish body
        ctx.save();
        ctx.translate(fish.x, fish.y);
        if (fish.vx < 0) ctx.scale(-1, 1);

        // Fish glow if boss
        if (fish.isBoss) {
          ctx.shadowColor = "#F6FF00";
          ctx.shadowBlur = 20;
        }

        // Main fish body
        ctx.fillStyle = fish.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, fish.radius, fish.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tail fin
        ctx.beginPath();
        ctx.moveTo(-fish.radius * 0.8, 0);
        ctx.lineTo(-fish.radius * 1.5, -fish.radius * 0.6);
        ctx.lineTo(-fish.radius * 1.5, fish.radius * 0.6);
        ctx.closePath();
        ctx.fill();

        // Eye
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(fish.radius * 0.5, -fish.radius * 0.2, fish.radius * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(fish.radius * 0.55, -fish.radius * 0.2, fish.radius * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Multiplier badge text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `bold ${Math.max(10, Math.floor(fish.radius * 0.4))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`${fish.multiplier}x`, 0, 4);

        // Health bar for tougher fish
        if (fish.maxHp > 1) {
          const barW = fish.radius * 1.6;
          const barH = 4;
          const hpPct = fish.hp / fish.maxHp;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(-barW / 2, -fish.radius * 0.9, barW, barH);
          ctx.fillStyle = hpPct > 0.4 ? "#00FF66" : "#EA0000";
          ctx.fillRect(-barW / 2, -fish.radius * 0.9, barW * hpPct, barH);
        }

        ctx.restore();

        // Remove offscreen fish
        if (
          (fish.vx > 0 && fish.x > width + 100) ||
          (fish.vx < 0 && fish.x < -100) ||
          fish.y < -50 ||
          fish.y > height + 50
        ) {
          state.fishList.splice(i, 1);
        }
      }

      // 3. Update and Draw Bullets
      for (let bIdx = state.bullets.length - 1; bIdx >= 0; bIdx--) {
        const b = state.bullets[bIdx];
        b.x += b.vx;
        b.y += b.vy;

        // Draw bullet glowing projectile
        ctx.save();
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#F6FF00";
        ctx.shadowColor = "#F36E0F";
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();

        // Check collision against fish
        let bulletHit = false;
        for (let fIdx = state.fishList.length - 1; fIdx >= 0; fIdx--) {
          const fish = state.fishList[fIdx];
          const dist = Math.hypot(b.x - fish.x, b.y - fish.y);

          if (dist < fish.radius + b.radius) {
            bulletHit = true;
            fish.hp -= 1;
            soundManager.playHit();

            // Spawn hit sparks
            for (let p = 0; p < 6; p++) {
              state.particles.push({
                x: b.x,
                y: b.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: fish.color,
                life: 18,
                maxLife: 18,
              });
            }

            // Fish defeated!
            if (fish.hp <= 0) {
              const winAmount = fish.multiplier * b.bet;
              setCoins((c) => c + winAmount);
              setScore((s) => s + winAmount);

              if (fish.isBoss) {
                soundManager.playBossDefeat();
                setBigWinMessage(`LEVIATHAN JACKPOT: +${winAmount} COINS!`);
                setTimeout(() => setBigWinMessage(null), 3500);
              } else {
                soundManager.playCoin();
              }

              // Win floater
              state.floaters.push({
                id: state.nextFloaterId++,
                text: `+${winAmount}`,
                x: fish.x,
                y: fish.y,
                color: fish.isBoss ? "#F6FF00" : "#00FF66",
                life: 40,
              });

              // Coin explosion particles
              for (let cp = 0; cp < (fish.isBoss ? 35 : 12); cp++) {
                state.particles.push({
                  x: fish.x,
                  y: fish.y,
                  vx: (Math.random() - 0.5) * 7,
                  vy: (Math.random() - 0.5) * 7,
                  color: "#FFD700",
                  life: 25,
                  maxLife: 25,
                });
              }

              state.fishList.splice(fIdx, 1);
            }
            break;
          }
        }

        // Remove bullet on hit or off-screen
        if (bulletHit || b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
          state.bullets.splice(bIdx, 1);
        }
      }

      // 4. Update and Draw Particles
      for (let pIdx = state.particles.length - 1; pIdx >= 0; pIdx--) {
        const p = state.particles[pIdx];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (p.life <= 0) state.particles.splice(pIdx, 1);
      }

      // 5. Update and Draw Floater Scores
      for (let flIdx = state.floaters.length - 1; flIdx >= 0; flIdx--) {
        const fl = state.floaters[flIdx];
        fl.y -= 1.2;
        fl.life--;

        ctx.save();
        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = fl.color;
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 6;
        ctx.textAlign = "center";
        ctx.globalAlpha = fl.life / 40;
        ctx.fillText(fl.text, fl.x, fl.y);
        ctx.restore();

        if (fl.life <= 0) state.floaters.splice(flIdx, 1);
      }

      // 6. Draw Player Bottom Turret / Cannon
      const cannonX = width / 2;
      const cannonY = height - 25;

      ctx.save();
      ctx.translate(cannonX, cannonY);

      // Rotating barrel
      ctx.rotate(state.cannonAngle + Math.PI / 2);
      ctx.fillStyle = "#1b2a7a";
      ctx.strokeStyle = "#F36E0F";
      ctx.lineWidth = 3;
      ctx.fillRect(-8, -38, 16, 32);
      ctx.strokeRect(-8, -38, 16, 32);

      // Glowing tip
      ctx.fillStyle = "#FFD700";
      ctx.fillRect(-5, -42, 10, 4);

      // Center mount base
      ctx.rotate(-(state.cannonAngle + Math.PI / 2));
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.fillStyle = "#0D0D2B";
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#F36E0F";
      ctx.stroke();

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${bet}`, 0, 4);

      ctx.restore();
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, [coins, bet, autoFire, soundManager]);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-[#03081a] text-white flex flex-col justify-between select-none"
    >
      {/* Top HUD */}
      <div className="bg-[#070e28]/95 border-b border-[#F36E0F]/30 px-4 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-4">
          <Link
            href="/games"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-[#142055] hover:bg-[#1b2a7a] px-3 py-1.5 rounded-lg transition-colors font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Games Catalog
          </Link>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm font-black text-[#F36E0F] uppercase tracking-wide">
              Kali Fishing Hunter
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
              In-House Original Demo
            </span>
          </div>
        </div>

        {/* Player Wallet & Score */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2 bg-[#142055] px-3 py-1.5 rounded-full border border-[#2a3c91]">
            <span className="text-xs text-slate-400">Demo Coins:</span>
            <strong className="text-sm font-black text-[#FFD700]">{coins}</strong>
            <button
              onClick={reloadCoins}
              title="Reload 1,000 Demo Coins"
              className="text-[#F36E0F] hover:scale-110 transition-transform"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-[#142055] px-3 py-1.5 rounded-full border border-[#2a3c91]">
            <span className="text-xs text-slate-400">Session Score:</span>
            <strong className="text-sm font-black text-[#00D2FF]">{score}</strong>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 bg-[#142055] hover:bg-[#1b2a7a] text-white rounded-lg transition-colors"
          >
            {soundOn ? <Volume2 className="w-4 h-4 text-[#F36E0F]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Game Screen Canvas */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 relative overflow-hidden">
        {bigWinMessage && (
          <div className="absolute top-12 z-30 bg-gradient-to-r from-[#EA0000] via-[#F36E0F] to-[#F6FF00] p-1 rounded-2xl shadow-[0_0_40px_rgba(243,110,15,0.8)] animate-bounce">
            <div className="bg-[#070e28] px-6 py-3 rounded-xl font-black text-base sm:text-xl text-[#FFD700] uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-6 h-6 text-[#FFD700]" />
              {bigWinMessage}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full max-w-5xl aspect-[16/9] rounded-2xl border-2 border-[#1b2a7a] shadow-[0_0_50px_rgba(0,0,0,0.9)] cursor-crosshair object-contain bg-[#030c22]"
        />
      </div>

      {/* Bottom Command Bar: Bet Controls & Power-Ups */}
      <div className="bg-[#070e28]/95 border-t border-[#F36E0F]/30 px-4 py-3 z-20 flex flex-wrap items-center justify-between gap-3">
        {/* Bet Level Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bet Level:</span>
          <div className="flex items-center gap-1.5">
            {betLevels.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setBet(lvl)}
                className={`text-xs font-black px-3 py-1.5 rounded-lg transition-all ${
                  bet === lvl
                    ? "bg-[#F36E0F] text-black scale-105 shadow-[0_0_10px_#F36E0F]"
                    : "bg-[#142055] text-slate-300 hover:text-white"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Power-Up Special Skills */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoFire(!autoFire)}
            className={`text-xs font-black px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              autoFire
                ? "bg-emerald-500 text-black shadow-[0_0_12px_#00FF66]"
                : "bg-[#142055] text-slate-300 hover:bg-[#1b2a7a]"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" /> {autoFire ? "Auto-Fire ON" : "Auto-Fire"}
          </button>

          <button
            onClick={triggerFreeze}
            disabled={freezeActive || coins < 100}
            className={`text-xs font-black px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              freezeActive
                ? "bg-[#00D2FF] text-black"
                : "bg-[#142055] hover:bg-[#00D2FF] hover:text-black text-slate-200 disabled:opacity-40"
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" /> Freeze (100c)
          </button>

          <button
            onClick={triggerLaser}
            disabled={coins < 250}
            className="text-xs font-black px-3.5 py-1.5 rounded-lg bg-[#EA0000]/80 hover:bg-[#EA0000] text-white disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(234,0,0,0.5)]"
          >
            <Zap className="w-3.5 h-3.5 text-[#F6FF00]" /> Hyper Laser (250c)
          </button>
        </div>
      </div>
    </div>
  );
}
