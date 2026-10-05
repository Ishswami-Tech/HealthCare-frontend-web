import type { CSSProperties } from "react";
import Link from "next/link";
import { Phone, PhoneOff, Video, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, InitialsAvatar, Note, Pill, Surface } from "@/components/tbd";
import { cn } from "@/lib/utils";
import { VideoStageShell } from "@/components/video/lobby/VideoStageShell";

export type LeftCallState =
  /** The person pressed Leave; the visit is still open. */
  | "left"
  /** The call ended by itself (network); the visit is still open. */
  | "dropped"
  /** The visit can no longer be joined (window closed, cancelled) and was not completed. */
  | "closed";

export type LeftCallViewProps = {
  state: LeftCallState;
  portalLabel?: string;
  backHref: string;
  backLabel: string;
  /** Who the visit is with, as shown in the sentence ("Dr. Chandrakumar Deshmukh"). Empty when unknown. */
  counterpartName: string;
  /** True when the viewer is the patient (the counterpart is the doctor). */
  viewerIsPatient: boolean;
  /** Photo and name for the round picture. */
  avatarName: string;
  avatarPhotoUrl?: string;
  /** The doctor has started the visit. */
  visitInProgress: boolean;
  /** The row under the text: who and when. Hidden until the appointment has loaded. */
  visit?: { name: string; whenLabel: string } | null;
  /** Why the visit is closed (state `closed`). */
  closedReason?: string;
  /** Shown when joining has not opened yet. */
  opensLabel?: string;
  canRejoin: boolean;
  rejoinHref: string;
  homeHref: string;
};

/** Rings that grow and fade around the picture. Still when the visit is closed or motion is reduced. */
const RING_CSS = `
@keyframes tbd-call-ring{0%{transform:scale(.74);opacity:.75}100%{transform:scale(1.62);opacity:0}}
@keyframes tbd-call-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.tbd-call-ring{animation:tbd-call-ring 2.4s ease-out infinite}
.tbd-call-float{animation:tbd-call-float 3.6s ease-in-out infinite}
.tbd-call-still .tbd-call-ring{animation:none;transform:scale(var(--ring-scale));opacity:var(--ring-opacity)}
.tbd-call-still .tbd-call-float{animation:none}
@media (prefers-reduced-motion: reduce){
.tbd-call-ring{animation:none;transform:scale(var(--ring-scale));opacity:var(--ring-opacity)}
.tbd-call-float{animation:none}
}`;

const RINGS = [
  { delay: "0s", scale: 0.9, opacity: 0.75 },
  { delay: "-0.8s", scale: 1.2, opacity: 0.5 },
  { delay: "-1.6s", scale: 1.5, opacity: 0.28 },
] as const;

function CallRings({
  name,
  photoUrl,
  state,
}: {
  name: string;
  photoUrl?: string;
  state: LeftCallState;
}) {
  const dropped = state === "dropped";
  const still = state === "closed";
  const BadgeIcon = dropped ? WifiOff : still ? PhoneOff : Phone;
  return (
    <div className={cn("relative size-[230px] shrink-0", still && "tbd-call-still")} aria-hidden="true">
      <style>{RING_CSS}</style>
      {RINGS.map((ring) => (
        <span
          key={ring.delay}
          className={cn(
            "tbd-call-ring absolute left-1/2 top-1/2 -ml-[70px] -mt-[70px] size-[140px] rounded-full border-2",
            dropped
              ? "border-[#fcd34d] bg-[rgba(253,230,138,0.28)]"
              : "border-[#c7d2fe] bg-[rgba(199,210,254,0.3)] dark:border-indigo-400/50 dark:bg-indigo-400/10",
          )}
          style={
            {
              animationDelay: ring.delay,
              "--ring-scale": ring.scale,
              "--ring-opacity": ring.opacity,
            } as CSSProperties
          }
        />
      ))}
      <span className="tbd-call-float absolute left-1/2 top-1/2 -ml-[52px] -mt-[52px] size-[104px]">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="block size-[104px] rounded-full border-4 border-white bg-[#d1fae5] object-cover object-top shadow-[0_14px_30px_rgba(49,46,129,0.22)] dark:border-card"
          />
        ) : (
          <InitialsAvatar
            name={name}
            size={104}
            className="border-4 border-white shadow-[0_14px_30px_rgba(49,46,129,0.22)] dark:border-card"
          />
        )}
        <span className="absolute -bottom-0.5 -right-1 flex size-10 items-center justify-center rounded-full bg-white shadow-[0_6px_14px_rgba(15,27,45,0.18)] dark:bg-card">
          <BadgeIcon
            className={cn(
              "size-[19px]",
              dropped ? "text-[#b45309] dark:text-amber-300" : still ? "text-ink-muted" : "text-video",
            )}
            strokeWidth={2.4}
          />
        </span>
      </span>
    </div>
  );
}

/**
 * "You left the call": the visit is still open, so the page offers Rejoin instead of a summary.
 * The same page with `state="dropped"` is shown when the call ended by itself.
 */
export function LeftCallView({
  state,
  portalLabel,
  backHref,
  backLabel,
  counterpartName,
  viewerIsPatient,
  avatarName,
  avatarPhotoUrl,
  visitInProgress,
  visit,
  closedReason,
  opensLabel,
  canRejoin,
  rejoinHref,
  homeHref,
}: LeftCallViewProps) {
  const closed = state === "closed";
  const dropped = state === "dropped";
  const who = counterpartName || (viewerIsPatient ? "your doctor" : "the patient");

  const until = viewerIsPatient
    ? "You can rejoin until the doctor completes it."
    : "You can rejoin until the visit is completed.";

  const title = closed
    ? "This visit can no longer be joined"
    : dropped
      ? "The call got disconnected"
      : "You left the call";
  const message = closed
    ? `${closedReason || "This visit is no longer open."}${
        viewerIsPatient ? " Book a new visit if you need to see the doctor again." : ""
      }`
    : dropped
      ? `Your visit with ${who} is still open. Check your internet, then rejoin. ${until}`
      : `Your visit with ${who} is still open. ${until}`;
  // The tag above the title: where the visit stands right now.
  const tagLabel = dropped ? "Visit still open" : visitInProgress ? "Visit in progress" : "Waiting for the doctor";
  const tagTone = dropped || !visitInProgress ? "amber" : "green";
  const presence = viewerIsPatient
    ? visitInProgress
      ? "Doctor is waiting"
      : "Doctor will join shortly"
    : visitInProgress
      ? "Visit in progress"
      : "Not started yet";

  return (
    <VideoStageShell portalLabel={portalLabel} backHref={backHref} backLabel={backLabel}>
      <div className="mx-auto mt-3 w-full max-w-[620px] sm:mt-7">
        <Surface className="gap-[18px] p-5 sm:p-7">
          <div className="flex flex-col items-center gap-3.5 px-0 pt-1.5 text-center sm:px-3">
            <CallRings name={avatarName} state={state} {...(avatarPhotoUrl ? { photoUrl: avatarPhotoUrl } : {})} />

            {!closed ? (
              <Pill tone={tagTone} className="gap-[7px] rounded-[9px] px-[11px] py-[5px] tracking-[0.5px]">
                <span className="tbd-pulse size-[7px] rounded-full bg-current" aria-hidden="true" />
                {tagLabel}
              </Pill>
            ) : null}

            <h1 className="m-0 text-[26px] font-extrabold leading-tight tracking-[-0.5px] text-ink">{title}</h1>
            <p className="m-0 max-w-[420px] text-sm leading-[1.6] text-ink-soft">{message}</p>

            {visit && !closed ? (
              <div className="flex items-center gap-3 self-stretch rounded-2xl border border-hair bg-[#f8fafc] px-4 py-3.5 text-left dark:bg-well">
                <IconBox icon={Video} tone="video" size={40} />
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="truncate text-sm font-bold text-ink">{visit.name}</span>
                  <span className="text-xs text-ink-muted">
                    {visit.whenLabel}
                    {/* Phones: the presence sits on this line, as in the phone design. */}
                    <span className={cn("font-bold sm:hidden", visitInProgress && "text-brand")}>
                      {" · "}
                      {presence}
                    </span>
                  </span>
                </span>
                <span
                  className={cn(
                    "hidden shrink-0 text-right text-xs font-bold sm:block",
                    visitInProgress ? "text-brand" : "text-ink-muted",
                  )}
                >
                  {presence}
                </span>
              </div>
            ) : null}

            {dropped ? (
              <Note
                tone="amber"
                icon={Wifi}
                className="self-stretch rounded-[14px] px-3 py-2.5 text-left text-xs [&_svg]:size-4"
              >
                Weak signal? Move closer to Wi-Fi or switch to mobile data.
              </Note>
            ) : null}

            {!closed && !canRejoin && opensLabel ? (
              <p className="m-0 text-[13px] font-semibold text-ink-soft">{opensLabel}</p>
            ) : null}
          </div>

          <div className={cn("grid gap-3", canRejoin && "sm:grid-cols-2")}>
            {canRejoin ? (
              <Button asChild variant="action" size="xl" className="w-full sm:order-last">
                <Link href={rejoinHref} replace>
                  <Video className="size-4" strokeWidth={2.4} aria-hidden="true" />
                  Rejoin call
                </Link>
              </Button>
            ) : null}
            <Button asChild variant={canRejoin ? "outline" : "default"} size="xl" className="w-full">
              <Link href={homeHref}>Back to home</Link>
            </Button>
          </div>

          {!closed ? (
            <p className="m-0 text-center text-xs text-ink-muted">
              The visit ends only when the doctor completes it.
              {dropped ? "" : " If the call drops by itself, this same page lets you rejoin."}
            </p>
          ) : null}
        </Surface>
      </div>
    </VideoStageShell>
  );
}
