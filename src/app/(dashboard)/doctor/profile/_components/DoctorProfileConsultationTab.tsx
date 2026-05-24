"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Stethoscope } from "lucide-react";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileConsultationTabProps {
  profileData: DoctorProfileFormState;
  updateConsultationSettings: (field: string, value: unknown) => void;
}

export function DoctorProfileConsultationTab({
  profileData,
  updateConsultationSettings,
}: DoctorProfileConsultationTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="size-5" />
          Consultation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label htmlFor="consultationFee">Consultation Fee (₹)</Label>
            <Input
              id="consultationFee"
              type="number"
              value={profileData.consultationSettings.consultationFee}
              onChange={(e) =>
                updateConsultationSettings("consultationFee", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="followUpFee">Follow-up Fee (₹)</Label>
            <Input
              id="followUpFee"
              type="number"
              value={profileData.consultationSettings.followUpFee}
              onChange={(e) =>
                updateConsultationSettings("followUpFee", e.target.value)
              }
            />
          </div>
          <div>
            <Label htmlFor="consultationDuration">Duration (minutes)</Label>
            <Input
              id="consultationDuration"
              type="number"
              value={profileData.consultationSettings.consultationDuration}
              onChange={(e) =>
                updateConsultationSettings("consultationDuration", e.target.value)
              }
            />
          </div>
        </div>

        <div className="gap-y-4">
          <SettingRow
            label="Online Consultation"
            description="Allow patients to book online consultations"
            checked={profileData.consultationSettings.onlineConsultation}
            onCheckedChange={(checked) =>
              updateConsultationSettings("onlineConsultation", checked)
            }
          />
          <SettingRow
            label="Video Consultation"
            description="Enable video calls for consultations"
            checked={profileData.consultationSettings.videoConsultation}
            onCheckedChange={(checked) =>
              updateConsultationSettings("videoConsultation", checked)
            }
          />
          <SettingRow
            label="Home Visits"
            description="Offer home visit services"
            checked={profileData.consultationSettings.homeVisits}
            onCheckedChange={(checked) =>
              updateConsultationSettings("homeVisits", checked)
            }
          />
          <SettingRow
            label="Emergency Consultation"
            description="Available for emergency consultations"
            checked={profileData.consultationSettings.emergencyConsultation}
            onCheckedChange={(checked) =>
              updateConsultationSettings("emergencyConsultation", checked)
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

function SettingRow({
  label,
  description,
  checked,
  onCheckedChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <Label>{label}</Label>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
