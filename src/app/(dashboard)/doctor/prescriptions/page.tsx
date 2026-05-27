"use client";

import { useReducer } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  Pill,
  Download,
  Filter,
  Edit2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useHydrated } from "@/hooks/utils/useHydrated";
import { showInfoToast } from "@/hooks/utils/use-toast";
import {
  usePrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
  useDeletePrescription,
} from "@/hooks/query/usePrescriptions";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { formatDateInIST } from "@/lib/utils/date-time";

export default function DoctorPrescriptions() {
  const { session } = useAuth();
  const user = session?.user;
  const doctorId = user?.id || "";

  type DoctorPrescriptionEditForm = {
    diagnosis: string;
    notes: string;
    status: string;
    medicines: string;
  };

  type DoctorPrescriptionsState = {
    searchQuery: string;
    filterStatus: string;
    editingPrescription: any | null;
    showPrescriptionDialog: boolean;
    editForm: DoctorPrescriptionEditForm;
  };

  type DoctorPrescriptionsAction =
    | { type: "setSearchQuery"; value: string }
    | { type: "setFilterStatus"; value: string }
    | { type: "setEditingPrescription"; value: any | null }
    | { type: "setShowPrescriptionDialog"; value: boolean }
    | { type: "setEditForm"; value: DoctorPrescriptionEditForm }
    | { type: "updateEditForm"; value: Partial<DoctorPrescriptionEditForm> };

  const initialDoctorPrescriptionsState: DoctorPrescriptionsState = {
    searchQuery: "",
    filterStatus: "all",
    editingPrescription: null,
    showPrescriptionDialog: false,
    editForm: { diagnosis: "", notes: "", status: "active", medicines: "" },
  };

  function doctorPrescriptionsReducer(
    state: DoctorPrescriptionsState,
    action: DoctorPrescriptionsAction
  ): DoctorPrescriptionsState {
    switch (action.type) {
      case "setSearchQuery":
        return { ...state, searchQuery: action.value };
      case "setFilterStatus":
        return { ...state, filterStatus: action.value };
      case "setEditingPrescription":
        return { ...state, editingPrescription: action.value };
      case "setShowPrescriptionDialog":
        return { ...state, showPrescriptionDialog: action.value };
      case "setEditForm":
        return { ...state, editForm: action.value };
      case "updateEditForm":
        return { ...state, editForm: { ...state.editForm, ...action.value } };
      default:
        return state;
    }
  }

  const [
    {
      searchQuery,
      filterStatus,
      editingPrescription,
      showPrescriptionDialog,
      editForm,
    },
    dispatch,
  ] = useReducer(doctorPrescriptionsReducer, initialDoctorPrescriptionsState);

  const setSearchQuery = (value: string) => {
    dispatch({ type: "setSearchQuery", value });
  };

  const setFilterStatus = (value: string) => {
    dispatch({ type: "setFilterStatus", value });
  };

  const setEditingPrescription = (value: any | null) => {
    dispatch({ type: "setEditingPrescription", value });
  };

  const setShowPrescriptionDialog = (value: boolean) => {
    dispatch({ type: "setShowPrescriptionDialog", value });
  };

  const setEditForm = (value: DoctorPrescriptionEditForm) => {
    dispatch({ type: "setEditForm", value });
  };

  const updateEditForm = (value: Partial<DoctorPrescriptionEditForm>) => {
    dispatch({ type: "updateEditForm", value });
  };
  const isHydrated = useHydrated();
  const todayDate = isHydrated ? new Date().toDateString() : "";

  const { data: prescriptionsData, isPending } = usePrescriptions(doctorId);
  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  const deleteMutation = useDeletePrescription();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  const prescriptions = prescriptionsData?.prescriptions || [];

  const filteredPrescriptions = prescriptions.filter((prescription: any) => {
    const matchesSearch =
      prescription.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.diagnosis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.medicines?.some((med: string) =>
        med.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesStatus =
      filterStatus === "all" || prescription.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const openCreate = () => {
    setEditingPrescription(null);
    setEditForm({ diagnosis: "", notes: "", status: "active", medicines: "" });
    setShowPrescriptionDialog(true);
  };

  const openEdit = (prescription: any) => {
    setEditingPrescription(prescription);
    setEditForm({
      diagnosis: prescription.diagnosis || "",
      notes: prescription.doctorNotes || prescription.notes || "",
      status: prescription.status || "active",
      medicines: Array.isArray(prescription.medicines) ? prescription.medicines.join(", ") : "",
    });
    setShowPrescriptionDialog(true);
  };

  const handleDownload = (prescription: any) => {
    if (prescription.pdfUrl) {
      window.open(prescription.pdfUrl, "_blank");
    } else {
      showInfoToast("PDF not available for this prescription");
    }
  };

  const handleSavePrescription = () => {
    const medicinesArr = editForm.medicines
      .split(",")
      .flatMap((m) => {
        const trimmed = m.trim();
        return trimmed ? [trimmed] : [];
      });

    if (editingPrescription?.id) {
      updateMutation.mutate({
        prescriptionId: editingPrescription.id,
        updates: {
          notes: editForm.notes,
          status: editForm.status,
        },
      });
    } else {
      createMutation.mutate({
        patientId: "",
        doctorId: user?.id,
        notes: editForm.notes,
        status: editForm.status,
        medications: medicinesArr.map((name) => ({ name })),
      } as any);
    }
    setShowPrescriptionDialog(false);
  };

  const handleDelete = (prescriptionId: string) => {
    if (confirm("Are you sure you want to delete this prescription?")) {
      deleteMutation.mutate(prescriptionId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Doctor Prescriptions"
        title="Prescriptions"
        description="Review prescribed medicines and clinical notes. Medicine payment, packing, and dispatch stay with the medicine desk."
        actions={[
          {
            label: "New Prescription",
            onClick: openCreate,
            icon: <Plus className="size-4" />,
            disabled: createMutation.isPending,
          },
        ]}
      />

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 size-4 text-gray-400" />
              <Input
                placeholder="Search by patient, medicine, or diagnosis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => setFilterStatus("active")}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <Card className="border-l-2 border-l-blue-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="size-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {prescriptions.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-emerald-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Pill className="size-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {prescriptions.filter((p: any) => p.status === "active").length}
                </div>
                <div className="text-sm text-muted-foreground">Active Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-violet-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="size-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(prescriptions.map((p: any) => p.patientId)).size}
                </div>
                <div className="text-sm text-muted-foreground">Unique Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-2 border-l-amber-400 shadow-sm transition-shadow duration-300 hover:shadow-lg">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="size-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold" suppressHydrationWarning>
                  {prescriptions.filter((p: any) => {
                    if (!todayDate) return false;
                    const today = todayDate;
                    return new Date(p.date).toDateString() === today;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Today's Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Prescriptions List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <FileText className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No prescriptions found</EmptyTitle>
                <EmptyDescription>
                  Try adjusting your search or filters.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-y-4">
              {filteredPrescriptions.map((prescription: any) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">
                          {prescription.patientName}
                        </h3>
                        <Badge
                          className={getStatusColor(prescription.status)}
                        >
                          {prescription.status.charAt(0).toUpperCase() +
                            prescription.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4" />
                          <span>
                            {formatDateInIST(prescription.date, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="size-4" />
                          <span>ID: {prescription.patientId}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Diagnosis:
                        </div>
                        <p className="text-sm text-gray-600">
                          {prescription.diagnosis}
                        </p>
                      </div>
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          Medicines:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {prescription.medicines?.map((medicine: string) => (
                            <Badge
                              key={medicine}
                              variant="outline"
                              className="bg-green-50 text-green-800 border-green-200"
                            >
                              <Pill className="size-3 mr-1" />
                              {medicine}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {prescription.doctorNotes && (
                        <div className="mt-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            Doctor's Notes:
                          </div>
                          <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {prescription.doctorNotes}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleDownload(prescription)} title="Download PDF">
                        <Download className="size-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={updateMutation.isPending} onClick={() => openEdit(prescription)}>
                        <Edit2 className="size-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(prescription.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Prescription Dialog */}
      <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPrescription ? "Edit Prescription" : "New Prescription"}
            </DialogTitle>
            <DialogDescription>
              Create or update a prescription with the patientâ€™s medication plan and clinical notes.
            </DialogDescription>
            </DialogHeader>
          <div className="flex flex-col gap-y-4 py-2">
            <div className="flex flex-col gap-y-1.5">
              <Label htmlFor="doctor-prescription-notes">Diagnosis / Notes</Label>
              <textarea
                id="doctor-prescription-notes"
                aria-label="Diagnosis / Notes"
                className="w-full border rounded-md p-2 text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Enter diagnosis or clinical notes..."
                value={editForm.notes}
                onChange={(e) => updateEditForm({ notes: e.target.value })}
              />
            </div>
            {!editingPrescription && (
              <div className="flex flex-col gap-y-1.5">
                <Label htmlFor="doctor-prescription-medicines">Medicines (comma-separated)</Label>
                <Input
                  id="doctor-prescription-medicines"
                  placeholder="e.g. Paracetamol 500mg, Amoxicillin 250mg"
                  value={editForm.medicines}
                  onChange={(e) => updateEditForm({ medicines: e.target.value })}
                />
              </div>
            )}
            <div className="flex flex-col gap-y-1.5">
              <Label htmlFor="doctor-prescription-status">Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => updateEditForm({ status: v })}
              >
                <SelectTrigger id="doctor-prescription-status" aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPrescriptionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSavePrescription}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}



