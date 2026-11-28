import type {
  AppointmentServiceDefinition,
  AppointmentType,
  TreatmentType,
} from "@/types/appointment.types";

/**
 * The service a video visit falls back to: what the dialog used before the backend sent
 * `bookable`, and the preselected choice when the patient switches to video.
 */
export const VIDEO_CONSULTATION_TREATMENT_TYPE: TreatmentType = "GENERAL_CONSULTATION";

/**
 * True when the backend marks patient-bookable services (`bookable` on catalog entries,
 * clinic setting `appointmentSettings.bookableTreatmentTypes`). Older backends send no flag.
 */
export function catalogHasBookableFlags(
  services: readonly AppointmentServiceDefinition[],
): boolean {
  return services.some((service) => typeof service.bookable === "boolean");
}

function hasVideoFee(service: AppointmentServiceDefinition): boolean {
  const fee = Number(service.videoConsultationFee);
  return Number.isFinite(fee) && fee > 0;
}

interface BookingServicesOptions {
  /** Patients see the clinic's bookable list; staff keep every catalog service of the mode. */
  patientBooking: boolean;
  /** A service the caller opened the dialog with stays selectable even if not bookable. */
  keepTreatmentType?: string;
}

/**
 * Services offered in the booking dialog for one appointment mode.
 *
 * New backend (`bookable` present): patients get the bookable entries that allow the mode; for
 * video only those with a video fee (the payment endpoint refuses others). Old backend: the
 * previous behaviour (every service of the mode; video fixed to General Consultation).
 * Video never ends up empty: it falls back to General Consultation like before.
 */
export function selectBookingServices(
  services: readonly AppointmentServiceDefinition[],
  appointmentType: AppointmentType,
  { patientBooking, keepTreatmentType }: BookingServicesOptions,
): AppointmentServiceDefinition[] {
  const forMode = services.filter(
    (service) => service.active && service.appointmentModes.includes(appointmentType),
  );
  const isVideo = appointmentType === "VIDEO_CALL";
  const legacyVideo = forMode.filter(
    (service) => service.treatmentType === VIDEO_CONSULTATION_TREATMENT_TYPE,
  );

  if (!catalogHasBookableFlags(services)) {
    return isVideo ? legacyVideo : forMode;
  }

  if (!patientBooking) {
    return isVideo ? forMode.filter(hasVideoFee) : forMode;
  }

  const bookable = forMode.filter(
    (service) =>
      (service.bookable === true || service.treatmentType === keepTreatmentType) &&
      (!isVideo || hasVideoFee(service)),
  );
  if (isVideo && bookable.length === 0) {
    return legacyVideo;
  }
  return bookable;
}

/**
 * The service for a mode. Video has no service choice: it always uses the video default
 * (General Consultation; the first video service if the clinic does not offer it; the default
 * id while the list is still loading). In-clinic keeps a still-valid choice, else none.
 */
export function defaultBookingServiceId(
  visibleServices: readonly AppointmentServiceDefinition[],
  appointmentType: AppointmentType,
  currentServiceId: string,
): string {
  if (appointmentType === "VIDEO_CALL") {
    const general = visibleServices.find(
      (service) => service.treatmentType === VIDEO_CONSULTATION_TREATMENT_TYPE,
    );
    return (
      general?.treatmentType ??
      visibleServices[0]?.treatmentType ??
      VIDEO_CONSULTATION_TREATMENT_TYPE
    );
  }
  return visibleServices.some((service) => service.treatmentType === currentServiceId)
    ? currentServiceId
    : "";
}

/** Category chips are only useful when the visible services span two or more categories. */
export function shouldShowServiceCategoryFilter(
  visibleServices: readonly AppointmentServiceDefinition[],
): boolean {
  return new Set(visibleServices.map((service) => service.category)).size >= 2;
}
