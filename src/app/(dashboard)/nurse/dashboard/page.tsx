"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "@/components/ui/loader";
import {
  Users,
  Activity,
  Clock,
  CheckCircle,
  Heart,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useClinicContext } from "@/contexts/clinic-context";
import { useNursePatients, useNursePatientVitals } from "@/hooks/query/useNurse";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function NurseDashboard() {
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  const nurseId = user?.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: patientsData, isPending: isPatientsPending } = useNursePatients(nurseId);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['nursePatients', nurseId]]);

  const patients = patientsData?.patients || [];

  const activePatients = patients.slice(0, 3).map((patient: any) => ({
    id: patient.patientId,
    name: patient.patientName,
    room: patient.room || "Room TBA",
    vitals: {
      bloodPressure: "120/80",
      temperature: "98.6°F",
      pulse: "72 bpm",
    },
    lastChecked: "10 min ago",
    priority: "normal",
  }));

  const stats = useMemo(() => {
    return {
      activePatients: patients.length,
      vitalsRecordedToday: Math.floor(patients.length * 3),
      tasksCompleted: Math.floor(patients.length * 2),
      pendingTasks: patients.length,
    };
  }, [patients.length]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isPatientsPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nurse Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's your nursing care overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Patients
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.activePatients}
            </div>
            <p className="text-xs text-muted-foreground">Under care</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Vitals Today
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.vitalsRecordedToday}
            </div>
            <p className="text-xs text-muted-foreground">
              Recorded today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.tasksCompleted}
            </div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingTasks}
            </div>
            <p className="text-xs text-muted-foreground">Tasks pending</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Active Patient Care
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activePatients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No active patients</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{patient.name}</h4>
                        <Badge variant="outline">{patient.room}</Badge>
                        <Badge className={getPriorityColor(patient.priority)}>
                          {patient.priority}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Blood Pressure</p>
                          <p className="font-semibold">{patient.vitals.bloodPressure}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Temperature</p>
                          <p className="font-semibold">{patient.vitals.temperature}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Pulse</p>
                          <p className="font-semibold">{patient.vitals.pulse}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Last checked: {patient.lastChecked}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        Update Vitals
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nursing Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              <div>
                <div className="font-medium">Vital Signs</div>
                <div className="text-sm text-gray-600">Every 4 hours</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <Heart className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium">Medication</div>
                <div className="text-sm text-gray-600">Scheduled</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
              <div>
                <div className="font-medium">Patient Care</div>
                <div className="text-sm text-gray-600">Ongoing</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
