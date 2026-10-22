"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, PackageCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@/components/tbd";
import { useIssueHandoverCode } from "@/hooks/query/usePharmacyOps";
import { useCountdown } from "@/hooks/utils/useCountdown";
import { formatDateLabel } from "@/lib/utils/date-time";
import type { HandoverCode } from "@/types/pharmacy-ops.types";
import { canCollect, isCollected, type PatientPrescription } from "./patient-health.logic";

type HandoverCodePanelProps = {
  prescription: Pick<PatientPrescription, "id" | "number" | "readyForHandover" | "handoverStatus" | "handedOverAt">;
};

/** "123 456": easier to read out at the counter. */
function spacedCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

function IssuedCode({
  issued,
  isPending,
  onRenew,
}: {
  issued: HandoverCode;
  isPending: boolean;
  onRenew: () => void;
}) {
  const countdown = useCountdown(issued.expiresAt);
  const expired = Boolean(issued.expiresAt) && countdown.isExpired;
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-hair bg-well px-4 py-4 text-center">
      <span className="text-[13px] text-ink-muted">Show this at the medicine counter</span>
      {issued.qrImage && !expired ? (
        // A data URL from the API; next/image adds nothing for an inline picture.
        <img
          src={issued.qrImage}
          alt={`QR code to collect the medicines, code ${spacedCode(issued.code)}`}
          className="size-44 rounded-xl bg-white p-2"
        />
      ) : null}
      <span
        className={`font-mono text-[34px] font-extrabold leading-none tracking-[4px] ${expired ? "text-ink-soft line-through" : "text-ink"}`}
        aria-label={`Collection code ${issued.code.split("").join(" ")}`}
      >
        {spacedCode(issued.code)}
      </span>
      {issued.expiresAt ? (
        <span className="text-[13px] text-ink-muted" aria-live="polite">
          {expired ? "This code has expired." : `Expires in ${countdown.formatted}`}
        </span>
      ) : null}
      <Button variant="outline" size="md" onClick={onRenew} disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
        Get a new code
      </Button>
    </div>
  );
}

/**
 * Collecting medicines: once a prescription is paid and dispensed the patient asks for a
 * one-time code (+ QR), the pharmacist checks it at the counter and hands the medicines over.
 * After the hand-over it only says when they were collected.
 */
export function HandoverCodePanel({ prescription }: HandoverCodePanelProps) {
  const issueCode = useIssueHandoverCode();
  const queryClient = useQueryClient();
  // The issued code lives in the query cache (never fetched), so the desk card and the details
  // dialog show the same code instead of each asking for one and cancelling the other.
  const codeKey = ["patientHandoverCode", prescription.id] as const;
  const { data: issued = null } = useQuery<HandoverCode | null>({
    queryKey: codeKey,
    queryFn: () => null,
    enabled: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
  const [error, setError] = useState<string | null>(null);

  if (isCollected(prescription)) {
    return (
      <Note tone="green" icon={CheckCircle2}>
        {prescription.handedOverAt
          ? `Collected on ${formatDateLabel(prescription.handedOverAt)}.`
          : "Your medicines have been collected."}
      </Note>
    );
  }
  if (!canCollect(prescription)) return null;

  const requestCode = () => {
    setError(null);
    issueCode
      .mutateAsync({ prescriptionId: prescription.id })
      .then((code) => queryClient.setQueryData(codeKey, code))
      .catch((failure: unknown) => {
        setError(failure instanceof Error && failure.message ? failure.message : "We could not get a code. Please try again.");
      });
  };

  return (
    <div className="flex flex-col gap-3">
      {issued ? (
        <IssuedCode issued={issued} isPending={issueCode.isPending} onRenew={requestCode} />
      ) : (
        <Button size="md" className="h-12 w-full" onClick={requestCode} disabled={issueCode.isPending}>
          {issueCode.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
          Collect medicines
        </Button>
      )}
      {error ? (
        <p role="alert" className="m-0 text-[13px] font-semibold text-[#be123c] dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
