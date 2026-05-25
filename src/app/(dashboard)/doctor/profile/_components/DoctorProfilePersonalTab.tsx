"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCheck } from "lucide-react";
import type {
  DoctorProfileFormState,
} from "./doctor-profile.types";

interface DoctorProfilePersonalTabProps {
  profileData: DoctorProfileFormState;
  updatePersonalInfo: (field: string, value: string) => void;
  phoneVerified?: boolean | undefined;
}

export function DoctorProfilePersonalTab({
  profileData,
  updatePersonalInfo,
  phoneVerified,
}: DoctorProfilePersonalTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="size-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={profileData.personalInfo.firstName}
              onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={profileData.personalInfo.lastName}
              onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={profileData.personalInfo.email}
              onChange={(e) => updatePersonalInfo("email", e.target.value)}
            />
          </div>
          <div className="gap-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              {phoneVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Verified</Badge>
              )}
            </div>
            <Input
              id="phone"
              value={profileData.personalInfo.phone}
              onChange={(e) => updatePersonalInfo("phone", e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={profileData.personalInfo.dateOfBirth}
              onChange={(e) =>
                updatePersonalInfo("dateOfBirth", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={profileData.personalInfo.gender}
              onValueChange={(value) => updatePersonalInfo("gender", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={profileData.personalInfo.zipCode}
              onChange={(e) => updatePersonalInfo("zipCode", e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={profileData.personalInfo.address}
            onChange={(e) => updatePersonalInfo("address", e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
