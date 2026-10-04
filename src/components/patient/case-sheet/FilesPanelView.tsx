"use client";

import {
  PLAN_DIALOG_CONTENT,
  PLAN_HEAD_BUTTON,
  PLAN_INNER_CARD,
  PlanCardHeader,
  PlanConfirmDialog,
  PlanDialogBody,
  PlanDialogFooter,
  PlanDialogHeader,
  PlanField,
  PlanToggle,
} from "./PlanShared";
import {
  COPY,
  formatBytes,
  kindForFile,
  subTypeLabel,
  useDocumentBlobUrl,
  useInView,
  type DocumentBlobState,
  type FilesScope,
  type PatientFilesCategory,
  type PendingUpload,
  type UploadProgress,
} from "./FilesShared";
import { useRef, useState, type ReactNode } from "react";
import {
  ArrowUpToLine,
  AudioLines,
  Download,
  Eye,
  File as FileIcon,
  FileText,
  FolderOpen,
  ImageIcon,
  Loader2,
  Trash2,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyBlock, Note, Pill, Surface } from "@/components/tbd";
import { patientDocumentMediaUrl } from "@/hooks/query/usePatientDocuments";
import { formatDateInIST } from "@/lib/utils/date-time";
import { cn } from "@/lib/utils/index";
import type {
  PatientDocument,
  PatientDocumentMediaKind,
  PatientDocumentSubTypeOption,
} from "@/types/patient-document.types";

// ---------------------------------------------------------------------------
// File type icon
// ---------------------------------------------------------------------------

const KIND_STYLE: Record<PatientDocumentMediaKind, { icon: typeof FileText; box: string }> = {
  PDF: { icon: FileText, box: "bg-[#fee2e2] text-[#dc2626] dark:bg-red-500/15 dark:text-red-300" },
  IMAGE: { icon: ImageIcon, box: "bg-[#e0f2fe] text-[#0369a1] dark:bg-sky-500/15 dark:text-sky-300" },
  AUDIO: { icon: AudioLines, box: "bg-[#fef3c7] text-[#b45309] dark:bg-amber-500/15 dark:text-amber-300" },
  VIDEO: { icon: Video, box: "bg-[#ede9fe] text-[#6d28d9] dark:bg-violet-500/15 dark:text-violet-300" },
  OTHER: { icon: FileIcon, box: "bg-[#e2e8f0] text-[#334155] dark:bg-slate-500/20 dark:text-slate-300" },
};

/** Coloured square with the icon of the file type (red PDF, blue image, amber audio, violet video). */
function FileKindBox({ kind, size }: { kind: PatientDocumentMediaKind; size: "lg" | "sm" }) {
  const { icon: Icon, box } = KIND_STYLE[kind];
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        size === "lg" ? "size-[52px] rounded-2xl" : "size-9 rounded-[11px]",
        box,
      )}
      aria-hidden="true"
    >
      <Icon className={size === "lg" ? "size-[23px]" : "size-[17px]"} strokeWidth={2.2} />
    </span>
  );
}

const ICON_BUTTON =
  "flex size-9 shrink-0 items-center justify-center rounded-[10px] border bg-card transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40";

// ---------------------------------------------------------------------------
// File card
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
    <div ref={cardRef} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-card">
      <button
        type="button"
        onClick={onPreview}
        aria-label={`Preview ${doc.title}`}
        className="relative flex h-[116px] w-full items-center justify-center overflow-hidden bg-well transition-colors hover:bg-line focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        {thumbnail.url ? (
          // blob: URLs cannot go through next/image
          <img src={thumbnail.url} alt={doc.title} className="size-full object-cover" />
        ) : thumbnail.loading ? (
          <Loader2 className="size-6 animate-spin text-ink-muted" aria-hidden="true" />
        ) : (
          <FileKindBox kind={doc.mediaKind} size="lg" />
        )}
      </button>
      <div className="flex flex-1 flex-col gap-2 px-3.5 pb-3.5 pt-3">
        <p className="m-0 truncate text-sm font-bold text-ink" title={doc.title}>
          {doc.title}
        </p>
        {label || doc.opdNumber ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {label ? <Pill tone="slate">{label}</Pill> : null}
            {doc.opdNumber ? (
              <span className="rounded-lg border border-line px-2 py-[3px] text-[11px] font-bold leading-none text-ink-soft">
                {doc.opdNumber}
              </span>
            ) : null}
          </div>
        ) : null}
        <p className="m-0 text-xs text-ink-muted">
          {formatDateInIST(doc.reportDate ?? doc.createdAt)} · {formatBytes(doc.fileSize)}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-0.5">
          <Button variant="outline" onClick={onPreview}>
            <Eye aria-hidden="true" />
            Preview
          </Button>
          <span className="flex-1" />
          <button
            type="button"
            aria-label={`Download ${doc.title}`}
            onClick={onDownload}
            className={cn(ICON_BUTTON, "border-line text-ink hover:bg-mint-soft")}
          >
            <Download className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${doc.title}`}
            disabled={busy}
            onClick={onDelete}
            className={cn(
              ICON_BUTTON,
              "border-[#fecdd3] text-[#e11d48] hover:bg-[#fff1f2] dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30",
            )}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

const SCOPE_OPTIONS = [
  { value: "visit", label: "This visit" },
  { value: "all", label: "All visits" },
] as const;

export interface PatientFilesViewProps {
  clinicId: string;
  category: PatientFilesCategory;
  /** `accept` list for the file picker. */
  accept: string;
  options: readonly PatientDocumentSubTypeOption[];
  /** True when the panel belongs to a visit: shows the "this visit / all visits" toggle. */
  hasVisit: boolean;
  scope: FilesScope;
  onScopeChange: (scope: FilesScope) => void;
  documents: PatientDocument[];
  /** Number of files on the server (the list shows the latest ones). */
  total: number | null;
  isLoading: boolean;
  /** Message when the list could not be loaded. */
  error: string | null;
  uploading: boolean;
  deleting: boolean;
  onFilesChosen: (files: FileList | File[]) => void;
  onPreview: (document: PatientDocument) => void;
  onDownload: (document: PatientDocument) => void;
  onDelete: (document: PatientDocument) => void;
}

/** Layout of the Investigation / Documents section. Data and actions come in through props. */
export function PatientFilesView({
  clinicId,
  category,
  accept,
  options,
  hasVisit,
  scope,
  onScopeChange,
  documents,
  total,
  isLoading,
  error,
  uploading,
  deleting,
  onFilesChosen,
  onPreview,
  onDownload,
  onDelete,
}: PatientFilesViewProps) {
  const copy = COPY[category];
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const grid = cn(
    "grid grid-cols-1 gap-3.5 @[520px]:grid-cols-2 @[800px]:grid-cols-3",
    category === "DOCUMENT" && "@[1000px]:grid-cols-4",
  );

  return (
    <Surface as="section" className="@container gap-4">
      <PlanCardHeader title={copy.title} description={copy.subtitle}>
        {hasVisit ? (
          <PlanToggle
            tone="soft"
            ariaLabel="Filter by visit"
            options={SCOPE_OPTIONS}
            value={scope}
            onChange={onScopeChange}
          />
        ) : null}
        <Button className={PLAN_HEAD_BUTTON} onClick={() => inputRef.current?.click()} disabled={uploading}>
          <ArrowUpToLine aria-hidden="true" />
          Upload
        </Button>
      </PlanCardHeader>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="sr-only"
        aria-label={`Choose ${copy.title.toLowerCase()} to upload`}
        onChange={(event) => {
          if (event.target.files) onFilesChosen(event.target.files);
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
          onFilesChosen(event.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed px-4 py-[22px] text-center transition-colors",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40",
          dragActive
            ? "border-brand bg-mint"
            : "border-[#a7f3d0] bg-mint-soft hover:bg-mint dark:border-emerald-800",
        )}
      >
        <ArrowUpToLine className="size-[22px] text-brand" strokeWidth={2.2} aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">Drag and drop files here, or click to choose</span>
        <span className="text-xs text-ink-muted">{copy.limits}</span>
      </div>

      {error ? (
        <Note tone="rose">Could not load files. {error}</Note>
      ) : documents.length === 0 ? (
        isLoading ? (
          <div className={grid} aria-busy="true" aria-label="Loading files">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-[250px] rounded-2xl" />
            ))}
          </div>
        ) : (
          <EmptyBlock
            icon={FolderOpen}
            title={copy.empty}
            description={
              hasVisit && scope === "visit"
                ? "Nothing is linked to this visit. Switch to All visits to see older files."
                : "Use Upload, or drop files in the box above."
            }
            className="rounded-2xl border border-dashed border-line"
          />
        )
      ) : (
        <div className={grid}>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              clinicId={clinicId}
              document={doc}
              options={options}
              busy={deleting}
              onPreview={() => onPreview(doc)}
              onDownload={() => onDownload(doc)}
              onDelete={() => onDelete(doc)}
            />
          ))}
        </div>
      )}
      {total !== null && total > documents.length ? (
        <p className="m-0 text-xs text-ink-muted">
          Showing the latest {documents.length} of {total} files.
        </p>
      ) : null}
    </Surface>
  );
}

// ---------------------------------------------------------------------------
// Upload dialog
// ---------------------------------------------------------------------------

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
    <div className={cn(PLAN_INNER_CARD, "flex flex-col gap-3 px-4 py-3.5")}>
      <div className="flex items-center gap-2.5">
        <FileKindBox kind={kind} size="sm" />
        <p className="m-0 min-w-0 flex-1 truncate text-sm font-bold text-ink" title={item.file.name}>
          {item.file.name}
          <span className="ml-2 text-xs font-medium text-ink-muted">{formatBytes(item.file.size)}</span>
        </p>
        <button
          type="button"
          aria-label={`Remove ${item.file.name}`}
          disabled={disabled}
          onClick={onRemove}
          className={cn(ICON_BUTTON, "border-line text-ink hover:bg-well")}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PlanField label="Type" htmlFor={`sub-type-${item.id}`}>
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
        </PlanField>
        <PlanField label="Report date" htmlFor={`report-date-${item.id}`}>
          <Input
            id={`report-date-${item.id}`}
            type="date"
            value={item.reportDate}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, reportDate: event.target.value })}
          />
        </PlanField>
        <PlanField label="Title" htmlFor={`title-${item.id}`} className="sm:col-span-2">
          <Input
            id={`title-${item.id}`}
            value={item.title}
            maxLength={200}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, title: event.target.value })}
          />
        </PlanField>
        <PlanField label="Notes" htmlFor={`notes-${item.id}`} className="sm:col-span-2">
          <Textarea
            id={`notes-${item.id}`}
            value={item.notes}
            maxLength={2000}
            rows={2}
            disabled={disabled}
            onChange={(event) => onChange({ ...item, notes: event.target.value })}
            className="min-h-[60px]"
          />
        </PlanField>
        {showVisitToggle ? (
          <label className="flex items-center gap-2.5 text-sm text-ink sm:col-span-2">
            <Checkbox
              checked={item.linkToVisit}
              disabled={disabled}
              onCheckedChange={(checked) => onChange({ ...item, linkToVisit: checked === true })}
              className="size-5 rounded-[6px] border-line"
            />
            Link to this visit
          </label>
        ) : null}
      </div>
    </div>
  );
}

export interface FilesUploadDialogProps {
  pending: PendingUpload[];
  options: readonly PatientDocumentSubTypeOption[];
  showVisitToggle: boolean;
  /** Set while files are being sent, one at a time. */
  progress: UploadProgress | null;
  onChange: (next: PendingUpload) => void;
  onRemove: (id: string) => void;
  onCancel: () => void;
  onUpload: () => void;
}

/** Details for the chosen files, then Upload. Open while there is at least one file waiting. */
export function FilesUploadDialog({
  pending,
  options,
  showVisitToggle,
  progress,
  onChange,
  onRemove,
  onCancel,
  onUpload,
}: FilesUploadDialogProps) {
  const uploading = progress !== null;
  return (
    <Dialog
      open={pending.length > 0}
      onOpenChange={(open) => {
        if (!open && !uploading) onCancel();
      }}
    >
      <DialogContent showCloseButton={false} className={cn(PLAN_DIALOG_CONTENT, "sm:max-w-[680px]")}>
        <PlanDialogHeader
          title={`Upload ${pending.length} ${pending.length === 1 ? "file" : "files"}`}
          description="Add details for each file. Files are uploaded one at a time."
        />
        <PlanDialogBody>
          {pending.map((item) => (
            <PendingUploadForm
              key={item.id}
              item={item}
              options={options}
              showVisitToggle={showVisitToggle}
              disabled={uploading}
              onChange={onChange}
              onRemove={() => onRemove(item.id)}
            />
          ))}
          <p className="m-0 text-xs text-ink-muted">
            Type options: {options.map((option) => option.label).join(" · ")}
          </p>
          {progress ? (
            <div className="flex flex-col gap-1.5" aria-live="polite">
              <span
                role="progressbar"
                aria-label="Upload progress"
                aria-valuemin={0}
                aria-valuemax={progress.total}
                aria-valuenow={progress.done}
                className="block h-2 overflow-hidden rounded bg-well"
              >
                <span
                  className="block h-2 rounded bg-brand transition-[width]"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </span>
              <p className="m-0 truncate text-xs text-ink-muted">
                Uploading {progress.current} ({progress.done + 1} of {progress.total})
              </p>
            </div>
          ) : null}
        </PlanDialogBody>
        <PlanDialogFooter>
          <Button variant="outline" size="md" disabled={uploading} onClick={onCancel}>
            Cancel
          </Button>
          <Button size="md" disabled={uploading || pending.length === 0} onClick={onUpload}>
            {uploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowUpToLine aria-hidden="true" />}
            Upload
          </Button>
        </PlanDialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Preview dialog
// ---------------------------------------------------------------------------

const PREVIEW_FRAME = "rounded-[14px] border border-line bg-well";

export interface FilesPreviewDialogViewProps {
  document: PatientDocument | null;
  /** The file as a blob: URL (images and PDFs are fetched through the authenticated API). */
  blob: DocumentBlobState;
  /** Same-origin stream URL for audio and video. */
  mediaSrc: string;
  onClose: () => void;
}

/** Layout of the file preview. The file itself comes in through `blob` / `mediaSrc`. */
export function FilesPreviewDialogView({ document: doc, blob, mediaSrc, onClose }: FilesPreviewDialogViewProps) {
  const needsBlob = doc?.mediaKind === "IMAGE" || doc?.mediaKind === "PDF";

  let body: ReactNode = null;
  if (doc) {
    if (needsBlob) {
      if (blob.loading) {
        body = (
          <div className={cn(PREVIEW_FRAME, "flex h-64 items-center justify-center text-sm text-ink-muted")}>
            <Loader2 className="mr-2 size-5 animate-spin" aria-hidden="true" />
            Loading…
          </div>
        );
      } else if (blob.error || !blob.url) {
        body = <Note tone="rose">{blob.error ?? "Could not load the file."}</Note>;
      } else if (doc.mediaKind === "IMAGE") {
        body = (
          <div className={cn(PREVIEW_FRAME, "flex justify-center p-4 sm:p-6")}>
            {/* blob: URLs cannot go through next/image */}
            <img
              src={blob.url}
              alt={doc.title}
              className="max-h-[64vh] w-auto max-w-full rounded-md object-contain shadow-[0_6px_18px_rgba(15,27,45,0.12)]"
            />
          </div>
        );
      } else {
        // The blob: iframe needs `frame-src blob:` in the CSP (src/proxy.ts); the
        // new-tab button is a top-level navigation and works regardless.
        const pdfUrl = blob.url;
        body = (
          <>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => window.open(pdfUrl, "_blank", "noopener,noreferrer")}>
                <Eye aria-hidden="true" />
                Open in new tab
              </Button>
            </div>
            <div className={cn(PREVIEW_FRAME, "overflow-hidden")}>
              <iframe src={pdfUrl} title={doc.title} className="block h-[64vh] w-full border-0 bg-white" />
            </div>
          </>
        );
      }
    } else if (doc.mediaKind === "AUDIO") {
      body = (
        <div className={cn(PREVIEW_FRAME, "p-4 sm:p-6")}>
          <audio controls preload="metadata" src={mediaSrc} className="w-full" />
        </div>
      );
    } else if (doc.mediaKind === "VIDEO") {
      body = (
        <div className={cn(PREVIEW_FRAME, "overflow-hidden")}>
          <video controls preload="metadata" src={mediaSrc} className="block max-h-[64vh] w-full bg-black" />
        </div>
      );
    } else {
      body = <Note>Preview is not available for this file. Use Download instead.</Note>;
    }
  }

  return (
    <Dialog open={!!doc} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent showCloseButton={false} className={cn(PLAN_DIALOG_CONTENT, "sm:max-w-[860px]")}>
        <PlanDialogHeader
          title={doc?.title ?? "Preview"}
          description={
            doc ? `${doc.fileName} · ${formatBytes(doc.fileSize)}${doc.notes ? ` · ${doc.notes}` : ""}` : undefined
          }
        />
        <PlanDialogBody>{body}</PlanDialogBody>
      </DialogContent>
    </Dialog>
  );
}

/** File preview wired to the authenticated API (blob: URL for images and PDFs, stream for audio / video). */
export function FilesPreviewDialog({
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
  return <FilesPreviewDialogView document={doc} blob={blob} mediaSrc={mediaSrc} onClose={onClose} />;
}

// ---------------------------------------------------------------------------
// Delete dialog
// ---------------------------------------------------------------------------

export function FilesDeleteDialog({
  category,
  target,
  onCancel,
  onConfirm,
}: {
  category: PatientFilesCategory;
  /** The file to delete; the dialog is open while this is set. */
  target: PatientDocument | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <PlanConfirmDialog
      open={!!target}
      onOpenChange={(open) => (open ? undefined : onCancel())}
      title="Delete this file?"
      description={
        target ? `"${target.title}" will be removed from the patient's ${COPY[category].title.toLowerCase()}.` : ""
      }
      confirmLabel="Delete"
      confirmIcon={<Trash2 aria-hidden="true" />}
      onConfirm={onConfirm}
    />
  );
}
