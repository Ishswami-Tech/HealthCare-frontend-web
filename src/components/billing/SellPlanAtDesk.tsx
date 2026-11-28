"use client";

import { useMemo, useRef, useState } from "react";
import { BadgePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatRupees } from "@/components/appointments/booking/format";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useActiveSubscription,
  useBillingPlans,
  useCreateSubscription,
  useOpenDeskPlanInvoice,
  type DeskPlanInvoice,
} from "@/hooks/query/useBilling";
import { Role } from "@/types/auth.types";
import { planStatusOf } from "./plan-status.logic";

/**
 * Staff who may sell a plan at the desk. POST /billing/subscriptions allows these roles (finance
 * can collect an existing plan bill but cannot start a plan).
 */
const SELL_PLAN_ROLES: ReadonlySet<string> = new Set([Role.RECEPTIONIST, Role.CLINIC_ADMIN, Role.SUPER_ADMIN]);

const CYCLE_LABEL: Record<string, string> = {
  DAILY: "day",
  WEEKLY: "week",
  MONTHLY: "month",
  QUARTERLY: "quarter",
  YEARLY: "year",
};

interface SellPlanAtDeskProps {
  clinicId: string;
  patientUserId: string;
  /** The plan bill is ready: the caller opens its Collect dialog (cash / UPI at the desk). */
  onInvoiceReady: (invoice: DeskPlanInvoice) => void;
}

/**
 * Desk fallback for a plan purchase (reception can always help): pick one of the clinic's plans,
 * start it for the patient and open its bill for collection at the counter. The plan becomes
 * active once the payment is recorded. Prices and the bill total always come from the server.
 * Hidden when the patient already has an active plan or the staff role cannot sell one.
 */
export function SellPlanAtDesk({ clinicId, patientUserId, onInvoiceReady }: SellPlanAtDeskProps) {
  const { session } = useAuth();
  const role = String(session?.user?.role ?? "").toUpperCase();
  const canSell = SELL_PLAN_ROLES.has(role) && Boolean(clinicId && patientUserId);

  const active = useActiveSubscription(patientUserId, clinicId, canSell);
  const plans = useBillingPlans(clinicId, canSell);
  const createSubscription = useCreateSubscription();
  const openDeskInvoice = useOpenDeskPlanInvoice();

  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  const options = useMemo(
    () => (plans.data ?? []).filter((plan) => plan.isActive !== false && (!plan.clinicId || plan.clinicId === clinicId)),
    [plans.data, clinicId],
  );
  const busy = createSubscription.isPending || openDeskInvoice.isPending;

  if (!canSell || active.isPending || active.error || planStatusOf(active.data).active) return null;

  const submit = async () => {
    // Single flight: a double click must not start two plans.
    if (submitting.current || !planId || busy) return;
    submitting.current = true;
    setError(null);
    try {
      const subscription = await createSubscription.mutateAsync({ userId: patientUserId, clinicId, planId });
      if (!subscription?.id) throw new Error("The plan could not be started. Please try again.");
      const invoice = await openDeskInvoice.mutateAsync(subscription.id);
      setOpen(false);
      onInvoiceReady(invoice);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : "The plan could not be started.");
    } finally {
      submitting.current = false;
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="md"
        className="self-start"
        onClick={() => {
          setPlanId(options.length === 1 ? options[0]?.id ?? "" : "");
          setError(null);
          setOpen(true);
        }}
      >
        <BadgePlus aria-hidden="true" /> Sell plan
      </Button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sell a plan at the desk</DialogTitle>
            <DialogDescription>
              Pick the clinic&apos;s plan, then collect cash or UPI at the counter. The plan starts as soon as the
              payment is recorded.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-y-1">
            <Label htmlFor="sell-plan-select">Plan</Label>
            {plans.isPending ? (
              <p className="text-sm text-ink-muted">Loading plans…</p>
            ) : options.length === 0 ? (
              <p className="text-sm text-ink-muted">This clinic has no active plan to sell. A clinic admin can add one.</p>
            ) : (
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger id="sell-plan-select">
                  <SelectValue placeholder="Choose a plan" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} · {formatRupees(plan.price)}
                      {CYCLE_LABEL[plan.billingCycle] ? ` / ${CYCLE_LABEL[plan.billingCycle]}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-xs text-ink-muted">GST is added on the bill. The bill shows the exact amount to collect.</p>
          </div>

          {error ? (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={!planId || busy}>
              {busy ? "Starting…" : "Start plan and collect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
