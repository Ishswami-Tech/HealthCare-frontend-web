"use client";

import { useState, useMemo } from "react";
import { Role } from "@/types/auth.types";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Sidebar from "@/components/global/GlobalSidebar/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getRoutesByRole } from "@/lib/config/routes";
import { useAuth } from "@/hooks/auth/useAuth";
import {
  useClinicContext,
  useClinicLocations,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
} from "@/hooks/query/useClinics";
import { ConnectionStatusIndicator as WebSocketStatusIndicator } from "@/components/common/StatusIndicator";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Activity,
  Users,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Clock,
  Building2,
  Search,
  Loader2,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

export default function ClinicLocationsPage() {
  const { session } = useAuth();
  const user = session?.user;
  const { clinicId } = useClinicContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch real locations data
  const { data: locationsData, isPending: isPendingLocations } =
    useClinicLocations(clinicId || "");

  // Sync with WebSocket for real-time updates
  useWebSocketQuerySync();

  // Mutations
  const createLocationMutation = useCreateClinicLocation();
  const updateLocationMutation = useUpdateClinicLocation();
  const deleteLocationMutation = useDeleteClinicLocation();

  // Extract locations array
  const locations = useMemo(() => {
    if (!locationsData) return [];
    const data = locationsData as any;
    return Array.isArray(data)
      ? data
      : Array.isArray(data?.locations)
      ? data.locations
      : Array.isArray(data?.data)
      ? data.data
      : [];
  }, [locationsData]);

  const filteredLocations = useMemo(() => {
    return locations.filter(
      (location: any) =>
        location.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  const [newLocation, setNewLocation] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    phone: "",
    email: "",
    timezone: "Asia/Kolkata",
    isActive: true,
    workingHours: {
      monday: { start: "09:00", end: "18:00" },
      tuesday: { start: "09:00", end: "18:00" },
      wednesday: { start: "09:00", end: "18:00" },
      thursday: { start: "09:00", end: "18:00" },
      friday: { start: "09:00", end: "18:00" },
      saturday: { start: "09:00", end: "15:00" },
      sunday: null,
    },
  });

  const handleCreateLocation = async () => {
    if (!clinicId) {
      showErrorToast("Clinic ID is required", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    try {
      createLocationMutation.mutate({
        clinicId,
        data: newLocation,
      });

      showSuccessToast("Location created successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
      setNewLocation({
        name: "",
        address: "",
        city: "",
        state: "",
        country: "India",
        zipCode: "",
        phone: "",
        email: "",
        timezone: "Asia/Kolkata",
        isActive: true,
        workingHours: {
          monday: { start: "09:00", end: "18:00" },
          tuesday: { start: "09:00", end: "18:00" },
          wednesday: { start: "09:00", end: "18:00" },
          thursday: { start: "09:00", end: "18:00" },
          friday: { start: "09:00", end: "18:00" },
          saturday: { start: "09:00", end: "15:00" },
          sunday: null,
        },
      });
      setIsCreateDialogOpen(false);
    } catch (error: any) {
      showErrorToast(error?.message || "Failed to create location", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  const handleEditLocation = (location: any) => {
    setSelectedLocation(location);
    setIsEditDialogOpen(true);
  };

  const handleUpdateLocation = async () => {
    if (!clinicId || !selectedLocation?.id) {
      showErrorToast("Clinic ID and Location ID are required", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    try {
      updateLocationMutation.mutate({
        clinicId,
        locationId: selectedLocation.id,
        data: selectedLocation,
      });

      showSuccessToast("Location updated successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
      setIsEditDialogOpen(false);
      setSelectedLocation(null);
    } catch (error) {
      showErrorToast("Failed to update location", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      console.error(error);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    if (!clinicId) {
      showErrorToast("Clinic ID is required", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      return;
    }

    setIsDeleting(true);
    try {
      deleteLocationMutation.mutate({
        clinicId,
        locationId,
      });

      showSuccessToast("Location deleted successfully", {
        id: TOAST_IDS.GLOBAL.SUCCESS,
      });
    } catch (error) {
      showErrorToast("Failed to delete location", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  const sidebarLinks = getRoutesByRole(Role.CLINIC_ADMIN).map((route: any) => {
    let icon = <Activity className="w-5 h-5" />;
    if (route.path.includes("dashboard")) {
      icon = <Activity className="w-5 h-5" />;
    } else if (route.path.includes("staff")) {
      icon = <Users className="w-5 h-5" />;
    } else if (route.path.includes("schedule")) {
      icon = <Calendar className="w-5 h-5" />;
    } else if (route.path.includes("settings")) {
      icon = <SettingsIcon className="w-5 h-5" />;
    }
    return {
      ...route,
      href: route.path,
      icon,
    };
  });

  sidebarLinks.push({
    label: "Logout",
    href: "/(auth)/auth/login",
    path: "/(auth)/auth/login",
    icon: <LogOut className="w-5 h-5" />,
  });

  if (isPendingLocations) {
    return (
      <DashboardLayout title="Clinic Locations" allowedRole={Role.CLINIC_ADMIN}>
        <Sidebar
          links={sidebarLinks}
          user={{
            name:
              user?.name ||
              `${user?.firstName} ${user?.lastName}` ||
              "Clinic Admin",
            avatarUrl: (user as any)?.profilePicture || "/avatar.png",
          }}
        >
          <div className="p-6 flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </Sidebar>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Clinic Locations" allowedRole={Role.CLINIC_ADMIN}>
      <Sidebar
        links={sidebarLinks}
        user={{
          name:
            user?.name ||
            `${user?.firstName} ${user?.lastName}` ||
            "Clinic Admin",
          avatarUrl: (user as any)?.profilePicture || "/avatar.png",
        }}
      >
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Clinic Locations</h1>
              <p className="text-gray-600 mt-1">
                Manage your clinic locations and branches
              </p>
            </div>
            <div className="flex items-center gap-2">
              <WebSocketStatusIndicator />
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Add Location
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Location</DialogTitle>
                    <DialogDescription>
                      Add a new clinic location or branch office
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Location Name *</Label>
                        <Input
                          id="name"
                          value={newLocation.name}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              name: e.target.value,
                            })
                          }
                          placeholder="Main Branch"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          value={newLocation.phone}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              phone: e.target.value,
                            })
                          }
                          placeholder="+91 9876543210"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        value={newLocation.address}
                        onChange={(e) =>
                          setNewLocation({
                            ...newLocation,
                            address: e.target.value,
                          })
                        }
                        placeholder="Street address"
                        rows={2}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          value={newLocation.city}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              city: e.target.value,
                            })
                          }
                          placeholder="Mumbai"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          value={newLocation.state}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              state: e.target.value,
                            })
                          }
                          placeholder="Maharashtra"
                        />
                      </div>
                      <div>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={newLocation.zipCode}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              zipCode: e.target.value,
                            })
                          }
                          placeholder="400001"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newLocation.email}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              email: e.target.value,
                            })
                          }
                          placeholder="location@clinic.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={newLocation.timezone}
                          onValueChange={(value) =>
                            setNewLocation({ ...newLocation, timezone: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">
                              Asia/Kolkata (IST)
                            </SelectItem>
                            <SelectItem value="Asia/Dubai">
                              Asia/Dubai (GST)
                            </SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Active Status</Label>
                      <Switch
                        checked={newLocation.isActive}
                        onCheckedChange={(checked) =>
                          setNewLocation({ ...newLocation, isActive: checked })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateLocation}
                      disabled={createLocationMutation.isPending}
                    >
                      {createLocationMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Location"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-4">
            {filteredLocations.map((location: any) => (
              <Card key={location.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <CardTitle className="text-xl">
                          {location.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          {location.address}, {location.city}, {location.state}{" "}
                          {location.zipCode}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={location.isActive ? "default" : "secondary"}
                      >
                        {location.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLocation(location)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteLocation(location.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{location.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{location.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{location.timezone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{location.country}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchTerm
                    ? "No locations found matching your search"
                    : "No locations added yet"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Location</DialogTitle>
                <DialogDescription>
                  Update location information
                </DialogDescription>
              </DialogHeader>
              {selectedLocation && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-name">Location Name *</Label>
                      <Input
                        id="edit-name"
                        value={selectedLocation.name}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone">Phone *</Label>
                      <Input
                        id="edit-phone"
                        value={selectedLocation.phone}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            phone: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-address">Address *</Label>
                    <Textarea
                      id="edit-address"
                      value={selectedLocation.address}
                      onChange={(e) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          address: e.target.value,
                        })
                      }
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="edit-city">City *</Label>
                      <Input
                        id="edit-city"
                        value={selectedLocation.city}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-state">State *</Label>
                      <Input
                        id="edit-state"
                        value={selectedLocation.state}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            state: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-zipCode">ZIP Code *</Label>
                      <Input
                        id="edit-zipCode"
                        value={selectedLocation.zipCode}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            zipCode: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={selectedLocation.email}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-timezone">Timezone</Label>
                      <Select
                        value={selectedLocation.timezone}
                        onValueChange={(value) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            timezone: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Kolkata">
                            Asia/Kolkata (IST)
                          </SelectItem>
                          <SelectItem value="Asia/Dubai">
                            Asia/Dubai (GST)
                          </SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Active Status</Label>
                    <Switch
                      checked={selectedLocation.isActive}
                      onCheckedChange={(checked) =>
                        setSelectedLocation({
                          ...selectedLocation,
                          isActive: checked,
                        })
                      }
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateLocation}
                  disabled={updateLocationMutation.isPending}
                >
                  {updateLocationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Location"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </Sidebar>
    </DashboardLayout>
  );
}
