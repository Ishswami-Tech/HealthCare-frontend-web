import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer | Dr.Chandrakumar Deshmukh",
  description:
    "Read the medical and legal disclaimer for Dr.Chandrakumar Deshmukh. Understand the limitations of the information provided on our platform.",
  openGraph: {
    title: "Disclaimer | Dr.Chandrakumar Deshmukh",
    description:
      "Medical and legal disclaimer for Dr.Chandrakumar Deshmukh.",
    siteName: "Dr.Chandrakumar Deshmukh",
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
