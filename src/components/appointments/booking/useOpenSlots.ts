"use client";

import { useMemo } from "react";
import { useDoctorAvailability } from "@/hooks/query/useAppointments";
import { extractAvailabilitySlots, groupSlotsByPeriod } from "@/lib/utils/availabilitySlots";
import { buildSlotPeriods } from "./slotDisplay";
import type { BookingSlotPeriod } from "./types";

export interface OpenSlotsTarget {
  clinicId: string;
  doctorId: string;
  /** In-clinic visits only; a video visit has no location. */
  locationId?: string | undefined;
  isVideo: boolean;
}

export interface OpenSlots {
  /** Morning / afternoon / evening groups; undefined when there is no doctor or clinic to look up. */
  periods: BookingSlotPeriod[] | undefined;
  /** The first open time of the day ("09:30"), or "" */
  firstOpen: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * The doctor's open times on `date` for one visit type (and location, in clinic), grouped for the
 * slot grid. One implementation for every screen that picks a time: reschedule (patient and desk)
 * and the reception walk-in.
 */
export function useOpenSlots(target: OpenSlotsTarget, date: string, enabled = true): OpenSlots {
  const canLoad = Boolean(target.doctorId && target.clinicId);
  const { data, isPending, error } = useDoctorAvailability(
    target.clinicId,
    target.doctorId,
    date,
    target.isVideo ? undefined : target.locationId || undefined,
    target.isVideo ? "VIDEO_CALL" : "IN_PERSON",
    { enabled: enabled && canLoad && Boolean(date) },
  );
  return useMemo(() => {
    const groups = groupSlotsByPeriod(extractAvailabilitySlots(data));
    const firstOpen = [...groups.morning, ...groups.afternoon, ...groups.evening].sort()[0] ?? "";
    return {
      periods: canLoad ? buildSlotPeriods(groups, [], 0) : undefined,
      firstOpen,
      isLoading: isPending && Boolean(date) && canLoad && enabled,
      error: error instanceof Error ? error.message : null,
    };
  }, [canLoad, data, date, enabled, error, isPending]);
}
