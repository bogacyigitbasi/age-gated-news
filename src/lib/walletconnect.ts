"use client";

import SignClient from "@walletconnect/sign-client";
import { CHAIN_ID, CONCORDIUM_DEEPLINK, NETWORK } from "./config";

let clientInstance: SignClient | null = null;
let initPromise: Promise<SignClient> | null = null;

/**
 * Reset the SignClient instance to force a fresh connection.
 * Call this when retrying after a failed verification.
 */
export function resetSignClient(): void {
  console.log("[WC] Resetting SignClient instance");
  clientInstance = null;
  initPromise = null;
}

export async function getSignClient(): Promise<SignClient> {
  if (clientInstance) return clientInstance;

  // Avoid multiple concurrent inits
  if (initPromise) return initPromise;

  initPromise = SignClient.init({
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
    metadata: {
      name: "Age-Gated News",
      description: "Privacy-preserving age verification for news access",
      url:
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      icons: [
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/concordium-logo.svg`,
      ],
    },
  })
    .then(async (client) => {
      console.log("[WC] SignClient initialized successfully");

      // Clean up any stale sessions from previous connections
      const sessions = client.session.getAll();
      console.log("[WC] Found", sessions.length, "existing sessions");
      for (const session of sessions) {
        try {
          console.log("[WC] Disconnecting stale session:", session.topic);
          await client.disconnect({
            topic: session.topic,
            reason: { code: 6000, message: "Cleanup stale session" },
          });
        } catch (e) {
          console.log("[WC] Failed to disconnect session:", e);
        }
      }

      // Also clean up stale pairings
      const pairings = client.core.pairing.getPairings();
      console.log("[WC] Found", pairings.length, "existing pairings");
      for (const pairing of pairings) {
        try {
          console.log("[WC] Disconnecting stale pairing:", pairing.topic);
          await client.core.pairing.disconnect({ topic: pairing.topic });
        } catch (e) {
          console.log("[WC] Failed to disconnect pairing:", e);
        }
      }

      clientInstance = client;
      return client;
    })
    .catch((err) => {
      console.error("[WC] SignClient init failed:", err);
      initPromise = null;
      throw err;
    });

  return initPromise;
}

export async function createPairing(client: SignClient) {
  const { uri, approval } = await client.connect({
    optionalNamespaces: {
      ccd: {
        methods: ["request_verifiable_presentation_v1"],
        chains: [CHAIN_ID],
        events: [],
      },
    },
    pairingTopic: undefined,
  });

  return { uri, approval };
}

/**
 * Wait for the WalletConnect relay to be connected.
 * iOS Safari suspends WebSocket connections when backgrounded, so we need to
 * wait for reconnection before sending messages.
 */
async function waitForRelayConnection(
  client: SignClient,
  maxWaitMs: number = 5000,
): Promise<boolean> {
  const startTime = Date.now();
  const checkInterval = 100;

  while (Date.now() - startTime < maxWaitMs) {
    try {
      // Check if the relay is connected by checking the core's connection status
      const connected = client.core.relayer.connected;
      console.log("[WC] Relay connected:", connected);
      if (connected) {
        return true;
      }
    } catch (e) {
      console.log("[WC] Error checking relay status:", e);
    }

    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.log("[WC] Relay connection timeout after", maxWaitMs, "ms");
  return false;
}

export async function sendVPRToIDApp(
  client: SignClient,
  sessionTopic: string,
  vpr: unknown,
): Promise<unknown> {
  // On iOS, ensure relay is connected before sending (may have been suspended)
  if (isIOS()) {
    console.log("[WC] iOS detected, checking relay connection before sending VPR...");
    const connected = await waitForRelayConnection(client, 3000);
    if (!connected) {
      console.warn("[WC] Relay not connected, attempting to send anyway...");
    }
  }

  console.log("[WC] Sending VPR to session topic:", sessionTopic);
  const result = await client.request({
    topic: sessionTopic,
    chainId: CHAIN_ID,
    request: {
      method: "request_verifiable_presentation_v1",
      params: vpr as object,
    },
  });

  return result;
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(navigator.userAgent);
}

export function buildDeepLinkURI(wcUri: string): string {
  // Both iOS and Android use "concordiumidapp://" scheme
  const scheme = CONCORDIUM_DEEPLINK[NETWORK];
  const deepLink = `${scheme}://wc?uri=${encodeURIComponent(wcUri)}`;
  console.log(`[DeepLink] Platform: ${isIOS() ? "iOS" : isAndroid() ? "Android" : "Other"}, scheme: ${scheme}`);
  return deepLink;
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
