import type { Metadata } from "next";
import "./globals.css";
import { CREATOR_NAME, CREATOR_URL, SITE_NAME, SITE_URL } from "./lib/seo";

const description =
  "Analyse CSV and Excel data online with automated data quality checks, ranked insights, visual discovery, comparisons, forecasting, scenario analysis and statistical tools.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Free CSV & Excel Data Analysis Tool | Azhan Data Studio",
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
    title: "Free CSV & Excel Data Analysis Tool | Azhan Data Studio",
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
    title: "Free CSV & Excel Data Analysis Tool | Azhan Data Studio",
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
      url: SITE_URL,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Data Analytics",
      operatingSystem: "Web",
      browserRequirements: "Requires a modern web browser",
      description,
      softwareVersion: "3.6",
      isAccessibleForFree: true,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "AUD",
      },
      creator: { "@id": `${SITE_URL}/#creator` },
      featureList: ["CSV and Excel analysis", "Data quality checks", "Dataset comparison", "Forecasting", "Scenario analysis", "Statistical analysis", "Data cleaning"],
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
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
