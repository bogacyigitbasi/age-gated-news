"use client";

import SignClient from "@walletconnect/sign-client";
import { CHAIN_ID, CONCORDIUM_DEEPLINK, NETWORK } from "./config";

let clientInstance: SignClient | null = null;
let initPromise: Promise<SignClient> | null = null;

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
    .then((client) => {
      console.log("[WC] SignClient initialized successfully");
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

export async function sendVPRToIDApp(
  client: SignClient,
  sessionTopic: string,
  vpr: unknown,
): Promise<unknown> {
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

export function buildDeepLinkURI(wcUri: string): string {
  const scheme = CONCORDIUM_DEEPLINK[NETWORK];
  return `${scheme}://wc?uri=${encodeURIComponent(wcUri)}`;
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}
