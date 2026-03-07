"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Filter,
  Calendar,
  Brain,
  Clock,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useTherapistClients, useUpdateTherapistClientSession } from "@/hooks/query/useTherapist";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";

export default function TherapistPatients() {
  useAuth();
  const { user } = useAuth();
  const { clinicId } = useClinicContext();

  // Extract therapist ID from user
  const therapistId = user?.id || "";

  // State for filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCondition, setFilterCondition] = useState("");

  // Fetch real data using hook
  const { data: clientsData, isPending: isPending } = useTherapistClients(therapistId, {
    search: searchQuery || undefined,
    status: filterStatus !== "all" ? filterStatus : undefined,
    condition: filterCondition || undefined,
  });

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Mutation
  const updateSessionMutation = useUpdateTherapistClientSession();

  // Extract clients array from response
  const clients = clientsData?.clients || [];

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-gray-600">
          Manage your patient records and therapy progress
        </p>
      </div>

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
                  setFilterCondition("");
                }}
              >
                All
              </Button>
              <Button
                variant={filterStatus === "active" ? "default" : "outline"}
                onClick={() => {
                  setFilterStatus("active");
                  setFilterCondition("");
                }}
              >
                Active
              </Button>
              <Button
                variant={filterStatus === "inactive" ? "default" : "outline"}
                onClick={() => {
                  setFilterStatus("inactive");
                  setFilterCondition("");
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
              {clients.map((client) => (
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
                        <h4 className="font-semibold">{client.name}</h4>
                        <p className="text-sm text-gray-600">{client.condition}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            {client.sessionsCompleted || 0} sessions
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last:{" "}
                            {new Date(client.lastVisit).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(client.status)}>
                      {client.status.toUpperCase()}
                    </Badge>
                    <div className="mt-2 flex gap-2">
                      <Button size="sm">
                        Notes
                      </Button>
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                    </div>
                    {client.status === "active" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          updateSessionMutation.mutate({
                            therapistId,
                            clientId: client.id,
                            sessionData: {
                              sessionDate: new Date().toISOString(),
                              notes: `Updated on ${new Date().toLocaleDateString("en-IN")}`,
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
