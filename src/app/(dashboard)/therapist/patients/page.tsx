"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Users, Calendar, Brain, Loader2, } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTherapistClients, useUpdateTherapistClientSession } from "@/hooks/query/useTherapist";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { usePatientStore } from "@/stores";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";
import { formatDateInIST, nowIso } from '@/lib/utils/date-time';

export default function TherapistPatients() {
  useAuth();
  const { user } = useAuth();

  // Extract therapist ID from user
  const therapistId = user?.id || "";

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const clients = usePatientStore((state) => state.collections.therapist);

  // Fetch real data using hook
  const { isPending: isPending } = useTherapistClients(therapistId, {
    search: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
  });

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Mutation
  const updateSessionMutation = useUpdateTherapistClientSession();

  const safeDate = (value: unknown): Date | null => {
    if (typeof value !== "string" || !value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatLastVisit = (value: unknown): string => {
    const parsed = safeDate(value);
    return parsed ? formatDateInIST(parsed) : "N/A";
  };

  const getStatusValue = (value: unknown): string =>
    typeof value === "string" && value.trim().length > 0
      ? value.toLowerCase()
      : "inactive";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Therapist Clients"
        title="Clients"
        description="Manage therapy client records, session history, and progress from a shared clinical view."
        meta={
          <span className="text-sm font-medium text-muted-foreground">
            Total: {clients.length} clients
          </span>
        }
      />

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by client name or condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => {
                  setFilterStatus("all");
                }}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => {
                  setFilterStatus("active");
                }}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "default" : "outline"}
                onClick={() => {
                  setFilterStatus("inactive");
                }}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clients List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No clients found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => {
                const status = getStatusValue(client.status);
                return (
                  <div
                  key={client.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{client.name || "Unknown Client"}</h4>
                        <p className="text-sm text-gray-600">{client.condition || "N/A"}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {client.sessionsCompleted || 0} sessions
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last:{" "}
                            {formatLastVisit(client.lastVisit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Badge>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm">
                        Notes
                      </Button>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </div>
                    {status === "active" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateSessionMutation.mutate({
                            therapistId,
                            clientId: client.id,
                            sessionData: {
                              sessionDate: nowIso(),
                              notes: `Updated on ${formatDateInIST(new Date())}`,
                            },
                          })
                        }
                        disabled={updateSessionMutation.isPending}
                      >
                        Update Session
                      </Button>
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
