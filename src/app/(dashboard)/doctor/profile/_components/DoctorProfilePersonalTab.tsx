"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRound } from "lucide-react";
import { Pill } from "@/components/tbd";
import { ProfileCard, ProfileField } from "./DoctorProfileParts";
import type { DoctorProfileFormState } from "./doctor-profile.types";

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
  const { personalInfo } = profileData;

  return (
    <ProfileCard icon={UserRound} title="Personal Information">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <ProfileField label="First Name" htmlFor="firstName">
          <Input
            id="firstName"
            autoComplete="given-name"
            value={personalInfo.firstName}
            onChange={(e) => updatePersonalInfo("firstName", e.target.value)}
          />
        </ProfileField>
        <ProfileField label="Last Name" htmlFor="lastName">
          <Input
            id="lastName"
            autoComplete="family-name"
            value={personalInfo.lastName}
            onChange={(e) => updatePersonalInfo("lastName", e.target.value)}
          />
        </ProfileField>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <ProfileField label="Email Address" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={personalInfo.email}
            onChange={(e) => updatePersonalInfo("email", e.target.value)}
          />
        </ProfileField>
        <ProfileField
          label="Phone Number"
          htmlFor="phone"
          aside={phoneVerified ? <Pill tone="green">Verified</Pill> : null}
        >
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={personalInfo.phone}
            onChange={(e) => updatePersonalInfo("phone", e.target.value)}
          />
        </ProfileField>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <ProfileField label="Date of Birth" htmlFor="dateOfBirth">
          <Input
            id="dateOfBirth"
            type="date"
            value={personalInfo.dateOfBirth}
            onChange={(e) => updatePersonalInfo("dateOfBirth", e.target.value)}
          />
        </ProfileField>
        <ProfileField label="Gender" htmlFor="gender">
          <Select
            value={personalInfo.gender}
            onValueChange={(value) => updatePersonalInfo("gender", value)}
          >
            <SelectTrigger id="gender" className="w-full border-line">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </ProfileField>
        <ProfileField label="ZIP Code" htmlFor="zipCode">
          <Input
            id="zipCode"
            inputMode="numeric"
            autoComplete="postal-code"
            value={personalInfo.zipCode}
            onChange={(e) => updatePersonalInfo("zipCode", e.target.value)}
          />
        </ProfileField>
      </div>

      <ProfileField label="Address" htmlFor="address">
        <Textarea
          id="address"
          className="min-h-[72px] border-line"
          value={personalInfo.address}
          onChange={(e) => updatePersonalInfo("address", e.target.value)}
          rows={2}
        />
      </ProfileField>
    </ProfileCard>
  );
}
