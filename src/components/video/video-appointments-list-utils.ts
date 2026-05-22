import { isVideoAppointmentJoinable } from "@/lib/utils/appointmentUtils"
import type { VideoAppointment } from "@/hooks/query/useVideoAppointments"

export function isJoinableVideoAppointment(
  appointment: VideoAppointment | any
): boolean {
  return isVideoAppointmentJoinable(appointment)
}

export function getVideoPaymentAmount(
  appointment: VideoAppointment,
  appointmentServices: unknown[] = []
): number {
  const matchingService = (appointmentServices as any[]).find(
    (service) =>
      service?.treatmentType &&
      service.treatmentType === (appointment as any).treatmentType
  )

  const candidateValues = [
    (appointment as any).videoConsultationFee,
    (appointment as any).consultationFee,
    (appointment as any).amount,
    (appointment as any).price,
    (appointment as any).fee,
    (appointment as any).service?.videoConsultationFee,
    (appointment as any).service?.consultationFee,
    (appointment as any).service?.amount,
    (appointment as any).service?.price,
    (appointment as any).service?.fee,
    (appointment as any).billing?.amount,
    (appointment as any).payment?.amount,
    (appointment as any).invoice?.amount,
    matchingService?.videoConsultationFee,
    matchingService?.consultationFee,
    matchingService?.amount,
    matchingService?.price,
    matchingService?.fee,
  ]

  for (const value of candidateValues) {
    const numericValue = Number(value)
    if (Number.isFinite(numericValue) && numericValue > 0) {
      return numericValue
    }
  }
  return 0
}
