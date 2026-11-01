/**
 * Smart Deep Link & App Launcher for Outsourced Sweepstakes Games.
 * 
 * Behavior:
 * 1. On Mobile:
 *    - On Android: Utilizes Android Intent URI with built-in S.browser_fallback_url
 *      so that Chrome automatically opens the app if installed, or redirects to
 *      the download page if not installed, without throwing error dialogs.
 *    - On iOS (Safari): Attempts custom URL scheme (e.g. gamevault://) and monitors
 *      document visibility. If document.hidden does not trigger within the timeout
 *      (meaning app is not installed), redirects to the download portal.
 * 2. On Desktop:
 *    - Opens the web play portal (if available) or official download portal.
 */

export interface LaunchGameOptions {
  scheme?: string;
  androidPackage?: string;
  downloadUrl: string;
  webUrl?: string;
  autoFallbackTimeoutMs?: number;
  onStatusChange?: (status: "launching" | "opened" | "fallback" | "idle") => void;
}

export interface LaunchGameHandle {
  cancel: () => void;
}

export function detectDevice() {
  if (typeof window === "undefined" || !navigator) {
    return { isMobile: false, isAndroid: false, isIOS: false };
  }

  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile = isAndroid || isIOS;

  return { isMobile, isAndroid, isIOS };
}

export function launchGameWithFallback({
  scheme,
  androidPackage,
  downloadUrl,
  webUrl,
  autoFallbackTimeoutMs = 1800,
  onStatusChange,
}: LaunchGameOptions): LaunchGameHandle {
  if (typeof window === "undefined") {
    return { cancel: () => {} };
  }

  const { isMobile, isAndroid, isIOS } = detectDevice();
  let cancelled = false;
  let timerId: any = null;

  const cancel = () => {
    cancelled = true;
    if (timerId) clearTimeout(timerId);
    onStatusChange?.("idle");
  };

  // 1. Desktop behavior: Open web portal or download page
  if (!isMobile) {
    const targetUrl = webUrl || downloadUrl;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    onStatusChange?.("opened");
    return { cancel };
  }

  onStatusChange?.("launching");

  // 2. Android Chrome Intent behavior
  if (isAndroid && androidPackage && scheme) {
    const rawScheme = scheme.replace(/:\/\/?$/, "");
    const fallbackEncoded = encodeURIComponent(downloadUrl);
    // Standard Android Chrome Intent format
    const intentUrl = `intent://launch#Intent;scheme=${rawScheme};package=${androidPackage};S.browser_fallback_url=${fallbackEncoded};end`;

    try {
      window.location.href = intentUrl;
      onStatusChange?.("opened");
    } catch {
      window.location.href = downloadUrl;
      onStatusChange?.("fallback");
    }
    return { cancel };
  }

  // 3. iOS Safari / Generic Mobile Deep Linking with Visibility Fallback
  const startTime = Date.now();
  let appOpened = false;

  const handleVisibilityChange = () => {
    if (document.hidden) {
      appOpened = true;
      if (timerId) clearTimeout(timerId);
      onStatusChange?.("opened");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  timerId = setTimeout(() => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    if (!cancelled && !appOpened && !document.hidden) {
      const elapsed = Date.now() - startTime;
      // If document stayed visible and execution didn't pause, app wasn't opened
      if (elapsed < autoFallbackTimeoutMs + 1200) {
        onStatusChange?.("fallback");
        window.location.href = downloadUrl;
      }
    }
  }, autoFallbackTimeoutMs);

  // Trigger custom URL scheme
  if (scheme) {
    try {
      window.location.href = scheme;
    } catch {
      window.location.href = downloadUrl;
    }
  } else {
    window.location.href = downloadUrl;
  }

  return { cancel };
}
