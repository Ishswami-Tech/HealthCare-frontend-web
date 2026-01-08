"use client";

import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/lib/config/config";
import { useAuth } from "@/hooks/useAuth";
import {
  usePrescriptions,
  useDispensePrescription,
  useUpdatePrescriptionStatus,
} from "@/hooks/usePharmacy";
import { useClinicContext } from "@/hooks/useClinic";
import { WebSocketStatusIndicator } from "@/components/websocket/WebSocketErrorBoundary";
import { useWebSocketQuerySync } from "@/hooks/useRealTimeQueries";
import {
  Pill,
  Clock,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Search,
  Eye,
  Check,
  Package,
  Timer,
} from "lucide-react";

export default function PrescriptionsPage() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  // Enable real-time WebSocket sync
  useWebSocketQuerySync();

  // Clinic context
  const { clinicId } = useClinicContext();

  // Fetch real prescriptions data
  const { data: prescriptionsData = [], isLoading: prescriptionsLoading } =
    usePrescriptions(clinicId || "", {
      status: filterStatus || undefined,
      limit: 100,
    });

  const dispensePrescription = useDispensePrescription();
  const updatePrescriptionStatus = useUpdatePrescriptionStatus();

  // Transform prescriptions data
  const prescriptions = prescriptionsData.map((p: any) => ({
    id: p.id,
    patientName: p.patient?.name || p.patientName || "Unknown Patient",
    doctorName: p.doctor?.name || p.doctorName || "Unknown Doctor",
    prescribedAt: p.prescribedAt || p.createdAt || new Date().toISOString(),
    medicines:
      p.medicines?.map((m: any) => ({
        name: m.name || m.medicineName,
        dosage: m.dosage || m.dosageInstructions,
        quantity: m.quantity || m.quantityPrescribed,
        available: m.available !== false,
      })) || [],
    status: p.status?.toLowerCase() || "pending",
    priority: p.priority?.toLowerCase() || "normal",
    estimatedTime: p.estimatedTime || "15 min",
    startedAt: p.startedAt,
    preparedAt: p.preparedAt,
  }));

  // Filter prescriptions
  const filteredPrescriptions = prescriptions.filter((p) => {
    const matchesSearch =
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.doctorName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      !filterStatus || p.status === filterStatus.toLowerCase();
    const matchesPriority =
      !filterPriority || p.priority === filterPriority.toLowerCase();
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Mock handover history (TODO: Add API endpoint for this)
  const handoverHistory = [
    {
      id: "RX001",
      patientName: "Rajesh Kumar",
      doctorName: "Dr. Priya Sharma",
      prescribedAt: "2025-08-08 10:30 AM",
      medicines: [
        {
          name: "Triphala Churna",
          dosage: "1 tsp twice daily",
          quantity: "100g",
          available: true,
        },
        {
          name: "Ashwagandha Capsules",
          dosage: "2 capsules daily",
          quantity: "60 caps",
          available: true,
        },
        {
          name: "Brahmi Ghrita",
          dosage: "1 tsp at bedtime",
          quantity: "200ml",
          available: false,
        },
      ],
      status: "pending",
      priority: "normal",
      estimatedTime: "15 min",
    },
    {
      id: "RX002",
      patientName: "Aarti Singh",
      doctorName: "Dr. Amit Patel",
      prescribedAt: "2025-08-08 11:15 AM",
      medicines: [
        {
          name: "Chyawanprash",
          dosage: "1 tbsp daily",
          quantity: "500g",
          available: true,
        },
        {
          name: "Arjuna Tablets",
          dosage: "2 tablets twice daily",
          quantity: "60 tabs",
          available: true,
        },
      ],
      status: "preparing",
      priority: "urgent",
      estimatedTime: "10 min",
      startedAt: "2025-08-08 11:45 AM",
    },
    {
      id: "RX003",
      patientName: "Vikram Gupta",
      doctorName: "Dr. Ravi Mehta",
      prescribedAt: "2025-08-08 12:00 PM",
      medicines: [
        {
          name: "Saraswatarishta",
          dosage: "15ml twice daily",
          quantity: "450ml",
          available: true,
        },
        {
          name: "Medhya Rasayana",
          dosage: "1 tablet daily",
          quantity: "30 tabs",
          available: true,
        },
      ],
      status: "prepared",
      priority: "normal",
      preparedAt: "2025-08-08 12:30 PM",
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "prepared":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "preparing":
        return <Timer className="w-4 h-4" />;
      case "prepared":
        return <Package className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const PrescriptionCard = ({
    prescription,
    showActions = true,
  }: {
    prescription: any;
    showActions?: boolean;
  }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {prescription.patientName}
              </h3>
              <p className="text-sm text-gray-600">{prescription.doctorName}</p>
              <p className="text-xs text-gray-500">ID: {prescription.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(prescription.priority)}>
              {prescription.priority}
            </Badge>
            <Badge
              className={`${getStatusColor(
                prescription.status
              )} flex items-center gap-1`}
            >
              {getStatusIcon(prescription.status)}
              {prescription.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>
              Prescribed: {new Date(prescription.prescribedAt).toLocaleString()}
            </span>
          </div>
          {prescription.estimatedTime && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Est. time: {prescription.estimatedTime}</span>
            </div>
          )}
          {prescription.startedAt && (
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-500" />
              <span>
                Started: {new Date(prescription.startedAt).toLocaleString()}
              </span>
            </div>
          )}
          {prescription.preparedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-gray-500" />
              <span>
                Prepared: {new Date(prescription.preparedAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h4 className="font-medium mb-2">
            Medicines ({prescription.medicines.length})
          </h4>
          <div className="space-y-2">
            {prescription.medicines.map((medicine: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{medicine.name}</span>
                    {!medicine.available && (
                      <Badge variant="destructive" className="text-xs">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{medicine.dosage}</p>
                </div>
                <span className="text-sm text-gray-500">
                  {medicine.quantity}
                </span>
              </div>
            ))}
          </div>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1"
            >
              <Eye className="w-3 h-3" />
              View Details
            </Button>
            {prescription.status === "pending" && (
              <Button size="sm" className="flex items-center gap-1">
                <Check className="w-3 h-3" />
                Start Preparing
              </Button>
            )}
            {prescription.status === "preparing" && (
              <Button size="sm" className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                Mark Prepared
              </Button>
            )}
            {prescription.status === "prepared" && (
              <Button size="sm" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Handover
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const sidebarLinks = getRoutesByRole(Role.PHARMACIST).map((route) => ({
    ...route,
    href: route.path,
  }));

  // Show loading state
  if (prescriptionsLoading) {
    return (
      <DashboardLayout title="Prescriptions" allowedRole={Role.PHARMACIST}>
        <GlobalSidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Pharmacist",
            ...(user?.profilePicture && { avatarUrl: user.profilePicture }),
          }}
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading prescriptions...</p>
            </div>
          </div>
        </GlobalSidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Prescriptions" allowedRole={Role.PHARMACIST}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Pharmacist",
          ...(user?.profilePicture && { avatarUrl: user.profilePicture }),
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Prescriptions</h1>
            <WebSocketStatusIndicator />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Prescription Management</h1>
              <p className="text-gray-600">
                Manage and track prescription preparation
              </p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search prescriptions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="preparing">Preparing</SelectItem>
                    <SelectItem value="prepared">Prepared</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Tabs */}
          <Tabs defaultValue="active" className="space-y-6">
            <TabsList>
              <TabsTrigger value="active">Active Prescriptions</TabsTrigger>
              <TabsTrigger value="history">Handover History</TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-4">
              {filteredPrescriptions.length > 0 ? (
                filteredPrescriptions.map((prescription) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                  />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No active prescriptions
                    </h3>
                    <p className="text-gray-500">
                      All prescriptions have been processed.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {handoverHistory.length > 0 ? (
                handoverHistory.map((item) => (
                  <Card
                    key={item.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {item.patientName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.doctorName}
                            </p>
                            <p className="text-xs text-gray-500">
                              ID: {item.id}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Handed over: {item.handedOverAt}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.medicines} medicines
                          </p>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      No handover history
                    </h3>
                    <p className="text-gray-500">
                      Completed prescriptions will appear here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
