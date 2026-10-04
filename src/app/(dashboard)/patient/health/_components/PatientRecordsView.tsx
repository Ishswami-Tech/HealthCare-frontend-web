"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronRight,
  CircleAlert,
  ClipboardList,
  FileText,
  HeartPulse,
  Leaf,
  Pill as PillIcon,
  RefreshCw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EmptyBlock,
  GridHead,
  GridRow,
  IconBox,
  Kv,
  Note,
  Pill,
  SearchBox,
  Surface,
  statusLabel,
  statusTone,
} from "@/components/tbd";
import { HashTabs } from "@/hooks/navigation/HashTabs";
import { ReportsTable } from "./ReportsTable";
import {
  dayTimeLabel,
  filterHistory,
  severityTone,
  type AllergyEntry,
  type HistoryEntry,
  type RecordPrescription,
  type ReportRow,
  type VitalHistoryRow,
} from "./patient-health.logic";

const RECORD_TABS = ["history", "prescriptions", "reports", "vitals", "allergies", "diet"] as const;
const VITAL_COLUMNS = "190px minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr)";
const LIST_STEP = 6;
const VITAL_STEP = 8;

export interface PatientRecordsViewProps {
  isLoading?: boolean;
  /** The health record could not be loaded. */
  failed?: boolean;
  onRetry: () => void;
  history: HistoryEntry[];
  prescriptions: RecordPrescription[];
  /** Lab reports, imaging and uploaded files (prescriptions have their own tab). */
  reports: ReportRow[];
  vitals: VitalHistoryRow[];
  allergies: AllergyEntry[];
  /** Opens the upload dialog. */
  onUpload: () => void;
}

function ListSkeleton() {
  return (
    <div className="flex flex-col" aria-busy="true" aria-label="Loading your records">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3.5 border-b border-hair py-3.5 last:border-b-0">
          <Skeleton className="size-11 shrink-0 rounded-[14px]" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48 max-w-[60%] rounded-md" />
            <Skeleton className="h-3 w-64 max-w-[80%] rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ShowMore({ total, visible, onMore }: { total: number; visible: number; onMore: () => void }) {
  if (total <= visible) return null;
  return (
    <Button variant="soft" className="self-center" onClick={onMore}>
      Show more
    </Button>
  );
}

function Panel({
  title,
  description,
  action,
  isLoading,
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  isLoading: boolean;
  children: ReactNode;
}) {
  return (
    <Surface as="section" aria-label={title}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 text-base font-bold text-ink">{title}</h3>
          <p className="m-0 text-[13px] text-ink-muted">{description}</p>
        </div>
        {/* Wraps under the title on a phone, so two buttons never push the card wider. */}
        {action ? <div className="flex flex-wrap items-center gap-2">{action}</div> : null}
      </div>
      {isLoading ? <ListSkeleton /> : children}
    </Surface>
  );
}

/**
 * Records: everything the clinic keeps on the patient's health record, in six tabs.
 * Reachable at `/patient/health#records` (a tab at `#records/vitals`).
 */
export function PatientRecordsView({
  isLoading = false,
  failed = false,
  onRetry,
  history,
  prescriptions,
  reports,
  vitals,
  allergies,
  onUpload,
}: PatientRecordsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [historyVisible, setHistoryVisible] = useState(LIST_STEP);
  const [prescriptionsVisible, setPrescriptionsVisible] = useState(LIST_STEP);
  const [vitalsVisible, setVitalsVisible] = useState(VITAL_STEP);

  const filteredHistory = filterHistory(history, searchTerm);

  return (
    <section id="records" aria-labelledby="patient-records-title" className="flex min-w-0 scroll-mt-4 flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id="patient-records-title" className="m-0 text-base font-bold text-ink">
          Records
        </h2>
        <p className="m-0 text-[13px] text-ink-muted">What your clinic keeps on your health record.</p>
      </div>

      {failed ? (
        <Surface flush role="alert">
          <EmptyBlock
            icon={CircleAlert}
            tone="rose"
            title="We could not load your records"
            description="Please check your connection and try again."
            action={
              <Button variant="outline" size="md" onClick={onRetry}>
                <RefreshCw aria-hidden="true" />
                Try again
              </Button>
            }
          />
        </Surface>
      ) : (
        <HashTabs tabs={RECORD_TABS} defaultValue="history" namespace="records" className="flex flex-col gap-y-3">
          <TabsList aria-label="Record type">
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="diet">Diet</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-0">
            <Panel title="Medical history" description="Conditions and treatments your doctors have recorded." isLoading={isLoading}>
              {history.length === 0 ? (
                <EmptyBlock
                  icon={ClipboardList}
                  title="No medical history yet"
                  description="Your doctor adds conditions and treatments here after a visit."
                />
              ) : (
                <>
                  <SearchBox
                    value={searchTerm}
                    onChange={(value) => {
                      setSearchTerm(value);
                      setHistoryVisible(LIST_STEP);
                    }}
                    placeholder="Search your medical history"
                  />
                  {filteredHistory.length === 0 ? (
                    <p className="m-0 py-6 text-center text-[13px] text-ink-muted">No record matches this search.</p>
                  ) : (
                    <ul className="m-0 flex list-none flex-col p-0">
                      {filteredHistory.slice(0, historyVisible).map((entry) => (
                        <li key={entry.id} className="border-b border-hair last:border-b-0">
                          <button
                            type="button"
                            onClick={() => setSelected(entry)}
                            aria-label={`Open ${entry.title}`}
                            className="flex w-full flex-wrap items-center gap-x-3.5 gap-y-2 rounded-lg py-3.5 text-left text-ink hover:text-brand-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand/40"
                          >
                            <IconBox icon={ClipboardList} tone="mint" />
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                              <span className="truncate text-sm font-bold">{entry.title}</span>
                              <span className="truncate text-xs text-ink-muted">
                                {[entry.dateLabel, entry.doctor, entry.treatment || entry.diagnosis].filter(Boolean).join(" · ") ||
                                  "No details recorded"}
                              </span>
                            </span>
                            {entry.status ? <Pill tone={statusTone(entry.status)}>{statusLabel(entry.status)}</Pill> : null}
                            <ChevronRight className="size-4 shrink-0 text-ink-soft" strokeWidth={2.2} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <ShowMore
                    total={filteredHistory.length}
                    visible={historyVisible}
                    onMore={() => setHistoryVisible(historyVisible + LIST_STEP)}
                  />
                </>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="prescriptions" className="mt-0">
            <Panel
              title="Prescriptions"
              description="What your doctors prescribed at each visit."
              isLoading={isLoading}
              action={
                <Button variant="soft" asChild>
                  <Link href="/patient/health/medicines">
                    Open Medicines
                    <ChevronRight aria-hidden="true" />
                  </Link>
                </Button>
              }
            >
              {prescriptions.length === 0 ? (
                <EmptyBlock
                  icon={PillIcon}
                  title="No prescriptions yet"
                  description="Prescriptions from your doctor show here after a visit."
                />
              ) : (
                <>
                  <ul className="m-0 flex list-none flex-col p-0">
                    {prescriptions.slice(0, prescriptionsVisible).map((prescription) => (
                      <li
                        key={prescription.id}
                        className="flex flex-wrap items-start gap-x-3.5 gap-y-2 border-b border-hair py-3.5 last:border-b-0"
                      >
                        <IconBox icon={PillIcon} tone="video" />
                        <div className="flex min-w-0 flex-1 flex-col gap-1">
                          <span className="text-sm font-bold text-ink">
                            {[prescription.number, prescription.diagnosis].filter(Boolean).join(" · ")}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {[prescription.dateLabel, prescription.doctor].filter(Boolean).join(" · ") || "No date recorded"}
                          </span>
                          {prescription.medicines.length > 0 ? (
                            <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0 text-[13px]">
                              {prescription.medicines.map((medicine) => (
                                <li key={medicine.id} className="leading-normal">
                                  <span className="font-bold text-ink">{medicine.name}</span>
                                  {medicine.detail ? <span className="text-ink-muted"> · {medicine.detail}</span> : null}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {prescription.notes ? (
                            <span className="text-xs text-ink-muted">Instructions: {prescription.notes}</span>
                          ) : null}
                        </div>
                        {prescription.status ? (
                          <Pill tone={statusTone(prescription.status)}>{statusLabel(prescription.status)}</Pill>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <ShowMore
                    total={prescriptions.length}
                    visible={prescriptionsVisible}
                    onMore={() => setPrescriptionsVisible(prescriptionsVisible + LIST_STEP)}
                  />
                </>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Panel
              title="Reports and files"
              description="Lab and imaging reports, and the files on your record."
              isLoading={isLoading}
              action={
                <>
                  <Button variant="outline" onClick={onUpload}>
                    <Upload aria-hidden="true" />
                    Upload report
                  </Button>
                  <Button variant="soft" asChild>
                    <Link href="/patient/health/reports">
                      Open Reports &amp; Lab
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </Button>
                </>
              }
            >
              {reports.length === 0 ? (
                <EmptyBlock
                  icon={FileText}
                  title="No reports yet"
                  description="Reports from your clinic and the files you upload show here."
                />
              ) : (
                <ReportsTable rows={reports} pageSize={6} />
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="vitals" className="mt-0">
            <Panel title="Vitals history" description="Every reading your clinic has recorded, newest first." isLoading={isLoading}>
              {vitals.length === 0 ? (
                <EmptyBlock
                  icon={HeartPulse}
                  title="No readings yet"
                  description="Your clinic records your vitals at each visit."
                />
              ) : (
                <>
                  <div role="table" aria-label="Vitals history">
                    <GridHead columns={VITAL_COLUMNS} labels={["Recorded", "Vital", "Value", "Notes"]} className="px-0" />
                    {vitals.slice(0, vitalsVisible).map((row) => (
                      <GridRow key={row.id} columns={VITAL_COLUMNS} className="gap-1.5 px-0 lg:min-h-[52px]">
                        <span role="cell" className="text-[13px] text-ink-muted">
                          {dayTimeLabel(row.date) || "No date"}
                        </span>
                        <span role="cell" className="font-bold text-ink">
                          {row.name}
                        </span>
                        <span role="cell" className="font-bold text-ink">
                          {row.value || "-"}
                        </span>
                        <span role="cell" className={row.notes ? "text-[13px] text-ink-muted" : "hidden text-[13px] text-ink-muted lg:block"}>
                          {row.notes || "-"}
                        </span>
                      </GridRow>
                    ))}
                  </div>
                  <ShowMore
                    total={vitals.length}
                    visible={vitalsVisible}
                    onMore={() => setVitalsVisible(vitalsVisible + VITAL_STEP)}
                  />
                </>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="allergies" className="mt-0">
            <Panel title="Allergies" description="Known allergies and sensitivities." isLoading={isLoading}>
              {allergies.length === 0 ? (
                <EmptyBlock
                  icon={ShieldAlert}
                  title="No allergies recorded"
                  description="Tell your doctor if you are allergic to a medicine or a food."
                />
              ) : (
                <>
                  <ul className="m-0 flex list-none flex-col p-0">
                    {allergies.map((allergy) => (
                      <li
                        key={allergy.id}
                        className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-b border-hair py-3.5 last:border-b-0"
                      >
                        <IconBox icon={ShieldAlert} tone="rose" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="text-sm font-bold text-ink">{allergy.allergen}</span>
                          <span className="text-xs text-ink-muted">
                            {[
                              allergy.reaction ? `Reaction: ${allergy.reaction}` : "",
                              allergy.onsetLabel ? `Since ${allergy.onsetLabel}` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No reaction recorded"}
                          </span>
                        </span>
                        {allergy.severity ? (
                          <Pill tone={severityTone(allergy.severity)}>{statusLabel(allergy.severity)}</Pill>
                        ) : null}
                        {allergy.status ? <Pill tone="slate">{statusLabel(allergy.status)}</Pill> : null}
                      </li>
                    ))}
                  </ul>
                  <Note tone="amber" icon={CircleAlert}>
                    Always tell your doctor about these allergies before any treatment or prescription.
                  </Note>
                </>
              )}
            </Panel>
          </TabsContent>

          <TabsContent value="diet" className="mt-0">
            <Panel title="Diet plan" description="Diet and lifestyle advice from your doctor." isLoading={false}>
              <EmptyBlock
                icon={Leaf}
                title="No diet plan yet"
                description="Your doctor has not shared a diet plan. Ask for one at your next visit."
              />
            </Panel>
          </TabsContent>
        </HashTabs>
      )}

      <Dialog open={selected !== null} onOpenChange={(open) => (open ? undefined : setSelected(null))}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-[560px]">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
                <DialogDescription>Medical history record</DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Kv label="Date" value={selected.dateLabel || "Not recorded"} />
                  <Kv label="Doctor" value={selected.doctor || "Not recorded"} />
                  <Kv
                    label="Status"
                    value={
                      selected.status ? (
                        <Pill tone={statusTone(selected.status)}>{statusLabel(selected.status)}</Pill>
                      ) : (
                        "Not recorded"
                      )
                    }
                  />
                </div>
                {[
                  { label: "Diagnosis", value: selected.diagnosis },
                  { label: "Treatment", value: selected.treatment },
                  { label: "Notes", value: selected.notes },
                ]
                  .filter((block) => block.value)
                  .map((block) => (
                    <div key={block.label} className="flex flex-col gap-1">
                      <span className="text-xs text-ink-muted">{block.label}</span>
                      <p className="m-0 rounded-xl bg-well px-3.5 py-2.5 text-sm text-ink">{block.value}</p>
                    </div>
                  ))}
              </div>
              <DialogFooter>
                <Button variant="outline" size="md" onClick={() => setSelected(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
