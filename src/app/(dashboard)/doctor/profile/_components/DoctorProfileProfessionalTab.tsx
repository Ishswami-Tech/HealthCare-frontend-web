"use client";

import { useState } from "react";
import { BookOpen, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Note } from "@/components/tbd";
import { DoctorProfileLocalizedCard } from "./DoctorProfileLocalizedCard";
import { PROFILE_LABEL, ProfileCard, ProfileField } from "./DoctorProfileParts";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileProfessionalTabProps {
  profileData: DoctorProfileFormState;
  updateProfessionalInfo: (field: string, value: unknown) => void;
  /** Only the doctor saves the public profile (same rule as the other doctor-record fields). */
  canEditPublicProfile?: boolean;
}

export function DoctorProfileProfessionalTab({
  profileData,
  updateProfessionalInfo,
  canEditPublicProfile = false,
}: DoctorProfileProfessionalTabProps) {
  const { professionalInfo } = profileData;
  const [addingSpecialization, setAddingSpecialization] = useState(false);
  const [newSpecialization, setNewSpecialization] = useState("");

  const cleanSpecialization = newSpecialization.trim();
  const alreadyListed = professionalInfo.specializations.some(
    (spec) => spec.toLowerCase() === cleanSpecialization.toLowerCase(),
  );

  const closeSpecializationInput = () => {
    setAddingSpecialization(false);
    setNewSpecialization("");
  };

  const addSpecialization = () => {
    if (!cleanSpecialization || alreadyListed) return;
    updateProfessionalInfo("specializations", [...professionalInfo.specializations, cleanSpecialization]);
    closeSpecializationInput();
  };

  return (
    <div className="flex flex-col gap-5">
      {canEditPublicProfile ? (
        <DoctorProfileLocalizedCard
          value={professionalInfo.localizedProfile}
          onChange={(next) => updateProfessionalInfo("localizedProfile", next)}
        />
      ) : null}
      <ProfileCard icon={Pencil} title="Professional Information">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <ProfileField label="Medical License" htmlFor="medicalLicense">
            <Input
              id="medicalLicense"
              value={professionalInfo.medicalLicense}
              onChange={(e) => updateProfessionalInfo("medicalLicense", e.target.value)}
            />
          </ProfileField>
          <ProfileField label="Years of Experience" htmlFor="experience">
            <Input
              id="experience"
              inputMode="numeric"
              value={professionalInfo.experience}
              onChange={(e) => updateProfessionalInfo("experience", e.target.value)}
            />
          </ProfileField>
        </div>

        <div className="flex flex-col gap-2">
          <span className={PROFILE_LABEL} id="doctor-specializations-label">
            Specializations
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <ul
              className="m-0 flex list-none flex-wrap items-center gap-2 p-0 empty:hidden"
              aria-labelledby="doctor-specializations-label"
            >
              {professionalInfo.specializations.map((spec, index) => (
                <li
                  key={spec}
                  className="inline-flex min-h-[34px] items-center gap-2 rounded-[10px] border border-[#a7f3d0] bg-mint-soft pl-3 pr-2 text-[13px] font-semibold text-brand-dark dark:border-emerald-800"
                >
                  {spec}
                  <button
                    type="button"
                    aria-label={`Remove ${spec}`}
                    className="flex size-5 items-center justify-center rounded-md bg-card text-brand-dark transition-colors hover:text-[#e11d48] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                    onClick={() => {
                      const newSpecs = professionalInfo.specializations.filter((_, i) => i !== index);
                      updateProfessionalInfo("specializations", newSpecs);
                    }}
                  >
                    <X className="size-3" strokeWidth={2.6} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            {addingSpecialization ? (
              <form
                className="flex flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  addSpecialization();
                }}
              >
                <Input
                  autoFocus
                  aria-label="New specialization"
                  placeholder="For example Cardiology"
                  className="h-[34px] w-[220px] max-w-full rounded-[10px]"
                  value={newSpecialization}
                  onChange={(e) => setNewSpecialization(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") closeSpecializationInput();
                  }}
                />
                <Button type="submit" variant="soft" size="sm" disabled={!cleanSpecialization || alreadyListed}>
                  Add
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={closeSpecializationInput}>
                  Cancel
                </Button>
              </form>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="h-[34px]"
                onClick={() => setAddingSpecialization(true)}
              >
                <Plus aria-hidden="true" />
                Add Specialization
              </Button>
            )}
          </div>
          {addingSpecialization && alreadyListed ? (
            <span className="text-xs text-ink-muted" role="status">
              {cleanSpecialization} is already on the list.
            </span>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <span className={PROFILE_LABEL} id="doctor-languages-label">
            Languages Spoken
          </span>
          {professionalInfo.languagesSpoken.length > 0 ? (
            <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0" aria-labelledby="doctor-languages-label">
              {professionalInfo.languagesSpoken.map((lang) => (
                <li
                  key={lang}
                  className="inline-flex min-h-[34px] items-center rounded-[10px] bg-well px-3 text-[13px] font-semibold text-ink"
                >
                  {lang}
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-[13px] text-ink-muted">No languages added yet.</span>
          )}
        </div>
      </ProfileCard>

      <ProfileCard icon={BookOpen} title="Education & Certifications">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2.5">
            <h3 className="m-0 text-sm font-bold text-ink">Education</h3>
            {professionalInfo.education.length > 0 ? (
              professionalInfo.education.map((edu) => (
                <div
                  key={`${edu.degree}-${edu.institution}-${edu.year}`}
                  className="flex flex-col gap-0.5 rounded-[14px] border border-line px-3.5 py-3"
                >
                  <span className="text-sm font-bold text-ink">{edu.degree}</span>
                  {edu.institution || edu.year ? (
                    <span className="text-xs text-ink-muted">
                      {[edu.institution, edu.year].filter(Boolean).join(" • ")}
                    </span>
                  ) : null}
                </div>
              ))
            ) : (
              <span className="text-[13px] text-ink-muted">No education added yet.</span>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2.5">
            <h3 className="m-0 text-sm font-bold text-ink">Certifications</h3>
            {professionalInfo.certifications.length > 0 ? (
              professionalInfo.certifications.map((cert) => (
                <div key={cert} className="flex rounded-[14px] border border-line px-3.5 py-3">
                  <span className="text-sm font-bold text-ink">{cert}</span>
                </div>
              ))
            ) : (
              <span className="text-[13px] text-ink-muted">No certifications added yet.</span>
            )}
          </div>
        </div>
        <Note tone="blue">Adding or changing education and certifications is not available here yet.</Note>
      </ProfileCard>
    </div>
  );
}
