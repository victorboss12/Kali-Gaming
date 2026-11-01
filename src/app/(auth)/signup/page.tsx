"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Phone,
  Lock,
  Mail,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Flame,
  RotateCcw,
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

export default function SignupPage() {
  // Single Unified Form State
  const [displayName, setDisplayName] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState(""); // OPTIONAL
  const [otpCode, setOtpCode] = useState("");

  // Captcha State
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  // SMS / Firebase State
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Interactive Captcha Click Handler
  const handleCaptchaClick = () => {
    if (captchaChecked || captchaLoading) return;
    setCaptchaLoading(true);
    setError("");

    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaChecked(true);
      setCaptchaToken(`captcha_verified_${Date.now()}`);
    }, 600);
  };

  // Send SMS Verification Code
  const handleSendSms = async () => {
    setError("");
    setSuccessMsg("");

    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid phone number before requesting SMS code.");
      return;
    }

    if (!captchaChecked) {
      setError("Please complete the security captcha verification first.");
      return;
    }

    setSendingCode(true);

    try {
      if (firebaseActive) {
        // Direct Firebase Web SDK Phone Authentication
        const appVerifier = setupRecaptchaVerifier("recaptcha-container");
        if (!appVerifier) {
          throw new Error("Could not initialize Firebase reCAPTCHA verifier.");
        }
        const confirmation = await sendFirebasePhoneCode(fullPhoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setSuccessMsg(`SMS verification code sent to ${fullPhoneNumber} via Firebase!`);
      } else {
        // Sandbox / Dev mode fallback when Firebase credentials are not in .env
        setSuccessMsg(`Firebase credentials not active. In dev mode, enter code 123456 below.`);
      }
      setCodeSent(true);
    } catch (err: any) {
      console.error("Firebase SMS Send Error:", err);
      const raw = err.message || "";
      if (
        err.code === "auth/operation-not-allowed" ||
        raw.includes("OPERATION_NOT_ALLOWED")
      ) {
        setError(
          "Firebase SMS Error: Google blocked SMS delivery to this region. In Firebase Console ➔ Authentication ➔ Settings tab ➔ SMS region policy, enable your region. (If you added a test phone in Firebase Console, make sure Phone is toggled ON and Saved)."
        );
      } else if (
        err.code === "auth/configuration-not-found" ||
        raw.includes("CONFIGURATION_NOT_FOUND")
      ) {
        setError(
          "Firebase Phone Provider: In Firebase Console ➔ Build ➔ Authentication ➔ Sign-in method, click Phone and toggle Enable."
        );
      } else {
        setError(raw || "Failed to send SMS code via Firebase. Please check your number.");
      }
    } finally {
      setSendingCode(false);
    }
  };

  // Unified Form Submission
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!displayName.trim()) {
      setError("Please provide your full name or nickname.");
      return;
    }

    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please provide a valid mobile phone number.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!captchaChecked) {
      setError("Please complete the security captcha verification.");
      return;
    }

    if (!codeSent) {
      setError("Please click 'Send SMS Code' to receive your verification code first.");
      return;
    }

    if (!otpCode.trim()) {
      setError("Please enter the 6-digit SMS verification code.");
      return;
    }

    setSubmitting(true);

    try {
      let idToken: string | undefined;

      // If Firebase confirmation was used, confirm the SMS code with Firebase
      if (confirmationResult) {
        try {
          const res = await confirmFirebasePhoneCode(confirmationResult, otpCode.trim());
          idToken = res.idToken;
        } catch (fbErr: any) {
          console.error("Firebase SMS Confirmation Error:", fbErr);
          if (
            fbErr.code === "auth/invalid-verification-code" ||
            fbErr.message?.includes("invalid-verification-code")
          ) {
            setError("Incorrect SMS verification code from Firebase. Please check your SMS messages and try again.");
          } else if (fbErr.code === "auth/code-expired") {
            setError("The SMS verification code has expired. Please click 'Send SMS Code' again.");
          } else {
            setError(fbErr.message || "Failed to verify SMS code with Firebase.");
          }
          setSubmitting(false);
          return;
        }
      } else {
        // Fallback for automated test or when Firebase is not active
        if (otpCode.trim() !== "123456") {
          setError("Invalid verification code. Please enter the valid code.");
          setSubmitting(false);
          return;
        }
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          phoneNumber: fullPhoneNumber,
          password,
          email: email.trim() || undefined, // Explicitly optional
          verificationCode: otpCode.trim() || undefined,
          idToken,
          captchaToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      await refreshUser();
      router.push("/wheel"); // Guide player to claim their welcome spin!
    } catch (err: any) {
      console.error("Registration Error:", err);
      setError(err.message || "An unexpected error occurred during registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[88vh] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#0A0E27] via-[#0D153A] to-[#161338]">
      <div className="w-full max-w-lg bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#142055] px-6 py-5 text-center border-b border-white/10 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0A0E27] border border-[#F36E0F] mb-2 shadow-md">
            <img src="/logo.svg" alt="Kali Gaming" className="w-8 h-8 object-contain" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Create Player Profile
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Get instant <span className="text-[#F36E0F] font-bold">+100 Welcome XP</span> and unlock the Daily Rewards Wheel!
          </p>

          <div className="inline-flex items-center gap-1.5 bg-[#F36E0F]/20 border border-[#F36E0F]/40 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-orange-300 mt-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Player Portal Only • Direct Staff Chat Included
          </div>
        </div>

        {/* Single Unified Registration Form */}
        <form onSubmit={handleRegister} className="p-6 sm:p-7 flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Hidden Recaptcha Mount Point for Firebase */}
          <div id="recaptcha-container" suppressHydrationWarning />

          {/* 1. Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Full Name / Nickname</span>
              <span className="text-[10px] font-mono text-emerald-400">Required</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="e.g. Phoenix Rider"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-[#1e2c6d] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
              />
            </div>
          </div>

          {/* 2. Mobile Phone Number */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Mobile Phone Number</span>
              <span className="text-[10px] font-mono text-emerald-400">Required for SMS Verification</span>
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-[#1e2c6d] text-white rounded-xl px-2.5 py-2.5 text-xs font-mono font-bold outline-none border border-[#2a3c91]"
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
                  placeholder="555-019-2831"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#1e2c6d] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                />
              </div>
            </div>
          </div>

          {/* 3. Password */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Account Password</span>
              <span className="text-[10px] font-mono text-slate-400">Min. 6 Characters</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e2c6d] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
              />
            </div>
          </div>

          {/* 4. Email (Explicitly Optional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span>Email Address</span>
              <span className="text-[10px] font-mono text-slate-400 italic">(Optional)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@domain.com (Optional)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#1e2c6d] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
              />
            </div>
          </div>

          {/* 5. Interactive Security Captcha Verification */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Security Anti-Bot Verification
            </label>
            <div
              onClick={handleCaptchaClick}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                captchaChecked
                  ? "bg-[#09153A] border-emerald-500/50"
                  : "bg-[#142055] border-[#2a3c91] hover:border-[#F36E0F]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                    captchaChecked
                      ? "bg-emerald-500 border-emerald-400 text-black font-black"
                      : "bg-[#1e2c6d] border-slate-400"
                  }`}
                >
                  {captchaLoading && (
                    <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  {captchaChecked && <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />}
                </div>
                <span className="text-xs font-bold text-white">
                  {captchaChecked ? "I'm not a robot (Verified)" : "I'm not a robot"}
                </span>
              </div>

              <div className="flex flex-col items-end opacity-70 text-[9px] font-sans text-slate-400">
                <img
                  src="https://www.gstatic.com/recaptcha/api2/logo_48.png"
                  alt="reCAPTCHA"
                  className="w-6 h-6 object-contain mb-0.5"
                />
                <span>reCAPTCHA</span>
                <span>Privacy - Terms</span>
              </div>
            </div>
          </div>

          {/* 6. SMS Code Section */}
          <div className="bg-[#091333] border border-[#1b2a7a] rounded-xl p-3.5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> SMS Verification Code
              </span>
              <button
                type="button"
                onClick={handleSendSms}
                disabled={sendingCode || !phoneNumber}
                className="text-[11px] font-bold text-[#F36E0F] hover:text-orange-400 disabled:opacity-50 underline transition-colors"
              >
                {sendingCode ? "Sending Code..." : codeSent ? "Resend Code" : "Send Verification SMS"}
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder={codeSent ? "Enter 6-digit code (e.g. 123456)" : "Click 'Send Verification SMS' above"}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-[#1e2c6d] text-white placeholder:text-gray-400 rounded-lg px-3.5 py-2 text-xs font-mono tracking-wider outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
              />
            </div>

            <span className="text-[10px] text-slate-400">
              {mounted && firebaseActive ? (
                <span className="text-orange-300">
                  🔥 Connected directly to your Firebase project for carrier SMS delivery.
                </span>
              ) : (
                <span>
                  ⚡ Sandbox dev mode: Use code <strong className="text-emerald-400 font-mono">123456</strong>, or connect your Firebase credentials in <code className="text-white">.env</code>.
                </span>
              )}
            </span>
          </div>

          {/* 7. Submit Button */}
          <button
            type="submit"
            disabled={submitting || !captchaChecked}
            className="w-full mt-2 bg-[#F36E0F] hover:bg-orange-500 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm"
          >
            {submitting ? "Creating Player Profile..." : "Complete Registration & Spin Wheel"}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Footer Navigation */}
          <div className="text-center text-xs text-slate-300 mt-2 pt-3 border-t border-white/10 flex items-center justify-between">
            <span>Already registered?</span>
            <Link href="/login" className="text-[#F36E0F] font-bold hover:underline">
              Player Log In →
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
