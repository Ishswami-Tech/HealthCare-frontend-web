"use client";

import { useState } from "react";
import { Role } from "@/types/auth.types";
import { Permission } from "@/types/rbac.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoutesByRole, ROUTES } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useMedicines,
  usePrescriptions,
  useInventory,
  usePharmacyStats,
} from "@/hooks/query/usePharmacy";
import { useClinicContext } from "@/hooks/query/useClinics";
import { usePharmacyPermissions } from "@/hooks/utils/useRBAC";
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Package,
  Droplets,
  Leaf,
  Sun,
  Moon,
  LogOut,
  Activity,
  Calendar,
  FileText,
  Users,
  Building2,
  Settings,
  Filter,
  User,
  ShoppingCart,
  Eye,
  Edit,
  Truck,
  Download,
  MapPin,
  Star,
  Clock,
  Phone,
  BarChart3,
  CreditCard,
} from "lucide-react";

export default function PharmacySystem() {
  const { session } = useAuth();
  const user = session?.user;
  const [searchTerm, setSearchTerm] = useState("");

  // Determine user role and setup appropriate sidebar
  const userRole = (user?.role as Role) || Role.DOCTOR;

  // RBAC permissions
  const pharmacyPermissions = usePharmacyPermissions();

  // Clinic context
  const { clinicId } = useClinicContext();


  // Fetch medicines data with proper permissions using clinic-aware approach
  const {
    data: medicines,
    isPending: medicinesLoading,
    error: medicinesError,
    refetch: refetchMedicines,
  } = useMedicines(clinicId || "", {
    search: searchTerm,
    limit: 50,
  });

  // Fetch prescriptions
  const { data: prescriptions } =
    usePrescriptions(clinicId || "", {
      limit: 20,
      enabled: !!clinicId && pharmacyPermissions.canManagePrescriptions,
    });

  // Fetch inventory data
  useInventory(
    clinicId || "",
    {
      lowStock: true,
      expiringSoon: true,
      enabled: !!clinicId && pharmacyPermissions.canManageInventory,
    }
  );

  // Fetch pharmacy statistics
  const { data: realPharmacyStats } = usePharmacyStats(clinicId || "", "day");



  // Calculate pharmacy stats from real data
  const pharmacyStats = {
    totalMedicines: (medicines as any)?.length || 0,
    inStock:
      (medicines as any)?.filter((med: any) => med.stockQuantity > med.minStockLevel)
        ?.length || 0,
    lowStock:
      (medicines as any)?.filter(
        (med: any) => med.stockQuantity <= med.minStockLevel && med.stockQuantity > 0
      )?.length || 0,
    outOfStock: (medicines as any)?.filter((med: any) => med.stockQuantity === 0)?.length || 0,
    todaysOrders:
      (prescriptions as any)?.filter((p: any) => {
        const today = new Date().toDateString();
        const prescDate = new Date(p.createdAt).toDateString();
        return today === prescDate;
      })?.length || 0,
    pendingDeliveries:
      (prescriptions as any)?.filter((p: any) => p.status === "PENDING")?.length || 0,
    totalRevenue: (realPharmacyStats as any)?.totalRevenue || 0,
    topSelling: (realPharmacyStats as any)?.topSellingMedicine || "N/A",
  };





  // Show loading state
  if (medicinesLoading) {
    return (
      <DashboardLayout
        title="Pharmacy Management System"
        requiredPermission={Permission.VIEW_PATIENTS}
        showPermissionWarnings={true}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pharmacy system...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Show error state
  if (medicinesError) {
    return (
      <DashboardLayout
        title="Pharmacy Management System"
        requiredPermission={Permission.VIEW_PATIENTS}
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-600">
              Error loading pharmacy data: {medicinesError.message}
            </p>
            <Button onClick={() => refetchMedicines()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Transform medicines data for display
  const ayurvedicMedicines = (medicines as any)?.slice(0, 10)?.map((medicine: any) => ({
    id: medicine.id,
    name: medicine.name,
    category: medicine.category,
    manufacturer: medicine.manufacturer,
    stock: medicine.stockQuantity,
    minStock: medicine.minStockLevel,
    price: medicine.unitPrice,
    unit: medicine.packSize + " " + medicine.dosageForm,
    status:
      medicine.stockQuantity > medicine.minStockLevel
        ? "In Stock"
        : medicine.stockQuantity > 0
        ? "Low Stock"
        : "Out of Stock",
    benefits: medicine.description || "Ayurvedic medicine",
    dosage: medicine.strength || "As prescribed",
    expiryDate: medicine.expiryDate || "N/A",
  })) || [
    // Fallback data if no medicines loaded
    {
      id: "MED001",
      name: "Triphala Churna",
      category: "Digestive Health",
      manufacturer: "Himalaya Wellness",
      stock: 450,
      minStock: 100,
      price: 180,
      unit: "100g",
      status: "In Stock",
      benefits: "Digestive health, detoxification",
      dosage: "1-2 tsp twice daily",
      expiryDate: "2025-06-15",
    },
    {
      id: "MED002",
      name: "Ashwagandha Capsules",
      category: "Stress & Immunity",
      manufacturer: "Patanjali Ayurved",
      stock: 25,
      minStock: 50,
      price: 320,
      unit: "60 capsules",
      status: "Low Stock",
      benefits: "Stress relief, improved energy",
      dosage: "1-2 capsules daily",
      expiryDate: "2025-03-20",
    },
    {
      id: "MED003",
      name: "Brahmi Ghrita",
      category: "Mental Wellness",
      manufacturer: "Kerala Ayurveda",
      stock: 0,
      minStock: 20,
      price: 450,
      unit: "50ml",
      status: "Out of Stock",
      benefits: "Memory enhancement, mental clarity",
      dosage: "5 drops each nostril",
      expiryDate: "2024-12-30",
    },
    {
      id: "MED004",
      name: "Saraswatarishta",
      category: "Mental Wellness",
      manufacturer: "Baidyanath",
      stock: 180,
      minStock: 30,
      price: 240,
      unit: "450ml",
      status: "In Stock",
      benefits: "Mental strength, memory support",
      dosage: "15ml twice daily after meals",
      expiryDate: "2025-08-10",
    },
  ];

  const recentOrders = [
    {
      id: "ORD001",
      patient: "Rajesh Kumar",
      items: ["Triphala Churna", "Ashwagandha Capsules"],
      total: 500,
      status: "Delivered",
      orderDate: "2024-01-15",
      deliveryDate: "2024-01-16",
      pharmacy: "Ayurveda Plus Pharmacy",
    },
    {
      id: "ORD002",
      patient: "Priya Sharma",
      items: ["Brahmi Ghrita", "Saraswatarishta"],
      total: 690,
      status: "Processing",
      orderDate: "2024-01-15",
      expectedDelivery: "2024-01-17",
      pharmacy: "Herbal Care Center",
    },
    {
      id: "ORD003",
      patient: "Amit Singh",
      items: ["Mahasudarshan Churna"],
      total: 180,
      status: "Shipped",
      orderDate: "2024-01-14",
      trackingId: "TRK123456789",
      pharmacy: "Traditional Medicines Store",
    },
  ];

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
      specialties: ["Panchakarma medicines", "Herbal powders"],
      isPartner: true,
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
      specialties: ["Ayurvedic oils", "Classical formulations"],
      isPartner: true,
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
      specialties: ["Traditional herbs", "Custom formulations"],
      isPartner: false,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "in stock":
        return "bg-green-100 text-green-800";
      case "low stock":
        return "bg-yellow-100 text-yellow-800";
      case "out of stock":
        return "bg-red-100 text-red-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "digestive health":
        return <Droplets className="w-4 h-4 text-blue-600" />;
      case "stress & immunity":
        return <Leaf className="w-4 h-4 text-green-600" />;
      case "mental wellness":
        return <Sun className="w-4 h-4 text-yellow-600" />;
      case "respiratory":
        return <Moon className="w-4 h-4 text-purple-600" />;
      default:
        return <Pill className="w-4 h-4 text-gray-600" />;
    }
  };

  const sidebarLinks = getRoutesByRole(userRole).map((route: any) => ({
    ...route,
    href: route.path,
    icon: route.path.includes("dashboard") ? (
      <Activity className="w-5 h-5" />
    ) : route.path.includes("appointments") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("patients") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("medical-records") ? (
      <FileText className="w-5 h-5" />
    ) : route.path.includes("prescriptions") ? (
      <Pill className="w-5 h-5" />
    ) : route.path.includes("profile") ? (
      <User className="w-5 h-5" />
    ) : route.path.includes("clinics") ? (
      <Building2 className="w-5 h-5" />
    ) : route.path.includes("users") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("staff") ? (
      <Users className="w-5 h-5" />
    ) : route.path.includes("schedule") ? (
      <Calendar className="w-5 h-5" />
    ) : route.path.includes("settings") ? (
      <Settings className="w-5 h-5" />
    ) : (
      <Activity className="w-5 h-5" />
    ),
  }));

  // Add Pharmacy link to sidebar
  sidebarLinks.push({
    label: "Pharmacy System",
    href: ROUTES.SHARED_PHARMACY,
    path: ROUTES.SHARED_PHARMACY,
    icon: <Pill className="w-5 h-5" />,
  });

  sidebarLinks.push({
    label: "Logout",
    href: ROUTES.LOGIN,
    path: ROUTES.LOGIN,
    icon: <LogOut className="w-5 h-5" />,
  });

  return (
    <DashboardLayout title="Pharmacy Management" allowedRole={userRole}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Healthcare Professional",
          ...(user?.profilePicture && { avatarUrl: user.profilePicture }),
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Pharmacy Management System</h1>
              <p className="text-gray-600">
                Ayurvedic medicines inventory and order management
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Restock Alert
              </Button>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Medicine
              </Button>
            </div>
          </div>

          {/* Pharmacy Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Medicines
                </CardTitle>
                <Pill className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {pharmacyStats.totalMedicines.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">In inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {pharmacyStats.inStock.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Available medicines
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {pharmacyStats.lowStock}
                </div>
                <p className="text-xs text-muted-foreground">Need restocking</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Today's Orders
                </CardTitle>
                <ShoppingCart className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {pharmacyStats.todaysOrders}
                </div>
                <p className="text-xs text-muted-foreground">Orders placed</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="inventory" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="inventory">Medicine Inventory</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="pharmacies">Partner Pharmacies</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="inventory">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Ayurvedic Medicine Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <Input
                          placeholder="Search medicines by name, category, or manufacturer..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                      </Button>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Medicine
                      </Button>
                    </div>

                    <div className="grid gap-4">
                      {ayurvedicMedicines?.map((medicine: any) => (
                        <div
                          key={medicine.id}
                          className="p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                {getCategoryIcon(medicine.category)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-semibold text-lg">
                                    {medicine.name}
                                  </h3>
                                  <Badge
                                    className={getStatusColor(medicine.status)}
                                  >
                                    {medicine.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Category:</p>
                                    <p className="font-medium">
                                      {medicine.category}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">
                                      Manufacturer:
                                    </p>
                                    <p className="font-medium">
                                      {medicine.manufacturer}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Stock:</p>
                                    <p
                                      className={`font-medium ${
                                        medicine.stock <= medicine.minStock
                                          ? "text-red-600"
                                          : "text-green-600"
                                      }`}
                                    >
                                      {medicine.stock} {medicine.unit}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-gray-600">Price:</p>
                                    <p className="font-medium">
                                      ₹{medicine.price}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <p className="text-green-700">
                                        <strong>Benefits:</strong>{" "}
                                        {medicine.benefits}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-green-700">
                                        <strong>Dosage:</strong>{" "}
                                        {medicine.dosage}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                              <Button variant="outline" size="sm">
                                <Eye className="w-3 h-3 mr-1" />
                                View
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button variant="outline" size="sm">
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Order
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        Showing {ayurvedicMedicines.length} of{" "}
                        {pharmacyStats.totalMedicines.toLocaleString()}{" "}
                        medicines
                      </span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Previous
                        </Button>
                        <Button variant="outline" size="sm">
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Recent Orders & Deliveries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order: any) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">Order #{order.id}</h3>
                            <p className="text-sm text-gray-600">
                              Patient: {order.patient}
                            </p>
                            <p className="text-sm text-gray-600">
                              Pharmacy: {order.pharmacy}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                            <p className="text-sm font-semibold mt-1">
                              ₹{order.total}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Items:</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {order.items.map((item: string, index: number) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="bg-green-50 text-green-700"
                                >
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Order Date:</span>
                              <span className="ml-2 font-medium">
                                {order.orderDate}
                              </span>
                            </div>
                            {order.deliveryDate && (
                              <div>
                                <span className="text-gray-600">
                                  Delivered:
                                </span>
                                <span className="ml-2 font-medium text-green-600">
                                  {order.deliveryDate}
                                </span>
                              </div>
                            )}
                            {order.expectedDelivery && (
                              <div>
                                <span className="text-gray-600">Expected:</span>
                                <span className="ml-2 font-medium">
                                  {order.expectedDelivery}
                                </span>
                              </div>
                            )}
                            {order.trackingId && (
                              <div>
                                <span className="text-gray-600">Tracking:</span>
                                <span className="ml-2 font-medium">
                                  {order.trackingId}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button variant="outline" size="sm">
                            <Eye className="w-3 h-3 mr-1" />
                            View Details
                          </Button>
                          {order.status === "Shipped" && (
                            <Button variant="outline" size="sm">
                              <Truck className="w-3 h-3 mr-1" />
                              Track Order
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Download className="w-3 h-3 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pharmacies">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Partner Pharmacies Network
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {nearbyPharmacies.map((pharmacy: any) => (
                      <div
                        key={pharmacy.id}
                        className="p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {pharmacy.name}
                              </h3>
                              {pharmacy.isPartner && (
                                <Badge className="bg-green-100 text-green-800">
                                  Partner
                                </Badge>
                              )}
                            </div>

                            <div className="space-y-2 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span>{pharmacy.address}</span>
                                <span className="text-blue-600">
                                  ({pharmacy.distance})
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                                  <span>{pharmacy.rating}</span>
                                  <span className="text-gray-400">
                                    ({pharmacy.reviews} reviews)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{pharmacy.deliveryTime}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Truck className="w-3 h-3" />
                                  <span>₹{pharmacy.deliveryFee} delivery</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium mb-1">
                                Specialties:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {pharmacy.specialties.map(
                                  (specialty: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="bg-blue-50 text-blue-700"
                                    >
                                      {specialty}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 ml-4">
                            <Button size="sm">
                              <ShoppingCart className="w-3 h-3 mr-1" />
                              Order
                            </Button>
                            <Button variant="outline" size="sm">
                              <Phone className="w-3 h-3 mr-1" />
                              Call
                            </Button>
                            <Button variant="outline" size="sm">
                              <Eye className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Pharmacy Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="p-4 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ₹{pharmacyStats.totalRevenue.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-700">
                          Total Revenue
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          This month
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {pharmacyStats.todaysOrders}
                        </div>
                        <div className="text-sm text-blue-700">
                          Orders Today
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          +12% from yesterday
                        </div>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {pharmacyStats.pendingDeliveries}
                        </div>
                        <div className="text-sm text-purple-700">
                          Pending Deliveries
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          In transit
                        </div>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-lg text-center">
                        <div className="text-lg font-bold text-orange-600">
                          {pharmacyStats.topSelling}
                        </div>
                        <div className="text-sm text-orange-700">
                          Top Selling
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                          Most popular medicine
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Category Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-600" />
                            Digestive Health
                          </span>
                          <span className="font-semibold">35%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Leaf className="w-4 h-4 text-green-600" />
                            Stress & Immunity
                          </span>
                          <span className="font-semibold">28%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Sun className="w-4 h-4 text-yellow-600" />
                            Mental Wellness
                          </span>
                          <span className="font-semibold">22%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Moon className="w-4 h-4 text-purple-600" />
                            Respiratory
                          </span>
                          <span className="font-semibold">15%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Monthly Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-8 text-gray-500">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">
                          Detailed Analytics Coming Soon
                        </h3>
                        <p className="text-sm">
                          Sales trends, demand forecasting, and inventory
                          optimization insights.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Pharmacy System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-4">
                        Inventory Management
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center gap-2"
                        >
                          <AlertTriangle className="w-6 h-6" />
                          <span className="text-sm">Stock Alert Settings</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center gap-2"
                        >
                          <Package className="w-6 h-6" />
                          <span className="text-sm">Auto Reorder Settings</span>
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Delivery & Orders</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center gap-2"
                        >
                          <Truck className="w-6 h-6" />
                          <span className="text-sm">Delivery Settings</span>
                        </Button>
                        <Button
                          variant="outline"
                          className="h-16 flex flex-col items-center justify-center gap-2"
                        >
                          <CreditCard className="w-6 h-6" />
                          <span className="text-sm">Payment Gateway</span>
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold mb-2">System Information</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Pharmacy System Version:</span>
                          <span>v1.8.2</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Partner Pharmacies:</span>
                          <span>
                            {nearbyPharmacies.filter((p) => p.isPartner).length}{" "}
                            active
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Inventory Sync:</span>
                          <span>January 15, 2024 - 09:30 AM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Medicine Database:</span>
                          <span className="text-green-600">✓ Updated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
