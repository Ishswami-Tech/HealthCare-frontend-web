"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "viddhakarma-cookie-consent";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(localStorage.getItem(COOKIE_CONSENT_KEY) !== "accepted");
  }, []);

  const acceptCookies = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <section
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Cookie className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 id="cookie-consent-title" className="text-sm font-semibold text-foreground">
                We use cookies
              </h2>
              <p id="cookie-consent-description" className="text-sm leading-relaxed text-muted-foreground">
                We use essential cookies for login, language, security, and service reliability. By
                continuing, you agree to our cookie use.{" "}
                <Link
                  href="/privacy-policy"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  Learn more
                </Link>
                .
              </p>
            </div>
          </div>
          <Button onClick={acceptCookies} className="shrink-0">
            Accept cookies
          </Button>
        </div>
      </div>
    </section>
  );
}
