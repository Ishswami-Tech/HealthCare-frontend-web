"use client";

import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert, PackagePlus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonList } from "@/components/ui/loading";
import { EmptyBlock, Note, Pill } from "@/components/tbd";
import {
  DialogError,
  Field,
  MedicineSummary,
  PharmacyDialog,
  PharmacyDialogActions,
  PharmacyDialogBody,
  RupeeField,
  fieldAria,
} from "./PharmacyDialogParts";
import { dayLabel, formatRupees, todayKey, tomorrowKey, type MedicineRow } from "./pharmacy-inventory.logic";
import {
  RECEIVE_BATCH_DEFAULTS,
  adjustBatchSchema,
  receiveBatchSchema,
  type AdjustBatchValues,
  type ReceiveBatchValues,
} from "./pharmacy-inventory.schemas";
import { dispensableUnits, type BatchRow } from "./pharmacy-stock.logic";

const HEAD_COLUMNS = "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto]";
const ROW_COLUMNS = "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_auto]";

type Mode = { kind: "list" } | { kind: "receive" } | { kind: "adjust"; batchId: string };

export interface PharmacyBatchesDialogProps {
  /** The medicine whose batches are shown; null closes the dialog. */
  medicine: MedicineRow | null;
  /** Open straight on the receive form (the "Receive stock" buttons). */
  startWithReceive?: boolean;
  batches: BatchRow[];
  loading?: boolean;
  loadError?: string | null;
  onRetry?: () => void;
  /** False hides the receive and correct actions (no `MANAGE_INVENTORY` permission). */
  canManage: boolean;
  busy?: boolean;
  errorMessage?: string | null;
  /** Resolves true when the batch was saved. */
  onReceive: (medicine: MedicineRow, values: ReceiveBatchValues) => Promise<boolean>;
  /** Resolves true when the correction was saved. */
  onAdjust: (medicine: MedicineRow, batch: BatchRow, values: AdjustBatchValues) => Promise<boolean>;
  onClose: () => void;
}

/**
 * Batches (lots) of one medicine. Dispensing takes stock from these lots, earliest expiry first,
 * so this is where stock is received and corrected: "Receive stock" adds a lot (for stock that did
 * not come through a purchase order), "Correct" changes the quantity left in one lot and records why.
 */
export function PharmacyBatchesDialog({ medicine, startWithReceive = false, ...rest }: PharmacyBatchesDialogProps) {
  return (
    <PharmacyDialog
      open={medicine !== null}
      onClose={rest.onClose}
      busy={rest.busy}
      title={startWithReceive ? "Receive stock" : "Batches"}
      description="Stock is held in batches. Dispensing takes from the batch that expires first."
      width={720}
    >
      {medicine ? (
        <BatchesBody key={`${medicine.id}-${startWithReceive}`} medicine={medicine} startWithReceive={startWithReceive} {...rest} />
      ) : null}
    </PharmacyDialog>
  );
}

function BatchesBody({
  medicine,
  startWithReceive,
  batches,
  loading = false,
  loadError = null,
  onRetry,
  canManage,
  busy = false,
  errorMessage = null,
  onReceive,
  onAdjust,
  onClose,
}: PharmacyBatchesDialogProps & { medicine: MedicineRow; startWithReceive?: boolean }) {
  const [mode, setMode] = useState<Mode>(startWithReceive && canManage ? { kind: "receive" } : { kind: "list" });
  const toList = () => setMode({ kind: "list" });

  if (mode.kind === "receive") {
    return (
      <ReceiveForm
        medicine={medicine}
        busy={busy}
        errorMessage={errorMessage}
        onBack={toList}
        onSubmit={async (values) => {
          if (await onReceive(medicine, values)) toList();
        }}
      />
    );
  }

  const target = mode.kind === "adjust" ? batches.find((batch) => batch.id === mode.batchId) : undefined;
  if (mode.kind === "adjust" && target) {
    return (
      <AdjustForm
        medicine={medicine}
        batch={target}
        busy={busy}
        errorMessage={errorMessage}
        onBack={toList}
        onSubmit={async (values) => {
          if (await onAdjust(medicine, target, values)) toList();
        }}
      />
    );
  }

  const batchTotal = batches.reduce((sum, batch) => sum + batch.onHand, 0);
  const differs = !loading && !loadError && batchTotal !== medicine.stock;

  return (
    <>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />
        {differs ? (
          <Note tone="amber" icon={CircleAlert}>
            The stock list says {medicine.stock} {medicine.unit} but the batches hold {batchTotal}. Dispensing uses the
            batches. Receive stock or correct a batch to bring them together.
          </Note>
        ) : null}

        {loading ? (
          <div aria-busy="true">
            <SkeletonList items={3} />
          </div>
        ) : loadError ? (
          <EmptyBlock
            icon={CircleAlert}
            title="Batches could not be loaded"
            description={loadError}
            action={
              onRetry ? (
                <Button variant="outline" size="md" onClick={onRetry}>
                  Try again
                </Button>
              ) : undefined
            }
          />
        ) : batches.length === 0 ? (
          <EmptyBlock
            icon={PackagePlus}
            title="No batches in stock"
            description="This medicine cannot be dispensed until stock is received, from a purchase order or with Receive stock."
          />
        ) : (
          <div className="flex flex-col rounded-[14px] border border-line">
            <div
              className={`hidden gap-3 border-b border-hair px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.6px] text-ink-muted sm:grid ${HEAD_COLUMNS}`}
              aria-hidden="true"
            >
              <span>Lot</span>
              <span>Expiry</span>
              <span>Left</span>
              <span>Cost</span>
              <span className="w-[88px]" />
            </div>
            <ul className="m-0 flex list-none flex-col p-0">
              {batches.map((batch) => (
                <li
                  key={batch.id}
                  className={`grid grid-cols-2 items-center gap-x-3 gap-y-1.5 border-b border-hair px-4 py-3 last:border-b-0 ${ROW_COLUMNS}`}
                >
                  <span className="col-span-2 flex min-w-0 flex-col sm:col-span-1">
                    <span className="truncate text-sm font-bold text-ink">{batch.lotNumber}</span>
                    <span className="text-xs text-ink-muted">
                      {batch.manufactureDate ? `Made ${dayLabel(batch.manufactureDate)}` : "Received"}
                    </span>
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span className="text-sm text-ink">{dayLabel(batch.expiryDate)}</span>
                    <Pill tone={batch.tone}>{batch.label}</Pill>
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {batch.onHand}
                    <span className="font-medium text-ink-muted"> of {batch.received}</span>
                  </span>
                  <span className="text-sm text-ink-soft">
                    {batch.costPrice !== null ? formatRupees(batch.costPrice) : "—"}
                  </span>
                  {canManage ? (
                    <Button
                      variant="outline"
                      className="w-[88px] justify-self-end"
                      onClick={() => setMode({ kind: "adjust", batchId: batch.id })}
                      aria-label={`Correct the quantity of lot ${batch.lotNumber}`}
                    >
                      <Pencil aria-hidden="true" />
                      Correct
                    </Button>
                  ) : (
                    <span />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && !loadError && batches.length > 0 ? (
          <p className="m-0 text-xs text-ink-muted">
            {dispensableUnits(batches)} {medicine.unit} can be dispensed now (batches that have not expired).
          </p>
        ) : null}
        <Note tone="blue">
          Stock arrives through a purchase order receipt (Orders tab) or Receive stock here. Use Correct only for damage,
          loss or a counting mistake.
        </Note>
        <DialogError lead="The change was not saved." message={errorMessage} />
      </PharmacyDialogBody>
      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onClose}>
          Close
        </Button>
        {canManage ? (
          <Button size="md" onClick={() => setMode({ kind: "receive" })}>
            <PackagePlus aria-hidden="true" />
            Receive stock
          </Button>
        ) : null}
      </PharmacyDialogActions>
    </>
  );
}

function ReceiveForm({
  medicine,
  busy,
  errorMessage,
  onBack,
  onSubmit,
}: {
  medicine: MedicineRow;
  busy: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (values: ReceiveBatchValues) => Promise<void>;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceiveBatchValues>({
    resolver: zodResolver(receiveBatchSchema),
    defaultValues: RECEIVE_BATCH_DEFAULTS,
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Field label="Lot number" htmlFor={id("lotNumber")} hint="As printed on the pack" error={errors.lotNumber?.message}>
            <Input
              {...register("lotNumber")}
              {...fieldAria(id("lotNumber"), errors.lotNumber?.message)}
              placeholder="LOT-2026-01"
              autoComplete="off"
            />
          </Field>
          <Field label="Quantity received" htmlFor={id("quantity")} error={errors.quantity?.message}>
            <Input
              inputMode="numeric"
              {...register("quantity")}
              {...fieldAria(id("quantity"), errors.quantity?.message)}
              placeholder="100"
              autoComplete="off"
            />
          </Field>
          <Field label="Manufacture date" htmlFor={id("manufactureDate")} error={errors.manufactureDate?.message}>
            <Input
              type="date"
              max={todayKey()}
              {...register("manufactureDate")}
              {...fieldAria(id("manufactureDate"), errors.manufactureDate?.message)}
            />
          </Field>
          <Field label="Expiry date" htmlFor={id("expiryDate")} error={errors.expiryDate?.message}>
            <Input
              type="date"
              min={tomorrowKey()}
              {...register("expiryDate")}
              {...fieldAria(id("expiryDate"), errors.expiryDate?.message)}
            />
          </Field>
          <Field label="Cost per unit (optional)" htmlFor={id("costPrice")} error={errors.costPrice?.message}>
            <RupeeField>
              <Input
                inputMode="decimal"
                {...register("costPrice")}
                {...fieldAria(id("costPrice"), errors.costPrice?.message)}
                placeholder="5.50"
                autoComplete="off"
              />
            </RupeeField>
          </Field>
        </div>
        <Note tone="blue">
          The quantity is added to the stock of {medicine.name} as a new batch. For goods ordered from a supplier, use
          Receive goods on the order instead.
        </Note>
        <DialogError lead="The stock was not received." message={errorMessage} />
      </PharmacyDialogBody>
      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onBack} disabled={busy}>
          <ArrowLeft aria-hidden="true" />
          Back to batches
        </Button>
        <Button size="md" type="submit" disabled={busy}>
          <PackagePlus aria-hidden="true" />
          {busy ? "Receiving…" : "Receive stock"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}

function AdjustForm({
  medicine,
  batch,
  busy,
  errorMessage,
  onBack,
  onSubmit,
}: {
  medicine: MedicineRow;
  batch: BatchRow;
  busy: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onSubmit: (values: AdjustBatchValues) => Promise<void>;
}) {
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdjustBatchValues>({
    resolver: zodResolver(adjustBatchSchema(batch.onHand)),
    defaultValues: { change: "", reason: "" },
    mode: "onTouched",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <PharmacyDialogBody>
        <MedicineSummary medicine={medicine} />
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-hair bg-[#f8fafc] px-3.5 py-3 text-sm dark:bg-white/5">
          <span className="font-extrabold text-ink">Lot {batch.lotNumber}</span>
          <span className="text-ink-muted">
            {batch.onHand} {medicine.unit} left · expires {dayLabel(batch.expiryDate)}
          </span>
          <Pill tone={batch.tone}>{batch.label}</Pill>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)]">
          <Field
            label="Change in units"
            htmlFor={id("change")}
            hint="Use a minus to take units off, such as -3"
            error={errors.change?.message}
          >
            <Input
              inputMode="numeric"
              {...register("change")}
              {...fieldAria(id("change"), errors.change?.message)}
              placeholder="-3"
              autoComplete="off"
            />
          </Field>
          <Field label="Reason" htmlFor={id("reason")} error={errors.reason?.message}>
            <Input
              {...register("reason")}
              {...fieldAria(id("reason"), errors.reason?.message)}
              placeholder="Damaged in storage"
              autoComplete="off"
            />
          </Field>
        </div>
        <Note tone="amber" icon={CircleAlert}>
          A correction is recorded with your name and reason. It is for damage, loss or a counting mistake, not for new
          deliveries.
        </Note>
        <DialogError lead="The correction was not saved." message={errorMessage} />
      </PharmacyDialogBody>
      <PharmacyDialogActions>
        <Button size="md" variant="outline" onClick={onBack} disabled={busy}>
          <ArrowLeft aria-hidden="true" />
          Back to batches
        </Button>
        <Button size="md" type="submit" disabled={busy}>
          <Pencil aria-hidden="true" />
          {busy ? "Saving…" : "Save correction"}
        </Button>
      </PharmacyDialogActions>
    </form>
  );
}
