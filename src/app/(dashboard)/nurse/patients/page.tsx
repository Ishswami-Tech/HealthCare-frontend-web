"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Search,
  Users,
  Filter,
  Heart,
  BedDouble,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useClinicContext } from "@/contexts/clinic-context";
import { useNursePatients } from "@/hooks/query/useNurse";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function NursePatients() {
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  const [searchQuery, setSearchQuery] = useState("");

  const nurseId = user?.id;

  const { data: patientsData, isPending } = useNursePatients(nurseId);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['nursePatients', nurseId]]);

  const patients = patientsData?.patients || [];

  const filteredPatients = patients.filter((patient: any) => {
    return (
      patient.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.condition?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-100 text-green-800";
      case "critical":
        return "bg-red-100 text-red-800";
      case "serious":
        return "bg-orange-100 text-orange-800";
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
      <div>
        <h1 className="text-3xl font-bold">Patient Care</h1>
        <p className="text-gray-600">Manage patient care and monitoring</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Patients Under Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No patients found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map((patient: any) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{patient.patientName}</h4>
                          <Badge variant="outline">{patient.room || "Room TBA"}</Badge>
                          <Badge className={getStatusColor(patient.status || "stable")}>
                            {patient.status || "stable"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{patient.condition || "Treatment"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Admitted: {patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString("en-IN") : "TBA"}</span>
                          <span>Doctor: {patient.doctor || "TBA"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Heart className="w-3 h-3 mr-1" />
                        Vitals
                      </Button>
                      <Button variant="outline" size="sm">
                        <BedDouble className="w-3 h-3 mr-1" />
                        Care
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
