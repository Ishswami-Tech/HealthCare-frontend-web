"use client";

import React, { Suspense, useState, useEffect, useRef, useMemo, useReducer } from "react";
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
import { Loader2, Phone, MapPin, Calendar, Venus, CalendarIcon, ShieldCheck, Mail } from "lucide-react";
import { Role } from "@/types/auth.types";
import { ROUTES } from "@/lib/config/routes";
import { profileCompletionSchema, type SchemaProfileCompletionFormData as ProfileCompletionFormData } from "@/lib/schema";
import { useAuthStore } from "@/stores";
import type { Session } from "@/types/auth.types";
import { clinicApiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/config/config";
import { logger } from "@/lib/utils/logger";
import { useCurrentTimestamp } from "@/hooks/utils/useClientDate";

interface ProfileCompletionFormProps {
  onComplete?: () => void;
}

type ProfileCompletionState = {
  isSubmitting: boolean;
  isSendingOtp: boolean;
  showOtpModal: boolean;
  pendingPhone: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
};

type ProfileCompletionAction =
  | { type: "setIsSubmitting"; value: boolean }
  | { type: "setIsSendingOtp"; value: boolean }
  | { type: "setShowOtpModal"; value: boolean }
  | { type: "setPendingPhone"; value: string }
  | { type: "setIsPhoneVerified"; value: boolean }
  | { type: "setIsEmailVerified"; value: boolean };

const initialProfileCompletionState: ProfileCompletionState = {
  isSubmitting: false,
  isSendingOtp: false,
  showOtpModal: false,
  pendingPhone: "",
  isPhoneVerified: false,
  isEmailVerified: false,
};

function profileCompletionReducer(
  state: ProfileCompletionState,
  action: ProfileCompletionAction
): ProfileCompletionState {
  switch (action.type) {
    case "setIsSubmitting":
      return { ...state, isSubmitting: action.value };
    case "setIsSendingOtp":
      return { ...state, isSendingOtp: action.value };
    case "setShowOtpModal":
      return { ...state, showOtpModal: action.value };
    case "setPendingPhone":
      return { ...state, pendingPhone: action.value };
    case "setIsPhoneVerified":
      return { ...state, isPhoneVerified: action.value };
    case "setIsEmailVerified":
      return { ...state, isEmailVerified: action.value };
    default:
      return state;
  }
}

function resolveNameParts(
  user:
    | { firstName?: string | undefined; lastName?: string | undefined; name?: string | undefined }
    | null
    | undefined
): { firstName: string; lastName: string } {
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
}

interface OtpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  onVerified: () => void;
}

function OtpModal({ open, onOpenChange, phone, onVerified }: OtpModalProps) {
  const { session } = useAuth();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
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
      await clinicApiClient.requestOTP({ identifier: phone });
      showSuccessToast("OTP resent to your phone.", { id: TOAST_IDS.PROFILE.OTP });
      setCountdown(30);
      setOtp("");
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        showErrorToast("Session expired. Please log in again.", {
          id: TOAST_IDS.AUTH.LOGIN,
          duration: 5000,
        });
        window.location.href = '/auth/login';
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
        window.location.href = '/auth/login';
      } else {
        const errorMessage = error instanceof Error ? error.message : "Invalid OTP. Please try again.";
        const lowerMessage = errorMessage.toLowerCase();
        const displayMessage =
          lowerMessage.includes("invalid otp") || lowerMessage.includes("otp")
            ? "Invalid OTP. Please try again."
            : errorMessage;
        setErrorMessage(displayMessage);
        showErrorToast(displayMessage, { id: TOAST_IDS.PROFILE.OTP });
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
            <ShieldCheck className="size-5 text-emerald-600" />
            Verify Phone Number
          </DialogTitle>
          <DialogDescription>
            Enter the 4-6 digit code sent to <span className="font-medium text-foreground">{phone}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="gap-y-6 py-4">
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
                <Loader2 className="mr-2 size-4 animate-spin" />
                Verifying…
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

function ProfileCompletionFormContent({
  onComplete,
}: ProfileCompletionFormProps) {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const sessionUser = session?.user;
  const queryClient = useQueryClient();
  const setProfileCompletion = useAuthStore((state) => state.setProfileCompletion);
  const currentTimestamp = useCurrentTimestamp();
  const getSearchParam = useMemo(() => searchParams.get.bind(searchParams), [searchParams]);
  // Login method flags (must be defined before useState hooks that use them)
  const loginMethod = sessionUser?.loginMethod;
  const isGoogleLogin = loginMethod === 'google_oauth';
  const isEmailOtpLogin = loginMethod === 'email_otp';
  const isPhoneOtpLogin = loginMethod === 'phone_otp';

  const [
    {
      isSubmitting,
      isSendingOtp,
      showOtpModal,
      pendingPhone,
      isPhoneVerified,
      isEmailVerified,
    },
    dispatch,
  ] = useReducer(profileCompletionReducer, {
    ...initialProfileCompletionState,
    // Phone is verified only if backend marked it during login (Phone OTP login marks phone as verified)
    // For Email OTP and Google login, phone is NOT verified at login time - user must verify via OTP
    isPhoneVerified: Boolean(sessionUser?.phoneVerified),
    isEmailVerified: Boolean(sessionUser?.emailVerified || isEmailOtpLogin),
  });
  const hasInitializedRef = useRef(false);

  const setIsSubmitting = (value: boolean) =>
    dispatch({ type: "setIsSubmitting", value });
  const setIsSendingOtp = (value: boolean) =>
    dispatch({ type: "setIsSendingOtp", value });
  const setShowOtpModal = (value: boolean) =>
    dispatch({ type: "setShowOtpModal", value });
  const setPendingPhone = (value: string) =>
    dispatch({ type: "setPendingPhone", value });
  const setIsPhoneVerified = (value: boolean) =>
    dispatch({ type: "setIsPhoneVerified", value });
  const setIsEmailVerified = (value: boolean) =>
    dispatch({ type: "setIsEmailVerified", value });

  // Check if a value looks like a valid name (not email or phone)
  const looksLikeValidName = (value: string | undefined | null): boolean => {
    if (!value) return false;
    // Check if it looks like an email (contains @)
    if (value.includes('@')) return false;
    // Check if it looks like a phone number (mostly digits with optional +)
    if (/^\+?[\d\s\-()]{7,}$/.test(value)) return false;
    return value.trim().length > 0;
  };

  // For Google login, extract name from the full name field
  const getAutoFirstName = () => {
    // Only use firstName if it looks like a valid name
    if (looksLikeValidName(sessionUser?.firstName)) {
      return sessionUser?.firstName || "";
    }
    if (isGoogleLogin && sessionUser?.name) {
      const parts = sessionUser.name.split(' ');
      return parts[0] || '';
    }
    return '';
  };

  const getAutoLastName = () => {
    // Only use lastName if it looks like a valid name
    if (looksLikeValidName(sessionUser?.lastName)) {
      return sessionUser?.lastName || "";
    }
    if (isGoogleLogin && sessionUser?.name) {
      const parts = sessionUser.name.split(' ');
      parts.shift(); // Remove first name
      return parts.join(' ');
    }
    return '';
  };

  const autoFilledFirstName = getAutoFirstName();
  const autoFilledLastName = getAutoLastName();
  const autoFilledEmail = sessionUser?.email || '';

  const redirectUrl = getSearchParam("redirect") || "/";

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
      firstName: autoFilledFirstName,
      lastName: autoFilledLastName,
      email: autoFilledEmail,
      phone: formatPhoneNumber(sessionUser?.phone),
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
    // Phone is verified ONLY if backend marked it during login
    // For all login types (Phone OTP, Email OTP, Google), user may need to verify phone via OTP
    setIsPhoneVerified(Boolean(sessionUser?.phoneVerified));
    setIsEmailVerified(
      Boolean(
        sessionUser?.emailVerified ||
        isEmailOtpLogin
      )
    );
  }, [
    sessionUser?.phoneVerified,
    sessionUser?.emailVerified,
    isEmailOtpLogin
  ]);

  useEffect(() => {
    if (!watchedPhone) return;
    if (watchedPhone !== formatPhoneNumber(sessionUser?.phone)) {
      setIsPhoneVerified(false);
    }
  }, [watchedPhone, sessionUser?.phone]);

  useEffect(() => {
    if (!sessionUser || hasInitializedRef.current) return;
    const resolvedNames = resolveNameParts(sessionUser);
    // For Google login, also check the full name field
    const firstName = resolvedNames.firstName || autoFilledFirstName;
    const lastName = resolvedNames.lastName || autoFilledLastName;
    // If still empty for Google login, try to split the full name
    let finalFirstName = firstName;
    let finalLastName = lastName;
    if (isGoogleLogin && (!finalFirstName || !finalLastName) && sessionUser.name) {
      const parts = sessionUser.name.split(' ');
      finalFirstName = finalFirstName || parts[0] || '';
      finalLastName = finalLastName || parts.slice(1).join(' ') || '';
    }
    form.reset({
      firstName: finalFirstName,
      lastName: finalLastName,
      email: sessionUser.email || autoFilledEmail,
      phone: formatPhoneNumber(sessionUser.phone),
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
    hasInitializedRef.current = true;
  }, [sessionUser, form, isGoogleLogin, autoFilledFirstName, autoFilledLastName, autoFilledEmail]);

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

      // Validate phone length for OTP
      const phoneDigits = phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 10) {
        showErrorToast("Please enter a valid phone number with country code.", { id: TOAST_IDS.PROFILE.COMPLETE });
        return;
      }

      setIsSendingOtp(true);
      await clinicApiClient.requestOTP({
        identifier: phone,
        ...(sessionUser?.clinicId ? { clinicId: sessionUser.clinicId } : {}),
      });
      setPendingPhone(phone);
      setShowOtpModal(true);
      showSuccessToast("OTP sent to your phone.", { id: TOAST_IDS.PROFILE.COMPLETE });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorLower = errorMessage.toLowerCase();

      if (errorLower.includes("user") && errorLower.includes("not found")) {
        showErrorToast("This phone is not linked yet. Please try a different number or continue with OTP sign-up.", {
          id: TOAST_IDS.PROFILE.COMPLETE,
        });
      } else if (errorLower.includes("expired") || errorLower.includes("unauthorized")) {
        showErrorToast("Session expired. Please log in again.", {
          id: TOAST_IDS.AUTH.LOGIN,
          duration: 5000,
        });
        window.location.href = '/auth/login';
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

    // Invalidate all clinic-related queries to ensure fresh data loads immediately
    // Use more permissive invalidation by using prefix matching instead of exact keys
    const clinicQueryKeys = ['myClinic', 'clinicLocations', 'clinicDoctors', 'doctors', 'activeLocations', 'current-clinic'];
    clinicQueryKeys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });

    setTimeout(() => {
      try {
        if (onComplete) {
          onComplete();
        } else {
          const userRole = sessionUser?.role as Role;
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
        phoneVerified: isPhoneVerified,
        emailVerified: isEmailVerified,
      };

      // Validation based on login method
      // Email OTP login: needs phone verification
      if (isEmailOtpLogin && !isPhoneVerified) {
        form.setError("phone", {
          type: "manual",
          message: "Please verify your phone number via OTP before completing the profile.",
        });
        return;
      }

      // Google login: needs phone verification (phone not verified at login time)
      if (isGoogleLogin && !isPhoneVerified) {
        form.setError("phone", {
          type: "manual",
          message: "Please verify your phone number via OTP before completing the profile.",
        });
        return;
      }

      // Phone OTP: phone already verified by backend, no extra validation needed

      // Phone OTP login: needs name (email optional)
      if (isPhoneOtpLogin && (!data.firstName?.trim() || !data.lastName?.trim())) {
        if (!data.firstName?.trim()) {
          form.setError("firstName", { type: "required", message: "First name is required" });
        }
        if (!data.lastName?.trim()) {
          form.setError("lastName", { type: "required", message: "Last name is required" });
        }
        return;
      }

      // Email OTP login: needs name (email already verified)
      if (isEmailOtpLogin && (!data.firstName?.trim() || !data.lastName?.trim())) {
        if (!data.firstName?.trim()) {
          form.setError("firstName", { type: "required", message: "First name is required" });
        }
        if (!data.lastName?.trim()) {
          form.setError("lastName", { type: "required", message: "Last name is required" });
        }
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
      const userRole = sessionUser?.role;
      if (userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR) {
        roleSpecificData = {
          specialization: data.specialization,
          experience: data.experience ? parseInt(data.experience, 10) : undefined,
        };
      }

      await updateProfile({ ...baseProfileData, ...roleSpecificData } as Record<string, unknown>);
    } catch (error) {
      logger.error("Profile completion error", error instanceof Error ? error : new Error(String(error)));

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
          logger.warn("Error parsing validation error", {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
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
          push(ROUTES.LOGIN);
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

  const userRole = sessionUser?.role as Role;
  const isDoctor = userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR;

  if (!sessionUser || !hasInitializedRef.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm sm:max-w-lg">
      <Card className="w-full border-border shadow-sm">

        {/* â”€â”€ Header â”€â”€ */}
        <CardHeader className="px-5  sm:px-6 ">
          <CardTitle className="text-base sm:text-lg font-semibold text-center">
            Complete Your Profile
          </CardTitle>
        </CardHeader>

        {/* â”€â”€ Body â”€â”€ */}
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* â”€â”€ Basic Information â”€â”€ */}
              <section className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Basic Information
                </h3>

                {/* First Name / Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          First Name
                          {(isPhoneOtpLogin || isEmailOtpLogin) && <span className="text-destructive">*</span>}
                          {isGoogleLogin && <ShieldCheck className="size-3 text-emerald-500" aria-label="Auto-filled from Google" />}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="First name"
                            disabled={isGoogleLogin}
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
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          Last Name
                          {(isPhoneOtpLogin || isEmailOtpLogin) && <span className="text-destructive">*</span>}
                          {isGoogleLogin && <ShieldCheck className="size-3 text-emerald-500" aria-label="Auto-filled from Google" />}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Last name"
                            disabled={isGoogleLogin}
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

                {/* Email (auto-filled for Google, auto-verified for Email OTP) */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                        Email
                        {isGoogleLogin && <ShieldCheck className="size-3 text-emerald-500" aria-label="Auto-filled from Google" />}
                        {isEmailOtpLogin && isEmailVerified && <ShieldCheck className="size-3 text-emerald-500" aria-label="Verified via Email OTP" />}
                      </FormLabel>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1">
                          <Input
                            type="email"
                            placeholder="Email"
                            disabled={isGoogleLogin || isEmailOtpLogin}
                            className="h-10 sm:h-9 text-sm"
                            aria-invalid={!!form.formState.errors.email}
                            {...field}
                          />
                        </div>
                        {isEmailVerified && (
                          <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium h-10 sm:h-9 px-3 sm:px-2">
                            <ShieldCheck className="size-3" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                        <Phone className="size-3" />
                        Phone
                        {(isGoogleLogin || isEmailOtpLogin) && <span className="text-destructive">*</span>}
                        {isPhoneOtpLogin && <span className="text-destructive">*</span>}
                        {isPhoneVerified && <ShieldCheck className="size-3 text-emerald-500" aria-label="Phone verified" />}
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
                            <ShieldCheck className="size-3" />
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
                              <Loader2 className="size-3 animate-spin" />
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
                      const today = currentTimestamp ? new Date(currentTimestamp) : new Date(0);
                      const maxDate = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
                      const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
                      return (
                        <FormItem className="flex flex-col">
                          <FormLabel className="flex items-center gap-1">
                            <Calendar className="size-3" />
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
                                  suppressHydrationWarning
                                >
                                  <CalendarIcon className="mr-2 size-4 shrink-0" />
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
                                  if (!currentTimestamp) return;
                                  const today = new Date(currentTimestamp);
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
                          <Venus className="size-3" />
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
                        <MapPin className="size-3" />
                        Address
                        <span className="text-muted-foreground text-[10px]">(Optional)</span>
                      </FormLabel>
                      <Textarea
                        placeholder="Enter address"
                        aria-invalid={!!form.formState.errors.address}
                        className="min-h-[60px] sm:min-h-[70px] resize-none text-sm"
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </section>

              {/* â”€â”€ Emergency Contact â”€â”€ */}
              <section className="rounded-lg border p-4 space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Emergency Contact
                </h3>

                <div className="space-y-4">
                  {/* Row 1: Name & Relation */}
                  <div className="grid grid-cols-2 gap-4">
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
                          <Phone className="size-3" />
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

              {/* â”€â”€ Professional Information (doctors only) â”€â”€ */}
              {isDoctor && (
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-foreground">
                    Professional Info
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
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

              {/* â”€â”€ Submit â”€â”€ */}
              <Button
                type="submit"
                disabled={isSubmitting || updatingProfile}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 dark:from-emerald-700 dark:to-teal-700 dark:hover:from-emerald-800 dark:hover:to-teal-800 text-white font-semibold h-11 sm:h-10 text-sm sm:text-base rounded-lg"
              >
                {isSubmitting || updatingProfile ? (
                  <>
                    <Loader2 className="mr-2 size-4 sm:h-3.5 animate-spin" />
                    <span className="hidden sm:inline">Completing Profile…</span>
                    <span className="sm:hidden">Submitting…</span>
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

export default function ProfileCompletionForm(props: ProfileCompletionFormProps) {
  return (
    <Suspense fallback={null}>
      <ProfileCompletionFormContent {...props} />
    </Suspense>
  );
}



