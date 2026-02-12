"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Role } from "@/types/auth.types";
import { ROLE_PERMISSIONS, Permission } from "@/types/rbac.types";
import { Loader2, Shield } from "lucide-react";
import { updateUserRole } from "@/lib/actions/users.server";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

// Roles clinic admin can assign
const CLINIC_ADMIN_ASSIGNABLE_ROLES: Role[] = [
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.NURSE,
];

// All staff roles for super admin
const ALL_STAFF_ROLES: Role[] = [
  Role.DOCTOR,
  Role.ASSISTANT_DOCTOR,
  Role.RECEPTIONIST,
  Role.PHARMACIST,
  Role.NURSE,
  Role.CLINIC_ADMIN,
];

const ROLE_LABELS: Partial<Record<Role, string>> = {
  [Role.SUPER_ADMIN]: "Super Admin",
  [Role.CLINIC_ADMIN]: "Clinic Admin",
  [Role.DOCTOR]: "Doctor",
  [Role.ASSISTANT_DOCTOR]: "Assistant Doctor",
  [Role.RECEPTIONIST]: "Receptionist",
  [Role.PHARMACIST]: "Pharmacist",
  [Role.PATIENT]: "Patient",
  [Role.NURSE]: "Nurse",
};

interface AssignRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffMember: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  currentUserRole: Role;
  clinicId?: string;
  onSuccess?: () => void;
}

export function AssignRoleModal({
  open,
  onOpenChange,
  staffMember,
  currentUserRole,
  clinicId,
  onSuccess,
}: AssignRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<Role>(
    (staffMember.role as Role) || Role.RECEPTIONIST
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isClinicAdmin = currentUserRole === Role.CLINIC_ADMIN;
  const assignableRoles = isClinicAdmin ? CLINIC_ADMIN_ASSIGNABLE_ROLES : ALL_STAFF_ROLES;

  const permissions = (ROLE_PERMISSIONS[selectedRole] || []) as Permission[];
  const permissionLabels = permissions.slice(0, 12).map((p) =>
    p
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toLowerCase())
      .replace(/^\w/, (c) => c.toUpperCase())
  );

  const handleSave = async () => {
    if (selectedRole === (staffMember.role as Role)) {
      onOpenChange(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await updateUserRole(staffMember.id, selectedRole, {
        ...(clinicId && { clinicId }),
      });
      showSuccessToast("Role updated successfully", { toastId: TOAST_IDS.USER.UPDATE });
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      showErrorToast(
        error instanceof Error ? error.message : "Failed to update role",
        { toastId: TOAST_IDS.USER.UPDATE }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Role & Permissions</DialogTitle>
          <DialogDescription>
            Change the role for {staffMember.name || staffMember.email}. Permissions are derived from the role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => setSelectedRole(v as Role)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {assignableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role] || role.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <Label>Permissions included with this role</Label>
            </div>
            <ScrollArea className="h-[120px] rounded-md border p-3">
              <div className="flex flex-wrap gap-2">
                {permissionLabels.map((label, i) => (
                  <span
                    key={i}
                    className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {label}
                  </span>
                ))}
                {permissions.length > 12 && (
                  <span className="text-xs text-muted-foreground">
                    +{permissions.length - 12} more
                  </span>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
