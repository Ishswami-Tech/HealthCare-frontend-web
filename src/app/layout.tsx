import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { PerformanceProvider } from "@/components/performance/web-vitals";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Suspense } from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap", // Optimize font loading
  preload: true,
});

export const metadata = {
  title: "Ishswami Healthcare - Your Health, Our Priority",
  description:
    "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
  keywords: [
    "healthcare",
    "medical",
    "appointments",
    "doctors",
    "telemedicine",
    "health records",
  ],
  authors: [{ name: "Ishswami Healthcare" }],
  creator: "Ishswami Healthcare",
  publisher: "Ishswami Healthcare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Ishswami Healthcare - Your Health, Our Priority",
    description:
      "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
    url: "/",
    siteName: "Ishswami Healthcare",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Ishswami Healthcare Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ishswami Healthcare - Your Health, Our Priority",
    description:
      "Experience healthcare like never before. Connect with top doctors, manage appointments, and access your medical records - all in one secure platform.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Performance optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="//accounts.google.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />

        {/* Preload critical resources */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system">
          <PerformanceProvider
            enableWebVitals={true}
            enableResourceTracking={true}
            enableNavigationTracking={true}
          >
            <NextIntlClientProvider messages={messages}>
              <Suspense
                fallback={
                  <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                }
              >
                <AppProvider>{children}</AppProvider>
              </Suspense>
            </NextIntlClientProvider>
          </PerformanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
