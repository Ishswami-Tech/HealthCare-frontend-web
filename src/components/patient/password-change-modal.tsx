"use client";

import type * as React from "react";
import { useState } from "react";
import { CircleAlert, Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconBox, Note } from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";

interface PasswordChangeModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function PasswordChangeModal({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: PasswordChangeModalProps) {
  const { changePasswordAsync, isChangingPassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const isOpen = controlledOpen !== undefined ? controlledOpen : open;
  const handleOpenChange = onOpenChange || setOpen;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      return;
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      await changePasswordAsync({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      handleOpenChange(false);
      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password. Please try again.");
    }
  };

  const fields = [
    { id: "currentPassword", key: "currentPassword", label: "Current password", autoComplete: "current-password" },
    { id: "newPassword", key: "newPassword", label: "New password", autoComplete: "new-password", hint: "At least 8 characters" },
    { id: "confirmPassword", key: "confirmPassword", label: "Confirm new password", autoComplete: "new-password" },
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <IconBox icon={Lock} size={36} />
              Change password
            </DialogTitle>
            <DialogDescription>Choose a password that only you know.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3.5">
            {fields.map((field) => (
              <div key={field.id} className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor={field.id} className="text-xs font-bold text-ink-soft">
                  {field.label}
                </label>
                <Input
                  id={field.id}
                  type="password"
                  autoComplete={field.autoComplete}
                  value={formData[field.key]}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  required
                  disabled={isChangingPassword}
                  {...("hint" in field ? { minLength: 8, "aria-describedby": `${field.id}-hint` } : {})}
                />
                {"hint" in field ? (
                  <p id={`${field.id}-hint`} className="m-0 text-xs text-ink-muted">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            ))}

            {error && (
              <Note tone="rose" icon={CircleAlert}>
                <span role="alert">{error}</span>
              </Note>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleOpenChange(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" size="md" disabled={isChangingPassword}>
              {isChangingPassword ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
              {isChangingPassword ? "Changing…" : "Change password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PasswordChangeModal };
