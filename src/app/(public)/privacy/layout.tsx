import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Dr.Chandrakumar Deshmukh",
  description:
    "Learn how Dr.Chandrakumar Deshmukh collects, uses, and protects your personal health information in compliance with HIPAA and Indian data protection laws.",
  openGraph: {
    title: "Privacy Policy | Dr.Chandrakumar Deshmukh",
    description:
      "How Dr.Chandrakumar Deshmukh handles and protects your personal health data.",
    siteName: "Dr.Chandrakumar Deshmukh",
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
