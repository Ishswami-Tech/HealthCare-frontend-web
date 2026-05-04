"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Scale, ShieldCheck, FileWarning, Gavel } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <Link href={ROUTES.LOGIN} prefetch={false}>
            <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
            </Button>
            </Link>
             <div className="flex items-center gap-2 text-blue-600">
                <ShieldCheck className="h-6 w-6" />
                <span className="font-semibold text-lg">HealthCare App</span>
            </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <CardHeader className="space-y-4 pb-8 border-b">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Scale className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Terms of Service</CardTitle>
            </div>
            <p className="text-gray-500">
              Last updated: January 21, 2026
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to HealthCare App. By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 px-6 sm:px-10">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <ShieldCheck className="h-5 w-5 text-blue-600" />
                 1. Acceptance of Terms
              </h2>
              <p className="text-gray-600 leading-relaxed">
                By creating an account or using any part of the HealthCare App platform, you acknowledge that you have read, understood, and agree to be bound by these terms. If you do not agree to these terms, you may not use our services.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <FileWarning className="h-5 w-5 text-blue-600" />
                 2. No Medical Advice
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The content provided through HealthCare App is for informational purposes only and is not intended to substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Gavel className="h-5 w-5 text-blue-600" />
                 3. User Responsibilities
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Scale className="h-5 w-5 text-blue-600" />
                 4. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                To the maximum extent permitted by law, HealthCare App shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-blue-900 mb-2">Legal Contact</h3>
                <p className="text-blue-800 text-sm">
                    If you have any questions about these Terms of Service, please contact our legal team at <a href="mailto:legal@healthcareapp.com" className="underline hover:text-blue-600">legal@healthcareapp.com</a>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
