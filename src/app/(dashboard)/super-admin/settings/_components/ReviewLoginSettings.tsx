"use client";

import { useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Copy, KeyRound, Loader2, RefreshCw } from "lucide-react";
import {
  useDisableReviewLogin,
  useEnableReviewLogin,
  useRegenerateReviewLogin,
  useReviewLoginStatus,
} from "@/hooks/query/useReviewLogin";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  REVIEW_LOGIN_DURATION_DAYS,
  type ReviewLoginDurationDays,
  type ReviewLoginIssued,
} from "@/types/review-login.types";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[\d\s-]{10,16}$/, "Enter the phone number with country code, for example +919876543210");

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Super admin control for the app store reviewer login. The backend generates the code and
 * returns it once; it is held only in this component's state until the page is left.
 */
export function ReviewLoginSettings() {
  const { data: status, isPending: isLoading } = useReviewLoginStatus();
  const enable = useEnableReviewLogin();
  const regenerate = useRegenerateReviewLogin();
  const disable = useDisableReviewLogin();

  const [phone, setPhone] = useState("");
  const [days, setDays] = useState<ReviewLoginDurationDays>(14);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [issued, setIssued] = useState<ReviewLoginIssued | null>(null);

  const busy = enable.isPending || regenerate.isPending || disable.isPending;

  const handleEnable = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setPhoneError(parsed.error.issues[0]?.message ?? "Enter a valid phone number");
      return;
    }
    setPhoneError(null);
    try {
      setIssued(await enable.mutateAsync({ phone: parsed.data, days }));
      setPhone("");
    } catch {
      // The mutation already shows the backend's error.
    }
  };

  const handleRegenerate = async () => {
    try {
      setIssued(await regenerate.mutateAsync(undefined));
    } catch {
      // The mutation already shows the backend's error.
    }
  };

  const handleDisable = async () => {
    try {
      await disable.mutateAsync(undefined);
      setIssued(null);
    } catch {
      // The mutation already shows the backend's error.
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showSuccessToast("Code copied", { id: TOAST_IDS.REVIEW_LOGIN.SAVE });
    } catch {
      showErrorToast("Could not copy. Select the code and copy it manually.", {
        id: TOAST_IDS.REVIEW_LOGIN.SAVE,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" />
          App store review login
        </CardTitle>
        <CardDescription>
          Lets Google Play reviewers sign in to the mobile app with one phone number and a code
          generated here, because they cannot receive a WhatsApp OTP. Works only for a patient
          account or a new number. Staff accounts always get a real OTP.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-6">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading status...
          </div>
        ) : status?.enabled ? (
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge>On</Badge>
              <span className="text-sm">
                Phone <span className="font-medium">{status.phone}</span>
              </span>
              <span className="text-sm text-muted-foreground">
                Switches off {formatDate(status.expiresAt)}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleRegenerate} disabled={busy}>
                <RefreshCw className="size-4" />
                Generate new code
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={busy}>
                    Turn off
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Turn off review login?</AlertDialogTitle>
                    <AlertDialogDescription>
                      The code stops working immediately. If Google is still reviewing the app,
                      the review may fail.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDisable}>Turn off</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-y-4">
            <Badge variant="secondary" className="w-fit">
              Off
            </Badge>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="reviewLoginPhone">Reviewer phone number</Label>
                <Input
                  id="reviewLoginPhone"
                  inputMode="tel"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  aria-invalid={Boolean(phoneError)}
                />
                {phoneError ? (
                  <p className="text-sm text-destructive">{phoneError}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Use a number the clinic controls that no patient or staff member uses.
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-y-2">
                <Label htmlFor="reviewLoginDays">Keep it on for</Label>
                <Select
                  value={String(days)}
                  onValueChange={(value) => setDays(Number(value) as ReviewLoginDurationDays)}
                >
                  <SelectTrigger id="reviewLoginDays">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_LOGIN_DURATION_DAYS.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} days
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-fit" onClick={handleEnable} disabled={busy}>
              {enable.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              Turn on and generate code
            </Button>
          </div>
        )}

        {issued ? (
          <div className="flex flex-col gap-y-3 rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950">
            <p className="text-sm font-medium">
              Copy this code now. It is shown only once and cannot be viewed again.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <code className="rounded bg-background px-3 py-2 font-mono text-2xl tracking-widest">
                {issued.otp}
              </code>
              <Button variant="outline" size="sm" onClick={() => copyCode(issued.otp)}>
                <Copy className="size-4" />
                Copy
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIssued(null)}>
                Hide
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              In Play Console, go to App content, then Sign-in details, and enter{" "}
              {issued.status.phone} with this code.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
