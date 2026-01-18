"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useQueryData, useMutationOperation } from "@/hooks/core";
import { updateUserProfile, getUserProfile } from "@/lib/actions/users.server";
import { setProfileComplete } from "@/lib/actions/auth.server";
import {
  getProfileCompletionRedirectUrl,
  transformApiResponse,
  type UserProfileData,
} from "@/lib/config/profile";
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
import { Loader2, User, Phone, MapPin, Calendar, Venus, CalendarIcon } from "lucide-react";
import { Role } from "@/types/auth.types";
import { ROUTES } from "@/lib/config/routes";
import { profileCompletionSchema, type SchemaProfileCompletionFormData as ProfileCompletionFormData } from "@/lib/schema";

interface ProfileCompletionFormProps {
  onComplete?: () => void;
}

export default function ProfileCompletionForm({
  onComplete,
}: ProfileCompletionFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, refreshSession } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get("redirect") || "/";

  // Helper to ensure phone number is correctly formatted
  // PhoneInput component with 'international' prop should handle this, 
  // but we ensure it's clean for backend and initial display.
  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return "";
    // If it starts with +, trust it (E.164)
    if (phone.startsWith('+')) return phone;
    
    // Clean string
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) return cleaned;
    
    // If it's a raw number (likely 10 digits in India based on user context), add +91
    if (cleaned.length === 10) return `+91${cleaned}`;
    
    return `+${cleaned}`; // Add + prefix as last resort attempt for E.164
  };

  // Fetch existing user profile data
  const { data: existingProfile, isPending: loadingProfile } =
    useQueryData<UserProfileData | null>(
      ["user-profile-completion"],
      async () => {
        try {
          const response = await getUserProfile();
          console.log("Raw API response:", JSON.stringify(response, null, 2));

          // Transform the API response to match our expected format
          const transformedData = transformApiResponse(response as Record<string, unknown>);
          console.log(
            "Transformed profile data:",
            JSON.stringify(transformedData, null, 2)
          );

          return transformedData;
        } catch (error) {
          console.log("No existing profile data, starting fresh:", error);
          return null;
        }
      },
      {
        enabled: !!session?.access_token,
      }
    );

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

  // Pre-fill form with existing data when available
  useEffect(() => {
    if (existingProfile && !isInitialized) {
      const profile = existingProfile as {
        firstName?: string;
        lastName?: string;
        phone?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
        emergencyContact?: string;
        specialization?: string;
        experience?: string;
        clinicName?: string;
        clinicAddress?: string;
      };
      let emergencyContactName = "";
      let emergencyContactRelationship = "";

      if (profile.emergencyContact && typeof profile.emergencyContact === 'object') {
        const contact = profile.emergencyContact as { name: string; phone: string; relationship: string };
        emergencyContactName = contact.name || "";
        emergencyContactRelationship = contact.relationship || "";
      } else if (typeof profile.emergencyContact === 'string') {
        const [name, rest] = profile.emergencyContact.split(" (") || ["", ""];
        const [relationship] = rest?.split("): ") || ["", ""];
        emergencyContactName = name || "";
        emergencyContactRelationship = relationship?.replace(")", "") || "";
      }

      const formData = {
        firstName: profile.firstName || session?.user?.firstName || "",
        lastName: profile.lastName || session?.user?.lastName || "",
        phone: "", // Leave empty - user will enter fresh
        dateOfBirth: profile.dateOfBirth || "",
        gender: profile.gender
          ? (profile.gender.toLowerCase() as
              | "male"
              | "female"
              | "other")
          : "male",
        address: profile.address || "",
        emergencyContactName,
        emergencyContactPhone: "", // Leave empty - user will enter fresh
        emergencyContactRelationship,
        specialization: profile.specialization || "",
        experience: profile.experience || "",
        clinicName: profile.clinicName || "",
        clinicAddress: profile.clinicAddress || "",
      };

      // Reset form with existing data
      Object.entries(formData).forEach(([key, value]) => {
        form.setValue(key as keyof ProfileCompletionFormData, value);
      });

      setIsInitialized(true);
    } else if (!loadingProfile && !existingProfile && !isInitialized) {
      // If no existing profile, pre-fill with session data
      const sessionData = {
        firstName: session?.user?.firstName || "",
        lastName: session?.user?.lastName || "",
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
      };

      Object.entries(sessionData).forEach(([key, value]) => {
        form.setValue(key as keyof ProfileCompletionFormData, value);
      });

      setIsInitialized(true);
    }
  }, [existingProfile, session, form, loadingProfile, isInitialized]);

  // Update profile mutation
  const updateProfileMutation = useMutationOperation<unknown, Record<string, unknown>>(
    async (data: Record<string, unknown>) => {
      try {
        return await updateUserProfile(data);
      } catch (error) {
        console.error("Profile update error:", error);
        // ✅ Use centralized error handler - don't show toast here
        // The mutation's onError will handle it, or component will handle it
        // Re-throw for the mutation to handle
        throw error;
      }
    },
    {
      toastId: TOAST_IDS.PROFILE.COMPLETE,
      loadingMessage: 'Updating profile...',
      successMessage: 'Profile completed successfully!',
      showToast: false, // Handle manually for custom logic
      invalidateQueries: [['user-profile']],
      onSuccess: async (result) => {
        try {
          // Log the result for debugging
          console.log("Profile update successful:", result);

          // Check if the server action returned an error
          const response = result as { success?: boolean; error?: string };
          if (response && response.success === false && response.error) {
             console.error("Profile update returned error:", response.error);
             showErrorToast(response.error, { id: TOAST_IDS.PROFILE.COMPLETE });
             return;
          }

          // Only show success toast once
          showSuccessToast("Profile completed successfully!", {
            id: TOAST_IDS.PROFILE.COMPLETE,
          });

          // Refresh session to get updated user data
          await refreshSession();

          // Set profile complete cookie
          await setProfileComplete(true);

          // Wait a moment for cookies to be set and session to update
          setTimeout(() => {
            try {
              // Call onComplete callback if provided
              if (onComplete) {
                onComplete();
              } else {
                // Use centralized redirect logic
                const userRole = session?.user?.role as Role;
                const finalRedirect = getProfileCompletionRedirectUrl(
                  userRole,
                  redirectUrl
                );
                console.log("Redirecting to:", finalRedirect);
                router.push(finalRedirect);
              }
            } catch (redirectError) {
              console.error("Error during redirect:", redirectError);
              showErrorToast(
                "Profile was updated but there was an error redirecting. Please try navigating manually.",
                { id: TOAST_IDS.PROFILE.COMPLETE }
              );
            }
          }, 1000); // Increased timeout to ensure cookies are set
        } catch (error) {
          console.error("Error in profile completion success handler:", error);
          showErrorToast(
            "Profile was updated but there was an error redirecting. Please try navigating manually.",
            { id: TOAST_IDS.PROFILE.COMPLETE }
          );
        }
      },
    }
  );

  const updateProfile = updateProfileMutation.mutate;
  const updatingProfile = updateProfileMutation.isPending;

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setIsSubmitting(true);
    try {
      // Start with a base object containing only common fields.
      const baseProfileData: Record<string, unknown> = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: formatPhoneNumber(data.phone),
        dateOfBirth: data.dateOfBirth,
        gender: data.gender.toUpperCase(),
        address: data.address,
      };

      // Only include emergency contact if ALL required fields are filled
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

        if (userRole === Role.DOCTOR) {
          roleSpecificData = {
            specialization: data.specialization,
            experience: data.experience ? parseInt(data.experience, 10) : undefined,
          };
        } else if (userRole === Role.CLINIC_ADMIN) {
        roleSpecificData = {
          clinicName: data.clinicName,
          clinicAddress: data.clinicAddress,
        };
      }

      const finalData = { ...baseProfileData, ...roleSpecificData };

      console.log(
        "Submitting profile data:",
        JSON.stringify(finalData, null, 2)
      );
      updateProfile(finalData as Record<string, unknown>);
    } catch (error) {
      console.error("Profile completion error:", error);

      // Handle API validation errors - map them to form fields
      if (error instanceof Error && error.message.includes("validation")) {
        try {
          // Try to parse the error message as JSON
          const errorData = JSON.parse(
            error.message.replace("validation error: ", "")
          );

          // Set field errors
          if (errorData.errors) {
            Object.entries(errorData.errors).forEach(([field, message]) => {
              form.setError(field as keyof ProfileCompletionFormData, {
                type: "server",
                message: message as string,
              });
            });

            // ✅ Use centralized error messages
            const { ERROR_MESSAGES } = await import('@/lib/config/config');
            showErrorToast(ERROR_MESSAGES.VALIDATION_ERROR, {
              id: TOAST_IDS.PROFILE.COMPLETE,
            });
            return;
          }
        } catch (parseError) {
          // If parsing fails, continue with generic error handling
          console.error("Error parsing validation error:", parseError);
        }
      }

      // Handle different types of errors with specific messages
      if (error instanceof Error) {
        if (
          error.message.includes("Session validation failed") ||
          error.message.includes("Invalid device") ||
          error.message.includes("Invalid session")
        ) {
          // Session-related errors
          showErrorToast(
            "Your session appears to be invalid or expired. Please log in again.",
            { id: TOAST_IDS.AUTH.LOGIN, duration: 10000 }
          );
          router.push(ROUTES.LOGIN);
        } else if (
          error.message.includes("500") ||
          error.message.includes("Server encountered an error")
        ) {
          // Server errors
          showErrorToast(
            "The server encountered an error processing your request. Please try again in a few moments or contact support if the issue persists.",
            { id: TOAST_IDS.GLOBAL.ERROR, duration: 15000 }
          );
        } else {
          // Generic errors
          showErrorToast(`Failed to complete profile: ${error.message}`, {
            id: TOAST_IDS.PROFILE.COMPLETE,
            duration: 5000,
          });
        }
      } else {
        // Fallback for non-Error objects
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
  const isDoctor = userRole === Role.DOCTOR;
  const isClinicAdmin = userRole === Role.CLINIC_ADMIN;

  // Show loading state while fetching profile data
  if (loadingProfile || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-600 mb-4" />
          <p className="text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white rounded-xl shadow-xl border-0 overflow-hidden">
        <CardHeader className="text-center border-b pb-2 bg-gradient-to-r from-emerald-600 to-teal-600">
          <CardTitle className="text-lg font-bold text-white">
            Complete Your Profile
          </CardTitle>
          <p className="text-xs text-emerald-100 mt-0.5">
            Please provide the required information to complete your profile setup
          </p>
          
          {/* One-time process banner */}
          <div className="mt-2 p-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-md text-left">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-semibold text-white mb-0.5">
                  One-Time Setup
                </h4>
                <p className="text-xs text-emerald-100">
                  This information will be securely stored and you can update it anytime from your profile settings.
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-5 py-3 bg-white dark:bg-white">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
              {/* Form Errors Summary */}
              {Object.keys(form.formState.errors).length > 0 && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                  <div className="flex items-center mb-2">
                    <svg
                      className="h-5 w-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-1 9a1 1 0 01-1-1v-4a1 1 0 112 0v4a1 1 0 01-1 1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <h3 className="font-medium">
                      Please correct the following errors:
                    </h3>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {Object.entries(form.formState.errors).map(
                      ([field, error]) => (
                        <li key={field}>
                          <strong className="capitalize">{field}:</strong>{" "}
                          {error?.message?.toString()}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-700 flex items-center gap-2 mb-1 border-b border-emerald-200 pb-1">
                  <User className="h-4 w-4" />
                  Basic Information
                </h3>

                {/* Row 1: First Name, Last Name, Gender */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-gray-700 dark:text-gray-700">First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            aria-invalid={!!form.formState.errors.firstName}
                            aria-describedby="firstName-error"
                            className={
                              "h-9 bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                              (form.formState.errors.firstName
                                ? "border-red-500 focus:border-red-500"
                                : "")
                            }
                          />
                        </FormControl>
                        <FormMessage id="firstName-error" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel className="text-gray-700 dark:text-gray-700">Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                            aria-invalid={!!form.formState.errors.lastName}
                            aria-describedby="lastName-error"
                            className={
                              "h-9 bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                              (form.formState.errors.lastName
                                ? "border-red-500 focus:border-red-500"
                                : "")
                            }
                          />
                        </FormControl>
                        <FormMessage id="lastName-error" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-700">
                          <Venus className="h-4" />
                          Gender *
                        </FormLabel>
                        <Select
                          value={field.value || "male"}
                          onValueChange={(val) => field.onChange(val || "male")}
                          defaultValue="male"
                        >
                          <FormControl>
                            <SelectTrigger
                              className={
                                "h-9 w-full bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                                (form.formState.errors.gender
                                  ? "border-red-500 focus:border-red-500"
                                  : "")
                              }
                              aria-invalid={!!form.formState.errors.gender}
                              aria-describedby="gender-error"
                            >
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage id="gender-error" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Phone Number, Date of Birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-700">
                          <Phone className="h-4 w-4" />
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Enter your phone number"
                            {...field}
                            aria-invalid={!!form.formState.errors.phone}
                            aria-describedby="phone-error"
                            className={
                              "h-9 bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                              (form.formState.errors.phone
                                ? "border-red-500 focus:border-red-500"
                                : "")
                            }
                            defaultCountry="IN"
                            country="IN"
                            international
                            withCountryCallingCode
                          />
                        </FormControl>
                        <FormMessage id="phone-error" />
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
                          <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-700">
                            <Calendar className="h-4 w-4" />
                            Date of Birth *
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={
                                    "h-9 w-full justify-start text-left font-normal bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                                    (form.formState.errors.dateOfBirth ? "border-red-500 " : "") +
                                    (!field.value ? "text-muted-foreground" : "")
                                  }
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {field.value ? format(new Date(field.value), "PPP") : "Pick a date"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const selectedDate = date;
                                    const today = new Date();
                                    let age = today.getFullYear() - selectedDate.getFullYear();
                                    const monthDifference = today.getMonth() - selectedDate.getMonth();
                                    if (
                                      monthDifference < 0 ||
                                      (monthDifference === 0 && today.getDate() < selectedDate.getDate())
                                    ) {
                                      age--;
                                    }
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
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage id="dateOfBirth-error" />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                {/* Address - Full Width */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 text-gray-700 dark:text-gray-700">
                        <MapPin className="h-4 w-4" />
                        Address *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your address"
                          {...field}
                          aria-invalid={!!form.formState.errors.address}
                          aria-describedby="address-error"
                          className={
                            "bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 min-h-[80px] resize-none " +
                            (form.formState.errors.address
                              ? "border-red-500 focus:border-red-500"
                              : "")
                          }
                        />
                      </FormControl>
                      <FormMessage id="address-error" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5 pt-1">
                <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-700 flex items-center gap-2 mb-1 border-b border-emerald-200 pb-1">
                  <Phone className="h-4 w-4" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-700">Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact's full name"
                            {...field}
                            className={
                              "bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                              (form.formState.errors.emergencyContactName
                                ? "border-red-500 focus:border-red-500"
                                : "")
                            }
                          />
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
                        <FormLabel className="text-gray-700 dark:text-gray-700">Contact Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Enter contact's phone number"
                            {...field}
                            className={
                              "bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                              (form.formState.errors.emergencyContactPhone
                                ? "border-red-500 focus:border-red-500"
                                : "")
                            }
                            defaultCountry="IN"
                            international
                            withCountryCallingCode
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
                      <FormLabel className="text-gray-700 dark:text-gray-700">Relationship</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Spouse, Parent, Sibling"
                          {...field}
                          className={
                            "bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300 " +
                            (form.formState.errors.emergencyContactRelationship
                              ? "border-red-500 focus:border-red-500"
                              : "")
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role-specific fields (Optional) */}
              {isDoctor && (
                <div className="space-y-2 pt-1">
                  <h3 className="text-base font-semibold text-emerald-700 dark:text-emerald-700 mb-1 border-b border-emerald-200 pb-1">
                    Professional Information (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-700 dark:text-gray-700">Specialization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Cardiology, Pediatrics"
                              {...field}
                              className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                            />
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
                          <FormLabel className="text-gray-700 dark:text-gray-700">Years of Experience</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., 5 years"
                              {...field}
                              className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {isClinicAdmin && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-lg font-bold text-emerald-700 dark:text-emerald-700 mb-2 border-b border-emerald-200 pb-1">
                    Clinic Information (Optional)
                  </h3>
                  <FormField
                    control={form.control}
                    name="clinicName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-700">Clinic Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter clinic name"
                            {...field}
                            className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clinicAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 dark:text-gray-700">Clinic Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter clinic address"
                            rows={3}
                            {...field}
                            className="bg-white dark:bg-white text-gray-900 dark:text-gray-900 border-gray-300 dark:border-gray-300"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Submit Button */}
              <div className="flex flex-col md:flex-row gap-3 pt-6 justify-end">
                {form.formState.isSubmitted &&
                  Object.keys(form.formState.errors).length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-md p-3 w-full md:w-auto">
                      <p className="flex items-center">
                        <svg
                          className="h-5 w-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Please fix the errors above before submitting the form.
                      </p>
                    </div>
                  )}
                <Button
                  type="submit"
                  disabled={isSubmitting || updatingProfile}
                  className="w-full md:w-auto self-end bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-2 rounded-lg shadow-lg transition-all duration-200"
                  onClick={() => {
                    if (Object.keys(form.formState.errors).length > 0) {
                      // Scroll to the first error
                      const firstErrorField = Object.keys(
                        form.formState.errors
                      )[0];
                      const errorElement = document.getElementById(
                        `${firstErrorField}-error`
                      );
                      errorElement?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                    }
                  }}
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
