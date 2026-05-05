"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/auth/useAuth";
import { useUserProfile, useUpdateUserProfile } from "@/hooks/query/useUsers";
import { Loader2, Mail, Phone, MapPin, Calendar, Shield, Save } from "lucide-react";
import { getAvatarTone } from "@/lib/utils/avatar-colors";

export default function PharmacistProfile() {
  const { session } = useAuth();
  const { data: userProfile, isPending: isProfileLoading } = useUserProfile();
  const updateProfile = useUpdateUserProfile();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    specialization: "",
    experience: "",
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: (userProfile as any).firstName || "",
        lastName: (userProfile as any).lastName || "",
        email: (userProfile as any).email || "",
        phone: (userProfile as any).phone || "",
        address: (userProfile as any).address || "",
        city: (userProfile as any).city || "",
        state: (userProfile as any).state || "",
        zipCode: (userProfile as any).zipCode || "",
        specialization: (userProfile as any).specialization || "",
        experience: (userProfile as any).experience?.toString() || "",
      });
    }
  }, [userProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      experience: formData.experience ? parseInt(formData.experience) : undefined,
    };
    await updateProfile.mutateAsync(payload);
  };

  if (isProfileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = `${formData.firstName?.charAt(0) || ""}${formData.lastName?.charAt(0) || ""}`.toUpperCase() || "P";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pharmacist Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account settings
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Profile Card */}
        <Card className="md:col-span-4">
          <CardHeader className="text-center">
            <div className="flex justify-center pb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={(userProfile as any)?.avatar} />
                <AvatarFallback className={`text-2xl ${getAvatarTone(initials).backgroundClass} ${getAvatarTone(initials).textClass}`}>{initials}</AvatarFallback>
              </Avatar>
            </div>
            <CardTitle>{formData.firstName} {formData.lastName}</CardTitle>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <Badge variant="secondary">Pharmacist</Badge>
              <Badge variant="outline">{(userProfile as any)?.isVerified ? "Verified" : "Unverified"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{formData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formData.phone || "No phone added"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{formData.city && formData.state ? `${formData.city}, ${formData.state}` : "No location added"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Settings Tabs */}
        <div className="md:col-span-8">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed directly</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="123 Health St"
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="City"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zipCode">Zip Code</Label>
                        <Input
                          id="zipCode"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          placeholder="00000"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="specialization">Specialization</Label>
                        <Input
                          id="specialization"
                          name="specialization"
                          value={formData.specialization}
                          onChange={handleInputChange}
                          placeholder="e.g. Clinical Pharmacy"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="experience">Years of Experience</Label>
                        <Input
                          id="experience"
                          name="experience"
                          type="number"
                          value={formData.experience}
                          onChange={handleInputChange}
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button type="submit" disabled={updateProfile.isPending}>
                        {updateProfile.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Password</p>
                      <p className="text-sm text-muted-foreground">Change your account password</p>
                    </div>
                    <Button variant="outline">Update</Button>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-1">
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
