"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateInIST, formatDateTimeInIST } from "@/lib/utils/date-time";
import { Award, Shield } from "lucide-react";
import type { ReceptionistProfileFormState } from "./receptionist-profile.types";

interface ReceptionistProfileWorkTabProps {
  profileData: ReceptionistProfileFormState;
}

function accessBadgeClass(enabled: boolean) {
  return enabled
    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
}

export function ReceptionistProfileWorkTab({
  profileData,
}: ReceptionistProfileWorkTabProps) {
  return (
    <div className="gap-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="size-5" />
            Work Information
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Employee ID</Label>
              <Input value={profileData.workInfo.employeeId} disabled />
            </div>
            <div>
              <Label>Position</Label>
              <Input value={profileData.workInfo.position} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Department</Label>
              <Input value={profileData.workInfo.department} disabled />
            </div>
            <div>
              <Label>Work Schedule</Label>
              <Input value={profileData.workInfo.workSchedule} disabled />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label>Joining Date</Label>
              <Input
                value={profileData.workInfo.joiningDate ? formatDateInIST(profileData.workInfo.joiningDate) : ""}
                disabled
              />
            </div>
            <div>
              <Label>Experience</Label>
              <Input value={profileData.workInfo.experience} disabled />
            </div>
          </div>
          <div>
            <Label>Supervisor</Label>
            <Input value={profileData.workInfo.supervisor} disabled />
          </div>
          <div>
            <Label>Work Location</Label>
            <Input value={profileData.workInfo.workLocation} disabled />
          </div>
          <div>
            <Label>Skills & Competencies</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profileData.workInfo.skills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5" />
            System Access & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="gap-y-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="gap-y-3">
              <div className="flex items-center justify-between">
                <span>Schedule Appointments</span>
                <Badge className={accessBadgeClass(profileData.systemAccess.canScheduleAppointments)}>
                  {profileData.systemAccess.canScheduleAppointments ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Edit Patient Information</span>
                <Badge className={accessBadgeClass(profileData.systemAccess.canEditPatientInfo)}>
                  {profileData.systemAccess.canEditPatientInfo ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Process Payments</span>
                <Badge className={accessBadgeClass(profileData.systemAccess.canProcessPayments)}>
                  {profileData.systemAccess.canProcessPayments ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
            <div className="gap-y-3">
              <div className="flex items-center justify-between">
                <span>Access Reports</span>
                <Badge className={accessBadgeClass(profileData.systemAccess.canAccessReports)}>
                  {profileData.systemAccess.canAccessReports ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Manage Inventory</span>
                <Badge className={accessBadgeClass(profileData.systemAccess.canManageInventory)}>
                  {profileData.systemAccess.canManageInventory ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="text-sm text-muted-foreground">
              <strong>Last Login:</strong>{" "}
              {profileData.systemAccess.lastLogin
                ? formatDateTimeInIST(profileData.systemAccess.lastLogin)
                : "—"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
