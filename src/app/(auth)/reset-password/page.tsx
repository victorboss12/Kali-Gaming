"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0D0D2B] to-[#1A1A40]">
      <div className="w-full max-w-md bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl shadow-2xl p-6 flex flex-col gap-5">
        <Link
          href="/login"
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Log In
        </Link>

        <div>
          <h1 className="text-2xl font-black text-white">Reset Password</h1>
          <p className="text-xs text-slate-300 mt-1">
            Enter your registered email address and we'll send you instructions to recover your account.
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Reset Link Dispatched
            </div>
            <p className="text-xs text-slate-300">
              If an account with <strong>{email}</strong> exists, you will receive password reset instructions shortly.
            </p>
            <Link
              href="/login"
              className="mt-2 text-center text-xs bg-[#1b2a7a] hover:bg-[#2a3c91] text-white py-2 rounded-lg font-bold"
            >
              Return to Log In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Account Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="player@kali-gaming.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2a3c91] text-white placeholder:text-gray-300 rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#1b2a7a]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#F36E0F] hover:bg-orange-500 text-black font-extrabold py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all"
            >
              Send Password Reset Instructions
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
