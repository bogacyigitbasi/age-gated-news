"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VerificationFlowState } from "@/types/verification";
import {
  getSignClient,
  createPairing,
  sendVPRToIDApp,
  buildDeepLinkURI,
  isMobileDevice,
  resetSignClient,
  isIOS as checkIsIOS,
} from "@/lib/walletconnect";
import type SignClient from "@walletconnect/sign-client";

/**
 * Request notification permission if on mobile
 */
async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") {
    return true;
  }
  if (Notification.permission === "denied") {
    return false;
  }
  const result = await Notification.requestPermission();
  return result === "granted";
}

/**
 * Show a notification to bring user back to browser
 */
function showVerificationNotification() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.log("[Notification] Not supported in this environment");
    return;
  }

  console.log("[Notification] Permission status:", Notification.permission);

  if (Notification.permission !== "granted") {
    console.log("[Notification] Permission not granted, skipping");
    return;
  }

  try {
    const notification = new Notification("Age Verified!", {
      body: "Tap to return to NewsGate",
      icon: "/favicon.ico",
      tag: "age-verification",
      requireInteraction: true,
    });
    console.log("[Notification] Created notification");

    notification.onclick = () => {
      console.log("[Notification] User clicked notification");
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.error("[Notification] Failed to create:", err);
  }
}

interface UseVerificationReturn {
  state: VerificationFlowState;
  wcUri: string | null;
  deepLinkUri: string | null;
  isMobile: boolean;
  isIOS: boolean;
  error: string | null;
  sessionId: string | null;
  anchorHash: string | null;
  startVerification: () => Promise<void>;
  reset: () => void;
  resendVPR: () => Promise<void>;
}

export function useVerification(): UseVerificationReturn {
  const [state, setState] = useState<VerificationFlowState>("idle");
  const [wcUri, setWcUri] = useState<string | null>(null);
  const [deepLinkUri, setDeepLinkUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [anchorHash, setAnchorHash] = useState<string | null>(null);
  const clientRef = useRef<SignClient | null>(null);

  const isMobile =
    typeof window !== "undefined" ? isMobileDevice() : false;
  const isIOS = typeof window !== "undefined" ? checkIsIOS() : false;

  // Store VPR data for potential resend
  const vprDataRef = useRef<{ connectionId: string; vpr: unknown } | null>(null);

  // Track if we've already attempted auto-resend to avoid loops
  const hasAutoResentRef = useRef(false);
  // Track when page was backgrounded (for iOS timing issues)
  const backgroundedAtRef = useRef<number | null>(null);

  // iOS: Track when page goes to background and auto-resend VPR when returning
  useEffect(() => {
    if (!isIOS) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "hidden") {
        // Page going to background - record timestamp
        backgroundedAtRef.current = Date.now();
        console.log("[iOS] Page going to background");
        return;
      }

      // Page becoming visible
      const wasBackgrounded = backgroundedAtRef.current;
      const timeInBackground = wasBackgrounded ? Date.now() - wasBackgrounded : 0;
      backgroundedAtRef.current = null;

      console.log("[iOS] Page visible again, was in background for", timeInBackground, "ms");

      // Only auto-resend if we're waiting for proof and haven't already tried
      if (
        state === "awaiting_proof" &&
        vprDataRef.current &&
        clientRef.current &&
        !hasAutoResentRef.current
      ) {
        console.log("[iOS] User returned to browser, auto-resending VPR...");
        hasAutoResentRef.current = true;

        // Longer delay if page was backgrounded longer (WebSocket needs more time to reconnect)
        const delay = timeInBackground > 5000 ? 2500 : 1500;
        console.log("[iOS] Waiting", delay, "ms for WebSocket reconnection...");

        setTimeout(async () => {
          console.log("[iOS] Attempting VPR resend after reconnection delay...");

          if (!vprDataRef.current || !clientRef.current) {
            console.log("[iOS] Missing VPR data or client, aborting resend");
            hasAutoResentRef.current = false;
            return;
          }

          const { connectionId, vpr } = vprDataRef.current;
          try {
            const vp = await sendVPRToIDApp(clientRef.current!, connectionId, vpr);
            console.log("[iOS] Received VP from ID App after auto-resend!");

            setState("verifying");

            const verifyRes = await fetch("/api/verification/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                presentation: vp,
                verificationRequest: vpr,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              throw new Error(
                (errData as { error?: string }).error || "Verification failed",
              );
            }

            const verifyData = await verifyRes.json();
            setAnchorHash(verifyData.anchorTransactionHash);
            setState("verified");

            if (isMobile) {
              showVerificationNotification();
            }
          } catch (err: unknown) {
            console.error("[iOS] Auto-resend failed:", err);
            // Don't show error, let user manually retry with button
            hasAutoResentRef.current = false;
          }
        }, delay);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isIOS, state, sessionId, isMobile]);

  const reset = useCallback(() => {
    setState("idle");
    setWcUri(null);
    setDeepLinkUri(null);
    setError(null);
    setSessionId(null);
    setAnchorHash(null);
    vprDataRef.current = null;
    hasAutoResentRef.current = false;
    // Reset WalletConnect client to ensure fresh connection on retry
    resetSignClient();
  }, []);

  // Resend VPR to ID App (for iOS when the initial send fails due to backgrounding)
  const resendVPR = useCallback(async () => {
    console.log("[Verify] Resend button clicked");
    console.log("[Verify] vprDataRef.current:", vprDataRef.current ? "exists" : "null");
    console.log("[Verify] clientRef.current:", clientRef.current ? "exists" : "null");

    if (!vprDataRef.current || !clientRef.current) {
      console.log("[Verify] Cannot resend VPR - no data stored");
      setError("Cannot resend - connection data lost. Please try again.");
      setState("failed");
      return;
    }

    const { connectionId, vpr } = vprDataRef.current;
    console.log("[Verify] Resending VPR to ID App, connectionId:", connectionId);

    try {
      const vp = await sendVPRToIDApp(clientRef.current, connectionId, vpr);
      console.log("[Verify] Received VP from ID App after resend!");

      // Continue with verification
      setState("verifying");

      const verifyRes = await fetch("/api/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          presentation: vp,
          verificationRequest: vpr,
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Verification failed",
        );
      }

      const verifyData = await verifyRes.json();
      setAnchorHash(verifyData.anchorTransactionHash);
      setState("verified");

      if (isMobile) {
        showVerificationNotification();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Resend failed";
      console.error("Resend VPR error:", err);
      setError(message);
      setState("failed");
    }
  }, [sessionId, isMobile]);

  const startVerification = useCallback(async () => {
    try {
      // Step 1: Initialize WalletConnect and create pairing
      setState("connecting");
      setError(null);

      // Request notification permission on mobile for "return to browser" notification
      if (isMobile) {
        await requestNotificationPermission();
      }

      console.log("[Verify] Getting SignClient...");
      const client = await getSignClient();
      clientRef.current = client;

      console.log("[Verify] Creating pairing...");
      const { uri, approval } = await createPairing(client);
      console.log("[Verify] Pairing created, uri:", uri ? uri.substring(0, 30) + "..." : "null");

      if (uri) {
        setWcUri(uri);
        setDeepLinkUri(buildDeepLinkURI(uri));
      } else {
        throw new Error("WalletConnect did not return a pairing URI");
      }

      // Wait for wallet approval (user scans QR / taps deep link)
      console.log("[Verify] Waiting for wallet approval (scan QR)...");
      const session = await approval();
      const connectionId = session.topic;
      console.log("[Verify] Session approved! Topic:", connectionId);

      // Step 2: Call backend to create VPR (backend calls Verifier Service)
      setState("creating_vpr");
      console.log("[Verify] Creating VPR via backend...");

      const createRes = await fetch("/api/verification/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            "Failed to create verification request",
        );
      }

      const { sessionId: sid, vpr } = await createRes.json();
      setSessionId(sid);
      console.log("[Verify] VPR created, sessionId:", sid);

      // Store VPR data for potential resend (iOS issue)
      vprDataRef.current = { connectionId, vpr };

      // Step 3: Send VPR to IDApp via WalletConnect
      setState("awaiting_proof");
      console.log("[Verify] Sending VPR to ID App via WalletConnect...");
      console.log("[Verify] Document visibility:", document.visibilityState);
      console.log("[Verify] isIOS:", isIOS, "isMobile:", isMobile);

      const vp = await sendVPRToIDApp(client, connectionId, vpr);
      console.log("[Verify] Received VP from ID App!");

      // Step 4: Send VP + VPR to backend for verification
      setState("verifying");

      const verifyRes = await fetch("/api/verification/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sid,
          presentation: vp,
          verificationRequest: vpr,
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error || "Verification failed",
        );
      }

      const verifyData = await verifyRes.json();
      setAnchorHash(verifyData.anchorTransactionHash);
      setState("verified");

      // Show notification on mobile to help user return to browser
      if (isMobile) {
        showVerificationNotification();
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Verification failed";
      console.error("Verification flow error:", err);
      setError(message);
      setState("failed");
    }
  }, []);

  return {
    state,
    wcUri,
    deepLinkUri,
    isMobile,
    isIOS,
    error,
    sessionId,
    anchorHash,
    startVerification,
    reset,
    resendVPR,
  };
}
