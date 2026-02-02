import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { verifyPresentation } from "@/lib/verifier-service";
import { getSession } from "@/lib/session";
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

    if (verificationSession.status !== "pending") {
      return NextResponse.json(
        { error: `Session is already ${verificationSession.status}` },
        { status: 409 },
      );
    }

    const auditRecordId = randomUUID();

    console.log("[Verify] VP (presentation):", JSON.stringify(presentation, null, 2));
    console.log("[Verify] VPR (verificationRequest):", JSON.stringify(verificationRequest, null, 2));

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
      await session.save();

      // In production, persist VAR to a database for audit compliance:
      // await db.verificationAuditRecords.create(result.verificationAuditRecord);

      return NextResponse.json({
        status: "verified",
        anchorTransactionHash: result.anchorTransactionHash,
      });
    } else {
      setVerificationSession({
        ...verificationSession,
        status: "failed",
        error: "Verification failed",
      });

      return NextResponse.json(
        { status: "failed", error: "Verifiable presentation could not be verified" },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("Verification verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify presentation" },
      { status: 500 },
    );
  }
}
