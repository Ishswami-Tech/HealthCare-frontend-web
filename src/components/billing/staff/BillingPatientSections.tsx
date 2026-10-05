"use client";

import { AlertCircle, CreditCard, Receipt, RefreshCw, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, Kpi, Note, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import type { BillingPlan, Payment, Subscription } from "@/types/billing.types";
import { formatBillingDate, formatRupees } from "./billing.logic";

/** The four numbers a patient sees above the tabs. */
export function PatientBillingStats({
  totalPaid,
  totalPending,
  activeSubscriptions,
  lastPayment,
}: {
  totalPaid: number;
  totalPending: number;
  activeSubscriptions: number;
  lastPayment?: Payment | undefined;
}) {
  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-4 @md:grid-cols-2 @5xl:grid-cols-4">
        <Kpi label="Amount Paid" value={formatRupees(totalPaid)} icon={Wallet} tone="mint" />
        <Kpi label="Pending Amount" value={formatRupees(totalPending)} icon={AlertCircle} tone="amber" />
        <Kpi label="Active Plan" value={activeSubscriptions > 0 ? activeSubscriptions : "None"} icon={CreditCard} tone="mint" />
        <Kpi
          label="Last Payment"
          value={lastPayment ? formatRupees(lastPayment.amount) : "None"}
          hint={lastPayment ? formatBillingDate(lastPayment.paymentDate ?? lastPayment.createdAt) : undefined}
          icon={Receipt}
          tone="mint"
        />
      </div>
    </div>
  );
}

/** Shown to a patient with no active subscription. */
export function NoActivePlanNote({ onViewPlans }: { onViewPlans: () => void }) {
  return (
    <Surface className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-3 border border-dashed border-[#93c5fd] bg-[#eef6ff] px-4 py-3.5 shadow-none dark:border-blue-800 dark:bg-blue-950/30">
      <span className="flex min-w-0 flex-col text-[13px] text-[#1e3a8a] dark:text-blue-200">
        <strong className="text-sm font-bold">No active plan</strong>
        <span>Subscribe to a plan to unlock in-person appointment booking.</span>
      </span>
      <Button onClick={onViewPlans}>View Plans</Button>
    </Surface>
  );
}

export function PatientPlansTab({
  plans,
  activePlanId,
  subscribeError,
  loading = false,
  onChoosePlan,
  onReload,
}: {
  plans: BillingPlan[];
  loading?: boolean;
  /** Plan of the active (or trial) subscription, if any. */
  activePlanId?: string | undefined;
  subscribeError?: string;
  onChoosePlan: (plan: BillingPlan) => void;
  onReload: () => void;
}) {
  if (loading && plans.length === 0) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading plans">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-[196px] rounded-[20px]" />
        ))}
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={CreditCard}
          title="No subscription plans available right now"
          description="Please refresh or contact clinic admin to publish billing plans for this clinic."
          action={
            <Button variant="outline" size="md" onClick={onReload}>
              <RefreshCw />
              Reload Plans
            </Button>
          }
        />
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {subscribeError ? (
        <Note tone="rose" icon={AlertCircle}>
          <span role="alert">{subscribeError}</span>
        </Note>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Surface key={plan.id} as="article" className="gap-3">
            <h3 className="m-0 text-lg font-extrabold text-ink">{plan.name}</h3>
            <p className="m-0 flex items-baseline gap-1.5">
              <span className="text-[28px] font-extrabold leading-tight tracking-[-0.5px] text-brand">
                {formatRupees(plan.price)}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.6px] text-ink-muted">
                / {plan.billingCycle.toLowerCase()}
              </span>
            </p>
            <div>
              {plan.isUnlimitedAppointments ? (
                <Pill tone="green">Unlimited Appointments</Pill>
              ) : (
                <Pill tone="blue">{plan.appointmentsIncluded || 0} Appointments</Pill>
              )}
            </div>
            <div className="mt-auto border-t border-hair pt-4">
              {activePlanId === plan.id ? (
                <div className="flex h-11 items-center justify-center rounded-xl bg-mint-soft">
                  <Pill tone="green">Current Plan</Pill>
                </div>
              ) : (
                <Button variant="action" size="md" className="w-full" onClick={() => onChoosePlan(plan)}>
                  Subscribe & Pay
                </Button>
              )}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function PatientSubscriptionsTab({
  subscriptions,
  loading = false,
}: {
  subscriptions: Subscription[];
  loading?: boolean;
}) {
  if (loading && subscriptions.length === 0) {
    return <Skeleton className="h-[72px] w-full rounded-[20px]" aria-busy="true" aria-label="Loading subscriptions" />;
  }

  if (subscriptions.length === 0) {
    return (
      <Surface flush>
        <EmptyBlock
          icon={CreditCard}
          title="No subscriptions found"
          description="You haven't subscribed to any billing plans yet."
        />
      </Surface>
    );
  }

  return (
    <Surface flush as="section" aria-label="Subscriptions">
      <ul className="m-0 list-none p-0">
        {subscriptions.map((subscription) => (
          <li
            key={subscription.id}
            className="flex flex-wrap items-center gap-3.5 border-b border-hair px-5 py-3.5 last:border-b-0"
          >
            <IconBox icon={CreditCard} tone="mint" />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm font-bold text-ink">{subscription.plan?.name || "Subscription Plan"}</span>
              <span className="text-xs text-ink-muted">
                Started on{" "}
                <span className="font-semibold text-ink-soft">
                  {subscription.startDate ? formatBillingDate(subscription.startDate) : "Not available"}
                </span>
              </span>
            </span>
            <Pill tone={subscription.status === "TRIALING" ? "blue" : statusTone(subscription.status)}>
              {statusLabel(subscription.status)}
            </Pill>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
