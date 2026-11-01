"use client";

import { useState } from "react";
import { Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogError, Field, SegTabs } from "@/components/tbd";
import { useVerifyPrescriptionHandoverWithoutCode } from "@/hooks/query/usePharmacyOps";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import type { PharmacyHandover, VerifyHandoverWithoutCodeInput } from "@/types/pharmacy-ops.types";

type IdentityCheck = VerifyHandoverWithoutCodeInput["identityCheck"];

const REASON_MAX = 200;

/**
 * Counter fallback for a patient with no app or phone: the pharmacist confirms who the patient is
 * (last 4 digits of the phone on file, or the clinic UHID) and says why there is no code. The API
 * checks the identity, keeps paid + dispensed as a hard rule and audits who, when and why.
 */
export function HandoverWithoutCode({
  prescriptionId,
  onVerified,
}: {
  prescriptionId: string;
  onVerified?: (handover: PharmacyHandover) => void;
}) {
  const verify = useVerifyPrescriptionHandoverWithoutCode();
  const [open, setOpen] = useState(false);
  const [check, setCheck] = useState<IdentityCheck>("PHONE_LAST4");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const valueOk = check === "PHONE_LAST4" ? /^\d{4}$/.test(value.trim()) : value.trim().length > 0;
  const reasonOk = reason.trim().length >= 3;

  const submit = () => {
    if (verify.isPending || !valueOk || !reasonOk) return;
    setError(null);
    verify
      .mutateAsync({ prescriptionId, identityCheck: check, identityValue: value.trim(), reason: reason.trim() })
      .then((handover) => onVerified?.(handover))
      .catch((failure: unknown) => setError(sanitizeErrorMessage(failure)));
  };

  if (!open) {
    return (
      <Button variant="outline" size="md" className="self-start" onClick={() => setOpen(true)}>
        <UserCheck />
        Hand over without code
      </Button>
    );
  }

  return (
    <section aria-label="Hand over without code" className="flex flex-col gap-3 rounded-2xl border border-hair p-4">
      <p className="m-0 text-[13px] text-ink-muted">
        For a patient without the app or a phone. Confirm who they are and say why there is no code; this is recorded
        with your name.
      </p>
      <SegTabs<IdentityCheck>
        ariaLabel="How you checked the patient"
        value={check}
        onChange={(next) => {
          setCheck(next);
          setValue("");
          setError(null);
        }}
        options={[
          { value: "PHONE_LAST4", label: "Phone last 4 digits" },
          { value: "UHID", label: "UHID" },
        ]}
      />
      <Field
        label={check === "PHONE_LAST4" ? "Last 4 digits of the patient's phone" : "Patient UHID"}
        htmlFor="handover-identity"
        required
      >
        <Input
          id="handover-identity"
          inputMode={check === "PHONE_LAST4" ? "numeric" : "text"}
          autoComplete="off"
          maxLength={check === "PHONE_LAST4" ? 4 : 40}
          value={value}
          disabled={verify.isPending}
          onChange={(event) => {
            setValue(check === "PHONE_LAST4" ? event.target.value.replace(/\D/g, "") : event.target.value);
            if (error) setError(null);
          }}
        />
      </Field>
      <Field label="Why no code" htmlFor="handover-reason" required>
        <Input
          id="handover-reason"
          maxLength={REASON_MAX}
          placeholder="No phone with the patient"
          value={reason}
          disabled={verify.isPending}
          onChange={(event) => setReason(event.target.value)}
        />
      </Field>
      <DialogError message={error} />
      <span className="flex flex-wrap gap-2">
        <Button size="md" disabled={verify.isPending || !valueOk || !reasonOk} onClick={submit}>
          {verify.isPending ? <Loader2 className="animate-spin" /> : <UserCheck />}
          Confirm patient
        </Button>
        <Button variant="outline" size="md" disabled={verify.isPending} onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </span>
    </section>
  );
}
