"use client";

import type * as React from "react";
import { useState } from "react";
import { Lock, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Ensure your new password is strong and unique
            </DialogDescription>
          </DialogHeader>

          <div className="gap-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="size-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="gap-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) =>
                  setFormData({ ...formData, currentPassword: e.target.value })
                }
                required
                disabled={isChangingPassword}
              />
            </div>

            <div className="gap-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData({ ...formData, newPassword: e.target.value })
                }
                required
                minLength={8}
                disabled={isChangingPassword}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 8 characters
              </p>
            </div>

            <div className="gap-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
                disabled={isChangingPassword}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isChangingPassword}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { PasswordChangeModal };
