"use client";

import { runSave } from "./run-save";
import {
  ACCEPT,
  SIZE_LIMITS,
  formatBytes,
  isAcceptedFile,
  kindForFile,
  type FilesScope,
  type PendingUpload,
  type UploadProgress,
} from "./FilesShared";
import { FilesDeleteDialog, FilesPreviewDialog, FilesUploadDialog, PatientFilesView } from "./FilesPanelView";
import { useState } from "react";
import { showErrorToast } from "@/hooks/utils/use-toast";
import {
  fetchPatientDocumentBlob,
  newUploadId,
  useDeletePatientDocument,
  usePatientDocuments,
  useUploadPatientDocument,
} from "@/hooks/query/usePatientDocuments";
import { getPatientDocumentAccessUrl } from "@/lib/actions/patient-documents.server";
import { PATIENT_DOCUMENT_SUB_TYPE_OPTIONS, type PatientDocument } from "@/types/patient-document.types";

export type { PatientFilesCategory } from "./FilesShared";
import type { PatientFilesCategory } from "./FilesShared";

interface PatientFilesPanelProps {
  clinicId: string;
  patientId: string;
  /** When set, uploads default to this visit and the list shows a "this visit / all" toggle. */
  visitId?: string;
  category: PatientFilesCategory;
}

const TOAST_ID = "patient-files-panel";
const LIST_LIMIT = 100;

/**
 * Shared upload/list/preview panel used for both the Investigation tab
 * (X-ray / lab / MRI reports, audio, video) and the Documents tab (ID proof,
 * consent forms, old prescriptions). Files are uploaded one at a time from the
 * browser; previews stream through the authenticated API.
 *
 * This file holds the data and the rules; the layout is in `FilesPanelView`.
 */
export function PatientFilesPanel({ clinicId, patientId, visitId, category }: PatientFilesPanelProps) {
  const accept = ACCEPT[category];
  const options = PATIENT_DOCUMENT_SUB_TYPE_OPTIONS[category];

  const [scope, setScope] = useState<FilesScope>(visitId ? "visit" : "all");
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [preview, setPreview] = useState<PatientDocument | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PatientDocument | null>(null);

  const effectiveScope: FilesScope = visitId ? scope : "all";
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
    <>
      <PatientFilesView
        clinicId={clinicId}
        category={category}
        accept={accept}
        options={options}
        hasVisit={Boolean(visitId)}
        scope={effectiveScope}
        onScopeChange={setScope}
        documents={documents}
        total={query.data ? query.data.total : null}
        isLoading={query.isPending}
        error={query.error ? query.error.message : null}
        uploading={uploading}
        deleting={remove.isPending}
        onFilesChosen={addFiles}
        onPreview={setPreview}
        onDownload={(doc) => void handleDownload(doc)}
        onDelete={setDeleteTarget}
      />

      <FilesUploadDialog
        pending={pending}
        options={options}
        showVisitToggle={Boolean(visitId)}
        progress={progress}
        onChange={(next) => setPending((prev) => prev.map((entry) => (entry.id === next.id ? next : entry)))}
        onRemove={(id) => setPending((prev) => prev.filter((entry) => entry.id !== id))}
        onCancel={() => setPending([])}
        onUpload={() => void handleUploadAll()}
      />

      <FilesPreviewDialog clinicId={clinicId} document={preview} onClose={() => setPreview(null)} />

      <FilesDeleteDialog
        category={category}
        target={deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
