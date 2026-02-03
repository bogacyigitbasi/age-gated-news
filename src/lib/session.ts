import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

/**
 * Global session version - increment to invalidate all existing sessions.
 * Uses globalThis to survive hot module reloads in development.
 */
const globalForSessionVersion = globalThis as unknown as {
  __sessionVersion?: number;
};
globalForSessionVersion.__sessionVersion ??= 1;

export function getSessionVersion(): number {
  return globalForSessionVersion.__sessionVersion ?? 1;
}

export function incrementSessionVersion(): number {
  globalForSessionVersion.__sessionVersion = (globalForSessionVersion.__sessionVersion ?? 1) + 1;
  return globalForSessionVersion.__sessionVersion;
}

export interface SessionData {
  isVerified: boolean;
  verifiedAt?: number;
  anchorTransactionHash?: string;
  sessionVersion?: number;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "change-me-to-a-random-string-at-least-32-characters",
  cookieName: "age-gate-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
