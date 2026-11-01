"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  QrCode,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowRight,
  Maximize2,
  X,
  AlertCircle,
  MessageSquare,
  Sparkles,
  CheckCircle,
} from "lucide-react";

export default function DepositPage() {
  const { user } = useAuth();

  const [gateway, setGateway] = useState<any>(null);
  const [loadingGateway, setLoadingGateway] = useState(true);

  // Form state
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [chimeSenderTag, setChimeSenderTag] = useState<string>("");
  const [referenceNote, setReferenceNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState<any>(null);

  // UI state
  const [copiedTag, setCopiedTag] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Transactions state
  const [myTransactions, setMyTransactions] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchGateway = async () => {
    try {
      setLoadingGateway(true);
      const res = await fetch("/api/payments/chime");
      if (res.ok) {
        const data = await res.json();
        setGateway(data.gateway);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGateway(false);
    }
  };

  const fetchMyTransactions = async () => {
    if (!user) return;
    try {
      setLoadingTx(true);
      const res = await fetch("/api/payments/my-transactions");
      if (res.ok) {
        const data = await res.json();
        setMyTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchGateway();
    fetchMyTransactions();
  }, [user]);

  const handleCopyTag = () => {
    if (!gateway?.chimeTag) return;
    navigator.clipboard.writeText(gateway.chimeTag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess(null);

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount <= 0) {
      setSubmitError("Please enter a valid deposit amount.");
      return;
    }

    if (!chimeSenderTag.trim()) {
      setSubmitError("Please provide your Chime cashtag (e.g. $YourName).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalAmount,
          chimeSenderTag,
          referenceNote,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deposit submission failed");
      }

      setSubmitSuccess(data.transaction);
      setChimeSenderTag("");
      setReferenceNote("");
      setCustomAmount("");
      fetchMyTransactions();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to process deposit request.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0e1b4d] border border-[#1b2a7a] flex items-center justify-center text-[#25C974] mb-4">
          <DollarSign className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-black text-white">Kali-Gaming Cashier</h1>
        <p className="text-xs text-slate-300 mt-1 max-w-sm">
          Please log in with your player account to make deposits via Chime and track your balance.
        </p>
        <Link
          href="/login"
          className="mt-4 bg-[#F36E0F] hover:bg-orange-500 text-black font-black px-6 py-2.5 rounded-xl text-xs"
        >
          Player Sign-In
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
            <div className="inline-flex items-center gap-1.5 bg-[#25C974]/20 border border-[#25C974]/40 px-3 py-1 rounded-full text-xs font-bold text-[#25C974] mb-2">
              <ShieldCheck className="w-4 h-4" />
              Verified Instant Payment Gateway
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">Kali Player Cashier</h1>
            <p className="text-xs text-slate-300 mt-1">
              Deposit credits via Chime Instant Pay with dynamic QR code scanning.
            </p>
          </div>

          <Link
            href="/messages"
            className="flex items-center gap-2 bg-[#142055] hover:bg-[#1b2a7a] border border-[#2a3c91] text-xs font-bold px-4 py-2.5 rounded-xl text-[#FFD700] transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> Direct Admin Support
          </Link>
        </div>

        {/* Main Grid: Payment Gateway Card + Submission Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Official Chime Payment & QR Card (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#0c163b] via-[#0e1d52] to-[#0c163b] border-2 border-[#25C974]/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(37,201,116,0.15)] flex flex-col items-center text-center relative overflow-hidden">
            {/* Top Green Accent Pill */}
            <div className="bg-[#25C974] text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full mb-4 shadow-md">
              Official Chime Partner Gateway
            </div>

            {/* QR Code Container with Hover Zoom Action */}
            <div
              onClick={() => setQrModalOpen(true)}
              className="relative w-56 h-56 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center border-4 border-[#25C974] cursor-pointer group transition-transform hover:scale-105"
            >
              <img
                src={gateway?.qrCodeUrl || "/chime-qr.svg"}
                alt="Chime Deposit QR Code"
                className="w-full h-full object-contain"
                onError={(e: any) => {
                  e.target.src = "/chime-qr.svg";
                }}
              />
              <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white">
                <Maximize2 className="w-6 h-6 text-[#25C974]" />
                <span className="text-[11px] font-bold">Click to Enlarge QR</span>
              </div>
            </div>

            {/* Chime Tag Box with Copy Button */}
            <div className="mt-5 w-full bg-[#060B1A] border border-[#25C974]/40 rounded-2xl p-4 flex items-center justify-between">
              <div className="text-left">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">Chime Tag / Cashtag</span>
                <span className="text-lg font-black text-[#25C974] font-mono">
                  {gateway?.chimeTag || "$KaliGamingPay"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyTag}
                className="bg-[#25C974] hover:bg-[#1fb365] text-black font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5"
              >
                {copiedTag ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Tag
                  </>
                )}
              </button>
            </div>

            {/* Account Info & Instructions */}
            <div className="mt-4 w-full text-left text-xs text-slate-300 flex flex-col gap-2 bg-[#060B1A]/50 p-4 rounded-xl border border-white/5">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Account Holder</span>
                <span className="font-bold text-white">{gateway?.accountName || "Kali Gaming Official"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-mono block">Instructions</span>
                <p className="leading-relaxed text-slate-300">
                  {gateway?.instructions || "Send via Chime app. Include your Kali username in the note."}
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Limits: ${gateway?.minAmount || 10} - ${gateway?.maxAmount || 2000}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> 2-5 min credit
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Deposit Amount & Submission Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#0c163b] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#F36E0F]" /> Submit Deposit Confirmation
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                After sending payment via Chime, submit your transfer details below for instant verification.
              </p>
            </div>

            {submitSuccess && (
              <div className="bg-emerald-500/20 border-2 border-emerald-500/50 rounded-2xl p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Deposit Submitted Successfully!
                </div>
                <p className="text-xs text-slate-200">
                  Transaction <strong>#{submitSuccess.id.slice(-6).toUpperCase()}</strong> for{" "}
                  <strong>${submitSuccess.amount.toFixed(2)}</strong> is currently being verified by Kali staff.
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <Link
                    href="/messages"
                    className="bg-[#25C974] text-black text-xs font-black px-4 py-2 rounded-lg hover:bg-emerald-400 transition-colors inline-flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> View Status in Admin Chat
                  </Link>
                </div>
              </div>
            )}

            {submitError && (
              <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="flex flex-col gap-5">
              {/* Amount Preset Buttons */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Select Deposit Amount ($)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setAmount(preset);
                        setCustomAmount("");
                      }}
                      className={`py-3 rounded-xl font-black text-sm transition-all border ${
                        !customAmount && amount === preset
                          ? "bg-[#F36E0F] text-black border-[#F36E0F] shadow-lg shadow-orange-500/20"
                          : "bg-[#142055] text-white border-[#2a3c91] hover:border-[#F36E0F]"
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <div className="relative mt-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    $
                  </span>
                  <input
                    type="number"
                    min={gateway?.minAmount || 10}
                    max={gateway?.maxAmount || 2000}
                    placeholder="Or enter custom amount (e.g. 75)"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="w-full bg-[#142055] text-white placeholder:text-gray-400 rounded-xl pl-8 pr-4 py-2.5 text-sm border border-[#2a3c91] outline-none focus:ring-2 focus:ring-[#F36E0F]"
                  />
                </div>
              </div>

              {/* Sender Chime Tag Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Your Sender Chime Cashtag
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $MyChimeTag"
                  value={chimeSenderTag}
                  onChange={(e) => setChimeSenderTag(e.target.value)}
                  className="w-full bg-[#142055] text-white placeholder:text-gray-400 rounded-xl px-4 py-3 text-sm font-mono border border-[#2a3c91] outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
                <span className="text-[10px] text-slate-400">
                  The exact Chime tag you sent the transfer from so staff can match your payment.
                </span>
              </div>

              {/* Reference Note Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Payment Memo / Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Transfer for Kali fish coins"
                  value={referenceNote}
                  onChange={(e) => setReferenceNote(e.target.value)}
                  className="w-full bg-[#142055] text-white placeholder:text-gray-400 rounded-xl px-4 py-3 text-sm border border-[#2a3c91] outline-none focus:ring-2 focus:ring-[#F36E0F]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 disabled:opacity-60 text-black font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {submitting ? "Submitting Deposit..." : "I Have Sent Payment — Confirm Deposit"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section: My Deposit History */}
        <div className="bg-[#0c163b] border border-[#1b2a7a] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#FFD700]" /> My Recent Deposit History
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {myTransactions.length} transaction(s) recorded
            </span>
          </div>

          {loadingTx ? (
            <div className="py-8 text-center text-slate-400 text-xs">Loading deposit history...</div>
          ) : myTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[11px] font-mono uppercase text-slate-400">
                    <th className="pb-3 px-2">Date</th>
                    <th className="pb-3 px-2">Amount</th>
                    <th className="pb-3 px-2">Sender Tag</th>
                    <th className="pb-3 px-2">Reference</th>
                    <th className="pb-3 px-2">Status</th>
                    <th className="pb-3 px-2 text-right">Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {myTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2 font-mono font-bold text-emerald-400 text-sm">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 font-mono text-slate-200">{tx.chimeSenderTag}</td>
                      <td className="py-3 px-2 text-slate-300 max-w-xs truncate">{tx.referenceNote || "N/A"}</td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase ${
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
                        <Link
                          href="/messages"
                          className="text-[11px] text-[#F36E0F] hover:underline inline-flex items-center gap-1 font-semibold"
                        >
                          Chat Admin <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No deposit transactions yet. Make your first deposit above to start playing!
            </div>
          )}
        </div>
      </div>

      {/* QR Code Zoom Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0c163b] border-2 border-[#25C974] rounded-3xl p-6 sm:p-8 max-w-sm w-full relative flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95">
            <button
              onClick={() => setQrModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] font-mono uppercase tracking-widest text-[#25C974] mb-3">
              Scan with Mobile Device
            </span>

            <div className="w-64 h-64 bg-white rounded-2xl p-4 shadow-2xl flex items-center justify-center border-4 border-[#25C974]">
              <img
                src={gateway?.qrCodeUrl || "/chime-qr.svg"}
                alt="Enlarged QR Code"
                className="w-full h-full object-contain"
                onError={(e: any) => {
                  e.target.src = "/chime-qr.svg";
                }}
              />
            </div>

            <div className="mt-4">
              <span className="text-xl font-black text-[#25C974] font-mono block">
                {gateway?.chimeTag || "$KaliGamingPay"}
              </span>
              <p className="text-xs text-slate-300 mt-1">{gateway?.accountName || "Kali Gaming Official"}</p>
            </div>

            <button
              onClick={handleCopyTag}
              className="mt-4 w-full bg-[#25C974] hover:bg-[#1fb365] text-black font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {copiedTag ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedTag ? "Chime Tag Copied!" : "Copy Chime Cashtag"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
