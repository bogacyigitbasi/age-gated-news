import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createVerificationRequest } from "@/lib/verifier-service";
import { setVerificationSession } from "@/lib/verification-sessions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId } = body;

    if (!connectionId || typeof connectionId !== "string") {
      return NextResponse.json(
        { error: "connectionId (WalletConnect session topic) is required" },
        { status: 400 },
      );
    }

    const sessionId = randomUUID();

    // Call Concordium Verifier Service to create VPR + anchor VRA on-chain
    const vpr = await createVerificationRequest({
      connectionId,
      resourceId: process.env.RESOURCE_ID || "/api/news",
      contextString:
        process.env.CONTEXT_STRING || "Age verification for age-gated news",
    });

    setVerificationSession({
      sessionId,
      status: "pending",
      createdAt: Date.now(),
      connectionId,
      vpr,
      transactionRef: vpr.transactionRef,
    });

    return NextResponse.json({ sessionId, vpr });
  } catch (error) {
    console.error("Verification create error:", error);
    return NextResponse.json(
      { error: "Failed to create verification request" },
      { status: 500 },
    );
  }
}
