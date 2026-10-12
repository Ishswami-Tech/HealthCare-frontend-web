"use client";

import { useId } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  InitialsAvatar,
  Note,
  ConfirmDialog,
  DialogActions,
  DialogBody,
  DialogShell,
  Field,
  fieldAria,
} from "@/components/tbd";
import { FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import type { FamilyMember } from "@/types/patient-visit.types";
import {
  EMPTY_FAMILY_MEMBER,
  GENDER_OPTIONS,
  familyMemberSchema,
  memberName,
  toFormValues,
  todayKey,
  type FamilyMemberFormValues,
} from "./family.logic";

const NO_GENDER = "none";

// ── Add / edit ─────────────────────────────────────────────────────────────

export interface FamilyMemberFormDialogProps {
  open: boolean;
  /** The member to edit. Leave out to add a new one. */
  member?: FamilyMember | null;
  isSaving?: boolean;
  /** Message of a failed save, shown inside the dialog so the form stays open. */
  errorMessage?: string | null;
  onSubmit: (values: FamilyMemberFormValues) => void;
  onClose: () => void;
}

/** "Add family member" / "Edit details": the fields `POST` and `PATCH /family-members/me` accept. */
export function FamilyMemberFormDialog({
  open,
  member = null,
  isSaving = false,
  errorMessage = null,
  onSubmit,
  onClose,
}: FamilyMemberFormDialogProps) {
  const editing = Boolean(member);
  const title = editing ? "Edit details" : "Add family member";
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      busy={isSaving}
      title={title}
      description={
        editing
          ? "Your clinic sees these details too."
          : "Add someone you look after. Your clinic will see these details."
      }
      width={560}
      onOpenAutoFocus={(event) => {
        // Start in the first field, not on the close button.
        const first = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector("input") : null;
        if (first) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      {/* The form lives inside the content, so every opening starts clean. */}
      {open ? (
        <FamilyMemberForm
          initialValues={member ? toFormValues(member) : EMPTY_FAMILY_MEMBER}
          editing={editing}
          isSaving={isSaving}
          errorMessage={errorMessage}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      ) : null}
    </DialogShell>
  );
}

function FamilyMemberForm({
  initialValues,
  editing,
  isSaving,
  errorMessage,
  onSubmit,
  onClose,
}: {
  initialValues: FamilyMemberFormValues;
  editing: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onSubmit: (values: FamilyMemberFormValues) => void;
  onClose: () => void;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FamilyMemberFormValues>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <DialogBody>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="First name" htmlFor={id("firstName")} error={errors.firstName?.message}>
            <Input
              {...register("firstName")}
              {...fieldAria(id("firstName"), errors.firstName?.message)}
              autoComplete="off"
              maxLength={100}
            />
          </Field>
          <Field label="Last name" htmlFor={id("lastName")} error={errors.lastName?.message}>
            <Input
              {...register("lastName")}
              {...fieldAria(id("lastName"), errors.lastName?.message)}
              autoComplete="off"
              maxLength={100}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Relation to you" htmlFor={id("relation")} error={errors.relation?.message}>
            <Input
              {...register("relation")}
              {...fieldAria(id("relation"), errors.relation?.message)}
              list={id("relations")}
              autoComplete="off"
              placeholder="For example Mother"
              maxLength={50}
            />
            <datalist id={id("relations")}>
              {FAMILY_RELATION_SUGGESTIONS.map((relation) => (
                <option key={relation} value={relation} />
              ))}
            </datalist>
          </Field>
          <Field label="Gender (optional)" htmlFor={id("gender")} error={errors.gender?.message}>
            <Controller
              control={control}
              name="gender"
              render={({ field }) => (
                <Select
                  value={field.value || NO_GENDER}
                  onValueChange={(value) => field.onChange(value === NO_GENDER ? "" : value)}
                >
                  <SelectTrigger className="w-full" id={id("gender")} onBlur={field.onBlur}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_GENDER}>Not set</SelectItem>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    {/* A value the clinic saved that is not in the list stays selectable. */}
                    {field.value && !GENDER_OPTIONS.some((option) => option.value === field.value) ? (
                      <SelectItem value={field.value}>{field.value}</SelectItem>
                    ) : null}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Date of birth (optional)" htmlFor={id("dateOfBirth")} error={errors.dateOfBirth?.message}>
            <Input
              type="date"
              max={todayKey()}
              {...register("dateOfBirth")}
              {...fieldAria(id("dateOfBirth"), errors.dateOfBirth?.message)}
            />
          </Field>
          <Field
            label="Phone (optional)"
            htmlFor={id("phone")}
            hint="A number the clinic can call about them"
            error={errors.phone?.message}
          >
            <Input
              type="tel"
              inputMode="tel"
              {...register("phone")}
              {...fieldAria(id("phone"), errors.phone?.message)}
              autoComplete="off"
              placeholder="+91 98765 43210"
              maxLength={20}
            />
          </Field>
        </div>

        <Field
          label="Notes (optional)"
          htmlFor={id("notes")}
          hint="Anything the clinic should know"
          error={errors.notes?.message}
        >
          <Textarea
            {...register("notes")}
            {...fieldAria(id("notes"), errors.notes?.message)}
            className="min-h-[72px]"
            maxLength={500}
          />
        </Field>

        {errorMessage ? (
          <Note tone="rose" icon={CircleAlert}>
            <span role="alert">
              {editing ? "The changes were not saved." : "The family member was not added."} {errorMessage}
            </span>
          </Note>
        ) : null}
      </DialogBody>

      <DialogActions>
        <Button type="button" variant="outline" size="md" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" size="md" disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : editing ? (
            <Check aria-hidden="true" />
          ) : (
            <Plus aria-hidden="true" />
          )}
          {isSaving ? "Saving…" : editing ? "Save changes" : "Add family member"}
        </Button>
      </DialogActions>
    </form>
  );
}

// ── Remove ─────────────────────────────────────────────────────────────────

export interface RemoveFamilyMemberDialogProps {
  open: boolean;
  member: FamilyMember | null;
  isRemoving?: boolean;
  errorMessage?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** Confirm before `DELETE /family-members/me/:id`. The clinic keeps the member's records. */
export function RemoveFamilyMemberDialog({
  open,
  member,
  isRemoving = false,
  errorMessage = null,
  onConfirm,
  onClose,
}: RemoveFamilyMemberDialogProps) {
  const name = member ? memberName(member) : "";
  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      title="Remove this family member?"
      description="They will leave your family list. Your clinic keeps their past visits and records."
      tone="danger"
      cancelLabel="Keep"
      confirmLabel="Remove"
      busyLabel="Removing…"
      confirmIcon={<Trash2 aria-hidden="true" />}
      busy={isRemoving}
      confirmDisabled={!member}
      onConfirm={onConfirm}
    >
      {member ? (
        <div className="flex items-center gap-3 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 dark:bg-white/5">
          <InitialsAvatar name={name} size={40} />
          <span className="flex min-w-0 flex-col gap-px">
            <span className="truncate text-[15px] font-extrabold text-ink">{name}</span>
            <span className="truncate text-xs font-medium text-ink-muted">{member.relation}</span>
          </span>
        </div>
      ) : null}
      {errorMessage ? (
        <Note tone="rose" icon={CircleAlert}>
          <span role="alert">The family member was not removed. {errorMessage}</span>
        </Note>
      ) : null}
    </ConfirmDialog>
  );
}
