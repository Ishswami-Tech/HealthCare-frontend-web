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
  Calendar,
  MessageCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCounselorClients } from "@/hooks/query/useCounselor";
import { useWebSocketQuerySync } from "@/hooks/query/utils/use-websocket-query-sync";
import { usePatientStore } from "@/stores";
import { DashboardPageHeader, DashboardPageShell } from "@/components/dashboard/DashboardPageShell";

export default function CounselorPatients() {
  const { session } = useAuth();
  const user = session?.user;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const clients = usePatientStore((state) => state.collections.counselor);

  const counselorId = user?.id;

  const { isPending } = useCounselorClients(counselorId);

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync([['counselorClients', counselorId]]);

  const filteredClients = clients.filter((client: any) => {
    const matchesStatus =
      filterStatus === "all" || String(client.status).toLowerCase() === filterStatus;
    const matchesSearch =
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.condition?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

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

  if (isPending) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <DashboardPageShell>
      <DashboardPageHeader
        eyebrow="Counselor Clients"
        title="Clients"
        description="Review counseling clients, filter active caseloads, and manage follow-up context."
        meta={
          <span className="text-sm font-medium text-muted-foreground">
            Total: {clients.length} clients
          </span>
        }
      />

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
                variant={filterStatus === "inactive" ? "default" : "outline"}
                onClick={() => setFilterStatus("inactive")}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clients List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No clients found</p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client: any) => (
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
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{client.name}</h4>
                          <Badge className={getStatusColor(client.status)}>
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{client.condition}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>Sessions: {client.sessionsCompleted}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last:{" "}
                            {new Date(client.lastSession).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        Notes
                      </Button>
                      <Button variant="outline" size="sm">
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardPageShell>
  );
}
