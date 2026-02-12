import { VERIFIER_SERVICE_URL, ISSUERS, getDobUpperBound } from "./config";

/**
 * Calls the Concordium Verifier Service to create a Verifiable Presentation Request (VPR).
 * This also anchors the Verification Request Anchor (VRA) on-chain.
 */
export async function createVerificationRequest(params: {
  connectionId: string;
  resourceId: string;
  contextString: string;
}) {
  const dobUpperBound = getDobUpperBound();

  const body = {
    connectionId: params.connectionId,
    resourceId: params.resourceId,
    contextString: params.contextString,
    requestedClaims: [
      {
        type: "identity",
        source: ["identityCredential"],
        issuers: ISSUERS,
        statements: [
          {
            type: "AttributeInRange",
            attributeTag: "dob",
            lower: "19000101",
            upper: dobUpperBound,
          },
        ],
      },
    ],
  };

  const response = await fetch(
    `${VERIFIER_SERVICE_URL}/verifiable-presentations/create-verification-request`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Verifier Service create-verification-request failed: ${response.status} ${text}`,
    );
  }

  return response.json();
}

/**
 * Calls the Concordium Verifier Service to verify a Verifiable Presentation (VP).
 * This also anchors the Verification Audit Anchor (VAA) on-chain.
 */
export async function verifyPresentation(params: {
  auditRecordId: string;
  presentation: unknown;
  verificationRequest: unknown;
}) {
  // The VP from WalletConnect may be wrapped in { verifiablePresentationJson: {...} }
  // The Verifier Service expects the raw VP object directly
  const rawPresentation = params.presentation as Record<string, unknown>;
  const presentation =
    rawPresentation.verifiablePresentationJson ?? rawPresentation;

  const body = {
    auditRecordId: params.auditRecordId,
    presentation,
    verificationRequest: params.verificationRequest,
  };

  console.log("[VerifierService] Verify request body (truncated):", JSON.stringify(body, null, 2).substring(0, 1000));

  const response = await fetch(
    `${VERIFIER_SERVICE_URL}/verifiable-presentations/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const responseText = await response.text();
  console.log("[VerifierService] Response status:", response.status);
  console.log("[VerifierService] Response body:", responseText);

  if (!response.ok) {
    throw new Error(
      `Verifier Service verify failed: ${response.status} ${responseText}`,
    );
  }

  try {
    const result = JSON.parse(responseText);
    console.log("[VerifierService] Verification result:", result.result);
    return result;
  } catch {
    throw new Error(`Failed to parse verifier response: ${responseText}`);
  }
}
