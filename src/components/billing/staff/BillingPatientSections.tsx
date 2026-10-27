"use client";

import { AlertCircle, CalendarDays, CreditCard, Receipt, RefreshCw, TicketCheck, Wallet, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, Kpi, Note, Pill, Surface, statusLabel, statusTone } from "@/components/tbd";
import type { BillingPlan, Payment, Subscription } from "@/types/billing.types";
import { formatBillingDate } from "./billing.logic";
import { formatRupees } from "@/lib/utils/currency";

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

/** The patient's own current subscription — status, period, visit usage, cancel/renew. Sits
 * above the plan grid so "what I have" and "what I could switch to" are one view, not two tabs. */
export function ActiveSubscriptionCard({
  subscription,
  onCancel,
  onRenew,
  cancelling = false,
  renewing = false,
}: {
  subscription: Subscription;
  onCancel: () => void;
  onRenew: () => void;
  cancelling?: boolean;
  renewing?: boolean;
}) {
  const plan = subscription.plan;
  const isCancelled = subscription.status === "CANCELLED";
  const isPastDue = subscription.status === "PAST_DUE";
  const limit = subscription.appointmentsLimit ?? subscription.appointmentsUsed + (subscription.appointmentsRemaining ?? 0);
  const remainingVisits = subscription.remainingVisits ?? subscription.appointmentsRemaining ?? 0;
  const visitsLabel =
    plan?.isUnlimitedAppointments && !subscription.appointmentsLimit
      ? "Unlimited"
      : remainingVisits === 0 && subscription.appointmentsUsed === 0 && !limit
        ? "—"
        : `${subscription.appointmentsUsed} used${limit ? ` / ${limit}` : ""}`;

  return (
    <Surface as="section" aria-label="Your current plan" className="gap-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-extrabold text-ink">{plan?.name || "Subscription Plan"}</span>
            <Pill tone={subscription.status === "TRIALING" ? "blue" : statusTone(subscription.status)}>
              {statusLabel(subscription.status)}
            </Pill>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              Started {formatBillingDate(subscription.startDate)}
            </span>
            {subscription.endDate || subscription.currentPeriodEnd ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" aria-hidden="true" />
                {isCancelled ? "Ended" : "Renews"} {formatBillingDate(subscription.endDate || subscription.currentPeriodEnd)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <TicketCheck className="size-3.5" aria-hidden="true" />
              {visitsLabel} visits
            </span>
          </div>
          {isPastDue ? (
            <p className="m-0 text-xs font-semibold text-amber-600 dark:text-amber-400">
              Payment is past due. Renewing may resolve the issue.
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isCancelled && !isPastDue ? (
            <Button variant="outline" size="sm" onClick={onCancel} disabled={cancelling || renewing}>
              <XCircle />
              {cancelling ? "Cancelling…" : "Cancel"}
            </Button>
          ) : null}
          <Button size="sm" onClick={onRenew} disabled={cancelling || renewing}>
            <RefreshCw />
            {renewing ? "Renewing…" : "Renew"}
          </Button>
        </div>
      </div>
    </Surface>
  );
}

export function PatientPlansTab({
  plans,
  activePlanId,
  activeSubscription,
  subscribeError,
  loading = false,
  onChoosePlan,
  onReload,
  onCancelSubscription,
  onRenewSubscription,
  cancellingSubscription = false,
  renewingSubscription = false,
}: {
  plans: BillingPlan[];
  loading?: boolean;
  /** Plan of the active (or trial) subscription, if any. */
  activePlanId?: string | undefined;
  /** The full active subscription record, shown above the plan grid. */
  activeSubscription?: Subscription | undefined;
  subscribeError?: string;
  onChoosePlan: (plan: BillingPlan) => void;
  onReload: () => void;
  onCancelSubscription?: (subscription: Subscription) => void;
  onRenewSubscription?: (subscription: Subscription) => void;
  cancellingSubscription?: boolean;
  renewingSubscription?: boolean;
}) {
  const activeCard =
    activeSubscription && onCancelSubscription && onRenewSubscription ? (
      <ActiveSubscriptionCard
        subscription={activeSubscription}
        onCancel={() => onCancelSubscription(activeSubscription)}
        onRenew={() => onRenewSubscription(activeSubscription)}
        cancelling={cancellingSubscription}
        renewing={renewingSubscription}
      />
    ) : null;

  if (loading && plans.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {activeCard}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading plans">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[196px] rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {activeCard}
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activeCard}
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

