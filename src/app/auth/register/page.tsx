"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PasswordStrength } from "@/components/ui/password-strength";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { SocialLogin } from "@/components/auth/social-login";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  registerSchema,
  type RegisterFormData,
} from "@/lib/schema/login-schema";
import useZodForm from "@/hooks/useZodForm";
import { Role } from "@/types/auth.types";
import { toast } from "sonner";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useZodForm(
    registerSchema,
    async (values: RegisterFormData) => {
      try {
        setFormError(null);
        const formData = {
          ...values,
          role: Role.PATIENT, // Set default role
          gender: values.gender || "MALE", // Ensure gender has a default value
        };
        await registerUser(formData);
        toast.success("Registration successful! Redirecting to login...");
        // Clear any previous errors
        setFormError(null);
        // Reset form
        form.reset();
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/auth/login?registered=true");
        }, 3000);
      } catch (error) {
        console.error("Registration error:", error);
        // Set form error
        setFormError(
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again."
        );
        // Show toast error
        toast.error(
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again."
        );
        throw error; // Re-throw to let the form handle the error state
      }
    },
    {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      phone: "",
      gender: "MALE",
      role: Role.PATIENT,
      terms: false,
    }
  );

  const handleSocialLogin = async (provider: "google" | "apple") => {
    // Social login logic will be implemented later
    console.log(`Logging in with ${provider}`);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-bold text-center">Create an account</h2>
        <p className="text-sm text-gray-500 text-center">
          Enter your information to create an account
        </p>
      </CardHeader>
      <CardContent>
        <SocialLogin
          onGoogleLogin={() => handleSocialLogin("google")}
          onAppleLogin={() => handleSocialLogin("apple")}
          isLoading={isLoading}
          className="mb-6"
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
              Or continue with email
            </span>
          </div>
        </div>

        {formError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{formError}</p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(async () => {
              try {
                await form.onFormSubmit();
              } catch {
                // Error is already handled in the mutation function
              }
            })}
            className="space-y-4 mt-6"
            noValidate
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="First name" {...field} />
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
                    <FormControl>
                      <Input placeholder="Last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="tel" placeholder="Phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create password"
                      {...field}
                    />
                  </FormControl>
                  <PasswordStrength password={field.value} />
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
                      placeholder="Confirm password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <label
                        htmlFor="terms"
                        className="text-sm text-gray-600 cursor-pointer"
                      >
                        I accept the{" "}
                        <Link
                          href="/terms"
                          className="text-blue-600 hover:underline"
                        >
                          terms and conditions
                        </Link>
                      </label>
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2" />
                    Creating account...
                  </div>
                ) : (
                  "Create account"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <div className="w-full text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
