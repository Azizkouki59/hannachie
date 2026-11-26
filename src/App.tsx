import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import MarktplatzPage from "@/app/marktplatz/page";
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
    name: `${business.name} ${business.tagline}`,
    description: `Hausgeräte-Spezialist in ${business.city} seit ${business.founded}: Persönliche Fachberatung, Original-Ersatzteile nach Typenschild (E-Nr.) & ausgewählte Markengeräte auf Anfrage. Termine nach Vereinbarung.`,
    url: business.url,
    image: `${business.url}/images/werkstatt.jpg`,
    telephone: place.internationalPhoneNumber || "+491703493494",
    email: business.email,
    founder: {
      "@type": "Person",
      name: business.owner,
    },
    foundingDate: String(business.founded),
    areaServed: ["Osnabrück", "Landkreis Osnabrück"],
    knowsAbout: [
      "Elektrohaushaltsgeräte",
      "Original-Ersatzteile nach Typenschild (E-Nr.)",
      "Fachberatung Haushaltsgeräte",
      "Miele",
      "Bosch",
      "Siemens",
      "AEG",
      "Liebherr",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      telephone: place.internationalPhoneNumber || "+491703493494",
      email: business.email,
      availableLanguage: ["German"],
      areaServed: "DE",
    },
    hasMap: place.googleMapsUri || business.mapsUrl,
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.coordinates.lat,
      longitude: place.coordinates.lng,
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: business.street,
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
            address={`${business.street}, ${business.zip} ${business.city}`}
            hours={business.hours}
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
  if (path === "/leistungen" || path === "/geraete") return 1;
  if (path.startsWith("/leistungen/")) return 1.5;
  if (path === "/simulator") return 2;
  if (path === "/anfrage") return 3;
  if (path === "/kundenbewertungen" || path === "/bewertungen") return 4;
  if (path === "/ueber-uns") return 5;
  if (path === "/kontakt") return 6;
  if (path === "/impressum") return 7;
  if (path === "/datenschutz") return 8;
  if (path === "/admin") return 8.5;
  return 9;
}

const antigravityEase = [0.22, 1, 0.36, 1] as const;

const pageSlideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? 18 : -18,
    y: 12,
    scale: 0.992,
    opacity: 0,
  }),
  center: {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    transitionEnd: {
      transform: "none",
    },
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? -12 : 12,
    y: -8,
    scale: 0.994,
    opacity: 0,
  }),
};

function RouteTransferRibbon({ routeKey }: { routeKey: string }) {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;
  return (
    <motion.div
      key={`transfer-ribbon-${routeKey}`}
      aria-hidden="true"
      initial={{ scaleX: 0, opacity: 0.95, transformOrigin: "0% 50%" }}
      animate={{ scaleX: 1, opacity: [0.95, 0.85, 0] }}
      transition={{
        scaleX: { duration: 0.42, ease: antigravityEase },
        opacity: { duration: 0.58, times: [0, 0.62, 1], ease: "easeOut" },
      }}
      className="pointer-events-none fixed top-0 inset-x-0 z-[70] h-[2.5px] bg-gradient-to-r from-sky-400 via-cyan-200 to-sky-500 shadow-[0_0_14px_rgba(56,189,248,0.85)]"
    />
  );
}

export default function App() {
  const { pathname, search, hash } = useLocationState();
  const prefersReducedMotion = useReducedMotion();
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
    if (!hash) return undefined;
    const id = hash.slice(1);
    let attempts = 0;
    let timerId = 0;
    const tryScroll = () => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
      attempts += 1;
      if (attempts < 10) {
        timerId = window.setTimeout(tryScroll, 80);
      }
    };
    timerId = window.setTimeout(tryScroll, 180);
    return () => window.clearTimeout(timerId);
  }, [pathname, hash]);

  const searchParamsObj = Object.fromEntries(new URLSearchParams(search).entries());

  const renderRoute = () => {
    try {
      if (cleanPath === "/") return <Home />;
      if (cleanPath === "/marktplatz" || cleanPath === "/angebote") return <MarktplatzPage />;
      if (cleanPath === "/leistungen" || cleanPath === "/geraete") return <LeistungenPage />;
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
      if (cleanPath === "/kundenbewertungen" || cleanPath === "/bewertungen") return <Kundenbewertungen />;
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
              {!isAdminRoute && <RouteTransferRibbon routeKey={cleanPath} />}
              <div className="relative flex min-h-screen flex-col">
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
                  <AnimatePresence
                    mode="wait"
                    custom={direction}
                    initial={false}
                    onExitComplete={() => {
                      if (!hash) {
                        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
                      }
                    }}
                  >
                    <motion.div
                      key={cleanPath}
                      custom={direction}
                      variants={prefersReducedMotion ? undefined : pageSlideVariants}
                      initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
                      animate={prefersReducedMotion ? { opacity: 1 } : "center"}
                      exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.08 }
                          : {
                              duration: 0.34,
                              ease: antigravityEase,
                            }
                      }
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
            </div>
          </QuickRequestProvider>
        </ThemeProvider>
      </ConsentProvider>
    </GoogleLivePlaceProvider>
  );
}
