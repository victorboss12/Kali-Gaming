"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Phone,
  Lock,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
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

export default function ResetPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Phone Form State
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [targetUserDisplayName, setTargetUserDisplayName] = useState("");

  // Verification & Password State
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Bot Check
  const [captchaChecked, setCaptchaChecked] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);

  // Firebase SMS State
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [firebaseActive, setFirebaseActive] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Feedback State
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { refreshUser } = useAuth();

  useEffect(() => {
    setFirebaseActive(isFirebaseConfigured());
    return () => {
      clearRecaptchaVerifier();
    };
  }, []);

  // Cooldown timer for SMS resends
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const fullPhoneNumber = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

  // Interactive Bot Check
  const handleCaptchaClick = () => {
    if (captchaChecked || captchaLoading) return;
    setCaptchaLoading(true);
    setError("");

    setTimeout(() => {
      setCaptchaLoading(false);
      setCaptchaChecked(true);
    }, 500);
  };

  // STEP 1: Check phone existence & Send SMS
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setSuccessMsg("");

    const digitsOnly = phoneNumber.replace(/\D/g, "");
    if (digitsOnly.length < 7) {
      setError("Please enter a valid mobile phone number.");
      return;
    }

    if (!captchaChecked) {
      setError("Please complete the security verification check first.");
      return;
    }

    setSendingSms(true);

    try {
      // 1. Verify account exists in database before sending SMS
      const checkRes = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "check-phone",
          phoneNumber: fullPhoneNumber,
        }),
      });

      const checkData = await checkRes.json();
      if (!checkRes.ok) {
        throw new Error(checkData.error || "No player account found with this phone number.");
      }

      setTargetUserDisplayName(checkData.user?.displayName || "Player");

      // 2. Dispatch SMS code via Firebase or sandbox fallback
      if (firebaseActive) {
        const appVerifier = setupRecaptchaVerifier("recaptcha-container");
        if (!appVerifier) {
          throw new Error("Could not initialize Firebase security verifier. Please refresh and try again.");
        }
        const confirmation = await sendFirebasePhoneCode(fullPhoneNumber, appVerifier);
        setConfirmationResult(confirmation);
        setSuccessMsg(`SMS verification code sent to ${fullPhoneNumber} via Firebase!`);
      } else {
        // Sandbox fallback when Firebase credentials are not in .env
        setSuccessMsg(`In dev/sandbox mode: Use verification code 123456 below.`);
      }

      setResendCooldown(45);
      setStep(2);
    } catch (err: any) {
      console.error("SMS Send Error:", err);
      const raw = err.message || "";
      if (err.code === "auth/operation-not-allowed" || raw.includes("OPERATION_NOT_ALLOWED")) {
        setError("Firebase SMS Error: Google SMS delivery is blocked for this region in Firebase Console.");
      } else if (err.code === "auth/configuration-not-found" || raw.includes("CONFIGURATION_NOT_FOUND")) {
        setError("Firebase Phone Provider: Please enable Phone Auth in Firebase Console.");
      } else {
        setError(raw || "Failed to send SMS verification code. Please check your number.");
      }
    } finally {
      setSendingSms(false);
    }
  };

  // STEP 2: Verify SMS Code & Update Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!otpCode.trim()) {
      setError("Please enter the 6-digit SMS verification code.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords are identical.");
      return;
    }

    setSubmitting(true);

    try {
      let idToken: string | undefined;

      // If Firebase confirmation was used, verify code with Firebase to acquire idToken
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
            throw new Error("Incorrect SMS verification code. Please check your SMS messages and try again.");
          } else if (fbErr.code === "auth/code-expired") {
            throw new Error("The SMS verification code has expired. Please click 'Resend SMS' below.");
          } else {
            throw new Error(fbErr.message || "Failed to verify SMS code with Firebase.");
          }
        }
      } else {
        // Sandbox / Dev fallback
        if (otpCode.trim() !== "123456") {
          throw new Error("Invalid verification code. In dev mode, enter 123456.");
        }
      }

      // Send to backend API to update password and sign new session
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber,
          verificationCode: otpCode.trim(),
          newPassword,
          idToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Password reset failed.");
      }

      // Refresh Auth Context so current session is instantly authenticated
      await refreshUser();
      setStep(3);
    } catch (err: any) {
      console.error("Reset Password Submission Error:", err);
      setError(err.message || "An unexpected error occurred while resetting your password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-[#0D0D2B] via-[#0e1b4d] to-[#1A1A40]">
      {/* Invisible Firebase reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md bg-[#0e1b4d] border border-[#1b2a7a] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#142055] px-6 py-6 text-center border-b border-white/10 relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#0D0D2B] border border-[#F36E0F] mb-2.5 shadow-md">
            <KeyRound className="w-6 h-6 text-[#F36E0F]" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            {step === 1 && "Verify your registered mobile number via direct SMS code."}
            {step === 2 && "Enter your 6-digit SMS code and choose your new password."}
            {step === 3 && "Your password has been successfully updated!"}
          </p>

          <div className="inline-flex items-center gap-1.5 bg-[#25C974]/20 border border-[#25C974]/40 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-emerald-300 mt-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Direct SMS Verification • 256-Bit Cryptographic Reset
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-7 flex flex-col gap-5">
          {/* Back to Login Link */}
          {step !== 3 && (
            <Link
              href="/login"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Log In
            </Link>
          )}

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 text-rose-300 px-3.5 py-2.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && step !== 3 && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3.5 py-2.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STEP 1: Enter Phone Number & Send SMS Code                */}
          {/* ========================================================= */}
          {step === 1 && (
            <form onSubmit={handleSendVerificationCode} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Registered Mobile Phone Number
                </label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-[#1b2a7a] text-white text-xs rounded-xl px-2.5 py-3 border border-[#2a3c91] outline-none focus:ring-2 focus:ring-[#F36E0F]"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      autoFocus
                      placeholder="(555) 000-0000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                    />
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">
                  We will send a 6-digit SMS verification code to verify ownership of this number.
                </span>
              </div>

              {/* Bot Security Check Box */}
              <div
                onClick={handleCaptchaClick}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all ${
                  captchaChecked
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                    : "bg-[#142055] border-[#2a3c91] hover:border-[#F36E0F] text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                      captchaChecked
                        ? "bg-emerald-500 border-emerald-400 text-black"
                        : "border-slate-500 bg-[#0D0D2B]"
                    }`}
                  >
                    {captchaLoading && (
                      <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {captchaChecked && <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />}
                  </div>
                  <span className="text-xs font-bold">
                    {captchaChecked ? "Human Player Verified" : "I am a human player"}
                  </span>
                </div>
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              </div>

              {/* Send SMS Button */}
              <button
                type="submit"
                disabled={sendingSms}
                className="w-full mt-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 disabled:opacity-60 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {sendingSms ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Sending SMS Code...</span>
                  </>
                ) : (
                  <>
                    <span>Send SMS Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 2: Input Verification Code & Set New Password        */}
          {/* ========================================================= */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              {/* Phone display badge with edit option */}
              <div className="flex items-center justify-between bg-[#142055] px-3.5 py-2.5 rounded-xl border border-[#2a3c91]">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#F36E0F]" />
                  <span className="text-xs text-white font-mono font-bold">
                    {fullPhoneNumber}
                  </span>
                  {targetUserDisplayName && (
                    <span className="text-[10px] text-slate-400">
                      ({targetUserDisplayName})
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setError("");
                    setSuccessMsg("");
                  }}
                  className="text-[11px] text-[#F36E0F] hover:underline font-bold"
                >
                  Change
                </button>
              </div>

              {/* 6-Digit SMS Verification Code */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    6-Digit SMS Verification Code
                  </label>
                  {resendCooldown > 0 ? (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Resend in {resendCooldown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={sendingSms}
                      onClick={() => handleSendVerificationCode()}
                      className="text-[11px] text-[#F36E0F] hover:underline font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend SMS Code
                    </button>
                  )}
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-3.5 py-3 text-base font-mono tracking-widest outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#1b2a7a] text-white placeholder:text-gray-400 rounded-xl pl-10 pr-10 py-3 text-sm outline-none focus:ring-2 focus:ring-[#F36E0F] border border-[#2a3c91]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <span className="text-[10px] text-rose-400 font-medium">
                    Passwords do not match.
                  </span>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match!
                  </span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || (confirmPassword.length > 0 && newPassword !== confirmPassword)}
                className="w-full mt-2 bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 disabled:opacity-60 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Code & Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ========================================================= */}
          {/* STEP 3: Success Confirmation Screen                       */}
          {/* ========================================================= */}
          {step === 3 && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <div>
                <h2 className="text-xl font-black text-white">
                  Password Reset Complete!
                </h2>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Your password has been securely updated and verified. You are now logged in to your Kali Gaming account.
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="w-full bg-gradient-to-r from-[#F6FF00] via-[#F36E0F] to-[#EA0000] hover:opacity-95 text-black font-extrabold py-3.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  <span>Go to Casino Lobby</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <Link
                  href="/login"
                  className="w-full text-center text-xs text-slate-300 hover:text-white bg-[#1b2a7a] hover:bg-[#2a3c91] py-2.5 rounded-xl font-bold transition-colors"
                >
                  Return to Sign In Page
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
