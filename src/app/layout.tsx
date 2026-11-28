import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { business } from "@/data/site";
import { BASE_KEYWORDS } from "@/lib/seo";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(business.url),
  title: { default: "Hannachi Hausgeräte & Ersatzteile | Osnabrück seit 1990", template: "%s | Hannachi Osnabrück" },
  description: "Unabhängiger Fachhandel in Osnabrück seit 1990: persönliche Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage.",
  keywords: BASE_KEYWORDS,
  alternates: { canonical: `${business.url}/` },
  openGraph: {
    type: "website",
    locale: "de_DE",
    url: `${business.url}/`,
    siteName: "Hannachi Elektrohaushaltsgeräte & Ersatzteile",
    title: "Hannachi Hausgeräte & Ersatzteile | Osnabrück seit 1990",
    description: "Unabhängiger Fachhandel in Osnabrück seit 1990: persönliche Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hannachi Hausgeräte & Ersatzteile | Osnabrück seit 1990",
    description: "Unabhängiger Fachhandel in Osnabrück seit 1990: persönliche Fachberatung, Original-Ersatzteile nach Typenschild und ausgewählte Markengeräte auf Anfrage.",
  },
};
export const viewport: Viewport = { themeColor: "#0F172A" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "HomeGoodsStore"],
  name: `${business.name} ${business.tagline}`,
  url: business.url,
  telephone: "+491703493494",
  foundingDate: String(business.founded),
  hasMap: business.mapsUrl,
  geo: {
    "@type": "GeoCoordinates",
    latitude: business.coordinates.lat,
    longitude: business.coordinates.lng,
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
    ratingValue: "4.8",
    reviewCount: "82",
    bestRating: "5",
    worstRating: "1",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className={jakarta.variable}>
      <body className="font-sans">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-white">Zum Inhalt springen</a>
        <Navbar />
        <main id="main">{children}</main>
        <Footer />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
