import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Viddhakarma",
  description:
    "Learn how Viddhakarma collects, uses, and protects your personal health information in compliance with HIPAA and Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | Viddhakarma",
    description:
      "How Viddhakarma handles and protects your personal health data.",
    siteName: "Viddhakarma",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
