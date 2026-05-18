"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import { useSetProfileComplete, useUpdateUserProfile } from "@/hooks/query";
import { getProfileCompletionRedirectUrl } from "@/lib/config/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { showSuccessToast, showErrorToast, showWarningToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { Loader2, User, Phone, MapPin, Calendar, Venus, CalendarIcon, Info } from "lucide-react";
import { Role } from "@/types/auth.types";
import { ROUTES } from "@/lib/config/routes";
import { profileCompletionSchema, type SchemaProfileCompletionFormData as ProfileCompletionFormData } from "@/lib/schema";
import { useAuthStore } from "@/stores";
import type { Session } from "@/types/auth.types";

interface ProfileCompletionFormProps {
  onComplete?: () => void;
}

const resolveNameParts = (
  user:
    | { firstName?: string | undefined; lastName?: string | undefined; name?: string | undefined }
    | null
    | undefined
) => {
  const firstName = user?.firstName?.trim() || "";
  const lastName = user?.lastName?.trim() || "";
  const fullName = user?.name?.trim() || "";

  if (firstName || lastName) {
    return { firstName, lastName };
  }

  if (fullName) {
    const [derivedFirstName = "", ...derivedRest] = fullName.split(/\s+/);
    return {
      firstName: derivedFirstName,
      lastName: derivedRest.join(" ").trim(),
    };
  }

  return { firstName: "", lastName: "" };
};

// Shared input class helper — keeps all fields visually consistent
const inputCls = (hasError: boolean) =>
  hasError
    ? "aria-invalid:border-destructive aria-invalid:ring-destructive/20"
    : "";

export default function ProfileCompletionForm({
  onComplete,
}: ProfileCompletionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const setProfileCompletion = useAuthStore((state) => state.setProfileCompletion);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const redirectUrl = searchParams.get("redirect") || "/";

  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return "";
    if (phone.startsWith("+")) return phone;
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  };

  const form = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      dateOfBirth: "",
      gender: "male",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      specialization: "",
      experience: "",
      clinicName: "",
      clinicAddress: "",
    },
  });

  useEffect(() => {
    if (!session?.user || isInitialized) return;
    form.reset({
      ...resolveNameParts(session.user),
      phone: "",
      dateOfBirth: "",
      gender: "male" as const,
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      specialization: "",
      experience: "",
      clinicName: "",
      clinicAddress: "",
    });
    setIsInitialized(true);
  }, [session, form, isInitialized]);

  const updateProfileMutation = useUpdateUserProfile();
  const setProfileCompleteMutation = useSetProfileComplete();
  const updatingProfile =
    updateProfileMutation.isPending || setProfileCompleteMutation.isPending;

  const updateProfile = async (data: Record<string, unknown>) => {
    const result = await updateProfileMutation.mutateAsync(data);
    const response = result as { success?: boolean; error?: string };
    if (response && response.success === false && response.error) {
      showErrorToast(response.error, { id: TOAST_IDS.PROFILE.COMPLETE });
      return;
    }

    showSuccessToast("Profile completed successfully!", {
      id: TOAST_IDS.PROFILE.COMPLETE,
    });

    await setProfileCompleteMutation.mutateAsync(true);
    setProfileCompletion(true, false);
    queryClient.setQueryData<Session | null>(["session"], (current) => {
      const source = current || session;
      if (!source?.user) return source;
      return { ...source, user: { ...source.user, profileComplete: true } };
    });

    setTimeout(() => {
      try {
        if (onComplete) {
          onComplete();
        } else {
          const userRole = session?.user?.role as Role;
          const finalRedirect = getProfileCompletionRedirectUrl(userRole, redirectUrl);
          window.location.replace(finalRedirect);
        }
      } catch (_redirectError) {
        showErrorToast(
          "Profile was updated but there was an error redirecting. Please try navigating manually.",
          { id: TOAST_IDS.PROFILE.COMPLETE }
        );
      }
    }, 1500);
  };

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setIsSubmitting(true);
    try {
      const baseProfileData: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: formatPhoneNumber(data.phone),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender ? data.gender.toUpperCase() : undefined,
        address: data.address,
      };

      const hasCompleteEmergencyContact =
        data.emergencyContactName?.trim() &&
        data.emergencyContactPhone?.trim() &&
        data.emergencyContactRelationship?.trim();

      if (hasCompleteEmergencyContact) {
        baseProfileData.emergencyContact = {
          name: data.emergencyContactName!.trim(),
          phone: formatPhoneNumber(data.emergencyContactPhone!),
          relationship: data.emergencyContactRelationship!.trim(),
        };
      }

      let roleSpecificData = {};
      const userRole = session?.user?.role;
      if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
        roleSpecificData = {
          specialization: data.specialization,
          experience: data.experience ? parseInt(data.experience, 10) : undefined,
        };
      }

      await updateProfile({ ...baseProfileData, ...roleSpecificData } as Record<string, unknown>);
    } catch (error) {
      console.error("Profile completion error:", error);

      if (error instanceof Error && error.message.includes("validation")) {
        try {
          const errorData = JSON.parse(error.message.replace("validation error: ", ""));
          if (errorData.errors) {
            Object.entries(errorData.errors).forEach(([field, message]) => {
              form.setError(field as keyof ProfileCompletionFormData, {
                type: "server",
                message: message as string,
              });
            });
            const { ERROR_MESSAGES } = await import("@/lib/config/config");
            showErrorToast(ERROR_MESSAGES.VALIDATION_ERROR, { id: TOAST_IDS.PROFILE.COMPLETE });
            return;
          }
        } catch (parseError) {
          console.error("Error parsing validation error:", parseError);
        }
      }

      if (error instanceof Error) {
        if (
          error.message.includes("Session validation failed") ||
          error.message.includes("Invalid device") ||
          error.message.includes("Invalid session")
        ) {
          showErrorToast("Your session appears to be invalid or expired. Please log in again.", {
            id: TOAST_IDS.AUTH.LOGIN,
            duration: 5000,
          });
          router.push(ROUTES.LOGIN);
        } else if (error.message.includes("500") || error.message.includes("Server encountered an error")) {
          showErrorToast(
            "The server encountered an error. Please try again in a few moments.",
            { id: TOAST_IDS.GLOBAL.ERROR, duration: 5000 }
          );
        } else {
          showErrorToast(`Failed to complete profile: ${error.message}`, {
            id: TOAST_IDS.PROFILE.COMPLETE,
            duration: 5000,
          });
        }
      } else {
        showErrorToast("Failed to complete profile. Please try again.", {
          id: TOAST_IDS.PROFILE.COMPLETE,
          duration: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRole = session?.user?.role as Role;
  const isDoctor = userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR;

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-neutral-950 dark:via-slate-900 dark:to-neutral-950 p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-muted-foreground">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-neutral-950 dark:via-slate-900 dark:to-neutral-950 p-4">
      <Card className="w-full max-w-lg overflow-hidden shadow-xl dark:shadow-none border border-border">

        {/* ── Header ── */}
        <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 px-6 py-5 space-y-3">
          <div className="text-center space-y-1">
            <CardTitle className="text-xl font-bold text-white">
              Complete Your Profile
            </CardTitle>
            <p className="text-sm text-emerald-100">
              Please provide the required information to complete your profile setup
            </p>
          </div>

          {/* One-time setup notice */}
          <div className="flex items-start gap-3 rounded-lg bg-white/15 border border-white/25 px-4 py-3">
            <Info className="h-4 w-4 text-white shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-white">One-Time Setup</p>
              <p className="text-xs text-emerald-100 mt-0.5">
                This information will be securely stored and you can update it anytime from your profile settings.
              </p>
            </div>
          </div>
        </CardHeader>

        {/* ── Body ── */}
        <CardContent className="px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              {/* ── Basic Information ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Basic Information
                  </h3>
                </div>

                {/* First Name / Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          First Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First name"
                            aria-invalid={!!form.formState.errors.firstName}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Last Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Last name"
                            aria-invalid={!!form.formState.errors.lastName}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phone / Date of Birth */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          Phone Number <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Phone number"
                            aria-invalid={!!form.formState.errors.phone}
                            error={!!form.formState.errors.phone}
                            defaultCountry="IN"
                            international
                            withCountryCallingCode
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const today = new Date();
                      const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
                      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            Date of Birth{" "}
                            <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={
                                    "h-9 w-full justify-start text-left font-normal" +
                                    (!field.value ? " text-muted-foreground" : "")
                                  }
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                  {field.value
                                    ? format(new Date(field.value), "PPP")
                                    : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-background dark:bg-neutral-950 border border-border" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (!date) return;
                                  const today = new Date();
                                  let age = today.getFullYear() - date.getFullYear();
                                  const m = today.getMonth() - date.getMonth();
                                  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
                                  if (age < 12) {
                                    showWarningToast("You must be at least 12 years old", {
                                      id: TOAST_IDS.PROFILE.COMPLETE,
                                    });
                                    form.setError("dateOfBirth", {
                                      type: "manual",
                                      message: "You must be at least 12 years old",
                                    });
                                  } else {
                                    form.clearErrors("dateOfBirth");
                                    field.onChange(format(date, "yyyy-MM-dd"));
                                  }
                                }}
                                disabled={(date) => date > maxDate || date < minDate}
                                captionLayout="dropdown"
                                fromYear={today.getFullYear() - 100}
                                toYear={today.getFullYear() - 12}
                                defaultMonth={maxDate}
                                initialFocus
                                className="p-2 sm:p-3"
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Venus className="h-3.5 w-3.5" />
                        Gender{" "}
                        <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                      </FormLabel>
                      <Select
                        value={field.value || "male"}
                        onValueChange={(val) => field.onChange(val || "male")}
                        defaultValue="male"
                      >
                        <FormControl>
                          <SelectTrigger aria-invalid={!!form.formState.errors.gender}>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Address <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your full address"
                          aria-invalid={!!form.formState.errors.address}
                          className="min-h-[80px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* ── Emergency Contact ── */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Emergency Contact
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Contact's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Contact's phone number"
                            error={!!form.formState.errors.emergencyContactPhone}
                            defaultCountry="IN"
                            international
                            withCountryCallingCode
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emergencyContactRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Spouse, Parent, Sibling" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* ── Professional Information (doctors only) ── */}
              {isDoctor && (
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      Professional Information{" "}
                      <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Cardiology, Pediatrics" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              )}

              {/* ── Submit ── */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting || updatingProfile}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-700 dark:to-teal-700 dark:hover:from-emerald-800 dark:hover:to-teal-800 text-white font-semibold h-10 rounded-lg shadow-md transition-all duration-200"
                >
                  {isSubmitting || updatingProfile ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing Profile...
                    </>
                  ) : (
                    "Complete Profile"
                  )}
                </Button>
              </div>

            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
