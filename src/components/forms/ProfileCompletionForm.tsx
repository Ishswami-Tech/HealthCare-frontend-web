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
import { OtpCodeInput } from "@/components/auth/otp-code-input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { showSuccessToast, showErrorToast, showWarningToast, TOAST_IDS } from "@/hooks/utils/use-toast";
import { Loader2, Phone, MapPin, Calendar, Venus, CalendarIcon, ShieldCheck } from "lucide-react";
import { Role } from "@/types/auth.types";
import { ROUTES } from "@/lib/config/routes";
import { profileCompletionSchema, type SchemaProfileCompletionFormData as ProfileCompletionFormData } from "@/lib/schema";
import { useAuthStore } from "@/stores";
import type { Session } from "@/types/auth.types";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";

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

interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  onVerified: () => void;
}

function OtpModal({ open, onOpenChange, phone, onVerified }: OtpModalProps) {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setErrorMessage(null);
    try {
      await clinicApiClient.requestOTP({ identifier: phone, isRegistration: true });
      showSuccessToast("OTP resent to your phone.", { id: TOAST_IDS.PROFILE.OTP });
      setCountdown(30);
      setOtp("");
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        showErrorToast("Session expired. Please log in again.", {
          id: TOAST_IDS.AUTH.LOGIN,
          duration: 5000,
        });
        window.location.href = '/login';
      } else {
        showErrorToast(error instanceof Error ? error.message : "Failed to resend OTP", {
          id: TOAST_IDS.PROFILE.OTP,
        });
      }
    }
    return;
  };

  const handleVerify = async () => {
    if (!otp.trim() || otp.length < 6) {
      setErrorMessage("Please enter a valid 6-digit OTP.");
      return;
    }
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const response = await clinicApiClient.post(API_ENDPOINTS.AUTH.VERIFY_PHONE, {
        phone,
        otp: otp.trim(),
      });
      const data = response.data as Record<string, unknown>;
      const result = (data.data || data) as Record<string, unknown>;
      if (result.phoneVerified !== false) {
        showSuccessToast("Phone number verified!", { id: TOAST_IDS.PROFILE.OTP });
        setOtp("");
        setErrorMessage(null);
        onVerified();
        onOpenChange(false);
      } else {
        setErrorMessage("Invalid OTP. Please try again.");
        showErrorToast("Invalid OTP. Please try again.", { id: TOAST_IDS.PROFILE.OTP });
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        showErrorToast("Session expired. Please log in again.", {
          id: TOAST_IDS.AUTH.LOGIN,
          duration: 5000,
        });
        window.location.href = '/login';
      } else {
        setErrorMessage("Invalid OTP. Please try again.");
        showErrorToast("Invalid OTP. Please try again.", { id: TOAST_IDS.PROFILE.OTP });
      }
    } finally {
      setIsVerifying(false);
    }
    return;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            Verify Phone Number
          </DialogTitle>
          <DialogDescription>
            Enter the 4-6 digit code sent to <span className="font-medium text-foreground">{phone}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <OtpCodeInput
              value={otp}
              onChange={(value) => {
                setOtp(value);
                setErrorMessage(null);
              }}
              disabled={isVerifying}
              invalid={Boolean(errorMessage)}
            />
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code sent to your phone
            </p>
            {errorMessage && (
              <p className="text-sm text-destructive text-center">{errorMessage}</p>
            )}
          </div>
          <Button
            onClick={handleVerify}
            disabled={otp.length < 6 || isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={countdown > 0}
            className="text-muted-foreground"
          >
            Resend OTP {countdown > 0 && `(${countdown}s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(Boolean(session?.user?.phoneVerified));
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [pendingPhone, setPendingPhone] = useState("");

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

  const watchedPhone = form.watch("phone");

  useEffect(() => {
    setIsPhoneVerified(Boolean(session?.user?.phoneVerified));
  }, [session?.user?.phoneVerified]);

  useEffect(() => {
    if (!watchedPhone) return;
    if (watchedPhone !== formatPhoneNumber(session?.user?.phone)) {
      setIsPhoneVerified(false);
    }
  }, [watchedPhone, session?.user?.phone]);

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

  const sendPhoneOtp = async () => {
    try {
      const phone = formatPhoneNumber(form.getValues("phone"));
      if (!phone) {
        showErrorToast("Enter a phone number first.", { id: TOAST_IDS.PROFILE.COMPLETE });
        return;
      }
      setIsSendingOtp(true);
      await clinicApiClient.requestOTP({
        identifier: phone,
        isRegistration: false,
        ...(session?.user?.clinicId ? { clinicId: session.user.clinicId } : {}),
      });
      setPendingPhone(phone);
      setShowOtpModal(true);
      showSuccessToast("OTP sent to your phone.", { id: TOAST_IDS.PROFILE.COMPLETE });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorLower = errorMessage.toLowerCase();

      if (errorLower.includes("user") && errorLower.includes("not found")) {
        showErrorToast("This phone is not registered. Please use a registered phone number.", {
          id: TOAST_IDS.PROFILE.COMPLETE,
        });
      } else if (errorLower.includes("expired") || errorLower.includes("unauthorized")) {
        showErrorToast("Session expired. Please log in again.", {
          id: TOAST_IDS.AUTH.LOGIN,
          duration: 5000,
        });
        window.location.href = '/login';
      } else if (errorLower.includes("rate limit")) {
        showErrorToast("Too many requests. Please wait a moment and try again.", {
          id: TOAST_IDS.PROFILE.COMPLETE,
        });
      } else {
        showErrorToast(errorMessage || "Failed to send OTP. Please try again.", {
          id: TOAST_IDS.PROFILE.COMPLETE,
        });
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handlePhoneVerified = () => {
    setIsPhoneVerified(true);
  };

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
        phoneVerified: isPhoneVerified,  // Required by backend to mark profile complete
      };

      // phoneVerified IS required before completing profile
      if (!isPhoneVerified) {
        form.setError("phone", {
          type: "manual",
          message: "Please verify your phone number via OTP before completing the profile.",
        });
        return;
      }

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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-lg border-border">

        {/* ── Header ── */}
        <CardHeader className="px-4 py-3 sm:px-6 sm:py-4 pb-0">
          <CardTitle className="text-base sm:text-lg font-semibold text-center">
            Complete Your Profile
          </CardTitle>
        </CardHeader>

        {/* ── Body ── */}
        <CardContent className="px-4 py-3 sm:px-6 sm:py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-3">

              {/* ── Basic Information ── */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  Basic Information
                </h3>

                {/* First Name / Last Name */}
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm">
                          First Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First name"
                            className="h-10 sm:h-9 text-sm"
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
                        <FormLabel className="text-xs sm:text-sm">
                          Last Name <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Last name"
                            className="h-10 sm:h-9 text-sm"
                            aria-invalid={!!form.formState.errors.lastName}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Phone <span className="text-destructive">*</span>
                      </FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <PhoneInput
                            placeholder="Phone number"
                            aria-invalid={!!form.formState.errors.phone}
                            error={!!form.formState.errors.phone}
                            defaultCountry="IN"
                            international
                            disabled={isPhoneVerified}
                            className="h-10 sm:h-9 text-sm"
                            {...field}
                          />
                        </div>
                        {isPhoneVerified ? (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium h-10 sm:h-9 px-3 sm:px-2">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Verified</span>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={sendPhoneOtp}
                            disabled={isSendingOtp || !form.getValues("phone")}
                            className="h-10 sm:h-9 text-xs sm:text-sm whitespace-nowrap px-4"
                          >
                            {isSendingOtp ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              "Verify OTP"
                            )}
                          </Button>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth / Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const today = new Date();
                      const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
                      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            DOB
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
                                    ? format(new Date(field.value), "P")
                                    : "Pick"}
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

                  {/* Gender */}
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          <Venus className="h-3 w-3" />
                          Gender
                        </FormLabel>
                        <Select
                          value={field.value || "male"}
                          onValueChange={(val) => field.onChange(val || "male")}
                          defaultValue="male"
                        >
                          <FormControl>
                            <SelectTrigger aria-invalid={!!form.formState.errors.gender} className="h-10 sm:h-9">
                              <SelectValue placeholder="Select" />
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
                </div>

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        Address
                      </FormLabel>
                      <Textarea
                        placeholder="Enter address"
                        aria-invalid={!!form.formState.errors.address}
                        className="min-h-[60px] sm:min-h-[50px] resize-none text-sm h-10 sm:h-9"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* ── Emergency Contact ── */}
              <section className="rounded-lg border p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
                  Emergency Contact
                </h3>

                <div className="space-y-2 sm:space-y-3">
                  {/* Row 1: Name & Relation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Name</FormLabel>
                          <Input placeholder="Emergency contact name" className="h-10 sm:h-9 text-sm" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Relation</FormLabel>
                          <Input placeholder="e.g., Parent, Spouse" className="h-10 sm:h-9 text-sm" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Row 2: Contact Phone */}
                  <FormField
                    control={form.control}
                    name="emergencyContactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Phone
                        </FormLabel>
                        <PhoneInput
                          placeholder="Emergency contact phone"
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={!!form.formState.errors.emergencyContactPhone}
                          defaultCountry="IN"
                          international
                          className="h-10 sm:h-9 text-sm"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              {/* ── Professional Information (doctors only) ── */}
              {isDoctor && (
                <section className="space-y-3">
                  <h3 className="text-xs sm:text-sm font-medium text-foreground">
                    Professional Info
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Specialization</FormLabel>
                          <Input placeholder="e.g., Cardiology" className="h-10 sm:h-9 text-sm" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">Experience</FormLabel>
                          <Input placeholder="Years" className="h-10 sm:h-9 text-sm" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              )}

              {/* ── Submit ── */}
              <Button
                type="submit"
                disabled={isSubmitting || updatingProfile}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-700 dark:to-teal-700 dark:hover:from-emerald-800 dark:hover:to-teal-800 text-white font-semibold h-11 sm:h-10 text-sm sm:text-base rounded-lg"
              >
                {isSubmitting || updatingProfile ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Completing Profile...</span>
                    <span className="sm:hidden">Submitting...</span>
                  </>
                ) : (
                  "Complete Profile"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* OTP Modal */}
      <OtpModal
        open={showOtpModal}
        onOpenChange={setShowOtpModal}
        phone={pendingPhone}
        onVerified={handlePhoneVerified}
      />
    </div>
  );
}
