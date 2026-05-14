import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Dr.Chandrakumar Deshmukh",
  description:
    "Read the terms and conditions governing your use of Dr.Chandrakumar Deshmukh, including patient, doctor, and clinic obligations.",
  openGraph: {
    title: "Terms of Service | Dr.Chandrakumar Deshmukh",
    description:
      "Terms and conditions for using Dr.Chandrakumar Deshmukh.",
    siteName: "Dr.Chandrakumar Deshmukh",
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
