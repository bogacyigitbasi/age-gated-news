"use client";

import { useState, useCallback, useRef } from "react";
import type { VerificationFlowState } from "@/types/verification";
import {
  getSignClient,
  createPairing,
  sendVPRToIDApp,
  buildDeepLinkURI,
  isMobileDevice,
} from "@/lib/walletconnect";
import type SignClient from "@walletconnect/sign-client";

interface UseVerificationReturn {
  state: VerificationFlowState;
  wcUri: string | null;
  deepLinkUri: string | null;
  isMobile: boolean;
  error: string | null;
  sessionId: string | null;
  anchorHash: string | null;
  startVerification: () => Promise<void>;
  reset: () => void;
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

  const reset = useCallback(() => {
    setState("idle");
    setWcUri(null);
    setDeepLinkUri(null);
    setError(null);
    setSessionId(null);
    setAnchorHash(null);
  }, []);

  const startVerification = useCallback(async () => {
    try {
      // Step 1: Initialize WalletConnect and create pairing
      setState("connecting");
      setError(null);

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

      // Step 2: Call backend to create VPR (backend calls Verifier Service)
      setState("creating_vpr");

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

      // Step 3: Send VPR to IDApp via WalletConnect
      setState("awaiting_proof");

      const vp = await sendVPRToIDApp(client, connectionId, vpr);

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
    error,
    sessionId,
    anchorHash,
    startVerification,
    reset,
  };
}
