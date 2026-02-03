"use client";

import { QRCodeSVG } from "qrcode.react";
import type { VerificationFlowState } from "@/types/verification";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wcUri: string | null;
  deepLinkUri: string | null;
  isMobile: boolean;
  isIOS: boolean;
  state: VerificationFlowState;
  error: string | null;
  onRetry: () => void;
  onResendVPR?: () => void;
}

const STATE_MESSAGES: Record<VerificationFlowState, { desktop: string; mobile: string }> = {
  idle: { desktop: "", mobile: "" },
  connecting: { desktop: "Scan the QR code with your Concordium ID App", mobile: "Opening Concordium ID App..." },
  creating_vpr: { desktop: "Creating verification request...", mobile: "Creating verification request..." },
  awaiting_proof: { desktop: "Waiting for proof from Concordium ID App...", mobile: "Complete the verification in your Concordium ID App, then return here" },
  verifying: { desktop: "Verifying your proof...", mobile: "Verifying your proof..." },
  verified: { desktop: "Age verified successfully!", mobile: "Age verified successfully!" },
  failed: { desktop: "Verification failed.", mobile: "Verification failed." },
};

export function QRCodeModal({
  isOpen,
  onClose,
  wcUri,
  deepLinkUri,
  isMobile,
  isIOS,
  state,
  error,
  onRetry,
  onResendVPR,
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
          {isMobile ? STATE_MESSAGES[state].mobile : STATE_MESSAGES[state].desktop}
        </p>

        {/* QR Code / Deep Link */}
        {state === "connecting" && !wcUri && (
          <div className="flex flex-col items-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2B76B9] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">
              Initializing WalletConnect...
            </p>
          </div>
        )}
        {state === "connecting" && wcUri && (
          <div className="space-y-4">
            {/* Show QR code on desktop, hide on mobile (can't scan your own screen) */}
            {!isMobile && (
              <div className="flex justify-center rounded-lg bg-white p-4">
                <QRCodeSVG
                  value={wcUri}
                  size={240}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#1A1A2E"
                />
              </div>
            )}
            {/* Mobile: show redirecting message + manual button as fallback */}
            {isMobile && deepLinkUri && (
              <div className="py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-8 w-8 text-[#2B76B9]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Tap the button to open your Concordium ID App
                </p>
                <a
                  href={deepLinkUri}
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl bg-[#2B76B9] px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#245F96] active:bg-[#1E4F7A]"
                >
                  Open Concordium ID App
                </a>
                <p className="mt-3 text-sm text-gray-500">
                  Make sure you have the Concordium ID App installed
                </p>
              </div>
            )}
            {/* Desktop: show deep link as secondary option */}
            {!isMobile && deepLinkUri && (
              <a
                href={deepLinkUri}
                className="block w-full rounded-lg bg-[#2B76B9] py-3 text-center font-medium text-white transition-colors hover:bg-[#245F96]"
              >
                Open Concordium ID App
              </a>
            )}
          </div>
        )}

        {/* Loading spinner */}
        {isLoading && (
          <div className="flex flex-col items-center py-8">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#2B76B9] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">
              {state === "awaiting_proof"
                ? "Please approve the proof request in your Concordium ID App"
                : "Processing..."}
            </p>
            {/* Show resend button if stuck on awaiting_proof (primarily for iOS but available for all mobile) */}
            {state === "awaiting_proof" && isMobile && onResendVPR && (
              <div className="mt-6 text-center">
                <p className="mb-3 text-xs text-gray-400">
                  Not seeing the request in your ID App?
                </p>
                <button
                  onClick={onResendVPR}
                  className="rounded-lg border border-[#2B76B9] px-4 py-2 text-sm font-medium text-[#2B76B9] transition-colors hover:bg-blue-50"
                >
                  Resend Request
                </button>
              </div>
            )}
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
              className="mt-4 rounded-lg bg-[#2B76B9] px-6 py-2 font-medium text-white transition-colors hover:bg-[#245F96]"
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
              className="rounded-lg bg-[#2B76B9] px-6 py-2 font-medium text-white transition-colors hover:bg-[#245F96]"
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
