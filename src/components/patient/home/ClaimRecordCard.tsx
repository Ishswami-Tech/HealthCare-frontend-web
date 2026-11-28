"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  describeClaimEntryProblem,
  useClaimRecord,
  useClaimableRecords,
  toClaimInput,
} from "@/hooks/query/usePatientRecordClaim";
import { showSuccessToast } from "@/hooks/utils/use-toast";
import { logout as logoutAction } from "@/lib/actions/auth.server";
import { markVoluntaryLogout } from "@/lib/utils/auth-recovery";

/**
 * Shown to a patient whose mobile number matches a record the clinic brought over from its old
 * register. They confirm who they are with their name AND the UHID or old patient number from a
 * clinic receipt or card (a name alone is known to relatives), and the two records become one
 * instead of an empty new account next to the old history. Not shown when nothing matches.
 */
export function ClaimRecordCard({ userId, enabled }: { userId: string; enabled: boolean }) {
  const claimable = useClaimableRecords(userId, enabled && Boolean(userId));
  const claim = useClaimRecord();
  const [fullName, setFullName] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [error, setError] = useState("");

  if (!enabled || !claimable.data || claimable.data.available < 1) return null;

  const entryProblem = describeClaimEntryProblem(fullName, receiptNumber);
  const ready =
    fullName.trim().length >= 3 && receiptNumber.trim().length >= 4 && !entryProblem && !claim.isPending;

  const submit = async () => {
    if (!ready) return;
    setError("");
    try {
      await claim.mutateAsync(toClaimInput(fullName, receiptNumber));
      showSuccessToast("Your earlier record is linked. Please sign in again.");
      markVoluntaryLogout();
      await logoutAction().catch(() => undefined);
      window.location.replace("/auth/login");
    } catch (failure) {
      setError(
        failure instanceof Error && failure.message
          ? failure.message
          : "We could not link your record. Please ask the clinic desk.",
      );
    }
  };

  return (
    <form
      aria-label="Link your earlier clinic record"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="flex flex-col gap-3 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3.5 text-[#065f46] sm:px-5 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
    >
      <div className="flex flex-col gap-0.5">
        <p className="m-0 text-sm font-bold">We found your earlier clinic record</p>
        <p className="m-0 text-[13px] leading-snug">
          The clinic has a record under your mobile number. Enter your full name as the clinic knows it and
          the UHID or old patient number from a clinic receipt or card, to bring your visits and history into
          this account. No number? Ask the clinic desk.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Input
          aria-label="Your full name as the clinic has it"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-10 bg-card text-ink sm:max-w-xs"
          autoComplete="name"
        />
        <Input
          aria-label="UHID or old patient number"
          placeholder="UHID or old patient number"
          value={receiptNumber}
          onChange={(event) => setReceiptNumber(event.target.value)}
          className="h-10 bg-card text-ink sm:max-w-xs"
          autoComplete="off"
        />
        <Button type="submit" variant="action" disabled={!ready}>
          {claim.isPending ? <Loader2 className="animate-spin" /> : null}
          Link my record
        </Button>
      </div>
      {entryProblem ? (
        <p role="status" className="m-0 text-[13px] font-semibold text-[#92400e] dark:text-amber-300">
          {entryProblem}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="m-0 text-[13px] font-semibold text-[#9f1239] dark:text-rose-300">
          {error}
        </p>
      ) : null}
    </form>
  );
}
