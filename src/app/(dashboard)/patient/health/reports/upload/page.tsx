"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, FlaskConical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, Note, Surface, TbdPage } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUploadPatientFile } from "@/hooks/query/usePatientUploads";
import { ReportUploadForm, type ReportUploadDetails } from "@/components/patient/health/ReportUploadDialog";
import type { UploadType } from "@/components/patient/health/patient-health.logic";

const REPORTS = "/patient/health/reports";

/**
 * WebUploadReport: the full-page upload (same form and checks as the Reports dialog), with the
 * report's name, date and a note for the doctor. Files go straight from the browser to the API.
 */
export default function PatientUploadReportPage() {
  const router = useRouter();
  const { session } = useAuth();
  const user = session?.user;
  const upload = useUploadPatientFile();
  const [saved, setSaved] = useState(false);
  // A new key clears the form for "Upload another".
  const [formKey, setFormKey] = useState(0);

  const handleUpload = (type: UploadType, file: File, details?: ReportUploadDetails) => {
    if (!user?.id) return;
    // Name and date go to their own fields (title / reportDate); only the note is free text.
    const title = details?.name.trim() ?? "";
    const reportDate = details?.date ?? "";
    const note = details?.note.trim() ?? "";
    upload
      .mutateAsync({
        clinicId: user.clinicId || "",
        patientId: user.id,
        type,
        file,
        ...(title ? { title } : {}),
        ...(reportDate ? { reportDate } : {}),
        ...(note ? { description: note } : {}),
      })
      .then(() => setSaved(true))
      // The hook already tells the patient what went wrong; the form stays filled to retry.
      .catch(() => undefined);
  };

  return (
    <TbdPage
      title="Upload a report"
      description="Add a lab report, a scan or a prescription from another clinic to your health record."
      backHref={REPORTS}
      backLabel="Reports"
      actions={
        <Button asChild variant="outline" size="md">
          <Link href="/patient/lab-booking">
            <FlaskConical aria-hidden="true" /> Book a home lab test instead
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface as="section" aria-label="Upload a report" className="gap-5">
          {saved ? (
            <EmptyBlock
              icon={CheckCircle2}
              title="Report saved"
              description="It is on your health record now, where your doctor can see it."
              action={
                <div className="flex flex-wrap justify-center gap-2.5">
                  <Button asChild size="md">
                    <Link href={REPORTS}>View in Reports</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setSaved(false);
                      setFormKey((key) => key + 1);
                    }}
                  >
                    Upload another
                  </Button>
                </div>
              }
            />
          ) : (
            <ReportUploadForm
              key={formKey}
              withDetails
              isUploading={upload.isPending}
              onUpload={handleUpload}
              onCancel={() => router.push(REPORTS)}
            />
          )}
        </Surface>
        <Note tone="green" icon={Lock}>
          Files are kept on your own record and are visible to you and the doctors of your clinic.
        </Note>
      </div>
    </TbdPage>
  );
}
