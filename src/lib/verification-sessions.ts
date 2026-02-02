import type { VerificationSession } from "@/types/verification";
import { SESSION_TTL } from "./config";

/**
 * In-memory verification session store.
 * Uses globalThis to survive hot module reloads in development.
 * For production, replace with Redis or a database.
 */
const globalForSessions = globalThis as unknown as {
  __verificationSessions?: Map<string, VerificationSession>;
};

const sessions =
  globalForSessions.__verificationSessions ??
  new Map<string, VerificationSession>();

globalForSessions.__verificationSessions = sessions;

/** Periodic cleanup of expired sessions */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions) {
      if (now - session.createdAt > SESSION_TTL) {
        session.status = "expired";
        sessions.delete(id);
      }
    }
  }, 30_000);
}

export function getVerificationSession(
  sessionId: string,
): VerificationSession | undefined {
  return sessions.get(sessionId);
}

export function setVerificationSession(session: VerificationSession): void {
  sessions.set(session.sessionId, session);
}

export function deleteVerificationSession(sessionId: string): void {
  sessions.delete(sessionId);
}
