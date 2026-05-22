"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import { useDoctors } from "@/hooks/query/useDoctors";
import {
  useAssistantDoctorCoverage,
  useUpdateAssistantDoctorCoverage,
} from "@/hooks/query/useAppointments";
import { useWebSocketQuerySync } from "@/hooks/realtime/useRealTimeQueries";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Empty, EmptyContent, EmptyDescription, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DashboardPageHeader as PatientPageHeader,
  DashboardPageShell as PatientPageShell,
} from "@/components/dashboard/DashboardPageShell";
import { OperatingWindowsEditor } from "@/components/dashboard/OperatingWindowsEditor";
import { AlertTriangle, Loader2, Save, Plus, Stethoscope, Trash2, Video, Ban } from "lucide-react";
import { showErrorToast } from "@/hooks/utils/use-toast";
import type {
  Clinic,
  ClinicDoctorConsultationControl,
  ClinicOperatingDayKey,
  ClinicOperatingSession,
  UpdateClinicData,
} from "@/types/clinic.types";
import type { AssistantDoctorCoverageAssignment } from "@/types/appointment.types";

type DoctorListItem = {
  id: string;
  name: string;
  role: string;
};
type AssistantCoverageState = Record<string, AssistantDoctorCoverageAssignment>;
type ClinicForm = { name: string; address: string; city: string; state: string; country: string; zipCode: string; phone: string; email: string; website: string; description: string; timezone: string; currency: string; language: string; operatingHours: string };
type SettingsForm = { appointmentDuration: number; maxAdvanceBooking: number; minAdvanceBooking: number; cancellationWindow: number; videoCallWindowStart: string; videoCallWindowEnd: string; noShowWindowMinutes: number; noShowFee: number; cancellationFee: number; allowRescheduling: boolean; allowCancellation: boolean; autoConfirmation: boolean; walkInAllowed: boolean; emailNotifications: boolean; smsNotifications: boolean; pushNotifications: boolean; appointmentReminders: boolean; cancellationAlerts: boolean; paymentMethodsText: string; autoBilling: boolean; clinicPaused: boolean; pauseReason: string; generalConsultationEnabled: boolean; videoConsultationEnabled: boolean; emergencyOnly: boolean };

const DAYS: ClinicOperatingDayKey[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABEL: Record<ClinicOperatingDayKey, string> = { monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday" };
const defaultSessions = (): Record<ClinicOperatingDayKey, ClinicOperatingSession[]> => ({ monday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], tuesday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], wednesday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], thursday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], friday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], saturday:[{start:"11:00",end:"14:00"}], sunday:[] });
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const toNumber = (v: unknown, fb: number) => Number.isFinite(Number(v)) ? Number(v) : fb;
const normalizeTime = (v: unknown, fb: string) => typeof v === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(v.trim()) ? v.trim() : fb;
const parseSessions = (v: unknown): ClinicOperatingSession[] => Array.isArray(v) ? v.map(x => isRecord(x) ? ({ start: normalizeTime(x.start,"11:00"), end: normalizeTime(x.end,"14:00") }) : null).filter((x): x is ClinicOperatingSession => !!x) : isRecord(v) ? [{ start: normalizeTime(v.start,"11:00"), end: normalizeTime(v.end,"14:00") }] : [];
const FORM_FIELD_CLASS = "gap-y-2";
const FORM_INPUT_CLASS = "h-10";
const TIME_INPUT_CLASS =
  "h-10 w-full min-w-0 rounded-md border border-indigo-200 bg-white px-3 text-sm font-medium leading-none tabular-nums shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-indigo-400 focus-visible:ring-2 focus-visible:ring-indigo-200/70 dark:border-indigo-900/70 dark:bg-background [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-hour-field]:px-0.5 [&::-webkit-datetime-edit-minute-field]:px-0.5 [&::-webkit-datetime-edit-ampm-field]:px-1";
const COMPACT_CARD_PADDING = "gap-4 py-4";
const COMPACT_CARD_HEADER = "px-4 sm:px-5";
const COMPACT_CARD_CONTENT = "px-4 sm:px-5";
const PROFILE_CARD_CLASS = `${COMPACT_CARD_PADDING} border-emerald-200 bg-emerald-50/70 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/20`;
const BOOKING_CARD_CLASS = `${COMPACT_CARD_PADDING} border-sky-200 bg-sky-50/70 shadow-sm dark:border-sky-900/70 dark:bg-sky-950/20`;
const OPD_CARD_CLASS = `${COMPACT_CARD_PADDING} border-indigo-200 bg-indigo-50/70 shadow-sm dark:border-indigo-900/70 dark:bg-indigo-950/20`;
const ALERT_CARD_CLASS = `${COMPACT_CARD_PADDING} border-amber-200 bg-amber-50/70 shadow-sm dark:border-amber-900/70 dark:bg-amber-950/20`;
const NOTIFY_CARD_CLASS = `${COMPACT_CARD_PADDING} border-violet-200 bg-violet-50/70 shadow-sm dark:border-violet-900/70 dark:bg-violet-950/20`;
const BILLING_CARD_CLASS = `${COMPACT_CARD_PADDING} border-teal-200 bg-teal-50/70 shadow-sm dark:border-teal-900/70 dark:bg-teal-950/20`;
const DOCTOR_CARD_CLASS = `${COMPACT_CARD_PADDING} border-blue-200 bg-blue-50/70 shadow-sm dark:border-blue-900/70 dark:bg-blue-950/20`;
const ASSISTANT_CARD_CLASS = `${COMPACT_CARD_PADDING} border-fuchsia-200 bg-fuchsia-50/70 shadow-sm dark:border-fuchsia-900/70 dark:bg-fuchsia-950/20`;
const timeToMinutes = (value: string) => {
  const [hoursPart = "0", minutesPart = "0"] = value.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
};
const formatMinutes = (value: number) => {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60).toString().padStart(2, "0");
  const minutes = (normalized % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

function SettingField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${FORM_FIELD_CLASS} ${className}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <div className="min-w-0 gap-y-1">
        <Label className="text-sm leading-5">{label}</Label>
        {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function IconTableHead({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-7 w-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
          {children}
          <span className="sr-only">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function TimeInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <Input
      type="time"
      className={TIME_INPUT_CLASS}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={label}
    />
  );
}

function omitAssistantCoverage(value: unknown): Record<string, unknown> {
  const record = isRecord(value) ? value : {};
  const { assistantDoctorCoverage: _assistantDoctorCoverage, ...rest } = record;
  return rest;
}

export default function ClinicAdminSettingsPage() {
  useAuth();
  useWebSocketQuerySync();
  const { data: clinicData, isPending } = useCurrentClinic();
  const updateClinic = useUpdateClinic();
  const { data: assistantCoverageData = [] } = useAssistantDoctorCoverage();
  const updateAssistantCoverageMutation = useUpdateAssistantDoctorCoverage();
  const clinic = useMemo(() => clinicData as Clinic | null, [clinicData]);
  const { data: doctorsData } = useDoctors(clinic?.id || "");
  const doctors = useMemo<DoctorListItem[]>(() => {
    const raw = doctorsData as unknown;
    const arr = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.data) ? raw.data : isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.doctors) ? raw.data.doctors : [];
    return arr.map((doctorValue) => {
      const doctorRecord = isRecord(doctorValue) ? doctorValue : {};
      const nestedDoctor = isRecord(doctorRecord.doctor) ? doctorRecord.doctor : {};
      const nestedUser = isRecord(nestedDoctor.user) ? nestedDoctor.user : {};
      return {
        id: String(nestedDoctor.id ?? doctorRecord.id ?? ""),
        name: String(doctorRecord.name ?? nestedUser.name ?? "Doctor"),
        role: String(doctorRecord.role ?? nestedUser.role ?? "").toUpperCase(),
      };
    }).filter((doctor) => !!doctor.id);
  }, [doctorsData]);
  const primaryDoctors = useMemo(() => doctors.filter((doctor) => doctor.role === "DOCTOR"), [doctors]);
  const assistantDoctors = useMemo(() => doctors.filter((doctor) => doctor.role === "ASSISTANT_DOCTOR"), [doctors]);

  const [ready, setReady] = useState(false);
  const [clinicForm, setClinicForm] = useState<ClinicForm>({ name:"",address:"",city:"",state:"",country:"India",zipCode:"",phone:"",email:"",website:"",description:"",timezone:"Asia/Kolkata",currency:"INR",language:"en",operatingHours:"Mon-Sun multi-session OPD" });
  const [settings, setSettings] = useState<SettingsForm>({ appointmentDuration:30,maxAdvanceBooking:30,minAdvanceBooking:2,cancellationWindow:24,videoCallWindowStart:"10:00",videoCallWindowEnd:"14:00",noShowWindowMinutes:15,noShowFee:0,cancellationFee:0,allowRescheduling:true,allowCancellation:true,autoConfirmation:true,walkInAllowed:true,emailNotifications:true,smsNotifications:true,pushNotifications:false,appointmentReminders:true,cancellationAlerts:true,paymentMethodsText:"Cash, Card, UPI",autoBilling:false,clinicPaused:false,pauseReason:"",generalConsultationEnabled:true,videoConsultationEnabled:true,emergencyOnly:false });
  const [sessions, setSessions] = useState<Record<ClinicOperatingDayKey, ClinicOperatingSession[]>>(() => defaultSessions());
  const [doctorCtrl, setDoctorCtrl] = useState<Record<string, ClinicDoctorConsultationControl>>({});
  const [assistantCoverage, setAssistantCoverage] = useState<AssistantCoverageState>({});
  const videoCallPreview = useMemo(() => {
    const start = settings.videoCallWindowStart.trim();
    const end = settings.videoCallWindowEnd.trim();
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    const slotDuration = Math.max(1, settings.appointmentDuration);
    const validTimes =
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(start) && /^([01]\d|2[0-3]):([0-5]\d)$/.test(end) && startMinutes < endMinutes;
    const totalMinutes = validTimes ? endMinutes - startMinutes : 0;
    const slotCount = validTimes ? Math.floor(totalMinutes / slotDuration) : 0;

    return {
      valid: validTimes && slotCount > 0,
      slotCount,
      start,
      end,
      slotDuration,
      label: validTimes
        ? `${formatMinutes(startMinutes)} to ${formatMinutes(endMinutes)}`
        : "Enter a valid same-day time window",
      note:
        validTimes && slotCount > 0
          ? `${slotCount} ${slotCount === 1 ? "slot" : "slots"} of ${slotDuration} minutes fit inside this window.`
          : "The end time must be after the start time and the window must be long enough for one video slot.",
    };
  }, [settings.appointmentDuration, settings.videoCallWindowEnd, settings.videoCallWindowStart]);

  useEffect(() => {
    if (!clinic || ready) return;
    const base = isRecord(clinic.settings) ? clinic.settings : {};
    const appt = omitAssistantCoverage(base.appointmentSettings);
    const notif = isRecord(base.notifications) ? base.notifications : {};
    const notifSet = isRecord(base.notificationSettings) ? base.notificationSettings : {};
    const pay = isRecord(base.paymentSettings) ? base.paymentSettings : {};
    const policy = isRecord(base.customPolicies) ? base.customPolicies : {};
    const opd = isRecord(appt.opdControls) ? appt.opdControls : isRecord(appt.opdControl) ? appt.opdControl : {};
    const docMap = isRecord(appt.doctorConsultationControls) ? appt.doctorConsultationControls : {};
    const dayWin = isRecord(appt.operatingWindowsByDay) ? appt.operatingWindowsByDay : {};
    const parsed = defaultSessions(); DAYS.forEach(d => { if (dayWin[d] !== undefined) parsed[d] = parseSessions(dayWin[d]); });
    const mapped: Record<string, ClinicDoctorConsultationControl> = {};
    Object.entries(docMap).forEach(([id,v]) => { if (isRecord(v)) mapped[id] = { isPaused: Boolean(v.isPaused ?? v.paused ?? false), pauseReason: typeof v.pauseReason==="string"?v.pauseReason:"", generalConsultationEnabled: Boolean(v.generalConsultationEnabled ?? true), videoConsultationEnabled: Boolean(v.videoConsultationEnabled ?? true), emergencyOnly: Boolean(v.emergencyOnly ?? false) }; });
    const newClinicForm: ClinicForm = { name: clinic.name||"", address: clinic.address||"", city: (clinic as any).city||"", state: (clinic as any).state||"", country: (clinic as any).country||"India", zipCode: (clinic as any).zipCode||"", phone: clinic.phone||"", email: clinic.email||"", website: clinic.website||"", description: clinic.description||"", timezone: clinic.timezone||"Asia/Kolkata", currency: clinic.currency||"INR", language: clinic.language||"en", operatingHours: clinic.operatingHours||"Mon-Sun multi-session OPD" };
    const newSettings: SettingsForm = { appointmentDuration: toNumber(appt.appointmentDuration,30), maxAdvanceBooking: toNumber(appt.maxAdvanceBooking,30), minAdvanceBooking: toNumber(appt.minAdvanceBooking,2), cancellationWindow: toNumber(appt.cancellationWindow,24), videoCallWindowStart: normalizeTime(isRecord(appt.videoCallWindow) ? appt.videoCallWindow.start : undefined, "10:00"), videoCallWindowEnd: normalizeTime(isRecord(appt.videoCallWindow) ? appt.videoCallWindow.end : undefined, "14:00"), noShowWindowMinutes: toNumber(appt.noShowWindowMinutes,15), noShowFee: toNumber(policy.noShowFee,0), cancellationFee: toNumber(policy.cancellationFee,0), allowRescheduling: typeof appt.allowRescheduling==="boolean"?appt.allowRescheduling:true, allowCancellation: typeof appt.allowCancellation==="boolean"?appt.allowCancellation:true, autoConfirmation: typeof appt.autoConfirmation==="boolean"?appt.autoConfirmation:true, walkInAllowed: typeof appt.walkInAllowed==="boolean"?appt.walkInAllowed:true, emailNotifications: typeof notif.email==="boolean"?notif.email:typeof notifSet.emailNotifications==="boolean"?notifSet.emailNotifications:true, smsNotifications: typeof notif.sms==="boolean"?notif.sms:typeof notifSet.smsNotifications==="boolean"?notifSet.smsNotifications:true, pushNotifications: typeof notif.push==="boolean"?notif.push:typeof notifSet.pushNotifications==="boolean"?notifSet.pushNotifications:false, appointmentReminders: typeof notifSet.appointmentReminders==="boolean"?notifSet.appointmentReminders:true, cancellationAlerts: typeof notifSet.cancellationAlerts==="boolean"?notifSet.cancellationAlerts:true, paymentMethodsText: Array.isArray(pay.paymentMethods)?pay.paymentMethods.join(", "):"Cash, Card, UPI", autoBilling: typeof pay.autoBilling==="boolean"?pay.autoBilling:false, clinicPaused: Boolean(opd.isOpdPaused ?? opd.clinicPaused ?? false), pauseReason: typeof opd.pauseReason==="string"?opd.pauseReason:"", generalConsultationEnabled: Boolean(opd.generalConsultationEnabled ?? true), videoConsultationEnabled: Boolean(opd.videoConsultationEnabled ?? true), emergencyOnly: Boolean(opd.emergencyOnly ?? false) };
    setClinicForm(newClinicForm);
    setSettings(newSettings);
    setSessions(parsed);
    setDoctorCtrl(mapped);
    setReady(true);
  }, [clinic, ready]);

  useEffect(() => {
    if (assistantCoverageData.length === 0) return;
    const coverageMap = assistantCoverageData.reduce<AssistantCoverageState>((accumulator, entry) => {
      accumulator[entry.assistantDoctorId] = {
        assistantDoctorId: entry.assistantDoctorId,
        primaryDoctorIds: entry.primaryDoctorIds,
        isActive: entry.isActive,
      };
      return accumulator;
    }, {});
    setAssistantCoverage((current) => ({ ...current, ...coverageMap }));
  }, [assistantCoverageData]);

  useEffect(() => { if (doctors.length===0) return; setDoctorCtrl(prev => { const n={...prev}; doctors.forEach((doctor)=>{ if(!n[doctor.id]) n[doctor.id]={ isPaused:false,pauseReason:"",generalConsultationEnabled:true,videoConsultationEnabled:true,emergencyOnly:false }; }); return n; }); }, [doctors]);
  useEffect(() => {
    if (assistantDoctors.length===0) return;
    setAssistantCoverage(prev => {
      const next = { ...prev };
      assistantDoctors.forEach((doctor) => {
        if (!next[doctor.id]) {
          next[doctor.id] = { assistantDoctorId: doctor.id, primaryDoctorIds: [], isActive: false };
        }
      });
      return next;
    });
  }, [assistantDoctors]);

  const save = async () => {
    if (!clinic?.id) return;
    if (!videoCallPreview.valid) {
      showErrorToast(videoCallPreview.note);
      return;
    }
    const base = isRecord(clinic.settings) ? clinic.settings : {};
    const appt = omitAssistantCoverage(base.appointmentSettings);
    const notif = isRecord(base.notifications) ? base.notifications : {};
    const notifSet = isRecord(base.notificationSettings) ? base.notificationSettings : {};
    const pay = isRecord(base.paymentSettings) ? base.paymentSettings : {};
    const policy = isRecord(base.customPolicies) ? base.customPolicies : {};
    const paymentMethods = settings.paymentMethodsText.split(",").map(x=>x.trim()).filter(Boolean);
    const payload: UpdateClinicData = {
      name: clinicForm.name.trim(), address: clinicForm.address.trim(), city: clinicForm.city.trim(), state: clinicForm.state.trim(), country: clinicForm.country.trim(), zipCode: clinicForm.zipCode.trim(), phone: clinicForm.phone.trim(), email: clinicForm.email.trim(), website: clinicForm.website.trim(), description: clinicForm.description.trim(), timezone: clinicForm.timezone.trim() || "Asia/Kolkata", currency: clinicForm.currency.trim() || "INR", language: clinicForm.language.trim() || "en", operatingHours: clinicForm.operatingHours.trim(),
      settings: {
        ...base,
        appointmentSettings: { ...appt, appointmentDuration: settings.appointmentDuration, maxAdvanceBooking: settings.maxAdvanceBooking, minAdvanceBooking: settings.minAdvanceBooking, cancellationWindow: settings.cancellationWindow, videoCallWindow: { start: settings.videoCallWindowStart, end: settings.videoCallWindowEnd }, noShowWindowMinutes: settings.noShowWindowMinutes, allowRescheduling: settings.allowRescheduling, allowCancellation: settings.allowCancellation, autoConfirmation: settings.autoConfirmation, walkInAllowed: settings.walkInAllowed, operatingWindowsByDay: sessions, dailyOperatingWindow: sessions.monday[0] || { start:"11:00", end:"14:00" }, opdControls: { isOpdPaused: settings.clinicPaused, pauseReason: settings.pauseReason.trim(), generalConsultationEnabled: settings.generalConsultationEnabled, videoConsultationEnabled: settings.videoConsultationEnabled, emergencyOnly: settings.emergencyOnly }, doctorConsultationControls: doctorCtrl },
        notificationSettings: { ...notifSet, appointmentReminders: settings.appointmentReminders, cancellationAlerts: settings.cancellationAlerts, emailNotifications: settings.emailNotifications, smsNotifications: settings.smsNotifications, pushNotifications: settings.pushNotifications },
        notifications: { ...notif, email: settings.emailNotifications, sms: settings.smsNotifications, push: settings.pushNotifications },
        paymentSettings: { ...pay, currency: clinicForm.currency.trim() || "INR", paymentMethods, autoBilling: settings.autoBilling },
        customPolicies: { ...policy, noShowFee: settings.noShowFee, cancellationFee: settings.cancellationFee },
      },
    };
    await updateClinic.mutateAsync({ id: clinic.id, data: payload });
    const coverageEntries = Object.values(assistantCoverage).map((value) => ({
      assistantDoctorId: value.assistantDoctorId,
      primaryDoctorIds: value.primaryDoctorIds,
      isActive: value.isActive,
    }));
    await updateAssistantCoverageMutation.mutateAsync(coverageEntries);
  };

  const setSF = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setSettings((previous) => ({ ...previous, [key]: value }));
  const setCF = (k: keyof ClinicForm, v: string) => setClinicForm(p => ({ ...p, [k]: v }));
  const addSession = (d: ClinicOperatingDayKey) => setSessions(p => ({ ...p, [d]: [...p[d], { start:"16:00", end:"20:00" }] }));
  const updSession = (d: ClinicOperatingDayKey, i: number, k: "start"|"end", v: string) => setSessions(p => ({ ...p, [d]: p[d].map((s,idx)=>idx===i?{...s,[k]:v}:s) }));
  const delSession = (d: ClinicOperatingDayKey, i: number) => setSessions(p => ({ ...p, [d]: p[d].filter((_,idx)=>idx!==i) }));
  const updDoc = (id: string, k: keyof ClinicDoctorConsultationControl, v: string|boolean) => setDoctorCtrl(p => {
    const current: ClinicDoctorConsultationControl = p[id] || { isPaused:false, pauseReason:"", generalConsultationEnabled:true, videoConsultationEnabled:true, emergencyOnly:false };
    return { ...p, [id]: { ...current, [k]: v as never } };
  });
  const toggleAssistantPrimaryDoctor = (assistantDoctorId: string, primaryDoctorId: string) =>
    setAssistantCoverage((current) => {
      const existing = current[assistantDoctorId] || { assistantDoctorId, primaryDoctorIds: [], isActive: false };
      const hasDoctor = existing.primaryDoctorIds.includes(primaryDoctorId);
      return {
        ...current,
        [assistantDoctorId]: {
          ...existing,
          assistantDoctorId,
          primaryDoctorIds: hasDoctor
            ? existing.primaryDoctorIds.filter((id) => id !== primaryDoctorId)
            : [...existing.primaryDoctorIds, primaryDoctorId],
        },
      };
    });
  const setAssistantCoverageActive = (assistantDoctorId: string, isActive: boolean) =>
    setAssistantCoverage((current) => ({
      ...current,
      [assistantDoctorId]: {
        ...(current[assistantDoctorId] || { assistantDoctorId, primaryDoctorIds: [] }),
        isActive,
      },
    }));

  const isSaving = updateClinic.isPending || updateAssistantCoverageMutation.isPending;

  if (isPending || !ready) {
    return (
      <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-border bg-card">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      </PatientPageShell>
    );
  }

  if (!clinic?.id) {
    return (
      <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <Card className={PROFILE_CARD_CLASS}>
          <CardHeader>
            <CardTitle>Clinic Settings</CardTitle>
            <CardDescription>Clinic context is not available.</CardDescription>
          </CardHeader>
        </Card>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <PatientPageHeader
        eyebrow="Clinic Admin"
        title="Clinic Settings"
        description="Manage clinic profile, OPD sessions, booking policies, notifications, billing, and doctor controls."
        meta={
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{doctors.length} doctors</span>
            <span className="size-1 rounded-full bg-muted-foreground/50" />
            <span>{assistantDoctors.length} assistant doctors</span>
          </div>
        }
        actions={[
          {
            label: isSaving ? "Saving…" : "Save Changes",
            onClick: save,
            disabled: isSaving,
            icon: isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />,
          },
        ]}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="gap-y-3">
          <Card className={PROFILE_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle>Clinic Profile</CardTitle>
              <CardDescription>Public clinic identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3`}>
            <SettingField label="Clinic Name">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.name} onChange={(e) => setCF("name", e.target.value)} />
            </SettingField>
            <SettingField label="Phone">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.phone} onChange={(e) => setCF("phone", e.target.value)} />
            </SettingField>
            <SettingField label="Email">
              <Input className={FORM_INPUT_CLASS} type="email" value={clinicForm.email} onChange={(e) => setCF("email", e.target.value)} />
            </SettingField>
            <SettingField label="Website">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.website} onChange={(e) => setCF("website", e.target.value)} />
            </SettingField>
            <SettingField label="City">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.city} onChange={(e) => setCF("city", e.target.value)} />
            </SettingField>
            <SettingField label="State">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.state} onChange={(e) => setCF("state", e.target.value)} />
            </SettingField>
            <SettingField label="Country">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.country} onChange={(e) => setCF("country", e.target.value)} />
            </SettingField>
            <SettingField label="Zip Code">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.zipCode} onChange={(e) => setCF("zipCode", e.target.value)} />
            </SettingField>
            <SettingField label="Timezone">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.timezone} onChange={(e) => setCF("timezone", e.target.value)} />
            </SettingField>
            <SettingField label="Language">
              <Input className={FORM_INPUT_CLASS} value={clinicForm.language} onChange={(e) => setCF("language", e.target.value)} />
            </SettingField>
            <SettingField label="Address" className="sm:col-span-2 xl:col-span-3">
              <Textarea className="min-h-20" value={clinicForm.address} onChange={(e) => setCF("address", e.target.value)} />
            </SettingField>
            <SettingField label="Description" className="sm:col-span-2 xl:col-span-3">
              <Textarea className="min-h-20" value={clinicForm.description} onChange={(e) => setCF("description", e.target.value)} />
            </SettingField>
          </CardContent>
        </Card>

        <Card className={OPD_CARD_CLASS}>
          <CardHeader className={COMPACT_CARD_HEADER}>
            <CardTitle>Dynamic OPD Sessions</CardTitle>
            <CardDescription>Add one or more operating sessions per day. Empty days are treated as closed.</CardDescription>
          </CardHeader>
          <CardContent className={COMPACT_CARD_CONTENT}>
            <OperatingWindowsEditor
              sessions={sessions}
              onAddSession={addSession}
              onUpdateSession={updSession}
              onDeleteSession={delSession}
            />
          </CardContent>
        </Card>
        </div>

        <div className="gap-y-3">
          <Card className={BOOKING_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle>Booking Policy</CardTitle>
              <CardDescription>Appointment limits and patient self-service rules.</CardDescription>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-3`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <SettingField label="Duration (minutes)">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.appointmentDuration} onChange={(e) => setSF("appointmentDuration", toNumber(e.target.value, 30))} />
                </SettingField>
                <SettingField label="No-show Window (minutes)">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.noShowWindowMinutes} onChange={(e) => setSF("noShowWindowMinutes", toNumber(e.target.value, 15))} />
                </SettingField>
                <SettingField label="Min Advance Booking (hours)">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.minAdvanceBooking} onChange={(e) => setSF("minAdvanceBooking", toNumber(e.target.value, 2))} />
                </SettingField>
                <SettingField label="Max Advance Booking (days)">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.maxAdvanceBooking} onChange={(e) => setSF("maxAdvanceBooking", toNumber(e.target.value, 30))} />
                </SettingField>
                <SettingField label="Cancellation Window (hours)">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.cancellationWindow} onChange={(e) => setSF("cancellationWindow", toNumber(e.target.value, 24))} />
                </SettingField>
                <SettingField label="Video Call Start">
                  <TimeInput value={settings.videoCallWindowStart} onChange={(value) => setSF("videoCallWindowStart", value)} label="Video call start time" />
                </SettingField>
                <SettingField label="Video Call End">
                  <TimeInput value={settings.videoCallWindowEnd} onChange={(value) => setSF("videoCallWindowEnd", value)} label="Video call end time" />
                </SettingField>
              </div>
              <div
                className={`rounded-xl border px-4 py-3 ${
                  videoCallPreview.valid
                    ? "border-sky-200 bg-sky-50/70 dark:border-sky-900/70 dark:bg-sky-950/20"
                    : "border-amber-200 bg-amber-50/70 dark:border-amber-900/70 dark:bg-amber-950/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold">Video Call Window Preview</p>
                  <span
                    className={`text-xs font-semibold ${
                      videoCallPreview.valid
                        ? "text-sky-700 dark:text-sky-300"
                        : "text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {videoCallPreview.valid ? `${videoCallPreview.slotCount} slots fit` : "Needs adjustment"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {videoCallPreview.label} Â· {videoCallPreview.slotDuration} minute video slots
                </p>
                <p
                  className={`mt-1 text-xs ${
                    videoCallPreview.valid
                      ? "text-sky-700 dark:text-sky-300"
                      : "text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {videoCallPreview.note}
                </p>
              </div>
              <div className="grid gap-2">
                <ToggleRow label="Allow Rescheduling" checked={settings.allowRescheduling} onCheckedChange={(value) => setSF("allowRescheduling", value)} />
                <ToggleRow label="Allow Cancellation" checked={settings.allowCancellation} onCheckedChange={(value) => setSF("allowCancellation", value)} />
                <ToggleRow label="Auto Confirmation" checked={settings.autoConfirmation} onCheckedChange={(value) => setSF("autoConfirmation", value)} />
                <ToggleRow label="Walk-in Allowed" checked={settings.walkInAllowed} onCheckedChange={(value) => setSF("walkInAllowed", value)} />
              </div>
            </CardContent>
          </Card>

          <Card className={ALERT_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle>Emergency / OPD Controls</CardTitle>
              <CardDescription>Temporarily restrict clinic consultations.</CardDescription>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-3`}>
              <ToggleRow label="Pause Clinic OPD" checked={settings.clinicPaused} onCheckedChange={(value) => setSF("clinicPaused", value)} />
              <SettingField label="Pause Reason">
                <Input className={FORM_INPUT_CLASS} value={settings.pauseReason} onChange={(e) => setSF("pauseReason", e.target.value)} />
              </SettingField>
              <ToggleRow label="General Consultation Enabled" checked={settings.generalConsultationEnabled} onCheckedChange={(value) => setSF("generalConsultationEnabled", value)} />
              <ToggleRow label="Video Consultation Enabled" checked={settings.videoConsultationEnabled} onCheckedChange={(value) => setSF("videoConsultationEnabled", value)} />
              <ToggleRow label="Emergency Only Mode" checked={settings.emergencyOnly} onCheckedChange={(value) => setSF("emergencyOnly", value)} />
            </CardContent>
          </Card>

          <Card className={NOTIFY_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Clinic-level appointment notification preferences.</CardDescription>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} grid gap-2`}>
              <ToggleRow label="Email Notifications" checked={settings.emailNotifications} onCheckedChange={(value) => setSF("emailNotifications", value)} />
              <ToggleRow label="SMS Notifications" checked={settings.smsNotifications} onCheckedChange={(value) => setSF("smsNotifications", value)} />
              <ToggleRow label="Push Notifications" checked={settings.pushNotifications} onCheckedChange={(value) => setSF("pushNotifications", value)} />
              <ToggleRow label="Appointment Reminders" checked={settings.appointmentReminders} onCheckedChange={(value) => setSF("appointmentReminders", value)} />
              <ToggleRow label="Cancellation Alerts" checked={settings.cancellationAlerts} onCheckedChange={(value) => setSF("cancellationAlerts", value)} />
            </CardContent>
          </Card>

          <Card className={BILLING_CARD_CLASS}>
            <CardHeader className={COMPACT_CARD_HEADER}>
              <CardTitle>Billing</CardTitle>
              <CardDescription>Payment methods and policy fees.</CardDescription>
            </CardHeader>
            <CardContent className={`${COMPACT_CARD_CONTENT} gap-y-3`}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <SettingField label="Currency">
                  <Input className={FORM_INPUT_CLASS} value={clinicForm.currency} onChange={(e) => setCF("currency", e.target.value)} />
                </SettingField>
                <SettingField label="No-show Fee">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.noShowFee} onChange={(e) => setSF("noShowFee", toNumber(e.target.value, 0))} />
                </SettingField>
                <SettingField label="Cancel Fee">
                  <Input className={FORM_INPUT_CLASS} type="number" value={settings.cancellationFee} onChange={(e) => setSF("cancellationFee", toNumber(e.target.value, 0))} />
                </SettingField>
              </div>
              <SettingField label="Payment Methods">
                <Input className={FORM_INPUT_CLASS} value={settings.paymentMethodsText} onChange={(e) => setSF("paymentMethodsText", e.target.value)} />
              </SettingField>
              <ToggleRow label="Auto Billing" checked={settings.autoBilling} onCheckedChange={(value) => setSF("autoBilling", value)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className={DOCTOR_CARD_CLASS}>
        <CardHeader className={COMPACT_CARD_HEADER}>
          <CardTitle>Doctor-wise Controls</CardTitle>
          <CardDescription>Override consultation availability for individual doctors.</CardDescription>
        </CardHeader>
        <CardContent className={`${COMPACT_CARD_CONTENT}`}>
          {doctors.length === 0 ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <Stethoscope className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No doctors found.</EmptyTitle>
                <EmptyDescription>
                  Add doctors to this clinic to manage their consultation availability here.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="overflow-hidden rounded-lg border border-blue-200 bg-white/80 dark:border-blue-900/70 dark:bg-background/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100/70 hover:bg-blue-100/70 dark:bg-blue-950/30 dark:hover:bg-blue-950/30">
                    <TableHead className="w-[240px] px-3">Doctor</TableHead>
                    <TableHead className="w-[68px] px-2 text-center">
                      <IconTableHead label="Pause Doctor">
                        <Ban className="size-4" />
                      </IconTableHead>
                    </TableHead>
                    <TableHead className="w-[68px] px-2 text-center">
                      <IconTableHead label="General Consultation">
                        <Stethoscope className="size-4" />
                      </IconTableHead>
                    </TableHead>
                    <TableHead className="w-[68px] px-2 text-center">
                      <IconTableHead label="Video Consultation">
                        <Video className="size-4" />
                      </IconTableHead>
                    </TableHead>
                    <TableHead className="w-[68px] px-2 text-center">
                      <IconTableHead label="Emergency Only">
                        <AlertTriangle className="size-4" />
                      </IconTableHead>
                    </TableHead>
                    <TableHead className="min-w-[220px] px-3">Pause Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((doctor) => {
                    const control = doctorCtrl[doctor.id];
                    if (!control) return null;
                    return (
                      <TableRow key={doctor.id} className="hover:bg-blue-50/70 dark:hover:bg-blue-950/20">
                        <TableCell className="px-3">
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.role || "DOCTOR"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 text-center">
                          <Switch checked={control.isPaused} onCheckedChange={(value) => updDoc(doctor.id, "isPaused", value)} aria-label={`Pause ${doctor.name}`} />
                        </TableCell>
                        <TableCell className="px-2 text-center">
                          <Switch checked={control.generalConsultationEnabled} onCheckedChange={(value) => updDoc(doctor.id, "generalConsultationEnabled", value)} aria-label={`General consultation for ${doctor.name}`} />
                        </TableCell>
                        <TableCell className="px-2 text-center">
                          <Switch checked={control.videoConsultationEnabled} onCheckedChange={(value) => updDoc(doctor.id, "videoConsultationEnabled", value)} aria-label={`Video consultation for ${doctor.name}`} />
                        </TableCell>
                        <TableCell className="px-2 text-center">
                          <Switch checked={control.emergencyOnly} onCheckedChange={(value) => updDoc(doctor.id, "emergencyOnly", value)} aria-label={`Emergency only for ${doctor.name}`} />
                        </TableCell>
                        <TableCell className="px-3">
                          <Input className="h-9 w-full min-w-0 md:min-w-[180px]" value={control.pauseReason} onChange={(e) => updDoc(doctor.id, "pauseReason", e.target.value)} placeholder="Optional reason" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className={ASSISTANT_CARD_CLASS}>
        <CardHeader className={COMPACT_CARD_HEADER}>
          <CardTitle>Assistant Doctor Coverage</CardTitle>
          <CardDescription>Choose which primary doctors each assistant doctor can cover at this clinic.</CardDescription>
        </CardHeader>
        <CardContent className={`${COMPACT_CARD_CONTENT} grid grid-cols-1 gap-3 xl:grid-cols-2`}>
          {assistantDoctors.length === 0 ? (
            <Empty>
              <EmptyContent>
                <EmptyMedia>
                  <Plus className="size-5" />
                </EmptyMedia>
                <EmptyTitle>No assistant doctors found.</EmptyTitle>
                <EmptyDescription>
                  Add assistant doctors to manage their coverage for primary doctors.
                </EmptyDescription>
              </EmptyContent>
            </Empty>
          ) : (
            assistantDoctors.map((assistant) => {
              const coverage = assistantCoverage[assistant.id] || { assistantDoctorId: assistant.id, primaryDoctorIds: [], isActive: false };
              return (
                <div key={assistant.id} className="gap-y-2 rounded-lg border border-fuchsia-200 bg-white/80 p-3 dark:border-fuchsia-900/70 dark:bg-background/40">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{assistant.name}</p>
                      <p className="text-xs text-muted-foreground">Assistant coverage for main doctor bookings</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Active</Label>
                      <Switch checked={coverage.isActive} onCheckedChange={(value) => setAssistantCoverageActive(assistant.id, value)} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {primaryDoctors.length === 0 ? (
                      <Empty>
                        <EmptyContent>
                          <EmptyMedia>
                            <Stethoscope className="size-5" />
                          </EmptyMedia>
                          <EmptyTitle>No primary doctors found.</EmptyTitle>
                          <EmptyDescription>
                            Add primary doctors to assign assistant coverage here.
                          </EmptyDescription>
                        </EmptyContent>
                      </Empty>
                    ) : (
                      primaryDoctors.map((doctor) => {
                        const selected = coverage.primaryDoctorIds.includes(doctor.id);
                        return (
                          <Button
                            key={doctor.id}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleAssistantPrimaryDoctor(assistant.id, doctor.id)}
                          >
                            {doctor.name}
                          </Button>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </PatientPageShell>
  );
}



