"use client";

import { runSave } from "./run-save";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  AudioLines,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { showErrorToast } from "@/hooks/utils/use-toast";
import {
  fetchPatientDocumentBlob,
  newUploadId,
  patientDocumentMediaUrl,
  useDeletePatientDocument,
  usePatientDocuments,
  useUploadPatientDocument,
} from "@/hooks/query/usePatientDocuments";
import { getPatientDocumentAccessUrl } from "@/lib/actions/patient-documents.server";
import { formatDateInIST } from "@/lib/utils/date-time";
import { cn } from "@/lib/utils/index";
import {
  PATIENT_DOCUMENT_SUB_TYPE_OPTIONS,
  type PatientDocument,
  type PatientDocumentMediaKind,
  type PatientDocumentSubTypeOption,
} from "@/types/patient-document.types";

export type PatientFilesCategory = "INVESTIGATION" | "DOCUMENT";

interface PatientFilesPanelProps {
  clinicId: string;
  patientId: string;
  /** When set, uploads default to this visit and the list shows a "this visit / all" toggle. */
  visitId?: string;
  category: PatientFilesCategory;
}

// ---------------------------------------------------------------------------
// Client-side acceptance rules (the backend re-validates by file signature)
// ---------------------------------------------------------------------------

const MB = 1024 * 1024;
const TOAST_ID = "patient-files-panel";
const LIST_LIMIT = 100;

type AcceptedKind = Exclude<PatientDocumentMediaKind, "OTHER">;

const SIZE_LIMITS: Record<AcceptedKind, number> = {
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

const ACCEPT: Record<PatientFilesCategory, string> = {
  INVESTIGATION: ".pdf,.jpg,.jpeg,.png,.webp,.heic,.mp3,.wav,.m4a,.ogg,.mp4,.m4v,.mov,.webm,.mkv",
  DOCUMENT: ".pdf,.jpg,.jpeg,.png,.webp,.heic",
};

const COPY: Record<PatientFilesCategory, { title: string; subtitle: string; empty: string }> = {
  INVESTIGATION: {
    title: "Investigations",
    subtitle: "X-ray, lab, MRI, CT, USG and ECG reports — PDF, image, audio or video.",
    empty: "No investigations uploaded yet.",
  },
  DOCUMENT: {
    title: "Documents",
    subtitle: "ID proof, consent forms, old prescriptions and referral letters — PDF or image.",
    empty: "No documents uploaded yet.",
  },
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The picker's `accept` list is a hint, not a guarantee — the user can still
 * choose "All files" on most platforms — so the extension is re-checked here.
 */
function isAcceptedFile(file: File, accept: string): boolean {
  const allowed = accept
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  const name = file.name.toLowerCase();
  return allowed.some((ext) => name.endsWith(ext));
}

function kindForFile(file: File): AcceptedKind | null {
  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  const kind = EXTENSION_KIND[extension] ?? null;
  if (kind === "VIDEO" && file.type.startsWith("audio/")) return "AUDIO";
  return kind;
}

function subTypeLabel(options: readonly PatientDocumentSubTypeOption[], value: string | null): string | null {
  if (!value) return null;
  return options.find((option) => option.value === value)?.label ?? value;
}

function MediaKindIcon({ kind, className }: { kind: PatientDocumentMediaKind; className?: string }) {
  const classes = cn("size-8 text-muted-foreground", className);
  switch (kind) {
    case "IMAGE":
      return <ImageIcon className={classes} aria-hidden="true" />;
    case "PDF":
      return <FileText className={classes} aria-hidden="true" />;
    case "AUDIO":
      return <AudioLines className={classes} aria-hidden="true" />;
    case "VIDEO":
      return <Video className={classes} aria-hidden="true" />;
    default:
      return <FileIcon className={classes} aria-hidden="true" />;
  }
}

/** Fetches a document through the authenticated API and exposes a blob: URL, revoked on cleanup. */
function useDocumentBlobUrl(clinicId: string, documentId: string | null) {
  const [state, setState] = useState<{ url: string | null; loading: boolean; error: string | null }>({
    url: null,
    loading: false,
    error: null,
  });

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
function useInView<T extends Element>(ref: RefObject<T | null>): boolean {
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

// ---------------------------------------------------------------------------
// Pending upload form
// ---------------------------------------------------------------------------

interface PendingUpload {
  id: string;
  file: File;
  subType: string;
  title: string;
  notes: string;
  reportDate: string;
  linkToVisit: boolean;
}

interface PendingUploadFormProps {
  item: PendingUpload;
  options: readonly PatientDocumentSubTypeOption[];
  showVisitToggle: boolean;
  disabled: boolean;
  onChange: (next: PendingUpload) => void;
  onRemove: () => void;
}

function PendingUploadForm({ item, options, showVisitToggle, disabled, onChange, onRemove }: PendingUploadFormProps) {
  const kind = kindForFile(item.file) ?? "OTHER";
  return (
    <div className="rounded-xl border border-border/70 bg-background/60 p-3">
      <div className="mb-3 flex items-center gap-2">
        <MediaKindIcon kind={kind} className="size-5" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium" title={item.file.name}>
          {item.file.name}
          <span className="ml-2 text-xs font-normal text-muted-foreground">{formatBytes(item.file.size)}</span>
        </p>
        <Button variant="ghost" size="icon" aria-label={`Remove ${item.file.name}`} disabled={disabled} onClick={onRemove}>
          <X className="size-4" />
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`sub-type-${item.id}`}>Type</Label>
          <Select value={item.subType} onValueChange={(value) => onChange({ ...item, subType: value })} disabled={disabled}>
            <SelectTrigger id={`sub-type-${item.id}`} className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`report-date-${item.id}`}>Report date</Label>
          <Input
            id={`report-date-${item.id}`}
            type="date"
            value={item.reportDate}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, reportDate: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor={`title-${item.id}`}>Title</Label>
          <Input
            id={`title-${item.id}`}
            value={item.title}
            maxLength={200}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, title: event.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label htmlFor={`notes-${item.id}`}>Notes</Label>
          <Textarea
            id={`notes-${item.id}`}
            value={item.notes}
            maxLength={2000}
            rows={2}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, notes: event.target.value })}
          />
        </div>
        {showVisitToggle ? (
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <Checkbox
              checked={item.linkToVisit}
              disabled={disabled}
              onCheckedChange={(checked) => onChange({ ...item, linkToVisit: checked === true })}
            />
            Link to this visit
          </label>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards, preview and delete
// ---------------------------------------------------------------------------

interface DocumentCardProps {
  clinicId: string;
  document: PatientDocument;
  options: readonly PatientDocumentSubTypeOption[];
  busy: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function DocumentCard({ clinicId, document: doc, options, busy, onPreview, onDownload, onDelete }: DocumentCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef);
  const thumbnail = useDocumentBlobUrl(clinicId, inView && doc.mediaKind === "IMAGE" ? doc.id : null);
  const label = subTypeLabel(options, doc.subType);

  return (
    <div ref={cardRef} className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background/60">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${doc.title}`}
        className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-muted/40 transition-colors hover:bg-muted/70"
      >
        {thumbnail.url ? (
          // blob: URLs cannot go through next/image
          <img src={thumbnail.url} alt={doc.title} className="size-full object-cover" />
        ) : thumbnail.loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        ) : (
          <MediaKindIcon kind={doc.mediaKind} />
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-semibold text-foreground" title={doc.title}>
          {doc.title}
        </p>
        {label || doc.opdNumber ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {label ? <Badge variant="secondary">{label}</Badge> : null}
            {doc.opdNumber ? (
              <Badge variant="outline" className="font-mono text-[10px]">
                {doc.opdNumber}
              </Badge>
            ) : null}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {formatDateInIST(doc.reportDate ?? doc.createdAt)} · {formatBytes(doc.fileSize)}
        </p>
        <div className="mt-auto flex items-center gap-1 pt-1">
          <Button variant="outline" size="sm" className="h-8" onClick={onPreview}>
            <Eye className="size-4" />
            Preview
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Download ${doc.title}`} onClick={onDownload}>
            <Download className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label={`Delete ${doc.title}`} disabled={busy} onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function DocumentPreviewDialog({
  clinicId,
  document: doc,
  onClose,
}: {
  clinicId: string;
  document: PatientDocument | null;
  onClose: () => void;
}) {
  const needsBlob = doc?.mediaKind === "IMAGE" || doc?.mediaKind === "PDF";
  const blob = useDocumentBlobUrl(clinicId, needsBlob && doc ? doc.id : null);
  const mediaSrc = doc ? patientDocumentMediaUrl(clinicId, doc.id) : "";

  let body: ReactNode = null;
  if (doc) {
    if (needsBlob) {
      if (blob.loading) {
        body = (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        );
      } else if (blob.error || !blob.url) {
        body = <p className="p-4 text-sm text-destructive">{blob.error ?? "Could not load the file."}</p>;
      } else if (doc.mediaKind === "IMAGE") {
        // blob: URLs cannot go through next/image
        body = <img src={blob.url} alt={doc.title} className="mx-auto max-h-[70vh] w-auto rounded-lg object-contain" />;
      } else {
        // The blob: iframe needs `frame-src blob:` in the CSP (src/proxy.ts); the
        // new-tab button is a top-level navigation and works regardless.
        const pdfUrl = blob.url;
        body = (
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" className="h-8" onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}>
                <Eye className="size-4" />
                Open in new tab
              </Button>
            </div>
            <iframe src={pdfUrl} title={doc.title} className="h-[70vh] w-full rounded-lg border border-border/70 bg-white" />
          </div>
        );
      }
    } else if (doc.mediaKind === "AUDIO") {
      body = <audio controls preload="metadata" src={mediaSrc} className="w-full" />;
    } else if (doc.mediaKind === "VIDEO") {
      body = <video controls preload="metadata" src={mediaSrc} className="max-h-[70vh] w-full rounded-lg bg-black" />;
    } else {
      body = <p className="p-4 text-sm text-muted-foreground">Preview is not available for this file. Use Download instead.</p>;
    }
  }

  return (
    <Dialog open={!!doc} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6">{doc?.title ?? "Preview"}</DialogTitle>
          <DialogDescription>
            {doc ? `${doc.fileName} · ${formatBytes(doc.fileSize)}${doc.notes ? ` · ${doc.notes}` : ""}` : ""}
          </DialogDescription>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

/**
 * Shared upload/list/preview panel used for both the Investigation tab
 * (X-ray / lab / MRI reports, audio, video) and the Documents tab (ID proof,
 * consent forms, old prescriptions). Files are uploaded one at a time from the
 * browser; previews stream through the authenticated API.
 */
export function PatientFilesPanel({ clinicId, patientId, visitId, category }: PatientFilesPanelProps) {
  const copy = COPY[category];
  const accept = ACCEPT[category];
  const options = PATIENT_DOCUMENT_SUB_TYPE_OPTIONS[category];

  const [scope, setScope] = useState<"visit" | "all">(visitId ? "visit" : "all");
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [progress, setProgress] = useState<{ done: number; total: number; current: string } | null>(null);
  const [preview, setPreview] = useState<PatientDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientDocument | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const effectiveScope = visitId ? scope : "all";
  const query = usePatientDocuments(clinicId, patientId, {
    category,
    ...(effectiveScope === "visit" && visitId ? { visitId } : {}),
    limit: LIST_LIMIT,
  });
  const upload = useUploadPatientDocument();
  const remove = useDeletePatientDocument();
  const documents = query.data?.documents ?? [];
  const uploading = progress !== null;

  const addFiles = (files: FileList | File[]) => {
    const accepted: PendingUpload[] = [];
    for (const file of Array.from(files)) {
      if (!isAcceptedFile(file, accept)) {
        showErrorToast(`${file.name}: accepted types are ${accept.replaceAll(".", "").replaceAll(",", ", ")}.`, {
          id: TOAST_ID,
          skipSanitization: true,
        });
        continue;
      }
      if (file.size === 0) {
        showErrorToast(`${file.name} is empty.`, { id: TOAST_ID, skipSanitization: true });
        continue;
      }
      const kind = kindForFile(file);
      const limit = kind ? SIZE_LIMITS[kind] : 0;
      if (limit > 0 && file.size > limit) {
        showErrorToast(`${file.name} is ${formatBytes(file.size)}. The limit for ${kind?.toLowerCase()} files is ${formatBytes(limit)}.`, {
          id: TOAST_ID,
          skipSanitization: true,
        });
        continue;
      }
      accepted.push({
        id: newUploadId(),
        file,
        subType: "",
        title: file.name,
        notes: "",
        reportDate: "",
        linkToVisit: Boolean(visitId),
      });
    }
    if (accepted.length > 0) {
      setPending((prev) => [...prev, ...accepted]);
    }
  };

  const handleUploadAll = async () => {
    const items = pending;
    if (items.length === 0) return;
    const failed: PendingUpload[] = [];
    let done = 0;
    for (const item of items) {
      setProgress({ done, total: items.length, current: item.file.name });
      const ok = await runSave(() =>
        upload.mutateAsync({
          clinicId,
          category,
          file: item.file,
          uploadId: item.id,
          input: {
            patientId,
            ...(item.linkToVisit && visitId ? { visitId } : {}),
            ...(item.subType ? { subType: item.subType } : {}),
            ...(item.title.trim() ? { title: item.title.trim() } : {}),
            ...(item.notes.trim() ? { notes: item.notes.trim() } : {}),
            ...(item.reportDate ? { reportDate: item.reportDate } : {}),
          },
        }),
      );
      if (ok) done += 1;
      else failed.push({ ...item, id: newUploadId() });
    }
    setProgress(null);
    // Failed files stay queued so they can be fixed and retried.
    setPending(failed);
  };

  const handleDownload = async (doc: PatientDocument) => {
    try {
      const access = await getPatientDocumentAccessUrl(clinicId, doc.id, "attachment");
      const anchor = document.createElement("a");
      let objectUrl: string | null = null;
      if (/^https?:\/\//i.test(access.url)) {
        anchor.href = access.url;
        anchor.target = "_blank";
      } else {
        objectUrl = URL.createObjectURL(await fetchPatientDocumentBlob(clinicId, doc.id));
        anchor.href = objectUrl;
        anchor.download = doc.fileName;
      }
      anchor.rel = "noopener noreferrer";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      if (objectUrl) {
        const url = objectUrl;
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      }
    } catch (error) {
      showErrorToast(error, { id: TOAST_ID });
    }
  };

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setDeleteTarget(null);
    await runSave(() => remove.mutateAsync({ clinicId, id: target.id }));
  };

  return (
    <Card className="border-border/70 bg-card shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">{copy.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {visitId ? (
              <div className="flex rounded-lg border border-border/70 p-0.5" role="group" aria-label="Filter by visit">
                <Button
                  variant={effectiveScope === "visit" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7"
                  aria-pressed={effectiveScope === "visit"}
                  onClick={() => setScope("visit")}
                >
                  This visit
                </Button>
                <Button
                  variant={effectiveScope === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7"
                  aria-pressed={effectiveScope === "all"}
                  onClick={() => setScope("all")}
                >
                  All visits
                </Button>
              </div>
            ) : null}
            <Button size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Upload className="size-4" />
              Upload
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-y-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={accept}
          className="sr-only"
          aria-label={`Choose ${copy.title.toLowerCase()} to upload`}
          onChange={(event) => {
            if (event.target.files) addFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop files here or press Enter to choose files"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            addFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center text-sm transition-colors",
            dragActive ? "border-primary bg-primary/5 text-foreground" : "border-border/70 bg-background/60 text-muted-foreground hover:bg-muted/40",
          )}
        >
          <Upload className="size-5" aria-hidden="true" />
          <span>Drag and drop files here, or click to choose</span>
          <span className="text-xs">Images up to 10 MB · PDF 20 MB · Audio 25 MB · Video 50 MB</span>
        </div>

        {query.error ? (
          <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            Could not load files. {query.error.message}
          </p>
        ) : documents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
            {query.isPending ? "Loading…" : copy.empty}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                clinicId={clinicId}
                document={doc}
                options={options}
                busy={remove.isPending}
                onPreview={() => setPreview(doc)}
                onDownload={() => void handleDownload(doc)}
                onDelete={() => setDeleteTarget(doc)}
              />
            ))}
          </div>
        )}
        {query.data && query.data.total > documents.length ? (
          <p className="text-xs text-muted-foreground">
            Showing the latest {documents.length} of {query.data.total} files.
          </p>
        ) : null}
      </CardContent>

      <Dialog
        open={pending.length > 0}
        onOpenChange={(open) => {
          if (!open && !uploading) setPending([]);
        }}
      >
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Upload {pending.length} {pending.length === 1 ? "file" : "files"}
            </DialogTitle>
            <DialogDescription>Add details for each file. Files are uploaded one at a time.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {pending.map((item) => (
              <PendingUploadForm
                key={item.id}
                item={item}
                options={options}
                showVisitToggle={Boolean(visitId)}
                disabled={uploading}
                onChange={(next) => setPending((prev) => prev.map((entry) => (entry.id === next.id ? next : entry)))}
                onRemove={() => setPending((prev) => prev.filter((entry) => entry.id !== item.id))}
              />
            ))}
          </div>
          {progress ? (
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <Progress value={(progress.done / progress.total) * 100} />
              <p className="truncate text-xs text-muted-foreground">
                Uploading {progress.current} ({progress.done + 1} of {progress.total})
              </p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" disabled={uploading} onClick={() => setPending([])}>
              Cancel
            </Button>
            <Button disabled={uploading || pending.length === 0} onClick={() => void handleUploadAll()}>
              {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Upload className="size-4" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewDialog clinicId={clinicId} document={preview} onClose={() => setPreview(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => (open ? undefined : setDeleteTarget(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget ? `"${deleteTarget.title}" will be removed from the patient's ${copy.title.toLowerCase()}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
