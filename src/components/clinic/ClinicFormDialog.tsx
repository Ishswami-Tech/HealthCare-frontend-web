"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import type { CreateClinicData } from "@/types/clinic.types";

const CLINIC_CORE_FIELDS = [
  { key: "name", label: "Clinic Name" },
  { key: "subdomain", label: "Subdomain" },
  { key: "app_name", label: "App Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "timezone", label: "Timezone" },
  { key: "currency", label: "Currency" },
  { key: "language", label: "Language" },
  { key: "clinicAdminIdentifier", label: "Clinic Admin Identifier" },
] as const;

const CLINIC_LOCATION_FIELDS = [
  { key: "name", label: "Location Name" },
  { key: "address", label: "Location Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  { key: "zipCode", label: "Zip Code" },
  { key: "phone", label: "Location Phone" },
  { key: "email", label: "Location Email" },
] as const;

type ClinicFormState = CreateClinicData & { id?: string };

function getClinicFieldValue(form: ClinicFormState, key: (typeof CLINIC_CORE_FIELDS)[number]["key"] | "address" | "website" | "logo") {
  return (form as unknown as Record<string, string | undefined>)[key] || "";
}

function getLocationFieldValue(form: ClinicFormState, key: (typeof CLINIC_LOCATION_FIELDS)[number]["key"]) {
  return (form.mainLocation as unknown as Record<string, string | undefined>)[key] || "";
}

interface ClinicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClinic: boolean;
  clinicForm: ClinicFormState;
  onFormChange: (form: ClinicFormState) => void;
  onSave: () => void;
  isPending: boolean;
}

export function ClinicFormDialog({
  open,
  onOpenChange,
  editingClinic,
  clinicForm,
  onFormChange,
  onSave,
  isPending,
}: ClinicFormDialogProps) {
  const handleCoreFieldChange = (key: string, value: string) => {
    onFormChange({ ...clinicForm, [key]: value } as ClinicFormState);
  };

  const handleDescriptionChange = (value: string) => {
    onFormChange({ ...clinicForm, description: value });
  };

  const handleAddressFieldChange = (key: string, value: string) => {
    onFormChange({ ...clinicForm, [key]: value } as ClinicFormState);
  };

  const handleLocationFieldChange = (key: string, value: string) => {
    onFormChange({
      ...clinicForm,
      mainLocation: {
        ...clinicForm.mainLocation,
        [key]: value,
      } as CreateClinicData["mainLocation"],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingClinic ? "Edit Clinic" : "Create Clinic"}</DialogTitle>
          <DialogDescription>
            Manage clinic profile, branding, and primary location from one form.
          </DialogDescription>
        </DialogHeader>

        <div className="gap-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CLINIC_CORE_FIELDS.map(({ key, label }) => (
              <div key={key} className="gap-y-2">
                <Label>{label}</Label>
                <Input
                  value={getClinicFieldValue(clinicForm, key)}
                  disabled={editingClinic && ["subdomain", "app_name", "clinicAdminIdentifier"].includes(key)}
                  onChange={(e) => handleCoreFieldChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className="gap-y-2">
            <Label>Description</Label>
            <Textarea
              value={clinicForm.description || ""}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "address" as const, label: "Clinic Address" },
              { key: "website" as const, label: "Website" },
              { key: "logo" as const, label: "Logo URL" },
            ].map(({ key, label }) => (
              <div key={key} className="gap-y-2">
                <Label>{label}</Label>
                <Input
                  value={getClinicFieldValue(clinicForm, key)}
                  onChange={(e) => handleAddressFieldChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>

          <div className="gap-y-3 rounded-lg border p-4">
            <div className="text-sm font-medium">Primary Location</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLINIC_LOCATION_FIELDS.map(({ key, label }) => (
                <div key={key} className="gap-y-2">
                  <Label>{label}</Label>
                  <Input
                    value={getLocationFieldValue(clinicForm, key)}
                    disabled={editingClinic}
                    onChange={(e) => handleLocationFieldChange(key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={onSave} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {editingClinic ? "Save Changes" : "Create Clinic"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}