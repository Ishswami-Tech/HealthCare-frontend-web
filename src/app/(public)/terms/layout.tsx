import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Shree Vishwamruti Ayurvedic Chikitsalya",
  description:
    "Read the terms and conditions governing your use of Shree Vishwamruti Ayurvedic Chikitsalya, including patient, doctor, and clinic obligations.",
  openGraph: {
    title: "Terms of Service | Shree Vishwamruti Ayurvedic Chikitsalya",
    description:
      "Terms and conditions for using Shree Vishwamruti Ayurvedic Chikitsalya.",
    siteName: "Shree Vishwamruti Ayurvedic Chikitsalya",
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
