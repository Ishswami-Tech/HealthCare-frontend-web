"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DialogActions, DialogBody, DialogError, DialogShell } from "./dialog";
import { ChoiceChip, Field } from "./forms";

export interface ReasonDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Quick reasons shown as chips; picking one fills the note. */
  presets?: string[];
  /** Label over the note box. Default "Reason". */
  label?: string;
  placeholder?: string;
  /** The note must have text before the main button works. Default true. */
  required?: boolean;
  confirmLabel: React.ReactNode;
  busyLabel?: React.ReactNode;
  /** `danger` = the red button (cancel, refund, no-show). */
  tone?: "default" | "danger";
  busy?: boolean;
  error?: string | null;
  width?: number;
  /** Receives the trimmed reason. */
  onConfirm: (reason: string) => void;
}

/**
 * "Why?" dialog for actions that leave an audit trail: refund, cancel, no-show, set priority,
 * return a draft. Chips for common reasons plus a free note. Remounts its state on every open.
 */
export function ReasonDialog(props: ReasonDialogProps) {
  const { open, onClose } = props;
  return (
    <DialogShell open={open} onClose={onClose} busy={props.busy ?? false} title={props.title} description={props.description} width={props.width ?? 480}>
      {open ? <ReasonForm {...props} /> : null}
    </DialogShell>
  );
}

function ReasonForm({
  onClose,
  presets,
  label = "Reason",
  placeholder = "Add a short note",
  required = true,
  confirmLabel,
  busyLabel,
  tone = "default",
  busy = false,
  error,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");
  const [preset, setPreset] = useState<string | null>(null);
  const trimmed = reason.trim();
  const blocked = busy || (required && trimmed.length === 0);
  return (
    <>
      <DialogBody>
        {presets && presets.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Common reasons">
            {presets.map((item) => (
              <ChoiceChip
                key={item}
                active={preset === item}
                onClick={() => {
                  setPreset(item);
                  setReason(item);
                }}
              >
                {item}
              </ChoiceChip>
            ))}
          </div>
        ) : null}
        <Field label={label} htmlFor="tbd-reason" required={required}>
          <Textarea
            id="tbd-reason"
            value={reason}
            placeholder={placeholder}
            disabled={busy}
            onChange={(event) => {
              setReason(event.target.value);
              setPreset(null);
            }}
          />
        </Field>
        <DialogError message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" disabled={busy} onClick={onClose}>
          Cancel
        </Button>
        <Button variant={tone === "danger" ? "danger" : "default"} size="md" disabled={blocked} onClick={() => onConfirm(trimmed)}>
          {busy && busyLabel ? busyLabel : confirmLabel}
        </Button>
      </DialogActions>
    </>
  );
}
