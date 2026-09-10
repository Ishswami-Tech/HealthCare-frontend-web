"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageShell";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  CreditCard,
  RefreshCcw,
  CalendarDays,
  TicketCheck,
  Repeat2,
  XCircle,
  ChevronRight,
  Info,
  Loader2,
} from "lucide-react";
import { showErrorToast, showInfoToast, showSuccessToast } from "@/hooks/utils/use-toast";
import { formatDateInIST } from "@/lib/utils/date-time";
import type { Subscription } from "@/types/billing.types";
import {
  getSubscriptions,
  cancelSubscription,
  renewSubscription,
} from "@/lib/actions/billing.server";

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return formatDateInIST(value, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_COPY: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-500 text-white",
  },
  TRIALING: {
    label: "Trial",
    className: "bg-sky-500 text-white",
  },
  PAST_DUE: {
    label: "Past Due",
    className: "bg-amber-500 text-white",
  },
  PAUSED: {
    label: "Paused",
    className: "bg-orange-500 text-white",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-red-500 text-white",
  },
  INCOMPLETE: {
    label: "Incomplete",
    className: "bg-slate-500 text-white",
  },
  INCOMPLETE_EXPIRED: {
    label: "Expired",
    className: "bg-slate-500 text-white",
  },
};

function PlanLinkRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | number;
  icon?: React.ReactNode;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium text-foreground">{String(value)}</span>
    </div>
  );
}

function SubscriptionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, isPending: isAuthPending } = useAuth();
  const clinicId = useCurrentClinicId();
  useWebSocketQuerySync();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [renewId, setRenewId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const userId = useMemo(() => (session?.user?.id || "").trim(), [session?.user?.id]);
  const currentRole = (session?.user?.role as Role) || Role.PATIENT;

  const loadSubscriptions = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);

    const result = await getSubscriptions(userId);
    if (!result.success) {
      setError(result.error || "Failed to load subscriptions");
    } else if (result.subscriptions) {
      setSubscriptions(result.subscriptions);
    }

    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  useEffect(() => {
    const errorToast = searchParams.get("error");
    if (errorToast) {
      showErrorToast(errorToast);
    }
  }, [searchParams]);

  const handleCancel = useCallback(async () => {
    if (!cancelId) return;
    setCancelling(true);
    const result = await cancelSubscription(cancelId);
    setCancelling(false);
    setCancelId(null);

    if (result.success) {
      showSuccessToast("Subscription cancelled successfully.");
      if (result.subscription) {
        setSubscriptions((current) =>
          current.map((subscription) => (subscription.id === result.subscription?.id ? result.subscription! : subscription))
        );
      } else {
        void loadSubscriptions();
      }
      return;
    }

    showErrorToast(result.error || "Failed to cancel subscription.");
  }, [cancelId, loadSubscriptions]);

  const handleRenew = useCallback(async () => {
    if (!renewId) return;
    setRenewing(true);
    const result = await renewSubscription(renewId);
    setRenewing(false);
    setRenewId(null);

    if (result.success) {
      showSuccessToast("Subscription renewed successfully.");
      if (result.subscription) {
        setSubscriptions((current) =>
          current.map((subscription) => (subscription.id === result.subscription?.id ? result.subscription! : subscription))
        );
      } else {
        void loadSubscriptions();
      }
      return;
    }

    showErrorToast(result.error || "Failed to renew subscription.");
  }, [renewId, loadSubscriptions]);

  const activeSubscriptions = useMemo(
    () => subscriptions.filter((subscription) => subscription.status === "ACTIVE" || subscription.status === "TRIALING"),
    [subscriptions]
  );

  if (isAuthPending && !session?.user) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading subscriptions&hellip;
        </CardContent>
      </Card>
    );
  }

  const renderEmptyState = () => (
    <Card className="rounded-2xl border-dashed border-border/70 bg-muted/30">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <CreditCard className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-foreground">No subscriptions found</p>
          <p className="text-sm text-muted-foreground">
            You haven&apos;t subscribed to any billing plans yet. Browse available plans to get started.
          </p>
        </div>
        <Button
          variant="outline"
          className="mt-2 rounded-xl"
          onClick={() => router.push("/billing")}
        >
          Browse Plans
          <ChevronRight className="ml-2 size-4" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderCard = (subscription: Subscription) => {
    const plan = subscription.plan;
    const statusConfig = STATUS_COPY[subscription.status] ?? {
      label: subscription.status,
      className: "bg-slate-500 text-white",
    };
    const isCancelling = cancelling && cancelId === subscription.id;
    const isRenewing = renewing && renewId === subscription.id;
    const limit = subscription.appointmentsLimit ?? subscription.appointmentsUsed + (subscription.appointmentsRemaining ?? 0);
    const remainingVisits =
      subscription.remainingVisits ?? subscription.appointmentsRemaining ?? 0;
    const visitsLabel =
      plan?.isUnlimitedAppointments && !subscription.appointmentsLimit
        ? "Unlimited"
        : remainingVisits === 0 && subscription.appointmentsUsed === 0 && !limit
          ? "—"
          : `${subscription.appointmentsUsed} used${limit ? ` / ${limit}` : ""}`;

    const isCancelled = subscription.status === "CANCELLED";
    const isPastDue = subscription.status === "PAST_DUE";

    return (
      <Card
        key={subscription.id}
        className="rounded-2xl border-border/70 shadow-sm ring-1 ring-border/40 transition-all hover:shadow-md"
      >
        <CardContent className="py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-[#006951] text-base">{plan?.name || "Subscription Plan"}</span>
                <Badge className={`rounded-full px-3 py-1 font-bold uppercase text-[10px] tracking-wider border-none shadow-sm ${statusConfig.className}`}>
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                <PlanLinkRow
                  label="Start Date"
                  value={formatDate(subscription.startDate)}
                  icon={<CalendarDays className="size-3.5 text-muted-foreground" />}
                />
                <PlanLinkRow
                  label="End Date"
                  value={formatDate(subscription.endDate || subscription.currentPeriodEnd)}
                  icon={<CalendarDays className="size-3.5 text-muted-foreground" />}
                />
                <PlanLinkRow
                  label="Visits"
                  value={visitsLabel}
                  icon={<TicketCheck className="size-3.5 text-muted-foreground" />}
                />
                <PlanLinkRow
                  label="Auto-Renew"
                  value={subscription.autoRenew ? "On" : "Off"}
                  icon={<Repeat2 className="size-3.5 text-muted-foreground" />}
                />
              </div>
              {subscription.status === "PAST_DUE" && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Payment is past due. Renewing may resolve the issue.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
              {!isCancelled && !isPastDue && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setCancelId(subscription.id)}
                  disabled={isCancelling || isRenewing}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Cancelling
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 size-4" />
                      Cancel
                    </>
                  )}
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-xl bg-[#006951] hover:bg-[#005a45]"
                onClick={() => setRenewId(subscription.id)}
                disabled={isCancelling || isRenewing}
              >
                {isRenewing ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Renewing
                  </>
                ) : (
                  <>
                    <RefreshCcw className="mr-2 size-4" />
                    Renew
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="flex flex-col max-w-6xl mx-auto gap-y-6 p-6">
        <DashboardPageHeader
          eyebrow="BILLING"
          title="My Subscriptions"
          description="Manage your active subscriptions, renewal preferences, and visit usage."
          actionsSlot={
            <Button
              variant="outline"
              className="h-10 px-4 rounded-xl flex items-center gap-2"
              onClick={() => void loadSubscriptions()}
            >
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
          }
        />

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="py-4 text-sm text-destructive">
              {error}
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 size-6 animate-spin text-muted-foreground" />
              Loading subscriptions&hellip;
            </CardContent>
          </Card>
        ) : (
          <>
            {subscriptions.length === 0 ? (
              renderEmptyState()
            ) : (
              <div className="flex flex-col gap-3">{subscriptions.map(renderCard)}</div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!cancelId} onOpenChange={(open) => !open && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? You will lose access to
              the remaining benefits associated with this plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setCancelId(null)}
              disabled={cancelling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => void handleCancel()}
              disabled={cancelling}
            >
              {cancelling ? "Cancelling…" : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renewId} onOpenChange={(open) => !open && setRenewId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Renew subscription</DialogTitle>
            <DialogDescription>
              Renew this subscription to continue enjoying the plan benefits for another
              billing cycle.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-xl"
              onClick={() => setRenewId(null)}
              disabled={renewing}
            >
              Not Now
            </Button>
            <Button
              className="rounded-xl bg-[#006951] hover:bg-[#005a45]"
              onClick={() => void handleRenew()}
              disabled={renewing}
            >
              {renewing ? "Renewing…" : "Confirm Renewal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={null}>
      <ProtectedRoute
        permission={Permission.VIEW_BILLING}
        allowedRoles={[
          Role.PATIENT,
          Role.CLINIC_ADMIN,
          Role.SUPER_ADMIN,
        ]}
      >
        <SubscriptionsPageContent />
      </ProtectedRoute>
    </Suspense>
  );
}
