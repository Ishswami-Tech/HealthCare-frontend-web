"use client";

import { useQuery } from "@tanstack/react-query";
import { isWebLink, resolveHref, type LinkPreview, type ServiceItem } from "./doctor-profile-data";

const PREVIEW_STALE_TIME_MS = 5 * 60 * 1000;

async function fetchPreview(service: ServiceItem): Promise<[string, LinkPreview] | null> {
  if (service.previewKind === "map") {
    return null;
  }

  const href = resolveHref(service.href);
  if (!isWebLink(href)) {
    return null;
  }

  const response = await fetch(`/api/link-preview?url=${encodeURIComponent(href)}`, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as LinkPreview;
  return [service.id, data];
}

async function fetchPreviews(services: ServiceItem[]): Promise<Record<string, LinkPreview>> {
  const results = await Promise.allSettled(services.map(fetchPreview));
  const previews: Record<string, LinkPreview> = {};

  for (const result of results) {
    if (result.status === "fulfilled" && result.value) {
      const [id, data] = result.value;
      previews[id] = data;
    }
  }

  return previews;
}

/** Loads Open Graph previews for the doctor's external links via the link-preview API route. */
export function useLinkPreviews(services: ServiceItem[]): Record<string, LinkPreview> {
  const { data = {} } = useQuery({
    queryKey: ["drdeshmukh-link-previews", services.map((service) => service.id).join(",")],
    queryFn: () => fetchPreviews(services),
    staleTime: PREVIEW_STALE_TIME_MS,
  });

  return data;
}
