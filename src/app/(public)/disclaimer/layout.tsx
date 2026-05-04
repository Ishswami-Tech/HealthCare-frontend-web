import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Shree Vishwamruti Ayurvedic Chikitsalya",
  description:
    "Read the medical and legal disclaimer for Shree Vishwamruti Ayurvedic Chikitsalya. Understand the limitations of the information provided on our platform.",
  openGraph: {
    title: "Disclaimer | Shree Vishwamruti Ayurvedic Chikitsalya",
    description:
      "Medical and legal disclaimer for Shree Vishwamruti Ayurvedic Chikitsalya.",
    siteName: "Shree Vishwamruti Ayurvedic Chikitsalya",
  },
  robots: { index: true, follow: true },
};

export default function DisclaimerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
