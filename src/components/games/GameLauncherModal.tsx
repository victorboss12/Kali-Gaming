"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  X,
  Play,
  Download,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Zap,
  HelpCircle,
  AlertCircle,
  ShieldCheck,
  Coins,
  UserPlus,
  RefreshCw,
  KeyRound,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { launchGameWithFallback, detectDevice } from "@/lib/games/launcher";
import { useAuth } from "@/context/AuthContext";

export interface OutsourcedGameDetail {
  key: string;
  name: string;
  category: string;
  image: string;
  scheme: string;
  androidPackage?: string;
  downloadUrl: string;
  webUrl?: string;
  popular?: boolean;
}

export interface LinkedAccountInfo {
  gameKey: string;
  gameUsername: string;
  gameUserId?: string | null;
  totalPointsLoaded: number;
}

interface GameLauncherModalProps {
  game: OutsourcedGameDetail | null;
  isOpen: boolean;
  onClose: () => void;
  linkedAccount?: LinkedAccountInfo | null;
  onAccountUpdated?: () => void;
  initialTab?: "play" | "balance" | "create_id";
}

export default function GameLauncherModal({
  game,
  isOpen,
  onClose,
  linkedAccount,
  onAccountUpdated,
  initialTab = "play",
}: GameLauncherModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"play" | "balance" | "create_id">(initialTab);
  const [copied, setCopied] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isMobile: false, isAndroid: false, isIOS: false });
  const [launchStatus, setLaunchStatus] = useState<"launching" | "opened" | "fallback" | "idle">("idle");
  const [countdown, setCountdown] = useState<number | null>(null);

  // Balance Check states
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [isLiveApi, setIsLiveApi] = useState(false);

  // Create ID states
  const [createMode, setCreateMode] = useState<"create" | "link">("create");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Link existing states
  const [linkUsername, setLinkUsername] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const launcherHandleRef = useRef<{ cancel: () => void } | null>(null);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    setDeviceInfo(detectDevice());
  }, []);

  // Set default suggested username/password when game changes
  useEffect(() => {
    if (game && user) {
      const cleanUser = user.username.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 8);
      const rand = Math.floor(100 + Math.random() * 900);
      setRegUsername(`kali_${cleanUser}_${rand}`);
      setRegPassword("Kali" + Math.floor(100000 + Math.random() * 900000));
    }
    setActiveTab(initialTab);
    setRegSuccess(null);
    setRegError(null);
    setLinkSuccess(null);
    setLinkError(null);
  }, [game, user, initialTab]);

  // Handle Play tab auto-deep link
  useEffect(() => {
    if (!isOpen || !game || activeTab !== "play") {
      if (launcherHandleRef.current) {
        launcherHandleRef.current.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setLaunchStatus("idle");
      setCountdown(null);
      return;
    }

    const { isMobile } = detectDevice();

    if (isMobile) {
      setLaunchStatus("launching");
      setCountdown(2);

      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const handle = launchGameWithFallback({
        scheme: game.scheme,
        androidPackage: game.androidPackage,
        downloadUrl: game.downloadUrl,
        webUrl: game.webUrl,
        autoFallbackTimeoutMs: 2000,
        onStatusChange: (status) => {
          setLaunchStatus(status);
        },
      });

      launcherHandleRef.current = handle;
    } else {
      setLaunchStatus("idle");
    }

    return () => {
      if (launcherHandleRef.current) {
        launcherHandleRef.current.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOpen, game, activeTab]);

  // Fetch balance when Balance tab is active
  const fetchLiveBalance = async () => {
    if (!game) return;
    setBalanceLoading(true);
    setBalanceError(null);

    try {
      const res = await fetch(`/api/games/balance?gameKey=${game.key}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.notLinked) {
          setLiveBalance(null);
          setBalanceError("No account linked for this game yet. Create or link an ID to view balance.");
        } else {
          setBalanceError(data.error || "Failed to check balance.");
        }
      } else {
        setLiveBalance(data.balance ?? 0);
        setIsLiveApi(data.isLive ?? false);
      }
    } catch {
      setBalanceError("Could not reach balance server. Please try again.");
    } finally {
      setBalanceLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && game && activeTab === "balance") {
      fetchLiveBalance();
    }
  }, [isOpen, game, activeTab]);

  if (!isOpen || !game) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cancelAutoRedirect = () => {
    if (launcherHandleRef.current) {
      launcherHandleRef.current.cancel();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setLaunchStatus("idle");
    setCountdown(null);
  };

  // Create new Player ID handler
  const handleCreateGameId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game) return;
    setRegLoading(true);
    setRegError(null);
    setRegSuccess(null);

    try {
      const res = await fetch("/api/games/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameKey: game.key,
          requestedUsername: regUsername.trim(),
          password: regPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRegError(data.error || "Failed to create game ID.");
      } else {
        setRegSuccess(data);
        onAccountUpdated?.();
      }
    } catch {
      setRegError("Network error while creating game ID. Please try again.");
    } finally {
      setRegLoading(false);
    }
  };

  // Link existing ID handler
  const handleLinkExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!game || !linkUsername.trim()) return;
    setLinkLoading(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const res = await fetch("/api/games/my-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameKey: game.key,
          gameUsername: linkUsername.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLinkError(data.error || "Failed to link existing account.");
      } else {
        setLinkSuccess(`Successfully linked ${linkUsername.trim()}!`);
        onAccountUpdated?.();
      }
    } catch {
      setLinkError("Network error linking account.");
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c163b] border-2 border-[#F36E0F] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(243,110,15,0.4)] text-white flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header with Game Cover */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl bg-cover bg-center border-2 border-[#F36E0F] shadow-lg flex-shrink-0"
            style={{ backgroundImage: `url(${game.image})` }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-[#142055] text-[#F36E0F] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {game.category}
              </span>
              {deviceInfo.isMobile ? (
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  <Smartphone className="w-3 h-3" /> Mobile App
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full font-bold">
                  <Monitor className="w-3 h-3" /> Desktop
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-white mt-1">{game.name}</h2>
          </div>
        </div>

        {/* 3 Interactive Feature Tabs: Play | Balance Check | Create ID */}
        <div className="grid grid-cols-3 gap-1 bg-[#070719] border border-white/10 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("play")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "play"
                ? "bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] text-black shadow-md scale-[1.02]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Play
          </button>

          <button
            onClick={() => setActiveTab("balance")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "balance"
                ? "bg-[#F36E0F] text-black shadow-md scale-[1.02]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Balance
          </button>

          <button
            onClick={() => setActiveTab("create_id")}
            className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition-all ${
              activeTab === "create_id"
                ? "bg-[#1b2a7a] text-white border border-[#F36E0F]/60 shadow-md scale-[1.02]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#F36E0F]" />
            Create ID
          </button>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: PLAY & LAUNCH                                          */}
        {/* ============================================================== */}
        {activeTab === "play" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Auto-Launch Mobile Fallback Banner */}
            {deviceInfo.isMobile && launchStatus === "launching" && (
              <div className="bg-[#142055] border border-amber-500/40 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  Opening {game.name} App...
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If {game.name} is installed, it will launch automatically. If not, redirecting to the official download page in{" "}
                  <strong className="text-amber-400">{countdown ?? 2}s</strong>.
                </p>
                <button
                  onClick={cancelAutoRedirect}
                  className="text-[11px] text-slate-400 hover:text-white underline self-start mt-1"
                >
                  Cancel auto-redirect and stay here
                </button>
              </div>
            )}

            {/* Linked Account Pill (with 1-Click Copy) */}
            {linkedAccount ? (
              <div className="bg-gradient-to-r from-[#142055] to-[#070719] border border-emerald-500/30 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <ShieldCheck className="w-4 h-4" /> Linked Game Account
                  </div>
                  <span className="text-xs font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                    {linkedAccount.totalPointsLoaded} Points Loaded
                  </span>
                </div>

                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-xl px-4 py-2.5">
                  <div>
                    <div className="text-[10px] uppercase text-slate-400 font-semibold">Login Username</div>
                    <div className="text-base font-black text-white font-mono">{linkedAccount.gameUsername}</div>
                  </div>

                  <button
                    onClick={() => handleCopy(linkedAccount.gameUsername)}
                    className="flex items-center gap-1.5 bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-black px-3.5 py-1.5 rounded-lg transition-transform active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#142055]/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-200">No {game.name} ID yet?</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Create a free game ID in seconds or link your existing username.
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("create_id")}
                  className="bg-[#1b2a7a] hover:bg-[#253999] border border-[#F36E0F]/50 text-white text-xs font-bold px-3 py-2 rounded-xl text-center whitespace-nowrap flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3 text-[#F36E0F]" /> Create ID
                </button>
              </div>
            )}

            {/* Launch Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  window.location.href = game.scheme;
                }}
                className="w-full bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:scale-[1.02] active:scale-[0.98] text-black font-black text-sm py-3.5 rounded-xl shadow-[0_0_20px_rgba(243,110,15,0.4)] transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-black" />
                Launch {game.name} App (If Downloaded)
              </button>

              <button
                onClick={() => {
                  window.open(game.downloadUrl, "_blank", "noopener,noreferrer");
                }}
                className="w-full bg-[#142055] hover:bg-[#1b2a7a] border border-[#F36E0F]/40 text-white font-bold text-sm py-3 rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#F36E0F]" />
                Go to {game.name} Download Page (APK / iOS)
              </button>

              {game.webUrl && (
                <button
                  onClick={() => {
                    window.open(game.webUrl || game.downloadUrl, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full bg-[#070719] hover:bg-black/80 border border-white/10 text-slate-300 hover:text-white font-semibold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Play in Browser Portal
                </button>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: BALANCE CHECK                                          */}
        {/* ============================================================== */}
        {activeTab === "balance" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Live Balance Card */}
            <div className="bg-gradient-to-br from-[#142055] via-[#0c163b] to-[#070719] border-2 border-[#F36E0F]/50 rounded-2xl p-6 text-center flex flex-col items-center gap-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Real-Time Game Balance
                </span>
                {isLiveApi && (
                  <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live API
                  </span>
                )}
              </div>

              {balanceLoading ? (
                <div className="py-6 flex flex-col items-center gap-2">
                  <RefreshCw className="w-8 h-8 text-[#F36E0F] animate-spin" />
                  <span className="text-xs text-slate-400">Querying {game.name} provider...</span>
                </div>
              ) : liveBalance !== null ? (
                <div className="flex flex-col items-center">
                  <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000]">
                    {liveBalance.toFixed(2)}
                  </div>
                  <span className="text-xs text-slate-400 mt-1">Available Points to Play</span>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-300">
                  {balanceError || "No balance record found for this game."}
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={fetchLiveBalance}
                disabled={balanceLoading}
                className="mt-2 inline-flex items-center gap-1.5 bg-[#1b2a7a] hover:bg-[#253999] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${balanceLoading ? "animate-spin" : ""}`} />
                Refresh Balance
              </button>
            </div>

            {/* Account Details & Quick Recharge */}
            {linkedAccount && (
              <div className="bg-[#142055]/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Account:</span>
                  <span className="font-bold text-white font-mono">{linkedAccount.gameUsername}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Total Points Loaded:</span>
                  <span className="font-bold text-emerald-400">{linkedAccount.totalPointsLoaded} pts</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-slate-300">Want to top up?</span>
                  <Link
                    href="/messages"
                    className="bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-black px-4 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5 fill-black" />
                    Load Points Now
                  </Link>
                </div>
              </div>
            )}

            {!linkedAccount && (
              <div className="text-center py-2">
                <button
                  onClick={() => setActiveTab("create_id")}
                  className="text-xs font-bold text-[#F36E0F] hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create or Link your {game.name} ID to track points →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: CREATE ID & LINK ACCOUNT                               */}
        {/* ============================================================== */}
        {activeTab === "create_id" && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-150">
            {/* Sub-Switch: Create New vs Link Existing */}
            <div className="flex items-center gap-2 bg-[#070719] p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setCreateMode("create")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  createMode === "create" ? "bg-[#1b2a7a] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Create New Game ID
              </button>
              <button
                type="button"
                onClick={() => setCreateMode("link")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  createMode === "link" ? "bg-[#1b2a7a] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Link Existing Username
              </button>
            </div>

            {/* Sub-Tab 1: Create New ID */}
            {createMode === "create" && (
              <form onSubmit={handleCreateGameId} className="flex flex-col gap-3">
                <div className="text-xs text-slate-300">
                  Instantly provision a new verified player account on <strong>{game.name}</strong>.
                </div>

                {regError && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                {regSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <Check className="w-5 h-5 text-emerald-400" />
                      Account Created Successfully!
                    </div>

                    <div className="bg-black/50 border border-white/10 rounded-xl p-3 flex flex-col gap-2 font-mono text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Username:</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>{regSuccess.loginUsername}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(regSuccess.loginUsername)}
                            className="text-[#F36E0F] hover:text-white"
                            title="Copy username"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Password:</span>
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span>{regSuccess.loginPassword}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(regSuccess.loginPassword)}
                            className="text-[#F36E0F] hover:text-white"
                            title="Copy password"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Numeric User ID:</span>
                        <span className="text-slate-200">{regSuccess.gameUserId}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300">
                      ✅ A receipt has also been sent to your 1-on-1 staff support chat for your records.
                    </p>

                    <button
                      type="button"
                      onClick={() => setActiveTab("play")}
                      className="bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] text-black font-black text-xs py-2.5 rounded-xl transition-all"
                    >
                      Launch {game.name} & Play Now →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                        Desired Game Username
                      </label>
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. kali_player1"
                        required
                        className="bg-[#142055] border border-white/20 focus:border-[#F36E0F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                      />
                      <span className="text-[10px] text-slate-400">Letters, numbers, and underscores only.</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                        Game Password
                      </label>
                      <input
                        type="text"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="6 to 32 characters"
                        required
                        className="bg-[#142055] border border-white/20 focus:border-[#F36E0F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={regLoading}
                      className="mt-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 text-black font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {regLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                      {regLoading ? "Registering on Provider..." : `Create ${game.name} Account`}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Sub-Tab 2: Link Existing ID */}
            {createMode === "link" && (
              <form onSubmit={handleLinkExisting} className="flex flex-col gap-3">
                <div className="text-xs text-slate-300">
                  Already have an account on <strong>{game.name}</strong>? Enter your username to link your balance.
                </div>

                {linkError && (
                  <div className="bg-red-500/10 border border-red-500/40 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{linkError}</span>
                  </div>
                )}

                {linkSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{linkSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
                    Existing {game.name} Username
                  </label>
                  <input
                    type="text"
                    value={linkUsername}
                    onChange={(e) => setLinkUsername(e.target.value)}
                    placeholder="e.g. testingkali"
                    required
                    className="bg-[#142055] border border-white/20 focus:border-[#F36E0F] text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={linkLoading}
                  className="mt-2 bg-[#1b2a7a] hover:bg-[#253999] border border-[#F36E0F]/50 text-white font-black text-xs py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {linkLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LinkIcon className="w-4 h-4 text-[#F36E0F]" />
                  )}
                  {linkLoading ? "Verifying with Provider..." : `Verify & Link ${game.name} Account`}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Footer Support */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            Official Verified Client
          </span>
          <Link
            href={`/support?game=${encodeURIComponent(game.name)}`}
            className="text-slate-300 hover:text-white underline flex items-center gap-1"
          >
            <HelpCircle className="w-3.5 h-3.5" /> Staff Help
          </Link>
        </div>
      </div>
    </div>
  );
}
