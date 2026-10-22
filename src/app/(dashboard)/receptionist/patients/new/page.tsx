"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceChip, Field, fieldAria, Note, SkeletonRows, Surface, TbdPage } from "@/components/tbd";
import useZodForm from "@/hooks/utils/useZodForm";
import { useQuickRegisterPatient } from "@/hooks/query/usePatients";
import { asRow, firstText } from "@/components/patient/home/homeData";
import { generateTemporaryPassword } from "@/lib/utils/temporary-password";
import { RECEPTION_ROUTES } from "@/components/receptionist/useReceptionDesk";

/** Contact details only (RecRegister): no medical history or allergies at the desk. */
const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter the first name").max(60),
  lastName: z.string().trim().min(1, "Enter the last name").max(60),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s-]{10,15}$/, "Enter a 10-digit mobile number"),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email or leave it empty")]),
  gender: z.enum(["FEMALE", "MALE", "OTHER"]).optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().trim().max(200).optional(),
});

type RegisterValues = z.infer<typeof registerSchema>;

const GENDERS: Array<{ value: NonNullable<RegisterValues["gender"]>; label: string }> = [
  { value: "FEMALE", label: "Female" },
  { value: "MALE", label: "Male" },
  { value: "OTHER", label: "Other" },
];

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const register = useQuickRegisterPatient();

  const submit = async (values: RegisterValues) => {
    try {
      const result = await register.mutateAsync({
        // Patients sign in with a one-time code; the password is random and never shown.
        password: generateTemporaryPassword(),
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone.replace(/[\s-]/g, ""),
        ...(values.email ? { email: values.email } : {}),
        ...(values.gender ? { gender: values.gender } : {}),
        ...(values.dateOfBirth ? { dateOfBirth: values.dateOfBirth } : {}),
        ...(values.address ? { address: values.address } : {}),
      });
      const user = asRow(asRow(result)?.user);
      // Desk patient links carry the USER id (the `GET /patients/:id` key).
      const patientUserId = firstText(user?.id, asRow(user?.patient)?.userId);
      if (next === "walk-in" && patientUserId) {
        router.push(RECEPTION_ROUTES.walkIn(patientUserId));
        return;
      }
      router.push(patientUserId ? RECEPTION_ROUTES.patient(patientUserId) : RECEPTION_ROUTES.patients);
    } catch {
      // The mutation hook shows the error toast; the form keeps what was typed.
    }
  };

  const form = useZodForm(registerSchema, (values) => void submit(values), {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    dateOfBirth: "",
  });
  const { errors } = form.formState;
  const gender = form.watch("gender");

  return (
    <form onSubmit={(event) => void form.onFormSubmit(event)} noValidate>
      <Surface as="section" aria-label="Register patient" className="gap-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" htmlFor="firstName" required error={errors.firstName?.message}>
            <Input {...fieldAria("firstName", errors.firstName?.message)} autoComplete="given-name" {...form.register("firstName")} />
          </Field>
          <Field label="Last name" htmlFor="lastName" required error={errors.lastName?.message}>
            <Input {...fieldAria("lastName", errors.lastName?.message)} autoComplete="family-name" {...form.register("lastName")} />
          </Field>
          <Field
            label="Mobile number"
            htmlFor="phone"
            required
            error={errors.phone?.message}
            hint="We send a one-time password to this number."
          >
            <Input {...fieldAria("phone", errors.phone?.message, true)} type="tel" inputMode="tel" autoComplete="tel" {...form.register("phone")} />
          </Field>
          <Field label="Email (optional)" htmlFor="email" error={errors.email?.message}>
            <Input {...fieldAria("email", errors.email?.message)} type="email" autoComplete="email" {...form.register("email")} />
          </Field>
          <Field label="Gender">
            <div className="flex gap-2" role="group" aria-label="Gender">
              {GENDERS.map((option) => (
                <ChoiceChip
                  key={option.value}
                  active={gender === option.value}
                  onClick={() => form.setValue("gender", gender === option.value ? undefined : option.value)}
                >
                  {option.label}
                </ChoiceChip>
              ))}
            </div>
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth">
            <Input id="dateOfBirth" type="date" max={new Date().toISOString().slice(0, 10)} {...form.register("dateOfBirth")} />
          </Field>
          <Field label="Address (optional)" htmlFor="address" className="sm:col-span-2">
            <Input id="address" autoComplete="street-address" placeholder="House / street, area, city" {...form.register("address")} />
          </Field>
        </div>
        <Note tone="green" icon={ShieldCheck}>
          The patient signs in with an OTP sent to this mobile number. There is no password to set or share.
        </Note>
        <div className="flex flex-wrap justify-end gap-2.5 border-t border-hair pt-4">
          <Button asChild variant="outline" size="md">
            <Link href={RECEPTION_ROUTES.patients}>Cancel</Link>
          </Button>
          <Button type="submit" size="md" disabled={register.isPending}>
            {register.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <UserPlus aria-hidden="true" />}
            {register.isPending ? "Registering…" : "Register patient"}
          </Button>
        </div>
      </Surface>
    </form>
  );
}

/** RecRegister: add a new patient (contact details only). Next: a walk-in. */
export default function ReceptionRegisterPage() {
  return (
    <TbdPage
      title="Register patient"
      description="Add a new patient to the clinic. Only contact details are collected here."
      backHref={RECEPTION_ROUTES.patients}
      backLabel="Patients"
    >
      <Suspense fallback={<SkeletonRows rows={4} />}>
        <RegisterForm />
      </Suspense>
    </TbdPage>
  );
}
