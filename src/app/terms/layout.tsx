import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Ishswami Healthcare",
  description:
    "Read the terms and conditions governing your use of the Ishswami Healthcare platform, including patient, doctor, and clinic obligations.",
  openGraph: {
    title: "Terms of Service | Ishswami Healthcare",
    description:
      "Terms and conditions for using the Ishswami Healthcare platform.",
    siteName: "Ishswami Healthcare",
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
