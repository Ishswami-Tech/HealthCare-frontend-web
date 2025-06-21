"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
} from "@/lib/utils/profile-completion";
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

// Profile completion schema - only essential fields are required
const profileCompletionSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  address: z.string().min(10, "Address must be at least 10 characters"),
  emergencyContact: z.object({
    name: z.string().min(2, "Emergency contact name is required"),
    phone: z.string().min(10, "Emergency contact phone is required"),
    relationship: z.string().min(2, "Relationship is required"),
  }),
  // Optional fields for profile updates
  specialization: z.string().optional(),
  licenseNumber: z.string().optional(),
  experience: z.string().optional(),
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
});

type ProfileCompletionFormData = z.infer<typeof profileCompletionSchema>;

interface ProfileData extends ProfileCompletionFormData {
  profileComplete: boolean;
}

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
          const transformedData = transformApiResponse(response);
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
      gender: undefined,
      address: "",
      emergencyContact: {
        name: "",
        phone: "",
        relationship: "",
      },
      specialization: "",
      licenseNumber: "",
      experience: "",
      clinicName: "",
      clinicAddress: "",
    },
  });

  // Pre-fill form with existing data when available
  useEffect(() => {
    if (existingProfile && !isInitialized) {
      const formData = {
        firstName: existingProfile.firstName || session?.user?.firstName || "",
        lastName: existingProfile.lastName || session?.user?.lastName || "",
        phone: existingProfile.phone || "",
        dateOfBirth: existingProfile.dateOfBirth || "",
        gender: existingProfile.gender as
          | "male"
          | "female"
          | "other"
          | undefined,
        address: existingProfile.address || "",
        emergencyContact: existingProfile.emergencyContact || {
          name: "",
          phone: "",
          relationship: "",
        },
        specialization: existingProfile.specialization || "",
        licenseNumber: existingProfile.licenseNumber || "",
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
        gender: undefined,
        address: "",
        emergencyContact: {
          name: "",
          phone: "",
          relationship: "",
        },
        specialization: "",
        licenseNumber: "",
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
      const response = await updateUserProfile(data);
      return response;
    },
    "user-profile",
    async () => {
      toast.success("Profile completed successfully!");

      // Refresh session to get updated user data
      await refreshSession();

      // Set profile complete cookie
      await setProfileComplete(true);

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
        router.push(finalRedirect);
      }
    }
  );

  const onSubmit = async (data: ProfileCompletionFormData) => {
    setIsSubmitting(true);
    try {
      // Prepare the data based on user role
      const profileData: ProfileData = {
        ...data,
        profileComplete: true, // Mark profile as complete
      };

      // Add role-specific fields
      if (session?.user?.role === Role.DOCTOR) {
        profileData.specialization = data.specialization;
        profileData.licenseNumber = data.licenseNumber;
        profileData.experience = data.experience;
      } else if (session?.user?.role === Role.CLINIC_ADMIN) {
        profileData.clinicName = data.clinicName;
        profileData.clinicAddress = data.clinicAddress;
      }

      updateProfile(profileData as unknown as Record<string, unknown>);
    } catch (error) {
      console.error("Profile completion error:", error);
      toast.error("Failed to complete profile. Please try again.");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">Loading your profile data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            Complete Your Profile
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please provide the required information to complete your profile
            setup
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your last name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date of Birth *
                        </FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Venus className="h-4 w-4" />
                        Gender *
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your gender" />
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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Emergency Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Emergency contact name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyContact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Emergency contact phone"
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
                  name="emergencyContact.relationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Relationship *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Spouse, Parent, Sibling"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Role-specific fields (Optional) */}
              {isDoctor && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Professional Information (Optional)
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      name="licenseNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Medical license number"
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
              )}

              {isClinicAdmin && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
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
              <div className="flex justify-end pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting || updatingProfile}
                  className="w-full md:w-auto"
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
