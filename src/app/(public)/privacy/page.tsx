"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import {
  healthcareProvider,
  patientDataDisclosure,
  paymentCollectionDisclosure,
  paymentPartner,
} from "@/lib/legal/payment-disclosure";

export default function PrivacyPolicyPage() {
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
                <Shield className="size-6" />
                <span className="font-semibold text-lg">Dr Chandrakumar Deshmukh</span>
            </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-primary">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lock className="size-5 text-primary" />
                </div>
                <CardTitle className="text-3xl font-bold text-foreground">Privacy Policy</CardTitle>
            </div>
            <p className="text-muted-foreground">
              Last updated: February 2026
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Your privacy is critically important to us. Dr Chandrakumar Deshmukh uses the Viddhakarma platform/domain for digital appointments, patient workflows, and related payment operations.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Eye className="size-5 text-primary" />
                 1. Information We Collect
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect information you provide directly to us, such as when you create or modify your account, request appointments, contact support, or otherwise communicate with us. This information may include: name, email, verified phone number, address, date of birth, gender, medical history information you choose to provide, appointment details, billing records, and payment status.
              </p>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <FileText className="size-5 text-primary" />
                 2. How We Use Your Information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, such as to:
              </p>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground ml-2">
                  <li>Facilitate medical appointments and consultations.</li>
                  <li>Send you technically important notices, updates, security alerts, and support messages.</li>
                  <li>Respond to your comments, questions, and requests.</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
              </ul>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Lock className="size-5 text-primary" />
                 3. Data Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. We use enterprise-grade encryption for all sensitive health data both in transit and at rest.
              </p>
            </section>

             <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <Shield className="size-5 text-primary" />
                 4. Your Rights
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. You can do this by logging into your account or by contacting our support team. You also have the right to request a copy of your medical data in a portable format.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                 <FileText className="size-5 text-primary" />
                 5. Appointment and Billing Notices
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {patientDataDisclosure}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {paymentCollectionDisclosure} Payment processors receive only the information required to create, process, verify, refund, or reconcile the transaction.
              </p>
            </section>

            <section className="border border-primary/20 bg-primary/10 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-primary mb-2">Contact Us</h3>
                <p className="text-muted-foreground text-sm">
                    For healthcare/privacy requests, contact <a href={`mailto:${healthcareProvider.email}`} className="underline hover:text-primary">{healthcareProvider.email}</a>. For platform/payment support, contact <a href={`mailto:${paymentPartner.email}`} className="underline hover:text-primary">{paymentPartner.email}</a>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




