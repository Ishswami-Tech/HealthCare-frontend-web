import { GridHead, GridRow } from "@/components/tbd";
import { cn } from "@/lib/utils";
import type { DoctorRxLine } from "./doctor-prescriptions.logic";
import { rxLineSummary } from "./doctor-prescriptions.logic";

const COLUMNS = "36px minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1.2fr) 70px";

/**
 * Medicines of one prescription as a table (detail, print) or a compact list (visit cards, sent).
 * No prices: the doctor never sees them.
 */
export function RxLinesTable({
  lines,
  variant = "table",
  className,
}: {
  lines: readonly DoctorRxLine[];
  variant?: "table" | "compact";
  className?: string;
}) {
  if (lines.length === 0) {
    return <p className="m-0 px-5 py-4 text-sm text-ink-muted">No medicines on this prescription.</p>;
  }
  if (variant === "compact") {
    return (
      <ol className={cn("m-0 flex list-none flex-col p-0", className)}>
        {lines.map((line, index) => (
          <li key={line.id} className="flex items-start gap-3 border-b border-hair py-2.5 last:border-b-0">
            <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-lg bg-mint text-xs font-extrabold text-brand-dark">
              {index + 1}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-bold text-ink">{line.name}</span>
              <span className="text-xs text-ink-muted">{rxLineSummary(line) || `Quantity ${line.quantity}`}</span>
            </span>
          </li>
        ))}
      </ol>
    );
  }
  return (
    <div role="table" aria-label="Medicines" className={className}>
      <GridHead columns={COLUMNS} labels={["#", "Medicine", "Dose", "Frequency", "Duration · timing", "Qty"]} />
      {lines.map((line, index) => (
        <GridRow key={line.id} columns={COLUMNS}>
          <span role="cell" className="font-extrabold text-ink-muted">
            {index + 1}
          </span>
          <span role="cell" className="font-bold text-ink">
            {line.name}
          </span>
          <span role="cell">{line.dosage || "-"}</span>
          <span role="cell">{line.frequency || "-"}</span>
          <span role="cell">{[line.duration, line.instructions].filter(Boolean).join(" · ") || "-"}</span>
          <span role="cell">{line.quantity || "-"}</span>
        </GridRow>
      ))}
    </div>
  );
}
