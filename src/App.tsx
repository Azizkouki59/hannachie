import { Suspense, lazy, useEffect } from "react";
import { business } from "@/data/site";
import { syncDocumentSeo } from "@/lib/seo";
import { useLocationState } from "@/shims/next-navigation";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Footer, Header, MobileActionBar } from "@/site/Chrome";
import HomePage from "@/site/pages/Home";
import SortimentPage, { SortimentDetailPage } from "@/site/pages/Sortiment";
import { AboutPage, ContactPage, NotFoundPage, ReviewsPage } from "@/site/pages/Other";
import { services } from "@/data/site";
import { DatenschutzPage, ImpressumPage } from "@/site/pages/Legal";

// The admin console is large and only used by the owner – load it on demand.
const AdminApp = lazy(() => import("@/site/AdminApp"));

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Store",
  name: "Hannachi – Hausgeräte & Ersatzteile",
  description: `Ersatzteile für Hausgeräte, geprüfte Markengeräte und persönliche Beratung in ${business.city} seit ${business.founded}.`,
  url: business.url,
  image: `${business.url}/images/site/inhaber.jpg`,
  telephone: "+491703493494",
  email: business.email,
  founder: { "@type": "Person", name: business.owner },
  foundingDate: String(business.founded),
  areaServed: ["Osnabrück", "Landkreis Osnabrück"],
  address: {
    "@type": "PostalAddress",
    streetAddress: business.street,
    postalCode: business.zip,
    addressLocality: business.city,
    addressCountry: "DE",
  },
  geo: { "@type": "GeoCoordinates", latitude: business.coordinates.lat, longitude: business.coordinates.lng },
  hasMap: business.mapsUrl,
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "08:00",
      closes: "18:00",
    },
  ],
};

function renderPublicRoute(path: string, search: Record<string, string>) {
  if (path === "/") return <HomePage />;
  if (path === "/leistungen" || path === "/geraete" || path === "/marktplatz" || path === "/angebote") {
    return <SortimentPage />;
  }
  if (path.startsWith("/leistungen/")) {
    const slug = decodeURIComponent(path.slice("/leistungen/".length));
    return services.some((s) => s.slug === slug) ? <SortimentDetailPage slug={slug} /> : <NotFoundPage />;
  }
  if (path === "/ueber-uns") return <AboutPage />;
  if (path === "/kundenbewertungen" || path === "/bewertungen") return <ReviewsPage />;
  if (path === "/kontakt" || path === "/anfrage") return <ContactPage searchParams={search} />;
  if (path === "/impressum") return <ImpressumPage />;
  if (path === "/datenschutz") return <DatenschutzPage />;
  if (path === "/simulator") return <HomePage />;
  return <NotFoundPage />;
}

export default function App() {
  const { pathname, search, hash } = useLocationState();
  const cleanPath = pathname.length > 1 && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  const isAdminRoute = cleanPath === "/admin";

  useEffect(() => {
    syncDocumentSeo(cleanPath);
  }, [cleanPath]);

  // Public pages are always rendered in the light theme.
  useEffect(() => {
    if (!isAdminRoute) {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
  }, [isAdminRoute]);

  // Scroll to top (or to the anchor) on navigation.
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [cleanPath, hash]);

  if (isAdminRoute) {
    return (
      <Suspense fallback={<div className="p-10 text-center text-ink-soft">Lädt …</div>}>
        <AdminApp />
      </Suspense>
    );
  }

  const searchParams = Object.fromEntries(new URLSearchParams(search).entries());

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-ink antialiased">
      <Header pathname={cleanPath} />
      <main id="inhalt" className="flex-1">
        <ErrorBoundary resetKey={cleanPath}>{renderPublicRoute(cleanPath, searchParams)}</ErrorBoundary>
      </main>
      <div className="pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0 bg-ink">
        <Footer />
      </div>
      <MobileActionBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
