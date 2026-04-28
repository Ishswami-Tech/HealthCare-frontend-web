import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Viddhakarma",
  description:
    "Read the medical and legal disclaimer for Viddhakarma. Understand the limitations of the information provided on our platform.",
  openGraph: {
    title: "Disclaimer | Viddhakarma",
    description:
      "Medical and legal disclaimer for the Viddhakarma platform.",
    siteName: "Viddhakarma",
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
