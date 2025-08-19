"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { useMutationData } from "@/hooks/useMutationData";
import { updateUserProfile, getUserProfile } from "@/lib/actions/users.server";
import { setProfileComplete } from "@/lib/actions/auth.server";
import {
  getProfileCompletionRedirectUrl,
  transformApiResponse,
  type UserProfileData,
} from "@/lib/profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { Loader2, User, Phone, MapPin, Calendar, Venus } from "lucide-react";
import { Role } from "@/types/auth.types";
import {
  profileCompletionSchema,
  ProfileCompletionFormData,
} from "@/lib/schema/login-schema";

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
      const [emergencyContactName, emergencyContactRest] =
        existingProfile.emergencyContact?.split(" (") || ["", ""];
      const [emergencyContactRelationship, emergencyContactPhone] =
        emergencyContactRest?.split("): ") || ["", ""];

      const formData = {
        firstName: existingProfile.firstName || session?.user?.firstName || "",
        lastName: existingProfile.lastName || session?.user?.lastName || "",
        phone: existingProfile.phone || "",
        dateOfBirth: existingProfile.dateOfBirth || "",
        gender: existingProfile.gender
          ? (existingProfile.gender.toLowerCase() as
              | "male"
              | "female"
              | "other")
          : "male",
        address: existingProfile.address || "",
        emergencyContactName: emergencyContactName || "",
        emergencyContactPhone: emergencyContactPhone || "",
        emergencyContactRelationship:
          emergencyContactRelationship?.replace(")", "") || "",
        specialization: existingProfile.specialization || "",
        experience: existingProfile.experience || "",
        clinicName: existingProfile.clinicName || "",
        clinicAddress: existingProfile.clinicAddress || "",
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
  const { mutate: updateProfile, isPending: updatingProfile } = useMutationData(
    ["update-profile-completion"],
    async (data: Record<string, unknown>) => {
      try {
        return await updateUserProfile(data);
      } catch (error) {
        console.error("Profile update error:", error);
        // Convert the error to a format that can be displayed in toast
        if (error instanceof Error) {
          toast.error(`Error: ${error.message}`);
        } else {
          toast.error("An unexpected error occurred. Please try again.");
        }
        throw error; // Re-throw for the mutation to handle
      }
    },
    "user-profile",
    async (result) => {
      try {
        // Log the result for debugging
        console.log("Profile update successful:", result);

        // Only show success toast once
        toast.success("Profile completed successfully!");

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
            toast.error(
              "Profile was updated but there was an error redirecting. Please try navigating manually."
            );
          }
        }, 1000); // Increased timeout to ensure cookies are set
      } catch (error) {
        console.error("Error in profile completion success handler:", error);
        toast.error(
          "Profile was updated but there was an error redirecting. Please try navigating manually."
        );
      }
    }
  );

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setIsSubmitting(true);
    try {
      // Start with a base object containing only common fields.
      const baseProfileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender.toUpperCase(),
        address: data.address,
        emergencyContact: `${data.emergencyContactName} (${data.emergencyContactRelationship}): ${data.emergencyContactPhone}`,
      };

      let roleSpecificData = {};
      const userRole = session?.user?.role;

      if (userRole === Role.DOCTOR) {
        roleSpecificData = {
          specialization: data.specialization,
          experience: data.experience,
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

            toast.error("Please correct the errors in the form");
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
          toast.error(
            <div className="flex flex-col gap-2">
              <p>Your session appears to be invalid or expired.</p>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                onClick={() => router.push("/auth/login")}
              >
                Please log in again
              </button>
            </div>,
            { duration: 10000 }
          );
        } else if (
          error.message.includes("500") ||
          error.message.includes("Server encountered an error")
        ) {
          // Server errors
          toast.error(
            <div className="flex flex-col gap-2">
              <p>The server encountered an error processing your request.</p>
              <p className="text-sm">
                Please try again in a few moments or contact support if the
                issue persists.
              </p>
              <div className="flex gap-2 mt-1">
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded text-sm"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </button>
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white py-1 px-3 rounded text-sm"
                  onClick={() => router.push("/auth/login")}
                >
                  Log In Again
                </button>
              </div>
            </div>,
            { duration: 15000 }
          );
        } else {
          // Generic errors
          toast.error(`Failed to complete profile: ${error.message}`, {
            duration: 5000,
          });
        }
      } else {
        // Fallback for non-Error objects
        toast.error("Failed to complete profile. Please try again.", {
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl bg-white rounded-lg shadow-lg">
        <CardHeader className="text-center border-b pb-1">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please provide the required information to complete your profile setup
          </p>
        </CardHeader>
        <CardContent className="px-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-2 border-b pb-1">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your first name"
                            {...field}
                            aria-invalid={!!form.formState.errors.firstName}
                            aria-describedby="firstName-error"
                            className={
                              form.formState.errors.firstName
                                ? "border-red-500 focus:border-red-500"
                                : ""
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
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                            aria-invalid={!!form.formState.errors.lastName}
                            aria-describedby="lastName-error"
                            className={
                              form.formState.errors.lastName
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }
                          />
                        </FormControl>
                        <FormMessage id="lastName-error" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your phone number"
                            {...field}
                            aria-invalid={!!form.formState.errors.phone}
                            aria-describedby="phone-error"
                            className={
                              form.formState.errors.phone
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }
                            type="tel"
                            inputMode="tel"
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
                      const minDate = new Date(
                        today.getFullYear() - 12,
                        today.getMonth(),
                        today.getDate()
                      )
                        .toISOString()
                        .split("T")[0];
                      const minYear = new Date(
                        today.getFullYear() - 100,
                        today.getMonth(),
                        today.getDate()
                      )
                        .toISOString()
                        .split("T")[0];
                      return (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date of Birth *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              min={minYear}
                              max={minDate}
                              {...field}
                              aria-invalid={!!form.formState.errors.dateOfBirth}
                              aria-describedby="dateOfBirth-error"
                              className={
                                form.formState.errors.dateOfBirth
                                  ? "border-red-500 focus:border-red-500"
                                  : ""
                              }
                              onChange={(e) => {
                                field.onChange(e);
                                const selectedDate = new Date(e.target.value);
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
                                  toast.warning("You must be at least 12 years old");
                                  form.setError("dateOfBirth", {
                                    type: "manual",
                                    message: "You must be at least 12 years old",
                                  });
                                } else {
                                  form.clearErrors("dateOfBirth");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage id="dateOfBirth-error" />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 font-semibold text-gray-800">
                        <Venus className="h-4 w-4" />
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
                              form.formState.errors.gender
                                ? "border-red-500 focus:border-red-500"
                                : ""
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

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your complete address"
                          rows={3}
                          {...field}
                          aria-invalid={!!form.formState.errors.address}
                          aria-describedby="address-error"
                          className={
                            form.formState.errors.address
                              ? "border-red-500 focus:border-red-500"
                              : ""
                          }
                        />
                      </FormControl>
                      <FormMessage id="address-error" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-2 pt-2">
                <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2 mb-2 border-b pb-1">
                  <Phone className="h-5 w-5" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact's full name"
                            {...field}
                            className={
                              form.formState.errors.emergencyContactName
                                ? "border-red-500 focus:border-red-500"
                                : ""
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
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter contact's phone number"
                            type="tel"
                            {...field}
                            className={
                              form.formState.errors.emergencyContactPhone
                                ? "border-red-500 focus:border-red-500"
                                : ""
                            }
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
                      <FormLabel>Relationship *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Spouse, Parent, Sibling"
                          {...field}
                          className={
                            form.formState.errors.emergencyContactRelationship
                              ? "border-red-500 focus:border-red-500"
                              : ""
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
                <div className="space-y-2 pt-2">
                  <h3 className="text-lg font-bold text-blue-700 mb-2 border-b pb-1">
                    Professional Information (Optional)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Cardiology, Pediatrics"
                              {...field}
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
                          <FormLabel>Years of Experience</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5 years" {...field} />
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
                  <h3 className="text-lg font-bold text-blue-700 mb-2 border-b pb-1">
                    Clinic Information (Optional)
                  </h3>
                  <FormField
                    control={form.control}
                    name="clinicName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter clinic name" {...field} />
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
                        <FormLabel>Clinic Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter clinic address"
                            rows={3}
                            {...field}
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
                  className="w-full md:w-auto self-end bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-2 rounded-lg shadow"
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
