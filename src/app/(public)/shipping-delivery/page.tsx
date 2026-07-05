"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { legalBrand, legalDates, legalContacts, shippingSections } from "@/lib/legal/policy-content";

export default function ShippingDeliveryPage() {
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
                <PackageCheck className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                Shipping & Delivery Policy
              </CardTitle>
            </div>
            <p className="text-muted-foreground">Last updated: {legalDates.updated}</p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {legalBrand.displayName} provides healthcare booking, consultation, billing, and
              patient-support services through the {legalBrand.platformName} platform. No physical
              shipping applies to these services.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            {shippingSections.map((policy) => (
              <section key={policy.title} className="flex flex-col gap-y-3">
                <h2 className="text-xl font-semibold text-foreground">{policy.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{policy.body}</p>
              </section>
            ))}

            <section className="mt-8 rounded-xl border border-primary/20 bg-primary/10 p-6">
              <h3 className="mb-2 font-semibold text-primary">Delivery support</h3>
              <p className="text-sm text-muted-foreground">
                For appointment delivery questions, contact{" "}
                <a href={`mailto:${legalContacts.healthcare}`} className="underline hover:text-primary">
                  {legalContacts.healthcare}
                </a>
                . For platform/payment support, contact{" "}
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
