"use client";

import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { AlertCircle, CircleAlert, Loader2 } from "lucide-react";
import { DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyBlock, Note, PageHead, Pill, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { LoadErrorNote, ProfileAvatar } from "./ProfileParts";
import {
  GENDER_OPTIONS,
  PROFILE_HUB_ROUTE,
  patientDisplayName,
  type PatientGender,
  type PatientProfileErrors,
  type PatientProfileField,
  type PatientProfileForm,
} from "./patient-profile.logic";

export interface PatientPersonalDetailsViewProps {
  form: PatientProfileForm;
  errors?: PatientProfileErrors;
  onFieldChange: (field: PatientProfileField, value: string) => void;
  onSubmit: () => void;
  saving?: boolean;
  /** Message of a save that failed. */
  saveError?: string | null;

  loading?: boolean;
  /** Set when the profile could not be loaded. */
  loadError?: string | null;
  onRetry?: (() => void) | undefined;

  photoUrl?: string | undefined;
  /** The saved mobile number is verified (hidden once the number is edited). */
  phoneVerified?: boolean;
}

const LABEL = "flex min-h-5 items-center gap-2 text-xs font-bold text-ink-soft";

/** Id of the input for a form field; the container uses it to focus the first field with an error. */
export const profileFieldId = (field: PatientProfileField) => `profile-${field}`;

function Field({
  field,
  label,
  error,
  hint,
  badge,
  className,
  children,
}: {
  field: PatientProfileField;
  label: string;
  error?: string | undefined;
  hint?: string;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const id = profileFieldId(field);
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className={LABEL}>
        {label}
        {badge}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="m-0 text-xs font-semibold text-[#be123c] dark:text-rose-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="m-0 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** "Personal details" form. Props only — loading the profile and the save live in the container. */
export function PatientPersonalDetailsView({
  form,
  errors = {},
  onFieldChange,
  onSubmit,
  saving = false,
  saveError = null,
  loading = false,
  loadError = null,
  onRetry,
  photoUrl,
  phoneVerified = false,
}: PatientPersonalDetailsViewProps) {
  const unavailable = Boolean(loadError) && !loading;
  const name = patientDisplayName(form);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFieldChange(event.target.name as PatientProfileField, event.target.value);
  };
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  /** The shared props of a text input bound to one form field. */
  const bind = (field: Exclude<PatientProfileField, "gender">, hasHint = false) => ({
    id: profileFieldId(field),
    name: field,
    value: form[field],
    onChange: handleChange,
    disabled: saving,
    "aria-invalid": errors[field] ? (true as const) : undefined,
    "aria-describedby": errors[field]
      ? `${profileFieldId(field)}-error`
      : hasHint
        ? `${profileFieldId(field)}-hint`
        : undefined,
  });

  return (
    <DashboardPageShell>
      <PageHead title="Personal details" backHref={PROFILE_HUB_ROUTE} />

      {loadError ? (
        <LoadErrorNote title="Your details could not be loaded." message={loadError} onRetry={onRetry} />
      ) : null}

      <Surface as="section" className="p-5 sm:p-7" aria-label="Personal details">
        {loading ? (
          <div className="flex flex-col gap-7 lg:flex-row" aria-busy="true" aria-label="Loading your details">
            <div className="flex shrink-0 flex-col items-center justify-center gap-4 lg:w-[232px] lg:border-r lg:border-hair lg:pr-7">
              <Skeleton className="size-32 rounded-full" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-[18px] sm:grid-cols-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : unavailable ? (
          <EmptyBlock
            icon={AlertCircle}
            tone="rose"
            title="Your details are not loaded"
            description="The form opens once your profile has loaded, so empty fields are never saved over it."
          />
        ) : (
          <div className="flex flex-col gap-7 lg:flex-row">
            <div className="flex shrink-0 flex-col items-center justify-center gap-3 border-b border-hair pb-6 lg:w-[232px] lg:border-r lg:border-b-0 lg:pr-7 lg:pb-0">
              <ProfileAvatar
                name={name}
                photoUrl={photoUrl}
                size={128}
                className="border-4 border-white shadow-[0_8px_20px_rgba(15,27,45,0.12)] dark:border-card"
              />
              {name ? <span className="text-center text-[15px] font-extrabold text-ink">{name}</span> : null}
              <span className="max-w-[180px] text-center text-xs text-ink-muted">
                Changing your photo is not available yet.
              </span>
            </div>

            <form onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-1 flex-col gap-[22px]">
              <div className="grid grid-cols-1 items-start gap-[18px] lg:grid-cols-2">
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2">
                  <Field field="firstName" label="First name" error={errors.firstName}>
                    <Input {...bind("firstName")} autoComplete="given-name" required />
                  </Field>
                  <Field field="lastName" label="Last name" error={errors.lastName}>
                    <Input {...bind("lastName")} autoComplete="family-name" required />
                  </Field>
                </div>
                <Field
                  field="phone"
                  label="Mobile number"
                  error={errors.phone}
                  badge={phoneVerified ? <Pill tone="green">Verified</Pill> : null}
                >
                  <Input {...bind("phone")} type="tel" inputMode="tel" autoComplete="tel" />
                </Field>

                <Field field="email" label="Email" error={errors.email}>
                  <Input {...bind("email")} type="email" inputMode="email" autoComplete="email" />
                </Field>
                <Field field="dateOfBirth" label="Date of birth" error={errors.dateOfBirth}>
                  <Input {...bind("dateOfBirth")} type="date" autoComplete="bday" />
                </Field>

                <fieldset className="m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0" disabled={saving}>
                  <legend className={cn(LABEL, "mb-1.5 p-0")}>Gender</legend>
                  <div className="grid grid-cols-3 gap-2">
                    {GENDER_OPTIONS.map((option) => {
                      const checked = form.gender === option.value;
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            "flex h-11 cursor-pointer items-center justify-center rounded-xl border-2 text-sm transition-colors",
                            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
                            checked
                              ? "border-[#047857] bg-mint-soft font-extrabold text-brand"
                              : "border-line bg-card font-semibold text-ink-soft hover:bg-mint-soft",
                          )}
                        >
                          <input
                            type="radio"
                            name="gender"
                            value={option.value}
                            checked={checked}
                            onChange={() => onFieldChange("gender", option.value satisfies PatientGender)}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <Field field="address" label="Address" error={errors.address}>
                  <Input {...bind("address")} autoComplete="street-address" />
                </Field>

                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3 lg:col-span-2">
                  <Field field="city" label="City" error={errors.city}>
                    <Input {...bind("city")} autoComplete="address-level2" />
                  </Field>
                  <Field field="state" label="State" error={errors.state}>
                    <Input {...bind("state")} autoComplete="address-level1" />
                  </Field>
                  <Field field="zipCode" label="PIN code" error={errors.zipCode}>
                    <Input {...bind("zipCode")} inputMode="numeric" autoComplete="postal-code" />
                  </Field>
                </div>
              </div>

              <fieldset className="m-0 flex min-w-0 flex-col gap-3 border-0 border-t border-hair p-0 pt-[18px]">
                <legend className="float-left m-0 p-0 text-sm font-bold text-ink">Emergency contact</legend>
                <p className="m-0 -mt-2 clear-both text-xs text-ink-muted">
                  Fill all three to change the person we call in an emergency. Leave them empty to keep the contact you
                  gave before.
                </p>
                <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-3">
                  <Field field="emergencyName" label="Name" error={errors.emergencyName}>
                    <Input {...bind("emergencyName")} autoComplete="off" />
                  </Field>
                  <Field field="emergencyRelationship" label="Relationship" error={errors.emergencyRelationship}>
                    <Input {...bind("emergencyRelationship")} autoComplete="off" placeholder="e.g. Mother" />
                  </Field>
                  <Field field="emergencyPhone" label="Phone number" error={errors.emergencyPhone}>
                    <Input {...bind("emergencyPhone")} type="tel" inputMode="tel" autoComplete="off" />
                  </Field>
                </div>
              </fieldset>

              {saveError ? (
                <Note tone="rose" icon={CircleAlert}>
                  <span role="alert">{saveError}</span>
                </Note>
              ) : null}

              <div className="flex justify-end border-t border-hair pt-[18px]">
                <Button type="submit" size="md" className="h-12 w-full sm:w-auto" disabled={saving}>
                  {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Surface>
    </DashboardPageShell>
  );
}
