import type { CheckInFailureCode, InPersonVisit } from "@/types/in-person.types";
import type { LocationFailure } from "./deviceLocation";
import { formatTimeLabel } from "@/lib/utils/date-time";
import {
  CHECK_IN_CLOSES_MINUTES_AFTER,
  CHECK_IN_OPENS_MINUTES_BEFORE,
  CHECK_IN_WINDOW_TEXT,
} from "@/lib/utils/appointmentUtils";

/**
 * What the patient sees when a check-in is refused (CheckInError screen), per backend reason.
 * `action` picks the fix button: scan again, go to reception, book, or open appointments.
 */
export type CheckInFix = "rescan" | "reception" | "book" | "appointments" | "plan" | "location";

/** How to switch location on, shown with the "location" fix. */
export const ENABLE_LOCATION_STEPS =
  "Allow location for this site (the lock or location icon next to the address, then Location > Allow) and turn on location on your phone, then try the desk code again.";

const SCAN_INSTEAD = "Or scan the QR at the reception desk, or ask the reception desk to check you in.";

/** Where the patient renews / buys the monthly in-person plan (existing Plans & billing screen). */
export const PATIENT_PLAN_ROUTE = "/patient/payments?tab=plans";

/** The check-in service refuses an in-person visit without an active monthly plan (400, plain message). */
export function isPlanRefusal(serverMessage: string | null | undefined): boolean {
  return /\b(active plan|plan coverage)\b/i.test(serverMessage ?? "");
}

export interface CheckInErrorCopy {
  title: string;
  message: string;
  fix: CheckInFix;
}

function slotLabel(visit?: InPersonVisit | null): string {
  if (!visit) return "";
  return visit.time ? ` (${visit.time})` : "";
}

export function checkInErrorCopy(
  reason: CheckInFailureCode,
  serverMessage: string | null | undefined,
  visit?: InPersonVisit | null,
): CheckInErrorCopy {
  switch (reason) {
    case "WRONG_LOCATION":
      return {
        title: "Wrong clinic location",
        message: visit?.locationName
          ? `Your visit is booked at ${visit.locationName}. Scan the QR code at that location.`
          : "This QR code belongs to a different location than the one you booked.",
        fix: "rescan",
      };
    case "TOO_EARLY": {
      const opens = visit?.checkInWindow?.opensAt ? formatTimeLabel(visit.checkInWindow.opensAt) : "";
      return {
        title: "Too early to check in",
        message: opens
          ? `Check-in opens at ${opens}, ${CHECK_IN_OPENS_MINUTES_BEFORE} minutes before your visit${slotLabel(visit)}.`
          : CHECK_IN_WINDOW_TEXT,
        fix: "appointments",
      };
    }
    case "EXPIRED": {
      const closes = visit?.checkInWindow?.closesAt ? formatTimeLabel(visit.checkInWindow.closesAt) : "";
      return {
        title: "Check-in window closed",
        message: closes
          ? `The check-in window closed at ${closes}. Please go to the reception desk.`
          : `Self check-in closes ${CHECK_IN_CLOSES_MINUTES_AFTER} minutes after your appointment time. Please go to the reception desk.`,
        fix: "reception",
      };
    }
    case "NOT_BOOKED":
      return {
        title: "No booking found for today",
        message: "We could not find an in-clinic booking for you at this location today.",
        fix: "book",
      };
    case "INVALID_QR":
      return { title: "QR code not recognised", message: "This is not a check-in QR of this clinic. Scan the poster at the entrance.", fix: "rescan" };
    case "EXPIRED_QR":
      return { title: "Old QR code", message: "This QR code was replaced. Please scan the new poster at the clinic.", fix: "rescan" };
    case "LOCATION_INACTIVE":
      return { title: "Check-in is off here", message: "Self check-in is switched off at this location. Please go to the reception desk.", fix: "reception" };
    case "LOCATION_REQUIRED":
      return {
        title: "Turn on location",
        message: `To check in with the desk code we need your location. ${SCAN_INSTEAD}`,
        fix: "location",
      };
    case "TOO_FAR":
      return {
        title: "You are not at the clinic yet",
        message:
          `${serverMessage?.trim() || "You are too far from the clinic. Check in when you reach the clinic."} Already there? Ask the reception desk to check you in.`,
        fix: "appointments",
      };
    case "VIDEO_VISIT":
      return { title: "This is a video visit", message: "Video visits do not use clinic check-in. Join the call from your appointments.", fix: "appointments" };
    case "NOT_TODAY":
      return { title: "Not today", message: "Check-in is only possible on the day of your visit.", fix: "appointments" };
    default:
      if (isPlanRefusal(serverMessage)) {
        return {
          title: "Your plan is not active",
          message: "In-clinic visits are covered by your monthly plan. Renew it, then scan the QR again.",
          fix: "plan",
        };
      }
      return {
        title: "Check-in failed",
        message: serverMessage?.trim() || "We could not check you in. Please try again or ask the reception desk.",
        fix: "reception",
      };
  }
}

/** The browser could not give the position needed for a typed desk code (the API is not called). */
export function locationFailureCopy(failure: LocationFailure): CheckInErrorCopy {
  switch (failure) {
    case "denied":
      return {
        title: "Location is blocked",
        message: `Checking in with the desk code needs your location, and this browser blocked it. ${SCAN_INSTEAD}`,
        fix: "location",
      };
    case "timeout":
      return {
        title: "Could not find your location",
        message: `Your location took too long. Move near a window or turn on precise location, then try again. ${SCAN_INSTEAD}`,
        fix: "location",
      };
    case "unsupported":
      return {
        title: "Location not available",
        message: `This browser cannot share your location. ${SCAN_INSTEAD}`,
        fix: "rescan",
      };
    default:
      return {
        title: "Location is turned off",
        message: `Turn on location on your device to check in with the desk code. ${SCAN_INSTEAD}`,
        fix: "location",
      };
  }
}
