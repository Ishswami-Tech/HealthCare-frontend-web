"use client";

import { useRef, useState } from "react";
import { FileText, FlaskConical, Loader2, Pill as PillIcon, ScanLine, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MAX_UPLOAD_BYTES, UPLOAD_OPTIONS, formatBytes, uploadProblem, type UploadType } from "./patient-health.logic";

const TYPE_ICON: Record<UploadType, LucideIcon> = {
  LAB_TEST: FlaskConical,
  XRAY: ScanLine,
  PRESCRIPTION: PillIcon,
  DIAGNOSIS_REPORT: FileText,
};

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
        <UploadForm onUpload={onUpload} isUploading={isUploading} onCancel={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function UploadForm({
  onUpload,
  isUploading,
  onCancel,
}: {
  onUpload: (type: UploadType, file: File) => void;
  isUploading: boolean;
  onCancel: () => void;
}) {
  const [type, setType] = useState<UploadType>("LAB_TEST");
  const [file, setFile] = useState<File | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
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
      </div>

      <DialogFooter>
        <Button variant="outline" size="md" disabled={isUploading} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="md"
          disabled={!file || !!problem || isUploading}
          onClick={() => {
            if (file && !problem) onUpload(type, file);
          }}
        >
          {isUploading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />}
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
      </DialogFooter>
    </>
  );
}
