"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import ProfileCompletionForm from "@/components/global/forms/ProfileCompletionForm";
import { getProfileCompletionRedirectUrl } from "@/lib/utils/profile-completion";
import { Role } from "@/types/auth.types";

export default function ProfileCompletionPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      // Check if user is authenticated
      if (!session?.user) {
        router.push("/auth/login");
        return;
      }

      // Check if profile is already complete
      if (session.user.profileComplete) {
        // Use centralized redirect logic
        const userRole = session.user.role as Role;
        const dashboardPath = getProfileCompletionRedirectUrl(userRole);
        router.push(dashboardPath);
        return;
      }

      setIsChecking(false);
    }
  }, [session, isLoading, router]);

  // Show loading state while checking
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading profile completion...</p>
        </div>
      </div>
    );
  }

  return <ProfileCompletionForm />;
}
