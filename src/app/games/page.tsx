"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Gamepad2,
  HelpCircle,
  ExternalLink,
  Sparkles,
  Play,
  Download,
  ShieldCheck,
  Zap,
  Coins,
  UserPlus,
} from "lucide-react";
import GameLauncherModal, {
  OutsourcedGameDetail,
  LinkedAccountInfo,
} from "@/components/games/GameLauncherModal";

const DEFAULT_OUTSOURCED_GAMES: OutsourcedGameDetail[] = [
  {
    key: "gamevault",
    name: "Gamevault",
    category: "Arcade Slots",
    image: "https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw",
    scheme: "gamevault://",
    androidPackage: "com.gamevault999",
    downloadUrl: "http://download.gamevault999.com",
    webUrl: "http://download.gamevault999.com",
    popular: true,
  },
  {
    key: "milkyway",
    name: "Milkyway",
    category: "Galaxy Slots & Sweeps",
    image: "https://imgs.search.brave.com/Tlzn3aZeJ6EDvNRZ2zUB2cMwydj0T9vFsEI_913rej0/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9taWxr/eXdheWFwcC5uZXQv/d3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MTAvTWlsa3l3YXkt/Nzc3LTItMTAyNHg1/MTIud2VicA",
    scheme: "milkyway://",
    androidPackage: "com.milkywayapp",
    downloadUrl: "http://milkywayapp.xyz",
    webUrl: "http://milkywayapp.xyz",
    popular: true,
  },
  {
    key: "juwa777",
    name: "Juwa 777",
    category: "Classic Sweepstakes",
    image: "https://imgs.search.brave.com/tXwpIxfEr6s25ESoFJ9tBoNcqa9ppSbyXdm3W6-H8Do/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9qdXdh/Nzc3Lm5ldC93cC1j/b250ZW50L3VwbG9h/ZHMvMjAyNC8wNS9q/dXdhLTc3Ny1mZWF0/dXJlZC1pbWcud2Vi/cA",
    scheme: "juwa://",
    androidPackage: "com.juwa777.app",
    downloadUrl: "https://dl.juwa777.com",
    webUrl: "https://m.juwa777.com",
    popular: true,
  },
  {
    key: "firekirin",
    name: "Firekirin",
    category: "Fish Tables & Action",
    image: "https://imgs.search.brave.com/LT0vo5AqqrrMoIsHvvibj_VNF8IsCqPqcjnRJ1Z4yXc/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9hdHMu/aW8vd3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MDgvRmlyZS1L/aXJpbi0xMDI0eDM0/MS5wbmc",
    scheme: "firekirin://",
    androidPackage: "com.firekirin",
    downloadUrl: "https://firekirin.online",
    webUrl: "https://firekirin.online",
    popular: true,
  },
  {
    key: "orionstars",
    name: "Orion Stars",
    category: "Galaxy Action",
    image: "https://imgs.search.brave.com/oJzz1KjSkS4O5r3h5gNR2EQmLu-iIyPUlZSwSD896-M/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wbGF5/b3Jpb25zdGFyc29u/bGluZS5jb20vd3At/Y29udGVudC91cGxv/YWRzLzIwMjMvMDEv/TG9hZC1Pcmlvbi1T/dGFycy1hY2NvdW50/LmpwZw",
    scheme: "orionstars://",
    androidPackage: "com.orionstars.slots",
    downloadUrl: "https://orionstarsonline.com",
    webUrl: "https://playorionstarsonline.com",
    popular: true,
  },
  {
    key: "vblink",
    name: "Vb Link",
    category: "Slots & Sweeps",
    image: "https://imgs.search.brave.com/0w3SQ1tg4-BUQZ0upOFhnV2Y5bPpgyc1OjK8tOhTQ8E/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly92Ymxp/bmsuaW8vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjMvMDIvVmJs/aW5rNzc3LTQwMHg0/MDAtMS0zMDB4MzAw/LmpwZw",
    scheme: "vblink://",
    androidPackage: "com.vblink777.club",
    downloadUrl: "http://www.vblink777.club",
    webUrl: "http://www.vblink777.club",
  },
  {
    key: "ultrapanda",
    name: "Ultra panda",
    category: "Animal Slots",
    image: "https://imgs.search.brave.com/BnanF6ACwnLawzPBQ5jJLm-9pCHa38-fC6NiwhjgOiw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly91bHRy/YXBhbmRhNzc3Lm9u/bGluZS93cC1jb250/ZW50L3VwbG9hZHMv/MjAyMy8wOS9VbHRy/YS1QYW5kYS03Nzct/b25saW5lLWNhc2lu/by53ZWJw",
    scheme: "ultrapanda://",
    androidPackage: "com.ultrapanda.mobi",
    downloadUrl: "http://www.ultrapanda.mobi",
    webUrl: "http://www.ultrapanda.mobi",
  },
  {
    key: "pandamaster",
    name: "Panda Master",
    category: "Panda Arcade",
    image: "https://imgs.search.brave.com/OpwLw15wcLlbodP_8aKJBqjoBj79oOR5TGnkAkzZHfo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wYW5k/YW1hc3Rlcjc3Ny5w/cm8vd3AtY29udGVudC91/cGxvYWRzLzIwMjQv/MDYvUGFuZGFN/YXN0ZXI3NzcucHJv/LTItMS0xMDI0eDU3/Ni53ZWJw",
    scheme: "pandamaster://",
    androidPackage: "com.pandamaster.vip",
    downloadUrl: "https://pandamaster.vip:8888",
    webUrl: "https://pandamaster.vip:8888",
  },
  {
    key: "cashfrenzy",
    name: "Cash Frenzy",
    category: "High Roller Sweeps",
    image: "https://imgs.search.brave.com/13ORlt3BjnBzJVi35UoHUljUcGDogn0jNWX52Wp2Wc4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tLm1l/ZGlhLWFtYXpvbi5j/b20vaW1hZ2VzL0kv/ODExN1loRkxxUkwu/cG5n",
    scheme: "cashfrenzy://",
    androidPackage: "com.cashfrenzy777",
    downloadUrl: "https://www.cashfrenzy777.com",
    webUrl: "https://www.cashfrenzy777.com",
  },
  {
    key: "highroller",
    name: "High Roller",
    category: "VIP Tables",
    image: "https://imgs.search.brave.com/cNARK3qPS48XG_IzILVW_hDMydY0CdGWRcmlIHRAXh8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tb2Rl/ZGl0b3IubmV0L3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDI0LzEx/L0hpZ2gtUm9sbGVy/LTc3Ny5qcGc",
    scheme: "highstakes://",
    androidPackage: "com.highstakesweeps",
    downloadUrl: "https://dl.highstakesweeps.com",
    webUrl: "https://dl.highstakesweeps.com",
  },
  {
    key: "vegassweeps",
    name: "Vegas Sweeps",
    category: "Vegas Classic",
    image: "https://imgs.search.brave.com/-uWOPAQnKMXpdB6gSwJIOQK09vSL48Kkqy_9uo3kUP4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly92ZWdh/c3N3ZWVwLm5ldC93/cC1jb250ZW50L3Vw/bG9hZHMvMjAyNC8w/Ny9WZWdhcy1Td2Vl/cC1Mb2dpbi53ZWJw",
    scheme: "vegassweeps://",
    androidPackage: "com.lasvegassweeps",
    downloadUrl: "https://m.lasvegassweeps.com",
    webUrl: "https://m.lasvegassweeps.com",
  },
  {
    key: "cashmachine",
    name: "Cash Machine",
    category: "Reels & Bars",
    image: "https://imgs.search.brave.com/TuXSyHIED_gDY16_kXdLQyDJdPPXzl28hxJFtppfbek/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9jYXNo/bWFjaGluZTc3N2Fw/ay51cy93cC1jb250/ZW50L3VwbG9hZHMv/MjAyNC8wNS9jYXNo/LW1hY2hpbmUtNzc3/LWFway53ZWJw",
    scheme: "cashmachine://",
    androidPackage: "com.cashmachine777",
    downloadUrl: "https://www.cashmachine777.com/m",
    webUrl: "https://www.cashmachine777.com/m",
  },
  {
    key: "riversweeps",
    name: "River sweeps",
    category: "River Gold",
    image: "https://imgs.search.brave.com/0nK7m3QIe_Jt5ePplqUjMQKhEhz_AdnamOPQIzf6LbA/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tb2Rl/ZGl0b3IubmV0L3dw/LWNvbnRlbnQvdXBs/b2Fkcy8yMDI0LzA0/L1JpdmVyU3dlZXBz/LTc3Ny0xMDI0eDEw/MjQuanBn",
    scheme: "riversweeps://",
    androidPackage: "com.river777",
    downloadUrl: "https://river777.com/",
    webUrl: "https://river777.com/",
  },
  {
    key: "yolo",
    name: "Yolo",
    category: "Fast Sweeps",
    image: "https://imgs.search.brave.com/4UGeXAjM2C115p1XlfQGPJmnk4I4WWCBcukvSlRoHvo/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly95b2xv/Nzc3LmlvL3dwLWNv/bnRlbnQvdXBsb2Fk/cy8yMDI0LzA2L1lv/bG8tNzc3LUdhbWUt/UGxheS0xMDI0eDQ2/Mi5wbmc",
    scheme: "yolo777://",
    androidPackage: "com.yolo777.game",
    downloadUrl: "https://yolo777.game",
    webUrl: "https://yolo777.game",
  },
  {
    key: "mafia",
    name: "Mafia",
    category: "Underworld Crime",
    image: "https://imgs.search.brave.com/yjlwfNMenfuViRWZhc7-xE0suFYVZiGhLZcxmRqYIqU/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9iaXRw/bGF5LmFnL19uZXh0/L2ltYWdlP3VybD1o/dHRwczovL2JpdHBs/YXktbmV3LmFtczMu/ZGlnaXRhbG9jZWFu/c3BhY2VzLmNvbS9Q/Uk9EL3VwbG9hZHMv/bWFmaWFfbXZpVFRx/eS53ZWJwJnc9ODI4/JnE9NzU",
    scheme: "mafia777://",
    androidPackage: "com.mafia77777",
    downloadUrl: "https://www.mafia77777.com/m",
    webUrl: "https://www.mafia77777.com/m",
  },
];

export default function GamesPage() {
  const [catalogTab, setCatalogTab] = useState<"inhouse" | "outsourced">("inhouse");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGameForLauncher, setSelectedGameForLauncher] = useState<OutsourcedGameDetail | null>(null);
  const [launcherInitialTab, setLauncherInitialTab] = useState<"play" | "balance" | "create_id">("play");
  const [linkedAccounts, setLinkedAccounts] = useState<Record<string, LinkedAccountInfo>>({});
  const [outsourcedGames, setOutsourcedGames] = useState<OutsourcedGameDetail[]>(DEFAULT_OUTSOURCED_GAMES);

  const fetchAccounts = () => {
    fetch("/api/games/my-accounts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.accounts && Array.isArray(data.accounts)) {
          const map: Record<string, LinkedAccountInfo> = {};
          data.accounts.forEach((acc: any) => {
            map[acc.gameKey] = acc;
          });
          setLinkedAccounts(map);
        }
      })
      .catch(() => {});
  };

  const fetchGamesCatalog = async () => {
    try {
      const res = await fetch("/api/games");
      if (res.ok) {
        const data = await res.json();
        if (data.games && Array.isArray(data.games) && data.games.length > 0) {
          const mapped: OutsourcedGameDetail[] = data.games.map((g: any) => ({
            key: g.gameKey,
            name: g.displayName,
            category: g.category,
            image:
              g.imageUrl ||
              "https://imgs.search.brave.com/X1FgkIEQjsjkqz8rg76li3YPN8VpctWu7STXGD3Gz_8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly93d3cu/Z2FtZXZhdWx0LTk5/OS5jb20vd3AtY29u/dGVudC91cGxvYWRz/LzIwMjQvMDkvZ2Ft/ZXZhdWx0LTk5OS5j/b21fLnBuZw",
            scheme: g.scheme || `${g.gameKey}://`,
            androidPackage: g.androidPackage || undefined,
            downloadUrl: g.downloadUrl || g.playUrl || "http://download.gamevault999.com",
            webUrl: g.playUrl || g.downloadUrl || "http://download.gamevault999.com",
            popular: g.isPopular,
          }));
          setOutsourcedGames(mapped);
        }
      }
    } catch (e) {
      console.error("Failed to fetch games catalog:", e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchGamesCatalog();
  }, []);

  const filteredOutsourced = outsourcedGames.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="text-center flex flex-col items-center gap-3">
          <div className="inline-flex items-center gap-2 bg-[#142055] border border-[#F36E0F]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#F36E0F]">
            <Sparkles className="w-4 h-4 text-[#F6FF00]" /> Dual-Catalog Platform
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white">
            Casino <span className="text-[#F36E0F]">Games Lobby</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm sm:text-base">
            Choose between our interactive <strong>In-House Originals</strong> (playable right here in your browser) or connect to top <strong>Outsourced Partner Titles</strong> with smart app deep linking.
          </p>

          {/* Catalog Tab Switcher */}
          <div className="mt-4 flex items-center gap-3 bg-[#0c163b] border border-[#1b2a7a] p-1.5 rounded-2xl shadow-xl">
            <button
              onClick={() => setCatalogTab("inhouse")}
              className={`flex items-center gap-2 text-xs sm:text-sm font-black px-6 py-3 rounded-xl transition-all ${
                catalogTab === "inhouse"
                  ? "bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] text-black shadow-lg shadow-orange-500/30 scale-105"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              In-House Originals (Play In Browser)
            </button>
            <button
              onClick={() => setCatalogTab("outsourced")}
              className={`flex items-center gap-2 text-xs sm:text-sm font-black px-6 py-3 rounded-xl transition-all ${
                catalogTab === "outsourced"
                  ? "bg-[#F36E0F] text-black shadow-lg shadow-orange-500/30 scale-105"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
              Outsourced Partner Games (15 Titles)
            </button>
          </div>
        </div>

        {/* Tab 1: IN-HOUSE ORIGINALS */}
        {catalogTab === "inhouse" && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-2">
            {/* Featured Playable Game Hero: Kali Fishing Hunter */}
            <div className="bg-gradient-to-r from-[#0c163b] via-[#142055] to-[#0c163b] border-2 border-[#F36E0F] rounded-3xl p-6 sm:p-10 shadow-[0_0_50px_rgba(243,110,15,0.3)] relative overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#EA0000] text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      FEATURED ORIGINAL
                    </span>
                    <span className="bg-[#1f3078] text-[#00D2FF] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      60 FPS Canvas Arcade
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-black text-white">
                    Kali Fishing Hunter: <br />
                    <span className="text-[#FFD700]">Deep Ocean Arena</span>
                  </h2>

                  <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                    Lock onto swimming targets, adjust your cannon bet levels (10 to 100 coins), deploy Freeze Bombs & Hyper Lasers, and take down the colossal <strong>Golden Leviathan for a 150x Jackpot</strong>!
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-2">
                    <Link
                      href="/games/fishing"
                      className="bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:scale-105 text-black font-black text-base px-8 py-4 rounded-xl shadow-[0_0_25px_rgba(243,110,15,0.6)] transition-all flex items-center gap-2"
                    >
                      <Play className="w-5 h-5 fill-black" />
                      PLAY DEMO NOW
                    </Link>

                    <div className="text-xs text-slate-300 font-semibold bg-[#070719]/80 px-4 py-3 rounded-xl border border-white/10">
                      ⚡ Free 1,000 Demo Coins Included
                    </div>
                  </div>
                </div>

                {/* Game Art Preview */}
                <div className="flex justify-center items-center relative">
                  <div className="w-full max-w-md h-64 sm:h-72 rounded-2xl bg-[#030c22] border-2 border-[#00D2FF]/40 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00D2FF] to-[#1b2a7a] flex items-center justify-center mb-4 shadow-[0_0_20px_#00D2FF]">
                      <Play className="w-10 h-10 text-white fill-white translate-x-1" />
                    </div>
                    <h3 className="text-xl font-black text-white">Interactive Fish Table</h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Full sound effects, animated fish species, and instant payout floaters.
                    </p>
                    <Link
                      href="/games/fishing"
                      className="mt-4 text-xs font-bold text-[#F36E0F] hover:underline"
                    >
                      Click to Launch Game Screen →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming In-House Originals Teasers */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" /> Upcoming Platform Originals
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-orange-500/20 text-[#F36E0F] flex items-center justify-center font-bold">
                      🚀
                    </span>
                    <span className="text-[10px] bg-[#142055] text-slate-400 font-bold px-2 py-0.5 rounded">
                      IN DEVELOPMENT
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Kali Rocket Crash</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Cash out before the rocket explodes. Multiplier accelerates up to 1,000x!
                    </p>
                  </div>
                </div>

                <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                      🎯
                    </span>
                    <span className="text-[10px] bg-[#142055] text-slate-400 font-bold px-2 py-0.5 rounded">
                      IN DEVELOPMENT
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Kali Plinko Galaxy</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Physics-based pin bounce casino game with high-risk multiplier pockets.
                    </p>
                  </div>
                </div>

                <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-2xl p-6 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      🎡
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                      LIVE NOW
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Daily Welcome Wheel</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Server-audited daily bonus wheel for badges, frames, and platform XP.
                    </p>
                  </div>
                  <Link
                    href="/wheel"
                    className="text-xs font-bold text-[#F36E0F] hover:underline"
                  >
                    Spin Welcome Wheel →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: OUTSOURCED PARTNER GAMES */}
        {catalogTab === "outsourced" && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2">
            {/* Search Bar */}
            <div className="flex items-center justify-between gap-4 bg-[#0c163b] p-4 rounded-2xl border border-white/10 shadow-lg">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search outsourced partner games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#142055] text-white placeholder:text-slate-400 rounded-full pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>

              <div className="text-xs text-slate-300 font-semibold hidden sm:block">
                Showing {filteredOutsourced.length} External Sweepstakes Titles with Smart App Launching
              </div>
            </div>

            {/* 15 Outsourced Games Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredOutsourced.map((game) => {
                const linked = linkedAccounts[game.key];

                return (
                  <div
                    key={game.key}
                    className="bg-[#0c163b] border-2 border-white/60 hover:border-[#F36E0F] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col group"
                  >
                    {/* Game Cover */}
                    <div
                      className="h-44 bg-center bg-cover relative cursor-pointer"
                      style={{ backgroundImage: `url(${game.image})` }}
                      onClick={() => setSelectedGameForLauncher(game)}
                    >
                      <span className="absolute top-2 left-2 bg-[#142055]/90 border border-white/20 text-white font-bold text-[9px] px-2 py-0.5 rounded uppercase">
                        Partner Game
                      </span>

                      {/* Linked Badge or Create ID Pill */}
                      {linked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGameForLauncher(game);
                            setLauncherInitialTab("balance");
                          }}
                          title="Click to check live balance"
                          className="absolute top-2 right-2 bg-emerald-600/90 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 shadow-md transition-colors"
                        >
                          <ShieldCheck className="w-3 h-3" /> {linked.gameUsername} ({linked.totalPointsLoaded} pts)
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedGameForLauncher(game);
                            setLauncherInitialTab("create_id");
                          }}
                          title="Create or link an ID for this game"
                          className="absolute top-2 right-2 bg-[#1b2a7a]/90 hover:bg-[#253999] border border-[#F36E0F]/50 text-white font-bold text-[9px] px-2 py-0.5 rounded flex items-center gap-1 shadow-md transition-colors"
                        >
                          <UserPlus className="w-3 h-3 text-[#F36E0F]" /> + Create ID
                        </button>
                      )}

                      {/* Overlay Play Hover */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#F36E0F] text-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="w-6 h-6 fill-black translate-x-0.5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-3 bg-[#0c163b]">
                      <div>
                        <h3 className="text-base font-bold text-white">{game.name}</h3>
                        <p className="text-xs text-slate-400">{game.category}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                        {/* Smart Play Button (launches app or falls back to download) */}
                        <button
                          onClick={() => {
                            setSelectedGameForLauncher(game);
                            setLauncherInitialTab("play");
                          }}
                          className="flex-1 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 text-black font-black text-xs py-2 rounded-md transition-all flex items-center justify-center gap-1 shadow-sm"
                          title={`Play ${game.name} (Opens App or Download)`}
                        >
                          <Play className="w-3 h-3 fill-black" /> Play
                        </button>

                        {/* Check Balance Button */}
                        <button
                          onClick={() => {
                            setSelectedGameForLauncher(game);
                            setLauncherInitialTab("balance");
                          }}
                          title="Check Live Balance"
                          className="bg-[#142055] hover:bg-[#1b2a7a] text-emerald-400 hover:text-white p-2 rounded-md transition-colors flex items-center justify-center"
                        >
                          <Coins className="w-3.5 h-3.5" />
                        </button>

                        {/* Direct Download App Button */}
                        <a
                          href={game.downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={`Download ${game.name} App`}
                          className="bg-[#142055] hover:bg-[#1b2a7a] text-[#F36E0F] hover:text-white p-2 rounded-md transition-colors flex items-center justify-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>

                        {/* Help / Support */}
                        <Link
                          href={`/support?game=${encodeURIComponent(game.name)}`}
                          title="Setup & Points Support"
                          className="bg-[#142055] hover:bg-[#1b2a7a] text-amber-300 p-2 rounded-md transition-colors flex items-center justify-center"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Smart Game Launcher Modal */}
        <GameLauncherModal
          game={selectedGameForLauncher}
          isOpen={!!selectedGameForLauncher}
          onClose={() => setSelectedGameForLauncher(null)}
          linkedAccount={selectedGameForLauncher ? linkedAccounts[selectedGameForLauncher.key] : null}
          onAccountUpdated={fetchAccounts}
          initialTab={launcherInitialTab}
        />
      </div>
    </div>
  );
}
