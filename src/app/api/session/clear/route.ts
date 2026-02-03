import { NextResponse } from "next/server";
import { incrementSessionVersion } from "@/lib/session";
import { clearAllVerificationSessions } from "@/lib/verification-sessions";

/**
 * DEV ONLY: Invalidate ALL user sessions by incrementing the global session version.
 * This doesn't delete cookies, but makes all existing sessions invalid on next page load.
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  // Increment session version - all existing cookies become invalid
  const newVersion = incrementSessionVersion();

  // Clear in-memory verification sessions
  const clearedCount = clearAllVerificationSessions();

  return NextResponse.json({
    success: true,
    message: "All sessions invalidated",
    newSessionVersion: newVersion,
    verificationSessionsCleared: clearedCount,
  });
}
