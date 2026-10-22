"use server";

import { authenticatedApi } from "./auth.server";
import { actionSuccess, caughtFailure, requireSession, statusFailure, type ActionResult } from "./_shared";
import { API_ENDPOINTS } from "../config/config";

/**
 * Home lab test bookings (API_CONTRACT §13, `lab-bookings`). Patients book a sample pickup at
 * home; reception and the clinic admin confirm it. No prices travel on these routes.
 */

export type LabBookingStatus = "REQUESTED" | "CONFIRMED" | "SAMPLE_COLLECTED" | "COMPLETED" | "CANCELLED";

export interface LabPackage {
  code: string;
  name: string;
  tests: string[];
}

export interface LabCatalog {
  packages: LabPackage[];
  /** "07:00-09:00" */
  slotWindows: string[];
}

export interface LabBooking {
  id: string;
  packageCode: string;
  packageName: string;
  tests: string[];
  addressLine: string;
  city?: string | null;
  zipCode?: string | null;
  /** yyyy-mm-dd */
  slotDate: string;
  slotWindow: string;
  status: LabBookingStatus;
  notes?: string | null;
  patientName?: string | null;
  createdAt: string;
}

export interface CreateLabBookingInput {
  packageCode: string;
  packageName: string;
  tests?: string[];
  addressLine: string;
  city?: string;
  zipCode?: string;
  slotDate: string;
  slotWindow: string;
  notes?: string;
}

export async function getLabCatalog(): Promise<ActionResult<LabCatalog>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;
    const { status, data } = await authenticatedApi<LabCatalog>(API_ENDPOINTS.LAB_BOOKING.PACKAGES);
    return (
      statusFailure(status, "Lab packages") ??
      actionSuccess({
        packages: Array.isArray(data?.packages) ? data.packages : [],
        slotWindows: Array.isArray(data?.slotWindows) ? data.slotWindows : [],
      })
    );
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function getMyLabBookings(): Promise<ActionResult<LabBooking[]>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;
    const { status, data } = await authenticatedApi<LabBooking[]>(API_ENDPOINTS.LAB_BOOKING.MINE);
    return statusFailure(status, "Lab bookings") ?? actionSuccess(Array.isArray(data) ? data : []);
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function createLabBooking(input: CreateLabBookingInput): Promise<ActionResult<LabBooking>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;
    const { status, data } = await authenticatedApi<LabBooking>(API_ENDPOINTS.LAB_BOOKING.CREATE, {
      method: "POST",
      body: JSON.stringify(input),
    });
    return statusFailure(status, "Lab booking") ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}

export async function cancelLabBooking(id: string): Promise<ActionResult<LabBooking>> {
  try {
    const session = await requireSession();
    if (!session.success) return session;
    const { status, data } = await authenticatedApi<LabBooking>(API_ENDPOINTS.LAB_BOOKING.CANCEL(id), { method: "POST" });
    return statusFailure(status, "Lab booking") ?? actionSuccess(data);
  } catch (error) {
    return caughtFailure(error);
  }
}
