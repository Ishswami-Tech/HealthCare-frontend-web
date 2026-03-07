"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { useCurrentClinic, useUpdateClinic } from "@/hooks/query/useClinics";
import { useDoctors } from "@/hooks/query/useDoctors";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import type { Clinic, UpdateClinicData } from "@/types/clinic.types";

type DayKey = "monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"|"sunday";
type Session = { start: string; end: string };
type DoctorCtrl = { isPaused: boolean; pauseReason: string; generalConsultationEnabled: boolean; videoConsultationEnabled: boolean; emergencyOnly: boolean };
type ClinicForm = { name: string; address: string; city: string; state: string; country: string; zipCode: string; phone: string; email: string; website: string; description: string; timezone: string; currency: string; language: string; operatingHours: string };
type SettingsForm = { appointmentDuration: number; maxAdvanceBooking: number; minAdvanceBooking: number; cancellationWindow: number; noShowWindowMinutes: number; noShowFee: number; cancellationFee: number; allowRescheduling: boolean; allowCancellation: boolean; autoConfirmation: boolean; walkInAllowed: boolean; emailNotifications: boolean; smsNotifications: boolean; pushNotifications: boolean; appointmentReminders: boolean; cancellationAlerts: boolean; paymentMethodsText: string; autoBilling: boolean; clinicPaused: boolean; pauseReason: string; generalConsultationEnabled: boolean; videoConsultationEnabled: boolean; emergencyOnly: boolean };

const DAYS: DayKey[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
const DAY_LABEL: Record<DayKey, string> = { monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday" };
const defaultSessions = (): Record<DayKey, Session[]> => ({ monday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], tuesday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], wednesday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], thursday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], friday:[{start:"11:00",end:"14:00"},{start:"16:00",end:"20:00"}], saturday:[{start:"11:00",end:"14:00"}], sunday:[] });
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const toNumber = (v: unknown, fb: number) => Number.isFinite(Number(v)) ? Number(v) : fb;
const normalizeTime = (v: unknown, fb: string) => typeof v === "string" && /^([01]\d|2[0-3]):([0-5]\d)$/.test(v.trim()) ? v.trim() : fb;
const parseSessions = (v: unknown): Session[] => Array.isArray(v) ? v.map(x => isRecord(x) ? ({ start: normalizeTime(x.start,"11:00"), end: normalizeTime(x.end,"14:00") }) : null).filter((x): x is Session => !!x) : isRecord(v) ? [{ start: normalizeTime(v.start,"11:00"), end: normalizeTime(v.end,"14:00") }] : [];

export default function ClinicAdminSettingsPage() {
  useAuth();
  const { data: clinicData, isPending } = useCurrentClinic();
  const updateClinic = useUpdateClinic();
  const clinic = useMemo(() => clinicData as Clinic | null, [clinicData]);
  const { data: doctorsData } = useDoctors(clinic?.id || "");
  const doctors = useMemo(() => {
    const raw = doctorsData as unknown;
    const arr = Array.isArray(raw) ? raw : isRecord(raw) && Array.isArray(raw.data) ? raw.data : isRecord(raw) && isRecord(raw.data) && Array.isArray(raw.data.doctors) ? raw.data.doctors : [];
    return arr.map((d: any) => ({ id: d?.doctor?.id || d?.id || "", name: d?.name || "Doctor" })).filter((x: any) => !!x.id);
  }, [doctorsData]);

  const [ready, setReady] = useState(false);
  const [clinicForm, setClinicForm] = useState<ClinicForm>({ name:"",address:"",city:"",state:"",country:"India",zipCode:"",phone:"",email:"",website:"",description:"",timezone:"Asia/Kolkata",currency:"INR",language:"en",operatingHours:"Mon-Sun multi-session OPD" });
  const [settings, setSettings] = useState<SettingsForm>({ appointmentDuration:30,maxAdvanceBooking:30,minAdvanceBooking:2,cancellationWindow:24,noShowWindowMinutes:15,noShowFee:0,cancellationFee:0,allowRescheduling:true,allowCancellation:true,autoConfirmation:true,walkInAllowed:true,emailNotifications:true,smsNotifications:true,pushNotifications:false,appointmentReminders:true,cancellationAlerts:true,paymentMethodsText:"Cash, Card, UPI",autoBilling:false,clinicPaused:false,pauseReason:"",generalConsultationEnabled:true,videoConsultationEnabled:true,emergencyOnly:false });
  const [sessions, setSessions] = useState<Record<DayKey, Session[]>>(defaultSessions());
  const [doctorCtrl, setDoctorCtrl] = useState<Record<string, DoctorCtrl>>({});

  useEffect(() => {
    if (!clinic || ready) return;
    const base = isRecord(clinic.settings) ? clinic.settings : {};
    const appt = isRecord(base.appointmentSettings) ? base.appointmentSettings : {};
    const notif = isRecord(base.notifications) ? base.notifications : {};
    const notifSet = isRecord(base.notificationSettings) ? base.notificationSettings : {};
    const pay = isRecord(base.paymentSettings) ? base.paymentSettings : {};
    const policy = isRecord(base.customPolicies) ? base.customPolicies : {};
    const opd = isRecord(appt.opdControls) ? appt.opdControls : isRecord(appt.opdControl) ? appt.opdControl : {};
    const docMap = isRecord(appt.doctorConsultationControls) ? appt.doctorConsultationControls : {};
    const dayWin = isRecord(appt.operatingWindowsByDay) ? appt.operatingWindowsByDay : {};
    const parsed = defaultSessions(); DAYS.forEach(d => { if (dayWin[d] !== undefined) parsed[d] = parseSessions(dayWin[d]); });
    const mapped: Record<string, DoctorCtrl> = {};
    Object.entries(docMap).forEach(([id,v]) => { if (isRecord(v)) mapped[id] = { isPaused: Boolean(v.isPaused ?? v.paused ?? false), pauseReason: typeof v.pauseReason==="string"?v.pauseReason:"", generalConsultationEnabled: Boolean(v.generalConsultationEnabled ?? true), videoConsultationEnabled: Boolean(v.videoConsultationEnabled ?? true), emergencyOnly: Boolean(v.emergencyOnly ?? false) }; });
    setClinicForm({ name: clinic.name||"", address: clinic.address||"", city: (clinic as any).city||"", state: (clinic as any).state||"", country: (clinic as any).country||"India", zipCode: (clinic as any).zipCode||"", phone: clinic.phone||"", email: clinic.email||"", website: clinic.website||"", description: clinic.description||"", timezone: clinic.timezone||"Asia/Kolkata", currency: clinic.currency||"INR", language: clinic.language||"en", operatingHours: clinic.operatingHours||"Mon-Sun multi-session OPD" });
    setSettings({ appointmentDuration: toNumber(appt.appointmentDuration,30), maxAdvanceBooking: toNumber(appt.maxAdvanceBooking,30), minAdvanceBooking: toNumber(appt.minAdvanceBooking,2), cancellationWindow: toNumber(appt.cancellationWindow,24), noShowWindowMinutes: toNumber(appt.noShowWindowMinutes,15), noShowFee: toNumber(policy.noShowFee,0), cancellationFee: toNumber(policy.cancellationFee,0), allowRescheduling: typeof appt.allowRescheduling==="boolean"?appt.allowRescheduling:true, allowCancellation: typeof appt.allowCancellation==="boolean"?appt.allowCancellation:true, autoConfirmation: typeof appt.autoConfirmation==="boolean"?appt.autoConfirmation:true, walkInAllowed: typeof appt.walkInAllowed==="boolean"?appt.walkInAllowed:true, emailNotifications: typeof notif.email==="boolean"?notif.email:typeof notifSet.emailNotifications==="boolean"?notifSet.emailNotifications:true, smsNotifications: typeof notif.sms==="boolean"?notif.sms:typeof notifSet.smsNotifications==="boolean"?notifSet.smsNotifications:true, pushNotifications: typeof notif.push==="boolean"?notif.push:typeof notifSet.pushNotifications==="boolean"?notifSet.pushNotifications:false, appointmentReminders: typeof notifSet.appointmentReminders==="boolean"?notifSet.appointmentReminders:true, cancellationAlerts: typeof notifSet.cancellationAlerts==="boolean"?notifSet.cancellationAlerts:true, paymentMethodsText: Array.isArray(pay.paymentMethods)?pay.paymentMethods.join(", "):"Cash, Card, UPI", autoBilling: typeof pay.autoBilling==="boolean"?pay.autoBilling:false, clinicPaused: Boolean(opd.isOpdPaused ?? opd.clinicPaused ?? false), pauseReason: typeof opd.pauseReason==="string"?opd.pauseReason:"", generalConsultationEnabled: Boolean(opd.generalConsultationEnabled ?? true), videoConsultationEnabled: Boolean(opd.videoConsultationEnabled ?? true), emergencyOnly: Boolean(opd.emergencyOnly ?? false) });
    setSessions(parsed); setDoctorCtrl(mapped); setReady(true);
  }, [clinic, ready]);

  useEffect(() => { if (doctors.length===0) return; setDoctorCtrl(prev => { const n={...prev}; doctors.forEach((d:any)=>{ if(!n[d.id]) n[d.id]={ isPaused:false,pauseReason:"",generalConsultationEnabled:true,videoConsultationEnabled:true,emergencyOnly:false }; }); return n; }); }, [doctors]);

  const save = async () => {
    if (!clinic?.id) return;
    const base = isRecord(clinic.settings) ? clinic.settings : {};
    const appt = isRecord(base.appointmentSettings) ? base.appointmentSettings : {};
    const notif = isRecord(base.notifications) ? base.notifications : {};
    const notifSet = isRecord(base.notificationSettings) ? base.notificationSettings : {};
    const pay = isRecord(base.paymentSettings) ? base.paymentSettings : {};
    const policy = isRecord(base.customPolicies) ? base.customPolicies : {};
    const paymentMethods = settings.paymentMethodsText.split(",").map(x=>x.trim()).filter(Boolean);
    const payload: UpdateClinicData = {
      name: clinicForm.name.trim(), address: clinicForm.address.trim(), city: clinicForm.city.trim(), state: clinicForm.state.trim(), country: clinicForm.country.trim(), zipCode: clinicForm.zipCode.trim(), phone: clinicForm.phone.trim(), email: clinicForm.email.trim(), website: clinicForm.website.trim(), description: clinicForm.description.trim(), timezone: clinicForm.timezone.trim() || "Asia/Kolkata", currency: clinicForm.currency.trim() || "INR", language: clinicForm.language.trim() || "en", operatingHours: clinicForm.operatingHours.trim(),
      settings: {
        ...base,
        appointmentSettings: { ...appt, appointmentDuration: settings.appointmentDuration, maxAdvanceBooking: settings.maxAdvanceBooking, minAdvanceBooking: settings.minAdvanceBooking, cancellationWindow: settings.cancellationWindow, noShowWindowMinutes: settings.noShowWindowMinutes, allowRescheduling: settings.allowRescheduling, allowCancellation: settings.allowCancellation, autoConfirmation: settings.autoConfirmation, walkInAllowed: settings.walkInAllowed, operatingWindowsByDay: sessions, dailyOperatingWindow: sessions.monday[0] || { start:"11:00", end:"14:00" }, opdControls: { isOpdPaused: settings.clinicPaused, pauseReason: settings.pauseReason.trim(), generalConsultationEnabled: settings.generalConsultationEnabled, videoConsultationEnabled: settings.videoConsultationEnabled, emergencyOnly: settings.emergencyOnly }, doctorConsultationControls: doctorCtrl },
        notificationSettings: { ...notifSet, appointmentReminders: settings.appointmentReminders, cancellationAlerts: settings.cancellationAlerts, emailNotifications: settings.emailNotifications, smsNotifications: settings.smsNotifications, pushNotifications: settings.pushNotifications },
        notifications: { ...notif, email: settings.emailNotifications, sms: settings.smsNotifications, push: settings.pushNotifications },
        paymentSettings: { ...pay, currency: clinicForm.currency.trim() || "INR", paymentMethods, autoBilling: settings.autoBilling },
        customPolicies: { ...policy, noShowFee: settings.noShowFee, cancellationFee: settings.cancellationFee },
      },
    };
    await updateClinic.mutateAsync({ id: clinic.id, data: payload });
  };

  const setSF = (k: keyof SettingsForm, v: string|number|boolean) => setSettings(p => ({ ...p, [k]: v as never }));
  const setCF = (k: keyof ClinicForm, v: string) => setClinicForm(p => ({ ...p, [k]: v }));
  const addSession = (d: DayKey) => setSessions(p => ({ ...p, [d]: [...p[d], { start:"16:00", end:"20:00" }] }));
  const updSession = (d: DayKey, i: number, k: "start"|"end", v: string) => setSessions(p => ({ ...p, [d]: p[d].map((s,idx)=>idx===i?{...s,[k]:v}:s) }));
  const delSession = (d: DayKey, i: number) => setSessions(p => ({ ...p, [d]: p[d].filter((_,idx)=>idx!==i) }));
  const updDoc = (id: string, k: keyof DoctorCtrl, v: string|boolean) => setDoctorCtrl(p => {
    const current: DoctorCtrl = p[id] || { isPaused:false, pauseReason:"", generalConsultationEnabled:true, videoConsultationEnabled:true, emergencyOnly:false };
    return { ...p, [id]: { ...current, [k]: v as never } };
  });

  if (isPending || !ready) return <div className="p-6 flex items-center justify-center min-h-[420px]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!clinic?.id) return <div className="p-6"><Card><CardHeader><CardTitle>Clinic Settings</CardTitle><CardDescription>Clinic context is not available.</CardDescription></CardHeader></Card></div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl sm:text-3xl font-bold">Clinic Settings</h1><p className="text-sm text-muted-foreground mt-1">Dynamic OPD sessions + emergency + doctor-wise controls.</p></div>
        <Button className="w-full sm:w-auto" onClick={save} disabled={updateClinic.isPending}>{updateClinic.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}Save Changes</Button>
      </div>

      <Card><CardHeader><CardTitle>Clinic Profile</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Clinic Name</Label><Input value={clinicForm.name} onChange={e=>setCF("name",e.target.value)} /></div><div><Label>Phone</Label><Input value={clinicForm.phone} onChange={e=>setCF("phone",e.target.value)} /></div>
        <div><Label>Email</Label><Input value={clinicForm.email} onChange={e=>setCF("email",e.target.value)} /></div><div><Label>Website</Label><Input value={clinicForm.website} onChange={e=>setCF("website",e.target.value)} /></div>
        <div><Label>City</Label><Input value={clinicForm.city} onChange={e=>setCF("city",e.target.value)} /></div><div><Label>State</Label><Input value={clinicForm.state} onChange={e=>setCF("state",e.target.value)} /></div>
        <div><Label>Country</Label><Input value={clinicForm.country} onChange={e=>setCF("country",e.target.value)} /></div><div><Label>Zip Code</Label><Input value={clinicForm.zipCode} onChange={e=>setCF("zipCode",e.target.value)} /></div>
        <div className="md:col-span-2"><Label>Address</Label><Textarea value={clinicForm.address} onChange={e=>setCF("address",e.target.value)} /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Dynamic OPD Sessions</CardTitle><CardDescription>Add multiple sessions per day.</CardDescription></CardHeader><CardContent className="space-y-3">
        {DAYS.map(d => <div key={d} className="border rounded-md p-3 space-y-2"><div className="flex items-center justify-between"><p className="font-medium text-sm">{DAY_LABEL[d]}</p><Button type="button" variant="outline" size="sm" onClick={()=>addSession(d)}><Plus className="h-3 w-3 mr-1" />Add Session</Button></div>{sessions[d].length===0?<p className="text-xs text-muted-foreground">Closed</p>:sessions[d].map((s,i)=><div key={`${d}-${i}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 items-end"><div><Label className="text-xs">Start</Label><Input type="time" value={s.start} onChange={e=>updSession(d,i,"start",e.target.value)} /></div><div><Label className="text-xs">End</Label><Input type="time" value={s.end} onChange={e=>updSession(d,i,"end",e.target.value)} /></div><Button type="button" variant="outline" size="icon" onClick={()=>delSession(d,i)}><Trash2 className="h-4 w-4" /></Button></div>)}</div>)}
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Emergency / OPD Controls</CardTitle></CardHeader><CardContent className="space-y-3">
        <div className="flex items-center justify-between border rounded-md p-3"><Label>Pause Clinic OPD</Label><Switch checked={settings.clinicPaused} onCheckedChange={v=>setSF("clinicPaused",v)} /></div>
        <div><Label>Pause Reason</Label><Input value={settings.pauseReason} onChange={e=>setSF("pauseReason",e.target.value)} /></div>
        <div className="flex items-center justify-between border rounded-md p-3"><Label>General Consultation Enabled</Label><Switch checked={settings.generalConsultationEnabled} onCheckedChange={v=>setSF("generalConsultationEnabled",v)} /></div>
        <div className="flex items-center justify-between border rounded-md p-3"><Label>Video Consultation Enabled</Label><Switch checked={settings.videoConsultationEnabled} onCheckedChange={v=>setSF("videoConsultationEnabled",v)} /></div>
        <div className="flex items-center justify-between border rounded-md p-3"><Label>Emergency Only Mode</Label><Switch checked={settings.emergencyOnly} onCheckedChange={v=>setSF("emergencyOnly",v)} /></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Doctor-Wise Controls</CardTitle></CardHeader><CardContent className="space-y-3">
        {doctors.length===0 ? <p className="text-sm text-muted-foreground">No doctors found.</p> : doctors.map((d:any)=>{ const c=doctorCtrl[d.id]; if(!c) return null; return <div key={d.id} className="border rounded-md p-3 space-y-2"><p className="font-medium">{d.name}</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><div className="flex items-center justify-between border rounded-md p-2"><Label className="text-sm">Pause Doctor</Label><Switch checked={c.isPaused} onCheckedChange={v=>updDoc(d.id,"isPaused",v)} /></div><div className="flex items-center justify-between border rounded-md p-2"><Label className="text-sm">General Enabled</Label><Switch checked={c.generalConsultationEnabled} onCheckedChange={v=>updDoc(d.id,"generalConsultationEnabled",v)} /></div><div className="flex items-center justify-between border rounded-md p-2"><Label className="text-sm">Video Enabled</Label><Switch checked={c.videoConsultationEnabled} onCheckedChange={v=>updDoc(d.id,"videoConsultationEnabled",v)} /></div><div className="flex items-center justify-between border rounded-md p-2"><Label className="text-sm">Emergency Only</Label><Switch checked={c.emergencyOnly} onCheckedChange={v=>updDoc(d.id,"emergencyOnly",v)} /></div></div><div><Label className="text-xs">Reason</Label><Input value={c.pauseReason} onChange={e=>updDoc(d.id,"pauseReason",e.target.value)} /></div></div>; })}
      </CardContent></Card>
    </div>
  );
}
