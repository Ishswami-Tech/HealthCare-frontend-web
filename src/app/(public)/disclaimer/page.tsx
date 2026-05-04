"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, AlertTriangle, FileText, Info } from "lucide-react";

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <Link href="/" prefetch={false}>
            <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
            </Button>
            </Link>
             <div className="flex items-center gap-2 text-blue-600">
                <Shield className="h-6 w-6" />
                <span className="font-semibold text-lg">HealthCare App</span>
            </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <CardHeader className="space-y-4 pb-8 border-b">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Disclaimer</CardTitle>
            </div>
            <p className="text-gray-500">
              Last updated: January 21, 2026
            </p>
            <p className="text-lg text-gray-700 leading-relaxed font-medium">
              Important information regarding the use of the HealthCare App platform and services.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 px-6 sm:px-10">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Info className="h-5 w-5 text-blue-600" />
                 1. Medical Information Disclaimer
              </h2>
              <p className="text-gray-600 leading-relaxed">
                The content provided on HealthCare App, including text, graphics, images, and other material, is for informational purposes only. It is not intended to be a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <AlertTriangle className="h-5 w-5 text-blue-600" />
                 2. No Emergency Services
              </h2>
              <p className="text-gray-600 leading-relaxed">
                HealthCare App is not intended for use in medical emergencies. If you are experiencing a medical emergency, call your local emergency services immediately.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <FileText className="h-5 w-5 text-blue-600" />
                 3. Accuracy of Information
              </h2>
              <p className="text-gray-600 leading-relaxed">
                While we strive to provide accurate and up-to-date information, medical knowledge is constantly evolving. HealthCare App makes no representations or warranties, express or implied, about the completeness, accuracy, reliability, or suitability of the information contained on the platform.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Shield className="h-5 w-5 text-blue-600" />
                 4. Limitation of Liability
              </h2>
              <p className="text-gray-600 leading-relaxed">
                In no event will HealthCare App, its directors, employees, or partners be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this platform.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-blue-900 mb-2">Questions?</h3>
                <p className="text-blue-800 text-sm">
                    If you have any questions regarding this disclaimer, please contact us at <a href="mailto:support@healthcareapp.com" className="underline hover:text-blue-600">support@healthcareapp.com</a> or visit our <Link href="/contact" prefetch={false} className="underline hover:text-blue-600">contact page</Link>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
