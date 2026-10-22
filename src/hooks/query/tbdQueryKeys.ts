/**
 * Query-key factory and cache presets for the TestByDoctor screens (B1 – B13).
 * One place for the keys so invalidation after a mutation (approve a draft, regenerate a QR,
 * save vitals) hits the same lists every batch reads. Always pass the clinic id first: lists are
 * clinic scoped. Hooks live in `use<Domain>.ts` files owned by their batch; they import from here.
 */
import { CACHE_TIMES, GC_TIMES } from "./config";

export const tbdKeys = {
  clinicBilling: {
    all: (clinicId: string) => ["clinic-billing", clinicId] as const,
    overview: (clinicId: string, range?: { from?: string; to?: string; locationId?: string }) =>
      ["clinic-billing", clinicId, "overview", range ?? {}] as const,
    invoices: (clinicId: string, filters?: Record<string, unknown>) =>
      ["clinic-billing", clinicId, "invoices", filters ?? {}] as const,
    invoice: (clinicId: string, invoiceId: string) => ["clinic-billing", clinicId, "invoice", invoiceId] as const,
    reminders: (clinicId: string) => ["clinic-billing", clinicId, "reminders"] as const,
  },
  clinicReports: {
    summary: (clinicId: string, range?: Record<string, unknown>) => ["clinic-reports", clinicId, range ?? {}] as const,
  },
  clinicAlerts: (clinicId: string, filters?: Record<string, unknown>) => ["clinic-alerts", clinicId, filters ?? {}] as const,
  roles: (clinicId: string) => ["clinic-roles", clinicId] as const,
  staff: {
    detail: (clinicId: string, staffId: string) => ["staff", clinicId, staffId] as const,
    invites: (clinicId: string) => ["staff", clinicId, "invites"] as const,
  },
  holidays: (clinicId: string) => ["clinic-holidays", clinicId] as const,
  checkIns: {
    log: (clinicId: string, filters?: Record<string, unknown>) => ["check-ins", clinicId, "log", filters ?? {}] as const,
    failed: (clinicId: string, filters?: Record<string, unknown>) => ["check-ins", clinicId, "failed", filters ?? {}] as const,
  },
  locationQr: (locationId: string) => ["location-qr", locationId] as const,
  queueActions: {
    overview: (clinicId: string) => ["queue-overview", clinicId] as const,
  },
  rxDrafts: {
    all: (clinicId: string) => ["rx-drafts", clinicId] as const,
    list: (clinicId: string, filters?: Record<string, unknown>) => ["rx-drafts", clinicId, "list", filters ?? {}] as const,
    detail: (clinicId: string, draftId: string) => ["rx-drafts", clinicId, "detail", draftId] as const,
  },
  rxAuthoring: {
    /** Prefix of every favourites list (all clinics): use it for invalidation. */
    favouritesAll: () => ["rx-favourites"] as const,
    favourites: (clinicId: string) => ["rx-favourites", clinicId] as const,
    kits: (clinicId: string) => ["rx-kits", clinicId] as const,
    diagnosis: (clinicId: string, term: string) => ["diagnosis-search", clinicId, term] as const,
    investigations: (clinicId: string) => ["investigations-catalog", clinicId] as const,
  },
  clinicStock: (clinicId: string, filters?: Record<string, unknown>) => ["clinic-stock", clinicId, filters ?? {}] as const,
  doctorLeave: (clinicId: string) => ["doctor-leave", clinicId] as const,
  pharmacyExt: {
    expiring: (clinicId: string) => ["pharmacy-expiring", clinicId] as const,
    alertSettings: (clinicId: string) => ["pharmacy-alert-settings", clinicId] as const,
    handover: (clinicId: string, filters?: Record<string, unknown>) => ["pharmacy-handover", clinicId, filters ?? {}] as const,
    billing: (clinicId: string, part: "summary" | "invoices" | "payments", filters?: Record<string, unknown>) =>
      ["pharmacy-billing", clinicId, part, filters ?? {}] as const,
  },
  labBooking: {
    /** Prefix of every lab-booking read (all clinics): use it for invalidation. */
    all: () => ["lab-booking"] as const,
    tests: (clinicId: string) => ["lab-booking", clinicId, "tests"] as const,
    slots: (clinicId: string, testId: string, date: string) => ["lab-booking", clinicId, "slots", testId, date] as const,
    mine: (clinicId: string) => ["lab-booking", clinicId, "mine"] as const,
  },
} as const;

/** Stale / gc presets per kind of screen data. */
export const TBD_CACHE = {
  /** Live lists: queue overview, alerts, failed check-ins. */
  live: { staleTime: CACHE_TIMES.SHORT, gcTime: GC_TIMES.SHORT },
  /** Lists people work through: invoices, drafts, handovers, stock. */
  working: { staleTime: CACHE_TIMES.SHORT * 2, gcTime: GC_TIMES.MEDIUM },
  /** Settings and catalogues: roles, print settings, kits, ICD search. */
  settings: { staleTime: CACHE_TIMES.LONG, gcTime: GC_TIMES.LONG },
} as const;
