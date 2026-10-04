"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { AlertCircle, Loader2, Lock, Save, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, IconBox, Surface } from "@/components/tbd";
import type { PharmacistProfileForm } from "./pharmacist-profile.logic";

interface PharmacistProfilePersonalCardProps {
  form: PharmacistProfileForm;
  onFieldChange: (field: keyof PharmacistProfileForm, value: string) => void;
  onSubmit: () => void;
  saving?: boolean;
  loading?: boolean;
  /** The profile could not be loaded: no form, so blank fields are never saved over it. */
  unavailable?: boolean;
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={htmlFor} className="flex min-h-5 items-center text-xs font-bold text-ink-soft">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={`${htmlFor}-hint`} className="m-0 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** "Personal Details" form. Props only — the save lives in the page. */
export function PharmacistProfilePersonalCard({
  form,
  onFieldChange,
  onSubmit,
  saving = false,
  loading = false,
  unavailable = false,
}: PharmacistProfilePersonalCardProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange(event.target.name as keyof PharmacistProfileForm, event.target.value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <Surface as="section" className="gap-4 p-[22px]" aria-labelledby="pharmacist-personal-title">
      <div className="flex items-center gap-3">
        <IconBox icon={UserRound} tone="mint" size={36} />
        <h2 id="pharmacist-personal-title" className="m-0 text-base font-bold text-ink">
          Personal Details
        </h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2" aria-busy="true" aria-label="Loading profile">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : unavailable ? (
        <EmptyBlock
          icon={AlertCircle}
          tone="rose"
          title="Your details are not loaded"
          description="The form opens once your profile has loaded."
        />
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="First Name" htmlFor="firstName">
              <Input id="firstName" name="firstName" autoComplete="given-name" value={form.firstName} onChange={handleChange} />
            </Field>
            <Field label="Last Name" htmlFor="lastName">
              <Input id="lastName" name="lastName" autoComplete="family-name" value={form.lastName} onChange={handleChange} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Email Address" htmlFor="email" hint="Email cannot be changed directly">
              <div className="relative">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  readOnly
                  aria-readonly="true"
                  aria-describedby="email-hint"
                  className="bg-well pr-10 text-ink-soft focus-visible:border-line focus-visible:ring-0 dark:bg-well"
                />
                <Lock
                  className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-muted"
                  aria-hidden="true"
                />
              </div>
            </Field>
            <Field label="Phone Number" htmlFor="phone">
              <Input id="phone" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={handleChange} />
            </Field>
          </div>

          <Field label="Address" htmlFor="address">
            <Input id="address" name="address" autoComplete="street-address" value={form.address} onChange={handleChange} />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="City" htmlFor="city">
              <Input id="city" name="city" autoComplete="address-level2" value={form.city} onChange={handleChange} />
            </Field>
            <Field label="State" htmlFor="state">
              <Input id="state" name="state" autoComplete="address-level1" value={form.state} onChange={handleChange} />
            </Field>
            <Field label="Zip Code" htmlFor="zipCode">
              <Input id="zipCode" name="zipCode" autoComplete="postal-code" value={form.zipCode} onChange={handleChange} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Specialization" htmlFor="specialization">
              <Input
                id="specialization"
                name="specialization"
                placeholder="e.g. Clinical Pharmacy"
                value={form.specialization}
                onChange={handleChange}
              />
            </Field>
            <Field label="Years of Experience" htmlFor="experience">
              <Input
                id="experience"
                name="experience"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.experience}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-1">
            <Button type="submit" size="md" className="w-full sm:w-auto" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      )}
    </Surface>
  );
}
