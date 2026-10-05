import Link from "next/link";
import { Calendar, ChevronLeft, ClipboardPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Chip, InitialsAvatar, Surface } from "@/components/tbd";

export interface DietChartEditorHeaderProps {
  /** Where "Back to EHR" goes. */
  backHref: string;
  isLoading: boolean;
  patientName: string;
  age: number | null;
  gender: string | null;
  opdNumber: string | null;
  /** Visit date, already formatted. */
  visitDate: string;
}

function readableGender(gender: string | null): string | null {
  const text = String(gender ?? "").trim().toLowerCase();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null;
}

/** Patient strip above the diet chart: who, which visit, and the way back to the EHR. */
export function DietChartEditorHeader({
  backHref,
  isLoading,
  patientName,
  age,
  gender,
  opdNumber,
  visitDate,
}: DietChartEditorHeaderProps) {
  const details = [age !== null ? `${age} years` : null, readableGender(gender), "Case sheet › Diet"]
    .filter((entry): entry is string => Boolean(entry))
    .join(" · ");

  return (
    <Surface as="section" className="flex-row flex-wrap items-center gap-x-3.5 gap-y-3 p-4">
      {isLoading ? (
        <>
          <Skeleton className="size-11 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-56 max-w-full" />
          </div>
        </>
      ) : (
        <>
          <InitialsAvatar name={patientName} size={44} />
          <div className="flex min-w-[160px] flex-1 flex-col gap-0.5">
            <h1 className="m-0 truncate text-base font-extrabold text-ink">{patientName}</h1>
            <p className="m-0 text-[13px] text-ink-muted">{details}</p>
          </div>
          {opdNumber ? <Chip icon={ClipboardPlus}>{opdNumber}</Chip> : null}
          {visitDate ? <Chip icon={Calendar}>{visitDate}</Chip> : null}
        </>
      )}
      <Button asChild variant="outline" size="lg" className="px-3.5 has-[>svg]:px-3.5">
        <Link href={backHref}>
          <ChevronLeft aria-hidden="true" />
          Back to EHR
        </Link>
      </Button>
    </Surface>
  );
}
