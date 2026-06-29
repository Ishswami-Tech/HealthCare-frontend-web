"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/config/routes";
import {
  healthcareProvider,
  paymentCollectionDisclosure,
  paymentPartner,
} from "@/lib/legal/payment-disclosure";

const policies = [
  {
    title: "1. No physical shipping",
    body: "The platform provides clinic booking, video consultation, in-person appointment, billing, and patient support services. No physical goods are shipped for standard appointment bookings or video consultations.",
  },
  {
    title: "2. Digital delivery",
    body: "Appointment confirmations, video consultation access, invoices, receipts, and payment status updates are delivered through the website, app, SMS, WhatsApp, email, or other configured communication channels.",
  },
  {
    title: "3. Healthcare service delivery",
    body: "Video consultations are delivered online at the scheduled time. In-person appointments are delivered at the clinic location and time selected during booking, subject to clinic availability and operational conditions.",
  },
  {
    title: "4. Delivery timelines",
    body: "Booking confirmations are normally generated after successful appointment creation and payment confirmation. Payment gateway, network, or clinic-system delays may occasionally affect confirmation timing.",
  },
];

export default function ShippingDeliveryPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-y-8">
        <div className="flex items-center justify-between">
          <Link href={ROUTES.LOGIN} prefetch={false}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Login
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-6" />
            <span className="text-lg font-semibold">Dr Chandrakumar Deshmukh</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <PackageCheck className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                Shipping & Delivery Policy
              </CardTitle>
            </div>
            <p className="text-muted-foreground">Last updated: February 2026</p>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {paymentCollectionDisclosure}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            {policies.map((policy) => (
              <section key={policy.title} className="flex flex-col gap-y-3">
                <h2 className="text-xl font-semibold text-foreground">{policy.title}</h2>
                <p className="leading-relaxed text-muted-foreground">{policy.body}</p>
              </section>
            ))}

            <section className="mt-8 rounded-xl border border-primary/20 bg-primary/10 p-6">
              <h3 className="mb-2 font-semibold text-primary">Delivery support</h3>
              <p className="text-sm text-muted-foreground">
                For appointment delivery questions, contact{" "}
                <a href={`mailto:${healthcareProvider.email}`} className="underline hover:text-primary">
                  {healthcareProvider.email}
                </a>
                . For platform/payment support, contact{" "}
                <a href={`mailto:${paymentPartner.email}`} className="underline hover:text-primary">
                  {paymentPartner.email}
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
