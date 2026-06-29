"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, ShieldCheck, FileWarning, Gavel } from "lucide-react";
import {
  healthcareProvider,
  paymentCollectionDisclosure,
  paymentPartner,
} from "@/lib/legal/payment-disclosure";

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
                <span className="font-semibold text-lg">Dr Chandrakumar Deshmukh</span>
            </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Scale className="size-5 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">Terms of Service</CardTitle>
            </div>
            <p className="text-muted-foreground">
              Last updated: February 2026
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Welcome to Dr Chandrakumar Deshmukh on the Viddhakarma platform. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <ShieldCheck className="size-5 text-primary" />
                 1. Acceptance of Terms
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                By creating an account or using any part of the Dr Chandrakumar Deshmukh platform, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree to these terms, you may not use our services.
              </p>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <FileWarning className="size-5 text-primary" />
                 2. No Medical Advice
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                The content provided through Dr Chandrakumar Deshmukh is for informational purposes only and is not intended to substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Gavel className="size-5 text-primary" />
                 3. User Responsibilities
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <FileWarning className="size-5 text-primary" />
                 4. Video Appointments and Payments
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {paymentCollectionDisclosure}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Video appointment payments are non-refundable once payment is completed. If you miss your scheduled video appointment, you must book a new available slot to be seen again unless the clinic separately approves rescheduling. In-person appointment fees are governed by the clinic&apos;s refund and cancellation policy.
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground ml-2">
                  <li>Payment confirms the selected video or in-person appointment slot for the scheduled time.</li>
                  <li>Missed appointments are not carried forward automatically.</li>
                  <li>Any rebooking is subject to the clinic&apos;s live availability.</li>
                  <li>Payment and refund support can be coordinated by {paymentPartner.name}; healthcare service questions are handled by {healthcareProvider.name}.</li>
              </ul>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Scale className="size-5 text-primary" />
                 5. Limitation of Liability
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, Dr Chandrakumar Deshmukh shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="border border-primary/20 bg-primary/10 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-primary mb-2">Legal Contact</h3>
                <p className="text-muted-foreground text-sm">
                    For healthcare/service questions, contact <a href={`mailto:${healthcareProvider.email}`} className="underline hover:text-primary">{healthcareProvider.email}</a>. For payment/platform support, contact <a href={`mailto:${paymentPartner.email}`} className="underline hover:text-primary">{paymentPartner.email}</a>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




