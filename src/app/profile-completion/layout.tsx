import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";

export const metadata: Metadata = {
  title: "Complete Your Profile | Dr.Chandrakumar Deshmukh",
  description: "Complete your profile to get started with Dr.Chandrakumar Deshmukh.",
  robots: { index: false, follow: false },
};

function ProfileCompletionHeader() {
  const { logout } = useAuth();
  const { push } = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      push("/auth/login");
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
      <div className="container flex h-10 items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Complete Your Profile
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-foreground text-xs h-8 gap-1.5"
        >
          <LogOut className="size-3.5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}

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
