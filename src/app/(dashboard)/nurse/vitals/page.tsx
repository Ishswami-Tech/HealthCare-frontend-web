"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "@/components/ui/loader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Activity,
  Thermometer,
  Heart,
  Search,
  Calendar,
  Save,
  Plus,
  Edit2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useNursePatientVitals,
  useNursePatients,
  useCreateNursePatientRecord,
  useUpdateNursePatientRecord,
} from "@/hooks/query/useNurse";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

interface VitalsFormData {
  patientId: string;
  patientName: string;
  systolic: string;
  diastolic: string;
  temperature: string;
  pulse: string;
  respiratoryRate: string;
  oxygenSaturation: string;
  notes: string;
}

const EMPTY_FORM: VitalsFormData = {
  patientId: "",
  patientName: "",
  systolic: "",
  diastolic: "",
  temperature: "",
  pulse: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  notes: "",
};

export default function NurseVitals() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<VitalsFormData>(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  // Auto-open form when navigated from patients page with patientId
  useEffect(() => {
    const patientId = searchParams.get("patientId");
    const patientName = searchParams.get("patientName");
    if (patientId) {
      setForm((f) => ({ ...f, patientId, patientName: patientName || "" }));
      setEditingId(null);
      setFormError("");
      setFormOpen(true);
    }
  }, [searchParams]);

  const nurseId = user?.id;

  const { data: vitalsData, isPending } = useNursePatientVitals(nurseId);
  const { data: patientsData } = useNursePatients({ ...(nurseId ? { nurseId } : {}) });
  const createMutation = useCreateNursePatientRecord();
  const updateMutation = useUpdateNursePatientRecord();

  useWebSocketQuerySync([["nursePatientVitals", nurseId]]);

  const vitalsRecords = vitalsData?.vitals || [];
  const patientsList: any[] = Array.isArray(patientsData?.patients)
    ? patientsData.patients
    : [];

  const filteredRecords = vitalsRecords.filter((record: any) =>
    record.patientName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError("");
    setFormOpen(true);
  }, []);

  const openEditForm = useCallback((record: any) => {
    setForm({
      patientId: record.patientId || "",
      patientName: record.patientName || "",
      systolic: String(record.bloodPressure?.systolic || ""),
      diastolic: String(record.bloodPressure?.diastolic || ""),
      temperature: String(record.temperature || ""),
      pulse: String(record.pulse || ""),
      respiratoryRate: String(record.respiratoryRate || ""),
      oxygenSaturation: String(record.oxygenSaturation || ""),
      notes: record.notes || "",
    });
    setEditingId(record.id);
    setFormError("");
    setFormOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.patientId && !form.patientName) {
      setFormError("Patient is required.");
      return;
    }
    setFormError("");

    const payload = {
      patientId: form.patientId,
      patientName: form.patientName,
      nurseId,
      recordedAt: new Date().toLocaleString("en-CA", { timeZone: "Asia/Kolkata" }),
      bloodPressure: {
        systolic: Number(form.systolic) || null,
        diastolic: Number(form.diastolic) || null,
      },
      temperature: form.temperature ? Number(form.temperature) : null,
      pulse: form.pulse ? Number(form.pulse) : null,
      respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : null,
      oxygenSaturation: form.oxygenSaturation ? Number(form.oxygenSaturation) : null,
      notes: form.notes || undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload } as any);
      } else {
        await createMutation.mutateAsync(payload as any);
      }
      setFormOpen(false);
    } catch {
      setFormError("Failed to save vitals. Please try again.");
    }
  }, [form, editingId, nurseId, createMutation, updateMutation]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vitals Monitoring</h1>
        <p className="text-gray-600">Record and track patient vital signs</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="flex items-center gap-2" onClick={openCreateForm}>
              <Plus className="w-4 h-4" />
              Record New Vitals
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Vitals History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No vitals recorded yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRecords.map((record: any) => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold">{record.patientName}</h4>
                        <span className="text-sm text-gray-500">({record.patientId})</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-gray-600">BP</span>
                          </div>
                          <p className="font-semibold">
                            {record.bloodPressure?.systolic ?? "—"}/
                            {record.bloodPressure?.diastolic ?? "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Thermometer className="w-4 h-4 text-orange-600" />
                            <span className="text-xs text-gray-600">Temp</span>
                          </div>
                          <p className="font-semibold">
                            {record.temperature != null ? `${record.temperature}°F` : "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Heart className="w-4 h-4 text-pink-600" />
                            <span className="text-xs text-gray-600">Pulse</span>
                          </div>
                          <p className="font-semibold">
                            {record.pulse != null ? `${record.pulse} bpm` : "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-600">Resp</span>
                          </div>
                          <p className="font-semibold">
                            {record.respiratoryRate != null ? `${record.respiratoryRate}/min` : "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">O2 Sat</span>
                          </div>
                          <p className="font-semibold">
                            {record.oxygenSaturation != null ? `${record.oxygenSaturation}%` : "—"}
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600">Time</span>
                          </div>
                          <p className="font-semibold text-xs">
                            {record.recordedAt
                              ? new Date(record.recordedAt).toLocaleString("en-IN", {
                                  timeZone: "Asia/Kolkata",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  day: "2-digit",
                                  month: "short",
                                })
                              : (record.time ?? "—")}
                          </p>
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-3 italic">
                          Notes: {record.notes}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditForm(record)}
                      disabled={updateMutation.isPending}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vitals Recording Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Vitals" : "Record New Vitals"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Patient selector */}
            <div className="space-y-1">
              <Label>Patient</Label>
              {patientsList.length > 0 ? (
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm"
                  value={form.patientId}
                  onChange={(e) => {
                    const p = patientsList.find((x: any) => x.id === e.target.value);
                    setForm((f) => ({
                      ...f,
                      patientId: e.target.value,
                      patientName: p?.name || p?.user?.name || "",
                    }));
                  }}
                >
                  <option value="">Select patient…</option>
                  {patientsList.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name || p.user?.name || p.id}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  placeholder="Patient name"
                  value={form.patientName}
                  onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>BP Systolic (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 120"
                  value={form.systolic}
                  onChange={(e) => setForm((f) => ({ ...f, systolic: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>BP Diastolic (mmHg)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 80"
                  value={form.diastolic}
                  onChange={(e) => setForm((f) => ({ ...f, diastolic: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Temperature (°F)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  value={form.temperature}
                  onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Pulse (bpm)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 72"
                  value={form.pulse}
                  onChange={(e) => setForm((f) => ({ ...f, pulse: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Respiratory Rate (/min)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 18"
                  value={form.respiratoryRate}
                  onChange={(e) => setForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>O2 Saturation (%)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 98"
                  value={form.oxygenSaturation}
                  onChange={(e) => setForm((f) => ({ ...f, oxygenSaturation: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Textarea
                placeholder="Additional observations…"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="resize-none h-20"
              />
            </div>

            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingId ? "Update" : "Save Vitals"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
