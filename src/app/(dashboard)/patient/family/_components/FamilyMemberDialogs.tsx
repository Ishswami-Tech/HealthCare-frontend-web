"use client";

import { useId, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, CircleAlert, Loader2, Plus, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InitialsAvatar, Note } from "@/components/tbd";
import { FAMILY_RELATION_SUGGESTIONS } from "@/lib/constants/case-sheet-fixed-lists";
import { cn } from "@/lib/utils";
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

const ACTION_BAR =
  "flex flex-col-reverse gap-2.5 border-t border-hair bg-[#f8fafc] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end sm:px-6 dark:bg-white/5";

/** Label, control, optional hint and the validation message of one field. */
function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | undefined;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-xs font-bold text-ink-soft">
        {label}
      </label>
      {children}
      {error ? (
        <span id={`${htmlFor}-error`} role="alert" className="text-xs font-semibold text-[#be123c] dark:text-rose-300">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-ink-muted">{hint}</span>
      ) : null}
    </div>
  );
}

/** Props that link an input to its `Field` message. */
function fieldAria(id: string, error?: string) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : undefined,
  } as const;
}

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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing while the request runs would hide its result.
        if (!next && !isSaving) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[560px]"
        onOpenAutoFocus={(event) => {
          // Start in the first field, not on the close button.
          const first = event.currentTarget instanceof HTMLElement ? event.currentTarget.querySelector("input") : null;
          if (first) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="flex items-start gap-3 px-5 pb-3.5 pt-[22px] sm:px-6">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Your clinic sees these details too."
                : "Add someone you look after. Your clinic will see these details."}
            </DialogDescription>
          </div>
          <DialogClose
            disabled={isSaving}
            className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-well text-ink-soft transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
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
      </DialogContent>
    </Dialog>
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
      <div className="flex max-h-[calc(100dvh-230px)] flex-col gap-4 overflow-y-auto px-5 pb-5 pt-1 sm:px-6">
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
      </div>

      <div className={ACTION_BAR}>
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
      </div>
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
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isRemoving) onClose();
      }}
    >
      <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[460px]">
        <div className="flex flex-col gap-4 px-5 pb-5 pt-[22px] sm:px-6">
          <div className="flex flex-col gap-1">
            <AlertDialogTitle className="text-lg font-extrabold leading-tight text-ink">
              Remove this family member?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13px] text-ink-muted">
              They will leave your family list. Your clinic keeps their past visits and records.
            </AlertDialogDescription>
          </div>
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
        </div>
        <div className={ACTION_BAR}>
          <AlertDialogCancel disabled={isRemoving} className="h-11 px-[18px]">
            Keep
          </AlertDialogCancel>
          <Button type="button" variant="danger" size="md" disabled={isRemoving || !member} onClick={onConfirm}>
            {isRemoving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            {isRemoving ? "Removing…" : "Remove"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
