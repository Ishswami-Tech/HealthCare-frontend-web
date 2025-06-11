"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { session, changePassword, isChangingPassword } = useAuth();

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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="security" className="space-y-6">
        <TabsList>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

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
