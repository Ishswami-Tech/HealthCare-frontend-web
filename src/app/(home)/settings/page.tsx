"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQueryData } from "@/hooks/useQueryData";
import { useMutationData } from "@/hooks/useMutationData";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Calendar, Bell, Clock } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { changePasswordSchema } from "@/lib/schema/login-schema";
import useZodForm from "@/hooks/useZodForm";
import { z } from "zod";
import { getUserProfile, updateUserProfile } from "@/lib/actions/users.server";
import { useAppointments } from "@/hooks/useAppointments";
import { AppointmentWithRelations } from "@/types/appointment.types";

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  isVerified?: boolean;
}

export default function SettingsPage() {
  const { session, changePassword, isChangingPassword } = useAuth();

  // Fetch user profile
  const {
    data: profile,
    isPending: loadingProfile,
    refetch: refetchProfile,
  } = useQueryData<UserProfile>(
    ["user-profile"],
    async () => {
      const response = await getUserProfile();
      return response.data || response;
    },
    {
      enabled: !!session?.access_token,
    }
  );

  // Fetch appointments for statistics
  const { data: appointments, isPending: loadingAppointments } =
    useAppointments();

  // Update profile mutation
  const { mutate: updateProfile, isPending: updatingProfile } = useMutationData(
    ["update-profile"],
    async (data: Partial<UserProfile>) => {
      const response = await updateUserProfile(data);
      return response;
    },
    "user-profile",
    () => {
      toast.success("Profile updated successfully");
      refetchProfile();
    }
  );

  const form = useZodForm(
    changePasswordSchema,
    async (values: ChangePasswordFormData) => {
      const formData = new FormData();
      formData.append("currentPassword", values.currentPassword);
      formData.append("newPassword", values.newPassword);
      await changePassword(formData);
      form.reset();
      toast.success("Password changed successfully");
    },
    {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const formData = new FormData();
      formData.append("currentPassword", values.currentPassword);
      formData.append("newPassword", values.newPassword);
      await changePassword(formData);
      form.reset();
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  });

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    if (profile) {
      updateProfile({ [field]: value });
    }
  };

  // Calculate appointment statistics
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments =
    appointments?.filter((apt) => apt.date?.startsWith(today)) || [];
  const upcomingAppointments =
    appointments?.filter((apt) => apt.date > today) || [];
  const completedAppointments =
    appointments?.filter((apt) => apt.status === "COMPLETED") || [];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <Input
                          value={profile.firstName || ""}
                          onChange={(e) =>
                            handleProfileUpdate("firstName", e.target.value)
                          }
                          disabled={updatingProfile}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <Input
                          value={profile.lastName || ""}
                          onChange={(e) =>
                            handleProfileUpdate("lastName", e.target.value)
                          }
                          disabled={updatingProfile}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Email
                      </label>
                      <Input
                        value={profile.email}
                        disabled
                        className="mt-1 bg-gray-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email cannot be changed
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Phone
                      </label>
                      <Input
                        value={profile.phone || ""}
                        onChange={(e) =>
                          handleProfileUpdate("phone", e.target.value)
                        }
                        disabled={updatingProfile}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Address
                      </label>
                      <Input
                        value={profile.address || ""}
                        onChange={(e) =>
                          handleProfileUpdate("address", e.target.value)
                        }
                        disabled={updatingProfile}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        value={profile.gender || ""}
                        onChange={(e) =>
                          handleProfileUpdate("gender", e.target.value)
                        }
                        disabled={updatingProfile}
                        aria-label="Select gender"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    {updatingProfile && (
                      <div className="flex items-center text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Updating profile...
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">Failed to load profile</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="appointments">
          <div className="grid gap-6">
            {/* Appointment Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Appointment Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {todayAppointments.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Today&apos;s Appointments
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {upcomingAppointments.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Upcoming Appointments
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {completedAppointments.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Completed Appointments
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Appointment Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Appointment Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Receive email reminders for appointments
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Receive SMS reminders for appointments
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Reminder Timing</h4>
                      <p className="text-sm text-gray-500">
                        Set when to receive appointment reminders
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAppointments ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : appointments && appointments.length > 0 ? (
                  <div className="space-y-2">
                    {appointments
                      .slice(0, 3)
                      .map((appointment: AppointmentWithRelations) => (
                        <div
                          key={appointment.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {appointment.date} at {appointment.time}
                              </p>
                              <p className="text-xs text-gray-500">
                                {appointment.type} -{" "}
                                {appointment.notes || "No notes"}{" "}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              appointment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : appointment.status === "CONFIRMED"
                                ? "bg-blue-100 text-blue-800"
                                : appointment.status === "COMPLETED"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {appointment.status}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No recent appointments
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={onSubmit} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Current Password"
                              disabled={isChangingPassword}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="New Password"
                              disabled={isChangingPassword}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Confirm New Password"
                              disabled={isChangingPassword}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Email Verification</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    Status:{" "}
                    {session?.user?.isVerified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-red-600">Not Verified</span>
                    )}
                  </p>
                  {!session?.user?.isVerified && (
                    <Button variant="outline" size="sm">
                      Verify Email
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
