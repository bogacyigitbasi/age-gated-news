import { NextRequest, NextResponse } from "next/server";
import { getVerificationSession } from "@/lib/verification-sessions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const session = getVerificationSession(sessionId);
  if (!session) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    sessionId: session.sessionId,
    status: session.status,
    createdAt: session.createdAt,
    ...(session.anchorTransactionHash && {
      anchorTransactionHash: session.anchorTransactionHash,
    }),
    ...(session.error && { error: session.error }),
  });
}
