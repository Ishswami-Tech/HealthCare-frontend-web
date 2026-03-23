"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "@/components/ui/loader";
import {
  Activity,
  Thermometer,
  Heart,
  Search,
  Calendar,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useNursePatientVitals,
  useCreateNursePatientRecord,
  useUpdateNursePatientRecord,
} from "@/hooks/query/useNurse";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";

export default function NurseVitals() {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");

  const nurseId = user?.id;

  const { data: vitalsData, isPending } = useNursePatientVitals(nurseId);
  const createMutation = useCreateNursePatientRecord();
  const updateMutation = useUpdateNursePatientRecord();

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['nursePatientVitals', nurseId]]);

  const vitalsRecords = vitalsData?.vitals || [];

  const filteredRecords = vitalsRecords.filter((record: any) => {
    return record.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
            <Button className="flex items-center gap-2" disabled={createMutation.isPending}>
              <Activity className="w-4 h-4" />
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
                <div
                  key={record.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold">{record.patientName}</h4>
                        <span className="text-sm text-gray-500">
                          ({record.patientId})
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="p-3 bg-red-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-red-600" />
                            <span className="text-xs text-gray-600">BP</span>
                          </div>
                          <p className="font-semibold">
                            {record.bloodPressure?.systolic || 120}/
                            {record.bloodPressure?.diastolic || 80}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Thermometer className="w-4 h-4 text-orange-600" />
                            <span className="text-xs text-gray-600">Temp</span>
                          </div>
                          <p className="font-semibold">{record.temperature || 98.6}°F</p>
                        </div>
                        <div className="p-3 bg-pink-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Heart className="w-4 h-4 text-pink-600" />
                            <span className="text-xs text-gray-600">Pulse</span>
                          </div>
                          <p className="font-semibold">{record.pulse || 72} bpm</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-600">Resp</span>
                          </div>
                          <p className="font-semibold">
                            {record.respiratoryRate || 18}/min
                          </p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Activity className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">O2 Sat</span>
                          </div>
                          <p className="font-semibold">
                            {record.oxygenSaturation || 98}%
                          </p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="w-4 h-4 text-gray-600" />
                            <span className="text-xs text-gray-600">Time</span>
                          </div>
                          <p className="font-semibold">{record.time || "TBA"}</p>
                        </div>
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-600 mt-3 italic">
                          Notes: {record.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={updateMutation.isPending}
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Edit
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
