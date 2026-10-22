"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { EmptyBlock, LoadError, SkeletonRows, Surface, TbdPage, statusLabel } from "@/components/tbd";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { isPrescriptionEditable, prescriptionToFormValues } from "@/components/doctor/rx/rx-form.logic";
import { usePrescription } from "@/hooks/query/usePharmacy";
import { prescriptionReference } from "@/lib/utils/labels";
import { asRecordOrEmpty, textOf } from "@/lib/utils/coerce";

/**
 * DocEditPrescription: the prescribing editor filled with a saved prescription. Saving sends
 * PATCH /pharmacy/prescriptions/:id (items, diagnosis, notes). A dispensed or cancelled prescription
 * is read-only: the server refuses changes to it, so the page says so instead of offering the form.
 */
export function EditPrescriptionContent({ prescriptionId }: { prescriptionId: string }) {
  const router = useRouter();
  const query = usePrescription(prescriptionId);
  const record = useMemo(() => {
    const raw = asRecordOrEmpty(query.data);
    return asRecordOrEmpty(raw.prescription ?? raw.data ?? raw);
  }, [query.data]);
  const initialValues = useMemo(() => prescriptionToFormValues(record), [record]);

  const patient = asRecordOrEmpty(record.patient);
  const patientName = textOf(asRecordOrEmpty(patient.user).name) || textOf(patient.name) || textOf(record.patientName) || "Patient";
  const patientId = textOf(record.patientId) || textOf(patient.id);
  const doctorId = textOf(record.doctorId) || textOf(asRecordOrEmpty(record.doctor).id);
  const reference = prescriptionReference(prescriptionId, record);
  const status = textOf(record.status);
  const detailHref = `/doctor/prescriptions/${encodeURIComponent(prescriptionId)}`;

  const page = (children: ReactNode) => (
    <TbdPage title="Edit prescription" description={reference ? `${reference} · ${patientName}` : undefined} backHref={detailHref} backLabel="Prescription">
      {children}
    </TbdPage>
  );

  if (query.isPending) {
    return page(
      <Surface flush>
        <SkeletonRows rows={4} />
      </Surface>,
    );
  }
  if (query.error || !textOf(record.id)) {
    return page(
      <Surface flush>
        <LoadError title="The prescription could not be loaded" message="It may have been removed, or the connection dropped." onRetry={() => void query.refetch()} />
      </Surface>,
    );
  }
  if (!isPrescriptionEditable(status)) {
    return page(
      <Surface flush>
        <EmptyBlock
          icon={Lock}
          tone="amber"
          title={`This prescription is ${statusLabel(status).toLowerCase()}`}
          description="A dispensed or cancelled prescription cannot be changed. Write a new prescription for the patient instead."
          action={
            <Link
              href={`/doctor/prescriptions/new?patientId=${encodeURIComponent(patientId)}`}
              className="inline-flex min-h-10 items-center rounded-xl bg-primary px-4 text-[13px] font-bold text-primary-foreground"
            >
              New prescription
            </Link>
          }
        />
      </Surface>,
    );
  }

  return page(
    <QuickPrescriptionModal
      presentation="page"
      isOpen
      onClose={() => router.push(detailHref)}
      editPrescriptionId={prescriptionId}
      patientId={patientId}
      patientName={patientName}
      doctorId={doctorId}
      visitStatus={status}
      initialValues={initialValues}
      onSaved={() => router.push(detailHref)}
    />,
  );
}
