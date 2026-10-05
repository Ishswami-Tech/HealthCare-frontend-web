"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { useAppointment } from "@/hooks/query/useAppointments";
import { useVideoAppointment } from "@/hooks/query/useVideoAppointments";
import { getDashboardByRole } from "@/lib/config/routes";
import {
  formatDoctorDisplayName,
  getAppointmentDoctorName,
  getAppointmentPatientName,
  getVideoSessionDecision,
  VIDEO_JOIN_EARLY_WINDOW_MINUTES,
  VIDEO_JOIN_WINDOW_TEXT,
} from "@/lib/utils/appointmentUtils";
import { getAppointmentDateTimeValue } from "@/lib/utils/clock";
import { formatDateInIST, formatISODateInIST, formatTimeInIST } from "@/lib/utils/date-time";
import { buildVideoSessionMeetRoute } from "@/lib/utils/video-session-route";
import { videoPortalLabel } from "@/components/video/lobby/VideoStageShell";
import {
  getAppointmentDoctorPhoto,
  normalizeVideoViewerRole,
  videoAppointmentsRoute,
} from "@/components/video/lobby/videoVisitPeople";
import { LeftCallView, type LeftCallState } from "./LeftCallView";

/** How often the open page re-checks the appointment (has the doctor completed the visit?). */
const STATUS_POLL_MS = 10_000;

type Row = Record<string, unknown>;

function asRow(value: unknown): Row | null {
  return value && typeof value === "object" ? (value as Row) : null;
}

/**
 * Where a person lands after leaving a video visit that is still open, or after the call dropped
 * (`reason="dropped"`). Leaving never completes a visit:
 *  - Rejoin goes back to the waiting room, which re-checks payment, timing and status;
 *  - while the tab is visible the appointment is re-checked every 10 seconds, and once the doctor
 *    completes the visit the page is replaced by the consultation summary;
 *  - if the join window has closed without completion, only "Back to home" is offered.
 */
export function LeftCallContent({ appointmentId, reason }: { appointmentId: string; reason?: string }) {
  const { replace } = useRouter();
  const { session } = useAuth();
  const role = normalizeVideoViewerRole(session?.user?.role);
  const viewerIsPatient = role === "" || role === "PATIENT";

  const { data: appointmentData, refetch: refetchAppointment } = useAppointment(appointmentId);
  // The backend's own join answer for this visit (canJoin, join window, blocked reason).
  const {
    data: consultationData,
    isFetched: consultationChecked,
    refetch: refetchConsultation,
  } = useVideoAppointment(appointmentId);

  // Re-check every 10 seconds, only while the tab is visible.
  const [now, setNow] = useState(() => Date.now());
  const refetchRef = useRef({ refetchAppointment, refetchConsultation });
  refetchRef.current = { refetchAppointment, refetchConsultation };
  useEffect(() => {
    if (!appointmentId) return;
    let timer: number | null = null;
    const tick = () => {
      setNow(Date.now());
      void refetchRef.current.refetchAppointment();
      void refetchRef.current.refetchConsultation();
    };
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const sync = () => {
      if (document.visibilityState !== "visible") {
        stop();
        return;
      }
      if (timer !== null) return;
      tick();
      timer = window.setInterval(tick, STATUS_POLL_MS);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      stop();
    };
  }, [appointmentId]);

  const record = useMemo(() => {
    const data = asRow(appointmentData);
    return asRow(data?.appointment) ?? asRow(data?.data) ?? data;
  }, [appointmentData]);
  const consultation = useMemo(() => {
    const data = asRow(consultationData);
    return asRow(data?.appointment) ?? asRow(data?.data);
  }, [consultationData]);

  // Same rule as the waiting room: the appointment record wins, the consultation adds the join answer.
  const merged = useMemo(
    () => (record ? getVideoSessionDecision({ ...(consultation ?? {}), ...record }) : null),
    [record, consultation],
  );
  const status = merged?.status ?? "";
  // "Can it still be joined" is only trusted once the backend's join answer has been asked for;
  // before that Rejoin stays available and the waiting room re-checks.
  const decision = consultationChecked ? merged : null;
  const completed = status === "COMPLETED";
  const inProgress = status === "IN_PROGRESS";

  // The doctor completed the visit: show the consultation summary instead.
  const movedOnRef = useRef(false);
  useEffect(() => {
    if (!completed || !appointmentId || movedOnRef.current) return;
    movedOnRef.current = true;
    replace(`${buildVideoSessionMeetRoute(appointmentId)}/summary`);
  }, [completed, appointmentId, replace]);

  const startsAt = useMemo(() => {
    const scheduled = consultation?.scheduledStartTime ?? record?.scheduledStartTime;
    if (typeof scheduled === "string" && scheduled) {
      const parsed = new Date(scheduled);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
    return record ? getAppointmentDateTimeValue(record) : null;
  }, [consultation, record]);

  const notOpenYet = Boolean(
    decision &&
      !decision.canJoin &&
      startsAt &&
      now < startsAt.getTime() - VIDEO_JOIN_EARLY_WINDOW_MINUTES * 60_000,
  );
  const closed = Boolean(decision && !decision.canJoin && !notOpenYet && !completed);
  // Until the appointment has loaded (for example offline) Rejoin stays available; the waiting room re-checks.
  const canRejoin = Boolean(appointmentId) && !completed && (decision ? decision.canJoin : true);

  const state: LeftCallState = closed ? "closed" : reason === "dropped" ? "dropped" : "left";

  const rawDoctorName = record ? getAppointmentDoctorName(record) : "";
  const doctorName = rawDoctorName && rawDoctorName !== "Doctor assigned" ? formatDoctorDisplayName(rawDoctorName) : "";
  const rawPatientName = record ? getAppointmentPatientName(record) : "";
  const patientName = rawPatientName && rawPatientName !== "Unknown Patient" ? rawPatientName : "";
  const counterpartName = viewerIsPatient ? doctorName : patientName;
  const doctorPhotoUrl = viewerIsPatient ? getAppointmentDoctorPhoto(record) : undefined;

  const whenLabel = startsAt
    ? [
        "Video visit",
        `${
          formatISODateInIST(startsAt) === formatISODateInIST(new Date(now))
            ? "Today"
            : formatDateInIST(startsAt, { day: "numeric", month: "short" })
        }, ${formatTimeInIST(startsAt)}`,
      ].join(" · ")
    : "Video visit";

  const blockedReason = decision?.blockedReason ?? "";
  const closedReason =
    !blockedReason || blockedReason === VIDEO_JOIN_WINDOW_TEXT
      ? "The time to join this visit has passed."
      : blockedReason;

  return (
    <LeftCallView
      state={state}
      portalLabel={videoPortalLabel(role)}
      backHref={videoAppointmentsRoute(role)}
      backLabel="Back to appointments"
      counterpartName={counterpartName}
      viewerIsPatient={viewerIsPatient}
      avatarName={counterpartName || (viewerIsPatient ? "Doctor" : "Patient")}
      {...(doctorPhotoUrl ? { avatarPhotoUrl: doctorPhotoUrl } : {})}
      visitInProgress={inProgress}
      visit={record ? { name: counterpartName || (viewerIsPatient ? "Your doctor" : "Patient"), whenLabel } : null}
      closedReason={closedReason}
      {...(notOpenYet ? { opensLabel: VIDEO_JOIN_WINDOW_TEXT } : {})}
      canRejoin={canRejoin}
      rejoinHref={buildVideoSessionMeetRoute(appointmentId)}
      homeHref={role ? getDashboardByRole(role) : "/patient/dashboard"}
    />
  );
}
