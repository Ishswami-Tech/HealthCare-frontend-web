"use client";

import { Fragment } from "react";
import { Check, Eye, FilePen, Minus } from "lucide-react";
import { Note, Pill, Surface, TbdPage } from "@/components/tbd";
import { roleLabel } from "@/components/billing/staff/billing.logic";
import { matrixGroups, matrixLevel, MATRIX_ROLES, type MatrixLevel } from "@/components/clinic-admin/roles-matrix.logic";

const COLUMNS = `minmax(220px,1.6fr) repeat(${MATRIX_ROLES.length}, minmax(84px,1fr))`;

const CELL: Record<MatrixLevel, { icon: typeof Check; label: string; className: string }> = {
  FULL: { icon: Check, label: "Full access", className: "text-brand" },
  VIEW: { icon: Eye, label: "Read only", className: "text-[#1d4ed8]" },
  DRAFT: { icon: FilePen, label: "Draft only", className: "text-[#b45309]" },
  NONE: { icon: Minus, label: "No access", className: "text-ink-muted" },
};

// CaRoles (B2): a read-only summary of what each role can do, from the app's single role -> permission
// map (types/rbac.types.ts). The backend exposes no matrix endpoint (only the signed-in user's own
// GET /auth/permissions), so this is documentation of the policy, not the place it is enforced or edited.
export default function CaRolesPage() {
  return (
    <TbdPage
      title="What each role can do (summary)"
      description="A read-only summary of the access policy. Billing amounts are visible to clinic admin only. Assistant doctors prepare drafts; the doctor approves."
      backHref="/clinic-admin/staff"
      backLabel="Staff"
    >
      <Note tone="amber">
        Read-only summary. This table describes the access policy; it cannot be edited here and changing it does not change who can do what.
        Access is checked by the server on every request.
      </Note>
      <Surface flush as="section" aria-label="Permissions summary (read-only)" className="overflow-x-auto">
        <div role="table" aria-label="Permissions by role" className="min-w-[760px]">
          <div role="row" className="grid items-center gap-2 border-b border-hair px-5 py-3 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted" style={{ gridTemplateColumns: COLUMNS }}>
            <span role="columnheader">Permission</span>
            {MATRIX_ROLES.map((role) => (
              <span role="columnheader" key={role} className="text-center">
                {roleLabel(role)}
              </span>
            ))}
          </div>
          {matrixGroups().map(({ group, rows }) => (
            <Fragment key={group}>
              <div role="row" className="bg-well px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-soft">
                <span role="cell">{group}</span>
              </div>
              {rows.map((row) => (
                <div role="row" key={row.label} className="grid items-center gap-2 border-b border-hair px-5 py-2.5 text-sm" style={{ gridTemplateColumns: COLUMNS }}>
                  <span role="rowheader" className="font-bold text-ink">
                    {row.label} {row.only ? <Pill tone="slate">{roleLabel(row.only)} only</Pill> : null}
                  </span>
                  {MATRIX_ROLES.map((role) => {
                    const cell = CELL[matrixLevel(row, role)];
                    const Icon = cell.icon;
                    return (
                      <span role="cell" key={role} className={`flex justify-center ${cell.className}`} title={cell.label}>
                        <Icon className="size-4" aria-hidden="true" />
                        <span className="sr-only">{cell.label}</span>
                      </span>
                    );
                  })}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </Surface>
      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        {(Object.keys(CELL) as MatrixLevel[]).map((level) => {
          const Icon = CELL[level].icon;
          return (
            <span key={level} className={`flex items-center gap-1.5 ${CELL[level].className}`}>
              <Icon className="size-3.5" aria-hidden="true" /> {CELL[level].label}
            </span>
          );
        })}
      </div>
      <Note tone="blue">
        The server enforces its own rules: for example the doctor and assistant doctor never receive billing amounts, and only the doctor
        calls, starts or completes a visit. Custom roles are not available yet.
      </Note>
    </TbdPage>
  );
}
