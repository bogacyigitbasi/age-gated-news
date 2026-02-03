"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface VerificationContextType {
  isVerified: boolean;
  sessionExpired: boolean;
  setVerified: (v: boolean) => void;
  requestVerification: () => void;
  verificationRequested: boolean;
  clearVerificationRequest: () => void;
}

const VerificationContext = createContext<VerificationContextType>({
  isVerified: false,
  sessionExpired: false,
  setVerified: () => {},
  requestVerification: () => {},
  verificationRequested: false,
  clearVerificationRequest: () => {},
});

export function VerificationProvider({
  children,
  initialVerified = false,
  sessionExpired = false,
}: {
  children: ReactNode;
  initialVerified?: boolean;
  sessionExpired?: boolean;
}) {
  const [isVerified, setVerified] = useState(initialVerified);
  const [verificationRequested, setVerificationRequested] = useState(false);

  const requestVerification = useCallback(() => {
    if (!isVerified) {
      setVerificationRequested(true);
    }
  }, [isVerified]);

  const clearVerificationRequest = useCallback(() => {
    setVerificationRequested(false);
  }, []);

  return (
    <VerificationContext.Provider value={{
      isVerified,
      sessionExpired,
      setVerified,
      requestVerification,
      verificationRequested,
      clearVerificationRequest,
    }}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerificationContext() {
  return useContext(VerificationContext);
}
