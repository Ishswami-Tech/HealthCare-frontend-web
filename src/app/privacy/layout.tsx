import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Ishswami Healthcare",
  description:
    "Learn how Ishswami Healthcare collects, uses, and protects your personal health information in compliance with HIPAA and Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | Ishswami Healthcare",
    description:
      "How Ishswami Healthcare handles and protects your personal health data.",
    siteName: "Ishswami Healthcare",
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
