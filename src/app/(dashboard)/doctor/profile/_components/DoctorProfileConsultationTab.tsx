"use client";

import { Switch } from "@/components/ui/switch";
import { Info, Stethoscope } from "lucide-react";
import { Note } from "@/components/tbd";
import { useClinicVisitDurations } from "@/hooks/query/useClinics";
import { PROFILE_SWITCH, ProfileCard } from "./DoctorProfileParts";
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
  const durations = useClinicVisitDurations();

  return (
    <ProfileCard icon={Stethoscope} title="Consultation Settings" className="gap-3.5">
      {/* Fees are not shown: a doctor sees no money amounts, and the clinic admin sets them. */}
      <Note tone="blue" icon={Info}>
        These settings cannot be changed here. Your clinic admin sets the visit types and the visit lengths.
      </Note>

      {/* Visit lengths are clinic settings (slots and bookings use them); read-only here. */}
      <div role="group" className="grid grid-cols-1 gap-3.5 sm:grid-cols-2" aria-label="Visit lengths">
        <VisitLength label="In-clinic visit" minutes={durations.inPersonMinutes} loading={durations.isLoading} />
        <VisitLength label="Video visit" minutes={durations.videoMinutes} loading={durations.isLoading} />
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
        disabled
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

/** One read-only clinic visit length ("3 min", "Set by clinic admin"). */
function VisitLength({ label, minutes, loading }: { label: string; minutes: number; loading: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-xl border border-hair bg-well px-3.5 py-3">
      <span className="text-xs font-bold text-ink-muted">{label}</span>
      <span className="text-base font-extrabold text-ink">{loading ? "..." : `${minutes} min`}</span>
      <span className="text-xs text-ink-muted">Set by clinic admin</span>
    </div>
  );
}
