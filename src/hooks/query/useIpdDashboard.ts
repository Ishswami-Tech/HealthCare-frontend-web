"use client";

import { useQueryData } from "@/hooks/core/useQueryData";
import { useMutationOperation } from "@/hooks/core/useMutationOperation";
import { useWebSocketStatus } from "@/app/providers/WebSocketProvider";
import { API_ENDPOINTS } from "@/lib/config/config";
import { TOAST_IDS } from "@/hooks/utils/use-toast";
import {
  getActiveAdmissions,
  getBeds,
  getWards,
  getOccupancyStats,
  dischargePatient,
  updateBedStatus,
  createAdmission,
  transferBed,
} from "@/lib/actions/ipd.server";

export type Admission = {
  id: string;
  patientId: string;
  bedId: string;
  wardId: string;
  admittingDoctorId: string;
  admissionDate: string;
  status: string;
};

export type Bed = {
  id: string;
  bedNumber: string;
  bedType: string;
  wardId: string;
  status: string;
  floor?: number;
};

export type Ward = {
  id: string;
  name: string;
  wardType: string;
  capacity: number;
  currentOccupancy: number;
};

export function useIpdDashboardData() {
  const { isConnected } = useWebSocketStatus();

  const admissionsQuery = useQueryData<Admission[]>(
    ["ipd", "admissions"],
    async () => (await getActiveAdmissions()) as Admission[],
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const bedsQuery = useQueryData<Bed[]>(
    ["ipd", "beds"],
    async () => (await getBeds()) as Bed[],
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const wardsQuery = useQueryData<Ward[]>(
    ["ipd", "wards"],
    async () => (await getWards()) as Ward[],
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const occupancyQuery = useQueryData<{ total: number; occupied: number; available: number } | null>(
    ["ipd", "occupancy"],
    async (): Promise<{ total: number; occupied: number; available: number } | null> =>
      (await getOccupancyStats()) as { total: number; occupied: number; available: number } | null,
    { refetchInterval: isConnected ? false : 120_000 }
  );

  const createAdmissionMutation = useMutationOperation(createAdmission, {
    toastId: TOAST_IDS.APPOINTMENT.CREATE,
    loadingMessage: "Creating admission...",
    successMessage: "Admission created",
    errorMessage: "Failed to create admission",
    showToast: true,
    invalidateQueries: [["ipd", "admissions"], ["ipd", "occupancy"]],
  });

  const transferMutation = useMutationOperation((args: { admissionId: string; newBedId: string }) =>
      transferBed(args.admissionId, args.newBedId),
    {
    toastId: TOAST_IDS.APPOINTMENT.UPDATE,
    loadingMessage: "Transferring bed...",
    successMessage: "Bed transferred",
    errorMessage: "Failed to transfer bed",
    showToast: true,
    invalidateQueries: [["ipd", "admissions"], ["ipd", "beds"], ["ipd", "occupancy"]],
  });

  const dischargeMutation = useMutationOperation((admissionId: string) => dischargePatient(admissionId), {
    toastId: TOAST_IDS.APPOINTMENT.COMPLETE,
    loadingMessage: "Discharging patient...",
    successMessage: "Patient discharged",
    errorMessage: "Failed to discharge patient",
    showToast: true,
    invalidateQueries: [["ipd", "admissions"], ["ipd", "occupancy"]],
  });

  const bedStatusMutation = useMutationOperation((args: { bedId: string; status: string }) => updateBedStatus(args.bedId, args.status), {
    toastId: TOAST_IDS.APPOINTMENT.UPDATE,
    loadingMessage: "Updating bed status...",
    successMessage: "Bed status updated",
    errorMessage: "Failed to update bed",
    showToast: true,
    invalidateQueries: [["ipd", "beds"]],
  });

  const isLoading = admissionsQuery.isPending || bedsQuery.isPending;

  return {
    admissions: admissionsQuery.data ?? [],
    beds: bedsQuery.data ?? [],
    wards: wardsQuery.data ?? [],
    occupancy: occupancyQuery.data,
    isLoading,
    refetch: () => {
      admissionsQuery.refetch();
      bedsQuery.refetch();
      wardsQuery.refetch();
      occupancyQuery.refetch();
    },
    createAdmission: createAdmissionMutation.mutate,
    transferBed: transferMutation.mutate,
    dischargePatient: dischargeMutation.mutate,
    updateBedStatus: bedStatusMutation.mutate,
    isCreatingAdmission: createAdmissionMutation.isPending,
    isTransferring: transferMutation.isPending,
    isDischarging: dischargeMutation.isPending,
  };
}
