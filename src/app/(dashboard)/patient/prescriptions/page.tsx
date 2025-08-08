"use client";
import React, { useState } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import GlobalSidebar from "@/components/global/GlobalSidebar/GlobalSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole } from "@/config/routes";
import { useAuth } from "@/hooks/useAuth";
import {
  Activity,
  Calendar,
  FileText,
  Pill,
  User,
  LogOut,
  Search,
  Filter,
  Download,
  RefreshCw,
  ShoppingCart,
  Clock,
  CheckCircle,
  Bell,
  Leaf,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Star,
  Eye,
} from "lucide-react";

export default function PatientPrescriptions() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Mock prescription data
  const prescriptions = [
    {
      id: "RX001",
      date: "2024-01-15",
      doctor: "Dr. Priya Sharma",
      status: "Active",
      medications: [
        {
          name: "Triphala Churna",
          dosage: "1 tsp twice daily",
          duration: "30 days",
          remaining: "22 days",
          instructions: "Take with warm water 30 min before meals",
          benefits: "Digestive health, detoxification",
          category: "Herbal Powder",
        },
        {
          name: "Ashwagandha Capsules",
          dosage: "2 capsules at bedtime",
          duration: "60 days",
          remaining: "52 days",
          instructions: "Take with warm milk for better absorption",
          benefits: "Stress reduction, improved sleep",
          category: "Herbal Supplement",
        },
        {
          name: "Brahmi Ghrita",
          dosage: "5 drops in each nostril",
          duration: "21 days",
          remaining: "14 days",
          instructions: "Use during morning pranayama practice",
          benefits: "Mental clarity, memory enhancement",
          category: "Medicated Oil",
        },
      ],
      totalCost: 2850,
      notes:
        "Continue yoga and meditation. Avoid cold foods and late night meals.",
      nextRefill: "2024-02-01",
      refillsRemaining: 2,
    },
    {
      id: "RX002",
      date: "2024-01-08",
      doctor: "Dr. Amit Singh",
      status: "Completed",
      medications: [
        {
          name: "Saraswatarishta",
          dosage: "15ml twice daily",
          duration: "45 days",
          remaining: "0 days",
          instructions: "Take after meals with equal amount of water",
          benefits: "Mental strength, nervous system support",
          category: "Herbal Tonic",
        },
        {
          name: "Jatamansi Churna",
          dosage: "1/2 tsp with honey",
          duration: "30 days",
          remaining: "0 days",
          instructions: "Take at bedtime for better sleep",
          benefits: "Calming, sleep quality improvement",
          category: "Herbal Powder",
        },
      ],
      totalCost: 1680,
      notes:
        "Treatment completed successfully. Continue lifestyle recommendations.",
      nextRefill: null,
      refillsRemaining: 0,
    },
    {
      id: "RX003",
      date: "2024-01-20",
      doctor: "Dr. Priya Sharma",
      status: "Pending",
      medications: [
        {
          name: "Mahasudarshan Churna",
          dosage: "1 tsp with warm water",
          duration: "14 days",
          remaining: "14 days",
          instructions: "Take on empty stomach in morning",
          benefits: "Immunity boost, fever management",
          category: "Herbal Medicine",
        },
        {
          name: "Yashtimadhu Churna",
          dosage: "1/2 tsp with milk",
          duration: "21 days",
          remaining: "21 days",
          instructions: "Take before bedtime",
          benefits: "Respiratory health, soothing effect",
          category: "Herbal Powder",
        },
      ],
      totalCost: 980,
      notes: "New prescription for seasonal immunity support.",
      nextRefill: "2024-02-10",
      refillsRemaining: 1,
    },
  ];

  // Mock pharmacy data
  const nearbyPharmacies = [
    {
      id: "PH001",
      name: "Ayurveda Plus Pharmacy",
      address: "123 Health Street, Mumbai, MH 400001",
      distance: "0.8 km",
      rating: 4.7,
      reviews: 234,
      phone: "+91 9876543210",
      deliveryTime: "30-45 mins",
      deliveryFee: 50,
      inStock: true,
    },
    {
      id: "PH002",
      name: "Herbal Care Center",
      address: "456 Wellness Road, Mumbai, MH 400002",
      distance: "1.2 km",
      rating: 4.5,
      reviews: 189,
      phone: "+91 9876543211",
      deliveryTime: "45-60 mins",
      deliveryFee: 30,
      inStock: true,
    },
    {
      id: "PH003",
      name: "Traditional Medicines Store",
      address: "789 Ayurveda Lane, Mumbai, MH 400003",
      distance: "2.1 km",
      rating: 4.6,
      reviews: 156,
      phone: "+91 9876543212",
      deliveryTime: "60-75 mins",
      deliveryFee: 40,
      inStock: false,
    },
  ];

  // Mock dosage reminders
  const dosageReminders = [
    {
      id: "1",
      medication: "Triphala Churna",
      time: "08:00 AM",
      dosage: "1 tsp",
      status: "Completed",
      date: "Today",
    },
    {
      id: "2",
      medication: "Ashwagandha Capsules",
      time: "10:00 PM",
      dosage: "2 capsules",
      status: "Pending",
      date: "Today",
    },
    {
      id: "3",
      medication: "Brahmi Ghrita",
      time: "06:30 AM",
      dosage: "5 drops each nostril",
      status: "Completed",
      date: "Today",
    },
    {
      id: "4",
      medication: "Triphala Churna",
      time: "08:00 PM",
      dosage: "1 tsp",
      status: "Upcoming",
      date: "Today",
    },
  ];

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesSearch =
      prescription.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medications.some((med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesStatus =
      statusFilter === "all" ||
      prescription.status.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReminderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "upcoming":
        return "bg-blue-100 text-blue-800";
      case "missed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleRefillRequest = (prescriptionId: string) => {
    console.log("Requesting refill for prescription:", prescriptionId);
  };

  const handleOrderFromPharmacy = (
    pharmacyId: string,
    prescriptionId: string
  ) => {
    console.log(
      "Ordering from pharmacy:",
      pharmacyId,
      "prescription:",
      prescriptionId
    );
  };

  const sidebarLinks = getRoutesByRole(Role.PATIENT).map((route) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("medical-records") ? (
      <FileText className="w-5 h-5" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <User className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="Prescriptions" allowedRole={Role.PATIENT}>
      <GlobalSidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name || `${user?.firstName} ${user?.lastName}` || "Patient",
          avatarUrl: user?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">My Prescriptions</h1>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refill Request
              </Button>
              <Button className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Order Medicine
              </Button>
            </div>
          </div>

          <Tabs defaultValue="prescriptions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="prescriptions">
                Current Prescriptions
              </TabsTrigger>
              <TabsTrigger value="reminders">Dosage Reminders</TabsTrigger>
              <TabsTrigger value="pharmacy">Nearby Pharmacies</TabsTrigger>
              <TabsTrigger value="history">Order History</TabsTrigger>
            </TabsList>

            <TabsContent value="prescriptions">
              <div className="space-y-4">
                {/* Search and Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          placeholder="Search prescriptions or medications..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border rounded-lg"
                        aria-label="Filter prescriptions by status"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Prescriptions List */}
                <div className="space-y-6">
                  {filteredPrescriptions.map((prescription) => (
                    <Card key={prescription.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold">
                              Prescription #{prescription.id}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Prescribed by {prescription.doctor} •{" "}
                              {new Date(prescription.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={getStatusColor(prescription.status)}
                            >
                              {prescription.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Medications */}
                          <div>
                            <h4 className="font-medium mb-3">
                              Prescribed Medicines:
                            </h4>
                            <div className="grid gap-3">
                              {prescription.medications.map(
                                (medication, index) => (
                                  <div
                                    key={index}
                                    className="p-4 bg-green-50 rounded-lg border border-green-200"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-3">
                                        <Leaf className="w-5 h-5 text-green-600 mt-1" />
                                        <div className="flex-1">
                                          <h5 className="font-semibold text-green-800">
                                            {medication.name}
                                          </h5>
                                          <p className="text-sm text-green-700 mb-1">
                                            {medication.dosage} •{" "}
                                            {medication.duration}
                                          </p>
                                          <p className="text-xs text-green-600 mb-2">
                                            {medication.instructions}
                                          </p>
                                          <div className="flex items-center gap-4 text-xs">
                                            <Badge
                                              variant="outline"
                                              className="bg-green-100 text-green-700"
                                            >
                                              {medication.category}
                                            </Badge>
                                            <span className="text-green-600">
                                              Benefits: {medication.benefits}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm font-medium text-green-800">
                                          {medication.remaining} remaining
                                        </p>
                                        {parseInt(medication.remaining) <= 5 &&
                                          parseInt(medication.remaining) >
                                            0 && (
                                            <Badge
                                              variant="outline"
                                              className="bg-yellow-50 text-yellow-700 mt-1"
                                            >
                                              Low Stock
                                            </Badge>
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Instructions and Notes */}
                          {prescription.notes && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <h5 className="font-medium text-blue-800 mb-1">
                                Doctor&apos;s Instructions:
                              </h5>
                              <p className="text-sm text-blue-700">
                                {prescription.notes}
                              </p>
                            </div>
                          )}

                          {/* Prescription Summary */}
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Total Cost:
                                </span>
                                <span className="font-semibold ml-2">
                                  ₹{prescription.totalCost}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  Refills Remaining:
                                </span>
                                <span className="font-semibold ml-2">
                                  {prescription.refillsRemaining}
                                </span>
                              </div>
                              {prescription.nextRefill && (
                                <div className="col-span-2">
                                  <span className="text-gray-600">
                                    Next Refill Due:
                                  </span>
                                  <span className="font-semibold ml-2">
                                    {new Date(
                                      prescription.nextRefill
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              {prescription.status === "Active" &&
                                prescription.refillsRemaining > 0 && (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleRefillRequest(prescription.id)
                                    }
                                  >
                                    <RefreshCw className="w-4 h-4 mr-1" />
                                    Refill
                                  </Button>
                                )}
                              <Button variant="outline" size="sm">
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reminders">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Today&apos;s Dosage Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dosageReminders.map((reminder) => (
                        <div
                          key={reminder.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              <Clock className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold">
                                {reminder.medication}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {reminder.dosage}
                              </p>
                              <p className="text-xs text-gray-500">
                                {reminder.time}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={getReminderStatusColor(
                                reminder.status
                              )}
                            >
                              {reminder.status}
                            </Badge>
                            {reminder.status === "Pending" && (
                              <Button size="sm">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Mark Taken
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Reminder Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">
                            Push Notifications
                          </Label>
                          <p className="text-sm text-gray-600">
                            Get notified when it&apos;s time to take your
                            medicine
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">SMS Reminders</Label>
                          <p className="text-sm text-gray-600">
                            Receive SMS alerts for important medications
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="font-medium">Smart Reminders</Label>
                          <p className="text-sm text-gray-600">
                            Adjust reminder timing based on your routine
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          className="rounded"
                          aria-label="Enable smart reminders"
                          title="Toggle smart reminders for medication timing"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pharmacy">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Nearby Ayurvedic Pharmacies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {nearbyPharmacies.map((pharmacy) => (
                        <div
                          key={pharmacy.id}
                          className="p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">
                                  {pharmacy.name}
                                </h3>
                                {!pharmacy.inStock && (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-50 text-red-700"
                                  >
                                    Limited Stock
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-1 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3" />
                                  <span>{pharmacy.address}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                    <span>{pharmacy.rating}</span>
                                    <span className="text-gray-400">
                                      ({pharmacy.reviews} reviews)
                                    </span>
                                  </div>
                                  <span>{pharmacy.distance} away</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <Truck className="w-3 h-3" />
                                    <span>
                                      Delivery: {pharmacy.deliveryTime}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    <span>Fee: ₹{pharmacy.deliveryFee}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button
                                size="sm"
                                disabled={!pharmacy.inStock}
                                onClick={() =>
                                  handleOrderFromPharmacy(pharmacy.id, "RX001")
                                }
                              >
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                Order Now
                              </Button>
                              <Button variant="outline" size="sm">
                                <Phone className="w-4 h-4 mr-1" />
                                Call
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Order History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Mock order history */}
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Order #ORD12345</h3>
                            <p className="text-sm text-gray-600">
                              Ayurveda Plus Pharmacy • Jan 20, 2024
                            </p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Delivered
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Items:</span>
                            <span className="ml-2">
                              Triphala Churna, Ashwagandha
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-semibold">₹1,450</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Delivered:</span>
                            <span className="ml-2">Jan 21, 2024</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reorder
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Invoice
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Order #ORD12344</h3>
                            <p className="text-sm text-gray-600">
                              Herbal Care Center • Jan 15, 2024
                            </p>
                          </div>
                          <Badge className="bg-blue-100 text-blue-800">
                            In Transit
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Items:</span>
                            <span className="ml-2">
                              Brahmi Ghrita, Saraswatarishta
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-semibold">₹980</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Expected:</span>
                            <span className="ml-2">Jan 22, 2024</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Truck className="w-3 h-3 mr-1" />
                            Track Order
                          </Button>
                          <Button variant="outline" size="sm">
                            <Phone className="w-3 h-3 mr-1" />
                            Contact Pharmacy
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <RefreshCw className="w-6 h-6" />
                  <span className="text-sm">Request Refill</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span className="text-sm">Order Medicine</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Bell className="w-6 h-6" />
                  <span className="text-sm">Set Reminder</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2"
                >
                  <Download className="w-6 h-6" />
                  <span className="text-sm">Download Prescription</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </GlobalSidebar>
    </DashboardLayout>
  );
}
