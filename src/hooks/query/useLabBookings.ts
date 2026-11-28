"use client";

import { useQueryData } from "../core/useQueryData";
import { useMutationOperation } from "../core/useMutationOperation";
import { tbdKeys, TBD_CACHE } from "./tbdQueryKeys";
import { useCurrentClinicId } from "./useClinics";
import {
  cancelLabBooking,
  createLabBooking,
  getLabCatalog,
  getMyLabBookings,
  getStaffLabBookings,
  setLabBookingStatus,
  type CreateLabBookingInput,
  type LabBookingStatus,
} from "@/lib/actions/lab-bookings.server";

function unwrap<T>(result: { success: true; data: T } | { success: false; error: string }): T {
  if (!result.success) throw new Error(result.error);
  return result.data;
}

/** Packages and pickup windows (`GET /lab-bookings/packages`). */
export const useLabCatalog = () => {
  const clinicId = useCurrentClinicId();
  return useQueryData(tbdKeys.labBooking.tests(clinicId), async () => unwrap(await getLabCatalog()), TBD_CACHE.settings);
};

/** The patient's own home lab bookings (`GET /lab-bookings/mine`). */
export const useMyLabBookings = () => {
  const clinicId = useCurrentClinicId();
  return useQueryData(tbdKeys.labBooking.mine(clinicId), async () => unwrap(await getMyLabBookings()), TBD_CACHE.working);
};

export const useCreateLabBooking = () =>
  useMutationOperation(async (input: CreateLabBookingInput) => unwrap(await createLabBooking(input)), {
    toastId: "lab-booking-create",
    loadingMessage: "Booking your lab test...",
    successMessage: "Lab test booked. The lab will confirm the pickup.",
    invalidateQueries: [[...tbdKeys.labBooking.all()]],
  });

export const useCancelLabBooking = () =>
  useMutationOperation(async (id: string) => unwrap(await cancelLabBooking(id)), {
    toastId: "lab-booking-cancel",
    loadingMessage: "Cancelling the booking...",
    successMessage: "Lab booking cancelled",
    invalidateQueries: [[...tbdKeys.labBooking.all()]],
  });

/** Staff list of every booking for the clinic (`GET /lab-bookings?status=`). */
export const useStaffLabBookings = (status?: LabBookingStatus) => {
  const clinicId = useCurrentClinicId();
  return useQueryData(
    tbdKeys.labBooking.staff(clinicId, status),
    async () => unwrap(await getStaffLabBookings(status)),
    TBD_CACHE.working
  );
};

/** Advance a booking's status (`PATCH /lab-bookings/:id/status`). */
export const useSetLabBookingStatus = () =>
  useMutationOperation(
    async ({ id, status }: { id: string; status: Exclude<LabBookingStatus, "REQUESTED"> }) =>
      unwrap(await setLabBookingStatus(id, status)),
    {
      toastId: "lab-booking-set-status",
      loadingMessage: "Updating the booking...",
      successMessage: "Booking updated",
      invalidateQueries: [[...tbdKeys.labBooking.all()]],
    }
  );
