"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { FlaskConical, Loader2, Plus, ScanLine, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ChoiceChip,
  DialogError,
  EmptyBlock,
  Field,
  InitialsAvatar,
  LoadError,
  Pill,
  SearchBox,
  SectionTitle,
  SkeletonRows,
  Surface,
  TbdPage,
  statusLabel,
} from "@/components/tbd";
import { cn } from "@/lib/utils";
import { RxPatientPicker } from "@/components/doctor/rx/RxPatientPicker";
import { useRxPatientContext } from "@/components/doctor/rx/useRxPatientContext";
import { useDoctorFavourites, useRemoveFavourite, useSaveFavourite } from "@/hooks/query/useDoctorFavourites";
import {
  useInvestigationOrders,
  useOrderInvestigations,
  useSetInvestigationStatus,
  type InvestigationOrder,
  type InvestigationStatus,
  type InvestigationTest,
  type InvestigationUrgency,
} from "@/hooks/query/useInvestigations";
import { useStaffRole } from "@/hooks/utils/useStaffRole";
import { formatDateInIST, formatTimeInIST } from "@/lib/utils/appointmentUtils";
import { addTests, LAB_DESTINATIONS, searchTests, TEST_PANELS, testFor } from "./investigations.logic";

const URGENCIES: { value: InvestigationUrgency; label: string }[] = [
  { value: "ROUTINE", label: "Routine" },
  { value: "URGENT", label: "Urgent" },
  { value: "STAT", label: "STAT" },
];

const STATUS_TONE: Record<InvestigationStatus, "blue" | "amber" | "green" | "slate"> = {
  ORDERED: "blue",
  SAMPLE_COLLECTED: "amber",
  RESULT_READY: "green",
  CANCELLED: "slate",
};

/** DocInvestigations: order tests for the patient of a visit, and follow every order to its result. */
export function InvestigationsContent() {
  const context = useRxPatientContext();
  const { isDoctor } = useStaffRole();

  return (
    <TbdPage
      title="Investigations"
      description={context.patientId ? `Order tests · ${context.patientName}` : "Orders and results. Choose a patient to order new tests."}
      backHref={context.appointmentId ? "/doctor/appointments" : "/doctor/dashboard"}
      backLabel={context.appointmentId ? "Appointments" : "Dashboard"}
    >
      {context.patientId ? (
        context.loading ? (
          <Surface flush>
            <SkeletonRows rows={3} />
          </Surface>
        ) : (
          <>
            <Surface className="flex-row flex-wrap items-center gap-3">
              <InitialsAvatar name={context.patientName} size={42} />
              <span className="flex min-w-[160px] flex-1 flex-col">
                <span className="text-base font-extrabold text-ink">{context.patientName}</span>
                {context.patientSummary ? <span className="text-xs text-ink-muted">{context.patientSummary}</span> : null}
              </span>
              {context.visitLabel ? <Pill tone={/video/i.test(context.visitLabel) ? "video" : "clinic"}>{context.visitLabel}</Pill> : null}
            </Surface>
            {isDoctor ? <OrderForm key={context.patientId} patientId={context.patientId} appointmentId={context.appointmentId} /> : null}
          </>
        )
      ) : isDoctor ? (
        <RxPatientPicker clinicId={context.clinicId} actionLabel="Order tests" />
      ) : null}
      <OrdersList patientId={context.patientId} canUpdate={isDoctor} />
    </TbdPage>
  );
}

function OrderForm({ patientId, appointmentId }: { patientId: string; appointmentId: string }) {
  const id = useId();
  const [search, setSearch] = useState("");
  const [tests, setTests] = useState<InvestigationTest[]>([]);
  const [urgency, setUrgency] = useState<InvestigationUrgency>("ROUTINE");
  const [destination, setDestination] = useState<string>(LAB_DESTINATIONS[0]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const order = useOrderInvestigations();

  const favouritesQuery = useDoctorFavourites("INVESTIGATION");
  const saveFavourite = useSaveFavourite();
  const removeFavourite = useRemoveFavourite();
  const favourites = useMemo(() => favouritesQuery.data ?? [], [favouritesQuery.data]);
  const favouriteByName = useMemo(() => new Map(favourites.map((favourite) => [favourite.itemKey, favourite])), [favourites]);
  const results = useMemo(() => searchTests(search), [search]);

  const add = (additions: InvestigationTest[]) => {
    setTests((current) => addTests(current, additions));
    setSearch("");
  };
  const toggleFavourite = (test: InvestigationTest) => {
    const key = test.name.trim().toLowerCase().slice(0, 120);
    const existing = favouriteByName.get(key);
    if (existing) removeFavourite.mutate(existing.id);
    else saveFavourite.mutate({ kind: "INVESTIGATION", itemKey: key, label: test.name, payload: { kind: test.kind } });
  };

  const submit = async () => {
    setError(null);
    try {
      await order.mutateAsync({
        patientId,
        ...(appointmentId ? { appointmentId } : {}),
        tests,
        urgency,
        labDestination: destination,
        ...(notes.trim() ? { notes: notes.trim().slice(0, 500) } : {}),
      });
      setTests([]);
      setNotes("");
      setUrgency("ROUTINE");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The tests could not be ordered.");
    }
  };

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Surface>
        <SectionTitle icon={FlaskConical} title="Choose tests" description="Search a test, pick a favourite or add a whole panel." />
        <div
          onKeyDown={(event) => {
            if (event.key === "Enter" && search.trim()) {
              event.preventDefault();
              add([results[0] ?? testFor(search)]);
            }
          }}
        >
          <SearchBox value={search} onChange={setSearch} placeholder="Search a test, e.g. CBC, HbA1c, urine routine" />
        </div>
        {search.trim() ? (
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {results.map((test) => (
              <li key={test.name} className="flex items-center gap-2 rounded-[10px] border border-hair px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-sm font-bold text-ink">{test.name}</span>
                  <span className="text-xs text-ink-muted">{test.detail}</span>
                </span>
                <Button type="button" size="sm" variant="outline" onClick={() => add([test])}>
                  <Plus aria-hidden="true" />
                  Add
                </Button>
              </li>
            ))}
            <li>
              <Button type="button" size="sm" variant="ghost" className="text-brand" onClick={() => add([testFor(search)])}>
                <Plus aria-hidden="true" />
                Add “{search.trim()}” as written
              </Button>
            </li>
          </ul>
        ) : null}

        {favourites.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink-muted">Your favourites</span>
            <div className="flex flex-wrap gap-1.5">
              {favourites.map((favourite) => (
                <ChoiceChip
                  key={favourite.id}
                  size="sm"
                  active={tests.some((test) => test.name.toLowerCase() === favourite.itemKey)}
                  onClick={() => add([testFor(favourite.label, favourite.payload.kind === "IMAGING" ? "IMAGING" : "LAB")])}
                >
                  {favourite.label}
                </ChoiceChip>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.5px] text-ink-muted">Panels · add several at once</span>
          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
            {TEST_PANELS.map((panel) => (
              <li key={panel.name} className="flex flex-col gap-1.5 rounded-[12px] border border-hair p-3">
                <span className="text-sm font-extrabold text-ink">{panel.name}</span>
                <span className="text-xs text-ink-muted">{panel.tests.join(" · ")}</span>
                <Button type="button" size="sm" variant="outline" className="self-start" onClick={() => add(panel.tests.map((name) => testFor(name)))}>
                  Add panel
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </Surface>

      <Surface>
        <SectionTitle title="This order" count={tests.length} description="Results reach your inbox and the patient app." />
        {tests.length === 0 ? (
          <span className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-[13px] text-ink-muted">No tests added yet.</span>
        ) : (
          <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
            {tests.map((test) => {
              const favourite = favouriteByName.has(test.name.toLowerCase());
              return (
                <li key={test.name} className="flex items-center gap-2 rounded-[12px] border border-line px-3 py-2">
                  {test.kind === "IMAGING" ? <ScanLine className="size-4 text-brand" aria-hidden="true" /> : <FlaskConical className="size-4 text-brand" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 text-sm font-bold text-ink">{test.name}</span>
                  <Pill tone={test.kind === "IMAGING" ? "video" : "teal"}>{test.kind === "IMAGING" ? "Imaging" : "Lab"}</Pill>
                  <button
                    type="button"
                    aria-pressed={favourite}
                    aria-label={favourite ? `Remove ${test.name} from favourites` : `Add ${test.name} to favourites`}
                    className="inline-flex size-7 items-center justify-center rounded-lg text-ink-muted hover:text-ink"
                    onClick={() => toggleFavourite(test)}
                  >
                    <Star className={cn("size-4", favourite && "fill-amber-400 text-amber-500")} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${test.name}`}
                    className="inline-flex size-7 items-center justify-center rounded-lg border border-line text-ink-soft hover:bg-well"
                    onClick={() => setTests((current) => current.filter((item) => item.name !== test.name))}
                  >
                    <X className="size-3" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <Field label="Urgency">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Urgency">
            {URGENCIES.map((option) => (
              <ChoiceChip key={option.value} shape="box" active={urgency === option.value} onClick={() => setUrgency(option.value)}>
                {option.label}
              </ChoiceChip>
            ))}
          </div>
        </Field>
        <Field label="Send to">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lab">
            {LAB_DESTINATIONS.map((option) => (
              <ChoiceChip key={option} shape="box" active={destination === option} onClick={() => setDestination(option)}>
                {option}
              </ChoiceChip>
            ))}
          </div>
        </Field>
        <Field label="Note for the lab (optional)" htmlFor={`${id}-notes`}>
          <Textarea
            id={`${id}-notes`}
            value={notes}
            maxLength={500}
            className="min-h-[72px] border-line"
            placeholder="Fever 3 days, rule out dengue"
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
        <DialogError lead="Not ordered." message={error} />
        <Button size="md" disabled={tests.length === 0 || order.isPending} onClick={() => void submit()}>
          {order.isPending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
          {tests.length === 0 ? "Order tests" : `Order ${tests.length} ${tests.length === 1 ? "test" : "tests"}`}
        </Button>
      </Surface>
    </div>
  );
}

function OrdersList({ patientId, canUpdate }: { patientId: string; canUpdate: boolean }) {
  const [filter, setFilter] = useState<"OPEN" | "RESULT_READY" | "ALL">("OPEN");
  const query = useInvestigationOrders(patientId ? { patientId } : {});
  const setStatus = useSetInvestigationStatus();
  const [orderSearch, setOrderSearch] = useState("");
  const orders = useMemo(() => {
    const term = orderSearch.trim().toLowerCase();
    return (query.data ?? [])
      .filter((order) =>
        filter === "ALL" ? true : filter === "RESULT_READY" ? order.status === "RESULT_READY" : order.status === "ORDERED" || order.status === "SAMPLE_COLLECTED",
      )
      .filter((order) => !term || order.patientName.toLowerCase().includes(term) || order.tests.some((test) => test.name.toLowerCase().includes(term)))
      .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime());
  }, [filter, query.data, orderSearch]);

  const actions = (order: InvestigationOrder): ReactNode => {
    if (!canUpdate || order.status === "RESULT_READY" || order.status === "CANCELLED") return null;
    return (
      <span className="flex flex-wrap gap-1.5">
        {order.status === "ORDERED" ? (
          <Button size="compact" variant="outline" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: order.id, status: "SAMPLE_COLLECTED" })}>
            Sample collected
          </Button>
        ) : null}
        <Button size="compact" variant="outline" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: order.id, status: "RESULT_READY" })}>
          Result ready
        </Button>
        <Button size="compact" variant="ghost" disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: order.id, status: "CANCELLED" })}>
          Cancel
        </Button>
      </span>
    );
  };

  return (
    <Surface flush as="section" aria-label="Investigation orders">
      <div className="flex flex-col gap-3 border-b border-hair px-5 py-4">
        <SectionTitle title={patientId ? "Orders for this patient" : "Orders & results"} count={query.data ? orders.length : undefined} />
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex gap-1.5" role="group" aria-label="Show">
            {(
              [
                { value: "OPEN", label: "Waiting" },
                { value: "RESULT_READY", label: "Results ready" },
                { value: "ALL", label: "All" },
              ] as const
            ).map((option) => (
              <ChoiceChip key={option.value} size="sm" shape="box" active={filter === option.value} onClick={() => setFilter(option.value)}>
                {option.label}
              </ChoiceChip>
            ))}
          </span>
          {patientId ? null : <Input className="h-9 max-w-xs" aria-label="Search orders" placeholder="Patient or test" value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} />}
        </div>
      </div>
      {query.isPending ? (
        <SkeletonRows rows={3} />
      ) : query.error ? (
        <LoadError title="Orders could not be loaded" message="Check the connection and try again." onRetry={() => void query.refetch()} />
      ) : orders.length === 0 ? (
        <EmptyBlock icon={FlaskConical} title="No orders here" description={filter === "OPEN" ? "Tests waiting for a sample or a result show here." : "Nothing matches this view."} />
      ) : (
        <ul className="m-0 list-none p-0">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-col gap-2 border-b border-hair px-5 py-3 last:border-b-0 lg:flex-row lg:items-center lg:gap-4">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-bold text-ink">
                  {patientId ? order.tests.map((test) => test.name).join(", ") : order.patientName}
                </span>
                <span className="text-xs text-ink-muted">
                  {[
                    patientId ? "" : order.tests.map((test) => test.name).join(", "),
                    order.labDestination,
                    order.orderedAt ? `${formatDateInIST(order.orderedAt, { day: "numeric", month: "short" })}, ${formatTimeInIST(order.orderedAt)}` : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                {order.urgency !== "ROUTINE" ? <Pill tone="rose">{order.urgency === "STAT" ? "STAT" : "Urgent"}</Pill> : null}
                <Pill tone={STATUS_TONE[order.status]} dot>
                  {statusLabel(order.status)}
                </Pill>
              </span>
              {actions(order)}
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
