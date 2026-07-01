"use client";

import React, {
  Suspense,
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
  useReducer,
} from "react";
import { useForm } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryClient } from "@/hooks/core";
import { useSetProfileComplete, useUpdateUserProfile } from "@/hooks/query";
import { getProfileCompletionRedirectUrl } from "@/lib/config/profile";
import { getDashboardByRole, ROUTES } from "@/lib/config/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { OtpCodeInput } from "@/components/auth/otp-code-input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { APP_CONFIG } from "@/lib/config/config";
import {
  Loader2,
  Phone,
  MapPin,
  Calendar,
  Venus,
  CalendarIcon,
  ShieldCheck,
} from "lucide-react";
import { Role } from "@/types/auth.types";
import {
  createProfileCompletionSchema,
  type SchemaProfileCompletionFormData as ProfileCompletionFormData,
} from "@/lib/schema";
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
  action: ProfileCompletionAction,
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
    | {
        firstName?: string | undefined;
        lastName?: string | undefined;
        name?: string | undefined;
      }
    | null
    | undefined,
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
  const resolvedClinicId = session?.user?.clinicId || APP_CONFIG.CLINIC.ID;

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
      await clinicApiClient.requestOTP({
        identifier: phone,
        clinicId: resolvedClinicId,
      });
      setCountdown(30);
      setOtp("");
    } catch (error) {
      if (error instanceof Error && error.message.includes("expired")) {
        window.location.href = "/auth/login";
      } else {
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to resend OTP"
        );
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
      const response = await clinicApiClient.post(
        API_ENDPOINTS.AUTH.VERIFY_PHONE,
        {
          phone,
          otp: otp.trim(),
        },
      );
      const data = response.data as Record<string, unknown>;
      const result = (data.data || data) as Record<string, unknown>;
      if (result.phoneVerified !== false) {
        setOtp("");
        setErrorMessage(null);
        onVerified();
        onOpenChange(false);
      } else {
        setErrorMessage("Invalid OTP. Please try again.");
      }
    } catch (error) {
      // Use structured error handling instead of string matching
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        // Handle specific error types with clear messages - order matters (most specific first)
        if (errorMsg.includes("auth_otp_invalid")) {
          setErrorMessage("Invalid OTP. Please check and try again.");
        } else if (
          errorMsg.includes("expired") ||
          errorMsg.includes("session")
        ) {
          window.location.href = "/auth/login";
        } else if (
          errorMsg.includes("otp_not_found") ||
          errorMsg.includes("otp_expired") ||
          errorMsg.includes("invalid_verification_code") ||
          errorMsg.includes("invalid verification code")
        ) {
          setErrorMessage("Invalid or expired OTP. Please request a new one.");
        } else if (
          errorMsg.includes("locked") ||
          errorMsg.includes("too many attempts")
        ) {
          setErrorMessage(
            "Too many attempts. Please wait before trying again.",
          );
        } else if (
          errorMsg.includes("network") ||
          errorMsg.includes("fetch") ||
          errorMsg.includes("request")
        ) {
          setErrorMessage("Network error. Please check your connection.");
        } else {
          // Show the actual error message for other errors
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
    return;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-border bg-background text-foreground shadow-xl dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
            Verify Phone Number
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the 4-6 digit code sent to{" "}
            <span className="font-medium text-foreground dark:text-slate-100">
              {phone}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
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
              <p className="text-sm text-destructive text-center">
                {errorMessage}
              </p>
            )}
          </div>
          <Button
            onClick={handleVerify}
            disabled={otp.length < 6 || isVerifying}
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:text-slate-950 dark:hover:bg-emerald-400"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
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
            className="text-muted-foreground hover:text-foreground"
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
  const router = useRouter();
  const { push } = router;
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const sessionUser = session?.user;
  const queryClient = useQueryClient();
  const setProfileCompletion = useAuthStore(
    (state) => state.setProfileCompletion,
  );
  const setAuthSession = useAuthStore((state) => state.setSession);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const currentTimestamp = useCurrentTimestamp();
  const getSearchParam = useMemo(
    () => searchParams.get.bind(searchParams),
    [searchParams],
  );
  // Login method flags (must be defined before useState hooks that use them)
  const loginMethod = sessionUser?.loginMethod;
  const isGoogleLogin =
    loginMethod === "google_oauth" || Boolean(sessionUser?.googleId);
  // Email OTP login: explicit email_otp only
  const isEmailOtpLogin =
    loginMethod === "email_otp" ||
    (!isGoogleLogin && Boolean(sessionUser?.emailVerified) && Boolean(sessionUser?.email));
  // Phone OTP login: explicit phone_otp, or legacy otp with verified phone
  const isLikelyPhoneBasedSession =
    Boolean(sessionUser?.phone) &&
    !sessionUser?.email &&
    sessionUser?.role === Role.PATIENT;
  const isPhoneOtpLogin =
    loginMethod === "phone_otp" ||
    (loginMethod === "otp" && !!sessionUser?.phoneVerified) ||
    (loginMethod === undefined && !!sessionUser?.phoneVerified) ||
    (loginMethod === undefined && isLikelyPhoneBasedSession);
  const initialPhoneVerified =
    isPhoneOtpLogin ||
    Boolean(sessionUser?.phoneVerified) ||
    isLikelyPhoneBasedSession;
  const initialEmailVerified =
    isEmailOtpLogin || isGoogleLogin || Boolean(sessionUser?.emailVerified);

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
    isPhoneVerified: initialPhoneVerified,
    isEmailVerified: initialEmailVerified,
  });
  const lastInitializedSessionKeyRef = useRef<string>("");
  const isSubmittingRef = useRef<boolean>(false);

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
    if (value.includes("@")) return false;
    // Check if it looks like a phone number (mostly digits with optional +)
    if (/^\+?[\d\s\-()]{7,}$/.test(value)) return false;
    return value.trim().length > 0;
  };

  const getAutoFirstName = () => {
    if (!isGoogleLogin) {
      return "";
    }
    if (looksLikeValidName(sessionUser?.firstName)) {
      return sessionUser?.firstName || "";
    }
    if (sessionUser?.name) {
      const parts = sessionUser.name.trim().split(/\s+/);
      return parts[0] || "";
    }
    return "";
  };

  const getAutoLastName = () => {
    if (!isGoogleLogin) {
      return "";
    }
    if (looksLikeValidName(sessionUser?.lastName)) {
      return sessionUser?.lastName || "";
    }
    if (sessionUser?.name) {
      const parts = sessionUser.name.trim().split(/\s+/);
      parts.shift();
      return parts.join(" ");
    }
    return "";
  };

  const autoFilledFirstName = getAutoFirstName();
  const autoFilledLastName = getAutoLastName();
  const autoFilledEmail = isPhoneOtpLogin ? "" : sessionUser?.email || "";
  const showEmailField = true;
  const googleNameCacheRef = useRef<{ firstName: string; lastName: string }>({
    firstName: "",
    lastName: "",
  });
  const sessionIdentityKey = useMemo(
    () =>
      [
        sessionUser?.id || "",
        loginMethod || "",
        sessionUser?.email || "",
        sessionUser?.phone || "",
        sessionUser?.googleId || "",
        sessionUser?.firstName || "",
        sessionUser?.lastName || "",
        sessionUser?.name || "",
        String(sessionUser?.profileComplete ?? ""),
        String(sessionUser?.emailVerified ?? ""),
        String(sessionUser?.phoneVerified ?? ""),
      ].join("|"),
    [
      sessionUser?.id,
      loginMethod,
      sessionUser?.email,
      sessionUser?.phone,
      sessionUser?.googleId,
      sessionUser?.firstName,
      sessionUser?.lastName,
      sessionUser?.name,
      sessionUser?.profileComplete,
      sessionUser?.emailVerified,
      sessionUser?.phoneVerified,
    ],
  );

  const redirectUrl = getSearchParam("redirect") || "/";
  const profileCompletionSchema = useMemo(
    () =>
      createProfileCompletionSchema({
        isPhoneOtpLogin,
        isEmailOtpLogin,
        isGoogleLogin,
      }),
    [isPhoneOtpLogin, isEmailOtpLogin, isGoogleLogin],
  );

  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return "";
    if (phone.startsWith("+")) return phone;
    const cleaned = phone.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  };

  const initialPhoneValue =
    isPhoneOtpLogin || initialPhoneVerified
      ? formatPhoneNumber(sessionUser?.phone)
      : "";

  const form = useForm<ProfileCompletionFormData>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      firstName: autoFilledFirstName,
      lastName: autoFilledLastName,
      email: autoFilledEmail,
      phone: initialPhoneValue,
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

  const watchedPhone = useWatch({ control: form.control, name: "phone" });

  useEffect(() => {
    const nextPhoneVerified =
      isPhoneOtpLogin || Boolean(sessionUser?.phoneVerified);
    const nextEmailVerified =
      isEmailOtpLogin || isGoogleLogin || Boolean(sessionUser?.emailVerified);

    // Only update verification flags if NOT already verified locally
    // This prevents re-renders from resetting the verified state after OTP verification
    if (nextPhoneVerified && !isPhoneVerified) {
      setIsPhoneVerified(true);
    }

    if (nextEmailVerified && !isEmailVerified) {
      setIsEmailVerified(true);
    }
  }, [
    sessionUser?.phoneVerified,
    sessionUser?.emailVerified,
    isPhoneOtpLogin,
    isEmailOtpLogin,
    isGoogleLogin,
    isPhoneVerified,
    isEmailVerified,
  ]);

  useEffect(() => {
    if (!watchedPhone) return;
    // Only unverify phone if user changed it to a different number
    // For phone OTP login: compare with session phone
    // For email OTP/Google login: compare with the verified phone (pendingPhone)
    if (isPhoneOtpLogin) {
      if (watchedPhone !== formatPhoneNumber(sessionUser?.phone)) {
        setIsPhoneVerified(false);
      }
    } else if (isEmailOtpLogin || isGoogleLogin) {
      // For email OTP/Google login, if phone is verified and user changes it, require re-verification
      if (
        isPhoneVerified &&
        watchedPhone !== pendingPhone &&
        watchedPhone.trim()
      ) {
        setIsPhoneVerified(false);
      }
    }
  }, [
    watchedPhone,
    sessionUser?.phone,
    pendingPhone,
    isPhoneOtpLogin,
    isEmailOtpLogin,
    isGoogleLogin,
    isPhoneVerified,
  ]);

  useEffect(() => {
    if (!sessionUser) return;
    if (lastInitializedSessionKeyRef.current === sessionIdentityKey) return;
    const finalFirstName = isGoogleLogin
      ? autoFilledFirstName ||
        googleNameCacheRef.current.firstName ||
        resolveNameParts(sessionUser).firstName
      : "";
    const finalLastName = isGoogleLogin
      ? autoFilledLastName ||
        googleNameCacheRef.current.lastName ||
        resolveNameParts(sessionUser).lastName
      : "";
    if (isGoogleLogin) {
      googleNameCacheRef.current = {
        firstName: finalFirstName || googleNameCacheRef.current.firstName,
        lastName: finalLastName || googleNameCacheRef.current.lastName,
      };
    }
    form.reset({
      firstName: finalFirstName,
      lastName: finalLastName,
      email: isPhoneOtpLogin ? "" : sessionUser.email || autoFilledEmail,
      phone: initialPhoneValue,
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
    lastInitializedSessionKeyRef.current = sessionIdentityKey;
  }, [
    sessionUser,
    form,
    isGoogleLogin,
    isPhoneOtpLogin,
    autoFilledFirstName,
    autoFilledLastName,
    autoFilledEmail,
    sessionIdentityKey,
  ]);

  const updateProfileMutation = useUpdateUserProfile();
  const setProfileCompleteMutation = useSetProfileComplete();
  const updatingProfile = updateProfileMutation.isPending;

  const syncCompletedProfileState = useCallback(
    (profileData: Record<string, unknown>) => {
      queryClient.setQueryData<Record<string, unknown>>(["userProfile"], (current) => {
        const currentProfile =
          current && typeof current === "object" ? (current as Record<string, unknown>) : {};

        const mergedName = [
          String(profileData.firstName || currentProfile.firstName || "").trim(),
          String(profileData.lastName || currentProfile.lastName || "").trim(),
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        return {
          ...currentProfile,
          ...profileData,
          ...(mergedName ? { name: mergedName } : {}),
          phoneVerified: true,
          profileComplete: true,
          isProfileComplete: true,
          requiresProfileCompletion: false,
          updatedAt: new Date().toISOString(),
        };
      });

      queryClient.setQueryData<Session | null>(["session"], (current) => {
        const source = current || session;
        if (!source?.user) return source;

        const mergedName = [
          String(profileData.firstName || source.user.firstName || "").trim(),
          String(profileData.lastName || source.user.lastName || "").trim(),
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        const updatedUser = {
          ...source.user,
          ...(profileData || {}),
          ...(mergedName ? { name: mergedName } : {}),
          phoneVerified: true,
          profileComplete: true,
          isProfileComplete: true,
        };

        setAuthUser(updatedUser as typeof source.user);
        setAuthSession({ ...source, user: updatedUser });

        return { ...source, user: updatedUser };
      });
    },
    [queryClient, session, setAuthSession, setAuthUser],
  );

  const sendPhoneOtp = async () => {
    try {
      const phone = formatPhoneNumber(form.getValues("phone"));
      if (!phone) {
        form.setError("phone", {
          type: "manual",
          message: "Enter a phone number first.",
        });
        return;
      }

      // Validate phone length for OTP
      const phoneDigits = phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 10) {
        form.setError("phone", {
          type: "manual",
          message: "Please enter a valid phone number with country code.",
        });
        return;
      }

      setIsSendingOtp(true);
      await clinicApiClient.requestOTP({
        identifier: phone,
        clinicId: sessionUser?.clinicId || APP_CONFIG.CLINIC.ID,
      });
      setPendingPhone(phone);
      setShowOtpModal(true);
      form.clearErrors("phone");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorLower = errorMessage.toLowerCase();

      if (errorLower.includes("user") && errorLower.includes("not found")) {
        form.setError("phone", {
          type: "server",
          message:
            "This phone is not linked yet. Please try a different number or continue with OTP sign-up.",
        });
      } else if (
        errorLower.includes("expired") ||
        errorLower.includes("unauthorized")
      ) {
        window.location.href = "/auth/login";
      } else if (errorLower.includes("rate limit")) {
        form.setError("phone", {
          type: "server",
          message: "Too many requests. Please wait a moment and try again.",
        });
      } else {
        form.setError("phone", {
          type: "server",
          message: errorMessage || "Failed to send OTP. Please try again.",
        });
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handlePhoneVerified = () => {
    setIsPhoneVerified(true);
  };

  const updateProfile = async (profileData: Record<string, unknown>) => {
    const result = await updateProfileMutation.mutateAsync(profileData);
    // Simple response structure: { success, profileComplete, error? }
    const response = result as {
      success?: boolean;
      error?: string;
      profileComplete?: boolean;
      validationErrors?: Array<{
        field: string;
        constraints: Record<string, string>;
      }>;
    };

    logger.info('[ProfileCompletionForm] updateProfile result:', {
      resultKeys: result && typeof result === 'object' ? Object.keys(result as Record<string, unknown>) : undefined,
      success: response?.success,
      profileComplete: response?.profileComplete,
      error: response?.error
    });

    // Backend validation is the source of truth
    // Only proceed if backend confirms success
    if (!response || response.success === false) {
      // If we have field-level validation errors, set them on the form
      if (response?.validationErrors && response.validationErrors.length > 0) {
        const fieldNames = Object.keys(form.getValues()) as Array<
          keyof ProfileCompletionFormData
        >;
        let hasFieldError = false;

        for (const validationError of response.validationErrors) {
          const fieldName =
            validationError.field as keyof ProfileCompletionFormData;
          if (fieldNames.includes(fieldName)) {
            const constraintMessages = Object.values(
              validationError.constraints,
            );
            form.setError(fieldName, {
              type: "server",
              message: constraintMessages[0] || "Invalid value",
            });
            hasFieldError = true;
          }
        }

        if (hasFieldError) {
          // Field errors are displayed inline via FormMessage components
          // No toast needed - user will see errors next to each field
          isSubmittingRef.current = false;
          setIsSubmitting(false);
          return;
        }
      }

      // Show non-field-level failures as a form-wide error
      form.setError("root", {
        type: "server",
        message: response?.error || "Failed to complete profile",
      });
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Clear any previous form-level error from an earlier failed submit.
    form.clearErrors("root");

    // If the PATCH was successful, the backend processed the profile update.
    // We trust the response's profileComplete flag as the primary source,
    // but also do a fallback verification via getUserProfile if unclear.
    // The backend nests completion flags under `user` (ProfileCompletionDto
    // returns { success, message, user: { profileComplete, isProfileComplete } }).
    // Reading from BOTH response-level (legacy / forward-compatible) and
    // user-level (current backend shape) avoids false fallbacks when the
    // server is the source of truth.
    const userLevelFlag = (response as { user?: { profileComplete?: boolean; isProfileComplete?: boolean } } | undefined)?.user;
    const isProfileCompleteFromBackend =
      response?.profileComplete === true ||
      userLevelFlag?.profileComplete === true ||
      userLevelFlag?.isProfileComplete === true;

    logger.info('[ProfileCompletionForm] updateProfile result:', {
      success: response?.success,
      responseProfileComplete: response?.profileComplete,
      userProfileComplete: userLevelFlag?.profileComplete,
      userIsProfileComplete: userLevelFlag?.isProfileComplete,
      isProfileCompleteFromBackend,
      responseKeys: result && typeof result === 'object' ? Object.keys(result as Record<string, unknown>) : undefined,
    });

    if (isProfileCompleteFromBackend) {
      // Backend confirmed profile is complete - redirect FIRST before updating
      // state to prevent the ProfileCompletionContent useEffect from racing
      // and redirecting without the correct redirectUrl.
      const userRole = sessionUser?.role as Role;
      const safeRedirectUrl =
        redirectUrl &&
        redirectUrl !== "/" &&
        !redirectUrl.startsWith("/auth/")
          ? redirectUrl
          : undefined;
      const finalRedirect = getProfileCompletionRedirectUrl(
        userRole,
        safeRedirectUrl,
      );
      logger.info('[ProfileCompletionForm] Redirecting to:', {
        finalRedirect,
        userRole,
        safeRedirectUrl,
        redirectUrl
      });

      // Wait for cookie to be set server-side BEFORE navigating
      // This ensures the proxy sees the profile_complete cookie on the next request
      try {
        await setProfileCompleteMutation.mutateAsync(true);
        logger.info('[ProfileCompletionForm] Cookie set successfully, navigating');
      } catch (cookieError) {
        logger.warn("Unable to sync profile-complete cookie before redirect", {
          error: cookieError instanceof Error ? cookieError.message : String(cookieError),
        });
        // Continue anyway - the action may have already set the cookie
      }

      // Update frontend state
      setProfileCompletion(true, false);
      syncCompletedProfileState(profileData);

      // Invalidate clinic queries
      const clinicQueryKeys = [
        "myClinic",
        "clinicLocations",
        "clinicDoctors",
        "doctors",
        "activeLocations",
        "current-clinic",
      ];
      clinicQueryKeys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });

      // Now navigate with cookie properly set
      window.location.replace(finalRedirect);
    } else {
      logger.warn('[ProfileCompletionForm] Backend did not confirm profile completion:', {
        responseProfileComplete: response?.profileComplete,
        profileDataKeys: profileData && typeof profileData === 'object' ? Object.keys(profileData) : undefined,
      });

      form.setError("root", {
        type: "server",
        message:
          response?.error ||
          "Profile was saved, but the server could not confirm completion. Please verify your name and phone number, then try again.",
      });
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const onSubmit = async (data: ProfileCompletionFormData) => {
    // Prevent duplicate submissions using ref (synchronous check)
    if (isSubmittingRef.current || isSubmitting || updateProfileMutation.isPending) {
      return;
    }
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      // Defense-in-depth: explicitly require non-empty firstName AND lastName
      // before hitting the backend. Zod schema validation should catch this
      // too, but this guards against silent form-state drift (e.g. stale
      // auto-fill values that bypassed schema validation).
      const firstNameValid =
        typeof data.firstName === 'string' && data.firstName.trim().length > 0;
      const lastNameValid =
        typeof data.lastName === 'string' && data.lastName.trim().length > 0;
      if (!firstNameValid || !lastNameValid) {
        if (!firstNameValid) {
          form.setError('firstName', {
            type: 'required',
            message: 'First name is required',
          });
        }
        if (!lastNameValid) {
          form.setError('lastName', {
            type: 'required',
            message: 'Last name is required',
          });
        }
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // Validation: For email OTP and Google login, phone must be verified
      // before the profile can be completed, regardless of whether the
      // user already typed a phone number.
      if ((isEmailOtpLogin || isGoogleLogin) && !isPhoneVerified) {
        form.setError("phone", {
          type: "manual",
          message:
            "Please verify your phone number via OTP before completing the profile.",
        });
        isSubmittingRef.current = false;
        setIsSubmitting(false);
        return;
      }

      // For phone OTP login, use the verified phone from session
      // For email OTP / Google login, include verified email from session
      // For other login methods, include fields as filled in the form
      let resolvedPhone: string | undefined;
      if (isPhoneOtpLogin) {
        // Phone is already verified by backend, use session phone
        resolvedPhone = formatPhoneNumber(sessionUser?.phone) || undefined;
      } else if (data.phone?.trim() && isPhoneVerified) {
        // For other login methods, include phone only if user has verified it
        resolvedPhone = formatPhoneNumber(data.phone);
      }

      // Email is optional for phone OTP users and comes from the login/session
      // context for Google/email OTP users. It is accepted by the backend
      // profile-completion DTO for account notifications.
      const resolvedEmail =
        isPhoneOtpLogin
          ? data.email?.trim() || undefined
          : isEmailOtpLogin || isGoogleLogin
            ? sessionUser?.email
            : data.email?.trim() || undefined;

      const baseProfileData: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        ...(resolvedEmail ? { email: resolvedEmail } : {}),
        // Include phone if available and verified
        ...(resolvedPhone ? { phone: resolvedPhone } : {}),
        // Only include dateOfBirth if it's not empty
        ...(data.dateOfBirth?.trim() ? { dateOfBirth: data.dateOfBirth } : {}),
        gender: data.gender ? data.gender.toUpperCase() : undefined,
        // Only include address if it's not empty
        ...(data.address?.trim() ? { address: data.address } : {}),
        phoneVerified: isPhoneVerified,
        // emailVerified is intentionally not sent — the User table has no
        // `emailVerified` column, so the backend silently drops it. The DTO
        // was cleaned up to no longer accept this field.
        // Include clinicName and clinicAddress when provided
        ...(data.clinicName?.trim()
          ? { clinicName: data.clinicName.trim() }
          : {}),
        ...(data.clinicAddress?.trim()
          ? { clinicAddress: data.clinicAddress.trim() }
          : {}),
      };

      if (!data.firstName?.trim() || !data.lastName?.trim()) {
        if (!data.firstName?.trim()) {
          form.setError("firstName", {
            type: "required",
            message: "First name is required",
          });
        }
        if (!data.lastName?.trim()) {
          form.setError("lastName", {
            type: "required",
            message: "Last name is required",
          });
        }
        isSubmittingRef.current = false;
        setIsSubmitting(false);
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
          experience: data.experience
            ? parseInt(data.experience, 10)
            : undefined,
        };
      }

      await updateProfile({ ...baseProfileData, ...roleSpecificData } as Record<
        string,
        unknown
      >);
    } catch (error) {
      logger.error(
        "Profile completion error",
        error instanceof Error ? error : new Error(String(error)),
      );

      // Helper function to extract field-level validation errors from various error structures
      const extractFieldErrors = (
        err: unknown,
      ): Array<{ field: string; message: string }> | null => {
        if (!err || typeof err !== "object") return null;

        const record = err as Record<string, unknown>;

        // Check for validationErrors array (from our server action)
        if (
          Array.isArray(record.validationErrors) &&
          record.validationErrors.length > 0
        ) {
          return record.validationErrors.map(
            (e: { field: string; constraints: Record<string, string> }) => ({
              field: e.field,
              message: Object.values(e.constraints)[0] || "Invalid value",
            }),
          );
        }

        // Check for errors array (common backend pattern)
        if (Array.isArray(record.errors) && record.errors.length > 0) {
          return record.errors.map((e: Record<string, unknown>) => ({
            field: String(e.field || e.property || ""),
            message: String(e.message || "Invalid value"),
          }));
        }

        // Check for details nested object
        if (record.details && typeof record.details === "object") {
          return extractFieldErrors(record.details);
        }

        // Check for response nested object (axios-style errors)
        if (record.response && typeof record.response === "object") {
          return extractFieldErrors(record.response);
        }

        return null;
      };

      // Try to extract and set field-level errors
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors && fieldErrors.length > 0) {
        fieldErrors.forEach(({ field, message }) => {
          form.setError(field as keyof ProfileCompletionFormData, {
            type: "server",
            message,
          });
        });
        // Errors are displayed inline via FormMessage components
        return;
      }

      // Fallback: check if error message contains JSON with errors
      if (error instanceof Error) {
        const msg = error.message;

        // Try to parse JSON errors embedded in message
        const jsonMatch =
          msg.match(/\{[\s\S]*"errors"[\s\S]*\}/i) ||
          msg.match(/\{[\s\S]*"validationErrors"[\s\S]*\}/i);
        if (jsonMatch) {
          try {
            const errorData = JSON.parse(jsonMatch[0]);
            if (errorData.errors || errorData.validationErrors) {
              const errors = errorData.errors || errorData.validationErrors;
              Object.entries(errors).forEach(([field, message]) => {
                form.setError(field as keyof ProfileCompletionFormData, {
                  type: "server",
                  message: message as string,
                });
              });
              return;
            }
          } catch {
            // JSON parsing failed, continue to other handlers
          }
        }

        // Check for session errors
        if (
          msg.includes("Session validation failed") ||
          msg.includes("Invalid device") ||
          msg.includes("Invalid session") ||
          msg.includes("invalid session")
        ) {
          push(ROUTES.LOGIN);
        } else if (
          msg.includes("500") ||
          msg.includes("Server encountered an error")
        ) {
          form.setError("root", {
            type: "server",
            message: "The server encountered an error. Please try again in a few moments.",
          });
        } else {
          form.setError("root", {
            type: "server",
            message: msg || "Failed to complete profile. Please try again.",
          });
        }
      } else {
        form.setError("root", {
          type: "server",
          message: "Failed to complete profile. Please try again.",
        });
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const userRole = sessionUser?.role as Role;
  const isPatient = userRole === Role.PATIENT;
  const isDoctor =
    userRole === Role.DOCTOR || userRole === Role.ASSISTANT_DOCTOR;

  useEffect(() => {
    if (!sessionUser) return;
    if (userRole !== Role.PATIENT) {
      const finalRedirect = getDashboardByRole(userRole);
      push(finalRedirect);
    }
  }, [sessionUser, userRole, push, redirectUrl]);

  if (!sessionUser || !isPatient) {
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
      <Card className="w-full border-border bg-card text-card-foreground shadow-sm">
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
              {form.formState.errors.root?.message ? (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {form.formState.errors.root.message}
                </div>
              ) : null}
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
                          <span className="text-destructive">*</span>
                          {isGoogleLogin && (
                            <ShieldCheck
                              className="size-3 text-emerald-500"
                              aria-label="Auto-filled from Google"
                            />
                          )}
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
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          Last Name
                          <span className="text-destructive">*</span>
                          {isGoogleLogin && (
                            <ShieldCheck
                              className="size-3 text-emerald-500"
                              aria-label="Auto-filled from Google"
                            />
                          )}
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

                {showEmailField && (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          Email
                          {isPhoneOtpLogin && (
                            <span className="text-muted-foreground">
                              (optional)
                            </span>
                          )}
                          {isGoogleLogin && (
                            <ShieldCheck
                              className="size-3 text-emerald-500"
                              aria-label="Auto-filled from Google"
                            />
                          )}
                          {/* Use reducer state for email verification to persist after verification */}
                          {isEmailVerified && (
                            <ShieldCheck
                              className="size-3 text-emerald-500"
                              aria-label="Verified"
                            />
                          )}
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
                          {/* Use reducer state for email verification to persist after verification */}
                          {isEmailVerified && (
                            <div className="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 sm:h-9 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <ShieldCheck className="size-3" />
                              <span>Verified</span>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs sm:text-sm flex items-center gap-1">
                          <Phone className="size-3" />
                          Phone
                          {(isGoogleLogin || isEmailOtpLogin) && (
                            <span className="text-muted-foreground">
                              (verify required)
                            </span>
                          )}
                        {/* Phone is required only for email OTP and Google login (not verified at login) */}
                        {(isGoogleLogin || isEmailOtpLogin) && (
                          <span className="text-destructive">*</span>
                        )}
                        {/* Phone is already verified for phone OTP login */}
                        {isPhoneVerified && (
                          <ShieldCheck
                            className="size-3 text-emerald-500"
                            aria-label="Phone verified"
                          />
                        )}
                      </FormLabel>
                      {isPhoneOtpLogin ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex h-10 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm text-emerald-900 sm:h-9 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-100">
                            <span className="truncate">
                              {formatPhoneNumber(sessionUser?.phone) ||
                                "Phone verified"}
                            </span>
                            <span className="ml-3 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/50 dark:text-emerald-300">
                              <ShieldCheck className="size-3" />
                              Verified
                            </span>
                          </div>
                        </div>
                      ) : (
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
                            <div className="inline-flex h-10 items-center justify-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium text-emerald-700 sm:h-9 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                              <ShieldCheck className="size-3" />
                              <span>Verified</span>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              onClick={sendPhoneOtp}
                              disabled={
                                isSendingOtp || !form.getValues("phone")
                              }
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
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {false && (
                  <>
                    {/* Date of Birth / Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => {
                      const today = currentTimestamp
                        ? new Date(currentTimestamp)
                        : new Date(0);
                      const maxDate = new Date(
                        today.getFullYear() - 12,
                        today.getMonth(),
                        today.getDate(),
                      );
                      const minDate = new Date(
                        today.getFullYear() - 100,
                        today.getMonth(),
                        today.getDate(),
                      );
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
                                    (!field.value
                                      ? " text-muted-foreground"
                                      : "")
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
                            <PopoverContent
                              className="w-auto p-0 bg-background dark:bg-neutral-950 border border-border"
                              align="start"
                            >
                              <CalendarComponent
                                mode="single"
                                selected={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) => {
                                  if (!date) return;
                                  if (!currentTimestamp) return;
                                  const today = new Date(currentTimestamp);
                                  let age =
                                    today.getFullYear() - date.getFullYear();
                                  const m = today.getMonth() - date.getMonth();
                                  if (
                                    m < 0 ||
                                    (m === 0 &&
                                      today.getDate() < date.getDate())
                                  )
                                    age--;
                                  if (age < 12) {
                                    form.setError("dateOfBirth", {
                                      type: "manual",
                                      message:
                                        "You must be at least 12 years old",
                                    });
                                  } else {
                                    form.clearErrors("dateOfBirth");
                                    field.onChange(format(date, "yyyy-MM-dd"));
                                  }
                                }}
                                disabled={(date) =>
                                  date > maxDate || date < minDate
                                }
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
                            <SelectTrigger
                              aria-invalid={!!form.formState.errors.gender}
                              className="h-10 sm:h-9"
                            >
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
                        <span className="text-muted-foreground text-[10px]">
                          (Optional)
                        </span>
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
                  </>
                )}
              </section>

              {/* â”€â”€ Emergency Contact â”€â”€ */}
              {false && (
                <section className="rounded-lg border p-4 space-y-4">
                <h3 className="text-sm font-medium text-foreground">
                  Emergency Contact
                </h3>

                <div className="space-y-4">
                  {/* Row 1: Name & Relation */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="emergencyContactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Name
                          </FormLabel>
                          <Input
                            placeholder="Emergency contact name"
                            className="h-10 sm:h-9 text-sm"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergencyContactRelationship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Relation
                          </FormLabel>
                          <Input
                            placeholder="e.g., Parent, Spouse"
                            className="h-10 sm:h-9 text-sm"
                            {...field}
                          />
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
                      <div className="w-full min-w-0">
                        <PhoneInput
                          placeholder="Emergency contact phone"
                          value={field.value || ""}
                          onChange={field.onChange}
                          error={!!form.formState.errors.emergencyContactPhone}
                          defaultCountry="IN"
                          international
                          className="h-10 w-full min-w-0 sm:h-9 text-sm"
                        />
                      </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                </section>
              )}

              {/* â”€â”€ Professional Information (doctors only) â”€â”€ */}
              {false && (
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
                          <FormLabel className="text-xs sm:text-sm">
                            Specialization
                          </FormLabel>
                          <Input
                            placeholder="e.g., Cardiology"
                            className="h-10 sm:h-9 text-sm"
                            {...field}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs sm:text-sm">
                            Experience
                          </FormLabel>
                          <Input
                            placeholder="Years"
                            className="h-10 sm:h-9 text-sm"
                            {...field}
                          />
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
                    <span className="hidden sm:inline">
                      Completing Profile…
                    </span>
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

export default function ProfileCompletionForm(
  props: ProfileCompletionFormProps,
) {
  return (
    <Suspense fallback={null}>
      <ProfileCompletionFormContent {...props} />
    </Suspense>
  );
}
