"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCheckInLocationFor, useLocationQr } from "@/hooks/query/useClinicQr";
import { useClinicLocations, useCurrentClinic, useCurrentClinicId } from "@/hooks/query/useClinics";

export type PosterSize = "A4" | "A5" | "STICKER";
export type PosterLanguage = "BOTH" | "en" | "mr";

export const POSTER_SIZES: Record<PosterSize, { label: string; detail: string; width: string; qr: string }> = {
  A4: { label: "A4 wall poster", detail: "210 × 297 mm · QR 11 cm", width: "210mm", qr: "110mm" },
  A5: { label: "A5 table card", detail: "148 × 210 mm · QR 7 cm", width: "148mm", qr: "70mm" },
  STICKER: { label: "5 cm sticker", detail: "50 × 50 mm", width: "50mm", qr: "40mm" },
};

/**
 * Everything the QR screens need for one clinic location: the location, its check-in (QR)
 * location and the QR image. `qrMissing` is true when no check-in location exists for it yet.
 */
export function useLocationQrContext(clinicLocationId: string) {
  const clinicId = useCurrentClinicId();
  const clinic = useCurrentClinic();
  const locations = useClinicLocations(clinicId, { includeInactive: true });
  const checkIn = useCheckInLocationFor(clinicLocationId);
  const qr = useLocationQr(checkIn.row?.id);
  const location = locations.data?.find((entry) => entry.id === clinicLocationId) ?? null;
  return {
    clinicName: String((clinic.data as { name?: string } | null | undefined)?.name ?? ""),
    locations: locations.data ?? [],
    location,
    checkInRow: checkIn.row,
    qr,
    isPending: locations.isPending || checkIn.isPending || (Boolean(checkIn.row) && qr.isPending),
    qrMissing: !checkIn.isPending && !checkIn.row,
    error: locations.error ?? checkIn.error ?? qr.error,
  };
}

/** Short code printed under the QR so reception can match a poster to its version. */
export function qrCodeLabel(locationName: string, version: number | null | undefined): string {
  const prefix = locationName.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "LOC";
  return `TBD-${prefix}-V${version ?? 1}`;
}

/** Chips to jump to the same QR screen of another location. */
export function LocationSwitch({ currentId, locations }: { currentId: string; locations: Array<{ id: string; name: string }> }) {
  const pathname = usePathname() ?? "";
  if (locations.length < 2) return null;
  return (
    <nav aria-label="Location" className="flex flex-wrap gap-2">
      {locations.map((location) => (
        <Link
          key={location.id}
          href={pathname.replace(`/locations/${currentId}`, `/locations/${location.id}`)}
          aria-current={location.id === currentId ? "page" : undefined}
          className={cn(
            "inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-bold",
            location.id === currentId ? "border-brand bg-brand text-white" : "border-line bg-card text-ink hover:bg-mint-soft",
          )}
        >
          {location.name}
        </Link>
      ))}
    </nav>
  );
}

/** The printable poster: clinic, location, "Scan to check in" (English / Marathi), QR, code, footer. */
export function LocationQrPoster({
  clinicName,
  locationName,
  address,
  hoursLine,
  qrDataUrl,
  code,
  size = "A4",
  language = "BOTH",
  showFooter = true,
  showCode = true,
  className,
}: {
  clinicName: string;
  locationName: string;
  address?: string;
  hoursLine?: string;
  qrDataUrl: string | null | undefined;
  code: string;
  size?: PosterSize;
  language?: PosterLanguage;
  showFooter?: boolean;
  showCode?: boolean;
  className?: string;
}) {
  const spec = POSTER_SIZES[size];
  const small = size === "STICKER";
  return (
    <div
      className={cn("mx-auto flex max-w-full flex-col items-center gap-2 rounded-[14px] border border-line bg-white p-5 text-center text-[#0f1b2d]", className)}
      style={{ width: spec.width }}
    >
      {!small ? (
        <>
          <p className="text-xl font-extrabold text-[#047857]">{clinicName}</p>
          <p className="text-xs font-extrabold uppercase tracking-[0.8px]">{locationName}</p>
          {language !== "mr" ? <p className="mt-2 text-2xl font-extrabold">Scan to check in</p> : null}
          {language !== "en" ? <p className="text-lg font-bold">चेक-इन करण्यासाठी स्कॅन करा</p> : null}
        </>
      ) : (
        <p className="text-[10px] font-extrabold">{language === "mr" ? "चेक-इन स्कॅन करा" : "Scan to check in"}</p>
      )}
      {qrDataUrl ? (
        <img src={qrDataUrl} alt={`Check-in QR for ${locationName}`} style={{ width: spec.qr, maxWidth: "100%" }} />
      ) : (
        <div className="grid aspect-square w-40 place-items-center rounded-lg bg-[#f1f5f9] text-xs text-[#5b6b7f]">QR not available</div>
      )}
      {!small ? (
        <>
          {language !== "mr" ? <p className="text-xs">Open TestByDoctor · tap Check in · scan this code</p> : null}
          {language !== "en" ? <p className="text-xs">TestByDoctor ॲप उघडा · चेक-इन दाबा · हा कोड स्कॅन करा</p> : null}
        </>
      ) : null}
      {showCode ? <p className="text-[11px] font-extrabold tracking-[0.6px]">{code}</p> : null}
      {showFooter && !small ? (
        <p className="text-[10px] text-[#5b6b7f]">
          {[address, hoursLine].filter(Boolean).join(" · ")}
          {address || hoursLine ? " · " : ""}Video visits do not need this code
        </p>
      ) : null}
    </div>
  );
}
