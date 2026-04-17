"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <Link href={ROUTES.LOGIN}>
            <Button variant="ghost" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
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
                    <Lock className="h-5 w-5 text-blue-600" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Privacy Policy</CardTitle>
            </div>
            <p className="text-gray-500">
              Last updated: January 21, 2026
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Your privacy is critically important to us. At HealthCare App, we have a few fundamental principles regarding the collection and processing of your personal health information.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-8 px-6 sm:px-10">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Eye className="h-5 w-5 text-blue-600" />
                 1. Information We Collect
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We collect information you provide directly to us, such as when you create or modify your account, request on-demand services, contact customer support, or otherwise communicate with us. This information may include: name, email, phone number, doctoral address, date of birth, gender, and other medical history information you choose to provide.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <FileText className="h-5 w-5 text-blue-600" />
                 2. How We Use Your Information
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We use the information we collect to provide, maintain, and improve our services, such as to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-2">
                  <li>Facilitate medical appointments and consultations.</li>
                  <li>Send you technically important notices, updates, security alerts, and support messages.</li>
                  <li>Respond to your comments, questions, and requests.</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
              </ul>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Lock className="h-5 w-5 text-blue-600" />
                 3. Data Security
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. We use enterprise-grade encryption for all sensitive health data both in transit and at rest.
              </p>
            </section>

             <section className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                 <Shield className="h-5 w-5 text-blue-600" />
                 4. Your Rights
              </h2>
              <p className="text-gray-600 leading-relaxed">
                You have the right to access, update, or delete your personal information at any time. You can do this by logging into your account or by contacting our support team. You also have the right to request a copy of your medical data in a portable format.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-6 mt-8">
                <h3 className="font-semibold text-blue-900 mb-2">Contact Us</h3>
                <p className="text-blue-800 text-sm">
                    If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@healthcareapp.com" className="underline hover:text-blue-600">privacy@healthcareapp.com</a>.
                </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
