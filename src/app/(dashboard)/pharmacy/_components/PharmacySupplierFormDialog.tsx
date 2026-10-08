"use client";

import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DialogError,
  Field,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  fieldAria,
} from "./PharmacyDialogParts";
import type { SupplierCard } from "./pharmacy-inventory.logic";
import { SUPPLIER_DEFAULTS, supplierSchema, type SupplierValues } from "./pharmacy-inventory.schemas";

export interface PharmacySupplierFormDialogProps {
  open: boolean;
  /** The supplier being edited; undefined adds a new one. */
  supplier?: SupplierCard | null;
  isSaving?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: SupplierValues) => void;
  onClose: () => void;
}

/** Adds a supplier (partner pharmacy) or edits one. Used on the Partner Pharmacies tab and from New order. */
export function PharmacySupplierFormDialog({
  open,
  supplier = null,
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: PharmacySupplierFormDialogProps) {
  return (
    <PharmacyDialog
      open={open}
      onClose={onClose}
      busy={isSaving}
      title={supplier ? "Edit supplier" : "Add supplier"}
      description={supplier ? supplier.name : "A pharmacy or distributor the clinic orders medicines from."}
      width={600}
    >
      {open ? (
        <SupplierForm
          key={supplier?.id ?? "new"}
          supplier={supplier}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </PharmacyDialog>
  );
}

function SupplierForm({
  supplier,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  supplier: SupplierCard | null;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (values: SupplierValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: supplier
      ? {
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
        }
      : SUPPLIER_DEFAULTS,
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        <Field label="Supplier name" htmlFor={id("name")} error={errors.name?.message}>
          <Input
            {...register("name")}
            {...fieldAria(id("name"), errors.name?.message)}
            placeholder="City Pharma Distributors"
            autoComplete="off"
          />
        </Field>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Contact person (optional)" htmlFor={id("contactPerson")} error={errors.contactPerson?.message}>
            <Input
              {...register("contactPerson")}
              {...fieldAria(id("contactPerson"), errors.contactPerson?.message)}
              autoComplete="off"
            />
          </Field>
          <Field label="Phone (optional)" htmlFor={id("phone")} error={errors.phone?.message}>
            <Input
              inputMode="tel"
              {...register("phone")}
              {...fieldAria(id("phone"), errors.phone?.message)}
              placeholder="+91 98765 43210"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field label="Email (optional)" htmlFor={id("email")} error={errors.email?.message}>
          <Input
            type="email"
            {...register("email")}
            {...fieldAria(id("email"), errors.email?.message)}
            placeholder="orders@citypharma.example"
            autoComplete="off"
          />
        </Field>
        <Field label="Address (optional)" htmlFor={id("address")} error={errors.address?.message}>
          <Textarea
            {...register("address")}
            {...fieldAria(id("address"), errors.address?.message)}
            className="min-h-16"
          />
        </Field>
        <DialogError lead="The supplier was not saved." message={errorMessage} />
      </PharmacyDialogBody>

      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button size="md" type="submit" disabled={isSaving}>
          <Save aria-hidden="true" />
          {isSaving ? "Saving…" : supplier ? "Save changes" : "Add supplier"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}
