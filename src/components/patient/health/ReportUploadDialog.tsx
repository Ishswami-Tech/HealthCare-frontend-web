"use client";

import { useRef, useState } from "react";
import { FileText, FlaskConical, Loader2, Pill as PillIcon, ScanLine, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/tbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, UPLOAD_OPTIONS, uploadProblem, type UploadType } from "./patient-health.logic";
import { formatBytes } from "@/lib/utils/labels";

const TYPE_ICON: Record<UploadType, LucideIcon> = {
  LAB_TEST: FlaskConical,
  XRAY: ScanLine,
  PRESCRIPTION: PillIcon,
  DIAGNOSIS_REPORT: FileText,
};

/** Optional details the full upload page asks for (board WebUploadReport). */
export interface ReportUploadDetails {
  name: string;
  /** yyyy-mm-dd */
  date: string;
  note: string;
}

/** One line for the upload's description: "Lipid Profile · 2026-10-14 · fasting 12 h". */
export function describeUpload(details: ReportUploadDetails | undefined): string | undefined {
  if (!details) return undefined;
  const line = [details.name.trim(), details.date, details.note.trim()].filter(Boolean).join(" · ");
  return line || undefined;
}

export interface ReportUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sends the file. The caller closes the dialog when the upload has finished. */
  onUpload: (type: UploadType, file: File) => void;
  isUploading?: boolean;
}

/** "Upload report": pick what the file is, pick the file, send it. */
export function ReportUploadDialog({ open, onOpenChange, onUpload, isUploading = false }: ReportUploadDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing while a file is on its way would hide the result.
        if (!isUploading) onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Upload a report</DialogTitle>
          <DialogDescription>
            Choose what it is, then pick a PDF or a photo. Up to {formatBytes(MAX_UPLOAD_BYTES)}.
          </DialogDescription>
        </DialogHeader>
        {/* The form lives inside the content, so every opening starts clean. */}
        <ReportUploadForm onUpload={onUpload} isUploading={isUploading} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The upload form: what the file is, the file, and (on the full page, `withDetails`) its name, date
 * and a note. The dialog and the WebUploadReport page both use it, so the checks live in one place.
 */
export function ReportUploadForm({
  onUpload,
  isUploading,
  onCancel,
  withDetails = false,
  cancelLabel = "Cancel",
}: {
  onUpload: (type: UploadType, file: File, details?: ReportUploadDetails) => void;
  isUploading: boolean;
  onCancel: () => void;
  withDetails?: boolean;
  cancelLabel?: string;
}) {
  const [type, setType] = useState<UploadType>("LAB_TEST");
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [details, setDetails] = useState<ReportUploadDetails>({ name: "", date: "", note: "" });
  const Footer = withDetails ? PageFooter : DialogFooter;
  const inputRef = useRef<HTMLInputElement>(null);
  const option = UPLOAD_OPTIONS.find((entry) => entry.type === type);

  const chooseType = (next: UploadType) => {
    setType(next);
    // A file picked for another type may not be allowed for this one.
    if (file) setProblem(uploadProblem(file, next));
  };

  const chooseFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null;
    // Clearing means picking the same file twice still fires onChange.
    event.target.value = "";
    if (!picked) return;
    setFile(picked);
    setProblem(uploadProblem(picked, type));
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <div role="radiogroup" aria-label="Type of report" className="grid grid-cols-2 gap-2.5">
          {UPLOAD_OPTIONS.map((entry) => {
            const Icon = TYPE_ICON[entry.type];
            const active = entry.type === type;
            return (
              <button
                key={entry.type}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={isUploading}
                onClick={() => chooseType(entry.type)}
                className={cn(
                  "flex min-h-[52px] items-center gap-2.5 rounded-xl border px-3 text-left text-[13px] transition-colors",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60",
                  active
                    ? "border-brand bg-mint-soft font-bold text-brand-dark"
                    : "border-line bg-card font-semibold text-ink hover:bg-mint-soft",
                )}
              >
                <Icon className="size-[18px] shrink-0 text-brand" strokeWidth={2.2} aria-hidden="true" />
                {entry.label}
              </button>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label="Report file"
          accept={option?.accept}
          onChange={chooseFile}
        />

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-bold text-ink">{file ? file.name : "No file chosen"}</span>
            <span className="text-xs text-ink-muted">
              {file ? formatBytes(file.size) : (option?.accept ?? "").replaceAll(".", "").replaceAll(",", ", ")}
            </span>
          </div>
          <Button variant="outline" disabled={isUploading} onClick={() => inputRef.current?.click()}>
            {file ? "Change file" : "Choose file"}
          </Button>
        </div>

        {problem ? (
          <p role="alert" className="m-0 text-[13px] font-semibold text-[#be123c] dark:text-rose-300">
            {problem}
          </p>
        ) : null}

        {withDetails ? (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Report name (optional)" htmlFor="report-name">
              <Input
                id="report-name"
                value={details.name}
                maxLength={80}
                disabled={isUploading}
                placeholder="For example: Lipid profile"
                onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))}
              />
            </Field>
            <Field label="Report date (optional)" htmlFor="report-date">
              <Input
                id="report-date"
                type="date"
                value={details.date}
                max={new Date().toISOString().slice(0, 10)}
                disabled={isUploading}
                onChange={(event) => setDetails((current) => ({ ...current, date: event.target.value }))}
              />
            </Field>
            <Field label="Note for the doctor (optional)" htmlFor="report-note" className="sm:col-span-2">
              <Textarea
                id="report-note"
                value={details.note}
                maxLength={300}
                disabled={isUploading}
                placeholder="For example: test done after 12 hours of fasting"
                onChange={(event) => setDetails((current) => ({ ...current, note: event.target.value }))}
              />
            </Field>
          </div>
        ) : null}
      </div>

      <Footer>
        <Button variant="outline" size="md" disabled={isUploading} onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          size="md"
          disabled={!file || !!problem || isUploading}
          onClick={() => {
            if (file && !problem) onUpload(type, file, withDetails ? details : undefined);
          }}
        >
          {isUploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </Footer>
    </>
  );
}

/** Button row of the form on a page (the dialog uses `DialogFooter`). */
function PageFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap justify-end gap-2.5 border-t border-hair pt-4">{children}</div>;
}
