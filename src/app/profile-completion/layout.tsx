import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Your Profile | Viddhakarma",
  description: "Complete your profile to get started with Viddhakarma.",
  robots: { index: false, follow: false },
};

export default function ProfileCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
