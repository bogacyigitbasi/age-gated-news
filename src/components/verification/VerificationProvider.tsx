"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface VerificationContextType {
  isVerified: boolean;
  setVerified: (v: boolean) => void;
}

const VerificationContext = createContext<VerificationContextType>({
  isVerified: false,
  setVerified: () => {},
});

export function VerificationProvider({
  children,
  initialVerified = false,
}: {
  children: ReactNode;
  initialVerified?: boolean;
}) {
  const [isVerified, setVerified] = useState(initialVerified);

  return (
    <VerificationContext.Provider value={{ isVerified, setVerified }}>
      {children}
    </VerificationContext.Provider>
  );
}

export function useVerificationContext() {
  return useContext(VerificationContext);
}
