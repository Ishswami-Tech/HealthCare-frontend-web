"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { theme } from "@/lib/utils/theme-utils";
import { Camera, Heart, MapPin, User } from "lucide-react";
import type { ReceptionistProfileFormState } from "./receptionist-profile.types";

interface ReceptionistProfileOverviewCardProps {
  profileData: ReceptionistProfileFormState;
}

export function ReceptionistProfileOverviewCard({
  profileData,
}: ReceptionistProfileOverviewCardProps) {
  const firstInitial = profileData.personalInfo.firstName.charAt(0) || "R";

  return (
    <Card>
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex flex-col items-center gap-3.5 sm:flex-row sm:items-start sm:gap-4">
          <div className="relative shrink-0">
            <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-green-100 sm:h-18 sm:w-18">
              <span className={`${theme.textColors.info} text-lg font-semibold sm:text-xl`}>
                {firstInitial}
              </span>
            </div>
            <Button
              type="button"
              size="sm"
              className="absolute -bottom-1 -right-1 size-6.5 rounded-full p-0"
            >
              <Camera className="size-3" />
            </Button>
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className={`text-lg sm:text-xl font-semibold ${theme.textColors.heading}`}>
              {profileData.personalInfo.firstName} {profileData.personalInfo.lastName}
            </h2>
            <div
              className={`mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-[11px] sm:justify-start sm:text-sm ${theme.textColors.secondary}`}
            >
              <span className="flex items-center gap-1">
                <User className="size-3 sm:size-4" />
                {profileData.personalInfo.occupation || "Receptionist"}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3 sm:size-4" />
                {profileData.personalInfo.city || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="size-3 sm:size-4" />
                {profileData.personalInfo.maritalStatus || "—"}
              </span>
            </div>
            <div className="mt-2.5 flex items-center justify-center gap-2 sm:justify-start">
              <div className={`rounded-lg p-1.5 ${theme.containers.featureBlue}`}>
                <span className={`text-xs font-semibold ${theme.iconColors.blue}`}>
                  Employee Profile
                </span>
              </div>
              <span className="font-medium text-[11px] sm:text-sm">
                Department: {profileData.workInfo.department || "—"}
              </span>
            </div>
          </div>

          <div className="w-full border-t border-border pt-3 text-center sm:w-auto sm:border-t-0 sm:pt-0 sm:text-left">
            <div className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-1 sm:gap-3">
              <div>
                <div className={`text-lg sm:text-xl font-bold ${theme.iconColors.green}`}>
                  {profileData.vitals.bmi}
                </div>
                <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} font-bold uppercase tracking-wider`}>
                  BMI
                </div>
              </div>
              <div>
                <div className={`text-base sm:text-lg font-bold ${theme.iconColors.blue}`}>
                  {profileData.vitals.bloodPressure}
                </div>
                <div className={`text-[10px] sm:text-xs ${theme.textColors.secondary} font-bold uppercase tracking-wider`}>
                  BP
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
