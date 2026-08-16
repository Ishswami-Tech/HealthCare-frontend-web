"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock } from "lucide-react";
import type { DoctorProfileFormState } from "./doctor-profile.types";

interface DoctorProfileAvailabilityTabProps {
  profileData: DoctorProfileFormState;
  updateAvailability: (day: string, field: string, value: unknown) => void;
}

export function DoctorProfileAvailabilityTab({
  profileData,
  updateAvailability,
}: DoctorProfileAvailabilityTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-5" />
          Weekly Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-y-4">
          {Object.entries(profileData.availability).map(([day, schedule]) => (
            <div
              key={day}
              className="grid grid-cols-1 items-center gap-4 md:grid-cols-4"
            >
              <div className="font-medium capitalize">{day}</div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={schedule.available}
                  onCheckedChange={(checked) =>
                    updateAvailability(day, "available", checked)
                  }
                />
                <Label className="text-sm">Available</Label>
              </div>
              {schedule.available && (
                <>
                  <div>
                    <Label className="text-xs text-gray-600">Start Time</Label>
                    <Input
                      type="time"
                      value={schedule.startTime}
                      onChange={(e) =>
                        updateAvailability(day, "startTime", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">End Time</Label>
                    <Input
                      type="time"
                      value={schedule.endTime}
                      onChange={(e) =>
                        updateAvailability(day, "endTime", e.target.value)
                      }
                      className="mt-1"
                    />
                  </div>
                </>
              )}
              {!schedule.available && (
                <div className="col-span-2 text-sm text-gray-500">
                  Not Available
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
