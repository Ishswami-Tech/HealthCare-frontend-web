"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Mail, ShieldAlert, FileText } from "lucide-react";

export default function DataDeletionPage() {
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
            <Trash2 className="size-6" />
            <span className="font-semibold text-lg">Dr Chandrakumar Deshmukh</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldAlert className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">
                User Data Deletion
              </CardTitle>
            </div>
            <p className="text-muted-foreground">Last updated: May 12, 2026</p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              If you want to delete your account or request removal of your data, use the instructions below.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                1. What will be deleted
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                On request, we can remove account data associated with your Dr Chandrakumar Deshmukh profile. This may include your profile details, contact information, saved preferences, and app usage records that are not required to be retained for legal, medical, billing, or compliance reasons.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Mail className="size-5 text-primary" />
                2. How to request deletion
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Email us at{" "}
                <a
                  href="mailto:info@viddhakarma.com?subject=Data%20Deletion%20Request"
                  className="text-primary underline hover:text-primary/80"
                >
                  info@viddhakarma.com
                </a>{" "}
                with the subject line <strong>Data Deletion Request</strong>.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Include the phone number or email tied to your account so we can verify your request and proceed safely.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <ShieldAlert className="size-5 text-primary" />
                3. What happens next
              </h2>
              <ul className="list-inside list-disc space-y-2 text-muted-foreground ml-2">
                <li>We verify the request before processing deletion.</li>
                <li>We delete account data that is eligible for deletion.</li>
                <li>We keep records only where retention is required by law, billing, or clinical compliance.</li>
              </ul>
            </section>

            <section className="rounded-xl bg-primary/10 p-6 mt-8">
              <h3 className="font-semibold text-primary mb-2">Support</h3>
              <p className="text-sm text-muted-foreground">
                For deletion help, contact{" "}
                <a href="mailto:info@viddhakarma.com" className="underline hover:text-primary">
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



