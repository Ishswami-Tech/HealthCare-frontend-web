"use client";

import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchBookingLocations } from "@/lib/actions/in-person.server";

/**
 * Booking V2: "Nearest clinic" - asks the device for its position once, lets the backend rank
 * the clinic locations (`GET in-person/locations?lat&lng`) and picks the nearest one. Choosing a
 * specific location stays the normal list next to it.
 */
export function NearestLocationButton({
  onPick,
  disabled,
}: {
  onPick: (locationId: string) => void;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const locate = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("error");
      setMessage("Location is not available on this device. Choose a location below.");
      return;
    }
    setStatus("locating");
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await fetchBookingLocations({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        const nearest = result.success ? result.data.find((location) => location.isNearest) : undefined;
        if (!nearest) {
          setStatus("error");
          setMessage("We could not work out the nearest clinic. Choose a location below.");
          return;
        }
        setStatus("idle");
        setMessage(
          nearest.distanceMeters !== null
            ? `${nearest.name} is nearest (${(nearest.distanceMeters / 1000).toFixed(1)} km).`
            : `${nearest.name} is nearest.`,
        );
        onPick(nearest.locationId);
      },
      () => {
        setStatus("error");
        setMessage("Allow location access to find the nearest clinic, or choose a location below.");
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        type="button"
        variant="soft"
        size="md"
        className="self-start"
        onClick={locate}
        disabled={disabled || status === "locating"}
        aria-busy={status === "locating"}
      >
        <LocateFixed aria-hidden="true" />
        {status === "locating" ? "Finding the nearest clinic…" : "Use nearest clinic"}
      </Button>
      {message ? (
        <p
          className={status === "error" ? "m-0 text-xs text-[#b45309] dark:text-amber-300" : "m-0 text-xs text-ink-muted"}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
