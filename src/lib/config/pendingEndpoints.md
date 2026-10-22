# Endpoint groups and what is still missing

`API_ENDPOINTS` in `config.ts` has ONE group per backend area. Paths follow `API_CONTRACT.md` (backend contract v1 +
"In-person flow V2"). The provisional B0 groups (`CLINIC_BILLING`, `CLINIC_REPORTS`, `CLINIC_ALERTS`, `PRINT_SETTINGS`,
`CLINIC_ROLES`, `STAFF_ADMIN`, `CLINIC_HOLIDAYS`, `CHECK_INS`, `LOCATION_QR`, `QUEUE_ACTIONS`, `RX_AUTHORING`,
`VISIT_FLOW`, `CLINIC_DISPENSE`, `DOCTOR_LEAVE`, `APPOINTMENT_RESCHEDULE`) were removed in the phase 3 consolidation:
nothing called them, or their one live path moved into the real group (queue priority is `QUEUE.PRIORITY`).

Role rules the backend enforces (the UI only follows them): the doctor and the assistant doctor never receive billing
amounts; reception sees no clinical records; only the doctor calls, starts or completes a visit.

| Group (`API_ENDPOINTS.*`) | Backend area | Used by | Status |
|---|---|---|---|
| `IN_PERSON` | `/in-person/*` (locations, me/today, appointments/:id, check-in, desk) | patient booking + QR check-in + live queue; reception desk (location, one-click check-in); clinic admin "check in" from a failed scan; queue (reception location) | existing. The ONE check-in client: `useInPersonCheckIn` / `submitInPersonCheckIn`. |
| `QUEUE` | `/queue/*`, `/queue-ops/appointments/:id/priority` | `/queue` (all roles), doctor visit, assistant day | existing (`GET /queue?locationId=` used for reception) |
| `RX_DRAFTS` | `/rx-drafts/*` (+ `PATCH /pharmacy/prescriptions/:id`) | assistant drafts, doctor review | existing |
| `DIRECT_DISPENSE` | `/direct-dispense/*` | assistant + doctor dispense, stock view, pharmacist reverse | existing |
| `DOCTOR_FAVOURITES` | `/doctor-favourites/*` | Rx shortcuts (doctor, assistant) | existing |
| `INVESTIGATIONS` | `/investigations/*` | doctor investigations (linked from the visit flow) | existing |
| `LEAVE_REQUESTS` | `/leave-requests/*` | staff leave, clinic admin approvals | existing |
| `PHARMACY_EXT` | `/pharmacy-ops/*`, reorder rules, expiring | pharmacist hand-over, expiry, alert settings | existing |
| `LAB_BOOKING` | `/lab-bookings/*` | patient lab booking | existing |
| `CLINIC_ADMIN_OPS` | `/billing-ops/*`, `/staff-admin/*`, `/clinic-holidays/*`, `/check-in-log/*`, QR regenerate, `/clinic-audit` | clinic admin | existing |

## Still missing on the backend (UI works without them; wire when they ship)

- Phase 3 additions (API_CONTRACT §18) wired in the web: `POST /in-person/walk-in` (reception walk-in page:
  one call, server assigns the single doctor and checks in), `GET /rx-drafts?status=APPROVED&days=30` (assistant
  drafts "Approved" tab), `POST /rx-drafts/:id/resubmit {note?}` (+ `resubmitNote` shown to the doctor), optional
  `doctorId` on `POST /appointments` (booking never shows a doctor picker). The no-show Undo keeps
  `PATCH /appointments/:id/status`, which §18.6 routes through the same-day undo-no-show path. Reception location
  still comes from `GET /in-person/desk` (server-scoped); `locationId` on `/users/profile` (§18.1) is not needed by
  the web. `GET /appointments` for RECEPTIONIST is location-scoped by the server (§18.3); the web also sends
  `locationId` + the day range.
- Still TODO when the backend ships it: undo check-in (no Undo after a desk check-in yet; TODO in `useReceptionCheckIn`).
- Bulk payment reminders (the UI sends one reminder per invoice), consultation presets (stored in
  `clinic.settings.billingSettings.feeSchedule`), print settings (stored in `clinic.settings.printSettings`),
  letterhead / signature upload, custom role matrix (the Roles screen is read-only), holiday impact preview,
  staff deactivate (AssignRoleModal's status toggle is used), reschedule preview (refund policy; the rule is computed
  client side from `toManagerVisit`).

Shared pieces (no endpoints): `tbdRoutes.ts` (route registry), `src/components/tbd/*`, `src/hooks/query/tbdQueryKeys.ts`,
`src/hooks/utils/{useOnlineStatus,useUndoableAction,useStaffRole}.ts`.
