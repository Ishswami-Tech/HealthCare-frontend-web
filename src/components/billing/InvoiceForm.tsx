"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Invoice } from "@/types/billing.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateField, FIELD_LABEL, Field } from "@/components/tbd";
import { useCurrentClinicId } from "@/hooks/query/useClinics";
import { useCreateInvoice } from "@/hooks/query/useBilling";
import { usePatients } from "@/hooks/query/usePatients";
import { formatISODateInIST } from "@/lib/utils/date-time";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import {
  INVOICE_PATIENT_SEARCH_MIN,
  InvoicePatientPicker,
  toInvoicePatients,
  type InvoicePatient,
  type InvoicePatientSearchStatus,
} from "./InvoicePatientPicker";

/** How many matches the patient search asks for. */
const PATIENT_RESULT_LIMIT = 8;

interface InvoiceFormProps {
  invoice?: Invoice;
  onSuccess?: (invoice: Invoice) => void;
  onCancel?: () => void;
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const clinicContextId = useCurrentClinicId();
  const createInvoice = useCreateInvoice();

  const clinicId = clinicContextId || invoice?.clinicId || "";

  // An invoice belongs to the PATIENT: `userId` is the patient's user id, never the id of the
  // staff member who writes the invoice. The patient is picked from the clinic's patients.
  const [patient, setPatient] = useState<InvoicePatient | null>(
    invoice?.userId
      ? { userId: invoice.userId, name: invoice.patientName || "Patient", detail: "" }
      : null
  );
  const [patientSearch, setPatientSearch] = useState("");
  const [patientTerm, setPatientTerm] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setPatientTerm(patientSearch.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [patientSearch]);
  const canSearchPatients = !patient && !!clinicId && patientTerm.length >= INVOICE_PATIENT_SEARCH_MIN;
  const patientsQuery = usePatients(
    clinicId,
    { search: patientTerm, limit: PATIENT_RESULT_LIMIT },
    { enabled: canSearchPatients }
  );
  const patientResults = useMemo(() => toInvoicePatients(patientsQuery.data), [patientsQuery.data]);
  const typing = patientSearch.trim() !== patientTerm;
  const patientStatus: InvoicePatientSearchStatus =
    patientSearch.trim().length < INVOICE_PATIENT_SEARCH_MIN
      ? "idle"
      : !clinicId
        ? "error"
        : typing || patientsQuery.isFetching
          ? "loading"
          : patientsQuery.error
            ? "error"
            : patientResults.length === 0
              ? "empty"
              : "ready";
  const userId = patient?.userId ?? "";

  const [formState, dispatch] = useReducer(
    (
      state: {
        amount: number;
        description: string;
        dueDate: string;
        quantity: number;
        unitPrice: number;
      },
      action:
        | { type: "setAmount"; value: number }
        | { type: "setDescription"; value: string }
        | { type: "setDueDate"; value: string }
        | { type: "setQuantity"; value: number }
        | { type: "setUnitPrice"; value: number }
    ) => {
      switch (action.type) {
        case "setAmount":
          return { ...state, amount: action.value };
        case "setDescription":
          return { ...state, description: action.value };
        case "setDueDate":
          return { ...state, dueDate: action.value };
        case "setQuantity":
          return { ...state, quantity: action.value };
        case "setUnitPrice":
          return { ...state, unitPrice: action.value };
        default:
          return state;
      }
    },
    {
      amount: invoice?.amount || 0,
      description: invoice?.items?.[0]?.description || "",
      dueDate: invoice?.dueDate ? formatISODateInIST(invoice.dueDate) : formatISODateInIST(new Date()),
      quantity: invoice?.items?.[0]?.quantity || 1,
      unitPrice: invoice?.items?.[0]?.unitPrice || 0,
    }
  );
  const { amount, description, dueDate, quantity, unitPrice } = formState;
  const setAmount = (value: number) => dispatch({ type: "setAmount", value });
  const setDescription = (value: string) => dispatch({ type: "setDescription", value });
  const setDueDate = (value: string) => dispatch({ type: "setDueDate", value });
  const setQuantity = (value: number) => dispatch({ type: "setQuantity", value });
  const setUnitPrice = (value: number) => dispatch({ type: "setUnitPrice", value });

  const lineTotal = quantity * unitPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !clinicId) return;

    const payload = {
      userId,
      clinicId,
      // The total field shows the line total until someone types another amount.
      amount: amount || lineTotal,
      dueDate,
      description: description || "Consultation Charges",
      lineItems: {
        items: [
          {
            id: invoice?.items?.[0]?.id || `item-${Date.now()}`,
            description: description || "Consultation Charges",
            quantity,
            unitPrice,
            amount: lineTotal || amount,
          },
        ],
      },
    };

    const created = await createInvoice.mutateAsync(payload);
    if (created?.invoice && onSuccess) {
      onSuccess(created.invoice);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-4">
      <div className="flex flex-col gap-1.5">
        <span id="invoice-patient-label" className={FIELD_LABEL}>
          Patient
          <span className="text-brand" aria-hidden="true">
            {" "}
            *
          </span>
          <span className="sr-only">(required)</span>
        </span>
        <InvoicePatientPicker
          labelId="invoice-patient-label"
          selected={patient}
          onSelect={(picked) => {
            setPatient(picked);
            setPatientSearch("");
          }}
          onClear={() => setPatient(null)}
          search={patientSearch}
          onSearchChange={setPatientSearch}
          results={patientResults}
          status={patientStatus}
          errorMessage={
            !clinicId
              ? "No clinic is selected, so patients cannot be searched."
              : patientsQuery.error
                ? sanitizeErrorMessage(patientsQuery.error) || "Could not search patients."
                : undefined
          }
        />
      </div>
      <Field label="Description" htmlFor="invoice-description">
        <Input
          id="invoice-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Consultation Charges"
        />
      </Field>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Quantity" htmlFor="invoice-quantity">
          <Input
            id="invoice-quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
        </Field>
        <Field label="Unit Price" htmlFor="invoice-unit-price">
          <Input
            id="invoice-unit-price"
            type="number"
            min={0}
            value={unitPrice}
            onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <Field label="Total Amount" htmlFor="invoice-total">
        <Input
          id="invoice-total"
          type="number"
          min={0}
          value={amount || lineTotal}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />
      </Field>
      <Field label="Due Date" htmlFor="invoice-due-date">
        <DateField id="invoice-due-date" value={dueDate} onChange={setDueDate} />
      </Field>
      <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={createInvoice.isPending || !userId || !clinicId}>
          {createInvoice.isPending ? "Saving…" : "Save Invoice"}
        </Button>
      </div>
    </form>
  );
}


