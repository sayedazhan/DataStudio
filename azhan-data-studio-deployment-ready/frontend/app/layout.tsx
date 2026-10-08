import type { Metadata } from "next";
import "./globals.css";
import { CREATOR_NAME, CREATOR_URL, SITE_NAME, SITE_URL } from "./lib/seo";
import GoogleAnalytics from "./components/google-analytics";

const description =
  "Turn Excel and CSV files into decision-ready intelligence with automatic analysis, data quality checks, dashboards, comparisons, forecasting, statistics and professional reports.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Azhan Data Studio | Excel & CSV Analytics, Dashboards and Reports",
    template: "%s | Azhan Data Studio",
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: CREATOR_NAME, url: CREATOR_URL }],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
  category: "data analytics",
  keywords: [
    "data analysis tool",
    "CSV analysis",
    "Excel analysis",
    "data quality checker",
    "data cleaning",
    "data insights",
    "data visualization",
    "Excel dashboard generator",
    "CSV dashboard generator",
    "interactive dashboard",
    "forecasting tool",
    "scenario analysis",
    "statistical analysis",
  ],
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Azhan Data Studio | Excel & CSV Analytics, Dashboards and Reports",
    description,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Azhan Data Studio — Automated Data Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Azhan Data Studio | Excel & CSV Analytics, Dashboards and Reports",
    description,
    images: ["/opengraph-image"],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description,
      inLanguage: "en-AU",
      creator: { "@id": `${SITE_URL}/#creator` },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: SITE_NAME,
      url: `${SITE_URL}/studio`,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Data Analytics",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern web browser",
      description,
      softwareVersion: "5.2.0",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "AUD",
      },
      creator: { "@id": `${SITE_URL}/#creator` },
      provider: { "@id": `${SITE_URL}/#organization` },
      featureList: ["CSV and Excel analysis", "Automatic interactive dashboard generation", "Dashboard filtering and customisation", "Data quality checks", "Dataset comparison", "Forecasting", "Scenario analysis", "Statistical analysis", "Data cleaning"],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      founder: { "@id": `${SITE_URL}/#creator` },
      sameAs: [CREATOR_URL, "https://www.linkedin.com/in/azhan-hassan-18206114/"],
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#creator`,
      name: CREATOR_NAME,
      url: CREATOR_URL,
      jobTitle: "Data & AI Automation Specialist",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-AU" suppressHydrationWarning>
      <body>
        <GoogleAnalytics />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
