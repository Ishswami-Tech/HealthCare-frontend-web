import { Calendar, Download, Pencil, Pill as PillIcon, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InitialsAvatar, Pill, statusLabel, statusTone } from "@/components/tbd";
import {
  prescriptionDateLabel,
  shortPatientId,
  type DoctorPrescriptionRow,
} from "./doctor-prescriptions.logic";

export interface DoctorPrescriptionCardProps {
  prescription: DoctorPrescriptionRow;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
  onDownload: (prescription: DoctorPrescriptionRow) => void;
  onEdit: (prescription: DoctorPrescriptionRow) => void;
  onDelete: (prescription: DoctorPrescriptionRow) => void;
}

const FIELD_LABEL = "text-xs font-bold text-ink-soft";

/** One prescription: who, when, where it is at the pharmacy, what was prescribed. No amounts. */
export function DoctorPrescriptionCard({
  prescription,
  editDisabled = false,
  deleteDisabled = false,
  onDownload,
  onEdit,
  onDelete,
}: DoctorPrescriptionCardProps) {
  const dateLabel = prescriptionDateLabel(prescription.date);
  const patientRef = shortPatientId(prescription.patientId);

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 basis-[280px] items-start gap-3 sm:items-center">
          <InitialsAvatar name={prescription.patientName} size={42} />
          <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h3 className="m-0 text-base font-bold text-ink">{prescription.patientName}</h3>
              <Pill tone={statusTone(prescription.status)}>{statusLabel(prescription.status)}</Pill>
              {prescription.pharmacy ? (
                <Pill tone={prescription.pharmacy.tone}>Pharmacy: {prescription.pharmacy.label}</Pill>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-muted">
              {prescription.reference ? (
                <span className="font-bold text-ink">{prescription.reference}</span>
              ) : null}
              {dateLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" aria-hidden="true" />
                  {dateLabel}
                </span>
              ) : null}
              {patientRef ? (
                <span className="inline-flex items-center gap-1.5" title={prescription.patientId}>
                  <User className="size-3.5 shrink-0" aria-hidden="true" />
                  ID: {patientRef}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDownload(prescription)}
            aria-label={`Download PDF for ${prescription.patientName}`}
            title="Download PDF"
          >
            <Download aria-hidden="true" />
          </Button>
          <Button variant="soft" disabled={editDisabled} onClick={() => onEdit(prescription)}>
            <Pencil aria-hidden="true" />
            Edit
          </Button>
          <Button variant="danger" disabled={deleteDisabled} onClick={() => onDelete(prescription)}>
            <Trash2 aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-x-6 gap-y-3 sm:pl-[54px] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={FIELD_LABEL}>Diagnosis</span>
            <span className="text-sm text-ink">{prescription.diagnosis || "Not recorded"}</span>
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={FIELD_LABEL}>Medicines</span>
            {prescription.medicines.length > 0 ? (
              <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
                {prescription.medicines.map((medicine) => (
                  <li
                    key={medicine}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-[10px] border border-[#a7f3d0] bg-mint-soft px-2.5 py-1.5 text-xs font-semibold text-brand-dark dark:border-emerald-800"
                  >
                    <PillIcon className="size-[13px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
                    <span className="truncate">{medicine}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-ink-muted">No medicines listed</span>
            )}
          </div>
        </div>

        {prescription.notes ? (
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className={FIELD_LABEL}>Doctor&apos;s notes</span>
            <p className="m-0 rounded-xl bg-[#f8fafc] px-3 py-2.5 text-[13px] leading-normal text-ink-soft dark:bg-white/5">
              {prescription.notes}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
