"use client";

import { useState, useEffect } from "react";
import { useVerification } from "@/hooks/useVerification";
import { useVerificationContext } from "./VerificationProvider";
import { QRCodeModal } from "./QRCodeModal";

export function AgeGateOverlay() {
  const { isVerified, sessionExpired, setVerified, verificationRequested, clearVerificationRequest } = useVerificationContext();
  const [showModal, setShowModal] = useState(false);
  const verification = useVerification();

  // Start verification flow when requested (e.g., from clicking a news card)
  useEffect(() => {
    if (verificationRequested && !showModal) {
      setShowModal(true);
      verification.startVerification();
      clearVerificationRequest();
    }
  }, [verificationRequested, showModal, verification, clearVerificationRequest]);

  // Once verified via the flow, update context (removes overlay without reload)
  useEffect(() => {
    if (verification.state === "verified" && !isVerified) {
      setVerified(true);
    }
  }, [verification.state, isVerified, setVerified]);

  if (isVerified) return null;

  return (
    <>
      {/* Top banner prompting verification - doesn't block card clicks */}
      <div className="sticky top-[57px] z-30 border-b border-amber-200 bg-amber-50 px-4 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${sessionExpired ? "bg-blue-100" : "bg-amber-100"}`}>
              {sessionExpired ? (
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
            </div>
            <p className="text-sm text-gray-700">
              {sessionExpired
                ? "Your verification expired. Tap any article or "
                : "Age verification required. Tap any article or "}
              <button
                onClick={() => {
                  setShowModal(true);
                  verification.startVerification();
                }}
                className="font-semibold text-[#2B76B9] underline"
              >
                verify now
              </button>
            </p>
          </div>
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
        isIOS={verification.isIOS}
        state={verification.state}
        error={verification.error}
        onRetry={() => {
          verification.reset();
          verification.startVerification();
        }}
        onResendVPR={verification.resendVPR}
      />
    </>
  );
}
