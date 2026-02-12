import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@concordium/verification-web-ui/styles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NewsGate - Age-Verified News",
  description:
    "Access age-restricted news content using Concordium ID zero-knowledge proofs. No personal data shared.",
  openGraph: {
    title: "NewsGate - Age-Verified News",
    description:
      "Privacy-preserving age verification for news access powered by Concordium.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
