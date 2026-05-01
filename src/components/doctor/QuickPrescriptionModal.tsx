"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pill,
  Activity,
  Loader2,
  Plus,
  X,
  Stethoscope,
  CalendarClock,
  Search,
} from "lucide-react";
import { useCompleteAppointment } from "@/hooks/query/useAppointments";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useCreatePrescription, useMedicines } from "@/hooks/query/usePharmacy";
import type { Medicine } from "@/types/pharmacy.types";

interface QuickPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
}

interface MedicationRow {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
}

const createEmptyMedication = (): MedicationRow => ({
  medicineId: "",
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  quantity: "1",
  instructions: "",
});

const formatMedicationSummary = (medication: MedicationRow) =>
  [
    medication.name.trim(),
    medication.dosage.trim() ? `Dose: ${medication.dosage.trim()}` : "",
    medication.frequency.trim() ? `Freq: ${medication.frequency.trim()}` : "",
    medication.duration.trim() ? `Duration: ${medication.duration.trim()}` : "",
    medication.quantity.trim() ? `Qty: ${medication.quantity.trim()}` : "",
    medication.instructions.trim() ? `Instructions: ${medication.instructions.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

const medicineDisplayLabel = (medicine: Medicine) => {
  const pieces = [medicine.name, medicine.strength, medicine.dosageForm]
    .filter(Boolean)
    .join(" - ");

  return `${pieces}${medicine.stockQuantity <= 0 ? " - Out of stock" : ` - Stock ${medicine.stockQuantity}`}`;
};

export function QuickPrescriptionModal({
  isOpen,
  onClose,
  appointmentId,
  patientId,
  patientName,
  doctorId,
}: QuickPrescriptionModalProps) {
  const { clinicId } = useClinicContext();
  const [diagnosis, setDiagnosis] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [medicineSearch, setMedicineSearch] = useState("");
  const [medications, setMedications] = useState<MedicationRow[]>([createEmptyMedication()]);

  const completeAppointment = useCompleteAppointment();
  const createPharmacyPrescription = useCreatePrescription();
  const { data: medicinesData, isPending: medicinesLoading } = useMedicines(clinicId || "", {
    limit: 200,
    inStock: false,
  });

  const inventoryMedicines = useMemo(() => {
    const data = medicinesData as unknown;

    if (Array.isArray(data)) {
      return data as Medicine[];
    }

    if (data && typeof data === "object") {
      const record = data as Record<string, unknown>;
      if (Array.isArray(record.medicines)) {
        return record.medicines as Medicine[];
      }

      if (Array.isArray(record.data)) {
        return record.data as Medicine[];
      }

      if (Array.isArray(record.items)) {
        return record.items as Medicine[];
      }
    }

    return [];
  }, [medicinesData]);

  const filteredMedicines = useMemo(() => {
    const query = medicineSearch.trim().toLowerCase();

    if (!query) {
      return inventoryMedicines;
    }

    return inventoryMedicines.filter((medicine) => {
      const haystack = [
        medicine.name,
        medicine.genericName,
        medicine.manufacturer,
        medicine.category,
        medicine.strength,
        medicine.dosageForm,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [inventoryMedicines, medicineSearch]);

  const medicinesById = useMemo(() => {
    return new Map(inventoryMedicines.map((medicine) => [medicine.id, medicine]));
  }, [inventoryMedicines]);

  const handleAddMedication = () => {
    setMedications((current) => [...current, createEmptyMedication()]);
  };

  const handleRemoveMedication = (index: number) => {
    setMedications((current) => current.filter((_, i) => i !== index));
  };

  const handleMedChange = (index: number, field: keyof MedicationRow, value: string) => {
    setMedications((current) =>
      current.map((medication, i) =>
        i === index ? { ...medication, [field]: value } : medication
      )
    );
  };

  const handleMedicineSelect = (index: number, medicineId: string) => {
    const selectedMedicine = medicinesById.get(medicineId);

    setMedications((current) =>
      current.map((medication, i) =>
        i === index
          ? {
              ...medication,
              medicineId,
              name: selectedMedicine?.name || medication.name,
              dosage: medication.dosage || selectedMedicine?.strength || "",
            }
          : medication
      )
    );
  };

  const handleSubmit = async () => {
    const cleanMedications = medications
      .map((medication) => ({
        ...medication,
        medicineId: medication.medicineId.trim(),
        name: medication.name.trim(),
        dosage: medication.dosage.trim(),
        frequency: medication.frequency.trim(),
        duration: medication.duration.trim(),
        quantity: medication.quantity.trim(),
        instructions: medication.instructions.trim(),
      }))
      .filter((medication) => medication.name || medication.medicineId);

    if (!diagnosis.trim() && !treatmentPlan.trim() && cleanMedications.length === 0) {
      return;
    }

    const structuredMedications = cleanMedications
      .filter((medication) => medication.medicineId)
      .map((medication) => ({
        medicineId: medication.medicineId,
        dosage: medication.dosage || medication.name,
        frequency: medication.frequency,
        duration: medication.duration,
        quantity: Math.max(1, Number.parseInt(medication.quantity, 10) || 1),
        ...(medication.instructions ? { instructions: medication.instructions } : {}),
      }));

    try {
      const prescriptionText = cleanMedications
        .map(formatMedicationSummary)
        .filter(Boolean)
        .join("\n");

      const appointmentTask = completeAppointment.mutateAsync({
        id: appointmentId,
        data: {
          diagnosis: diagnosis.trim(),
          notes: notes.trim(),
          treatmentPlan: treatmentPlan.trim() || notes.trim(),
          medications: cleanMedications.map(formatMedicationSummary),
          ...(prescriptionText ? { prescription: prescriptionText } : {}),
          ...(followUpDate ? { followUpDate } : {}),
          ...(followUpNotes.trim() ? { followUpNotes: followUpNotes.trim() } : {}),
        },
      });

      const pharmacyTask =
        clinicId && structuredMedications.length > 0
          ? createPharmacyPrescription.mutateAsync({
              clinicId,
              patientId,
              doctorId,
              medications: structuredMedications,
              ...(diagnosis.trim() ? { diagnosis: diagnosis.trim() } : {}),
              ...([treatmentPlan.trim(), notes.trim()].filter(Boolean).join(" ")
                ? { notes: [treatmentPlan.trim(), notes.trim()].filter(Boolean).join(" ") }
                : {}),
              ...(followUpDate ? { validUntil: followUpDate } : {}),
            })
          : Promise.resolve(null);

      const [appointmentResult, pharmacyResult] = await Promise.allSettled([
        appointmentTask,
        pharmacyTask,
      ]);

      if (appointmentResult.status === "rejected" || pharmacyResult.status === "rejected") {
        const appointmentError =
          appointmentResult.status === "rejected" ? appointmentResult.reason : null;
        const pharmacyError =
          pharmacyResult.status === "rejected" ? pharmacyResult.reason : null;

        console.error("Failed to save complete prescription payload", {
          appointmentError,
          pharmacyError,
        });
        return;
      }

      setDiagnosis("");
      setTreatmentPlan("");
      setNotes("");
      setFollowUpDate("");
      setFollowUpNotes("");
      setMedicineSearch("");
      setMedications([createEmptyMedication()]);
      onClose();
    } catch (error) {
      console.error("Failed to complete appointment with prescription:", error);
    }
  };

  const hasInventoryMedicines = inventoryMedicines.length > 0;
  const isSubmitting = completeAppointment.isPending || createPharmacyPrescription.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Pill className="h-4 w-4" />
            </div>
            Clinical Prescription
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Record diagnosis, treatment, and structured medicines for{" "}
            <span className="font-semibold text-foreground">{patientName}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <Card className="border-border/70">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient</p>
                <p className="mt-1 font-semibold">{patientName}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Patient ID</p>
                <p className="mt-1 font-semibold break-all">{patientId}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Appointment</p>
                <p className="mt-1 font-semibold break-all">{appointmentId}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Doctor</p>
                <p className="mt-1 font-semibold break-all">{doctorId}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Label
              htmlFor="diagnosis"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <Stethoscope className="h-3 w-3" />
              Diagnosis
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="Primary diagnosis or clinical impression"
              className="min-h-[90px] resize-none"
              value={diagnosis}
              onChange={(event) => setDiagnosis(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="treatment-plan"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              <Activity className="h-3 w-3" />
              Treatment Plan
            </Label>
            <Textarea
              id="treatment-plan"
              placeholder="Consultation summary, treatment plan, diet, exercise, instructions"
              className="min-h-[90px] resize-none"
              value={treatmentPlan}
              onChange={(event) => setTreatmentPlan(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="clinical-notes"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Additional Notes
            </Label>
            <Textarea
              id="clinical-notes"
              placeholder="Any extra notes for the chart or handover"
              className="min-h-[80px] resize-none"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <Card className="border-border/70">
            <CardContent className="space-y-4 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Medicines</p>
                  <p className="text-xs text-muted-foreground">
                    Select an inventory medicine to create a pharmacy-dispensable prescription. Free text remains in the chart summary.
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMedication}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add medicine
                </Button>
              </div>

              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3">
                <Label
                  htmlFor="medicine-search"
                  className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  <Search className="h-3 w-3" />
                  Search inventory
                </Label>
                <Input
                  id="medicine-search"
                  placeholder="Search by medicine name, strength, manufacturer, or category"
                  value={medicineSearch}
                  onChange={(event) => setMedicineSearch(event.target.value)}
                />
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {clinicId ? `Clinic ${clinicId}` : "No clinic context"}
                  </Badge>
                  <span>{inventoryMedicines.length} inventory medicines loaded</span>
                  {medicinesLoading && (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Loading stock
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {medications.map((medication, index) => {
                  const selectedMedicine = medication.medicineId
                    ? medicinesById.get(medication.medicineId)
                    : undefined;

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-border/70 bg-muted/20 p-3"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Medicine {index + 1}
                          </p>
                          {selectedMedicine ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-200 bg-emerald-50 text-emerald-700"
                            >
                              Linked to inventory
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                              Not linked yet
                            </Badge>
                          )}
                        </div>
                        {medications.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => handleRemoveMedication(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Inventory medicine
                          </Label>
                          <Select
                            value={medication.medicineId}
                            onValueChange={(value) => handleMedicineSelect(index, value)}
                            disabled={!hasInventoryMedicines}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue
                                placeholder={
                                  hasInventoryMedicines
                                    ? "Select a medicine from pharmacy stock"
                                    : "No medicines available in inventory"
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {filteredMedicines.length > 0 ? (
                                filteredMedicines.map((medicine) => (
                                  <SelectItem key={medicine.id} value={medicine.id}>
                                    {medicineDisplayLabel(medicine)}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="__no_results__" disabled>
                                  No medicines match the current search.
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          {selectedMedicine && (
                            <div className="text-xs text-muted-foreground">
                              Generic label:{" "}
                              <span className="font-medium text-foreground">
                                {selectedMedicine.genericName || "Not specified"}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Prescription label
                          </Label>
                          <Input
                            placeholder="Paracetamol 500 mg"
                            value={medication.name}
                            onChange={(event) => handleMedChange(index, "name", event.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Dose
                          </Label>
                          <Input
                            placeholder="1 tablet"
                            value={medication.dosage}
                            onChange={(event) => handleMedChange(index, "dosage", event.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Frequency
                          </Label>
                          <Input
                            placeholder="Twice daily"
                            value={medication.frequency}
                            onChange={(event) => handleMedChange(index, "frequency", event.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Duration
                          </Label>
                          <Input
                            placeholder="5 days"
                            value={medication.duration}
                            onChange={(event) => handleMedChange(index, "duration", event.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Quantity
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            placeholder="1"
                            value={medication.quantity}
                            onChange={(event) => handleMedChange(index, "quantity", event.target.value)}
                          />
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Instructions
                          </Label>
                          <Input
                            placeholder="After food"
                            value={medication.instructions}
                            onChange={(event) => handleMedChange(index, "instructions", event.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="follow-up-date"
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  <CalendarClock className="h-3 w-3" />
                  Follow-up date
                </Label>
                <Input
                  id="follow-up-date"
                  type="date"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="follow-up-notes"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Follow-up notes
                </Label>
                <Input
                  id="follow-up-notes"
                  placeholder="Review labs in 1 week"
                  value={followUpNotes}
                  onChange={(event) => setFollowUpNotes(event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
          Pharmacy-linked medicines are created only when a medicine is selected from inventory. Free-text entries still save to the consultation note.
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="min-w-[140px] bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (!diagnosis.trim() &&
                !treatmentPlan.trim() &&
                medications.every((medication) => !medication.name.trim() && !medication.medicineId.trim()))
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Complete Update"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
