"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Lock,
  User,
  Phone,
  Mail,
  Sparkles,
  Shield,
  AlertCircle,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  Flame,
} from "lucide-react";
import {
  isFirebaseConfigured,
  setupRecaptchaVerifier,
  clearRecaptchaVerifier,
  sendFirebasePhoneCode,
  confirmFirebasePhoneCode,
} from "@/lib/firebase";

const COUNTRY_CODES = [
  { code: "+1", label: "US/CA (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+52", label: "Mexico (+52)" },
  { code: "+91", label: "India (+91)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+55", label: "Brazil (+55)" },
  { code: "+63", label: "Philippines (+63)" },
  { code: "+49", label: "Germany (+49)" },
  { code: "+33", label: "France (+33)" },
  { code: "+34", label: "Spain (+34)" },
  { code: "+57", label: "Colombia (+57)" },
];

export default function LoginPage() {
  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");

  // Phone Login State
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(false);

  // Email Login State
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    setMounted(true);
    setFirebaseActive(isFirebaseConfigured());
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

  // Handle Send Code for Phone Login
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    setLoading(true);

    try {
      // Pre-flight check: Verify player account exists before sending code
      const checkRes = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          mode: "check",
        }),
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError(
          "No player account found with this phone number. Please click 'Create Player Account' below to sign up first."
        );
        setLoading(false);
        return;
      }

      if (firebaseActive) {
        const appVerifier = setupRecaptchaVerifier("login-recaptcha-container");
        if (!appVerifier) {
          throw new Error("Could not initialize Firebase reCAPTCHA verifier.");
        }
        const confirmation = await sendFirebasePhoneCode(fullPhoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setSuccessMsg(`SMS verification code sent to ${fullPhoneNumber} via Firebase!`);
      } else {
        setSuccessMsg(`Verification code ready! Enter code 123456 below to log in.`);
      }
      setCodeSent(true);
    } catch (err: any) {
      console.error("SMS Code Send Error:", err);
      const raw = err.message || "";
      if (
        err.code === "auth/operation-not-allowed" ||
        raw.includes("OPERATION_NOT_ALLOWED")
      ) {
        setError(
          "Firebase SMS Region Policy: Google blocks SMS to unlisted countries/regions by default. In Firebase Console ➔ Authentication ➔ Settings tab ➔ SMS region policy, enable your region (or under Sign-in method ➔ Phone, add your number under 'Phone numbers for testing'). Meanwhile, sandbox code 123456 is active below!"
        );
        setCodeSent(true);
      } else if (
        err.code === "auth/configuration-not-found" ||
        raw.includes("CONFIGURATION_NOT_FOUND")
      ) {
        setError(
          "Firebase Phone Provider: In Firebase Console ➔ Build ➔ Authentication ➔ Sign-in method, click Phone and toggle Enable. Meanwhile, sandbox code 123456 is active below!"
        );
        setCodeSent(true);
      } else {
        setError(raw || "Failed to send SMS verification code. Please check your number.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify Code for Phone Login
  const handleVerifyPhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter your 6-digit SMS verification code.");
      setLoading(false);
      return;
    }

    try {
      let idToken: string | undefined;
      let firebaseUid: string | undefined;
      if (confirmationResult) {
        try {
          const res = await confirmFirebasePhoneCode(confirmationResult, otpCode.trim());
          idToken = res.idToken;
          firebaseUid = res.uid;
        } catch (fbErr: any) {
          console.error("Firebase Login Confirmation Error:", fbErr);
          if (
            fbErr.code === "auth/invalid-verification-code" ||
            fbErr.message?.includes("invalid-verification-code")
          ) {
            setError("Incorrect SMS verification code. Please check your SMS messages and try again.");
          } else if (fbErr.code === "auth/code-expired") {
            setError("SMS verification code has expired. Please request a new code.");
          } else {
            setError(fbErr.message || "Invalid SMS verification code.");
          }
          setLoading(false);
          return;
        }
      } else {
        if (otpCode.trim() !== "123456") {
          setError("Invalid SMS verification code. Please enter the valid code.");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/auth/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          verificationCode: otpCode.trim(),
          idToken,
          firebaseUid,
          mode: "login",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Phone authentication failed.");
      }

      await refreshUser();
      router.push("/");
    } catch (err: any) {
      console.error("Phone Verify Error:", err);
      setError(err.message || "Verification failed. Please check your code.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      await refreshUser();
      router.push("/");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (userType: "player1" | "player2") => {
    setAuthMode("email");
    if (userType === "player1") {
      setEmailOrUsername("player1@kali-gaming.com");
      setPassword("Player123!");
    } else if (userType === "player2") {
      setEmailOrUsername("player2@kali-gaming.com");
      setPassword("Player123!");
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0D0D2B] to-[#1A1A40]">
      <div className="w-full max-w-md bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#1b2a7a] px-6 py-5 text-center border-b border-white/10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D0D2B] border border-[#F36E0F] mb-2.5">
            <img src="/logo.svg" alt="Kali Gaming" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Player Sign-In
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Log in to play games, spin the wheel, and chat 1-on-1 with staff
          </p>

          {/* Mode Tabs */}
          <div className="flex bg-[#0D0D2B] p-1 rounded-xl mt-4 border border-[#2a3c91]">
            <button
              type="button"
              onClick={() => {
                setAuthMode("phone");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === "phone"
                  ? "bg-[#F36E0F] text-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Phone className="w-3.5 h-3.5" /> Phone Number (SMS)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("email");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                authMode === "email"
                  ? "bg-[#F36E0F] text-black shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" /> Email & Password
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-lg text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-lg text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ================= TAB A: PHONE NUMBER LOGIN ================= */}
          {authMode === "phone" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#0D1535] border border-[#233575] rounded-xl p-3 flex items-start gap-2.5">
                <Flame className={`w-4 h-4 flex-shrink-0 mt-0.5 ${mounted && firebaseActive ? "text-orange-400 animate-pulse" : "text-amber-400"}`} />
                <div className="text-[11px] leading-relaxed">
                  {mounted && firebaseActive ? (
                    <span className="text-orange-300 font-semibold">
                      Direct Firebase Phone Auth Active: SMS code will be sent via Firebase.
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      <strong className="text-amber-400">Firebase Ready:</strong> Set Firebase keys in <code className="text-white bg-black/40 px-1 py-0.5 rounded">.env</code>. Sandbox test code is <span className="text-emerald-400 font-mono font-bold">123456</span>.
                    </span>
                  )}
                </div>
              </div>

              <div id="login-recaptcha-container" suppressHydrationWarning />

              {!codeSent ? (
                <form onSubmit={handleSendCode} className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Registered Phone Number
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-[#2a3c91] text-white rounded-lg px-2.5 py-2.5 text-xs font-mono font-bold outline-none border border-[#1b2a7a]"
                      >
                        {COUNTRY_CODES.map((c) => (
                          <option key={c.code} value={c.code} className="bg-[#0e1b4d] text-white">
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="relative flex-1">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="tel"
                          required
                          placeholder="e.g. 555-019-2831"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="w-full bg-[#2a3c91] text-white placeholder:text-gray-400 rounded-lg pl-10 pr-3.5 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#1b2a7a]"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-60 text-black font-extrabold py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Sending SMS Code..." : "Send Login Code"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyPhoneLogin} className="flex flex-col gap-4">
                  <div className="bg-[#09112A] border border-[#1b2a7a] p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">Verifying Phone</span>
                      <span className="text-sm font-mono font-bold text-white">{fullPhoneNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCodeSent(false)}
                      className="text-xs text-[#F36E0F] hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      6-Digit SMS Verification Code
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        autoFocus
                        placeholder="e.g. 123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        className="w-full bg-[#2a3c91] text-white placeholder:text-gray-400 rounded-lg pl-10 pr-3.5 py-3 text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#1b2a7a]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length < 4}
                    className="w-full bg-[#25C974] hover:bg-emerald-400 disabled:opacity-60 text-black font-extrabold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? "Verifying..." : "Verify & Log In"}
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Didn&apos;t receive code? Resend SMS
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* ================= TAB B: EMAIL & PASSWORD LOGIN ================= */}
          {authMode === "email" && (
            <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Email or Username
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="player1@kali-gaming.com or kali_phoenix"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full bg-[#2a3c91] text-white placeholder:text-gray-300 rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#1b2a7a]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-xs text-[#F36E0F] hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#2a3c91] text-white placeholder:text-gray-300 rounded-lg pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#1b2a7a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-60 text-black font-extrabold py-3 rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? "Authenticating..." : "Log In to Platform"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick 1-Click Player Demo Buttons */}
          <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2">
            <span className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Quick Player Testing Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo("player1")}
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-xs font-semibold py-2 px-2 rounded-lg text-slate-200 transition-colors"
              >
                Player 1 (Email)
              </button>
              <button
                type="button"
                onClick={() => fillDemo("player2")}
                className="bg-[#1b2a7a] hover:bg-[#2a3c91] text-xs font-semibold py-2 px-2 rounded-lg text-slate-200 transition-colors"
              >
                Player 2 (Email)
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-300 mt-3">
            Don&apos;t have an account yet?{" "}
            <Link href="/signup" className="text-[#F36E0F] font-bold hover:underline">
              Create Player Account
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-white/10 text-center">
            <Link
              href="/admin/login"
              className="text-[11px] font-mono text-slate-400 hover:text-red-400 transition-colors inline-flex items-center gap-1"
            >
              Staff Administrator? Access Admin Console →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
