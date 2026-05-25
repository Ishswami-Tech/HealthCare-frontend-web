"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { theme } from "@/lib/utils/theme-utils";
import { User } from "lucide-react";
import type { ReceptionistProfileFormState } from "./receptionist-profile.types";

interface ReceptionistProfilePersonalTabProps {
  profileData: ReceptionistProfileFormState;
  updatePersonalInfo: (field: string, value: string) => void;
  phoneVerified?: boolean | undefined;
}

export function ReceptionistProfilePersonalTab({
  profileData,
  updatePersonalInfo,
  phoneVerified,
}: ReceptionistProfilePersonalTabProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <User className="size-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="gap-y-1.5">
            <Label htmlFor="firstName">First Name</Label>
            <Input id="firstName" value={profileData.personalInfo.firstName} onChange={(e) => updatePersonalInfo("firstName", e.target.value)} />
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="lastName">Last Name</Label>
            <Input id="lastName" value={profileData.personalInfo.lastName} onChange={(e) => updatePersonalInfo("lastName", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="gap-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={profileData.personalInfo.email} onChange={(e) => updatePersonalInfo("email", e.target.value)} />
          </div>
          <div className="gap-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor="phone">Phone Number</Label>
              {phoneVerified && (
                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">Verified</Badge>
              )}
            </div>
            <Input id="phone" value={profileData.personalInfo.phone} onChange={(e) => updatePersonalInfo("phone", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="gap-y-1.5">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              className="min-h-11"
              value={profileData.personalInfo.dateOfBirth}
              onChange={(e) => updatePersonalInfo("dateOfBirth", e.target.value)}
            />
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select value={profileData.personalInfo.gender} onValueChange={(value) => updatePersonalInfo("gender", value)}>
              <SelectTrigger className="min-h-11 w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="maritalStatus">Marital Status</Label>
            <Select value={profileData.personalInfo.maritalStatus} onValueChange={(value) => updatePersonalInfo("maritalStatus", value)}>
              <SelectTrigger className="min-h-11 w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Single">Single</SelectItem>
                <SelectItem value="Married">Married</SelectItem>
                <SelectItem value="Divorced">Divorced</SelectItem>
                <SelectItem value="Widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="gap-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={profileData.personalInfo.address} onChange={(e) => updatePersonalInfo("address", e.target.value)} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="gap-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" className="min-h-11" value={profileData.personalInfo.city} onChange={(e) => updatePersonalInfo("city", e.target.value)} />
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" className="min-h-11" value={profileData.personalInfo.state} onChange={(e) => updatePersonalInfo("state", e.target.value)} />
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input id="zipCode" className="min-h-11" value={profileData.personalInfo.zipCode} onChange={(e) => updatePersonalInfo("zipCode", e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="gap-y-1.5">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" className="min-h-11" value={profileData.personalInfo.occupation} onChange={(e) => updatePersonalInfo("occupation", e.target.value)} />
          </div>
          <div className="gap-y-1.5">
            <Label htmlFor="emergencyContact">Emergency Contact</Label>
            <Input id="emergencyContact" className="min-h-11" value={profileData.personalInfo.emergencyContact} onChange={(e) => updatePersonalInfo("emergencyContact", e.target.value)} />
          </div>
        </div>
        <div className="border-t pt-4">
          <h4 className="mb-4 text-sm font-semibold sm:text-base">Vital Statistics</h4>
          <div className="grid grid-cols-2 gap-3 sm:gap-3.5 md:grid-cols-4">
            <div className={`rounded-lg p-3 text-center ${theme.containers.featureBlue}`}>
              <div className={`text-[10px] font-bold uppercase ${theme.textColors.secondary} sm:text-xs`}>Height</div>
              <div className={`text-base font-semibold ${theme.iconColors.blue} sm:text-lg`}>{profileData.vitals.height}</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${theme.containers.featureGreen}`}>
              <div className={`text-[10px] font-bold uppercase ${theme.textColors.secondary} sm:text-xs`}>Weight</div>
              <div className={`text-base font-semibold ${theme.iconColors.green} sm:text-lg`}>{profileData.vitals.weight}</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${theme.containers.featureBlue}`}>
              <div className={`text-[10px] font-bold uppercase ${theme.textColors.secondary} sm:text-xs`}>Group</div>
              <div className={`text-base font-semibold ${theme.iconColors.blue} sm:text-lg`}>{profileData.vitals.bloodGroup}</div>
            </div>
            <div className={`rounded-lg p-3 text-center ${theme.containers.featureOrange}`}>
              <div className={`text-[10px] font-bold uppercase ${theme.textColors.secondary} sm:text-xs`}>BMI</div>
              <div className={`text-base font-semibold ${theme.iconColors.orange} sm:text-lg`}>{profileData.vitals.bmi}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
