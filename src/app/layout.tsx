import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang={locale}>
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <AppProvider>{children}</AppProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
