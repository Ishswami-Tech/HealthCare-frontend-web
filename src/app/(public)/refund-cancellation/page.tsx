"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  healthcareProvider,
  paymentCollectionDisclosure,
  paymentPartner,
} from "@/lib/legal/payment-disclosure";

const policies = [
  {
    title: "1. Video appointments",
    body: "Video appointment payments are non-refundable once payment is completed because the selected doctor slot is reserved for the patient. Missed video appointments require a fresh booking unless the clinic separately approves rescheduling.",
  },
  {
    title: "2. In-person appointments",
    body: "In-person appointment cancellation, rescheduling, and refund eligibility depend on the clinic's live availability, service type, and the timing of the cancellation request.",
  },
  {
    title: "3. Approved refunds",
    body: "If a refund is approved by the clinic or platform support team, it will be initiated to the original payment method where possible. Bank, UPI, card, and payment gateway settlement timelines may take 5 to 7 business days after initiation.",
  },
  {
    title: "4. Gateway charges",
    body: "Payment gateway, bank, or platform processing charges may be non-refundable where they have already been charged by the payment processor or bank.",
  },
];

export default function RefundCancellationPage() {
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
            <span className="text-lg font-semibold">Dr Chandrakumar Deshmukh</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary shadow-lg">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <RotateCcw className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                Refund & Cancellation Policy
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
              <h3 className="mb-2 font-semibold text-primary">Refund support</h3>
              <p className="text-sm text-muted-foreground">
                For healthcare/service questions, contact{" "}
                <a href={`mailto:${healthcareProvider.email}`} className="underline hover:text-primary">
                  {healthcareProvider.email}
                </a>
                . For payment/platform support, contact{" "}
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
