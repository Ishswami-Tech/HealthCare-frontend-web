"use client";

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Note } from "@/components/tbd";
import type { BillingPlan } from "@/types/billing.types";
import { formatRupees } from "./billing.logic";

export type PlanCycle = "MONTHLY" | "QUARTERLY" | "YEARLY";

export interface PlanFormState {
  name: string;
  price: string;
  cycle: PlanCycle;
  appointments: string;
  unlimited: boolean;
  error: string;
}

export const EMPTY_PLAN_FORM: PlanFormState = {
  name: "",
  price: "",
  cycle: "MONTHLY",
  appointments: "",
  unlimited: false,
  error: "",
};

/** "New Invoice": the form itself is passed in by the container. */
export function CreateInvoiceDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>Add the charge, the amount and the due date.</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  form,
  onChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: PlanFormState;
  onChange: (patch: Partial<PlanFormState>) => void;
  onSubmit: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Billing Plan</DialogTitle>
          <DialogDescription>Patients can subscribe to this plan from their billing page.</DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-3.5"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          {form.error ? (
            <Note tone="rose" icon={AlertCircle}>
              <span role="alert">{form.error}</span>
            </Note>
          ) : null}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="billing-plan-name">Plan name</Label>
            <Input
              id="billing-plan-name"
              placeholder="Monthly In-Person"
              value={form.name}
              onChange={(event) => onChange({ name: event.target.value, error: "" })}
            />
          </div>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billing-plan-price">Price in ₹</Label>
              <Input
                id="billing-plan-price"
                type="number"
                min={1}
                value={form.price}
                onChange={(event) => onChange({ price: event.target.value, error: "" })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label id="billing-plan-cycle-label">Billing cycle</Label>
              <Select value={form.cycle} onValueChange={(value) => onChange({ cycle: value as PlanCycle })}>
                <SelectTrigger aria-labelledby="billing-plan-cycle-label" className="w-full border-line">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <label htmlFor="billing-plan-unlimited" className="flex items-center gap-2 text-sm text-ink">
            <input
              id="billing-plan-unlimited"
              type="checkbox"
              className="size-4 accent-[#047857]"
              checked={form.unlimited}
              onChange={(event) => onChange({ unlimited: event.target.checked })}
            />
            Unlimited appointments
          </label>
          {!form.unlimited ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="billing-plan-appointments">Appointments included</Label>
              <Input
                id="billing-plan-appointments"
                type="number"
                min={1}
                value={form.appointments}
                onChange={(event) => onChange({ appointments: event.target.value })}
              />
            </div>
          ) : null}
          <Button type="submit" size="md" className="w-full" disabled={pending}>
            {pending ? "Creating…" : "Create Plan"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Patient confirms the plan before the subscription is created and the payment opens. */
export function ConfirmSubscriptionDialog({
  plan,
  error,
  pending,
  onConfirm,
  onClose,
}: {
  plan: BillingPlan | null;
  error: string;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!plan} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Subscription</DialogTitle>
          <DialogDescription>Check the plan, then continue to payment.</DialogDescription>
        </DialogHeader>
        {plan ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 rounded-[14px] bg-well p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 break-words text-base font-bold text-ink">{plan.name}</span>
                <span className="whitespace-nowrap text-base font-extrabold text-ink">{formatRupees(plan.price)}</span>
              </div>
              {plan.description ? <p className="m-0 text-[13px] text-ink-muted">{plan.description}</p> : null}
            </div>
            {error ? (
              <Note tone="rose" icon={AlertCircle}>
                <span role="alert">{error}</span>
              </Note>
            ) : null}
            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <Button variant="outline" size="md" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="action" size="md" onClick={onConfirm} disabled={pending}>
                {pending ? "Hold on..." : "Confirm & Pay"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Opens right after the subscription is created; the pay button is passed in by the container. */
export function SubscriptionPaymentDialog({
  open,
  onOpenChange,
  planName,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName?: string | undefined;
  children: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete Subscription Payment</DialogTitle>
          <DialogDescription>
            Plan: <span className="font-semibold text-ink">{planName || "-"}</span>
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
