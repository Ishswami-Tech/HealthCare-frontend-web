"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { Bell, CreditCard, Package, RefreshCcw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChoiceChip,
  DialogError,
  EmptyBlock,
  Field,
  Note,
  Pill,
  SectionTitle,
  StatTile,
  Surface,
  TbdPage,
} from "@/components/tbd";
import { useClinicContext } from "@/hooks/query/useClinics";
import { useMedicines, usePharmacyOrders, useStockBatches, useSuppliers } from "@/hooks/query/usePharmacy";
import { useCreateReorderRule, useReorderEvaluation } from "@/hooks/query/usePharmacyOps";
import { usePharmacyPermissions } from "@/hooks/utils/useRBAC";
import { buildExpiryRows, countByBucket } from "@/lib/pharmacy/pharmacy-ops.logic";
import { sanitizeErrorMessage } from "@/lib/utils/error-handler";
import { textOf, unwrapRecords } from "@/lib/utils/coerce";
import {
  buildInventoryOverview,
  buildOrders,
  supplierNameMap,
} from "@/app/(dashboard)/pharmacy/_components/pharmacy-inventory.logic";

type RuleMode = "FIXED_QTY" | "MIN_MAX";

const wholeNumber = (label: string) => z.number({ error: `Enter ${label}.` }).int(`${label} must be a whole number.`).min(0);
const ruleSchema = z
  .object({
    productId: z.string().min(1, "Choose a medicine."),
    reorderPoint: wholeNumber("the reorder level"),
    amount: wholeNumber("the quantity").min(1, "At least 1."),
    mode: z.enum(["FIXED_QTY", "MIN_MAX"]),
  })
  .refine((rule) => rule.mode !== "MIN_MAX" || rule.amount > rule.reorderPoint, {
    path: ["amount"],
    message: "The maximum level must be above the reorder level.",
  });

const toNumber = (value: string) => (value.trim() === "" ? Number.NaN : Number(value));

/**
 * PhInventoryAlertSettings: what needs attention right now, and the reorder rules that decide when a
 * medicine is ordered again. Alerts follow each medicine's own minimum level (edited on the medicine
 * in the inventory). Clinic-wide alert channels, delivery and payment gateway settings have no API yet.
 */
export function PharmacyAlertSettingsContent() {
  const { clinicId } = useClinicContext();
  const scopedClinicId = clinicId || "";
  const { canManageInventory } = usePharmacyPermissions();

  const { data: medicinesData } = useMedicines(scopedClinicId, { limit: 500 });
  const { data: suppliersData } = useSuppliers();
  const { data: batches } = useStockBatches(scopedClinicId);
  const { data: ordersData } = usePharmacyOrders(scopedClinicId, { limit: 50 });
  const evaluationQuery = useReorderEvaluation(scopedClinicId);
  const createRule = useCreateReorderRule();

  const supplierNames = useMemo(() => supplierNameMap(suppliersData), [suppliersData]);
  const overview = useMemo(() => buildInventoryOverview(medicinesData ?? [], supplierNames), [medicinesData, supplierNames]);
  const names = useMemo(() => new Map(overview.rows.map((row) => [row.id, row.name])), [overview.rows]);
  const expiry = countByBucket(buildExpiryRows(batches, names));
  const openOrders = (buildOrders(ordersData, overview.rows, supplierNames) ?? []).filter((order) => order.canReceive).length;
  const outOfStock = overview.lowStock.filter((row) => row.status === "out_of_stock").length;
  const suppliers = useMemo(
    // One choice per name (the rule stores the name): two suppliers with the same name would
    // otherwise repeat a React key.
    () => [...new Set(unwrapRecords(suppliersData, "suppliers", "data").map((row) => textOf(row.name)).filter(Boolean))],
    [suppliersData],
  );

  const [productId, setProductId] = useState("");
  const [reorderPoint, setReorderPoint] = useState("");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<RuleMode>("MIN_MAX");
  const [supplier, setSupplier] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  const chosen = overview.rows.find((row) => row.id === productId);
  const chooseMedicine = (id: string) => {
    setProductId(id);
    const row = overview.rows.find((entry) => entry.id === id);
    if (row && reorderPoint === "") setReorderPoint(String(row.minStock || ""));
    if (row && amount === "" && row.maxStock > 0) setAmount(String(row.maxStock));
    if (row && supplier === "" && row.supplierName) setSupplier(row.supplierName);
  };

  const saveRule = () => {
    setSaveError(null);
    const parsed = ruleSchema.safeParse({ productId, reorderPoint: toNumber(reorderPoint), amount: toNumber(amount), mode });
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])));
      return;
    }
    setErrors({});
    const rule = parsed.data;
    createRule
      .mutateAsync({
        productId: rule.productId,
        strategy: rule.mode,
        reorderPoint: rule.reorderPoint,
        ...(rule.mode === "FIXED_QTY" ? { orderQuantity: rule.amount } : { minLevel: rule.reorderPoint, maxLevel: rule.amount }),
        ...(supplier ? { preferredSupplier: supplier } : {}),
      })
      .then(() => {
        setProductId("");
        setReorderPoint("");
        setAmount("");
        setSupplier("");
      })
      .catch((error: unknown) => setSaveError(sanitizeErrorMessage(error)));
  };

  const suggestions = evaluationQuery.data ?? [];

  return (
    <TbdPage
      title="Stock alert and reorder settings"
      description="When the counter is warned about low and expiring stock, and when medicines are ordered again."
      backHref="/pharmacy/settings"
      backLabel="Inventory settings"
    >
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Surface as="section" aria-label="Stock alert thresholds">
            <SectionTitle icon={Bell} title="Stock alert thresholds" description="When to warn about low stock and expiry" />
            <Note tone="blue">
              A low-stock alert is raised when a medicine reaches its own minimum level, and an expiry alert 90 days before a
              batch expires. Change a medicine&apos;s minimum level on the medicine in the inventory.
            </Note>
            <Button asChild variant="outline" className="self-start">
              <Link href="/pharmacy?filter=low">Review low-stock medicines</Link>
            </Button>
          </Surface>

          <Surface as="section" aria-label="Auto reorder" id="reorder">
            <SectionTitle icon={RefreshCcw} title="Auto reorder" description="Order again when a medicine reaches its reorder level" />
            {canManageInventory ? (
              <div className="flex flex-col gap-4">
                <Field label="Medicine" htmlFor="rule-medicine" required error={errors.productId}>
                  <Select value={productId} onValueChange={chooseMedicine}>
                    <SelectTrigger id="rule-medicine" className="w-full">
                      <SelectValue placeholder="Choose a medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {overview.rows.map((row) => (
                        <SelectItem key={row.id} value={row.id}>
                          {row.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Order quantity">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Order quantity">
                    <ChoiceChip active={mode === "MIN_MAX"} onClick={() => setMode("MIN_MAX")}>
                      Top up to a maximum level
                    </ChoiceChip>
                    <ChoiceChip active={mode === "FIXED_QTY"} onClick={() => setMode("FIXED_QTY")}>
                      A fixed quantity
                    </ChoiceChip>
                  </div>
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Reorder when stock reaches"
                    htmlFor="rule-point"
                    required
                    error={errors.reorderPoint}
                    hint={chosen ? `Now ${chosen.stock} ${chosen.unit}, minimum ${chosen.minStock}` : undefined}
                  >
                    <Input id="rule-point" inputMode="numeric" value={reorderPoint} onChange={(event) => setReorderPoint(event.target.value)} />
                  </Field>
                  <Field
                    label={mode === "MIN_MAX" ? "Maximum level" : "Units to order"}
                    htmlFor="rule-amount"
                    required
                    error={errors.amount}
                  >
                    <Input id="rule-amount" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} />
                  </Field>
                </div>
                {suppliers.length > 0 ? (
                  <Field label="Preferred supplier" htmlFor="rule-supplier">
                    <Select value={supplier} onValueChange={setSupplier}>
                      <SelectTrigger id="rule-supplier" className="w-full">
                        <SelectValue placeholder="Any supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                ) : null}
                <DialogError message={saveError} />
                <Button className="self-start" size="md" disabled={createRule.isPending} onClick={saveRule}>
                  {createRule.isPending ? "Saving…" : "Save reorder rule"}
                </Button>
              </div>
            ) : (
              <p className="m-0 text-[13px] text-ink-muted">Only the pharmacist and the clinic admin can change reorder rules.</p>
            )}

            <div className="flex flex-col gap-2 border-t border-hair pt-4">
              <h3 className="m-0 text-sm font-bold text-ink">Would be ordered now</h3>
              {evaluationQuery.isPending && !evaluationQuery.data ? (
                <p className="m-0 text-[13px] text-ink-muted">Checking the rules…</p>
              ) : suggestions.length === 0 ? (
                <EmptyBlock icon={Package} title="Nothing to order" description="No medicine with a rule is at its reorder level." className="py-6" />
              ) : (
                <ul className="m-0 flex list-none flex-col p-0">
                  {suggestions.map((row) => (
                    <li key={`${row.ruleId || ""}:${row.productId}`} className="flex items-center justify-between gap-3 border-b border-hair py-2.5 last:border-b-0">
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm font-bold text-ink">{names.get(row.productId) || "Medicine"}</span>
                        <span className="text-xs text-ink-muted">
                          {row.currentStock} in stock · reorder at {row.reorderPoint}
                          {row.preferredSupplier ? ` · ${row.preferredSupplier}` : ""}
                        </span>
                      </span>
                      <Pill tone="blue">{row.suggestedQuantity ? `Order ${row.suggestedQuantity}` : "Order"}</Pill>
                    </li>
                  ))}
                </ul>
              )}
              <Button asChild variant="outline" className="self-start">
                <Link href="/pharmacy#orders">Open orders</Link>
              </Button>
            </div>
          </Surface>

          <Surface as="section" aria-label="Delivery and payments">
            <SectionTitle icon={Truck} title="Delivery and payment gateway" />
            <div className="flex items-center gap-3 text-[13px] text-ink-muted">
              <CreditCard className="size-4 shrink-0" aria-hidden="true" />
              Delivery partners, charges and the payment gateway are set up by the clinic admin with support. They cannot be changed here yet.
            </div>
          </Surface>
        </div>

        <Surface as="aside" aria-label="Right now">
          <SectionTitle title="Right now" />
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile value={overview.lowStock.length - outOfStock} label="Below minimum" tone="amber" href="/pharmacy?filter=low" className="shadow-none ring-1 ring-hair" />
            <StatTile value={outOfStock} label="Out of stock" tone="rose" className="shadow-none ring-1 ring-hair" />
            <StatTile value={expiry.within30 + expiry.within90} label="Batches expiring in 90 days" tone="amber" href="/pharmacy/expiry" className="shadow-none ring-1 ring-hair" />
            <StatTile value={openOrders} label="Open orders" tone="blue" className="shadow-none ring-1 ring-hair" />
          </div>
        </Surface>
      </div>
    </TbdPage>
  );
}
