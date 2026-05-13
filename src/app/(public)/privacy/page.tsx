"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Button>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-primary shadow-sm">
            <Shield className="h-5 w-5" />
            <span className="font-semibold">HealthCare App</span>
          </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
          <CardHeader className="border-b border-border/70 bg-muted/25 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="font-playfair text-3xl font-bold text-foreground">
                  Privacy Policy
                </CardTitle>
                <p className="mt-3 text-sm font-medium text-muted-foreground">
                  Last updated: January 21, 2026
                </p>
                <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                  Your privacy is critically important to us. At HealthCare
                  App, we have a few fundamental principles regarding the
                  collection and processing of your personal health
                  information.
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6 sm:p-8">
            <section className="rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Eye className="h-5 w-5 text-primary" />
                1. Information We Collect
              </h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                We collect information you provide directly to us, such as when
                you create or modify your account, request on-demand services,
                contact customer support, or otherwise communicate with us.
                This information may include: name, email, phone number,
                doctoral address, date of birth, gender, and other medical
                history information you choose to provide.
              </p>
            </section>

            <section className="rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                2. How We Use Your Information
              </h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                We use the information we collect to provide, maintain, and
                improve our services, such as to:
              </p>
              <ul className="mt-4 space-y-2 pl-5 text-muted-foreground marker:text-primary">
                <li className="list-disc">Facilitate medical appointments and consultations.</li>
                <li className="list-disc">
                  Send technically important notices, updates, security alerts,
                  and support messages.
                </li>
                <li className="list-disc">Respond to your comments, questions, and requests.</li>
                <li className="list-disc">
                  Monitor and analyze trends, usage, and activities in
                  connection with our services.
                </li>
              </ul>
            </section>

            <section className="rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Lock className="h-5 w-5 text-primary" />
                3. Data Security
              </h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                We take reasonable measures to help protect information about
                you from loss, theft, misuse and unauthorized access,
                disclosure, alteration and destruction. We use enterprise-grade
                encryption for all sensitive health data both in transit and at
                rest.
              </p>
            </section>

            <section className="rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                <Shield className="h-5 w-5 text-primary" />
                4. Your Rights
              </h2>
              <p className="mt-3 leading-8 text-muted-foreground">
                You have the right to access, update, or delete your personal
                information at any time. You can do this by logging into your
                account or by contacting our support team. You also have the
                right to request a copy of your medical data in a portable
                format.
              </p>
            </section>

            <section className="rounded-3xl border border-primary/20 bg-primary/10 p-5">
              <h3 className="font-semibold text-foreground">Contact Us</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                If you have any questions about this Privacy Policy, please
                contact us at{" "}
                <a
                  href="mailto:privacy@healthcareapp.com"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  privacy@healthcareapp.com
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
