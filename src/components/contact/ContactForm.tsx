"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { Loader2, Send } from "lucide-react";
import { SectionIndex } from "@/components/home/SectionHeading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitContactForm } from "@/hooks/query/useCommunication";
import { showErrorToast, showSuccessToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { useTranslation } from "@/lib/i18n/context";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { cn } from "@/lib/utils";
import { CARD, DISPLAY_LG } from "@/lib/design/tokens";

type FieldName = "name" | "email" | "phone" | "condition" | "message";
type FormState = Record<FieldName, string>;

const EMPTY_FORM: FormState = { name: "", email: "", phone: "", condition: "", message: "" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[\d\s\-+()]+$/;
const MIN_PHONE_DIGITS = 10;

const isValidEmail = (email: string) => EMAIL_PATTERN.test(email);
const isValidPhone = (phone: string) =>
  PHONE_PATTERN.test(phone) && phone.replace(/\D/g, "").length >= MIN_PHONE_DIGITS;

const FIELD_CLASS = "h-12 rounded-xl bg-background px-4 text-[15px]";

interface FieldProps {
  name: FieldName;
  label: string;
  placeholder: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  optionalLabel?: string;
  isMultiline?: boolean;
  className?: string;
}

function Field({
  name,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  autoComplete,
  optionalLabel,
  isMultiline = false,
  className,
}: FieldProps) {
  const id = `contact-${name}`;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
        {optionalLabel ? <span className="ml-1.5 text-xs font-normal text-muted-foreground">({optionalLabel})</span> : null}
      </Label>
      {isMultiline ? (
        <Textarea
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={5}
          className="min-h-32 rounded-xl bg-background px-4 py-3 text-[15px]"
        />
      ) : (
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={FIELD_CLASS}
        />
      )}
    </div>
  );
}

/** "Send us a message" — posts to the clinic's contact inbox. */
export function ContactForm({ className }: { className?: string }) {
  const { t } = useTranslation();
  const submitContactForm = useSubmitContactForm();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const rejectWith = (key: string) => showErrorToast(t(key), { id: TOAST_IDS.CONTACT.SUBMIT });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) return rejectWith("contact.form.validation.nameRequired");
    if (!isValidEmail(form.email)) return rejectWith("contact.form.validation.emailInvalid");
    if (!isValidPhone(form.phone)) return rejectWith("contact.form.validation.phoneInvalid");

    submitContactForm.mutate(
      {
        name: form.name,
        email: form.email,
        phone: form.phone,
        ...(form.condition && { condition: form.condition }),
        message: form.message,
        type: "contact",
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM);
          showSuccessToast(t("contact.form.success.title"), {
            id: TOAST_IDS.CONTACT.SUBMIT,
            description: t("contact.form.success.description"),
          });
        },
        onError: (error: unknown) => {
          /* Keep the backend's own reason visible under the friendly headline. */
          showErrorToast(t("contact.form.error.title"), {
            id: TOAST_IDS.CONTACT.SUBMIT,
            description: sanitizeErrorMessage(error),
          });
        },
      }
    );
  };

  const field = (name: FieldName, key: string) => ({
    name,
    label: t(`contact.form.fields.${key}`),
    placeholder: t(`contact.form.placeholders.${key}`),
    value: form[name],
    onChange: handleChange,
  });

  const isSending = submitContactForm.isPending;

  return (
    <div className={cn(CARD, "home-topline p-6 sm:p-8", className)}>
      <SectionIndex value="02" />
      <h2 id="contact-form-heading" className={cn(DISPLAY_LG, "mt-4 text-foreground")}>
        {t("contact.form.title")}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{t("contact.form.subtitle")}</p>

      <form onSubmit={handleSubmit} noValidate aria-labelledby="contact-form-heading" className="mt-7 grid gap-5 sm:grid-cols-2">
        <Field {...field("name", "fullName")} autoComplete="name" />
        <Field {...field("phone", "phoneNumber")} type="tel" autoComplete="tel" />
        <Field {...field("email", "emailAddress")} type="email" autoComplete="email" />
        <Field {...field("condition", "healthCondition")} optionalLabel={t("contact.form.optional")} />
        <Field {...field("message", "message")} isMultiline className="sm:col-span-2" />

        <div className="sm:col-span-2">
          <Button
            type="submit"
            disabled={isSending}
            className="h-12 w-full rounded-full px-7 font-heading text-[15px] shadow-[0_10px_28px_-10px_oklch(0.62_0.16_150_/_0.7)] sm:w-auto"
          >
            {isSending ? (
              <Loader2 className="size-4.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4.5" aria-hidden="true" />
            )}
            {isSending ? t("contact.form.sending") : t("contact.form.submitButton")}
          </Button>
        </div>
      </form>
    </div>
  );
}
