"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { Archive, CalendarPlus, Loader2, MessageCircle, Phone, UserX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { BookAppointmentDialog } from "@/components/appointments/BookAppointmentDialog";
import {
  CellTitle,
  ChoiceChip,
  DialogActions,
  DialogBody,
  DialogError,
  DialogShell,
  EmptyBlock,
  Field,
  GridHead,
  GridRow,
  Kpi,
  LoadError,
  Note,
  Pill,
  SearchBox,
  SkeletonRows,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useAuth } from "@/hooks/auth/useAuth";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useSendUnifiedCommunication } from "@/hooks/query/useCommunication";
import { useDoctorFavourites, useRemoveFavourite, useSaveFavouritesBulk } from "@/hooks/query/useDoctorFavourites";
import { useRealTimeAppointments } from "@/hooks/realtime/useRealTimeQueries";
import { formatDateKeyInIST } from "@/lib/utils/date-time";
import { archiveKey, archivedIds, DEFAULT_MISSED_MESSAGE, messageFor, toMissedVisits, type MissedVisit } from "./missed.logic";

type RangeFilter = "7" | "30";
type TypeFilter = "ALL" | "VIDEO" | "CLINIC" | "ARCHIVED";

const COLUMNS = "36px minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1fr) auto";
const ARCHIVE_MESSAGES = { toastId: "missed-archive", loading: "Archiving...", success: "Moved to Archived" };

function daysAgoKey(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateKeyInIST(date);
}

/**
 * DocMissedBulk: patients who did not turn up in the last 7 / 30 days. Select several and message
 * them on WhatsApp, or archive the ones that are handled; each row has Call and Book again.
 */
export function MissedFollowUpContent() {
  const { session } = useAuth();
  const { clinicId } = useClinicContext();
  const [range, setRange] = useState<RangeFilter>("7");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [messaging, setMessaging] = useState(false);

  const appointments = useRealTimeAppointments({
    doctorId: session?.user?.id || undefined,
    startDate: daysAgoKey(Number(range)),
    endDate: formatDateKeyInIST(new Date()),
    limit: 500,
  } as Parameters<typeof useRealTimeAppointments>[0]);
  const favourites = useDoctorFavourites("OTHER");
  const archive = useSaveFavouritesBulk(ARCHIVE_MESSAGES);
  const unarchive = useRemoveFavourite({ successMessage: "Moved back to the list" });

  const visits = useMemo(() => toMissedVisits((appointments.data as { data?: unknown } | undefined)?.data), [appointments.data]);
  const archived = useMemo(() => archivedIds(favourites.data ?? []), [favourites.data]);
  const shown = useMemo(() => {
    const term = search.trim().toLowerCase();
    return visits.filter((visit) => {
      const isArchived = archived.has(visit.appointmentId);
      if (type === "ARCHIVED" ? !isArchived : isArchived) return false;
      if (type === "VIDEO" && !visit.isVideo) return false;
      if (type === "CLINIC" && visit.isVideo) return false;
      return !term || visit.patientName.toLowerCase().includes(term) || visit.patientPhone.includes(term);
    });
  }, [archived, search, type, visits]);

  const selectedVisits = shown.filter((visit) => selected.has(visit.appointmentId));
  const openCount = visits.filter((visit) => !archived.has(visit.appointmentId)).length;
  const allSelected = shown.length > 0 && selectedVisits.length === shown.length;

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const archiveSelected = () =>
    archive.mutate(
      selectedVisits.map((visit) => ({
        kind: "OTHER" as const,
        itemKey: archiveKey(visit.appointmentId),
        label: `Missed visit · ${visit.patientName}`,
        payload: { appointmentId: visit.appointmentId, archivedAt: new Date().toISOString() },
      })),
      { onSuccess: () => setSelected(new Set()) },
    );

  const loading = appointments.isFetching && !appointments.data;

  return (
    <TbdPage
      title="Missed and no-show"
      description="Select patients, then message them or archive the ones you have followed up."
      backHref="/doctor/appointments?view=NO_SHOW"
      backLabel="Appointments"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Kpi label="Missed, not archived" value={loading ? "—" : String(openCount)} icon={UserX} />
        <Kpi label="Archived" value={loading ? "—" : String(visits.length - openCount)} icon={Archive} />
      </div>

      <Surface flush as="section" aria-label="Missed visits">
        <div className="flex flex-col gap-3 border-b border-hair px-5 py-4">
          <SearchBox value={search} onChange={setSearch} placeholder="Search patient name or phone" />
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { value: "7", label: "Last 7 days" },
                { value: "30", label: "Last 30 days" },
              ] as const
            ).map((option) => (
              <ChoiceChip key={option.value} size="sm" shape="box" active={range === option.value} onClick={() => setRange(option.value)}>
                {option.label}
              </ChoiceChip>
            ))}
            <span className="mx-1 h-5 w-px bg-line" aria-hidden="true" />
            {(
              [
                { value: "ALL", label: "All" },
                { value: "VIDEO", label: "Video" },
                { value: "CLINIC", label: "In-clinic" },
                { value: "ARCHIVED", label: "Archived" },
              ] as const
            ).map((option) => (
              <ChoiceChip
                key={option.value}
                size="sm"
                shape="box"
                active={type === option.value}
                onClick={() => {
                  setType(option.value);
                  setSelected(new Set());
                }}
              >
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </div>

        {selectedVisits.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair bg-mint-soft px-5 py-2.5" role="region" aria-label="Selected patients">
            <span className="min-w-0 text-sm font-bold text-brand-dark" role="status">
              {selectedVisits.length} selected
              <span className="font-medium"> · {selectedVisits.map((visit) => visit.patientName.split(/\s+/)[0]).join(", ")}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              <Button onClick={() => setMessaging(true)}>
                <MessageCircle aria-hidden="true" />
                Message selected
              </Button>
              {type === "ARCHIVED" ? null : (
                <Button variant="outline" disabled={archive.isPending} onClick={archiveSelected}>
                  <Archive aria-hidden="true" />
                  Archive
                </Button>
              )}
              <Button variant="ghost" aria-label="Clear selection" onClick={() => setSelected(new Set())}>
                <X aria-hidden="true" />
              </Button>
            </span>
          </div>
        ) : null}

        <div role="table" aria-label="Missed visits" aria-busy={loading}>
          <GridHead
            columns={COLUMNS}
            labels={[
              <Checkbox
                key="all"
                aria-label="Select all"
                checked={allSelected}
                onCheckedChange={(checked) => setSelected(checked ? new Set(shown.map((visit) => visit.appointmentId)) : new Set())}
              />,
              "Patient",
              "Missed visit",
              "Reason",
              "Actions",
            ]}
          />
          {loading ? (
            <SkeletonRows rows={4} />
          ) : appointments.error && !appointments.data ? (
            <LoadError title="Missed visits could not be loaded" message="Check the connection and try again." onRetry={() => void appointments.refetch()} />
          ) : shown.length === 0 ? (
            <EmptyBlock
              icon={UserX}
              title={type === "ARCHIVED" ? "Nothing archived" : "No missed visits"}
              description={type === "ARCHIVED" ? "Archived missed visits show here." : "Patients who do not turn up in this period show here."}
            />
          ) : (
            shown.map((visit) => (
              <MissedRow
                key={visit.appointmentId}
                visit={visit}
                clinicId={clinicId || ""}
                selected={selected.has(visit.appointmentId)}
                onToggle={() => toggle(visit.appointmentId)}
                {...(type === "ARCHIVED"
                  ? {
                      onUnarchive: () => {
                        const favourite = (favourites.data ?? []).find((item) => item.itemKey === archiveKey(visit.appointmentId));
                        if (favourite) unarchive.mutate(favourite.id);
                      },
                    }
                  : {})}
              />
            ))
          )}
        </div>
      </Surface>

      <Note tone="blue">
        Each patient gets their own message. Re-book opens the booking form with the patient and visit type filled in.{" "}
        <Link href="/doctor/appointments?view=NO_SHOW" className="font-bold underline">
          See all missed appointments
        </Link>
      </Note>

      {messaging ? <MessageDialog visits={selectedVisits} onClose={() => setMessaging(false)} onSent={() => setSelected(new Set())} /> : null}
    </TbdPage>
  );
}

function MissedRow({
  visit,
  clinicId,
  selected,
  onToggle,
  onUnarchive,
}: {
  visit: MissedVisit;
  clinicId: string;
  selected: boolean;
  onToggle: () => void;
  onUnarchive?: () => void;
}) {
  return (
    <GridRow columns={COLUMNS}>
      <span role="cell">
        <Checkbox aria-label={`Select ${visit.patientName}`} checked={selected} onCheckedChange={onToggle} />
      </span>
      <span role="cell">
        <CellTitle title={visit.patientName} description={visit.patientPhone || "No phone on file"} />
      </span>
      <span role="cell" className="flex flex-wrap items-center gap-2 text-[13px] text-ink">
        <Pill tone={visit.isVideo ? "video" : "clinic"}>{visit.isVideo ? "Video" : "In-clinic"}</Pill>
        {visit.whenLabel}
      </span>
      <span role="cell" className="text-[13px] text-ink-muted">
        {visit.complaint || "—"}
      </span>
      <span role="cell" className="flex flex-wrap items-center gap-2">
        {visit.patientPhone ? (
          <Button asChild variant="outline" size="compact">
            <a href={`tel:${visit.patientPhone}`} aria-label={`Call ${visit.patientName}`}>
              <Phone aria-hidden="true" />
              Call
            </a>
          </Button>
        ) : null}
        <BookAppointmentDialog
          {...(clinicId ? { clinicId } : {})}
          {...(visit.patientId ? { initialPatientId: visit.patientId } : {})}
          {...(visit.doctorId ? { initialDoctorId: visit.doctorId } : {})}
          initialConsultationMode={visit.isVideo ? "VIDEO" : "IN_PERSON"}
          trigger={
            <Button size="compact" aria-label={`Re-book ${visit.patientName}`}>
              <CalendarPlus aria-hidden="true" />
              Re-book
            </Button>
          }
        />
        {onUnarchive ? (
          <Button size="compact" variant="ghost" onClick={onUnarchive}>
            Unarchive
          </Button>
        ) : null}
      </span>
    </GridRow>
  );
}

function MessageDialog({ visits, onClose, onSent }: { visits: MissedVisit[]; onClose: () => void; onSent: () => void }) {
  const id = useId();
  const send = useSendUnifiedCommunication();
  const [template, setTemplate] = useState(DEFAULT_MISSED_MESSAGE);
  const [error, setError] = useState<string | null>(null);
  const reachable = visits.filter((visit) => visit.patientUserId);
  const first = reachable[0];

  const submit = async () => {
    setError(null);
    try {
      // One request per patient, so each message carries the patient's own name and visit.
      for (const visit of reachable) {
        await send.mutateAsync({
          type: "whatsapp",
          recipientId: visit.patientUserId,
          title: "Missed visit",
          message: messageFor(template, visit),
          category: "APPOINTMENT",
          data: { appointmentId: visit.appointmentId, reason: "MISSED_VISIT_FOLLOW_UP" },
        });
      }
      onSent();
      onClose();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The messages could not be sent.");
    }
  };

  return (
    <DialogShell
      open
      onClose={onClose}
      busy={send.isPending}
      title={`Message ${reachable.length} ${reachable.length === 1 ? "patient" : "patients"}`}
      description="Sent on WhatsApp. {name} and {date} are filled in for each patient."
      width={560}
    >
      <DialogBody>
        <Field label="Message" htmlFor={`${id}-message`}>
          <Textarea id={`${id}-message`} value={template} maxLength={600} className="min-h-[120px] border-line" onChange={(event) => setTemplate(event.target.value)} />
        </Field>
        {first ? (
          <Note tone="green" icon={MessageCircle}>
            <span className="text-xs font-bold uppercase tracking-[0.5px]">Preview · {first.patientName}</span>
            <br />
            {messageFor(template, first)}
          </Note>
        ) : null}
        {reachable.length < visits.length ? (
          <Note tone="amber">{visits.length - reachable.length} selected patient(s) have no app account to message; call them instead.</Note>
        ) : null}
        <DialogError lead="Not sent." message={error} />
      </DialogBody>
      <DialogActions>
        <Button variant="outline" size="md" disabled={send.isPending} onClick={onClose}>
          Cancel
        </Button>
        <Button size="md" disabled={send.isPending || reachable.length === 0 || !template.trim()} onClick={() => void submit()}>
          {send.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
          Send
        </Button>
      </DialogActions>
    </DialogShell>
  );
}
