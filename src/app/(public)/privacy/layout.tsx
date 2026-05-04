import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Shree Vishwamruti Ayurvedic Chikitsalya",
  description:
    "Learn how Shree Vishwamruti Ayurvedic Chikitsalya collects, uses, and protects your personal health information in compliance with HIPAA and Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | Shree Vishwamruti Ayurvedic Chikitsalya",
    description:
      "How Shree Vishwamruti Ayurvedic Chikitsalya handles and protects your personal health data.",
    siteName: "Shree Vishwamruti Ayurvedic Chikitsalya",
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
