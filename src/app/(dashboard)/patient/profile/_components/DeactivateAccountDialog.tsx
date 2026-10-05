"use client";

import { useState, type FormEvent } from "react";
import { CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/tbd";

/** The word the patient has to type before the account is deactivated. */
export const DEACTIVATE_CONFIRM_WORD = "DEACTIVATE";

export interface DeactivateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending?: boolean;
  /** Message of an attempt that failed. */
  error?: string | null;
}

/** Typed confirmation before the patient's own account is deactivated. Props only. */
export function DeactivateAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  pending = false,
  error = null,
}: DeactivateAccountDialogProps) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim().toUpperCase() === DEACTIVATE_CONFIRM_WORD;

  const handleOpenChange = (next: boolean) => {
    if (pending) return;
    if (!next) setTyped("");
    onOpenChange(next);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (matches && !pending) onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Deactivate your account?</DialogTitle>
            <DialogDescription>
              You will be signed out on every device and will not be able to sign in again. The clinic keeps your
              medical records, as the law requires.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deactivate-confirm" className="text-xs font-bold text-ink-soft">
              Type {DEACTIVATE_CONFIRM_WORD} to confirm
            </label>
            <Input
              id="deactivate-confirm"
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              disabled={pending}
            />
          </div>

          {error ? (
            <Note tone="rose" icon={CircleAlert}>
              <span role="alert">{error}</span>
            </Note>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" size="md" onClick={() => handleOpenChange(false)} disabled={pending}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" size="md" disabled={!matches || pending}>
              {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {pending ? "Deactivating…" : "Deactivate account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
