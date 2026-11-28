"use client";

import { useMemo, useState } from "react";
import { meaningfulPayments } from "@/components/billing/PaymentHistory";
import { usePayments } from "@/hooks/query/useBilling";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { PatientTransactionsView, type TransactionFilter } from "./PatientTransactionsView";
import { usePatientBillingIdentity } from "./usePatientBilling";

/** Data container for All transactions: the patient's own payments (`usePayments`). */
export function PatientTransactionsContent() {
  const { userId, clinicId } = usePatientBillingIdentity();
  const [filter, setFilter] = useState<TransactionFilter>("all");

  useWebSocketQuerySync();

  const { data: allPayments = [], isPending, error, refetch } = usePayments(userId, clinicId);
  // Real transactions only: superseded / expired attempts hidden, one pending row per invoice.
  const payments = useMemo(() => meaningfulPayments(allPayments), [allPayments]);

  return (
    <PatientTransactionsView
      payments={payments}
      loading={isPending}
      failed={!!error && payments.length === 0}
      loadError={error instanceof Error ? error.message : ""}
      onRetry={() => void refetch()}
      filter={filter}
      onFilterChange={setFilter}
    />
  );
}
