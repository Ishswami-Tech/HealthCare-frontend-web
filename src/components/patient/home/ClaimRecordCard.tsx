"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClaimRecord, useClaimableRecords } from "@/hooks/query/usePatientRecordClaim";
import { showErrorToast, showSuccessToast } from "@/hooks/utils/use-toast";
import { logout as logoutAction } from "@/lib/actions/auth.server";

/**
 * Shown to a patient whose mobile number matches a record the clinic brought over from its old
 * register: they confirm their name and the two records become one (instead of an empty new account
 * next to the old history). Not shown when nothing matches.
 */
export function ClaimRecordCard({ enabled }: { enabled: boolean }) {
  const claimable = useClaimableRecords(enabled);
  const claim = useClaimRecord();
  const [fullName, setFullName] = useState("");

  if (!enabled || !claimable.data || claimable.data.available < 1) return null;

  const submit = async () => {
    try {
      await claim.mutateAsync({ fullName: fullName.trim() });
      showSuccessToast("Your earlier record is linked. Please sign in again.");
      await logoutAction().catch(() => undefined);
      window.location.replace("/auth/login");
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "We could not link your record. Please ask the clinic desk.",
      );
    }
  };

  return (
    <section
      aria-label="Link your earlier clinic record"
      className="flex flex-col gap-3 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3.5 text-[#065f46] sm:px-5 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
    >
      <div className="flex flex-col gap-0.5">
        <p className="m-0 text-sm font-bold">We found your earlier clinic record</p>
        <p className="m-0 text-[13px] leading-snug">
          The clinic has a record under your mobile number. Enter your full name as the clinic knows it to
          bring your visits and history into this account.
        </p>
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <Input
          aria-label="Your full name as the clinic has it"
          placeholder="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className="h-10 bg-card text-ink sm:max-w-sm"
        />
        <Button
          variant="action"
          disabled={fullName.trim().length < 3 || claim.isPending}
          onClick={() => void submit()}
        >
          {claim.isPending ? <Loader2 className="animate-spin" /> : null}
          Link my record
        </Button>
      </div>
    </section>
  );
}
