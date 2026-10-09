"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyBlock, Note, SectionTitle, Surface } from "@/components/tbd";
import { useUpdateDoctor } from "@/hooks/query/useDoctors";
import { showErrorToast } from "@/hooks/utils/use-toast";
import { formatInr } from "@/lib/utils/earnings-range";
import {
  buildFeeChanges,
  feeToInput,
  type DoctorFeeSetting,
  type FeeDraft,
} from "./earnings-split.logic";

interface DoctorFeesCardProps {
  settings: DoctorFeeSetting[];
}

/** "Not set" when no fixed video fee exists. */
function videoFeeLabel(fee: number | null): string {
  return fee === null ? "Not set" : formatInr(fee);
}

/** In-person visits default to the subscription, so a missing fee reads as 0. */
function inPersonFeeLabel(fee: number | null): string {
  return fee === null || fee === 0 ? "Subscription (₹0)" : formatInr(fee);
}

function FeeRow({ setting }: { setting: DoctorFeeSetting }) {
  const [draft, setDraft] = useState<FeeDraft | null>(null);
  const [error, setError] = useState("");
  const update = useUpdateDoctor();
  const idBase = `fee-${setting.userId}`;

  const startEdit = () => {
    setError("");
    setDraft({ video: feeToInput(setting.videoDoctorFee), inPerson: feeToInput(setting.inPersonDoctorFee) });
  };

  const save = async () => {
    if (!draft) return;
    const result = buildFeeChanges(setting, draft);
    if (!result.ok) {
      setError(result.error);
      showErrorToast(result.error, { id: "doctor-fee-invalid", skipSanitization: true });
      return;
    }
    if (Object.keys(result.changes).length === 0) {
      setDraft(null);
      return;
    }
    try {
      // Only the fields that changed are sent.
      await update.mutateAsync({ doctorId: setting.userId, updates: result.changes });
      setDraft(null);
    } catch {
      // The mutation hook shows the error toast; keep the inputs so the admin can retry.
    }
  };

  return (
    <li className="flex flex-col gap-2.5 border-b border-hair py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-4">
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink" title={setting.doctorName}>
        {setting.doctorName}
      </span>
      {draft ? (
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idBase}-video`} className="text-xs text-ink-muted">
              Video fee (₹)
            </Label>
            <Input
              id={`${idBase}-video`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className="h-9 w-32"
              value={draft.video}
              onChange={(event) => setDraft({ ...draft, video: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor={`${idBase}-inperson`} className="text-xs text-ink-muted">
              In-person fee (₹)
            </Label>
            <Input
              id={`${idBase}-inperson`}
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              className="h-9 w-32"
              value={draft.inPerson}
              onChange={(event) => setDraft({ ...draft, inPerson: event.target.value })}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={update.isPending} aria-label={`Save fees for ${setting.doctorName}`}>
              <Check />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={update.isPending}
              onClick={() => setDraft(null)}
              aria-label={`Cancel editing fees for ${setting.doctorName}`}
            >
              <X />
              Cancel
            </Button>
          </div>
          {error ? (
            <p role="alert" className="m-0 w-full text-xs font-medium text-[#be123c]">
              {error}
            </p>
          ) : null}
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
          <span className="flex flex-col">
            <span className="text-xs text-ink-muted">Video fee</span>
            <span className="text-sm font-bold text-ink">{videoFeeLabel(setting.videoDoctorFee)}</span>
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-ink-muted">In-person fee</span>
            <span className="text-sm font-bold text-ink">{inPersonFeeLabel(setting.inPersonDoctorFee)}</span>
          </span>
          <Button variant="outline" size="sm" onClick={startEdit} aria-label={`Edit fees for ${setting.doctorName}`}>
            <Pencil />
            Edit
          </Button>
        </div>
      )}
    </li>
  );
}

/** The fixed doctor fees. Admins only: a doctor never sees or edits these. */
export function DoctorFeesCard({ settings }: DoctorFeesCardProps) {
  return (
    <Surface as="section" aria-label="Doctor fees">
      <SectionTitle
        title="Doctor fees"
        description="The fixed amount each doctor gets per consultation."
      />
      <Note tone="blue">
        Convenience fee = price paid by the patient minus the doctor fee. It is worked out for each payment and is not
        edited here.
      </Note>
      {settings.length === 0 ? (
        <EmptyBlock title="No doctors found" description="Doctors of your clinic show here once they are added." />
      ) : (
        <ul className="m-0 list-none p-0">
          {settings.map((setting) => (
            <FeeRow key={setting.userId} setting={setting} />
          ))}
        </ul>
      )}
    </Surface>
  );
}
