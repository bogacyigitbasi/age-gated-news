"use client";

import { useState, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { useVerificationContext } from "./VerificationProvider";
import { QRCodeModal } from "./QRCodeModal";

export function AgeGateOverlay() {
  const { isVerified, setVerified } = useVerificationContext();
  const [showModal, setShowModal] = useState(false);
  const verification = useVerification();

  // Once verified via the flow, update context (removes overlay without reload)
  useEffect(() => {
    if (verification.state === "verified" && !isVerified) {
      setVerified(true);
    }
  }, [verification.state, isVerified, setVerified]);

  if (isVerified) return null;

  return (
    <>
      {/* Gradient overlay over news content */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent via-white/80 to-white" />

      {/* CTA centered over the overlay */}
      <div className="absolute inset-0 z-20 flex items-center justify-center">
        <div className="mx-auto max-w-lg rounded-2xl bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-8 w-8 text-amber-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            Age-Restricted Content
          </h2>
          <p className="mb-6 text-gray-600">
            This news content requires age verification. Prove you are 18 or
            older using your Concordium ID App. No personal data is shared
            &mdash; only a zero-knowledge proof.
          </p>
          <button
            onClick={() => {
              setShowModal(true);
              verification.startVerification();
            }}
            className="rounded-xl bg-[#00D4AA] px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-[#00C09A]"
          >
            Verify Age
          </button>
          <p className="mt-4 text-xs text-gray-400">
            You need the{" "}
            <a
              href="https://concordium.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Concordium ID App
            </a>{" "}
            installed on your phone.
          </p>
        </div>
      </div>

      <QRCodeModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          if (verification.state !== "verified") {
            verification.reset();
          }
        }}
        wcUri={verification.wcUri}
        deepLinkUri={verification.deepLinkUri}
        isMobile={verification.isMobile}
        state={verification.state}
        error={verification.error}
        onRetry={() => {
          verification.reset();
          verification.startVerification();
        }}
      />
    </>
  );
}
