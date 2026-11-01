"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  Shield,
  Users,
  MessageSquare,
  Sparkles,
  AlertTriangle,
  History,
  Search,
  CheckCircle,
  Ban,
  VolumeX,
  Volume2,
  Lock,
  Edit,
  Save,
  RefreshCw,
  QrCode,
  DollarSign,
  Activity,
  Server,
  Cpu,
  Database,
  Check,
  X,
  Clock,
  ExternalLink,
  Gift,
  FileText,
  Gamepad2,
  Zap,
} from "lucide-react";
import GamePointsTab from "./components/GamePointsTab";
import GamesManagementTab from "./components/GamesManagementTab";

function AdminPageContent() {
  const { admin, loading: authLoading } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "messages" | "payments" | "points" | "games" | "reports" | "rewards" | "audit" | "system"
  >("overview");

  useEffect(() => {
    if (tabParam && ["overview", "users", "messages", "payments", "points", "games", "reports", "rewards", "audit", "system"].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [tabParam]);

  const [stats, setStats] = useState<any>(null);

  // Messages tab state
  const [adminConvs, setAdminConvs] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [msgSearch, setMsgSearch] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(false);

  // Users tab state
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Payments tab state
  const [chimeSetting, setChimeSetting] = useState<any>({
    title: "Chime Instant Pay",
    chimeTag: "$KaliGamingPay",
    accountName: "Kali Gaming Official Cashier",
    instructions: "Send payment via Chime app. Please include your Kali username in the 'For' note for instant crediting.",
    qrCodeUrl: "/chime-qr.svg",
    minAmount: 10,
    maxAmount: 2000,
    note: "Deposits are verified & credited within 2-5 minutes.",
    isEnabled: true,
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txFilter, setTxFilter] = useState<string>("ALL");
  const [loadingTx, setLoadingTx] = useState(false);

  // Reports tab state
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Rewards tab state
  const [rewards, setRewards] = useState<any[]>([]);
  const [editingReward, setEditingReward] = useState<any | null>(null);

  // Audit logs tab state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // System telemetry tab state
  const [systemTelemetry, setSystemTelemetry] = useState<any>(null);
  const [loadingSystem, setLoadingSystem] = useState(false);

  // Check admin role
  useEffect(() => {
    if (!authLoading && (!admin || (admin.role !== "ADMIN" && admin.role !== "MODERATOR"))) {
      router.push("/admin/login");
    }
  }, [admin, authLoading, router]);

  const loadStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadPaymentSettings = async () => {
    try {
      const res = await fetch("/api/admin/payments/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.setting) {
          setChimeSetting(data.setting);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTransactions = async () => {
    setLoadingTx(true);
    try {
      const res = await fetch(`/api/admin/payments/transactions?status=${txFilter}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch("/api/admin/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingReports(false);
    }
  };

  const loadRewards = async () => {
    try {
      const res = await fetch("/api/admin/rewards");
      if (res.ok) {
        const data = await res.json();
        setRewards(data.rewards || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/admin/audit-logs");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLogs(false);
    }
  };

  const loadSystemTelemetry = async () => {
    setLoadingSystem(true);
    try {
      const res = await fetch("/api/admin/system");
      if (res.ok) {
        const data = await res.json();
        setSystemTelemetry(data.system);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSystem(false);
    }
  };

  const loadAdminConvs = async () => {
    setLoadingConvs(true);
    try {
      const res = await fetch("/api/admin/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        const convs = data.conversations || [];
        setAdminConvs(convs);
        if (!selectedConvId && convs.length > 0) {
          setSelectedConvId(convs[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadConvMessages = async (cid: string) => {
    try {
      const res = await fetch(`/api/admin/messages/${cid}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedConv(data.conversation);
        setConvMessages(data.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendAdminReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedConvId || !replyText.trim() || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch(`/api/admin/messages/${selectedConvId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        loadConvMessages(selectedConvId);
        loadAdminConvs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingReply(false);
    }
  };

  useEffect(() => {
    if (selectedConvId) {
      loadConvMessages(selectedConvId);
    }
  }, [selectedConvId]);

  useEffect(() => {
    if (admin) {
      loadStats();
      loadUsers();
      loadPaymentSettings();
      loadTransactions();
      loadReports();
      loadRewards();
      loadAuditLogs();
      loadSystemTelemetry();
      loadAdminConvs();
    }
  }, [admin]);

  useEffect(() => {
    if (admin && activeTab === "messages") {
      loadAdminConvs();
      const interval = setInterval(() => {
        loadAdminConvs();
        if (selectedConvId) {
          loadConvMessages(selectedConvId);
        }
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [admin, activeTab, selectedConvId]);

  useEffect(() => {
    if (admin && activeTab === "payments") {
      loadTransactions();
    }
  }, [txFilter, activeTab]);

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPayment(true);
    setPaymentSuccessMsg("");
    try {
      const res = await fetch("/api/admin/payments/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(chimeSetting),
      });
      if (res.ok) {
        setPaymentSuccessMsg("Chime Payment & QR settings updated successfully in real-time!");
        setTimeout(() => setPaymentSuccessMsg(""), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPayment(false);
    }
  };

  const handleActionTransaction = async (transactionId: string, action: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch("/api/admin/payments/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, action }),
      });
      if (res.ok) {
        loadTransactions();
        loadStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveReport = async (reportId: string, actionTaken: "MUTE" | "BAN" | "NONE") => {
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          status: "RESOLVED",
          actionTaken,
          adminNotes: `Resolved with action: ${actionTaken}`,
        }),
      });
      if (res.ok) {
        loadReports();
        loadStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveReward = async () => {
    if (!editingReward) return;
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingReward),
      });
      if (res.ok) {
        setEditingReward(null);
        loadRewards();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[#EA0000]">
        <div className="w-10 h-10 border-4 border-[#EA0000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  return (
    <div className={`max-w-7xl mx-auto flex flex-col ${activeTab === "messages" ? "gap-3" : "gap-6"} text-white`}>
      {/* Top Breadcrumb & Quick Tabs for Mobile */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#EA0000]/20 border border-[#EA0000]/40 px-3 py-0.5 rounded-full text-xs font-mono font-bold text-red-300 mb-1">
            <Shield className="w-3.5 h-3.5 text-red-400" />
            Backend Console: Authenticated as Staff @{admin.username}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Kali Platform Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time player moderation, Chime payment QR gateway, reward configuration, and backend telemetry.
          </p>
        </div>

        {/* Tab Buttons (Responsive) */}
        <div className="flex items-center gap-1.5 bg-[#0A1026] border border-[#1E293B] p-1.5 rounded-xl flex-wrap">
          <button
            onClick={() => setActiveTab("overview")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "overview" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "users" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "messages" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Live Messages
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all relative ${
              activeTab === "payments" ? "bg-[#25C974] text-black" : "text-slate-300 hover:text-white"
            }`}
          >
            Payments & QR
            {(stats?.pendingDeposits || 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-1 right-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("points")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "points" ? "bg-[#F36E0F] text-black font-extrabold shadow-md shadow-orange-500/20" : "text-slate-300 hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Points Loader
          </button>
          <button
            onClick={() => setActiveTab("games")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === "games" ? "bg-[#F36E0F] text-black font-extrabold shadow-md shadow-orange-500/20" : "text-slate-300 hover:text-white"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            Games Catalog
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all relative ${
              activeTab === "reports" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Reports
            {(stats?.pendingReports || 0) > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1 right-1" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "rewards" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Rewards
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "audit" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab("system")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
              activeTab === "system" ? "bg-[#EA0000] text-white" : "text-slate-300 hover:text-white"
            }`}
          >
            Telemetry
          </button>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      {stats && activeTab !== "messages" && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Total Players</span>
            <span className="text-xl font-black text-[#F36E0F] mt-0.5">{stats.totalUsers}</span>
          </div>
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Pending Deposits</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5">{stats.pendingDeposits || 0}</span>
          </div>
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Spins Awarded</span>
            <span className="text-xl font-black text-purple-400 mt-0.5">{stats.totalSpins}</span>
          </div>
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Reports Queue</span>
            <span className="text-xl font-black text-rose-400 mt-0.5">{stats.pendingReports}</span>
          </div>
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-xl p-3.5 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Messages Delivered</span>
            <span className="text-xl font-black text-amber-400 mt-0.5">{stats.totalMessages}</span>
          </div>
        </div>
      )}

      {/* ==================== TAB 0: OVERVIEW ==================== */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" /> Active Chime Gateway Status
              </h2>
              <button
                onClick={() => setActiveTab("payments")}
                className="text-xs text-[#25C974] hover:underline font-semibold"
              >
                Configure Settings →
              </button>
            </div>
            <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex items-center gap-4">
              <img
                src={chimeSetting.qrCodeUrl || "/chime-qr.svg"}
                alt="Chime QR"
                className="w-20 h-20 bg-white rounded-lg p-1 object-contain"
              />
              <div className="flex flex-col gap-1 text-xs">
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">CURRENT CHIME TAG</span>
                  <span className="font-black text-emerald-400 text-sm">{chimeSetting.chimeTag}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">ACCOUNT HOLDER</span>
                  <span className="font-semibold text-slate-200">{chimeSetting.accountName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-mono text-[10px]">LIMITS</span>
                  <span className="text-slate-300 font-mono">${chimeSetting.minAmount} min / ${chimeSetting.maxAmount} max</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-pink-400" /> System & Socket Health
              </h2>
              <button
                onClick={() => setActiveTab("system")}
                className="text-xs text-pink-400 hover:underline font-semibold"
              >
                View Full Telemetry →
              </button>
            </div>
            {systemTelemetry ? (
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-[#060B1A] p-3 rounded-lg border border-[#1E293B]">
                  <span className="text-slate-400 block text-[10px]">SQLITE LATENCY</span>
                  <span className="text-emerald-400 font-bold">{systemTelemetry.dbLatencyMs} ms</span>
                </div>
                <div className="bg-[#060B1A] p-3 rounded-lg border border-[#1E293B]">
                  <span className="text-slate-400 block text-[10px]">MEMORY (RSS)</span>
                  <span className="text-slate-200 font-bold">{systemTelemetry.memoryRssMb} MB</span>
                </div>
                <div className="bg-[#060B1A] p-3 rounded-lg border border-[#1E293B]">
                  <span className="text-slate-400 block text-[10px]">SERVER UPTIME</span>
                  <span className="text-slate-200 font-bold">{systemTelemetry.uptimeSeconds}s</span>
                </div>
                <div className="bg-[#060B1A] p-3 rounded-lg border border-[#1E293B]">
                  <span className="text-slate-400 block text-[10px]">PLATFORM STATUS</span>
                  <span className="text-emerald-400 font-bold">ONLINE (PORT 3000)</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Loading system metrics...</p>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: PLAYER LIVE MESSAGES DESK ==================== */}
      {activeTab === "messages" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[calc(100vh-165px)] min-h-[560px]">
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-[#1E293B] bg-[#0C1430] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#EA0000] flex items-center justify-center text-white flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white">Direct Player Support & Communication Desk</h2>
                <p className="text-[11px] text-slate-400">Manage 1-on-1 player messages, inquiries, and deposit confirmations.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Sync Active
              </span>
            </div>
          </div>

          {/* 2-Column Split: Player Channels (Left) & Live Dialogue (Right) */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            {/* Left: Player Channel List */}
            <div className="w-72 sm:w-80 border-r border-[#1E293B] bg-[#060B1A] flex flex-col overflow-hidden min-h-0">
              <div className="p-3 border-b border-[#1E293B] flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={msgSearch}
                    onChange={(e) => setMsgSearch(e.target.value)}
                    className="w-full bg-[#121B3B] text-white placeholder:text-gray-400 rounded-xl pl-8 pr-3 py-1.5 text-xs border border-[#1E293B] outline-none"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#1E293B] min-h-0">
                {loadingConvs ? (
                  <div className="py-8 text-center text-slate-400 text-xs font-mono">Loading player chats...</div>
                ) : (
                  adminConvs
                    .filter((c) =>
                      msgSearch
                        ? c.player?.username?.toLowerCase().includes(msgSearch.toLowerCase()) ||
                          c.player?.displayName?.toLowerCase().includes(msgSearch.toLowerCase())
                        : true
                    )
                    .map((conv) => {
                      const isSelected = conv.id === selectedConvId;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConvId(conv.id)}
                          className={`w-full p-3.5 flex items-start gap-3 text-left transition-colors ${
                            isSelected
                              ? "bg-[#142055] border-l-4 border-[#F36E0F]"
                              : "hover:bg-[#0C1430]"
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              src={conv.player?.avatar || "/avatars/avatar-1.svg"}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-[#1E293B]"
                            />
                            <span
                              className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#060B1A] ${
                                conv.player?.isOnline ? "bg-emerald-400" : "bg-slate-500"
                              }`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate block">
                                {conv.player?.displayName || "Player"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {conv.lastMessage
                                  ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <span className="text-[10px] text-[#F36E0F] font-mono block">
                              @{conv.player?.username}
                            </span>
                            <p className="text-[11px] text-slate-300 truncate mt-0.5">
                              {conv.lastMessage?.content || "No messages yet"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                )}
              </div>
            </div>

            {/* Right: Active Chat Window */}
            {selectedConv ? (
              <div className="flex-1 flex flex-col bg-[#080E24] overflow-hidden min-h-0">
                {/* Active Player Chat Header */}
                <div className="p-3.5 px-5 border-b border-[#1E293B] bg-[#0A112C] flex items-center justify-between flex-shrink-0 z-10">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const p = selectedConv.members?.find((m: any) => m.user?.role === "USER" || m.userId !== admin.id)?.user;
                      return (
                        <>
                          <img
                            src={p?.avatar || "/avatars/avatar-1.svg"}
                            alt=""
                            className="w-9 h-9 rounded-full object-cover border border-[#F36E0F]"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{p?.displayName}</span>
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${p?.isOnline ? "bg-emerald-400" : "bg-slate-500"}`} />
                                {p?.isOnline ? "Online" : "Offline"}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{p?.username} {p?.phoneNumber ? `• 📱 ${p.phoneNumber}` : ""} • {p?.xp || 0} XP
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <Link
                    href={`/profile/${selectedConv.members?.find((m: any) => m.user?.role === "USER" || m.userId !== admin.id)?.user?.id}`}
                    target="_blank"
                    className="text-xs text-slate-300 hover:text-white bg-[#141C38] px-3 py-1.5 rounded-lg border border-[#1E293B] inline-flex items-center gap-1"
                  >
                    View Player Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                {/* Messages Dialogue Stream */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 min-h-0">
                  {convMessages.map((msg) => {
                    const isAdminMsg = msg.senderId === admin.id || msg.sender?.role === "ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isAdminMsg ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-mono text-slate-400">
                            {isAdminMsg ? "Staff Admin" : msg.sender?.displayName}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div
                          className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                            isAdminMsg
                              ? "bg-gradient-to-r from-[#F36E0F] to-[#d85800] text-black font-medium rounded-tr-none shadow-lg"
                              : "bg-[#142055] text-white border border-[#2a3c91] rounded-tl-none shadow-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Canned Quick Responses */}
                <div className="px-4 py-2 bg-[#060B1A] border-t border-[#1E293B] flex items-center gap-2 overflow-x-auto text-[11px] flex-shrink-0">
                  <span className="text-[10px] font-mono text-slate-400 uppercase flex-shrink-0">
                    Quick Reply:
                  </span>
                  {[
                    "💵 Your deposit has been verified and credited!",
                    "🎮 Here is your game login link. Enjoy!",
                    "⭐ Congratulations on your VIP achievement!",
                    "👋 Hello! How can I assist you with your games today?",
                  ].map((quick) => (
                    <button
                      key={quick}
                      onClick={() => setReplyText(quick)}
                      className="bg-[#121B3B] hover:bg-[#1A254D] text-slate-300 hover:text-white px-2.5 py-1 rounded-lg border border-[#1E293B] whitespace-nowrap transition-colors"
                    >
                      {quick}
                    </button>
                  ))}
                </div>

                {/* Reply Input Form */}
                <form
                  onSubmit={handleSendAdminReply}
                  className="p-3 bg-[#0A1026] border-t border-[#1E293B] flex items-center gap-2 flex-shrink-0"
                >
                  <input
                    type="text"
                    required
                    placeholder="Type your official admin reply to player (Press Enter to send)..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 bg-[#121B3B] text-white placeholder:text-gray-400 rounded-xl px-4 py-2.5 text-xs border border-[#1E293B] outline-none focus:ring-2 focus:ring-[#F36E0F]"
                  />
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-50 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    Send Reply
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <MessageSquare className="w-12 h-12 text-[#F36E0F] opacity-40 mb-3" />
                <h3 className="text-sm font-bold text-white">Select a Player Conversation</h3>
                <p className="text-xs max-w-xs mt-1">
                  Choose a player from the left panel to review their messages and send replies in real-time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 1: PAYMENTS & QR CODE ==================== */}
      {activeTab === "payments" && (
        <div className="flex flex-col gap-8">
          {/* Section A: Live Chime Gateway & QR Code Configuration */}
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-[#1E293B]">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" /> Chime Payment Gateway & Dynamic QR Configuration
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Updates made here immediately propagate to the player frontend cashier (/deposit).
                </p>
              </div>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold px-3 py-1 rounded-lg">
                LIVE FRONTEND SYNC ACTIVE
              </span>
            </div>

            {paymentSuccessMsg && (
              <div className="mb-6 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold p-3.5 rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{paymentSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Form to edit settings */}
              <form onSubmit={handleSavePaymentSettings} className="lg:col-span-2 flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Chime Cashtag / Handle
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="$KaliGamingPay"
                      value={chimeSetting.chimeTag}
                      onChange={(e) => setChimeSetting({ ...chimeSetting, chimeTag: e.target.value })}
                      className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Account Holder / Cashier Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Kali Gaming Official Cashier"
                      value={chimeSetting.accountName}
                      onChange={(e) => setChimeSetting({ ...chimeSetting, accountName: e.target.value })}
                      className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Dynamic QR Code Image URL or Asset Path
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="/chime-qr.svg or https://..."
                    value={chimeSetting.qrCodeUrl}
                    onChange={(e) => setChimeSetting({ ...chimeSetting, qrCodeUrl: e.target.value })}
                    className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <span className="text-[10px] text-slate-400">
                    Supports SVG paths, local public assets (`/chime-qr.svg`), or remote hosted URLs.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                    Deposit Instructions for Players
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={chimeSetting.instructions}
                    onChange={(e) => setChimeSetting({ ...chimeSetting, instructions: e.target.value })}
                    className="bg-[#121B3B] text-white rounded-xl p-3 text-xs border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Min Deposit ($)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={chimeSetting.minAmount}
                      onChange={(e) => setChimeSetting({ ...chimeSetting, minAmount: e.target.value })}
                      className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Max Deposit ($)
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={chimeSetting.maxAmount}
                      onChange={(e) => setChimeSetting({ ...chimeSetting, maxAmount: e.target.value })}
                      className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                      Gateway Status
                    </label>
                    <select
                      value={chimeSetting.isEnabled ? "ACTIVE" : "INACTIVE"}
                      onChange={(e) => setChimeSetting({ ...chimeSetting, isEnabled: e.target.value === "ACTIVE" })}
                      className="bg-[#121B3B] text-white rounded-xl px-3.5 py-2.5 text-sm font-mono border border-[#1E293B] outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="ACTIVE">ACTIVE (Accepting Deposits)</option>
                      <option value="INACTIVE">MAINTENANCE (Disabled)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPayment}
                  className="mt-2 bg-[#25C974] hover:bg-[#1fb365] disabled:opacity-60 text-black font-black py-3 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-xs tracking-wider uppercase self-start"
                >
                  <Save className="w-4 h-4" />
                  {savingPayment ? "Saving Real-Time Configuration..." : "Save Gateway & QR Settings"}
                </button>
              </form>

              {/* Live Preview Panel */}
              <div className="bg-[#060B1A] border border-[#1E293B] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider mb-3">
                  Live Player View Preview
                </span>
                <div className="w-48 h-48 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center border-4 border-[#25C974]">
                  <img
                    src={chimeSetting.qrCodeUrl || "/chime-qr.svg"}
                    alt="Live QR Preview"
                    className="w-full h-full object-contain"
                    onError={(e: any) => {
                      e.target.src = "/chime-qr.svg";
                    }}
                  />
                </div>
                <div className="mt-3">
                  <span className="text-xs font-bold text-slate-400 block">Scan with Chime App</span>
                  <span className="text-base font-black text-[#25C974]">{chimeSetting.chimeTag}</span>
                  <span className="text-[11px] text-slate-300 block">{chimeSetting.accountName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section B: Deposit Transactions Approvals Queue */}
          <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" /> Player Deposit Approvals Queue
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Review submitted Chime transfers, verify sender tag, and approve crediting.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-[#060B1A] border border-[#1E293B] p-1 rounded-xl text-xs font-mono">
                {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTxFilter(s)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      txFilter === s ? "bg-[#25C974] text-black" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {loadingTx ? (
              <div className="py-12 text-center text-slate-400 text-xs font-mono">
                Loading transaction records...
              </div>
            ) : transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans">
                  <thead>
                    <tr className="border-b border-[#1E293B] text-[11px] font-mono uppercase text-slate-400">
                      <th className="pb-3 px-2">Player</th>
                      <th className="pb-3 px-2">Amount</th>
                      <th className="pb-3 px-2">Sender Chime Tag</th>
                      <th className="pb-3 px-2">Reference Note</th>
                      <th className="pb-3 px-2">Date / Time</th>
                      <th className="pb-3 px-2">Status</th>
                      <th className="pb-3 px-2 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#121B3B]/50 transition-colors">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={tx.user?.avatar || "/avatars/avatar-1.svg"}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                            <div>
                              <span className="font-bold text-white block">{tx.user?.displayName}</span>
                              <span className="text-[10px] text-slate-400">@{tx.user?.username}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-emerald-400">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 font-mono font-bold text-slate-200">
                          {tx.chimeSenderTag}
                        </td>
                        <td className="py-3 px-2 text-slate-300 max-w-xs truncate" title={tx.referenceNote}>
                          {tx.referenceNote || "N/A"}
                        </td>
                        <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              tx.status === "APPROVED"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : tx.status === "REJECTED"
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">
                          {tx.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleActionTransaction(tx.id, "APPROVE")}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Approve & Credit
                              </button>
                              <button
                                onClick={() => handleActionTransaction(tx.id, "REJECT")}
                                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-1 rounded-lg text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono italic">
                              Verified
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs font-mono">
                No deposit transactions found matching filter "{txFilter}".
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB: GAME POINTS LOADER ==================== */}
      {activeTab === "points" && <GamePointsTab />}

      {/* ==================== TAB: GAME CATALOG MANAGEMENT ==================== */}
      {activeTab === "games" && <GamesManagementTab />}

      {/* ==================== TAB 2: USERS & MODERATION ==================== */}
      {activeTab === "users" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00D2FF]" /> Player Directory & Account Status
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by username, display name, email, phone..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadUsers()}
                className="w-full bg-[#121B3B] text-white rounded-xl pl-9 pr-3.5 py-2 text-xs border border-[#1E293B] outline-none focus:ring-2 focus:ring-[#00D2FF]"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              Loading player records...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1E293B] text-[11px] font-mono uppercase text-slate-400">
                    <th className="pb-3 px-2">Player</th>
                    <th className="pb-3 px-2">Contact Info</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2">XP</th>
                    <th className="pb-3 px-2">Joined</th>
                    <th className="pb-3 px-2 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#121B3B]/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={u.avatar || "/avatars/avatar-1.svg"}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-[#1E293B]"
                          />
                          <div>
                            <span className="font-bold text-white block">{u.displayName}</span>
                            <span className="text-[10px] text-slate-400">@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-slate-300 font-mono text-[11px]">
                        <div>{u.email || <span className="text-slate-500 italic">No email</span>}</div>
                        {u.phoneNumber && (
                          <div className="text-emerald-400 font-bold text-[10px] flex items-center gap-1 mt-0.5">
                            📱 {u.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            u.role === "ADMIN" ? "bg-red-500/20 text-red-300" : "bg-slate-700/40 text-slate-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            u.status === "ACTIVE"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : u.status === "MUTED"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-mono text-amber-400 font-bold">{u.xp} XP</td>
                      <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-right">
                        {u.role !== "ADMIN" && (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === "ACTIVE" && (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, "MUTED")}
                                title="Mute Player"
                                className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg"
                              >
                                <VolumeX className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {u.status === "MUTED" && (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, "ACTIVE")}
                                title="Unmute Player"
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {u.status !== "BANNED" ? (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, "BANNED")}
                                title="Ban Account"
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateUserStatus(u.id, "ACTIVE")}
                                title="Unban Account"
                                className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg text-[10px] font-bold"
                              >
                                Unban
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: REPORTS ==================== */}
      {activeTab === "reports" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Moderation & Reports Queue
          </h2>

          {reports.length > 0 ? (
            <div className="flex flex-col gap-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        Report against @{r.reportedUser?.username}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          r.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-emerald-500/20 text-emerald-300"
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans italic">"{r.reason}"</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Filed by @{r.reporter?.username} • {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleResolveReport(r.id, "MUTE")}
                        className="bg-amber-500 hover:bg-amber-400 text-black px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Mute User
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, "BAN")}
                        className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Ban User
                      </button>
                      <button
                        onClick={() => handleResolveReport(r.id, "NONE")}
                        className="bg-[#141C38] hover:bg-[#1C274E] text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              No open reports. All clean!
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 4: REWARDS & WHEEL ==================== */}
      {activeTab === "rewards" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#F36E0F]" /> Daily Welcome Wheel Segments Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rewards.map((rw) => (
              <div
                key={rw.id}
                className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md"
                    style={{ backgroundColor: rw.colorHex || "#F36E0F" }}
                  >
                    #{rw.segmentIndex + 1}
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                    Prob: {(rw.probability * 100).toFixed(1)}%
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{rw.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{rw.description}</p>
                  <span className="text-[11px] font-mono text-emerald-400 mt-1 block">+{rw.xpValue} XP</span>
                </div>

                <button
                  onClick={() => setEditingReward(rw)}
                  className="bg-[#141C38] hover:bg-[#1C274E] text-slate-200 text-xs font-semibold py-1.5 rounded-lg border border-[#1E293B] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit Segment
                </button>
              </div>
            ))}
          </div>

          {editingReward && (
            <div className="bg-[#060B1A] border-2 border-[#F36E0F] rounded-xl p-6 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-[#F36E0F]" /> Edit Wheel Segment #{editingReward.segmentIndex + 1}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">NAME</label>
                  <input
                    type="text"
                    value={editingReward.name}
                    onChange={(e) => setEditingReward({ ...editingReward, name: e.target.value })}
                    className="bg-[#121B3B] text-white rounded-lg p-2 text-xs border border-[#1E293B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">PROBABILITY (0.01 - 1.0)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingReward.probability}
                    onChange={(e) => setEditingReward({ ...editingReward, probability: e.target.value })}
                    className="bg-[#121B3B] text-white rounded-lg p-2 text-xs border border-[#1E293B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-400">XP VALUE</label>
                  <input
                    type="number"
                    value={editingReward.xpValue}
                    onChange={(e) => setEditingReward({ ...editingReward, xpValue: e.target.value })}
                    className="bg-[#121B3B] text-white rounded-lg p-2 text-xs border border-[#1E293B]"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveReward}
                  className="bg-[#F36E0F] text-black font-bold text-xs px-4 py-2 rounded-lg"
                >
                  Save Segment
                </button>
                <button
                  onClick={() => setEditingReward(null)}
                  className="bg-slate-700 text-white text-xs px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 5: AUDIT LOGS ==================== */}
      {activeTab === "audit" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" /> Administrative Security Audit Trail
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#1E293B] text-[11px] uppercase text-slate-400">
                  <th className="pb-3 px-2">Timestamp</th>
                  <th className="pb-3 px-2">Admin</th>
                  <th className="pb-3 px-2">Action</th>
                  <th className="pb-3 px-2">Target</th>
                  <th className="pb-3 px-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#121B3B]/50 transition-colors">
                    <td className="py-2.5 px-2 text-slate-400 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-2 text-white font-bold">@{log.admin?.username}</td>
                    <td className="py-2.5 px-2 text-red-400 font-bold">{log.action}</td>
                    <td className="py-2.5 px-2 text-slate-300">{log.targetType}</td>
                    <td className="py-2.5 px-2 text-slate-300 max-w-sm truncate" title={log.details}>
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================== TAB 6: SYSTEM TELEMETRY ==================== */}
      {activeTab === "system" && (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-pink-400" /> Live Backend System & Node.js Telemetry
            </h2>
            <button
              onClick={loadSystemTelemetry}
              disabled={loadingSystem}
              className="bg-[#141C38] hover:bg-[#1C274E] text-slate-200 text-xs font-mono px-3 py-1.5 rounded-lg border border-[#1E293B] transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSystem ? "animate-spin" : ""}`} /> Refresh Metrics
            </button>
          </div>

          {systemTelemetry ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono text-xs">
              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">Database Connection</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> SQLite (dev.db)
                </span>
                <span className="text-[11px] text-slate-300 mt-1">Query Latency: {systemTelemetry.dbLatencyMs} ms</span>
              </div>

              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">Node.js Runtime</span>
                <span className="text-base font-bold text-[#00D2FF] flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> {systemTelemetry.nodeVersion}
                </span>
                <span className="text-[11px] text-slate-300 mt-1">Platform: {systemTelemetry.platform} ({systemTelemetry.arch})</span>
              </div>

              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">Process Memory (RSS)</span>
                <span className="text-base font-bold text-purple-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> {systemTelemetry.memoryRssMb} MB
                </span>
                <span className="text-[11px] text-slate-300 mt-1">Heap: {systemTelemetry.memoryHeapUsedMb} MB / {systemTelemetry.memoryHeapTotalMb} MB</span>
              </div>

              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">System Memory (OS)</span>
                <span className="text-base font-bold text-amber-400">
                  {Math.round(systemTelemetry.osFreeMemMb / 1024)} GB Free / {Math.round(systemTelemetry.osTotalMemMb / 1024)} GB Total
                </span>
              </div>

              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">Process Uptime</span>
                <span className="text-base font-bold text-emerald-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {Math.floor(systemTelemetry.uptimeSeconds / 60)} minutes ({systemTelemetry.uptimeSeconds}s)
                </span>
              </div>

              <div className="bg-[#060B1A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-1">
                <span className="text-slate-400 text-[10px] uppercase">Socket Transport Port</span>
                <span className="text-base font-bold text-white">HTTP / WS :3000</span>
                <span className="text-[11px] text-emerald-400 mt-1">Status: Listening & Handling Connections</span>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs font-mono">
              Loading system metrics...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-[#EA0000]">
          <div className="w-10 h-10 border-4 border-[#EA0000] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminPageContent />
    </Suspense>
  );
}
