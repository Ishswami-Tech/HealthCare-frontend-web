"use client";

import Link from "next/link";
import { ArrowLeft, Gavel, Scale, ShieldCheck, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { legalBrand, legalContacts, legalDates, termsSections } from "@/lib/legal/policy-content";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch={false}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-6" />
            <span className="text-lg font-semibold">{legalBrand.displayName}</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <Scale className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Terms of Service</CardTitle>
            </div>
            <p className="text-muted-foreground">Last updated: {legalDates.updated}</p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Welcome to {legalBrand.displayName} on the {legalBrand.platformName} platform. By
              accessing or using our platform, you agree to be bound by these Terms of Service.
              Please read them carefully.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            {termsSections.map((section) => (
              <section key={section.title} className="flex flex-col gap-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  {section.title.includes("Medical") ? (
                    <FileWarning className="size-5 text-primary" />
                  ) : section.title.includes("Video") ? (
                    <FileWarning className="size-5 text-primary" />
                  ) : section.title.includes("Liability") ? (
                    <Scale className="size-5 text-primary" />
                  ) : section.title.includes("User") ? (
                    <Gavel className="size-5 text-primary" />
                  ) : (
                    <ShieldCheck className="size-5 text-primary" />
                  )}
                  {section.title}
                </h2>
                <p className="leading-relaxed text-muted-foreground">{section.body}</p>
                {"bullets" in section ? (
                  <ul className="ml-2 list-inside list-disc space-y-2 text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}

            <section className="mt-8 rounded-xl border border-primary/20 bg-primary/10 p-6">
              <h3 className="mb-2 font-semibold text-primary">Legal Contact</h3>
              <p className="text-sm text-muted-foreground">
                For healthcare/service questions, contact{" "}
                <a
                  href={`mailto:${legalContacts.healthcare}`}
                  className="underline hover:text-primary"
                >
                  {legalContacts.healthcare}
                </a>
                . For payment/platform support, contact{" "}
                <a href={`mailto:${legalContacts.payment}`} className="underline hover:text-primary">
                  {legalContacts.payment}
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
