import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile | Shree Vishwamruti Ayurvedic Chikitsalya",
  description: "Complete your profile to get started with Shree Vishwamruti Ayurvedic Chikitsalya.",
  robots: { index: false, follow: false },
};

export default function ProfileCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-base-200">
      {children}
    </div>
  );
}
