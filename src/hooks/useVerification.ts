"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { VerificationFlowState } from "@/types/verification";
import { NETWORK } from "@/lib/config";

// Dynamically import the SDK to avoid SSR issues (it accesses window/DOM)
async function getSDK() {
  const { ConcordiumVerificationWebUI, resetSDK } = await import(
    "@concordium/verification-web-ui"
  );
  return { ConcordiumVerificationWebUI, resetSDK };
}

interface UseVerificationReturn {
  state: VerificationFlowState;
  error: string | null;
  anchorHash: string | null;
  startVerification: () => Promise<void>;
  reset: () => void;
}

export function useVerification(): UseVerificationReturn {
  const [state, setState] = useState<VerificationFlowState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [anchorHash, setAnchorHash] = useState<string | null>(null);
  const sdkRef = useRef<InstanceType<
    Awaited<ReturnType<typeof getSDK>>["ConcordiumVerificationWebUI"]
  > | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const vprRef = useRef<unknown>(null);
  const stateRef = useRef<VerificationFlowState>("idle");

  // Keep stateRef in sync so the onClose callback reads current state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Set up SDK event listener
  useEffect(() => {
    const handleSDKEvent = async (event: Event) => {
      const { type, data } = (event as CustomEvent).detail;

      switch (type) {
        case "session_approved": {
          const { topic } = data;
          setState("creating_vpr");

          try {
            // Call backend to create VPR
            const createRes = await fetch("/api/verification/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ connectionId: topic }),
            });

            if (!createRes.ok) {
              const errData = await createRes.json().catch(() => ({}));
              throw new Error(
                (errData as { error?: string }).error ||
                  "Failed to create verification request",
              );
            }

            const { sessionId, vpr } = await createRes.json();
            sessionIdRef.current = sessionId;
            vprRef.current = vpr;

            // Send VPR through SDK's WalletConnect session
            setState("awaiting_proof");
            await sdkRef.current!.sendPresentationRequest(vpr, topic);
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Verification failed";
            console.error("VPR creation/send error:", err);
            setError(message);
            setState("failed");
            sdkRef.current?.showErrorState();
          }
          break;
        }

        case "presentation_received": {
          setState("verifying");

          try {
            // Send presentation to backend for verification
            const verifyRes = await fetch("/api/verification/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId: sessionIdRef.current,
                presentation: data,
                verificationRequest: vprRef.current,
              }),
            });

            if (!verifyRes.ok) {
              const errData = await verifyRes.json().catch(() => ({}));
              throw new Error(
                (errData as { error?: string }).error ||
                  "Verification failed",
              );
            }

            const verifyData = await verifyRes.json();
            setAnchorHash(verifyData.anchorTransactionHash);
            setState("verified");
            await sdkRef.current?.showSuccessState();

            // Auto-close modal after a delay
            setTimeout(() => {
              sdkRef.current?.closeModal();
            }, 2000);
          } catch (err: unknown) {
            const message =
              err instanceof Error ? err.message : "Verification failed";
            console.error("Verification error:", err);
            setError(message);
            setState("failed");
            sdkRef.current?.showErrorState();
          }
          break;
        }

        case "error": {
          const message = data?.message || "An error occurred";
          console.error("SDK error:", data);
          setError(message);
          setState("failed");
          break;
        }
      }
    };

    window.addEventListener("verification-web-ui-event", handleSDKEvent);
    return () => {
      window.removeEventListener("verification-web-ui-event", handleSDKEvent);
    };
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setAnchorHash(null);
    sessionIdRef.current = null;
    vprRef.current = null;
    sdkRef.current?.closeModal();
  }, []);

  const startVerification = useCallback(async () => {
    try {
      setState("connecting");
      setError(null);

      const { ConcordiumVerificationWebUI, resetSDK } = await getSDK();

      // Clear stale WalletConnect sessions and localStorage flags
      // to prevent the "returning user" modal from showing
      resetSDK();

      const sdk = new ConcordiumVerificationWebUI({
        network: NETWORK,
        projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
        metadata: {
          name: "Age-Gated News",
          description:
            "Privacy-preserving age verification for news access",
          url:
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          icons: [
            `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/concordium-logo.svg`,
          ],
        },
      });
      sdkRef.current = sdk;

      await sdk.renderUIModals(() => {
        // onClose callback - reset if not verified
        if (stateRef.current !== "verified") {
          setState("idle");
        }
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to start verification";
      console.error("Start verification error:", err);
      setError(message);
      setState("failed");
    }
  }, []);

  return {
    state,
    error,
    anchorHash,
    startVerification,
    reset,
  };
}
