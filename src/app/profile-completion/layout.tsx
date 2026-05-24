import type { Metadata } from "next";
import { ProfileCompletionHeader } from "@/components/profile-completion/ProfileCompletionHeader";

export const metadata: Metadata = {
  title: "Complete Your Profile | Dr.Chandrakumar Deshmukh",
  description: "Complete your profile to get started with Dr.Chandrakumar Deshmukh.",
  robots: { index: false, follow: false },
};

export default function ProfileCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <ProfileCompletionHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        {children}
      </div>
    </div>
  );
}