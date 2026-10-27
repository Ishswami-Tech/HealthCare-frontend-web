"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-background to-indigo-50 dark:from-background dark:via-background dark:to-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-semibold text-muted-foreground/30">404</h1>
          <div className="relative -mt-16">
            <h2 className="text-3xl font-semibold text-foreground mb-2">
              Page Not Found
            </h2>
            <p className="text-muted-foreground mb-8">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-y-4">
          <Button asChild className="w-full">
            <Link href="/" prefetch={false} className="flex items-center justify-center">
              <Home className="size-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="size-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-12 text-sm text-muted-foreground">
          <p>
            Need help? Contact our{" "}
            <Link href="/contact" prefetch={false} className="text-blue-600 dark:text-blue-400 hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

