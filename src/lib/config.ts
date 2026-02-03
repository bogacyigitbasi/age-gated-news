export const CONCORDIUM_CHAINS = {
  testnet: "ccd:4221332d34e1694168c2a0c0b3fd0f27",
  mainnet: "ccd:9dd9ca4d19e9393877d2c44b70f89acb",
} as const;

export const TRUSTED_ISSUERS = {
  testnet: [
    "did:ccd:testnet:idp:0",
    "did:ccd:testnet:idp:1",
    "did:ccd:testnet:idp:2",
    "did:ccd:testnet:idp:3",
  ],
  mainnet: [
    "did:ccd:mainnet:idp:0",
    "did:ccd:mainnet:idp:1",
    "did:ccd:mainnet:idp:2",
    "did:ccd:mainnet:idp:3",
  ],
} as const;

export const CONCORDIUM_DEEPLINK = {
  testnet: "concordiumidapp",
  mainnet: "concordiumidapp",
} as const;

export type ConcordiumNetwork = "testnet" | "mainnet";

export const NETWORK = (process.env.NEXT_PUBLIC_CONCORDIUM_NETWORK ||
  "testnet") as ConcordiumNetwork;
export const CHAIN_ID = CONCORDIUM_CHAINS[NETWORK];
export const ISSUERS = [...TRUSTED_ISSUERS[NETWORK]];

export const REQUIRED_AGE = parseInt(process.env.REQUIRED_AGE || "18", 10);
export const SESSION_TTL =
  parseInt(process.env.VERIFICATION_SESSION_TTL || "300", 10) * 1000;
export const NEWS_CACHE_TTL = parseInt(
  process.env.NEWS_CACHE_TTL || "1800",
  10,
);
export const VERIFIER_SERVICE_URL =
  process.env.VERIFIER_SERVICE_URL || "http://localhost:8000";

/**
 * Calculate the DOB upper bound for age verification.
 * Anyone born on or before this date is at least REQUIRED_AGE years old.
 */
export function getDobUpperBound(): string {
  const now = new Date();
  const cutoff = new Date(
    now.getFullYear() - REQUIRED_AGE,
    now.getMonth(),
    now.getDate(),
  );
  const year = cutoff.getFullYear().toString();
  const month = (cutoff.getMonth() + 1).toString().padStart(2, "0");
  const day = cutoff.getDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}
