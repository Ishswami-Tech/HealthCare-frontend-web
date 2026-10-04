"use client";

import { useState, type ReactNode } from "react";
import { BellOff, ChevronRight, CircleAlert, Package, Pill as PillIcon, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, InitialsAvatar, PageHead, Pill, SearchBox, SoftCard, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { PrescriptionDetailsDialog } from "./PrescriptionDetailsDialog";
import {
  PHARMACY_STATE,
  canPay,
  filterPrescriptions,
  medicinesLabel,
  type CurrentMedicine,
  type PatientPrescription,
} from "./patient-health.logic";

/** Icon squares cycle through the three colours of the design. */
const MEDICINE_WELLS = ["bg-[#059669]", "bg-[#ea580c]", "bg-[#4f46e5]"] as const;

const LIST_STEP = 6;
/** The search field only earns its place on a long list. */
const SEARCH_FROM = 6;

export interface PatientMedicinesViewProps {
  /** "From Dr. Deshmukh's prescriptions" */
  sourceLabel: string;
  /** Medicines whose course is still running. Never sample data. */
  medicines: CurrentMedicine[];
  /** Every prescription, newest first. */
  prescriptions: PatientPrescription[];
  isLoading?: boolean;
  failed?: boolean;
  onRetry: () => void;
  /** The amber Pay button of the existing payment flow. */
  renderPay: (prescription: PatientPrescription, placement: "card" | "dialog") => ReactNode;
  onDownloadBill?: (invoiceId: string) => void;
  downloadingBillId?: string | null;
  /** Opens this prescription's details straight away (deep link from a notification or a report). */
  initialPrescriptionId?: string | null;
}

function DeskCard({
  prescription,
  renderPay,
}: {
  prescription: PatientPrescription;
  renderPay: PatientMedicinesViewProps["renderPay"];
}) {
  const due = canPay(prescription);
  const meta = [prescription.number, medicinesLabel(prescription.lines.length), prescription.queueLabel]
    .filter(Boolean)
    .join(" · ");
  return (
    <Surface
      as="section"
      aria-label={due ? `Payment pending for ${prescription.number}` : `${prescription.number} at the medicine desk`}
      className={cn(
        "gap-4",
        due ? "border border-[#fed7aa] dark:border-orange-900/70" : "border border-[#a7f3d0] dark:border-emerald-900/70",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[14px] text-white",
            due ? "bg-[#ea580c]" : "bg-[#047857]",
          )}
          aria-hidden="true"
        >
          {due ? <Wallet className="size-[22px]" strokeWidth={2.2} /> : <Package className="size-[22px]" strokeWidth={2.2} />}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              "text-[15px] font-extrabold",
              due ? "text-[#7c2d12] dark:text-orange-200" : "text-brand-dark",
            )}
          >
            {due ? PHARMACY_STATE.awaiting_payment.label : PHARMACY_STATE[prescription.state].label}
          </span>
          <span className={cn("text-[13px]", due ? "text-[#9a3412] dark:text-orange-300" : "text-ink-muted")}>{meta}</span>
        </div>
      </div>
      <p className="m-0 text-[13px] text-ink-muted">
        {due
          ? "Medicines are handed over after the payment is received."
          : "Collect your medicines at the medicine desk."}
      </p>
      {due ? renderPay(prescription, "card") : null}
    </Surface>
  );
}

export function PatientMedicinesView({
  sourceLabel,
  medicines,
  prescriptions,
  isLoading = false,
  failed = false,
  onRetry,
  renderPay,
  onDownloadBill,
  downloadingBillId = null,
  initialPrescriptionId = null,
}: PatientMedicinesViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialPrescriptionId);
  const [searchTerm, setSearchTerm] = useState("");
  const [visible, setVisible] = useState(LIST_STEP);

  const selected = selectedId ? (prescriptions.find((prescription) => prescription.id === selectedId) ?? null) : null;
  const filtered = filterPrescriptions(prescriptions, searchTerm);
  const shown = filtered.slice(0, visible);
  // Open prescriptions that need the patient: something to pay, or waiting at the medicine desk.
  const deskCards = prescriptions.filter(
    (prescription) =>
      canPay(prescription) || (prescription.atDesk && prescription.state !== "dispensed" && prescription.state !== "cancelled"),
  );
  const sourceCount = new Set(medicines.map((medicine) => medicine.prescriptionId).filter(Boolean)).size;

  return (
    <>
      <PageHead backHref="/patient/health" title="Medicines" description={isLoading || failed ? undefined : sourceLabel} />

      {failed ? (
        <Surface flush role="alert">
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="We could not load your prescriptions"
            description="Please check your connection and try again."
            action={
              <Button variant="outline" size="md" onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Surface>
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <SoftCard as="section" aria-label="Medicines you take now">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] text-ink-muted">Medicines you take now</span>
                  <div className="flex items-center gap-3">
                    {isLoading ? (
                      <Skeleton className="h-[33px] w-12 rounded-md" />
                    ) : (
                      <span className="text-[30px] font-extrabold leading-[1.1] tracking-[-0.5px] text-ink">
                        {medicines.length}
                      </span>
                    )}
                    {!isLoading && sourceCount > 0 ? (
                      <span className="whitespace-nowrap rounded-[8px] bg-[#facc15] px-[9px] py-[5px] text-[11px] font-extrabold text-[#422006]">
                        From {sourceCount} {sourceCount === 1 ? "prescription" : "prescriptions"}
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* The backend keeps no dose log, so there is no adherence score or "mark taken" yet. */}
                <div className="flex max-w-[300px] items-center gap-2.5 rounded-[14px] bg-white/70 px-3.5 py-2.5 text-[13px] text-ink-muted dark:bg-white/5">
                  <BellOff className="size-[18px] shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
                  <span>Dose reminders and tracking are not available yet.</span>
                </div>
              </div>
            </SoftCard>

            <Surface as="section" aria-labelledby="patient-current-medicines" className="gap-1 pb-2">
              <h2 id="patient-current-medicines" className="m-0 text-base font-bold text-ink">
                Current medicines
              </h2>
              {isLoading ? (
                <div className="flex flex-col" aria-busy="true" aria-label="Loading your medicines">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="flex items-center gap-3.5 border-b border-hair py-3.5 last:border-b-0">
                      <Skeleton className="size-11 shrink-0 rounded-[14px]" />
                      <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-40 max-w-[60%] rounded-md" />
                        <Skeleton className="h-3 w-56 max-w-[80%] rounded-md" />
                      </div>
                      <Skeleton className="h-[22px] w-24 rounded-lg" />
                    </div>
                  ))}
                </div>
              ) : medicines.length === 0 ? (
                <EmptyBlock
                  icon={PillIcon}
                  title="No current medicines"
                  description="Medicines your doctor prescribes show here with the dose and timing."
                />
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {medicines.map((medicine, index) => {
                    const state = medicine.state ? PHARMACY_STATE[medicine.state] : null;
                    return (
                      <li
                        key={medicine.id}
                        className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-hair py-3.5 last:border-b-0"
                      >
                        <span
                          className={cn(
                            "flex size-11 shrink-0 items-center justify-center rounded-[14px] text-white",
                            MEDICINE_WELLS[index % MEDICINE_WELLS.length],
                          )}
                          aria-hidden="true"
                        >
                          <PillIcon className="size-5" strokeWidth={2.2} />
                        </span>
                        <span className="flex min-w-0 flex-1 basis-[calc(100%-58px)] flex-col gap-0.5 sm:basis-0">
                          <span className="text-sm font-bold text-ink">{medicine.name}</span>
                          <span className="text-xs text-ink-muted">
                            {medicine.schedule || "Follow your doctor's instructions"}
                          </span>
                          {medicine.instructions ? (
                            <span className="text-xs text-ink-muted">{medicine.instructions}</span>
                          ) : null}
                        </span>
                        <Pill tone={state ? state.tone : "clinic"} className="ml-[58px] sm:ml-0">
                          {state ? state.label : "In your record"}
                        </Pill>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Surface>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            {isLoading
              ? null
              : deskCards.map((prescription) => (
                  <DeskCard key={prescription.id} prescription={prescription} renderPay={renderPay} />
                ))}

            <Surface as="section" aria-labelledby="patient-prescriptions" className="gap-1 pb-2">
              <h2 id="patient-prescriptions" className="m-0 text-base font-bold text-ink">
                Prescriptions
              </h2>
              {!isLoading && prescriptions.length >= SEARCH_FROM ? (
                <SearchBox
                  value={searchTerm}
                  onChange={(value) => {
                    setSearchTerm(value);
                    setVisible(LIST_STEP);
                  }}
                  placeholder="Search by number, doctor or medicine"
                  className="mt-2.5"
                />
              ) : null}
              {isLoading ? (
                <div className="flex flex-col" aria-busy="true" aria-label="Loading your prescriptions">
                  {[0, 1].map((index) => (
                    <div key={index} className="flex items-center gap-3.5 border-b border-hair py-3.5 last:border-b-0">
                      <Skeleton className="size-11 shrink-0 rounded-xl" />
                      <div className="flex flex-1 flex-col gap-2">
                        <Skeleton className="h-4 w-36 max-w-[70%] rounded-md" />
                        <Skeleton className="h-3 w-44 max-w-[85%] rounded-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : prescriptions.length === 0 ? (
                <EmptyBlock
                  icon={PillIcon}
                  title="No prescriptions yet"
                  description="Prescriptions from your doctor show here after a visit."
                />
              ) : shown.length === 0 ? (
                <p className="m-0 py-6 text-center text-[13px] text-ink-muted">No prescription matches this search.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {shown.map((prescription) => {
                    const state = PHARMACY_STATE[prescription.state];
                    return (
                      <li key={prescription.id} className="border-b border-hair last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(prescription.id)}
                          aria-label={`Open ${prescription.number}`}
                          className="flex w-full items-center gap-3.5 rounded-lg py-3.5 text-left text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          {prescription.doctorName ? (
                            <InitialsAvatar name={prescription.doctorName} size={44} square />
                          ) : (
                            <span
                              className="flex size-11 shrink-0 items-center justify-center rounded-[13px] bg-[#d1fae5] text-[#047857] dark:bg-emerald-500/15 dark:text-emerald-300"
                              aria-hidden="true"
                            >
                              <PillIcon className="size-5" strokeWidth={2.2} />
                            </span>
                          )}
                          <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                            <span className="text-sm font-bold">
                              {[prescription.number, prescription.diagnosis].filter(Boolean).join(" · ")}
                            </span>
                            <span className="text-xs text-ink-muted">
                              {[prescription.dateLabel, medicinesLabel(prescription.lines.length)].filter(Boolean).join(" · ")}
                            </span>
                            <Pill tone={state.tone} className="mt-1">
                              {state.label}
                            </Pill>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {!isLoading && filtered.length > visible ? (
                <Button variant="soft" className="mb-3 mt-1 self-center" onClick={() => setVisible(visible + LIST_STEP)}>
                  Show more
                </Button>
              ) : null}
            </Surface>
          </div>
        </div>
      )}

      <PrescriptionDetailsDialog
        prescription={selected}
        onClose={() => setSelectedId(null)}
        renderPay={renderPay}
        {...(onDownloadBill ? { onDownloadBill } : {})}
        downloadingBillId={downloadingBillId}
      />
    </>
  );
}
