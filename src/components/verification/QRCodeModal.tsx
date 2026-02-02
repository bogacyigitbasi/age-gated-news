"use client";

import { QRCodeSVG } from "qrcode.react";
import type { VerificationFlowState } from "@/types/verification";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wcUri: string | null;
  deepLinkUri: string | null;
  isMobile: boolean;
  state: VerificationFlowState;
  error: string | null;
  onRetry: () => void;
}

const STATE_MESSAGES: Record<VerificationFlowState, string> = {
  idle: "",
  connecting: "Scan the QR code with your Concordium ID App",
  creating_vpr: "Creating verification request...",
  awaiting_proof: "Waiting for proof from Concordium ID App...",
  verifying: "Verifying your proof...",
  verified: "Age verified successfully!",
  failed: "Verification failed.",
};

export function QRCodeModal({
  isOpen,
  onClose,
  wcUri,
  deepLinkUri,
  isMobile,
  state,
  error,
  onRetry,
}: QRCodeModalProps) {
  if (!isOpen) return null;

  const isLoading = ["creating_vpr", "awaiting_proof", "verifying"].includes(
    state,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Age Verification"
    >
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            Verify Your Age
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Status message */}
        <p className="mb-4 text-sm text-gray-600">
          {STATE_MESSAGES[state]}
        </p>

        {/* QR Code / Deep Link */}
        {state === "connecting" && !wcUri && (
          <div className="flex flex-col items-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00D4AA] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">
              Initializing WalletConnect...
            </p>
          </div>
        )}
        {state === "connecting" && wcUri && (
          <div className="space-y-4">
            <div className="flex justify-center rounded-lg bg-white p-4">
              <QRCodeSVG
                value={wcUri}
                size={240}
                level="M"
                bgColor="#ffffff"
                fgColor="#1A1A2E"
              />
            </div>
            {deepLinkUri && (
              <a
                href={deepLinkUri}
                className="block w-full rounded-lg bg-[#00D4AA] py-3 text-center font-medium text-white transition-colors hover:bg-[#00C09A]"
              >
                Open Concordium ID App
              </a>
            )}
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex flex-col items-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00D4AA] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">
              {state === "awaiting_proof"
                ? "Please approve the proof request in your Concordium ID App"
                : "Processing..."}
            </p>
          </div>
        )}

        {/* Success */}
        {state === "verified" && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="font-semibold text-green-600">
              Verification Complete
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Your age has been verified using a zero-knowledge proof.
              No personal data was shared.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-lg bg-[#00D4AA] px-6 py-2 font-medium text-white transition-colors hover:bg-[#00C09A]"
            >
              Continue to News
            </button>
          </div>
        )}

        {/* Error + Retry */}
        {state === "failed" && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="mb-1 font-semibold text-red-600">
              Verification Failed
            </p>
            <p className="mb-4 text-sm text-gray-500">
              {error || "Something went wrong. Please try again."}
            </p>
            <button
              onClick={onRetry}
              className="rounded-lg bg-[#00D4AA] px-6 py-2 font-medium text-white transition-colors hover:bg-[#00C09A]"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Privacy note */}
        <p className="mt-4 text-center text-xs text-gray-400">
          This uses zero-knowledge proofs. Your date of birth and personal
          data are never revealed.
        </p>
      </div>
    </div>
  );
}
