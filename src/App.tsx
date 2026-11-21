import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ServiceNoticeBanner from "@/components/ServiceNoticeBanner";
import Footer from "@/components/Footer";
import { QuickRequestProvider } from "@/components/QuickRequestSheet";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ConsentProvider } from "@/lib/consent";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import MobileBottomDock from "@/components/MobileBottomDock";
import SideContactWidget from "@/components/SideContactWidget";
import ErrorBoundary from "@/components/ErrorBoundary";
import { business, services } from "@/data/site";
import {
  GoogleLivePlaceProvider,
  useGoogleLivePlace,
} from "@/lib/googlePlaceLive";
import { syncDocumentSeo } from "@/lib/seo";
import { useLocationState } from "@/shims/next-navigation";
import { CardScrollRevealObserver } from "@/components/animations";

import Home from "@/app/page";
import LeistungenPage from "@/app/leistungen/page";
import ServicePage from "@/app/leistungen/[slug]/page";
import AnfragePage from "@/app/anfrage/page";
import UeberUns from "@/app/ueber-uns/page";
import Kundenbewertungen from "@/app/kundenbewertungen/page";
import Kontakt from "@/app/kontakt/page";
import Impressum from "@/app/impressum/page";
import Datenschutz from "@/app/datenschutz/page";
import AdminPage from "@/app/admin/page";
import NotFound from "@/app/not-found";

function LiveBusinessJsonLd() {
  const { place } = useGoogleLivePlace();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.displayName || "Hannachi Elektrohaushaltsgeräte & Ersatzteile",
    url: business.url,
    image: `${business.url}/images/werkstatt.jpg`,
    telephone: place.internationalPhoneNumber || "+491703493494",
    foundingDate: String(business.founded),
    areaServed: ["Osnabrück", "Landkreis Osnabrück"],
    openingHours: "Mo-Sa 08:00-18:00",
    hasMap: place.googleMapsUri || business.mapsUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.coordinates.lat,
      longitude: place.coordinates.lng,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: place.streetLine || business.street,
      postalCode: business.zip,
      addressLocality: business.city,
      addressCountry: "DE",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: place.rating.toFixed(1),
      reviewCount: String(place.userRatingCount),
      bestRating: "5",
      worstRating: "1",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function AppLiveWidgets({ isAdminRoute }: { isAdminRoute: boolean }) {
  const { place } = useGoogleLivePlace();
  return (
    <>
      {!isAdminRoute && (
        <>
          <MobileBottomDock
            phoneHref={place.phoneHref}
            whatsappHref={business.whatsappHref}
          />
          <SideContactWidget
            phone={place.phoneDisplay}
            phoneHref={place.phoneHref}
            whatsappHref={business.whatsappHref}
            mapsUrl={place.googleMapsUri}
            address={place.shortFormattedAddress}
            hours={place.hoursSummary}
            serviceNotice={business.serviceNotice}
          />
        </>
      )}
      <LiveBusinessJsonLd />
    </>
  );
}

function getRouteOrder(path: string): number {
  if (path === "/") return 0;
  if (path === "/marktplatz" || path === "/angebote") return 0.5;
  if (path === "/leistungen") return 1;
  if (path.startsWith("/leistungen/")) return 1.5;
  if (path === "/simulator") return 2;
  if (path === "/anfrage") return 3;
  if (path === "/kundenbewertungen") return 4;
  if (path === "/ueber-uns") return 5;
  if (path === "/kontakt") return 6;
  if (path === "/impressum") return 7;
  if (path === "/datenschutz") return 8;
  if (path === "/admin") return 8.5;
  return 9;
}

const pageSlideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? "10%" : "-10%",
    opacity: 0,
    scale: 0.995,
  }),
  center: {
    x: "0%",
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? "-6%" : "6%",
    opacity: 0,
    scale: 0.995,
  }),
};

export default function App() {
  const { pathname, search, hash } = useLocationState();
  const cleanPath =
    pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const isAdminRoute = cleanPath === "/admin";

  // Track previous route order cleanly via ref without render-phase state mutations
  const prevPathRef = useRef<string>(cleanPath);
  const directionRef = useRef<number>(1);
  if (prevPathRef.current !== cleanPath) {
    const prevOrder = getRouteOrder(prevPathRef.current);
    const nextOrder = getRouteOrder(cleanPath);
    directionRef.current = nextOrder >= prevOrder ? 1 : -1;
    prevPathRef.current = cleanPath;
  }
  const direction = directionRef.current;

  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  useEffect(() => {
    syncDocumentSeo(cleanPath);
  }, [cleanPath]);

  useEffect(() => {
    const onQuotaExceeded = () => setMapsQuotaExceeded(true);
    window.addEventListener("gmp-quota-exceeded", onQuotaExceeded);
    return () => window.removeEventListener("gmp-quota-exceeded", onQuotaExceeded);
  }, []);

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 60);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [pathname, hash]);

  const searchParamsObj = Object.fromEntries(new URLSearchParams(search).entries());

  const renderRoute = () => {
    try {
      if (cleanPath === "/") return <Home />;
      if (cleanPath === "/marktplatz" || cleanPath === "/angebote") return <Home />;
      if (cleanPath === "/leistungen") return <LeistungenPage />;
      if (cleanPath.startsWith("/leistungen/")) {
        const slug = decodeURIComponent(cleanPath.slice("/leistungen/".length));
        if (!services.some((s) => s.slug === slug)) {
          return <NotFound />;
        }
        return <ServicePage params={{ slug }} />;
      }
      if (cleanPath === "/simulator") return <Home />;
      if (cleanPath === "/anfrage") return <AnfragePage searchParams={searchParamsObj} />;
      if (cleanPath === "/ueber-uns") return <UeberUns />;
      if (cleanPath === "/kundenbewertungen") return <Kundenbewertungen />;
      if (cleanPath === "/kontakt") return <Kontakt searchParams={searchParamsObj} />;
      if (cleanPath === "/impressum") return <Impressum />;
      if (cleanPath === "/datenschutz") return <Datenschutz />;
      if (cleanPath === "/admin") return <AdminPage />;
      return <NotFound />;
    } catch {
      return <NotFound />;
    }
  };

  return (
    <GoogleLivePlaceProvider>
      <ConsentProvider>
        <ThemeProvider>
          <QuickRequestProvider>
            <div className="min-h-screen flex flex-col font-sans bg-surface text-primary dark:bg-slate-950 dark:text-slate-100 antialiased transition-colors duration-200">
              <a
                href="#main"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-white"
              >
                Zum Inhalt springen
              </a>
              {mapsQuotaExceeded && (
                <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
                  <span>
                    Google Maps Platform quota reached. If you are the app owner, visit{" "}
                    <a
                      href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-semibold text-amber-950 hover:text-amber-800"
                    >
                      maps developer site
                    </a>{" "}
                    for instructions to update your account.
                  </span>
                </div>
              )}
              {!isAdminRoute && <ServiceNoticeBanner notice={business.serviceNotice} />}
              {!isAdminRoute && <Navbar />}
              <main id="main" className="flex-1 overflow-x-hidden relative">
                <ErrorBoundary resetKey={cleanPath}>
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    <motion.div
                      key={cleanPath}
                      custom={direction}
                      variants={pageSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 340, damping: 34, mass: 0.85 },
                        opacity: { duration: 0.18, ease: "easeOut" },
                        scale: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
                      }}
                      className="will-change-transform"
                    >
                      {renderRoute()}
                    </motion.div>
                  </AnimatePresence>
                </ErrorBoundary>
              </main>
              {!isAdminRoute && <Footer />}
              <AppLiveWidgets isAdminRoute={isAdminRoute} />
              <CookieConsentBanner />
              <CardScrollRevealObserver routeKey={cleanPath} />
            </div>
          </QuickRequestProvider>
        </ThemeProvider>
      </ConsentProvider>
    </GoogleLivePlaceProvider>
  );
}
