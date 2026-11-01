"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Sparkles,
  Calendar,
  MessageSquare,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Award,
  Circle,
  ArrowLeft,
  X,
  Flag,
} from "lucide-react";

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const userId = params.id as string;

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error("Could not load user profile");
      const data = await res.json();
      setProfile(data.user);
      setFriendshipStatus(data.friendshipStatus);
    } catch (e: any) {
      setError(e.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFriendRequest = async () => {
    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (res.ok) {
        setFriendshipStatus("PENDING");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartMessage = async () => {
    try {
      const res = await fetch("/api/messages/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: userId }),
      });
      const data = await res.json();
      if (data.conversationId) {
        router.push(`/messages?cid=${data.conversationId}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReportUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/moderation/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reportReason,
        }),
      });
      if (res.ok) {
        setReportSuccess(true);
        setTimeout(() => {
          setReportModalOpen(false);
          setReportSuccess(false);
          setReportReason("");
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-[#F36E0F]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#F36E0F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-300">Loading Player Profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-xl font-bold text-rose-400">{error || "User not found"}</p>
        <button
          onClick={() => router.back()}
          className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const isOwn = currentUser?.id === profile.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] to-[#1A1A40] py-12 px-4 sm:px-8 text-white">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        {/* Profile Card Header */}
        <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top Banner gradient */}
          <div className="absolute top-0 left-0 w-full h-28 bg-gradient-to-r from-[#F36E0F]/40 via-[#1b2a7a] to-[#EA0000]/40 -z-0" />

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pt-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5 text-center sm:text-left">
              {/* Avatar with Glow and Online Ring */}
              <div className="relative">
                <img
                  src={profile.avatar || "/avatars/avatar-1.svg"}
                  alt={profile.displayName}
                  className="w-28 h-28 rounded-full border-4 border-[#F36E0F] bg-[#0D0D2B] object-cover shadow-[0_0_20px_rgba(243,110,15,0.4)]"
                />
                <span
                  title={profile.isOnline ? "Online" : "Offline"}
                  className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-[#0D0D2B] ${
                    profile.isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h1 className="text-2xl sm:text-3xl font-black text-white">{profile.displayName}</h1>
                  {profile.role === "ADMIN" && (
                    <span className="bg-[#EA0000] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                      Staff Admin
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#F36E0F]">@{profile.username}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 justify-center sm:justify-start">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#F6FF00]" />
                    <strong className="text-white">{profile.xp}</strong> XP
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Joined {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
              {isOwn ? (
                <button
                  onClick={() => router.push("/settings")}
                  className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                >
                  Edit Profile & Settings
                </button>
              ) : (
                <>
                  {(profile.role === "ADMIN" || currentUser?.role === "ADMIN") && (
                    <button
                      onClick={handleStartMessage}
                      className="bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-black px-4 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" /> {profile.role === "ADMIN" ? "Message Admin" : "Message Player"}
                    </button>
                  )}

                  {friendshipStatus === "ACCEPTED" ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" /> Friends
                    </span>
                  ) : friendshipStatus === "PENDING" ? (
                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-2 rounded-lg">
                      Request Pending
                    </span>
                  ) : (
                    <button
                      onClick={handleFriendRequest}
                      className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" /> Add Friend
                    </button>
                  )}

                  <button
                    onClick={() => setReportModalOpen(true)}
                    title="Report User"
                    className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bio text */}
          <div className="mt-8 pt-6 border-t border-white/10 text-sm text-slate-300">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Player Bio</h4>
            <p className="leading-relaxed">{profile.bio || "No bio set yet."}</p>
          </div>
        </div>

        {/* Badges & Rewards Shelf */}
        <div className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-[#F36E0F]" />
              <h2 className="text-xl font-black text-white">Earned Badges & VIP Perks</h2>
            </div>
            <span className="text-xs font-bold bg-[#1b2a7a] px-3 py-1 rounded-full text-slate-300">
              {profile.rewards?.length || 0} Unlocked
            </span>
          </div>

          {profile.rewards && profile.rewards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {profile.rewards.map((ur: any) => (
                <div
                  key={ur.id}
                  className="bg-[#1b2a7a]/60 border border-[#2a3c91] rounded-2xl p-4 flex items-center gap-3.5 hover:border-[#F36E0F] transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: ur.reward.colorHex || "#F36E0F" }}
                  >
                    <Sparkles className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{ur.reward.name}</h3>
                    <p className="text-xs text-slate-300 line-clamp-1">{ur.reward.description}</p>
                    <span className="text-[10px] text-amber-400 font-semibold uppercase">
                      +{ur.reward.xpValue} XP Granted
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 flex flex-col items-center gap-3 bg-[#0D0D2B]/40 rounded-2xl border border-dashed border-white/10">
              <Sparkles className="w-8 h-8 text-[#F36E0F] opacity-60" />
              <p className="text-sm text-slate-400">No badges earned yet.</p>
              {isOwn && (
                <button
                  onClick={() => router.push("/wheel")}
                  className="mt-2 bg-[#F36E0F] hover:bg-orange-500 text-black text-xs font-extrabold px-4 py-2 rounded-lg"
                >
                  Spin the Welcome Wheel to Claim Badges
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl p-6 shadow-2xl relative">
            <button
              onClick={() => setReportModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" /> Report Player @{profile.username}
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Help keep Kali-Gaming safe and fun. Explain the violation for administrator review.
            </p>

            {reportSuccess ? (
              <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold text-center">
                Report submitted to Kali moderation staff.
              </div>
            ) : (
              <form onSubmit={handleReportUser} className="flex flex-col gap-3">
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the issue (e.g. harassment, spam, inappropriate chat)..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#2a3c91] text-white placeholder:text-gray-300 rounded-lg p-3 text-xs outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
                <button
                  type="submit"
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 rounded-lg"
                >
                  Submit Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
