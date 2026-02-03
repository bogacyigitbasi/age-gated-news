import { getSession, getSessionVersion } from "@/lib/session";
import { fetchNews } from "@/lib/news-service";
import { VerificationProvider } from "@/components/verification/VerificationProvider";
import { Header } from "@/components/layout/Header";
import { NewsGrid } from "@/components/news/NewsGrid";
import { AgeGateOverlay } from "@/components/verification/AgeGateOverlay";
import { Footer } from "@/components/layout/Footer";

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const session = await getSession();
  const currentVersion = getSessionVersion();

  // Check if session is verified AND not expired (24 hours) AND matches current version
  const verifiedAt = session.verifiedAt ?? 0;
  const isExpired = Date.now() - verifiedAt > TWENTY_FOUR_HOURS_MS;
  const isVersionValid = (session.sessionVersion ?? 0) === currentVersion;
  const isVerified = session.isVerified === true && !isExpired && isVersionValid;

  // Fetch initial news (general category) server-side
  const articles = await fetchNews("general");

  return (
    <VerificationProvider initialVerified={isVerified} sessionExpired={isExpired && session.isVerified === true}>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Header />
        <main className="relative flex-1">
          <NewsGrid initialArticles={articles} />
          {!isVerified && <AgeGateOverlay />}
        </main>
        <Footer />
      </div>
    </VerificationProvider>
  );
}
