"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, FileText, Info, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { disclaimerSections, legalBrand, legalDates, legalContacts } from "@/lib/legal/policy-content";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl gap-y-8">
        <div className="flex items-center justify-between">
          <Link href="/" prefetch={false}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Home
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="size-6" />
            <span className="text-lg font-semibold">{legalBrand.displayName}</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="gap-y-4 border-b pb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <AlertTriangle className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Disclaimer</CardTitle>
            </div>
            <p className="text-muted-foreground">Last updated: {legalDates.updated}</p>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground">
              Important information regarding the use of the {legalBrand.displayName} platform and
              services.
            </p>
          </CardHeader>

          <CardContent className="gap-y-8 px-6 pt-8 sm:px-10">
            {disclaimerSections.map((section) => (
              <section key={section.title} className="gap-y-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                  {section.title.includes("Emergency") ? (
                    <AlertTriangle className="size-5 text-primary" />
                  ) : section.title.includes("Accuracy") ? (
                    <FileText className="size-5 text-primary" />
                  ) : section.title.includes("Liability") ? (
                    <Shield className="size-5 text-primary" />
                  ) : (
                    <Info className="size-5 text-primary" />
                  )}
                  {section.title}
                </h2>
                <p className="leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}

            <section className="mt-8 rounded-xl bg-primary/10 p-6">
              <h3 className="mb-2 font-semibold text-primary">Questions?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions regarding this disclaimer, please contact us at{" "}
                <a href={`mailto:${legalContacts.healthcare}`} className="underline hover:text-primary">
                  {legalContacts.healthcare}
                </a>{" "}
                or visit our{" "}
                <Link href="/contact" prefetch={false} className="underline hover:text-primary">
                  contact page
                </Link>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
