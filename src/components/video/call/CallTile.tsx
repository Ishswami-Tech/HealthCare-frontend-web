import * as React from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { CALL_STAGE_BACKGROUND } from "./call-theme";
import { getCallInitials } from "./call-types";

type CallTileProps = {
  /** Name on the tag, for example "Aadesh Bhujbal" or "Dr. C. Deshmukh (You)". */
  name: string;
  /** The live video. Leave empty when the camera is off: the initials are shown instead. */
  media?: React.ReactNode;
  isMuted?: boolean;
  isActiveSpeaker?: boolean;
  /** `stage` = the large tile, `thumb` = a small tile (self view, side strip). */
  size?: "stage" | "thumb";
  /** `full` = microphone state and name, `muted` = only a muted mark, `none` = nothing. */
  tag?: "full" | "muted" | "none";
  className?: string;
};

/** One participant on the stage: their video, or their initials when the camera is off. */
export function CallTile({
  name,
  media,
  isMuted = false,
  isActiveSpeaker = false,
  size = "stage",
  tag = "full",
  className,
}: CallTileProps) {
  const isThumb = size === "thumb";
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden",
        isThumb ? "rounded-[14px]" : "rounded-[18px]",
        isActiveSpeaker && "ring-2 ring-inset ring-[#818cf8]",
        className,
      )}
      style={{ background: media ? "#0f172a" : CALL_STAGE_BACKGROUND }}
    >
      {media ? (
        <div className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover">{media}</div>
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center rounded-full bg-[#334155] font-extrabold text-[#e2e8f0]",
            isThumb
              ? "size-12 border-2 border-white/[0.14] text-[16px]"
              : "size-[96px] border-[3px] border-white/[0.14] text-[32px] shadow-[0_0_0_8px_rgba(129,140,248,0.12)] sm:size-[148px] sm:text-[50px] sm:shadow-[0_0_0_10px_rgba(129,140,248,0.12)]",
          )}
        >
          {getCallInitials(name)}
        </span>
      )}

      {tag === "full" ? (
        <div
          className={cn(
            "absolute flex max-w-[calc(100%-16px)] items-center font-semibold text-white",
            isThumb
              ? "bottom-2 left-2 gap-1 rounded-lg bg-[rgba(8,12,22,0.72)] px-2 py-[3px] text-[11px]"
              : "bottom-[14px] left-[14px] gap-2 rounded-[10px] bg-[rgba(8,12,22,0.7)] px-2.5 py-1.5 text-[13px]",
          )}
        >
          {isMuted ? (
            <MicOff className={cn("shrink-0 text-[#fb7185]", isThumb ? "size-3" : "size-3.5")} strokeWidth={2.2} aria-hidden="true" />
          ) : isThumb ? null : (
            <Mic className="size-3.5 shrink-0 text-[#6ee7b7]" strokeWidth={2.2} aria-hidden="true" />
          )}
          <span className="truncate">{name}</span>
          <span className="sr-only">{isMuted ? ", microphone off" : ", microphone on"}</span>
        </div>
      ) : null}

      {tag === "muted" && isMuted ? (
        <div className="absolute bottom-[14px] left-[14px] flex items-center gap-2 rounded-[10px] bg-[rgba(8,12,22,0.7)] px-2.5 py-1.5 text-[13px] font-semibold text-white">
          <MicOff className="size-3.5 shrink-0 text-[#fb7185]" strokeWidth={2.2} aria-hidden="true" />
          <span>Muted</span>
        </div>
      ) : null}
    </div>
  );
}

/** A tile with a stable key (the participant's session id), so videos are not remounted. */
export type CallStageTile = { key: string; node: React.ReactNode };

/**
 * The stage with one large tile and a small floating self view.
 * `pip` sits top-right; `pipShape` picks the board size (wide for the doctor room, tall for the patient).
 */
export function CallSpotlightStage({
  main,
  pip,
  pipShape = "wide",
}: {
  main: React.ReactNode;
  pip?: React.ReactNode;
  pipShape?: "wide" | "tall";
}) {
  return (
    <div className="relative h-full w-full min-h-0 min-w-0">
      <div className="absolute inset-0">{main}</div>
      {pip ? (
        <div
          className={cn(
            "absolute z-10 overflow-hidden border-2 border-white/85 bg-[#1e293b]",
            pipShape === "wide"
              ? "right-2.5 top-[108px] h-[84px] w-[128px] rounded-[14px] shadow-[0_12px_28px_rgba(0,0,0,0.4)] sm:right-[14px] sm:top-[54px] sm:h-[132px] sm:w-[208px] sm:rounded-2xl"
              : "right-3 top-3 h-[128px] w-[96px] rounded-[14px] shadow-[0_8px_20px_rgba(0,0,0,0.35)] sm:right-[18px] sm:top-[18px] sm:h-[180px] sm:w-[136px] sm:rounded-[18px]",
          )}
        >
          {pip}
        </div>
      ) : null}
    </div>
  );
}

/** A large tile with a strip of small tiles on the right (spotlight layout, screen sharing). */
export function CallStripStage({ main, strip }: { main: React.ReactNode; strip?: CallStageTile[] }) {
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 gap-1.5 sm:gap-3">
      <div className="min-h-0 min-w-0 flex-1">{main}</div>
      {strip && strip.length > 0 ? (
        <div className="flex w-[90px] shrink-0 flex-col gap-1.5 overflow-y-auto sm:w-[140px] sm:gap-2 lg:w-[168px]">
          {strip.map((tile) => (
            <div key={tile.key} className="aspect-video w-full shrink-0 overflow-hidden rounded-[14px]">
              {tile.node}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Everyone in equal tiles. */
export function CallGridStage({ tiles }: { tiles: CallStageTile[] }) {
  const columns =
    tiles.length <= 4
      ? "grid-cols-1 sm:grid-cols-2"
      : tiles.length <= 6
        ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return (
    <div className={cn("grid h-full w-full min-h-0 min-w-0 gap-1.5 [grid-auto-rows:minmax(0,1fr)] sm:gap-2", columns)}>
      {tiles.map((tile) => (
        <div key={tile.key} className="min-h-0 min-w-0">
          {tile.node}
        </div>
      ))}
    </div>
  );
}
