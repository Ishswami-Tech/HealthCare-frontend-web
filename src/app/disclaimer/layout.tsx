import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Ishswami Healthcare",
  description:
    "Read the medical and legal disclaimer for Ishswami Healthcare. Understand the limitations of the information provided on our platform.",
  openGraph: {
    title: "Disclaimer | Ishswami Healthcare",
    description:
      "Medical and legal disclaimer for the Ishswami Healthcare platform.",
    siteName: "Ishswami Healthcare",
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
