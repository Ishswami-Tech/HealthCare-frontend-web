import type { QueryClient } from "@tanstack/react-query";

/**
 * Every cached read that carries the clinic switches (`settings.appointmentSettings.opdControls`
 * and the doctor overrides), plus doctor availability, whose `restrictions` mirror them.
 */
export const CLINIC_SETTINGS_QUERY_FAMILIES: readonly (readonly string[])[] = [
  ["clinics"],
  ["clinic"],
  ["myClinic"],
  ["current-clinic"],
  ["clinicByAppName"],
  ["clinicSettings"],
  ["doctorAvailability"],
];

/**
 * Marks every clinic-settings read stale and refetches the ones on screen now, so an open
 * booking, check-in or settings view follows a switch flip without a reload. Inactive queries
 * refetch the next time they are used.
 */
export function refetchClinicSettingsQueries(queryClient: QueryClient): void {
  for (const queryKey of CLINIC_SETTINGS_QUERY_FAMILIES) {
    void queryClient.invalidateQueries({
      queryKey: [...queryKey],
      exact: false,
      refetchType: "active",
    });
  }
}
