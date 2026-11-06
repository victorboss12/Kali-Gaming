import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  Auth,
} from "firebase/auth";

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY"
  );
}

export function getFirebaseClientApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;

  try {
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (err) {
    console.warn("Failed to initialize Firebase app:", err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseClientApp();
  if (!app) return null;
  try {
    return getAuth(app);
  } catch (err) {
    console.warn("Failed to get Firebase Auth:", err);
    return null;
  }
}

/**
 * Clears and resets the global RecaptchaVerifier instance.
 */
export function clearRecaptchaVerifier(): void {
  if (typeof window === "undefined") return;
  try {
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear();
    }
  } catch {}
  (window as any).recaptchaVerifier = null;
  (window as any).recaptchaVerifierContainerId = null;
}

/**
 * Initializes a Firebase RecaptchaVerifier attached to an HTML container element.
 * Reuses existing active instance to prevent "reCAPTCHA has already been rendered in this element".
 */
export function setupRecaptchaVerifier(containerId: string): RecaptchaVerifier | null {
  if (typeof window === "undefined") return null;
  const auth = getFirebaseAuth();
  if (!auth) return null;

  try {
    // 1. If an active verifier already exists for this container, reuse it!
    const existing = (window as any).recaptchaVerifier;
    const existingId = (window as any).recaptchaVerifierContainerId;
    const container = document.getElementById(containerId);

    if (existing && existingId === containerId && container) {
      return existing;
    }

    // 2. If an existing verifier was on a different container or stale, clear it
    if (existing) {
      try {
        existing.clear();
      } catch {}
      (window as any).recaptchaVerifier = null;
    }

    if (!container) {
      console.warn(`reCAPTCHA container element #${containerId} not found in DOM.`);
      return null;
    }

    // Clear previous child elements
    container.innerHTML = "";

    const verifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved - will allow phone auth request
      },
      "expired-callback": () => {
        console.warn("reCAPTCHA expired, clearing verifier.");
        clearRecaptchaVerifier();
      },
    });

    (window as any).recaptchaVerifier = verifier;
    (window as any).recaptchaVerifierContainerId = containerId;
    return verifier;
  } catch (err: any) {
    console.warn("Error setting up RecaptchaVerifier, attempting safe recovery:", err);
    const msg = String(err?.message || "");

    // If it threw "reCAPTCHA has already been rendered in this element"
    if (msg.includes("already been rendered") || err?.code === "auth/argument-error") {
      if ((window as any).recaptchaVerifier) {
        return (window as any).recaptchaVerifier;
      }

      // Safe recovery: create a freshly created nested child element
      try {
        const parent = document.getElementById(containerId);
        if (parent) {
          const freshId = `${containerId}-${Date.now()}`;
          parent.innerHTML = `<div id="${freshId}"></div>`;
          const recoveredVerifier = new RecaptchaVerifier(auth, freshId, {
            size: "invisible",
          });
          (window as any).recaptchaVerifier = recoveredVerifier;
          (window as any).recaptchaVerifierContainerId = containerId;
          return recoveredVerifier;
        }
      } catch (recoveryErr) {
        console.error("Failed to recover reCAPTCHA verifier:", recoveryErr);
      }
    }
    return null;
  }
}

/**
 * Sends SMS verification code via Firebase Phone Authentication.
 */
export async function sendFirebasePhoneCode(
  phoneNumber: string,
  appVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Please verify your Firebase project credentials.");
  }
  return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
}

/**
 * Confirms SMS verification code with Firebase and returns user ID token.
 */
export async function confirmFirebasePhoneCode(
  confirmationResult: ConfirmationResult,
  verificationCode: string
): Promise<{ uid: string; phoneNumber: string | null; idToken: string }> {
  const userCredential = await confirmationResult.confirm(verificationCode);
  const user = userCredential.user;
  const idToken = await user.getIdToken();

  return {
    uid: user.uid,
    phoneNumber: user.phoneNumber,
    idToken,
  };
}
