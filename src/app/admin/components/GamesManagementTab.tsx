"use client";

import React, { useState, useEffect } from "react";
import {
  Gamepad2,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Download,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Eye,
  EyeOff,
  Sparkles,
  Link as LinkIcon,
  X,
  Save,
  ShieldCheck,
  Globe,
} from "lucide-react";

export interface GameCatalogItem {
  id: string;
  gameKey: string;
  displayName: string;
  category: string;
  imageUrl?: string | null;
  playUrl?: string | null;
  downloadUrl?: string | null;
  scheme?: string | null;
  androidPackage?: string | null;
  isPopular: boolean;
  isEnabled: boolean;
  sortOrder: number;
  apiBaseUrl?: string | null;
  agentId?: string | null;
  secretKey?: string | null;
  playerCount?: number;
  hasApiCredentials?: boolean;
}

export default function GamesManagementTab() {
  const [games, setGames] = useState<GameCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<GameCatalogItem | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formGameKey, setFormGameKey] = useState("");
  const [formCategory, setFormCategory] = useState("Arcade Slots");
  const [formPlayUrl, setFormPlayUrl] = useState("");
  const [formDownloadUrl, setFormDownloadUrl] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formScheme, setFormScheme] = useState("");
  const [formAndroidPackage, setFormAndroidPackage] = useState("");
  const [formIsPopular, setFormIsPopular] = useState(false);
  const [formIsEnabled, setFormIsEnabled] = useState(true);
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [formApiBaseUrl, setFormApiBaseUrl] = useState("");
  const [formAgentId, setFormAgentId] = useState("");
  const [formSecretKey, setFormSecretKey] = useState("");

  const fetchGames = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/games/catalog");
      if (res.ok) {
        const data = await res.json();
        setGames(data.games || []);
      }
    } catch (e) {
      console.error("Failed to fetch games catalog:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  const openAddModal = () => {
    setEditingGame(null);
    setFormDisplayName("");
    setFormGameKey("");
    setFormCategory("Arcade Slots");
    setFormPlayUrl("");
    setFormDownloadUrl("");
    setFormImageUrl("https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw");
    setFormScheme("");
    setFormAndroidPackage("");
    setFormIsPopular(false);
    setFormIsEnabled(true);
    setShowApiSettings(false);
    setFormApiBaseUrl("");
    setFormAgentId("");
    setFormSecretKey("");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (game: GameCatalogItem) => {
    setEditingGame(game);
    setFormDisplayName(game.displayName);
    setFormGameKey(game.gameKey);
    setFormCategory(game.category);
    setFormPlayUrl(game.playUrl || "");
    setFormDownloadUrl(game.downloadUrl || "");
    setFormImageUrl(game.imageUrl || "");
    setFormScheme(game.scheme || "");
    setFormAndroidPackage(game.androidPackage || "");
    setFormIsPopular(game.isPopular);
    setFormIsEnabled(game.isEnabled);
    setShowApiSettings(!!(game.apiBaseUrl || game.agentId));
    setFormApiBaseUrl(game.apiBaseUrl || "");
    setFormAgentId(game.agentId || "");
    setFormSecretKey(game.secretKey || "");
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormDisplayName(name);
    if (!editingGame) {
      // Auto-generate slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .slice(0, 20);
      setFormGameKey(slug);
      if (!formScheme) {
        setFormScheme(`${slug}://`);
      }
    }
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDisplayName.trim()) {
      setErrorMsg("Please enter a game title.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      id: editingGame?.id,
      gameKey: formGameKey.trim() || undefined,
      displayName: formDisplayName.trim(),
      category: formCategory.trim(),
      imageUrl: formImageUrl.trim(),
      playUrl: formPlayUrl.trim(),
      downloadUrl: formDownloadUrl.trim(),
      scheme: formScheme.trim(),
      androidPackage: formAndroidPackage.trim(),
      isPopular: formIsPopular,
      isEnabled: formIsEnabled,
      apiBaseUrl: formApiBaseUrl.trim() || undefined,
      agentId: formAgentId.trim() || undefined,
      secretKey: formSecretKey.trim() || undefined,
    };

    try {
      const url = "/api/admin/games/catalog";
      const method = editingGame ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save game");
      }

      setSuccessMsg(data.message || `Game ${editingGame ? "updated" : "added"} successfully!`);
      setModalOpen(false);
      fetchGames();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save game");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (game: GameCatalogItem) => {
    try {
      const res = await fetch("/api/admin/games/catalog", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: game.id,
          isEnabled: !game.isEnabled,
        }),
      });

      if (res.ok) {
        setGames((prev) =>
          prev.map((g) => (g.id === game.id ? { ...g, isEnabled: !g.isEnabled } : g))
        );
        setSuccessMsg(
          `Game "${game.displayName}" is now ${!game.isEnabled ? "ACTIVE in the player lobby" : "DISABLED"}.`
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGame = async (game: GameCatalogItem) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove "${game.displayName}" from the games catalog?\n\nThis will remove it from the public lobby.`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/admin/games/catalog?id=${game.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove game");
      }

      setSuccessMsg(`"${game.displayName}" was removed from the catalog.`);
      fetchGames();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove game");
    }
  };

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      g.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.gameKey.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "ACTIVE") return matchesSearch && g.isEnabled;
    if (statusFilter === "INACTIVE") return matchesSearch && !g.isEnabled;
    return matchesSearch;
  });

  const activeCount = games.filter((g) => g.isEnabled).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner & Stats */}
      <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#F36E0F]/10 border border-[#F36E0F]/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold text-[#F36E0F] mb-1.5">
            <Gamepad2 className="w-3.5 h-3.5" />
            Games Management Console
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Games Catalog & Links
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Add new games, update play & download links, configure mobile app deep links, or remove games. Changes reflect instantly in the player lobby.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-[#121B3B] border border-[#1E293B] px-4 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Games</span>
            <span className="text-lg font-black text-white font-mono">{games.length}</span>
          </div>
          <div className="bg-[#121B3B] border border-[#1E293B] px-4 py-2 rounded-xl text-center flex-1 md:flex-initial">
            <span className="text-[10px] uppercase font-mono text-emerald-400 block">Live / Active</span>
            <span className="text-lg font-black text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <button
            onClick={openAddModal}
            className="bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:scale-105 active:scale-95 text-black font-black text-xs px-5 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add New Game
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl text-xs flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A1026] p-4 rounded-2xl border border-[#1E293B]">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by game title, category, or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121B3B] text-white placeholder:text-slate-400 rounded-xl pl-10 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ALL" ? "bg-[#1E293B] text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            All ({games.length})
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "ACTIVE" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              statusFilter === "INACTIVE" ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Disabled ({games.length - activeCount})
          </button>
          <button
            onClick={fetchGames}
            title="Refresh Catalog"
            className="p-2 bg-[#121B3B] hover:bg-[#1E293B] text-slate-300 rounded-lg transition-colors ml-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Games Catalog Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#F36E0F] animate-spin" />
          <span className="text-xs text-slate-400">Loading games catalog...</span>
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-[#0A1026] border border-[#1E293B] rounded-2xl p-12 text-center flex flex-col items-center gap-3">
          <Gamepad2 className="w-12 h-12 text-slate-600" />
          <h3 className="text-base font-bold text-white">No games found</h3>
          <p className="text-xs text-slate-400 max-w-sm">
            {searchTerm ? `No games matching "${searchTerm}".` : "Your catalog is empty. Click 'Add New Game' to add your first title!"}
          </p>
          <button
            onClick={openAddModal}
            className="mt-2 bg-[#F36E0F] hover:bg-orange-500 text-black font-black text-xs px-4 py-2 rounded-xl"
          >
            + Add New Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className={`bg-[#0A1026] border-2 rounded-2xl overflow-hidden shadow-xl flex flex-col transition-all duration-200 hover:-translate-y-1 ${
                game.isEnabled ? "border-[#1E293B] hover:border-[#F36E0F]" : "border-slate-800 opacity-60"
              }`}
            >
              {/* Game Cover */}
              <div
                className="h-36 bg-cover bg-center relative"
                style={{
                  backgroundImage: `url(${
                    game.imageUrl ||
                    "https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw"
                  })`,
                }}
              >
                {/* Status Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      game.isEnabled ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {game.isEnabled ? "LIVE" : "DISABLED"}
                  </span>
                  {game.isPopular && (
                    <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> POPULAR
                    </span>
                  )}
                </div>

                {/* API Status Badge */}
                <div className="absolute top-2 right-2">
                  {game.hasApiCredentials ? (
                    <span className="bg-blue-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1 shadow">
                      <ShieldCheck className="w-3 h-3" /> API Ready
                    </span>
                  ) : (
                    <span className="bg-black/60 text-slate-300 text-[9px] px-2 py-0.5 rounded">
                      Standard Link
                    </span>
                  )}
                </div>
              </div>

              {/* Game Info */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3 bg-[#0A1026]">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-white truncate" title={game.displayName}>
                      {game.displayName}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-[#121B3B] px-1.5 py-0.5 rounded whitespace-nowrap">
                      {game.gameKey}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{game.category}</p>
                </div>

                {/* Links Display & Verification */}
                <div className="bg-[#121B3B] rounded-xl p-2.5 flex flex-col gap-1.5 text-[11px] font-mono">
                  {/* Play Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#00D2FF]" /> Play:
                    </span>
                    {game.playUrl ? (
                      <a
                        href={game.playUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00D2FF] hover:underline flex items-center gap-1 truncate max-w-[140px]"
                        title={game.playUrl}
                      >
                        <span className="truncate">{game.playUrl.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>

                  {/* Download Link */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Download className="w-3 h-3 text-[#F36E0F]" /> Download:
                    </span>
                    {game.downloadUrl ? (
                      <a
                        href={game.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#F36E0F] hover:underline flex items-center gap-1 truncate max-w-[140px]"
                        title={game.downloadUrl}
                      >
                        <span className="truncate">{game.downloadUrl.replace(/^https?:\/\//, "")}</span>
                        <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">None</span>
                    )}
                  </div>

                  {/* Scheme */}
                  {game.scheme && (
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Smartphone className="w-2.5 h-2.5 text-emerald-400" /> Deep Link:
                      </span>
                      <span className="text-emerald-400 truncate max-w-[140px]">{game.scheme}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-[#1E293B]">
                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleStatus(game)}
                    title={game.isEnabled ? "Disable Game" : "Enable Game"}
                    className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      game.isEnabled
                        ? "bg-[#121B3B] text-emerald-400 hover:bg-[#1E293B]"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {game.isEnabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Edit Game */}
                  <button
                    onClick={() => openEditModal(game)}
                    className="flex-1 bg-[#121B3B] hover:bg-[#1E293B] border border-white/10 text-white font-bold text-xs py-2 px-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3 h-3 text-[#F36E0F]" />
                    Edit Links
                  </button>

                  {/* Delete / Remove Game */}
                  <button
                    onClick={() => handleDeleteGame(game)}
                    title="Remove Game from Catalog"
                    className="p-2 bg-[#121B3B] hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl bg-[#0A1026] border-2 border-[#F36E0F] rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(243,110,15,0.4)] text-white flex flex-col gap-5 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div>
              <div className="inline-flex items-center gap-1.5 bg-[#F36E0F]/10 text-[#F36E0F] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase">
                <Gamepad2 className="w-3 h-3" />
                {editingGame ? "Update Game Catalog Entry" : "Create New Game Entry"}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {editingGame ? `Edit: ${editingGame.displayName}` : "Add New Game"}
              </h2>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveGame} className="flex flex-col gap-4">
              {/* Display Name & Game Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                    Game Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gamevault, Dragon City"
                    value={formDisplayName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                    Game Key Slug (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingGame}
                    placeholder="e.g. gamevault, dragon_city"
                    value={formGameKey}
                    onChange={(e) => setFormGameKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                  Game Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arcade Slots, Fish Tables & Action, Galaxy Sweeps"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none"
                />
              </div>

              {/* Links: Play Link & Download Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#00D2FF]" /> Web Play URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (URL to play in browser)"
                    value={formPlayUrl}
                    onChange={(e) => setFormPlayUrl(e.target.value)}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                    <Download className="w-3 h-3 text-[#F36E0F]" /> App Download URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://... (APK / iOS / Download page)"
                    value={formDownloadUrl}
                    onChange={(e) => setFormDownloadUrl(e.target.value)}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Deep Link Scheme & Android Package */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase flex items-center gap-1">
                    <Smartphone className="w-3 h-3 text-emerald-400" /> App URI Scheme
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. gamevault:// or milkyway://"
                    value={formScheme}
                    onChange={(e) => setFormScheme(e.target.value)}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                    Android Package (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. com.gamevault999"
                    value={formAndroidPackage}
                    onChange={(e) => setFormAndroidPackage(e.target.value)}
                    className="bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-mono text-slate-300 font-bold uppercase">
                  Image Cover URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://... (Direct image link)"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 bg-[#121B3B] text-white border border-[#1E293B] focus:border-[#F36E0F] rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                  />
                  {formImageUrl && (
                    <div
                      className="w-10 h-10 rounded-xl bg-cover bg-center border border-white/20 flex-shrink-0"
                      style={{ backgroundImage: `url(${formImageUrl})` }}
                    />
                  )}
                </div>
              </div>

              {/* Checkboxes: Active & Popular */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                  <input
                    type="checkbox"
                    checked={formIsEnabled}
                    onChange={(e) => setFormIsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-[#F36E0F] rounded"
                  />
                  Enable in Lobby (Visible to Players)
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-amber-300">
                  <input
                    type="checkbox"
                    checked={formIsPopular}
                    onChange={(e) => setFormIsPopular(e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                  Mark as Popular / Featured
                </label>
              </div>

              {/* Optional Provider API Credentials Accordion */}
              <div className="border-t border-[#1E293B] pt-3">
                <button
                  type="button"
                  onClick={() => setShowApiSettings(!showApiSettings)}
                  className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#F36E0F]" />
                  {showApiSettings ? "Hide Provider API Settings" : "Configure Outgoing API Credentials (Optional)"}
                </button>

                {showApiSettings && (
                  <div className="mt-3 bg-[#121B3B]/60 border border-[#1E293B] rounded-xl p-3.5 flex flex-col gap-3">
                    <span className="text-[11px] text-slate-300">
                      If this outsourced game supports automated point loading via the 18-page API:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="url"
                        placeholder="API Base URL (https://...)"
                        value={formApiBaseUrl}
                        onChange={(e) => setFormApiBaseUrl(e.target.value)}
                        className="bg-[#0A1026] text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Agent ID (e.g. 133)"
                        value={formAgentId}
                        onChange={(e) => setFormAgentId(e.target.value)}
                        className="bg-[#0A1026] text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                      <input
                        type="password"
                        placeholder="Secret Key"
                        value={formSecretKey}
                        onChange={(e) => setFormSecretKey(e.target.value)}
                        className="bg-[#0A1026] text-white border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 bg-[#121B3B] hover:bg-[#1E293B] text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 text-black font-black text-xs py-2.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving Game..." : editingGame ? "Save Changes" : "Add Game to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
