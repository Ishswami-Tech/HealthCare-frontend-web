import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2, Mail, ShieldAlert, FileText, Smartphone, Archive } from "lucide-react";
import { legalBrand, legalContacts, legalPlaceholders } from "@/lib/legal/policy-content";

/*
 * DRAFT - FOR OWNER / LEGAL REVIEW BEFORE PUBLISHING (REL-04).
 * Describes the real deletion paths: the in-app / web "Deactivate account" action
 * (POST /user/me/deactivate - a soft delete that blocks sign-in and revokes every
 * session) and an email request. Retention periods come from legalPlaceholders and
 * must be decided by the owner; the brand must match the Play Store developer name.
 */

const DELETION_EMAIL = legalContacts.healthcare;
const DELETION_MAILTO = `mailto:${DELETION_EMAIL}?subject=${encodeURIComponent("Data Deletion Request")}`;

const deletedItems = [
  "Your sign-in access: the account is deactivated immediately and every signed-in device is logged out.",
  "Profile and contact details (name, phone, email, address, date of birth, gender) and family members you added, once the retention window below has passed.",
  "Saved preferences, notification settings and push-notification tokens / device identifiers.",
  "Uploaded documents and app activity that are not part of your clinical or billing record.",
] as const;

const retainedItems = [
  `Clinical records created during your care (case sheets, prescriptions, reports): ${legalPlaceholders.clinicalRecordRetentionPeriod}.`,
  `Invoices, payment and refund records: ${legalPlaceholders.billingRecordRetentionPeriod}.`,
  `Security and audit logs: ${legalPlaceholders.logRetentionPeriod}.`,
  "Card, UPI and bank details are never stored by us; they stay with the payment provider (Cashfree, PhonePe, or Razorpay where enabled) under its own policy.",
] as const;

function SectionHeading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">
      {icon}
      {children}
    </h2>
  );
}

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
            <span className="text-lg font-semibold">{legalBrand.displayName}</span>
          </div>
        </div>

        <Card className="border-t-4 border-t-primary">
          <CardHeader className="flex flex-col gap-y-4 border-b pb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                <ShieldAlert className="size-5 text-primary" />
              </div>
              <CardTitle className="text-3xl font-bold text-foreground">Delete Your Account and Data</CardTitle>
            </div>
            <p className="text-lg leading-relaxed text-muted-foreground">
              You can delete your {legalBrand.displayName} account yourself in the app or on the website, or ask us by
              email. This page explains both ways, what is deleted, and what the law requires us to keep.
            </p>
          </CardHeader>

          <CardContent className="flex flex-col gap-y-8 px-6 pt-8 sm:px-10">
            <section className="flex flex-col gap-y-3">
              <SectionHeading icon={<Smartphone className="size-5 text-primary" />}>
                1. Delete your account yourself
              </SectionHeading>
              <ul className="ml-2 list-inside list-disc space-y-2 text-muted-foreground">
                <li>
                  <strong>Mobile app:</strong> open <strong>Settings</strong> and tap <strong>Delete account</strong>, then
                  confirm.
                </li>
                <li>
                  <strong>Website:</strong> sign in, open <strong>Profile &gt; Settings</strong>, press{" "}
                  <strong>Deactivate</strong> next to &quot;Deactivate my account&quot; and type{" "}
                  <strong>DEACTIVATE</strong> to confirm.
                </li>
              </ul>
              <p className="leading-relaxed text-muted-foreground">
                Your account is deactivated straight away: you can no longer sign in and every device is signed out.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <SectionHeading icon={<Mail className="size-5 text-primary" />}>2. Or request deletion by email</SectionHeading>
              <p className="leading-relaxed text-muted-foreground">
                Email{" "}
                <a href={DELETION_MAILTO} className="text-primary underline hover:text-primary/80">
                  {DELETION_EMAIL}
                </a>{" "}
                with the subject <strong>Data Deletion Request</strong> from the email address, or mentioning the phone
                number, linked to your account. We verify the request before acting on it so nobody else can delete
                your account.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <SectionHeading icon={<FileText className="size-5 text-primary" />}>3. What is deleted</SectionHeading>
              <ul className="ml-2 list-inside list-disc space-y-2 text-muted-foreground">
                {deletedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="leading-relaxed text-muted-foreground">
                Remaining eligible account data is deleted or anonymised after{" "}
                {legalPlaceholders.deactivatedAccountPurgePeriod} from deactivation.
              </p>
            </section>

            <section className="flex flex-col gap-y-3">
              <SectionHeading icon={<Archive className="size-5 text-primary" />}>
                4. What we keep, and for how long
              </SectionHeading>
              <p className="leading-relaxed text-muted-foreground">
                Some records must be kept by law even after you delete your account. They stay access-controlled and
                are deleted when the period ends.
              </p>
              <ul className="ml-2 list-inside list-disc space-y-2 text-muted-foreground">
                {retainedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section className="mt-8 rounded-xl bg-primary/10 p-6">
              <h3 className="mb-2 font-semibold text-primary">Questions or grievances</h3>
              <p className="text-sm text-muted-foreground">
                Contact{" "}
                <a href={`mailto:${DELETION_EMAIL}`} className="underline hover:text-primary">
                  {DELETION_EMAIL}
                </a>{" "}
                or our Grievance Officer ({legalPlaceholders.grievanceOfficerName}, {legalPlaceholders.grievanceOfficerContact}).
                See the{" "}
                <Link href="/privacy-policy" prefetch={false} className="underline hover:text-primary">
                  Privacy Policy
                </Link>{" "}
                for details.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
