"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Award, Stethoscope } from "lucide-react";
import type { DoctorProfileFormState, DoctorProfileStats } from "./doctor-profile.types";

interface DoctorProfileOverviewCardProps {
  profileData: DoctorProfileFormState;
  stats: DoctorProfileStats;
}

export function DoctorProfileOverviewCard({
  profileData,
  stats,
}: DoctorProfileOverviewCardProps) {
  const firstInitial = profileData.personalInfo.firstName.charAt(0) || "D";

  return (
    <Card className="border border-emerald-400/20 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-full bg-linear-to-br from-blue-100 to-purple-100 dark:from-blue-950 dark:to-purple-950">
              <span className="text-3xl font-semibold text-blue-800 dark:text-blue-200">
                {firstInitial}
              </span>
            </div>
            <Button
              size="sm"
              className="absolute -bottom-1 -right-1 size-8 rounded-full p-0"
              type="button"
            >
              <Camera className="size-3" />
            </Button>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold">
              Dr. {profileData.personalInfo.firstName}{" "}
              {profileData.personalInfo.lastName}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1">
                <Stethoscope className="size-4" />
                {profileData.professionalInfo.specializations[0]}
              </span>
              <span className="flex items-center gap-1">
                <Award className="size-4" />
                {profileData.professionalInfo.experience} experience
              </span>
              <span className="flex items-center gap-1">
                <Stethoscope className="size-4" />
                {stats.specializations} specialization
                {stats.specializations !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {profileData.professionalInfo.specializations.map((spec) => (
                <Badge key={spec} variant="outline">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {stats.certifications}
                </div>
                <div className="text-sm text-muted-foreground">
                  Certifications
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {stats.languagesSpoken}
                </div>
                <div className="text-sm text-muted-foreground">Languages</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
