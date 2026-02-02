export type VerificationSessionStatus =
  | "pending"
  | "verified"
  | "failed"
  | "expired";

export interface VerificationSession {
  sessionId: string;
  status: VerificationSessionStatus;
  createdAt: number;
  connectionId: string;
  vpr?: VerifiablePresentationRequest;
  transactionRef?: string;
  verificationAuditRecord?: VerificationAuditRecord;
  anchorTransactionHash?: string;
  error?: string;
}

export interface CredentialStatement {
  type:
    | "AttributeInRange"
    | "AttributeInSet"
    | "AttributeNotInSet"
    | "RevealAttribute";
  attributeTag: string;
  lower?: string;
  upper?: string;
  set?: string[];
  attributeValue?: string;
}

export interface VerifiablePresentationRequest {
  type: "ConcordiumVerificationRequestV1";
  context: {
    type: "ConcordiumUnfilledContextInformationV1";
    given: Array<{ label: string; context: string }>;
    requested: string[];
  };
  subjectClaims: Array<{
    type: "identity";
    source: string[];
    statements: CredentialStatement[];
    issuers: string[];
  }>;
  transactionRef: string;
}

export interface VerifiablePresentation {
  type: string[];
  presentationContext: {
    type: "ConcordiumContextInformationV1";
    given: Array<{ label: string; context: string }>;
    requested: Array<{ label: string; context: string }>;
  };
  verifiableCredential: Array<{
    type: string[];
    credentialSubject: {
      id: string;
      statement: CredentialStatement[];
    };
    validFrom: string;
    validUntil: string;
    issuer: string;
    proof: {
      created: string;
      proofValue: string;
      type: string;
    };
  }>;
  proof: {
    created: string;
    proofValue: string;
    type: string;
  };
}

export interface VerificationAuditRecord {
  type: "ConcordiumVerificationAuditRecord";
  version: number;
  id: string;
  request: VerifiablePresentationRequest;
  presentation: VerifiablePresentation;
}

export interface VerifierServiceVerifyResponse {
  result: "verified" | "failed";
  verificationAuditRecord: VerificationAuditRecord;
  anchorTransactionHash: string;
}

/** Frontend state machine states */
export type VerificationFlowState =
  | "idle"
  | "connecting"
  | "creating_vpr"
  | "awaiting_proof"
  | "verifying"
  | "verified"
  | "failed";
