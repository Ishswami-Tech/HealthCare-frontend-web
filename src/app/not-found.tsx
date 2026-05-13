"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-border/80 bg-card/95 p-6 text-center shadow-xl ring-1 ring-border/30 sm:p-8">
        <div className="mb-8">
          <h1 className="text-8xl font-black tracking-tight text-primary/20 sm:text-9xl">404</h1>
          <div className="relative -mt-16">
            <h2 className="mb-2 text-3xl font-bold text-foreground">
              Page Not Found
            </h2>
            <p className="mb-8 text-muted-foreground">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/" className="flex items-center justify-center">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>

        <div className="mt-10 text-sm text-muted-foreground">
          <p>
            Need help? Contact our{" "}
            <Link href="/contact" className="text-primary hover:underline">
              support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
