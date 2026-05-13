"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, FileText, Info } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/">
            <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
            </Button>
            </Link>
             <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 text-primary shadow-sm">
                <Shield className="h-6 w-6" />
                <span className="font-semibold text-lg">HealthCare App</span>
            </div>
        </div>

        <Card className="overflow-hidden border-border/70 bg-card shadow-[0_28px_90px_-56px_rgba(15,23,42,0.45)]">
          <CardHeader className="space-y-4 border-b border-border/70 bg-muted/25 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="font-playfair text-3xl font-bold text-foreground">Disclaimer</CardTitle>
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Last updated: January 21, 2026
            </p>
            <p className="max-w-3xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              Important information regarding the use of the HealthCare App platform and services.
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <Info className="h-5 w-5 text-primary" />
                 1. Medical Information Disclaimer
              </h2>
              <p className="leading-8 text-muted-foreground">
                The content provided on HealthCare App, including text, graphics, images, and other material, is for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <AlertTriangle className="h-5 w-5 text-primary" />
                 2. No Emergency Services
              </h2>
              <p className="leading-8 text-muted-foreground">
                HealthCare App is not intended for use in medical emergencies. If you are experiencing a medical emergency, call your local emergency services immediately.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <FileText className="h-5 w-5 text-primary" />
                 3. Accuracy of Information
              </h2>
              <p className="leading-8 text-muted-foreground">
                While we strive to provide accurate and up-to-date information, medical knowledge is constantly evolving. HealthCare App makes no representations or warranties, express or implied, about the completeness, accuracy, reliability, or suitability of the information contained on the platform.
              </p>
            </section>

             <section className="space-y-3 rounded-3xl border border-border/70 bg-muted/20 p-5">
              <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
                 <Shield className="h-5 w-5 text-primary" />
                 4. Limitation of Liability
              </h2>
              <p className="leading-8 text-muted-foreground">
                In no event will HealthCare App, its directors, employees, or partners be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this platform.
              </p>
            </section>

            <section className="mt-8 rounded-3xl border border-primary/20 bg-primary/10 p-6">
                <h3 className="mb-2 font-semibold text-foreground">Questions?</h3>
                <p className="text-sm leading-7 text-muted-foreground">
                    If you have any questions regarding this disclaimer, please contact us at <a href="mailto:support@healthcareapp.com" className="font-medium text-primary underline-offset-4 hover:underline">support@healthcareapp.com</a> or visit our <Link href="/contact" className="font-medium text-primary underline-offset-4 hover:underline">contact page</Link>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
