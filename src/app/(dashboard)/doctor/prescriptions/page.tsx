"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  Pill,
  Download,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  usePrescriptions,
  useCreatePrescription,
  useUpdatePrescription,
  useDeletePrescription,
} from "@/hooks/query/usePrescriptions";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function DoctorPrescriptions() {
  const { session } = useAuth();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const doctorId = user?.id;

  const { data: prescriptionsData, isPending } = usePrescriptions(doctorId);
  const createMutation = useCreatePrescription();
  const updateMutation = useUpdatePrescription();
  const deleteMutation = useDeletePrescription();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['prescriptions', doctorId]]);

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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescriptions</h1>
          <p className="text-gray-600">
            Manage and view all patient prescriptions
          </p>
        </div>
        <Button className="flex items-center gap-2" disabled={createMutation.isPending}>
          <Plus className="w-4 h-4" />
          New Prescription
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {prescriptions.length}
                </div>
                <div className="text-sm text-gray-600">Total Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Pill className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {prescriptions.filter((p: any) => p.status === "active").length}
                </div>
                <div className="text-sm text-gray-600">Active Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(prescriptions.map((p: any) => p.patientId)).size}
                </div>
                <div className="text-sm text-gray-600">Unique Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {prescriptions.filter((p: any) => {
                    const today = new Date().toDateString();
                    return new Date(p.date).toDateString() === today;
                  }).length}
                </div>
                <div className="text-sm text-gray-600">Today's Prescriptions</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Prescriptions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Prescriptions List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No prescriptions found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPrescriptions.map((prescription: any) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
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
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(prescription.date).toLocaleDateString(
                              "en-IN",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
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
                          {prescription.medicines?.map((medicine: string, index: number) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="bg-green-50 text-green-800 border-green-200"
                            >
                              <Pill className="w-3 h-3 mr-1" />
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
                      <Button variant="outline" size="sm" disabled={updateMutation.isPending}>
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={updateMutation.isPending}>
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
    </div>
  );
}
