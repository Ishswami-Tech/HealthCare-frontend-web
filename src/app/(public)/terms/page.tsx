"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, ShieldCheck, FileWarning, Gavel } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function TermsOfServicePage() {
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
                <ShieldCheck className="h-6 w-6" />
                <span className="font-semibold text-lg">HealthCare App</span>
            </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
          <CardHeader className="space-y-4 border-b border-border/70 bg-muted/25 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <Scale className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="font-playfair text-3xl font-bold text-foreground">Terms of Service</CardTitle>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Last updated: January 21, 2026
            </p>
            <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
              Welcome to HealthCare App. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <ShieldCheck className="h-5 w-5 text-primary" />
                 1. Acceptance of Terms
              </h2>
              <p className="leading-8 text-muted-foreground">
                By creating an account or using any part of the HealthCare App platform, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree to these terms, you may not use our services.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <FileWarning className="h-5 w-5 text-primary" />
                 2. No Medical Advice
              </h2>
              <p className="leading-8 text-muted-foreground">
                The content provided through HealthCare App is for informational purposes only and is not intended to substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <Gavel className="h-5 w-5 text-primary" />
                 3. User Responsibilities
              </h2>
              <p className="leading-8 text-muted-foreground">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <Scale className="h-5 w-5 text-primary" />
                 4. Limitation of Liability
              </h2>
              <p className="leading-8 text-muted-foreground">
                To the maximum extent permitted by law, HealthCare App shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/10 p-6">
                <h3 className="mb-2 font-semibold text-foreground">Legal Contact</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                    If you have any questions about these Terms of Service, please contact our legal team at <a href="mailto:legal@healthcareapp.com" className="font-medium text-primary underline-offset-4 hover:underline">legal@healthcareapp.com</a>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
