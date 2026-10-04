"use client";

import { Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pill, Surface } from "@/components/tbd";
import { experienceLabel } from "./doctor-profile.logic";
import type { DoctorProfileFormState, DoctorProfileStats } from "./doctor-profile.types";

interface DoctorProfileOverviewCardProps {
  profileData: DoctorProfileFormState;
  stats: DoctorProfileStats;
  /** Profile photo; initials are shown when there is none. */
  photoUrl?: string | undefined;
}

export function DoctorProfileOverviewCard({
  profileData,
  stats,
  photoUrl,
}: DoctorProfileOverviewCardProps) {
  const { firstName, lastName } = profileData.personalInfo;
  const fullName = `${firstName} ${lastName}`.trim();
  const initials =
    `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase() || "D";
  const experience = experienceLabel(profileData.professionalInfo.experience);
  const tiles = [
    { value: stats.specializations, label: stats.specializations === 1 ? "Specialization" : "Specializations" },
    { value: stats.certifications, label: stats.certifications === 1 ? "Certification" : "Certifications" },
    { value: stats.languagesSpoken, label: stats.languagesSpoken === 1 ? "Language" : "Languages" },
  ];

  return (
    <Surface as="aside" aria-label="Profile summary" className="gap-[18px] p-[22px]">
      <div className="flex flex-col items-center gap-3 text-center">
        <Avatar className="size-24">
          {photoUrl ? <AvatarImage src={photoUrl} alt="" className="object-cover object-top" /> : null}
          <AvatarFallback className="bg-mint text-[30px] font-extrabold text-brand-dark">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h2 className="m-0 text-lg font-extrabold tracking-[-0.2px] text-ink">
          {fullName ? `Dr. ${fullName}` : "Doctor"}
        </h2>
        {experience ? (
          <span className="inline-flex items-center gap-2 text-[13px] text-ink-soft">
            <Award className="size-4 shrink-0 text-brand" aria-hidden="true" />
            {experience}
          </span>
        ) : null}
        {profileData.professionalInfo.specializations.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {profileData.professionalInfo.specializations.map((spec) => (
              <Pill key={spec} tone="clinic" className="whitespace-normal text-center">
                {spec}
              </Pill>
            ))}
          </div>
        ) : null}
      </div>

      <dl className="m-0 flex rounded-[14px] border border-hair bg-[#f8fafc] dark:bg-white/5">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="flex min-w-0 flex-1 flex-col-reverse items-center gap-0.5 border-r border-line px-1 py-3 last:border-r-0"
          >
            <dt className="text-xs text-ink-muted">{tile.label}</dt>
            <dd className="m-0 text-xl font-extrabold text-ink">{tile.value}</dd>
          </div>
        ))}
      </dl>
    </Surface>
  );
}
