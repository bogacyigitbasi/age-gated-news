"use client";

import { useVerificationContext } from "@/components/verification/VerificationProvider";

export function Header() {
  const { isVerified } = useVerificationContext();

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2B76B9]">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">NewsGate</h1>
            <p className="text-xs text-gray-500">
              Powered by Concordium ID
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isVerified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Age Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Not Verified
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
