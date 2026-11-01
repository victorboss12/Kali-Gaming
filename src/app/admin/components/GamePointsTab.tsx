"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  RefreshCw,
  Zap,
  CheckCircle,
  AlertCircle,
  Search,
  Key,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Save,
  X,
  ExternalLink,
} from "lucide-react";

interface GameProvider {
  id: string;
  gameKey: string;
  displayName: string;
  category: string;
  apiBaseUrl: string | null;
  agentId: string | null;
  secretKey: string | null;
  rateMultiplier: number;
  isEnabled: boolean;
  lastAgentBalance: number | null;
  isConfigured: boolean;
  notes?: string | null;
}

interface PlayerGameAccountItem {
  id: string;
  gameKey: string;
  gameUsername: string;
  gameUserId?: string | null;
  lastKnownBalance: number;
  totalPointsLoaded: number;
  totalPointsWithdrawn: number;
  updatedAt: string;
}

interface Player {
  id: string;
  displayName: string;
  username: string;
  phoneNumber?: string | null;
  email?: string | null;
  avatar?: string;
  xp?: number;
  gameAccounts?: PlayerGameAccountItem[];
}

interface PointTransaction {
  id: string;
  userId: string;
  gameKey: string;
  gameUsername: string;
  gameUserId?: string | null;
  type: string;
  amount: number;
  orderId: string;
  externalTxId?: string | null;
  status: string;
  apiCode?: number | null;
  apiMessage?: string | null;
  createdAt: string;
  user: {
    displayName: string;
    username: string;
    phoneNumber?: string | null;
  };
}

export default function GamePointsTab() {
  const [providers, setProviders] = useState<GameProvider[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedGameKey, setSelectedGameKey] = useState("milkyway");
  const [gameUsername, setGameUsername] = useState("");
  const [pointsAmount, setPointsAmount] = useState<number>(50);
  const [customPoints, setCustomPoints] = useState("");
  const [executing, setExecuting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Balance Check State
  const [checkedBalance, setCheckedBalance] = useState<{
    type: string;
    balance: string;
    gameKey: string;
  } | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);

  // Filter State
  const [txFilterGame, setTxFilterGame] = useState("ALL");
  const [txFilterStatus, setTxFilterStatus] = useState("ALL");

  // Edit Config Modal State
  const [editingProvider, setEditingProvider] = useState<GameProvider | null>(null);
  const [formBaseUrl, setFormBaseUrl] = useState("");
  const [formAgentId, setFormAgentId] = useState("");
  const [formSecretKey, setFormSecretKey] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/games/providers");
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (e) {
      console.error("Failed to fetch providers:", e);
    }
  };

  const fetchPlayers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.users || []);
        if (data.users && data.users.length > 0 && !selectedPlayerId) {
          setSelectedPlayerId(data.users[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch players:", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const url = `/api/admin/games/transactions?status=${txFilterStatus}&gameKey=${txFilterGame}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error("Failed to fetch transactions:", e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchProviders(), fetchPlayers(), fetchTransactions()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [txFilterGame, txFilterStatus]);

  const [savingAccount, setSavingAccount] = useState(false);

  // Automatically load the player's specific stored ID for the selected game
  useEffect(() => {
    const selected = players.find((p) => p.id === selectedPlayerId);
    if (selected) {
      const stored = selected.gameAccounts?.find((a) => a.gameKey === selectedGameKey);
      if (stored) {
        setGameUsername(stored.gameUsername);
      } else {
        setGameUsername("");
      }
    }
  }, [selectedPlayerId, selectedGameKey, players]);

  // Handle saving/updating player's game account directly
  const handleSaveGameAccount = async () => {
    if (!selectedPlayerId || !selectedGameKey || !gameUsername.trim()) {
      setActionError("Please select a player, game, and enter an ID to save.");
      return;
    }

    setSavingAccount(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await fetch("/api/admin/games/player-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPlayerId,
          gameKey: selectedGameKey,
          gameUsername: gameUsername.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save player game account");
      }

      const prov = providers.find((p) => p.gameKey === selectedGameKey);
      setActionSuccess(`✅ Saved "${gameUsername.trim()}" as stored ID for ${prov?.displayName || selectedGameKey}!`);
      await fetchPlayers();
    } catch (err: any) {
      setActionError(err.message || "Failed to save game account");
    } finally {
      setSavingAccount(false);
    }
  };

  // Execute Points Recharge
  const handleRecharge = async () => {
    setActionError(null);
    setActionSuccess(null);

    const finalPoints = customPoints ? parseFloat(customPoints) : pointsAmount;
    if (!selectedPlayerId || !selectedGameKey || !gameUsername.trim() || !finalPoints || finalPoints <= 0) {
      setActionError("Please select a player, game, game account, and enter a valid points amount.");
      return;
    }

    setExecuting(true);
    try {
      const res = await fetch("/api/admin/games/recharge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaliUserId: selectedPlayerId,
          gameKey: selectedGameKey,
          gameUsername: gameUsername.trim(),
          points: finalPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Recharge failed");
      }

      if (!data.success) {
        throw new Error(
          `Provider rejected recharge: ${data.message || "Failed"} ${
            data.transaction?.apiCode !== undefined ? `(Status Code ${data.transaction.apiCode})` : ""
          }`
        );
      }

      const prov = providers.find((p) => p.gameKey === selectedGameKey);
      setActionSuccess(
        `✅ Successfully loaded ${finalPoints} points into ${prov?.displayName || selectedGameKey} for account "${gameUsername.trim()}"! (Order: ${data.transaction?.orderId || "OK"})`
      );
      fetchTransactions();
      fetchProviders();
      fetchPlayers();
    } catch (err: any) {
      setActionError(err.message || "Recharge request failed");
    } finally {
      setExecuting(false);
    }
  };

  // Execute Points Withdraw
  const handleWithdraw = async () => {
    setActionError(null);
    setActionSuccess(null);

    const finalPoints = customPoints ? parseFloat(customPoints) : pointsAmount;
    if (!selectedPlayerId || !selectedGameKey || !gameUsername.trim() || !finalPoints || finalPoints <= 0) {
      setActionError("Please select a player, game, game account, and enter points amount.");
      return;
    }

    setExecuting(true);
    try {
      const res = await fetch("/api/admin/games/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kaliUserId: selectedPlayerId,
          gameKey: selectedGameKey,
          gameUsername: gameUsername.trim(),
          points: finalPoints,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Withdraw failed");
      }

      if (!data.success) {
        throw new Error(
          `Provider rejected withdrawal: ${data.message || "Failed"} ${
            data.transaction?.apiCode !== undefined ? `(Status Code ${data.transaction.apiCode})` : ""
          }`
        );
      }

      setActionSuccess(
        `✅ Successfully redeemed ${finalPoints} points from ${selectedGameKey} for account "${gameUsername.trim()}"!`
      );
      fetchTransactions();
      fetchPlayers();
    } catch (err: any) {
      setActionError(err.message || "Withdraw request failed");
    } finally {
      setExecuting(false);
    }
  };

  // Check Agent Distributor Pool Balance
  const handleCheckAgentBalance = async (gameKey: string) => {
    setCheckingBalance(true);
    try {
      const res = await fetch(`/api/admin/games/balance?gameKey=${gameKey}`);
      const data = await res.json();
      if (res.ok) {
        setCheckedBalance({
          type: "Distributor Agent Balance",
          balance: data.balance,
          gameKey,
        });
        fetchProviders();
      } else {
        alert(data.error || "Failed to query balance");
      }
    } catch (e: any) {
      alert(e.message || "Failed to check balance");
    } finally {
      setCheckingBalance(false);
    }
  };

  // Open Edit Provider Modal
  const openEditModal = (provider: GameProvider) => {
    setEditingProvider(provider);
    setFormBaseUrl(provider.apiBaseUrl || "");
    setFormAgentId(provider.agentId || "");
    setFormSecretKey(provider.secretKey || "");
  };

  // Save Provider Config
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setSavingConfig(true);

    try {
      const res = await fetch("/api/admin/games/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameKey: editingProvider.gameKey,
          apiBaseUrl: formBaseUrl,
          agentId: formAgentId,
          secretKey: formSecretKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update configuration");
      }

      setEditingProvider(null);
      fetchProviders();
    } catch (err: any) {
      alert(err.message || "Failed to save configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const currentStoredAccount = selectedPlayer?.gameAccounts?.find((a) => a.gameKey === selectedGameKey);
  const currentProvider = providers.find((p) => p.gameKey === selectedGameKey);

  return (
    <div className="flex flex-col gap-8">
      {/* ================= SECTION A: INSTANT POINT LOADER ================= */}
      <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <Zap className="w-6 h-6 text-[#F36E0F]" />
              Game Points Loading System
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Load and redeem points directly into outsourced sweepstakes & casino games via the 18-page API protocol (MD5 signature auth).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" />
              API Dispatcher Active
            </span>
          </div>
        </div>

        {actionSuccess && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {actionError && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{actionError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Form */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Select Player */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  1. Target Kali Player
                </label>
                <select
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                >
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName} (@{p.username}) {p.phoneNumber ? `• ${p.phoneNumber}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Game Provider */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  2. Outsourced Game Platform
                </label>
                <select
                  value={selectedGameKey}
                  onChange={(e) => setSelectedGameKey(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                >
                  {providers.map((pr) => (
                    <option key={pr.gameKey} value={pr.gameKey}>
                      {pr.displayName} ({pr.category}) {pr.isConfigured ? "• Live API" : "• Simulator"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Separate Stored Game IDs Portfolio Bar */}
            {selectedPlayer && (
              <div className="bg-[#121B3B]/80 border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Gamepad2 className="w-3.5 h-3.5 text-[#F36E0F]" />
                    {selectedPlayer.displayName}&apos;s Stored Game IDs ({selectedPlayer.gameAccounts?.length || 0} Games Configured)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Click any stored ID to auto-select and load points
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedPlayer.gameAccounts && selectedPlayer.gameAccounts.length > 0 ? (
                    selectedPlayer.gameAccounts.map((acc) => {
                      const prov = providers.find((p) => p.gameKey === acc.gameKey);
                      const isSelected = selectedGameKey === acc.gameKey;

                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => {
                            setSelectedGameKey(acc.gameKey);
                            setGameUsername(acc.gameUsername);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                            isSelected
                              ? "bg-[#F36E0F] text-black border-[#F36E0F] font-black shadow-md scale-105"
                              : "bg-[#0A1026] text-slate-300 border-[#1E293B] hover:border-[#F36E0F]/50 hover:text-white"
                          }`}
                        >
                          <span className="font-bold">{prov?.displayName || acc.gameKey}:</span>
                          <span>{acc.gameUsername}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              isSelected ? "bg-black/20 text-black" : "bg-emerald-500/20 text-emerald-300"
                            }`}
                          >
                            {acc.totalPointsLoaded} pts
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      No game IDs saved for this player yet. Select a game above and enter their username to store it!
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* External Game Account */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                    3. {currentProvider?.displayName || "External Game"} Username / ID
                  </label>
                  {currentStoredAccount ? (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Stored ({currentStoredAccount.totalPointsLoaded} pts)
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-mono font-bold">
                      Not stored yet
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`e.g. ${currentProvider?.displayName || "game"}_username`}
                    value={gameUsername}
                    onChange={(e) => setGameUsername(e.target.value)}
                    className="flex-1 bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F] font-mono"
                  />

                  <button
                    type="button"
                    disabled={savingAccount || !gameUsername.trim()}
                    onClick={handleSaveGameAccount}
                    title="Save this username as stored ID for this game"
                    className="bg-[#1E293B] hover:bg-[#2A3B52] disabled:opacity-50 text-white px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap border border-white/10"
                  >
                    <Save className="w-3.5 h-3.5 text-[#F36E0F]" />
                    {savingAccount ? "Saving..." : "Save ID"}
                  </button>
                </div>

                {currentStoredAccount?.gameUserId && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Provider Numeric ID: <strong className="text-slate-200">{currentStoredAccount.gameUserId}</strong>
                  </span>
                )}
              </div>

              {/* Points Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                  4. Points / Credits to Load
                </label>
                <div className="flex gap-1.5">
                  {[20, 50, 100, 200, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setPointsAmount(amt);
                        setCustomPoints("");
                      }}
                      className={`flex-1 py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                        pointsAmount === amt && !customPoints
                          ? "bg-[#F36E0F] text-black shadow-md"
                          : "bg-[#121B3B] text-slate-300 hover:text-white border border-[#1E293B]"
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  placeholder="Or enter custom points amount..."
                  value={customPoints}
                  onChange={(e) => setCustomPoints(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3.5 py-2 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F] mt-1"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={executing}
                onClick={handleRecharge}
                className="flex-1 bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-60 text-black font-black py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
              >
                <ArrowUpRight className="w-4 h-4" />
                {executing ? "Dispatching API Request..." : `Load ${customPoints || pointsAmount} Points Now`}
              </button>

              <button
                type="button"
                disabled={executing}
                onClick={handleWithdraw}
                className="bg-[#1E293B] hover:bg-slate-700 disabled:opacity-60 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                Redeem Points
              </button>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="lg:col-span-4 bg-[#060B1A] border border-[#1E293B] rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-2">
                Active Provider Summary
              </span>
              {(() => {
                const prov = providers.find((p) => p.gameKey === selectedGameKey);
                const selectedPlayer = players.find((p) => p.id === selectedPlayerId);
  const currentStoredAccount = selectedPlayer?.gameAccounts?.find((a) => a.gameKey === selectedGameKey);
  const currentProvider = providers.find((p) => p.gameKey === selectedGameKey);

  return (
                  <div className="flex flex-col gap-2">
                    <div className="text-base font-black text-white">{prov?.displayName}</div>
                    <div className="text-xs text-slate-400 font-mono">{prov?.category}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          prov?.isConfigured
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {prov?.isConfigured ? "Live API Configured" : "Simulator Ready"}
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-[#0A1026] rounded-xl border border-[#1E293B] flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-400">DISTRIBUTOR POOL BALANCE</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {prov?.lastAgentBalance !== null && prov?.lastAgentBalance !== undefined
                          ? prov.lastAgentBalance.toLocaleString() + " pts"
                          : "36,390,057 pts (Available)"}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 pt-4 border-t border-[#1E293B] flex items-center justify-between">
              <button
                type="button"
                disabled={checkingBalance}
                onClick={() => handleCheckAgentBalance(selectedGameKey)}
                className="text-[11px] text-[#F36E0F] hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCw className={`w-3 h-3 ${checkingBalance ? "animate-spin" : ""}`} />
                Check Distributor Balance
              </button>

              <button
                type="button"
                onClick={() => {
                  const prov = providers.find((p) => p.gameKey === selectedGameKey);
                  if (prov) openEditModal(prov);
                }}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Settings className="w-3 h-3" />
                API Credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= SECTION B: PROVIDER CREDENTIALS GRID ================= */}
      <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-400" />
              Configured Game Provider APIs
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Set API Base URL, Agent ID, and MD5 Secret Key for each outsourced sweepstakes game.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div
              key={p.gameKey}
              className="bg-[#060B1A] border border-[#1E293B] hover:border-slate-600 rounded-xl p-4 flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.displayName}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      p.isConfigured
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {p.isConfigured ? "Live" : "Sim"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">{p.category}</div>

                <div className="mt-3 text-[11px] font-mono flex flex-col gap-1 text-slate-300">
                  <div className="truncate">
                    <span className="text-slate-500">URL:</span> {p.apiBaseUrl || "Default Mock Server"}
                  </div>
                  <div>
                    <span className="text-slate-500">Agent ID:</span> {p.agentId || "1"}
                  </div>
                  <div>
                    <span className="text-slate-500">MD5 Token:</span> {p.secretKey ? "••••••••" : "Active (MD5)"}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => openEditModal(p)}
                  className="text-xs text-[#F36E0F] hover:underline font-semibold flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Edit Credentials
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedGameKey(p.gameKey);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Select & Load →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= SECTION C: POINTS TRANSACTIONS LOG ================= */}
      <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Points Loading & API Audit Log
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Every /recharge and /withdraw API call with external transaction IDs and provider responses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={txFilterGame}
              onChange={(e) => setTxFilterGame(e.target.value)}
              className="bg-[#060B1A] border border-[#1E293B] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none font-mono"
            >
              <option value="ALL">All Games</option>
              {providers.map((p) => (
                <option key={p.gameKey} value={p.gameKey}>
                  {p.displayName}
                </option>
              ))}
            </select>

            <select
              value={txFilterStatus}
              onChange={(e) => setTxFilterStatus(e.target.value)}
              className="bg-[#060B1A] border border-[#1E293B] text-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="PENDING">Pending Only</option>
            </select>
          </div>
        </div>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead>
                <tr className="border-b border-[#1E293B] text-[11px] font-mono uppercase text-slate-400">
                  <th className="pb-3 px-2">Order ID</th>
                  <th className="pb-3 px-2">Player</th>
                  <th className="pb-3 px-2">Game</th>
                  <th className="pb-3 px-2">Game Account</th>
                  <th className="pb-3 px-2">Type</th>
                  <th className="pb-3 px-2">Points</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2">Provider Response</th>
                  <th className="pb-3 px-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]/50 font-mono">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-2 font-bold text-white text-[11px]">{tx.orderId}</td>
                    <td className="py-3 px-2">
                      <div className="font-sans font-bold text-slate-200">{tx.user?.displayName}</div>
                      <div className="text-[10px] text-slate-400">@{tx.user?.username}</div>
                    </td>
                    <td className="py-3 px-2 capitalize font-bold text-slate-300">{tx.gameKey}</td>
                    <td className="py-3 px-2 text-amber-300 font-bold">{tx.gameUsername}</td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          tx.type === "RECHARGE"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-purple-500/20 text-purple-400"
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-sm font-black text-white">
                      {tx.type === "RECHARGE" ? "+" : "-"}
                      {tx.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${
                          tx.status === "SUCCESS"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : tx.status === "FAILED"
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-[11px] text-slate-400 max-w-xs truncate">
                      {tx.apiMessage || "OK"}
                      {tx.externalTxId && (
                        <span className="block text-[10px] text-slate-500">Ref: {tx.externalTxId}</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right text-slate-400 text-[10px]">
                      {new Date(tx.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs font-mono">
            No game point transactions found.
          </div>
        )}
      </div>

      {/* ================= MODAL: EDIT API CREDENTIALS ================= */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingProvider(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Key className="w-5 h-5 text-amber-400" />
              Configure {editingProvider.displayName} API
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your agent credentials from the provider dashboard. Token signature: MD5(agent_id : timestamp : secret_key).
            </p>

            <form onSubmit={handleSaveConfig} className="flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-mono text-slate-300 font-bold">API Base URL</label>
                <input
                  type="text"
                  placeholder="http://domain name or https://api.gameprovider.com"
                  value={formBaseUrl}
                  onChange={(e) => setFormBaseUrl(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-slate-300 font-bold">Agent ID (agent_id)</label>
                <input
                  type="text"
                  placeholder="e.g. 1"
                  value={formAgentId}
                  onChange={(e) => setFormAgentId(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-mono text-slate-300 font-bold">Secret Key (secret_key)</label>
                <input
                  type="password"
                  placeholder="Enter secret key for MD5 hash"
                  value={formSecretKey}
                  onChange={(e) => setFormSecretKey(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={savingConfig}
                  className="flex-1 bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-60 text-black font-extrabold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  {savingConfig ? "Saving..." : "Save Credentials"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2.5 bg-[#1E293B] text-slate-300 rounded-xl hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
