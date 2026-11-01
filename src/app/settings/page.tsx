"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Settings,
  User,
  Volume2,
  VolumeX,
  UserPlus,
  Trash2,
  Check,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("/avatars/avatar-1.svg");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [allowFriendRequests, setAllowFriendRequests] = useState(true);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const avatarOptions = [
    { src: "/avatars/avatar-1.svg", label: "Phoenix" },
    { src: "/avatars/avatar-2.svg", label: "Cyber Wolf" },
    { src: "/avatars/avatar-admin.svg", label: "Gold Crown" },
    { src: "/avatars/avatar-support.svg", label: "Support Pro" },
  ];

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setBio(user.bio || "");
      setAvatar(user.avatar || "/avatars/avatar-1.svg");
      setSoundEnabled(user.soundEnabled ?? true);
      setAllowFriendRequests(user.allowFriendRequests ?? true);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          avatar,
          soundEnabled,
          allowFriendRequests,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update settings");
      }

      await refreshUser();
      setSuccessMsg("Settings updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch("/api/user/settings", { method: "DELETE" });
      if (res.ok) {
        await logout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-slate-300">Please log in to manage your account settings.</p>
        <button
          onClick={() => router.push("/login")}
          className="bg-[#F36E0F] text-black font-bold px-4 py-2 rounded-lg"
        >
          Go to Log In
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D0D2B] to-[#1A1A40] py-12 px-4 sm:px-8 text-white">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <Settings className="w-8 h-8 text-[#F36E0F]" /> Account & Privacy
            </h1>
            <p className="text-xs text-slate-400 mt-1">Manage your gaming profile, avatar, and community settings</p>
          </div>
          <button
            onClick={() => router.push(`/profile/${user.id}`)}
            className="text-xs text-[#F36E0F] hover:underline flex items-center gap-1 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> View Profile
          </button>
        </div>

        {successMsg && (
          <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <Check className="w-5 h-5 text-emerald-400" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 p-3.5 rounded-xl text-sm font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="bg-[#0e1b4d] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Avatar Picker */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-3">
              Choose Avatar
            </label>
            <div className="flex items-center gap-4 flex-wrap">
              {avatarOptions.map((opt) => (
                <div
                  key={opt.src}
                  onClick={() => setAvatar(opt.src)}
                  className={`cursor-pointer rounded-2xl p-2 border-2 transition-all flex flex-col items-center gap-1 ${
                    avatar === opt.src
                      ? "border-[#F36E0F] bg-[#1b2a7a] scale-105 shadow-[0_0_15px_rgba(243,110,15,0.4)]"
                      : "border-transparent bg-[#0D0D2B]/60 hover:bg-[#1b2a7a]/40"
                  }`}
                >
                  <img src={opt.src} alt={opt.label} className="w-16 h-16 rounded-full object-cover" />
                  <span className="text-[11px] font-bold text-slate-300">{opt.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-[#2a3c91] text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F]"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Player Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other Kali players about your favorite games and playstyle..."
              className="bg-[#2a3c91] text-white placeholder:text-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F]"
            />
          </div>

          {/* Privacy and notification toggles */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Preferences & Privacy
            </h4>

            <label className="flex items-center justify-between cursor-pointer p-3 bg-[#1b2a7a]/40 rounded-xl hover:bg-[#1b2a7a]/60 transition-colors">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-[#F36E0F]" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
                <div>
                  <div className="text-sm font-bold text-white">Audio & Spin Effects</div>
                  <div className="text-xs text-slate-400">Play wheel spin sounds and message alert chimes</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-5 h-5 accent-[#F36E0F] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 bg-[#1b2a7a]/40 rounded-xl hover:bg-[#1b2a7a]/60 transition-colors">
              <div className="flex items-center gap-3">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-sm font-bold text-white">Allow Friend Requests</div>
                  <div className="text-xs text-slate-400">Permit other players to send you friendship requests</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowFriendRequests}
                onChange={(e) => setAllowFriendRequests(e.target.checked)}
                className="w-5 h-5 accent-[#F36E0F] cursor-pointer"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-60 text-black font-extrabold py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all text-sm uppercase tracking-wider"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </form>

        {/* Danger Zone: Account Deletion */}
        <div className="bg-rose-950/20 border border-rose-500/30 rounded-3xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" /> Danger Zone
          </div>
          <p className="text-xs text-slate-300">
            Deleting your account will permanently remove your profile, badges, chat history, and platform progress. This action cannot be undone.
          </p>

          {deleteConfirm ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Yes, Permanently Delete My Account
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-white font-semibold text-xs px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(true)}
                className="text-xs text-rose-400 border border-rose-500/40 hover:bg-rose-500/10 font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
