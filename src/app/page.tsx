import { getSession } from "@/lib/session";
import { fetchNews } from "@/lib/news-service";
import { VerificationProvider } from "@/components/verification/VerificationProvider";
import { Header } from "@/components/layout/Header";
import { NewsGrid } from "@/components/news/NewsGrid";
import { AgeGateOverlay } from "@/components/verification/AgeGateOverlay";
import { Footer } from "@/components/layout/Footer";

export default async function HomePage() {
  const session = await getSession();
  const isVerified = session.isVerified === true;

  // Fetch initial news (general category) server-side
  const articles = await fetchNews("general");

  return (
    <VerificationProvider initialVerified={isVerified}>
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
