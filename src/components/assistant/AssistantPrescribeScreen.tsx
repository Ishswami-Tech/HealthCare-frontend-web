"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ClipboardList, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyBlock, InitialsAvatar, ListRow, Note, Pager, Pill, SectionTitle, SkeletonRows, Surface, TbdPage, usePagedRows } from "@/components/tbd";
import { QuickPrescriptionModal } from "@/components/doctor/QuickPrescriptionModal";
import { usePatientDirectoryEntry } from "@/hooks/query/usePatientDirectory";
import { ASSISTANT_ROUTES } from "./assistant-routes";
import { PatientPicker, directoryRowToPickedPatient, type PickedPatient } from "./PatientPicker";
import { useAssistantDay } from "./useAssistantDay";

type Target = PickedPatient & { appointmentId?: string };

/** Queue rows shown per page: a busy day can hold hundreds of checked-in rows. */
const QUEUE_PAGE_SIZE = 10;

const COPY = {
  prepare: {
    title: "Prepare a prescription draft",
    description: (doctor: string) => `Pick a patient in the clinic. Your draft goes to ${doctor} for approval; the patient cannot see it until then.`,
  },
  quick: {
    title: "Quick prescription",
    description: (doctor: string) => `Find the patient, add medicines from clinic stock and save. ${doctor} approves every draft.`,
  },
} as const;

/** The patient named in the link (`?patientId=`), once its directory entry is loaded. */
function useLinkedPatient(clinicId: string, patientId: string, appointmentId: string): Target | null {
  const entry = usePatientDirectoryEntry(clinicId, patientId);
  if (!patientId || !entry.data) return null;
  return { ...directoryRowToPickedPatient({ ...entry.data, patientId: entry.data.patientId || patientId }), ...(appointmentId ? { appointmentId } : {}) };
}

/**
 * AsPrescribe / AsQuickRx: pick a patient (in the queue now, or by search) and write the draft in
 * the shared prescription dialog (`QuickPrescriptionModal mode="draft"`). The server stores the
 * assistant's prescription as a DRAFT for the doctor to approve.
 */
export function AssistantPrescribeScreen({ variant = "prepare" }: { variant?: keyof typeof COPY }) {
  const router = useRouter();
  const params = useSearchParams();
  const linkedPatientId = params?.get("patientId") ?? "";
  const linkedAppointmentId = params?.get("appointmentId") ?? "";
  const day = useAssistantDay();
  const linked = useLinkedPatient(day.clinicId, linkedPatientId, linkedAppointmentId);
  const [picked, setPicked] = useState<Target | null>(null);
  const [dismissedLink, setDismissedLink] = useState(false);
  const target = picked ?? (dismissedLink ? null : linked);
  const doctorName = day.doctor.doctorName || "the doctor";
  const copy = COPY[variant];
  const inClinic = day.queue;
  const queuePaging = usePagedRows(inClinic, QUEUE_PAGE_SIZE);

  const close = () => {
    setPicked(null);
    setDismissedLink(true);
  };

  return (
    <TbdPage
      title={copy.title}
      description={copy.description(doctorName)}
      backHref={ASSISTANT_ROUTES.drafts}
      backLabel="All drafts"
      actions={<Pill tone="amber">Draft · awaiting {doctorName}</Pill>}
    >
      {!day.doctor.isResolving && !day.doctor.doctorId ? (
        <Note tone="rose">No doctor is set up for this clinic yet, so a draft cannot be saved. Ask the clinic admin to add the doctor.</Note>
      ) : null}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <Surface className="gap-3">
          <SectionTitle icon={Users} title="In the clinic now" count={inClinic.length} description="Checked-in patients in the doctor's queue." />
          {day.queueLoading ? (
            <SkeletonRows rows={3} />
          ) : inClinic.length === 0 ? (
            <EmptyBlock icon={Users} title="No one is in the queue" description="Search for the patient instead." className="py-6" />
          ) : (
            <div>
              {queuePaging.pageRows.map((row) => (
                <ListRow
                  key={row.key}
                  left={<InitialsAvatar name={row.patientName} size={36} />}
                  title={row.patientName}
                  description={[row.token ? `Token ${row.token}` : "", row.stage === "WITH_DOCTOR" ? "With doctor" : "Waiting"].filter(Boolean).join(" · ")}
                  right={
                    <Button
                      size="compact"
                      variant="soft"
                      disabled={!row.patientId}
                      onClick={() =>
                        setPicked({ id: row.patientId, name: row.patientName, summary: row.token ? `Token ${row.token}` : "", ...(row.appointmentId ? { appointmentId: row.appointmentId } : {}) })
                      }
                    >
                      Prepare draft
                    </Button>
                  }
                />
              ))}
              <Pager paging={queuePaging} noun="patients" hideWhenSinglePage id="prescribe-queue-pager" label="Queue pages" />
            </div>
          )}
        </Surface>
        <Surface className="gap-3">
          <SectionTitle icon={ClipboardList} title="Find a patient" description="Any registered patient of the clinic." />
          <PatientPicker clinicId={day.clinicId} actionLabel="Prepare draft" onPick={(patient) => setPicked(patient)} />
        </Surface>
      </div>
      <Note tone="blue">
        Only medicines from clinic stock can go on a draft. {doctorName} reviews, edits and approves it; you can follow it in{" "}
        <Link className="font-bold underline" href={ASSISTANT_ROUTES.drafts}>
          Prescription drafts
        </Link>
        .
      </Note>

      {target && day.doctor.doctorId ? (
        <QuickPrescriptionModal
          isOpen
          mode="draft"
          onClose={close}
          patientId={target.id}
          patientName={target.name}
          doctorId={day.doctor.doctorId}
          {...(target.summary ? { patientSummary: target.summary } : {})}
          {...(target.appointmentId ? { appointmentId: target.appointmentId } : {})}
          onSaved={(result) => {
            router.push(result.prescriptionId ? ASSISTANT_ROUTES.draft(result.prescriptionId) : ASSISTANT_ROUTES.drafts);
          }}
        />
      ) : null}
    </TbdPage>
  );
}
