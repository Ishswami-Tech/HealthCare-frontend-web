import { Loader2, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IconBox, Surface } from "@/components/tbd";
import { VideoStageShell } from "./VideoStageShell";

/** "Getting ready…" while the appointment loads and the browser asks for the camera. */
export function VideoLobbyLoading({ portalLabel }: { portalLabel?: string }) {
  return (
    <VideoStageShell portalLabel={portalLabel}>
      <Surface
        className="mx-auto mt-10 w-full max-w-[460px] items-center gap-3 px-6 py-10 text-center"
        role="status"
        aria-live="polite"
      >
        <span className="relative flex size-14 items-center justify-center">
          <Loader2 className="absolute inset-0 size-14 animate-spin text-video/40" strokeWidth={1.5} aria-hidden="true" />
          <Video className="size-6 text-video" strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1 className="m-0 text-lg font-extrabold text-ink">Getting ready…</h1>
        <p className="m-0 text-sm text-ink-muted">Preparing your consultation.</p>
      </Surface>
    </VideoStageShell>
  );
}

/** The visit could not be opened (appointment not found, camera blocked, join failed). */
export function VideoLobbyError({
  portalLabel,
  message,
  backLabel,
  onRetry,
  onBack,
}: {
  portalLabel?: string;
  message: string;
  backLabel: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <VideoStageShell portalLabel={portalLabel} backLabel={backLabel} onBack={onBack}>
      <Surface className="mx-auto mt-10 w-full max-w-[460px] items-center gap-3 px-6 py-9 text-center" role="alert">
        <IconBox icon={VideoOff} tone="rose" size={52} />
        <h1 className="m-0 text-lg font-extrabold text-ink">Unable to join</h1>
        <p className="m-0 max-w-[46ch] text-sm leading-relaxed text-ink-muted">{message}</p>
        <div className="mt-2 grid w-full gap-2.5 sm:grid-cols-2">
          <Button variant="outline" size="xl" className="w-full" onClick={onBack}>
            {backLabel}
          </Button>
          <Button size="xl" className="w-full" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </Surface>
    </VideoStageShell>
  );
}
