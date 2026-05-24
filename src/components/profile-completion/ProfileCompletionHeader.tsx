"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";

export function ProfileCompletionHeader() {
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