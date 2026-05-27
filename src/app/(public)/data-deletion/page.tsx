"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Mail, ShieldAlert, FileText } from "lucide-react";
import { ROUTES } from "@/lib/config/routes";

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-4xl flex-col gap-y-8">
        <div className="flex items-center justify-between">
          <Link href={ROUTES.LOGIN} prefetch={false}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to Login
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-blue-600">
            <Trash2 className="size-6" />
            <span className="font-semibold text-lg">Dr Chandrakumar Deshmukh</span>
          </div>
        </div>

        <Card className="shadow-lg border-t-4 border-t-blue-600">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
                <ShieldAlert className="size-5 text-blue-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900">
                User Data Deletion
              </CardTitle>
            </div>
            <p className="text-gray-500">Last updated: May 12, 2026</p>
            <p className="text-lg text-gray-700 leading-relaxed">
              If you want to delete your account or request removal of your data, use the instructions below.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="size-5 text-blue-600" />
                1. What will be deleted
              </h2>
              <p className="text-gray-600 leading-relaxed">
                On request, we can remove account data associated with your Dr Chandrakumar Deshmukh profile. This may include your profile details, contact information, saved preferences, and app usage records that are not required to be retained for legal, medical, billing, or compliance reasons.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Mail className="size-5 text-blue-600" />
                2. How to request deletion
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Email us at{" "}
                <a
                  href="mailto:info@viddhakarma.com?subject=Data%20Deletion%20Request"
                  className="underline text-blue-700 hover:text-blue-800"
                >
                  info@viddhakarma.com
                </a>{" "}
                with the subject line <strong>Data Deletion Request</strong>.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Include the phone number or email tied to your account so we can verify your request and proceed safely.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <ShieldAlert className="size-5 text-blue-600" />
                3. What happens next
              </h2>
              <ul className="list-inside list-disc space-y-2 text-gray-600 ml-2">
                <li>We verify the request before processing deletion.</li>
                <li>We delete account data that is eligible for deletion.</li>
                <li>We keep records only where retention is required by law, billing, or clinical compliance.</li>
              </ul>
            </section>

            <section className="bg-blue-50 rounded-xl p-6 mt-8">
              <h3 className="font-semibold text-blue-900 mb-2">Support</h3>
              <p className="text-blue-800 text-sm">
                For deletion help, contact{" "}
                <a href="mailto:info@viddhakarma.com" className="underline hover:text-blue-600">
                  info@viddhakarma.com
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



