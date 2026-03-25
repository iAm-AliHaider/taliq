import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Taliq — تَلِيق — Voice-First HR",
  description: "Your eloquent HR voice assistant. Leave requests, interviews, team management — just talk.",
  manifest: "/manifest.json",
  openGraph: {
    title: "Taliq — تَلِيق — Voice-First HR",
    description: "Your eloquent HR voice assistant. Leave requests, interviews, team management — just talk.",
    url: "https://taliq.middlemind.ai",
    siteName: "Taliq",
    type: "website",
    locale: "en",
    images: [
      {
        url: "https://taliq.middlemind.ai/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Taliq Voice-First HR Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@MiddleMindAI",
    creator: "@MiddleMindAI",
  },
  alternates: {
    canonical: "https://taliq.middlemind.ai",
  },
};

export const viewport: Viewport = {
  themeColor: "#10B981",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Taliq",
    description: "Voice-first HR platform for managing leave requests, interviews, and team management.",
    url: "https://taliq.middlemind.ai",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    provider: {
      "@type": "Organization",
      name: "MiddleMind",
      url: "https://middlemind.ai",
    },
  };

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FAFBFC] text-gray-900 antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
