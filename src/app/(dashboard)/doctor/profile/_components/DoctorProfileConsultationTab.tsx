"use client";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Stethoscope } from "lucide-react";
import { PROFILE_SWITCH, ProfileCard, ProfileField } from "./DoctorProfileParts";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileConsultationTabProps {
  profileData: DoctorProfileFormState;
  updateConsultationSettings: (field: string, value: unknown) => void;
}

export function DoctorProfileConsultationTab({
  profileData,
  updateConsultationSettings,
}: DoctorProfileConsultationTabProps) {
  const settings = profileData.consultationSettings;

  return (
    <ProfileCard icon={Stethoscope} title="Consultation Settings" className="gap-3.5">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <ProfileField label="Consultation Fee (₹)" htmlFor="consultationFee">
          <Input
            id="consultationFee"
            type="number"
            min={0}
            inputMode="numeric"
            value={settings.consultationFee}
            onChange={(e) => updateConsultationSettings("consultationFee", e.target.value)}
          />
        </ProfileField>
        <ProfileField label="Follow-up Fee (₹)" htmlFor="followUpFee">
          <Input
            id="followUpFee"
            type="number"
            min={0}
            inputMode="numeric"
            value={settings.followUpFee}
            onChange={(e) => updateConsultationSettings("followUpFee", e.target.value)}
          />
        </ProfileField>
        <ProfileField label="Duration (minutes)" htmlFor="consultationDuration">
          <Input
            id="consultationDuration"
            type="number"
            min={0}
            inputMode="numeric"
            value={settings.consultationDuration}
            onChange={(e) => updateConsultationSettings("consultationDuration", e.target.value)}
          />
        </ProfileField>
      </div>

      <div className="flex flex-col">
        <SettingRow
          id="onlineConsultation"
          label="Online Consultation"
          description="Allow patients to book online consultations"
          checked={settings.onlineConsultation}
          onCheckedChange={(checked) => updateConsultationSettings("onlineConsultation", checked)}
        />
        <SettingRow
          id="videoConsultation"
          label="Video Consultation"
          description="Enable video calls for consultations"
          checked={settings.videoConsultation}
          onCheckedChange={(checked) => updateConsultationSettings("videoConsultation", checked)}
        />
        <SettingRow
          id="homeVisits"
          label="Home Visits"
          description="Offer home visit services"
          checked={settings.homeVisits}
          onCheckedChange={(checked) => updateConsultationSettings("homeVisits", checked)}
        />
        <SettingRow
          id="emergencyConsultation"
          label="Emergency Consultation"
          description="Available for emergency consultations"
          checked={settings.emergencyConsultation}
          onCheckedChange={(checked) => updateConsultationSettings("emergencyConsultation", checked)}
        />
      </div>
    </ProfileCard>
  );
}

interface SettingRowProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({ id, label, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-center gap-4 border-b border-hair py-[13px] last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
        </label>
        <span id={`${id}-hint`} className="text-xs text-ink-muted">
          {description}
        </span>
      </div>
      <Switch
        id={id}
        aria-describedby={`${id}-hint`}
        className={PROFILE_SWITCH}
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}
