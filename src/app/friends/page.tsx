"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Users,
  Search,
  UserCheck,
  UserPlus,
  Check,
  X,
  Sparkles,
  Trash2,
  ExternalLink,
} from "lucide-react";

export default function FriendsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"friends" | "requests" | "search">("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestSentMap, setRequestSentMap] = useState<Record<string, boolean>>({});

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends");
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setPendingIncoming(data.pendingIncoming || []);
        setPendingOutgoing(data.pendingOutgoing || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetUserId: string) => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (res.ok) {
        setRequestSentMap((prev) => ({ ...prev, [targetUserId]: true }));
        fetchFriends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRespondRequest = async (friendshipId: string, action: "ACCEPT" | "DECLINE") => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    if (!confirm("Remove this player from your friend list?")) return;
    try {
      const res = await fetch("/api/friends/request", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendshipId }),
      });
      if (res.ok) {
        fetchFriends();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <Users className="w-12 h-12 text-[#F36E0F]" />
        <p className="text-slate-300">Log in to view friends and search players.</p>
        <Link href="/login" className="bg-[#F36E0F] text-black font-bold px-5 py-2.5 rounded-lg">
          Log In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2.5">
              <Users className="w-8 h-8 text-[#F36E0F]" /> Players & Friends List
            </h1>
            <p className="text-xs text-slate-400 mt-1">Connect with players and track leaderboards</p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 bg-[#0c163b] border border-[#1b2a7a] p-1.5 rounded-xl">
            <button
              onClick={() => setActiveTab("friends")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                activeTab === "friends"
                  ? "bg-[#F36E0F] text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all relative ${
                activeTab === "requests"
                  ? "bg-[#F36E0F] text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Requests ({pendingIncoming.length})
              {pendingIncoming.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              )}
            </button>
            <button
              onClick={() => setActiveTab("search")}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-all ${
                activeTab === "search"
                  ? "bg-[#F36E0F] text-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Search Players
            </button>
          </div>
        </div>

        {/* Tab 1: My Friends */}
        {activeTab === "friends" && (
          <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {friends.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {friends.map((f) => (
                  <div
                    key={f.friendshipId}
                    className="bg-[#142055]/50 border border-[#2a3c91] hover:border-[#F36E0F] rounded-2xl p-4 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative">
                        <img
                          src={f.user.avatar || "/avatars/avatar-1.svg"}
                          alt={f.user.displayName}
                          className="w-12 h-12 rounded-full object-cover border border-[#F36E0F]"
                        />
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0c163b] ${
                            f.user.isOnline ? "bg-emerald-400" : "bg-slate-500"
                          }`}
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/profile/${f.user.id}`}
                          className="text-sm font-bold text-white hover:text-[#F36E0F] truncate block"
                        >
                          {f.user.displayName}
                        </Link>
                        <p className="text-xs text-slate-400 truncate">@{f.user.username}</p>
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> {f.user.xp} XP
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleRemoveFriend(f.friendshipId)}
                        title="Remove Friend"
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center gap-3">
                <Users className="w-12 h-12 text-[#F36E0F] opacity-40" />
                <h3 className="text-lg font-bold text-white">No Friends Added Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Search for players to add them to your friend network and compare XP achievements!
                </p>
                <button
                  onClick={() => setActiveTab("search")}
                  className="mt-2 bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold text-xs px-5 py-2.5 rounded-lg"
                >
                  Search for Players
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Requests */}
        {activeTab === "requests" && (
          <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div>
              <h3 className="text-base font-bold text-white mb-3">Incoming Friend Requests</h3>
              {pendingIncoming.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingIncoming.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="bg-[#142055]/60 border border-[#2a3c91] rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.user.avatar || "/avatars/avatar-1.svg"}
                          alt={req.user.displayName}
                          className="w-10 h-10 rounded-full object-cover border border-[#F36E0F]"
                        />
                        <div>
                          <Link href={`/profile/${req.user.id}`} className="text-sm font-bold text-white hover:underline">
                            {req.user.displayName}
                          </Link>
                          <p className="text-xs text-slate-400">@{req.user.username}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRespondRequest(req.friendshipId, "ACCEPT")}
                          className="bg-emerald-500 hover:bg-emerald-400 text-black p-2 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" /> Accept
                        </button>
                        <button
                          onClick={() => handleRespondRequest(req.friendshipId, "DECLINE")}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 p-2 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No incoming friend requests.</p>
              )}
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="text-base font-bold text-white mb-3">Sent Requests</h3>
              {pendingOutgoing.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pendingOutgoing.map((req) => (
                    <div
                      key={req.friendshipId}
                      className="bg-[#142055]/40 border border-[#2a3c91] rounded-2xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={req.user.avatar || "/avatars/avatar-1.svg"}
                          alt={req.user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">{req.user.displayName}</div>
                          <p className="text-xs text-slate-400">@{req.user.username}</p>
                        </div>
                      </div>
                      <span className="text-xs text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1 rounded-full">
                        Pending
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No pending sent requests.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Search */}
        {activeTab === "search" && (
          <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by username or display name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#142055] text-white placeholder:text-gray-300 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>
              <button
                type="submit"
                disabled={searching}
                className="bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold px-6 py-3 rounded-xl text-sm transition-all shadow-md"
              >
                {searching ? "Searching..." : "Search"}
              </button>
            </form>

            <div>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="bg-[#142055]/50 border border-[#2a3c91] rounded-2xl p-4 flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar || "/avatars/avatar-1.svg"}
                          alt={u.displayName}
                          className="w-12 h-12 rounded-full object-cover border border-[#F36E0F]"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/profile/${u.id}`}
                            className="text-sm font-bold text-white hover:text-[#F36E0F] truncate block"
                          >
                            {u.displayName}
                          </Link>
                          <p className="text-xs text-slate-400">@{u.username}</p>
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {u.xp} XP
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        {requestSentMap[u.id] ? (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Request Sent
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(u.id)}
                            className="flex-1 bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add Friend
                          </button>
                        )}
                        <Link
                          href={`/profile/${u.id}`}
                          className="p-2 bg-[#1f3078] hover:bg-[#142055] text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                searchQuery &&
                !searching && (
                  <p className="text-center text-xs text-slate-400 py-8">
                    No players found matching "{searchQuery}".
                  </p>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
