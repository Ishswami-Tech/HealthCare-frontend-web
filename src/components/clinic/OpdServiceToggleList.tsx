"use client";

import { useId } from "react";
import { QrCode, Stethoscope, Video, type LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  OPD_SERVICE_TOGGLE_COPY,
  OPD_SERVICE_TOGGLE_KEYS,
  type OpdServiceToggleKey,
  type OpdServiceToggles,
} from "@/lib/clinics/opd-controls.logic";

const ICONS: Record<OpdServiceToggleKey, LucideIcon> = {
  qrCheckInEnabled: QrCode,
  videoConsultationEnabled: Video,
  generalConsultationEnabled: Stethoscope,
};

/**
 * The three clinic service switches (QR self check-in, video, in-person). Presentational only:
 * the clinic-admin settings form and the super-admin panel each own saving.
 */
export function OpdServiceToggleList({
  value,
  onChange,
  disabled = false,
}: {
  value: OpdServiceToggles;
  onChange: (key: OpdServiceToggleKey, checked: boolean) => void;
  disabled?: boolean;
}) {
  const idPrefix = useId();
  return (
    <div className="flex flex-col gap-2">
      {OPD_SERVICE_TOGGLE_KEYS.map((key) => {
        const Icon = ICONS[key];
        const copy = OPD_SERVICE_TOGGLE_COPY[key];
        const switchId = `${idPrefix}-${key}`;
        const descriptionId = `${switchId}-description`;
        const checked = value[key];
        return (
          <div
            key={key}
            className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2"
          >
            <div className="flex min-w-0 items-start gap-2.5">
              <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0">
                <Label htmlFor={switchId} className="text-sm leading-5">
                  {copy.label}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    {checked ? "On" : "Off"}
                  </span>
                </Label>
                <p id={descriptionId} className="text-xs leading-5 text-muted-foreground">
                  {copy.description}
                </p>
              </div>
            </div>
            <Switch
              id={switchId}
              checked={checked}
              disabled={disabled}
              aria-describedby={descriptionId}
              onCheckedChange={(next) => onChange(key, next)}
            />
          </div>
        );
      })}
    </div>
  );
}
