import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyPresentation } from "@/lib/verifier-service";
import { getSession, getSessionVersion } from "@/lib/session";
import {
  getVerificationSession,
  setVerificationSession,
} from "@/lib/verification-sessions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, presentation, verificationRequest } = body;

    if (!sessionId || !presentation || !verificationRequest) {
      return NextResponse.json(
        {
          error:
            "sessionId, presentation (VP), and verificationRequest (VPR) are required",
        },
        { status: 400 },
      );
    }

    const verificationSession = getVerificationSession(sessionId);
    if (!verificationSession) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 },
      );
    }

    // Allow retries on iOS by resetting failed sessions back to pending
    if (verificationSession.status === "failed") {
      console.log("[Verify] Resetting failed session to pending for retry");
      verificationSession.status = "pending";
    } else if (verificationSession.status !== "pending") {
      return NextResponse.json(
        { error: `Session is already ${verificationSession.status}` },
        { status: 409 },
      );
    }

    const auditRecordId = randomUUID();

    console.log("[Verify] Session ID:", sessionId);
    console.log("[Verify] Session status:", verificationSession.status);
    console.log("[Verify] VP (presentation):", JSON.stringify(presentation, null, 2).substring(0, 500) + "...");
    console.log("[Verify] VPR (verificationRequest):", JSON.stringify(verificationRequest, null, 2).substring(0, 500) + "...");

    // Call Concordium Verifier Service to verify VP + anchor VAA on-chain
    const result = await verifyPresentation({
      auditRecordId,
      presentation,
      verificationRequest,
    });

    if (result.result === "verified") {
      setVerificationSession({
        ...verificationSession,
        status: "verified",
        verificationAuditRecord: result.verificationAuditRecord,
        anchorTransactionHash: result.anchorTransactionHash,
      });

      // Set encrypted HTTP-only session cookie
      const session = await getSession();
      session.isVerified = true;
      session.verifiedAt = Date.now();
      session.anchorTransactionHash = result.anchorTransactionHash;
      session.sessionVersion = getSessionVersion();
      await session.save();

      // In production, persist VAR to a database for audit compliance:
      // await db.verificationAuditRecords.create(result.verificationAuditRecord);

      return NextResponse.json({
        status: "verified",
        anchorTransactionHash: result.anchorTransactionHash,
      });
    } else {
      const failReason = result.reason || result.error || "Unknown verification failure";
      console.log("[Verify] Verification failed, reason:", failReason);
      console.log("[Verify] Full result:", JSON.stringify(result, null, 2));

      setVerificationSession({
        ...verificationSession,
        status: "failed",
        error: failReason,
      });

      return NextResponse.json(
        { status: "failed", error: failReason },
        { status: 403 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Verification verify error:", errorMessage);
    console.error("Full error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
