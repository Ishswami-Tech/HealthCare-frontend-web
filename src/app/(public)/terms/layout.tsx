import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Viddhakarma",
  description:
    "Read the terms and conditions governing your use of the Viddhakarma platform, including patient, doctor, and clinic obligations.",
  openGraph: {
    title: "Terms of Service | Viddhakarma",
    description:
      "Terms and conditions for using the Viddhakarma platform.",
    siteName: "Viddhakarma",
  },
  robots: { index: true, follow: true },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
