import { Suspense, lazy, useEffect, useRef, useState } from "react";
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
import { UserPlaceProvider } from "@/lib/userPlace";
import {
  getRouteBreadcrumbs,
  getRouteSeo,
  HOMEPAGE_FAQ_ITEMS,
  syncDocumentSeo,
} from "@/lib/seo";
import { useLocationState } from "@/shims/next-navigation";
import { CardScrollRevealObserver } from "@/components/animations";

import Home from "@/app/page";
const MarktplatzPage = lazy(() => import("@/app/marktplatz/page"));
const LeistungenPage = lazy(() => import("@/app/leistungen/page"));
const ServicePage = lazy(() => import("@/app/leistungen/[slug]/page"));
const AnfragePage = lazy(() => import("@/app/anfrage/page"));
const UeberUns = lazy(() => import("@/app/ueber-uns/page"));
const Kundenbewertungen = lazy(() => import("@/app/kundenbewertungen/page"));
const Kontakt = lazy(() => import("@/app/kontakt/page"));
const Impressum = lazy(() => import("@/app/impressum/page"));
const Datenschutz = lazy(() => import("@/app/datenschutz/page"));
const AdminPage = lazy(() => import("@/app/admin/page"));
import NotFound from "@/app/not-found";

function LiveBusinessJsonLd({ cleanPath }: { cleanPath: string }) {
  const { place } = useGoogleLivePlace();
  const routeSeo = getRouteSeo(cleanPath);
  const breadcrumbs = getRouteBreadcrumbs(cleanPath);
  const baseUrl = business.url;
  const businessId = `${baseUrl}/#business`;
  const websiteId = `${baseUrl}/#website`;
  const webpageId = `${routeSeo.canonicalUrl}#webpage`;

  const graph: Record<string, unknown>[] = [
    {
      "@type": ["LocalBusiness", "HomeGoodsStore"],
      "@id": businessId,
      name: `${business.name} ${business.tagline}`,
      alternateName: "Hannachi Osnabrück",
      description: `Unabhängiger Fachhandel für Elektrohaushaltsgeräte in ${business.city} seit ${business.founded}: persönliche Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage nach Terminvereinbarung.`,
      url: baseUrl,
      logo: `${baseUrl}/favicon.svg`,
      image: `${baseUrl}/images/herr-hannachi.jpg`,
      telephone: place.internationalPhoneNumber || "+491703493494",
      email: business.email,
      priceRange: "€€",
      sameAs: [business.facebookUrl, place.googleMapsUri || business.mapsUrl],
      founder: {
        "@type": "Person",
        name: business.owner,
      },
      foundingDate: String(business.founded),
      areaServed: [
        { "@type": "City", name: "Osnabrück" },
        { "@type": "AdministrativeArea", name: "Landkreis Osnabrück" },
        { "@type": "City", name: "Georgsmarienhütte" },
        { "@type": "City", name: "Wallenhorst" },
        { "@type": "City", name: "Belm" },
        { "@type": "City", name: "Hasbergen" },
        { "@type": "City", name: "Bissendorf" },
        { "@type": "City", name: "Melle" },
      ],
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ],
          opens: "08:00",
          closes: "18:00",
        },
      ],
      knowsAbout: [
        "Elektrohaushaltsgeräte",
        "Original-Ersatzteile nach Typenschild",
        "Fachberatung Haushaltsgeräte",
        "Waschmaschinen",
        "Geschirrspüler",
        "Kühlschränke",
        "Backöfen und Herde",
        "Miele",
        "Bosch",
        "Siemens",
        "AEG",
        "Liebherr",
        "Bauknecht",
        "Neff",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Fachberatung, Original-Ersatzteile & Markengeräte",
        itemListElement: [
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Service",
              name: "Persönliche Hausgeräte-Fachberatung",
              description:
                "Unabhängige Beratung vom Inhaber Kamal Hannachi zu Waschmaschinen, Geschirrspülern, Kühlgeräten und Herden in Osnabrück.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Original- und Qualitäts-Ersatzteile nach Typenschild",
              description:
                "Passgenaue Ersatzteile wie Laugenpumpen, Türdichtungen, Heizelemente, Stoßdämpfer und Filter für alle bekannten Marken.",
            },
          },
          {
            "@type": "Offer",
            itemOffered: {
              "@type": "Product",
              name: "Ausgewählte geprüfte Markengeräte auf Anfrage",
              description:
                "Individuell verfügbare Markengeräte inklusive persönlicher Empfehlung und schriftlicher Verkäufergarantie.",
            },
          },
        ],
      },
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
        addressRegion: "Niedersachsen",
        addressCountry: "DE",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: place.rating.toFixed(1),
        reviewCount: String(place.userRatingCount),
        bestRating: "5",
        worstRating: "1",
      },
    },
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: baseUrl,
      name: `${business.name} ${business.tagline}`,
      inLanguage: "de-DE",
      publisher: { "@id": businessId },
    },
    {
      "@type": "WebPage",
      "@id": webpageId,
      url: routeSeo.canonicalUrl,
      name: routeSeo.title,
      description: routeSeo.description,
      inLanguage: "de-DE",
      isPartOf: { "@id": websiteId },
      about: { "@id": businessId },
    },
  ];

  if (breadcrumbs.length > 1) {
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${routeSeo.canonicalUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: crumb.name,
        item: `${baseUrl}${crumb.path === "/" ? "/" : crumb.path}`,
      })),
    });
  }

  if (cleanPath === "/") {
    graph.push({
      "@type": "FAQPage",
      "@id": `${baseUrl}/#faq`,
      mainEntity: HOMEPAGE_FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function AppLiveWidgets({
  isAdminRoute,
  cleanPath,
}: {
  isAdminRoute: boolean;
  cleanPath: string;
}) {
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
      {!isAdminRoute && <LiveBusinessJsonLd cleanPath={cleanPath} />}
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
  enter: {
    y: 6,
    opacity: 0,
  },
  center: {
    y: 0,
    opacity: 1,
    transitionEnd: {
      transform: "none",
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.08, ease: "easeIn" as const },
  },
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

  // Gently warm up secondary pages when idle on non-metered connections.
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (conn?.saveData) return undefined;
    const preload = () => {
      void import("@/app/leistungen/page");
      void import("@/app/kontakt/page");
      void import("@/app/anfrage/page");
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preload, { timeout: 5000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = window.setTimeout(preload, 3500);
    return () => window.clearTimeout(t);
  }, []);

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
      <UserPlaceProvider>
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
                      variants={prefersReducedMotion ? undefined : pageSlideVariants}
                      initial={prefersReducedMotion ? { opacity: 0 } : "enter"}
                      animate={prefersReducedMotion ? { opacity: 1 } : "center"}
                      exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0.06 }
                          : {
                              duration: 0.16,
                              ease: antigravityEase,
                            }
                      }
                    >
                      <Suspense fallback={<div className="min-h-[70vh]" aria-busy="true" />}>
                        {renderRoute()}
                      </Suspense>
                    </motion.div>
                  </AnimatePresence>
                </ErrorBoundary>
              </main>
              {!isAdminRoute && <Footer />}
              <AppLiveWidgets isAdminRoute={isAdminRoute} cleanPath={cleanPath} />
              <CookieConsentBanner />
              <CardScrollRevealObserver routeKey={cleanPath} />
              </div>
            </div>
          </QuickRequestProvider>
        </ThemeProvider>
      </ConsentProvider>
      </UserPlaceProvider>
    </GoogleLivePlaceProvider>
  );
}
