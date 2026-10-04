"use client";

/**
 * Rules and small helpers shared by the Investigation / Documents panel
 * (`PatientFilesPanel`) and its layout (`FilesPanelView`).
 */

import { useEffect, useState, type RefObject } from "react";
import { fetchPatientDocumentBlob } from "@/hooks/query/usePatientDocuments";
import type {
  PatientDocumentMediaKind,
  PatientDocumentSubTypeOption,
} from "@/types/patient-document.types";

export type PatientFilesCategory = "INVESTIGATION" | "DOCUMENT";

// ---------------------------------------------------------------------------
// Client-side acceptance rules (the backend re-validates by file signature)
// ---------------------------------------------------------------------------

const MB = 1024 * 1024;

export type AcceptedKind = Exclude<PatientDocumentMediaKind, "OTHER">;

export const SIZE_LIMITS: Record<AcceptedKind, number> = {
  IMAGE: 10 * MB,
  PDF: 20 * MB,
  AUDIO: 25 * MB,
  VIDEO: 50 * MB,
};

const EXTENSION_KIND: Record<string, AcceptedKind> = {
  pdf: "PDF",
  jpg: "IMAGE",
  jpeg: "IMAGE",
  png: "IMAGE",
  webp: "IMAGE",
  heic: "IMAGE",
  mp3: "AUDIO",
  wav: "AUDIO",
  m4a: "AUDIO",
  ogg: "AUDIO",
  mp4: "VIDEO",
  m4v: "VIDEO",
  mov: "VIDEO",
  webm: "VIDEO",
  mkv: "VIDEO",
};

export const ACCEPT: Record<PatientFilesCategory, string> = {
  INVESTIGATION: ".pdf,.jpg,.jpeg,.png,.webp,.heic,.mp3,.wav,.m4a,.ogg,.mp4,.m4v,.mov,.webm,.mkv",
  DOCUMENT: ".pdf,.jpg,.jpeg,.png,.webp,.heic",
};

export const COPY: Record<
  PatientFilesCategory,
  { title: string; subtitle: string; empty: string; limits: string }
> = {
  INVESTIGATION: {
    title: "Investigations",
    subtitle: "X-ray, lab, MRI, CT, USG and ECG reports: PDF, image, audio or video.",
    empty: "No investigations uploaded yet.",
    limits: "Images up to 10 MB · PDF 20 MB · Audio 25 MB · Video 50 MB",
  },
  DOCUMENT: {
    title: "Documents",
    subtitle: "ID proof, consent forms, old prescriptions and referral letters: PDF or image.",
    empty: "No documents uploaded yet.",
    limits: "Images up to 10 MB · PDF 20 MB",
  },
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The picker's `accept` list is a hint, not a guarantee — the user can still
 * choose "All files" on most platforms — so the extension is re-checked here.
 */
export function isAcceptedFile(file: File, accept: string): boolean {
  const allowed = accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const name = file.name.toLowerCase();
  return allowed.some((ext) => name.endsWith(ext));
}

export function kindForFile(file: File): AcceptedKind | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const kind = EXTENSION_KIND[extension] ?? null;
  if (kind === "VIDEO" && file.type.startsWith("audio/")) return "AUDIO";
  return kind;
}

export function subTypeLabel(
  options: readonly PatientDocumentSubTypeOption[],
  value: string | null,
): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

/** A file chosen for upload, with the details typed for it. */
export interface PendingUpload {
  id: string;
  file: File;
  subType: string;
  title: string;
  notes: string;
  reportDate: string;
  linkToVisit: boolean;
}

export interface UploadProgress {
  done: number;
  total: number;
  current: string;
}

/** State of a file fetched for an inline preview or thumbnail. */
export interface DocumentBlobState {
  url: string | null;
  loading: boolean;
  error: string | null;
}

export type FilesScope = "visit" | "all";

/** Fetches a document through the authenticated API and exposes a blob: URL, revoked on cleanup. */
export function useDocumentBlobUrl(clinicId: string, documentId: string | null): DocumentBlobState {
  const [state, setState] = useState<DocumentBlobState>({ url: null, loading: false, error: null });

  useEffect(() => {
    if (!documentId) {
      setState({ url: null, loading: false, error: null });
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    setState({ url: null, loading: true, error: null });
    fetchPatientDocumentBlob(clinicId, documentId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setState({ url: objectUrl, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Could not load the file";
        setState({ url: null, loading: false, error: message });
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [clinicId, documentId]);

  return state;
}

/** True once the element has been scrolled into view (thumbnails load lazily). */
export function useInView<T extends Element>(ref: RefObject<T | null>): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setInView(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, inView]);
  return inView;
}
