"use client";

import { useCallback, useMemo, useReducer, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DataTable } from "@/components/ui/data-table";
import { TableSkeleton } from "@/components/dashboard/DashboardLoadingSkeletons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";

import { useAuth } from "@/hooks/auth/useAuth";
import {
  useClinicContext,
  useClinicLocations,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
} from "@/hooks/query/useClinics";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import {
  Plus,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  Ban,
  Stethoscope,
  Video,
  AlertTriangle,
  Search,
  Loader2,
} from "lucide-react";
import { showSuccessToast, showErrorToast, TOAST_IDS } from "@/hooks/utils/use-toast";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

type DayKey = (typeof DAYS)[number];
type WorkingHours = Record<DayKey, { start: string; end: string } | null>;
type LocationPermissions = {
  isOpdPaused: boolean;
  pauseReason: string;
  generalConsultationEnabled: boolean;
  videoConsultationEnabled: boolean;
  emergencyOnly: boolean;
};
type LocationFormState = {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  latitude: string;
  longitude: string;
  googlePlaceId: string;
  isActive: boolean;
  permissions: LocationPermissions;
  workingHours: WorkingHours;
};

type LocationRow = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  timezone: string;
  latitude: string;
  longitude: string;
  googlePlaceId: string;
  country: string;
  isActive: boolean;
  permissions: LocationPermissions;
  workingHours: unknown;
  raw: any;
};

const FORM_FIELD_CLASS = "gap-y-2";
const FORM_INPUT_CLASS = "h-10";
const TIME_INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-md border border-teal-200 bg-white px-3 text-sm font-medium leading-none tabular-nums shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-200/70 dark:border-teal-900/70 dark:bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-hour-field]:px-0.5 [&::-webkit-datetime-edit-minute-field]:px-0.5 [&::-webkit-datetime-edit-ampm-field]:px-1";
const TOOLBAR_CARD_CLASS = "rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20 sm:p-4";
const TABLE_CARD_CLASS = "rounded-xl border border-blue-200 bg-blue-50/70 p-3 shadow-sm dark:border-blue-900/70 dark:bg-blue-950/20 sm:p-4";

const DEFAULT_LOCATION_PERMISSIONS: LocationPermissions = {
  isOpdPaused: false,
  pauseReason: "",
  generalConsultationEnabled: true,
  videoConsultationEnabled: true,
  emergencyOnly: false,
};

const DAY_LABEL: Record<DayKey, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const DEFAULT_WORKING_HOURS: WorkingHours = {
  monday: { start: "09:00", end: "18:00" },
  tuesday: { start: "09:00", end: "18:00" },
  wednesday: { start: "09:00", end: "18:00" },
  thursday: { start: "09:00", end: "18:00" },
  friday: { start: "09:00", end: "18:00" },
  saturday: { start: "09:00", end: "15:00" },
  sunday: null,
};

function normalizeWorkingHours(value: unknown): WorkingHours {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Partial<WorkingHours>)
      : {};

  return DAYS.reduce((acc, day) => {
    const current = source[day];
    if (
      current &&
      typeof current === "object" &&
      typeof current.start === "string" &&
      typeof current.end === "string"
    ) {
      acc[day] = { start: current.start, end: current.end };
    } else if (current === null) {
      acc[day] = null;
    } else {
      acc[day] = DEFAULT_WORKING_HOURS[day];
    }
    return acc;
  }, {} as WorkingHours);
}

function workingHoursItems(value: unknown) {
  const hours = normalizeWorkingHours(value);
  return DAYS.map((day) => {
    const slot = hours[day];
    const label = day.charAt(0).toUpperCase() + day.slice(1, 3);
    return {
      day: label,
      time: slot ? `${slot.start}-${slot.end}` : "Closed",
      isClosed: !slot,
    };
  });
}

function workingHoursGroups(value: unknown) {
  const items = workingHoursItems(value);
  return items.reduce<Array<{ startDay: string; endDay: string; time: string; isClosed: boolean }>>(
    (groups, item) => {
      const current = groups[groups.length - 1];
      if (current && current.time === item.time && current.isClosed === item.isClosed) {
        current.endDay = item.day;
      } else {
        groups.push({
          startDay: item.day,
          endDay: item.day,
          time: item.time,
          isClosed: item.isClosed,
        });
      }
      return groups;
    },
    []
  );
}

function displayValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "Not added";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeLocationPermissions(location: unknown): LocationPermissions {
  const source = isRecord(location) ? location : {};
  const settings = isRecord(source.settings) ? source.settings : {};
  const controls = isRecord(settings.operationalControls)
    ? settings.operationalControls
    : isRecord(settings.opdControls)
    ? settings.opdControls
    : isRecord(source.permissions)
    ? source.permissions
    : {};

  return {
    isOpdPaused: Boolean(controls.isOpdPaused ?? controls.isPaused ?? DEFAULT_LOCATION_PERMISSIONS.isOpdPaused),
    pauseReason: typeof controls.pauseReason === "string" ? controls.pauseReason : DEFAULT_LOCATION_PERMISSIONS.pauseReason,
    generalConsultationEnabled: Boolean(controls.generalConsultationEnabled ?? DEFAULT_LOCATION_PERMISSIONS.generalConsultationEnabled),
    videoConsultationEnabled: Boolean(controls.videoConsultationEnabled ?? DEFAULT_LOCATION_PERMISSIONS.videoConsultationEnabled),
    emergencyOnly: Boolean(controls.emergencyOnly ?? DEFAULT_LOCATION_PERMISSIONS.emergencyOnly),
  };
}

function getGooglePlaceId(location: unknown) {
  const source = isRecord(location) ? location : {};
  const settings = isRecord(source.settings) ? source.settings : {};
  const value = source.googlePlaceId ?? settings.googlePlaceId ?? settings.googleMapsPlaceId;
  return typeof value === "string" ? value : "";
}

function buildLocationPayload<T extends object>(
  location: T
): Omit<T, "permissions" | "raw"> & { settings: Record<string, unknown> } {
  const source = { ...(location as Record<string, any>) };
  const permissions = source.permissions as LocationPermissions | undefined;
  const googlePlaceId = typeof source.googlePlaceId === "string" ? source.googlePlaceId.trim() : "";
  delete source.permissions;
  delete source.raw;
  delete source.googlePlaceId;
  if (source.latitude === "") {
    delete source.latitude;
  } else if (source.latitude !== undefined) {
    const latitude = Number(source.latitude);
    if (Number.isFinite(latitude)) {
      source.latitude = latitude;
    } else {
      delete source.latitude;
    }
  }
  if (source.longitude === "") {
    delete source.longitude;
  } else if (source.longitude !== undefined) {
    const longitude = Number(source.longitude);
    if (Number.isFinite(longitude)) {
      source.longitude = longitude;
    } else {
      delete source.longitude;
    }
  }
  const settings = isRecord(source.settings) ? source.settings : {};
  return ({
    ...source,
    settings: {
      ...settings,
      operationalControls: permissions ?? normalizeLocationPermissions(location),
      ...(googlePlaceId ? { googlePlaceId } : {}),
    },
  } as unknown) as Omit<T, "permissions" | "raw"> & { settings: Record<string, unknown> };
}

function formatAddress(location: LocationRow) {
  const cityState = [location.city, location.state].filter(Boolean).join(", ");
  const postal = [cityState, location.zipCode].filter(Boolean).join(" ");
  const parts = [location.address, postal].filter(Boolean);
  return parts.length ? parts.join(", ") : "Address not added";
}

function WorkingHoursTable({
  value,
  target,
  onToggleDay,
  onUpdateTime,
}: {
  value: unknown;
  target: "new" | "edit";
  onToggleDay: (target: "new" | "edit", day: DayKey, enabled: boolean) => void;
  onUpdateTime: (target: "new" | "edit", day: DayKey, field: "start" | "end", value: string) => void;
}) {
  const hours = normalizeWorkingHours(value);

  return (
    <div className="overflow-hidden rounded-lg border border-teal-200 bg-white/80 dark:border-teal-900/70 dark:bg-background/40">
      <Table>
        <TableHeader>
          <TableRow className="bg-teal-100/70 hover:bg-teal-100/70 dark:bg-teal-950/30 dark:hover:bg-teal-950/30">
            <TableHead className="w-[128px] px-3">Day</TableHead>
            <TableHead className="px-3">Hours</TableHead>
            <TableHead className="w-[72px] px-3 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DAYS.map((day) => {
            const slot = hours[day];
            return (
              <TableRow key={day} className="hover:bg-teal-50/70 dark:hover:bg-teal-950/20">
                <TableCell className="px-3 font-semibold">{DAY_LABEL[day]}</TableCell>
                <TableCell className="px-3">
                  {slot ? (
                    <div className="flex flex-wrap gap-2">
                      <div className="grid w-full grid-cols-1 gap-2 rounded-md border border-teal-200 bg-background p-2 dark:border-teal-900/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
                        <div className="min-w-0 gap-y-1">
                          <Label className="text-[11px] font-medium leading-none text-muted-foreground">
                            Start
                          </Label>
                          <Input
                            type="time"
                            className={TIME_INPUT_CLASS}
                            value={slot.start}
                            onChange={(event) => onUpdateTime(target, day, "start", event.target.value)}
                            aria-label={`${DAY_LABEL[day]} start time`}
                          />
                        </div>
                        <div className="min-w-0 gap-y-1">
                          <Label className="text-[11px] font-medium leading-none text-muted-foreground">
                            End
                          </Label>
                          <Input
                            type="time"
                            className={TIME_INPUT_CLASS}
                            value={slot.end}
                            onChange={(event) => onUpdateTime(target, day, "end", event.target.value)}
                            aria-label={`${DAY_LABEL[day]} end time`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-9 w-8 text-destructive"
                          onClick={() => onToggleDay(target, day, false)}
                          aria-label={`Close ${DAY_LABEL[day]}`}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex rounded-md bg-teal-100/70 px-2 py-1 text-xs text-teal-900 dark:bg-teal-950/40 dark:text-teal-200">
                      Closed
                    </span>
                  )}
                </TableCell>
                <TableCell className="px-3 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    onClick={() => onToggleDay(target, day, true)}
                    disabled={!!slot}
                    aria-label={`Open ${DAY_LABEL[day]}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ClinicLocationsPage() {
  useAuth();
  const { clinicId } = useClinicContext();
  type ClinicLocationsUiState = {
    searchTerm: string;
    isCreateDialogOpen: boolean;
    isEditDialogOpen: boolean;
    isDeleting: boolean;
  };

  type ClinicLocationsUiAction =
    | { type: "setSearchTerm"; value: string }
    | { type: "setIsCreateDialogOpen"; value: boolean }
    | { type: "setIsEditDialogOpen"; value: boolean }
    | { type: "setIsDeleting"; value: boolean };

  const [uiState, dispatchUi] = useReducer(
    (state: ClinicLocationsUiState, action: ClinicLocationsUiAction): ClinicLocationsUiState => {
      switch (action.type) {
        case "setSearchTerm":
          return { ...state, searchTerm: action.value };
        case "setIsCreateDialogOpen":
          return { ...state, isCreateDialogOpen: action.value };
        case "setIsEditDialogOpen":
          return { ...state, isEditDialogOpen: action.value };
        case "setIsDeleting":
          return { ...state, isDeleting: action.value };
        default:
          return state;
      }
    },
    {
      searchTerm: "",
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleting: false,
    }
  );
  const { searchTerm, isCreateDialogOpen, isEditDialogOpen, isDeleting } = uiState;
  const setSearchTerm = useCallback((value: string) => dispatchUi({ type: "setSearchTerm", value }), []);
  const setIsCreateDialogOpen = useCallback((value: boolean) => dispatchUi({ type: "setIsCreateDialogOpen", value }), []);
  const setIsEditDialogOpen = useCallback((value: boolean) => dispatchUi({ type: "setIsEditDialogOpen", value }), []);
  const setIsDeleting = useCallback((value: boolean) => dispatchUi({ type: "setIsDeleting", value }), []);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

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

  const [newLocation, setNewLocation] = useState<LocationFormState>({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    zipCode: "",
    phone: "",
    email: "",
    timezone: "Asia/Kolkata",
    latitude: "",
    longitude: "",
    googlePlaceId: "",
    isActive: true,
    permissions: DEFAULT_LOCATION_PERMISSIONS,
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

  const updateWorkingHours = (
    target: "new" | "edit",
    day: DayKey,
    field: "start" | "end",
    value: string
  ) => {
    if (target === "new") {
      const current = normalizeWorkingHours(newLocation.workingHours);
      setNewLocation({
        ...newLocation,
        workingHours: {
          ...current,
          [day]: {
            start: field === "start" ? value : current[day]?.start || "09:00",
            end: field === "end" ? value : current[day]?.end || "18:00",
          },
        },
      });
      return;
    }

    if (!selectedLocation) return;
    const current = normalizeWorkingHours(selectedLocation.workingHours);
    setSelectedLocation({
      ...selectedLocation,
      workingHours: {
        ...current,
        [day]: {
          start: field === "start" ? value : current[day]?.start || "09:00",
          end: field === "end" ? value : current[day]?.end || "18:00",
        },
      },
    });
  };

  const updatePermission = (
    target: "new" | "edit",
    key: keyof LocationPermissions,
    value: string | boolean
  ) => {
    if (target === "new") {
      setNewLocation({
        ...newLocation,
        permissions: {
          ...newLocation.permissions,
          [key]: value as never,
        },
      });
      return;
    }

    if (!selectedLocation) return;
    const currentPermissions = normalizeLocationPermissions(selectedLocation);
    setSelectedLocation({
      ...selectedLocation,
      permissions: {
        ...currentPermissions,
        [key]: value as never,
      },
    });
  };

  const toggleWorkingDay = (target: "new" | "edit", day: DayKey, enabled: boolean) => {
    if (target === "new") {
      const current = normalizeWorkingHours(newLocation.workingHours);
      setNewLocation({
        ...newLocation,
        workingHours: {
          ...current,
          [day]: enabled ? current[day] || { start: "09:00", end: "18:00" } : null,
        },
      });
      return;
    }

    if (!selectedLocation) return;
    const current = normalizeWorkingHours(selectedLocation.workingHours);
    setSelectedLocation({
      ...selectedLocation,
      workingHours: {
        ...current,
        [day]: enabled ? current[day] || { start: "09:00", end: "18:00" } : null,
      },
    });
  };

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
        data: buildLocationPayload(newLocation) as any,
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
        latitude: "",
        longitude: "",
        googlePlaceId: "",
        isActive: true,
        permissions: DEFAULT_LOCATION_PERMISSIONS,
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
    } catch (error: unknown) {
      showErrorToast(error instanceof Error ? error.message : "Failed to create location", {
        id: TOAST_IDS.GLOBAL.ERROR,
      });
    }
  };

  const handleEditLocation = useCallback((location: any) => {
    setSelectedLocation({
      ...location,
      latitude: location.latitude ?? "",
      longitude: location.longitude ?? "",
      googlePlaceId: getGooglePlaceId(location),
      permissions: normalizeLocationPermissions(location),
    });
    setIsEditDialogOpen(true);
  }, [setIsEditDialogOpen]);

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
        data: buildLocationPayload(selectedLocation) as any,
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

  const handleDeleteLocation = useCallback(async (locationId: string) => {
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
  }, [clinicId, deleteLocationMutation, setIsDeleting]);

  const locationRows = useMemo<LocationRow[]>(
    () =>
      filteredLocations.map((location: any) => ({
        id: location.id,
        name: location.name,
        address: location.address,
        city: location.city,
        state: location.state,
        zipCode: location.zipCode,
        phone: location.phone,
        email: location.email,
        timezone: location.timezone,
        latitude: location.latitude ?? "",
        longitude: location.longitude ?? "",
        googlePlaceId: getGooglePlaceId(location),
        country: location.country,
        isActive: location.isActive,
        permissions: normalizeLocationPermissions(location),
        workingHours: location.workingHours,
        raw: location,
      })),
    [filteredLocations]
  );

  const locationColumns = useMemo<ColumnDef<LocationRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Location",
        cell: ({ row }) => (
          <div className="flex w-[280px] flex-col gap-y-1.5">
            <div className="truncate font-semibold text-foreground">{displayValue(row.original.name)}</div>
            <div className="flex items-start gap-1.5 text-xs leading-5 text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2 whitespace-normal">{formatAddress(row.original)}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => (
          <div className="flex w-[128px] flex-col gap-y-1 text-xs">
            <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <span className="truncate">{displayValue(row.original.phone)}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
              <Mail className="size-3.5 shrink-0" />
              <span className="truncate">{displayValue(row.original.email)}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "default" : "secondary"} className="w-[64px] justify-center whitespace-nowrap px-2">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "permissions",
        header: "Permissions",
        cell: ({ row }) => {
          const permissions = row.original.permissions;
          const permissionItems = [
            { label: "OPD", enabled: !permissions.isOpdPaused, icon: Ban },
            { label: "General", enabled: permissions.generalConsultationEnabled, icon: Stethoscope },
            { label: "Video", enabled: permissions.videoConsultationEnabled, icon: Video },
            { label: "Emergency", enabled: permissions.emergencyOnly, icon: AlertTriangle },
          ];

          return (
            <div className="flex min-w-0 max-w-full flex-wrap content-start gap-1.5 whitespace-normal">
              {permissionItems.map((item) => {
                const Icon = item.icon;
                return (
                  <span
                    key={item.label}
                    className={
                      item.enabled
                        ? "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] leading-none text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
                        : "inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md border border-muted bg-muted/50 px-2 py-1 text-[11px] leading-none text-muted-foreground"
                    }
                  >
                    <Icon className="size-3" />
                    {item.label}
                  </span>
                );
              })}
            </div>
          );
        },
      },
      {
        accessorKey: "workingHours",
        header: "Working Hours",
        cell: ({ row }) => (
          <div className="flex min-w-0 max-w-full flex-wrap content-start gap-1.5 whitespace-normal">
            {workingHoursGroups(row.original.workingHours).map((item) => (
              <span
                key={`${item.startDay}-${item.endDay}-${item.time}`}
                className="inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] leading-none text-muted-foreground"
              >
                <span className="shrink-0 font-medium text-foreground">
                  {item.startDay === item.endDay ? item.startDay : `${item.startDay}-${item.endDay}`}
                </span>
                <span className={item.isClosed ? "text-muted-foreground" : "text-emerald-700 dark:text-emerald-400"}>
                  {item.time}
                </span>
              </span>
            ))}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex w-[84px] items-center justify-end gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => handleEditLocation(row.original.raw)} aria-label={`Edit ${row.original.name}`}>
              <Edit className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteLocation(row.original.id)} disabled={isDeleting} aria-label={`Delete ${row.original.name}`}>
              <Trash2 className="size-4 text-red-600" />
            </Button>
          </div>
        ),
      },
    ],
    [handleDeleteLocation, handleEditLocation, isDeleting]
  );

  if (isPendingLocations) {
    return (
      <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <PatientPageHeader
          eyebrow="Clinic Admin"
          title="Clinic Locations"
          description="Manage your clinic locations and branches"
        />
        <Card>
          <CardContent className="p-4">
            <TableSkeleton columns={["Location", "Contact", "Status", "Permissions", "Working Hours", "Actions"]} rows={4} />
          </CardContent>
        </Card>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
      <PatientPageHeader
        eyebrow="Clinic Admin"
        title="Clinic Locations"
        description="Manage your clinic locations and branches"
        meta={`${filteredLocations.length} of ${locations.length} locations`}
        actionsSlot={
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="h-9 rounded-lg px-4 text-sm font-semibold sm:h-10">
                <Plus className="size-4" />
                Add Location
              </Button>
            </DialogTrigger>
                <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] gap-0 overflow-y-auto border-teal-200 bg-teal-50 p-0 dark:border-teal-900/70 dark:bg-teal-950 sm:max-w-3xl">
                  <DialogHeader className="border-b border-teal-200 bg-white/70 px-4 pb-4 pt-5 dark:border-teal-900/70 dark:bg-background/40 sm:px-6">
                    <DialogTitle>Create New Location</DialogTitle>
                    <DialogDescription>
                      Add a new clinic location or branch office
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col gap-y-5 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="name">Location Name *</Label>
                        <Input
                          id="name"
                          className={FORM_INPUT_CLASS}
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
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          className={FORM_INPUT_CLASS}
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
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="address">Address *</Label>
                      <Textarea
                        id="address"
                        className="min-h-24"
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
                    <div className="gap-y-3 rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
                      <div>
                        <Label>Google Maps Validation</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Use coordinates and Google Place ID to validate the physical branch location.
                        </p>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className={FORM_FIELD_CLASS}>
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            className={FORM_INPUT_CLASS}
                            value={newLocation.latitude}
                            onChange={(e) => setNewLocation({ ...newLocation, latitude: e.target.value })}
                            placeholder="18.5204"
                          />
                        </div>
                        <div className={FORM_FIELD_CLASS}>
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            className={FORM_INPUT_CLASS}
                            value={newLocation.longitude}
                            onChange={(e) => setNewLocation({ ...newLocation, longitude: e.target.value })}
                            placeholder="73.8567"
                          />
                        </div>
                        <div className={FORM_FIELD_CLASS}>
                          <Label htmlFor="googlePlaceId">Google Place ID</Label>
                          <Input
                            id="googlePlaceId"
                            className={FORM_INPUT_CLASS}
                            value={newLocation.googlePlaceId}
                            onChange={(e) => setNewLocation({ ...newLocation, googlePlaceId: e.target.value })}
                            placeholder="ChIJ..."
                          />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          className={FORM_INPUT_CLASS}
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
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="state">State *</Label>
                        <Input
                          id="state"
                          className={FORM_INPUT_CLASS}
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
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="zipCode">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          className={FORM_INPUT_CLASS}
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
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          className={FORM_INPUT_CLASS}
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
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={newLocation.timezone}
                          onValueChange={(value) =>
                            setNewLocation({ ...newLocation, timezone: value })
                          }
                        >
                          <SelectTrigger className={FORM_INPUT_CLASS}>
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
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          className={FORM_INPUT_CLASS}
                          value={newLocation.country}
                          onChange={(e) =>
                            setNewLocation({
                              ...newLocation,
                              country: e.target.value,
                            })
                          }
                          placeholder="India"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
                      <Label>Active Status</Label>
                      <Switch
                        checked={newLocation.isActive}
                        onCheckedChange={(checked) =>
                          setNewLocation({ ...newLocation, isActive: checked })
                        }
                      />
                    </div>
                    <div className="gap-y-3 rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
                      <div>
                        <Label>Location Permissions</Label>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Control OPD and consultation availability for this branch.
                        </p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                          <Label className="text-sm">Pause OPD</Label>
                          <Switch checked={newLocation.permissions.isOpdPaused} onCheckedChange={(checked) => updatePermission("new", "isOpdPaused", checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                          <Label className="text-sm">General Consultation</Label>
                          <Switch checked={newLocation.permissions.generalConsultationEnabled} onCheckedChange={(checked) => updatePermission("new", "generalConsultationEnabled", checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                          <Label className="text-sm">Video Consultation</Label>
                          <Switch checked={newLocation.permissions.videoConsultationEnabled} onCheckedChange={(checked) => updatePermission("new", "videoConsultationEnabled", checked)} />
                        </div>
                        <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                          <Label className="text-sm">Emergency Only</Label>
                          <Switch checked={newLocation.permissions.emergencyOnly} onCheckedChange={(checked) => updatePermission("new", "emergencyOnly", checked)} />
                        </div>
                      </div>
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="pauseReason">Pause Reason</Label>
                        <Input
                          id="pauseReason"
                          className={FORM_INPUT_CLASS}
                          value={newLocation.permissions.pauseReason}
                          onChange={(e) => updatePermission("new", "pauseReason", e.target.value)}
                          placeholder="Optional reason shown to staff"
                        />
                      </div>
                    </div>
                    <div className="gap-y-3">
                      <Label>Working Hours</Label>
                      <WorkingHoursTable
                        value={newLocation.workingHours}
                        target="new"
                        onToggleDay={toggleWorkingDay}
                        onUpdateTime={updateWorkingHours}
                      />
                    </div>
                  </div>
                  <DialogFooter className="sticky bottom-0 border-t border-teal-200 bg-white/90 p-4 dark:border-teal-900/70 dark:bg-background/90 sm:px-6">
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
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Creating…
                        </>
                      ) : (
                        "Create Location"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
          </Dialog>
        }
      />

          <div className={TOOLBAR_CARD_CLASS}>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-10"
              />
            </div>
          </div>

          <div className={TABLE_CARD_CLASS}>
            <DataTable
              columns={locationColumns}
              data={locationRows}
              pageSize={10}
              compact
              tableClassName="table-auto"
              emptyMessage={searchTerm ? "No locations found matching your search" : "No locations added yet"}
              toolbar={
                <div className="px-1 text-sm font-medium text-blue-900 dark:text-blue-100">
                  Showing {filteredLocations.length} of {locations.length} locations
                </div>
              }
            />
          </div>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] gap-0 overflow-y-auto border-teal-200 bg-teal-50 p-0 dark:border-teal-900/70 dark:bg-teal-950 sm:max-w-3xl">
              <DialogHeader className="border-b border-teal-200 bg-white/70 px-4 pb-4 pt-5 dark:border-teal-900/70 dark:bg-background/40 sm:px-6">
                <DialogTitle>Edit Location</DialogTitle>
                <DialogDescription>
                  Update location information
                </DialogDescription>
              </DialogHeader>
              {selectedLocation && (
                <div className="gap-y-5 px-4 py-5 sm:px-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-name">Location Name *</Label>
                      <Input
                        id="edit-name"
                        className={FORM_INPUT_CLASS}
                        value={selectedLocation.name}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-phone">Phone *</Label>
                      <Input
                        id="edit-phone"
                        className={FORM_INPUT_CLASS}
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
                  <div className={FORM_FIELD_CLASS}>
                    <Label htmlFor="edit-address">Address *</Label>
                    <Textarea
                      id="edit-address"
                      className="min-h-24"
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
                  <div className="gap-y-3 rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
                    <div>
                      <Label>Google Maps Validation</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Use coordinates and Google Place ID to validate the physical branch location.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="edit-latitude">Latitude</Label>
                        <Input
                          id="edit-latitude"
                          className={FORM_INPUT_CLASS}
                          value={selectedLocation.latitude ?? ""}
                          onChange={(e) =>
                            setSelectedLocation({
                              ...selectedLocation,
                              latitude: e.target.value,
                            })
                          }
                          placeholder="18.5204"
                        />
                      </div>
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="edit-longitude">Longitude</Label>
                        <Input
                          id="edit-longitude"
                          className={FORM_INPUT_CLASS}
                          value={selectedLocation.longitude ?? ""}
                          onChange={(e) =>
                            setSelectedLocation({
                              ...selectedLocation,
                              longitude: e.target.value,
                            })
                          }
                          placeholder="73.8567"
                        />
                      </div>
                      <div className={FORM_FIELD_CLASS}>
                        <Label htmlFor="edit-googlePlaceId">Google Place ID</Label>
                        <Input
                          id="edit-googlePlaceId"
                          className={FORM_INPUT_CLASS}
                          value={selectedLocation.googlePlaceId ?? ""}
                          onChange={(e) =>
                            setSelectedLocation({
                              ...selectedLocation,
                              googlePlaceId: e.target.value,
                            })
                          }
                          placeholder="ChIJ..."
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-city">City *</Label>
                      <Input
                        id="edit-city"
                        className={FORM_INPUT_CLASS}
                        value={selectedLocation.city}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-state">State *</Label>
                      <Input
                        id="edit-state"
                        className={FORM_INPUT_CLASS}
                        value={selectedLocation.state}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            state: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-zipCode">ZIP Code *</Label>
                      <Input
                        id="edit-zipCode"
                        className={FORM_INPUT_CLASS}
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
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-email">Email *</Label>
                      <Input
                        id="edit-email"
                        className={FORM_INPUT_CLASS}
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
                    <div className={FORM_FIELD_CLASS}>
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
                        <SelectTrigger className={FORM_INPUT_CLASS}>
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
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-country">Country</Label>
                      <Input
                        id="edit-country"
                        className={FORM_INPUT_CLASS}
                        value={selectedLocation.country}
                        onChange={(e) =>
                          setSelectedLocation({
                            ...selectedLocation,
                            country: e.target.value,
                          })
                        }
                        placeholder="India"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
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
                  <div className="gap-y-3 rounded-lg border border-teal-200 bg-white/80 p-3 dark:border-teal-900/70 dark:bg-background/40">
                    <div>
                      <Label>Location Permissions</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Control OPD and consultation availability for this branch.
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                        <Label className="text-sm">Pause OPD</Label>
                        <Switch checked={normalizeLocationPermissions(selectedLocation).isOpdPaused} onCheckedChange={(checked) => updatePermission("edit", "isOpdPaused", checked)} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                        <Label className="text-sm">General Consultation</Label>
                        <Switch checked={normalizeLocationPermissions(selectedLocation).generalConsultationEnabled} onCheckedChange={(checked) => updatePermission("edit", "generalConsultationEnabled", checked)} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                        <Label className="text-sm">Video Consultation</Label>
                        <Switch checked={normalizeLocationPermissions(selectedLocation).videoConsultationEnabled} onCheckedChange={(checked) => updatePermission("edit", "videoConsultationEnabled", checked)} />
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-teal-100 bg-teal-50/60 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-950/20">
                        <Label className="text-sm">Emergency Only</Label>
                        <Switch checked={normalizeLocationPermissions(selectedLocation).emergencyOnly} onCheckedChange={(checked) => updatePermission("edit", "emergencyOnly", checked)} />
                      </div>
                    </div>
                    <div className={FORM_FIELD_CLASS}>
                      <Label htmlFor="edit-pauseReason">Pause Reason</Label>
                      <Input
                        id="edit-pauseReason"
                        className={FORM_INPUT_CLASS}
                        value={normalizeLocationPermissions(selectedLocation).pauseReason}
                        onChange={(e) => updatePermission("edit", "pauseReason", e.target.value)}
                        placeholder="Optional reason shown to staff"
                      />
                    </div>
                  </div>
                  <div className="gap-y-3">
                    <Label>Working Hours</Label>
                    <WorkingHoursTable
                      value={selectedLocation.workingHours}
                      target="edit"
                      onToggleDay={toggleWorkingDay}
                      onUpdateTime={updateWorkingHours}
                    />
                  </div>
                </div>
              )}
              <DialogFooter className="sticky bottom-0 border-t border-teal-200 bg-white/90 p-4 dark:border-teal-900/70 dark:bg-background/90 sm:px-6">
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
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    "Update Location"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
    </PatientPageShell>
    
  );
}





