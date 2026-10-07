import type { ReactNode } from "react";

/** "page" = the wide patient layout (boards WebDoctorProfile / WebBookConfirm / WebBooked);
 *  "compact" = the narrow staff dialog (board DocAppointmentDialogs3). */
export type BookingLayout = "page" | "compact";

export type BookingMode = "IN_PERSON" | "VIDEO";

export interface BookingDoctorInfo {
  /** Already formatted for display ("Dr. Asha Rao"). */
  name: string;
  /** "General Physician · MBBS, MD" */
  subtitle?: string | undefined;
  image?: string | undefined;
  locationName?: string | undefined;
  /** The clinic the doctor practises at. */
  clinicName?: string | undefined;
  /** Awards and recognitions, one line each (the doctor's certifications). */
  highlights?: string[] | undefined;
  /** Where the doctor trained, as the doctor entered it. */
  education?: string | undefined;
  languages?: string[] | undefined;
  /** Small number tiles under the name. Only real values; leave out what is unknown. */
  stats?: Array<{ value: string; label: string }> | undefined;
}

export interface BookingDay {
  date: Date;
  disabled: boolean;
}

export interface BookingSlotOption {
  /** Raw slot value as the API returns it ("09:30"). */
  value: string;
  /** Booked by someone else: shown struck through, cannot be picked. */
  unavailable: boolean;
}

export type BookingPeriodKey = "morning" | "afternoon" | "evening";

export interface BookingSlotPeriod {
  key: BookingPeriodKey;
  label: string;
  range: string;
  slots: BookingSlotOption[];
  /** Number of slots that can still be booked. */
  openCount: number;
}

export interface BookingDetail {
  label: string;
  value: ReactNode;
  /** "brand" paints the value emerald (amount paid, check-in time). */
  tone?: "brand" | undefined;
}

export interface BookingLiveSync {
  mode: "live" | "connecting" | "fallback";
  label: string;
  description: string;
  /** Colours of the tag, chosen by the dialog for the current connection state. */
  className?: string | undefined;
}

export interface BookingHoursRow {
  label: string;
  value: string;
}
